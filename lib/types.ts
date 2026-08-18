export type Source = "tmdb" | "bangumi";

export type MediaType = "movie" | "tv" | "anime";

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: "电影",
  tv: "电视剧",
  anime: "番剧",
};

export interface CastMember {
  name: string;
  /** 饰演角色（真人）/ 配音角色（声优） */
  character: string | null;
  /** 人物详情页链接（Bangumi / TMDB） */
  url: string | null;
}

/** Normalized shape returned by both TMDB and Bangumi clients. */
export interface WorkSummary {
  source: Source;
  sourceId: string;
  title: string;
  originalTitle: string | null;
  type: MediaType;
  coverUrl: string | null;
  /** Director / author / creator, best effort. */
  creator: string | null;
  year: string | null;
  /** 0-10 scale. */
  externalRating: number | null;
  episodes: number | null;
  synopsis: string | null;
  /** 类型标签，如 ["剧情", "恐怖"] */
  genres: string[];
  /** 主演（真人影视）/ 声优（动漫） */
  cast: CastMember[];
}

export type ReviewStatus = "plan" | "watching" | "completed";

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  plan: "想看",
  watching: "在看",
  completed: "看过",
};

export interface ReviewWithWork {
  reviewId: number;
  status: ReviewStatus;
  myRating: number | null;
  comment: string | null;
  watchedAt: string | null;
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
