import "server-only";

import { getCatalogWork } from "@/modules/catalog/service";
import type { CatalogSource } from "@/modules/catalog/domain";
import type { ReviewDraft, ReviewWithWork } from "@/modules/reviews/domain";
import {
  deleteReviewRecord,
  findLatestReviewByWorkId,
  listReviewRecords,
  saveReviewWithWork,
  updateReviewRecord,
} from "@/modules/reviews/repository";

export async function createReviewFromCatalog(input: {
  source: CatalogSource;
  sourceId: string;
  review: ReviewDraft;
}): Promise<{ reviewId: number; workId: number }> {
  const work = await getCatalogWork(input.source, input.sourceId);
  const saved = await saveReviewWithWork(work, input.review);
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

export function getReviewByWorkId(
  workId: number,
): Promise<ReviewWithWork | null> {
  return findLatestReviewByWorkId(workId);
}
