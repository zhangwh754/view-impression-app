import "server-only";

import { getCatalogWork } from "@/modules/catalog/service";
import type { CatalogSource } from "@/modules/catalog/domain";
import type { ReviewDraft, ReviewWithWork } from "@/modules/reviews/domain";
import {
  deleteReviewRecord,
  findLatestReviewByWorkId,
  hasReviewForCatalogWork,
  listReviewRecords,
  listReviewedCatalogReferences,
  saveReviewWithWork,
  updateReviewRecord,
} from "@/modules/reviews/repository";

export class DuplicateReviewError extends Error {
  constructor() {
    super("A review for this work already exists");
    this.name = "DuplicateReviewError";
  }
}

function isDuplicateConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function createReviewFromCatalog(input: {
  source: CatalogSource;
  sourceId: string;
  review: ReviewDraft;
}): Promise<{ reviewId: number; workId: number }> {
  if (await hasReviewForCatalogWork(input.source, input.sourceId)) {
    throw new DuplicateReviewError();
  }

  const work = await getCatalogWork(input.source, input.sourceId);
  let saved;
  try {
    saved = await saveReviewWithWork(work, input.review);
  } catch (error) {
    if (isDuplicateConstraintError(error)) throw new DuplicateReviewError();
    throw error;
  }
  if (!saved) throw new DuplicateReviewError();
  return { reviewId: saved.review_id, workId: saved.work_id };
}

export async function updateReview(
  reviewId: number,
  review: ReviewDraft,
): Promise<void> {
  if (!(await updateReviewRecord(reviewId, review))) {
    throw new Error("Review not found");
  }
}

export async function deleteReview(reviewId: number): Promise<void> {
  if (!(await deleteReviewRecord(reviewId))) {
    throw new Error("Review not found");
  }
}

export function listReviews(): Promise<ReviewWithWork[]> {
  return listReviewRecords();
}

export function listReviewedWorks() {
  return listReviewedCatalogReferences();
}

export function getReviewByWorkId(
  workId: number,
): Promise<ReviewWithWork | null> {
  return findLatestReviewByWorkId(workId);
}
