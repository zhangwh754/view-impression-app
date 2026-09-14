"use server";

import { isOwner } from "@/auth";
import type { CatalogSource } from "@/modules/catalog/domain";
import {
  createReviewFromCatalog,
  DuplicateReviewError,
  getReviewByWorkId,
} from "@/modules/reviews/service";
import type {
  ShowcaseCatalogReference,
  ShowcaseSaveInput,
  ShowcaseWorkOption,
} from "@/modules/showcase/domain";
import {
  saveShowcase,
  ShowcaseValidationError,
} from "@/modules/showcase/service";
import { revalidatePath } from "next/cache";

export interface SaveShowcaseState {
  ok: boolean;
  message: string;
}

export interface AddCatalogWorkState {
  ok: boolean;
  message: string;
  work?: ShowcaseWorkOption;
  catalogReference?: ShowcaseCatalogReference;
}

export async function addCatalogWorkToReviews(input: {
  source: CatalogSource;
  sourceId: string;
  rating: number;
}): Promise<AddCatalogWorkState> {
  if (!(await isOwner())) {
    return { ok: false, message: "未授权，无法添加观后感。" };
  }
  if (
    (input.source !== "tmdb" && input.source !== "bangumi") ||
    !input.sourceId ||
    input.sourceId.length > 100 ||
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 10
  ) {
    return { ok: false, message: "作品或评分无效。" };
  }

  try {
    const saved = await createReviewFromCatalog({
      source: input.source,
      sourceId: input.sourceId,
      review: {
        myRating: input.rating,
        comment: null,
        watchedAt: null,
      },
    });
    const review = await getReviewByWorkId(saved.workId);
    if (!review) throw new Error("Saved review could not be loaded");

    revalidatePath("/");
    revalidatePath("/showcase");
    return {
      ok: true,
      message: "已添加到观后感，并选入当前分类。",
      work: {
        id: review.work.id,
        title: review.work.title,
        originalTitle: review.work.originalTitle,
        coverUrl: review.work.coverUrl,
        type: review.work.type,
        year: review.work.year,
        myRating: review.myRating,
        updatedAt: review.updatedAt,
        genres: review.work.genres,
      },
      catalogReference: {
        workId: review.work.id,
        source: input.source,
        sourceId: input.sourceId,
      },
    };
  } catch (error) {
    if (error instanceof DuplicateReviewError) {
      return {
        ok: false,
        message: "这部作品已经在观后感中，请从“我的观影”选择。",
      };
    }
    console.error("Failed to add catalog work from showcase", error);
    return { ok: false, message: "添加失败，请稍后重试。" };
  }
}

export async function saveShowcaseAction(
  input: ShowcaseSaveInput,
): Promise<SaveShowcaseState> {
  if (!(await isOwner())) {
    return { ok: false, message: "未授权，无法保存。" };
  }

  try {
    await saveShowcase(input);
    revalidatePath("/showcase");
    return { ok: true, message: "已保存。" };
  } catch (error) {
    if (error instanceof ShowcaseValidationError) {
      return { ok: false, message: error.message };
    }
    console.error("Failed to save showcase", error);
    return { ok: false, message: "保存失败，请稍后重试。" };
  }
}
