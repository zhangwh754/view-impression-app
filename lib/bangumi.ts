import "./proxy";
import type { WorkSummary } from "./types";

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
  }));
}

export async function getBangumiDetail(sourceId: string): Promise<WorkSummary> {
  const res = await fetch(`${BGM_BASE}/v0/subjects/${sourceId}`, {
    headers: HEADERS,
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Bangumi detail failed: ${res.status}`);
  const s = (await res.json()) as BgmSubject;

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
  };
}
