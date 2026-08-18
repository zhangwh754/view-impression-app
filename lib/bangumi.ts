import "./proxy";
import type { CastMember, WorkSummary } from "./types";

const BGM_BASE = "https://api.bgm.tv";

// Bangumi requires a User-Agent in the documented format:
// {developer_id}/{app_name}[/{version}] — generic UAs are blocked.
const HEADERS = {
  "User-Agent": "zhangwh754/view-impression-app/0.1",
  "Content-Type": "application/json",
};

interface BgmImages {
  large?: string;
  common?: string;
  medium?: string;
}

interface BgmSearchItem {
  id: number;
  name: string;
  name_cn?: string;
  type: number;
  date?: string;
  images?: BgmImages;
  score?: number;
  summary?: string;
}

interface BgmInfoboxEntry {
  key: string;
  value: unknown;
}

interface BgmSubject {
  id: number;
  name: string;
  name_cn?: string;
  type: number;
  date?: string;
  images?: BgmImages;
  rating?: { score?: number };
  summary?: string;
  eps?: number;
  total_episodes?: number;
  infobox?: BgmInfoboxEntry[];
  /** 官方整理的标签（比 tags 用户标签更干净） */
  meta_tags?: string[];
  tags?: { name: string; count?: number }[];
}

interface BgmCharacter {
  id: number;
  name: string;
  relation?: string; // "主角" | "配角" | "客串"
  actors?: { id: number; name: string }[];
}

function mediaType(bgmType: number): "anime" | "tv" {
  // 2 = 动画, 6 = 三次元 (日剧/真人剧)
  return bgmType === 6 ? "tv" : "anime";
}

function infoboxText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((v) =>
        typeof v === "object" && v !== null && "v" in v
          ? String((v as { v: unknown }).v)
          : String(v),
      )
      .join("、");
  }
  return String(value ?? "");
}

function pickCreator(infobox?: BgmInfoboxEntry[]): string | null {
  if (!infobox) return null;
  for (const key of ["导演", "原作", "原作者", "编剧"]) {
    const entry = infobox.find((e) => e.key === key);
    if (entry) {
      const text = infoboxText(entry.value).trim();
      if (text) return text;
    }
  }
  return null;
}

export async function searchBangumi(query: string): Promise<WorkSummary[]> {
  const res = await fetch(`${BGM_BASE}/v0/search/subjects?limit=8`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      keyword: query,
      // 2 = 动画, 6 = 三次元
      filter: { type: [2, 6] },
    }),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Bangumi search failed: ${res.status}`);
  const data = (await res.json()) as { data?: BgmSearchItem[] };

  return (data.data ?? []).map((item) => ({
    source: "bangumi" as const,
    sourceId: String(item.id),
    title: item.name_cn || item.name,
    originalTitle: item.name_cn ? item.name : null,
    type: mediaType(item.type),
    coverUrl: item.images?.large ?? item.images?.common ?? null,
    creator: null,
    year: (item.date ?? "").slice(0, 4) || null,
    externalRating:
      item.score && item.score > 0 ? Math.round(item.score * 10) / 10 : null,
    episodes: null,
    synopsis: item.summary || null,
    genres: [],
    cast: [],
  }));
}

/** 主角/配角的声优，最多 8 位；角色接口失败时降级为空数组。 */
async function getBangumiCast(sourceId: string): Promise<CastMember[]> {
  try {
    const res = await fetch(`${BGM_BASE}/v0/subjects/${sourceId}/characters`, {
      headers: HEADERS,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const characters = (await res.json()) as BgmCharacter[];

    const order = (c: BgmCharacter) =>
      c.relation === "主角" ? 0 : c.relation === "配角" ? 1 : 2;
    return characters
      .slice()
      .sort((a, b) => order(a) - order(b))
      .flatMap((c) =>
        (c.actors ?? []).slice(0, 1).map((a) => ({
          name: a.name,
          character: c.name,
          url: `https://bgm.tv/person/${a.id}`,
        })),
      )
      .slice(0, 8);
  } catch {
    return [];
  }
}

// meta_tags 里混入的地区/媒介噪声，过滤后更接近"类型"语义
const GENRE_NOISE = new Set(["TV", "日本", "中国", "欧美", "韩国", "美国"]);

function pickGenres(s: BgmSubject): string[] {
  const raw =
    s.meta_tags && s.meta_tags.length > 0
      ? s.meta_tags
      : (s.tags ?? [])
          .slice()
          .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
          .map((t) => t.name);
  return raw.filter((t) => !GENRE_NOISE.has(t)).slice(0, 6);
}

export async function getBangumiDetail(sourceId: string): Promise<WorkSummary> {
  const [subjectRes, cast] = await Promise.all([
    fetch(`${BGM_BASE}/v0/subjects/${sourceId}`, {
      headers: HEADERS,
      next: { revalidate: 86400 },
    }),
    getBangumiCast(sourceId),
  ]);
  if (!subjectRes.ok)
    throw new Error(`Bangumi detail failed: ${subjectRes.status}`);
  const s = (await subjectRes.json()) as BgmSubject;

  return {
    source: "bangumi",
    sourceId: String(s.id),
    title: s.name_cn || s.name,
    originalTitle: s.name_cn ? s.name : null,
    type: mediaType(s.type),
    coverUrl: s.images?.large ?? s.images?.common ?? null,
    creator: pickCreator(s.infobox),
    year: (s.date ?? "").slice(0, 4) || null,
    externalRating:
      s.rating?.score && s.rating.score > 0
        ? Math.round(s.rating.score * 10) / 10
        : null,
    episodes: s.eps || s.total_episodes || null,
    synopsis: s.summary || null,
    genres: pickGenres(s),
    cast,
  };
}
