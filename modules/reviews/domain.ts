import type { CastMember, MediaType } from "@/modules/catalog/domain";

export type ReviewSort = "rating" | "watched" | "updated" | "work-year";

export interface ReviewDraft {
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
