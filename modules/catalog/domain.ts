export type CatalogSource = "tmdb" | "bangumi";

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

/** 外部目录提供方返回的统一作品模型。 */
export interface CatalogWork {
  source: CatalogSource;
  sourceId: string;
  title: string;
  originalTitle: string | null;
  type: MediaType;
  coverUrl: string | null;
  /** 导演、作者或主创，尽力获取。 */
  creator: string | null;
  year: string | null;
  /** 0-10 分制。 */
  externalRating: number | null;
  episodes: number | null;
  synopsis: string | null;
  genres: string[];
  cast: CastMember[];
}

export interface CatalogProvider {
  readonly source: CatalogSource;
  readonly displayName: string;
  search(query: string): Promise<CatalogWork[]>;
  getDetail(sourceId: string): Promise<CatalogWork>;
}
