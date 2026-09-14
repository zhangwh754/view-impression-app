import "server-only";

import { listReviewedWorks } from "@/modules/reviews/service";
import {
  SHOWCASE_MAX_LABEL_LENGTH,
  SHOWCASE_MAX_SLOTS,
  SHOWCASE_MAX_TITLE_LENGTH,
  type Showcase,
  type ShowcaseSaveInput,
} from "@/modules/showcase/domain";
import {
  getShowcaseRecord,
  replaceShowcaseRecord,
} from "@/modules/showcase/repository";

export class ShowcaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShowcaseValidationError";
  }
}

function characterCount(value: string): number {
  return Array.from(value).length;
}

export function getShowcase(): Promise<Showcase> {
  return getShowcaseRecord();
}

export async function saveShowcase(input: ShowcaseSaveInput): Promise<void> {
  const title = input.title.trim();
  if (!title || characterCount(title) > SHOWCASE_MAX_TITLE_LENGTH) {
    throw new ShowcaseValidationError(
      `主标题需为 1–${SHOWCASE_MAX_TITLE_LENGTH} 个字符。`,
    );
  }
  if (!Array.isArray(input.slots) || input.slots.length > SHOWCASE_MAX_SLOTS) {
    throw new ShowcaseValidationError(
      `分类数量不能超过 ${SHOWCASE_MAX_SLOTS} 个。`,
    );
  }

  const normalizedSlots = input.slots.map((slot) => {
    const label = slot.label.trim();
    if (!label || characterCount(label) > SHOWCASE_MAX_LABEL_LENGTH) {
      throw new ShowcaseValidationError(
        `每个分类名需为 1–${SHOWCASE_MAX_LABEL_LENGTH} 个字符。`,
      );
    }
    const workId = slot.workId;
    if (
      workId !== null &&
      (!Number.isSafeInteger(workId) || workId <= 0)
    ) {
      throw new ShowcaseValidationError("选择的作品无效。");
    }
    return { label, workId };
  });

  const reviewedWorkIds = new Set(
    (await listReviewedWorks()).map((work) => work.workId),
  );
  if (
    normalizedSlots.some(
      (slot) => slot.workId !== null && !reviewedWorkIds.has(slot.workId),
    )
  ) {
    throw new ShowcaseValidationError("只能选择已记录的观影作品。");
  }

  await replaceShowcaseRecord({ title, slots: normalizedSlots });
}
