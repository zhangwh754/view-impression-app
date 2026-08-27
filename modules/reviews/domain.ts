import type { CastMember, MediaType } from "@/modules/catalog/domain";

export type ReviewStatus = "plan" | "watching" | "completed";

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  plan: "想看",
  watching: "在看",
  completed: "看过",
};

export interface ReviewDraft {
  status: ReviewStatus;
  myRating: number | null;
  comment: string | null;
  watchedAt: string | null;
}

export interface ReviewWithWork extends ReviewDraft {
  reviewId: number;
  updatedAt: string;
  work: {
    id: number;
    title: string;
    originalTitle: string | null;
    type: MediaType;
    coverUrl: string | null;
    creator: string | null;
    year: string | null;
    externalRating: number | null;
    episodes: number | null;
    synopsis: string | null;
    genres: string[];
    cast: CastMember[];
  };
}
