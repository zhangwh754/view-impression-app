import "./proxy";
import type { WorkSummary } from "./types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

// TMDB issues two credentials: a v3 API key (sent as ?api_key=) and a v4
// Read Access Token (a JWT starting with "eyJ", sent as a Bearer header).
// Support both transparently — people often paste the v4 token.
function tmdbAuth(url: URL): Record<string, string> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("Missing TMDB_API_KEY env var");
  if (key.startsWith("eyJ")) return { Authorization: `Bearer ${key}` };
  url.searchParams.set("api_key", key);
  return {};
}

function cover(posterPath: string | null): string | null {
  return posterPath ? `${TMDB_IMAGE}${posterPath}` : null;
}

function round1(n: number | undefined | null): number | null {
  return n && n > 0 ? Math.round(n * 10) / 10 : null;
}

interface TmdbMultiResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
}

export async function searchTmdb(query: string): Promise<WorkSummary[]> {
  const url = new URL(`${TMDB_BASE}/search/multi`);
  const headers = tmdbAuth(url);
  url.searchParams.set("language", "zh-CN");
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");

  const res = await fetch(url, { headers, next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);
  const data = (await res.json()) as { results?: TmdbMultiResult[] };

  return (data.results ?? [])
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 8)
    .map((r) => ({
      source: "tmdb" as const,
      sourceId: `${r.media_type}-${r.id}`,
      title: r.title ?? r.name ?? "",
      originalTitle: r.original_title ?? r.original_name ?? null,
      type: r.media_type === "movie" ? ("movie" as const) : ("tv" as const),
      coverUrl: cover(r.poster_path),
      creator: null,
      year: (r.release_date ?? r.first_air_date ?? "").slice(0, 4) || null,
      externalRating: round1(r.vote_average),
      episodes: null,
      synopsis: r.overview || null,
      genres: [],
      cast: [],
    }));
}

interface TmdbCredits {
  crew?: { job: string; name: string }[];
  cast?: { id: number; name: string; character?: string; order?: number }[];
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovieDetail {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  release_date?: string;
  vote_average?: number;
  overview?: string;
  genres?: TmdbGenre[];
  credits?: TmdbCredits;
}

interface TmdbTvDetail {
  id: number;
  name: string;
  original_name: string;
  poster_path: string | null;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
  number_of_episodes?: number;
  created_by?: { name: string }[];
  genres?: TmdbGenre[];
  credits?: TmdbCredits;
}

/** sourceId has the form "movie-123" or "tv-456". */
export async function getTmdbDetail(sourceId: string): Promise<WorkSummary> {
  const [mediaType, id] = sourceId.split("-");
  if ((mediaType !== "movie" && mediaType !== "tv") || !id) {
    throw new Error(`Invalid TMDB sourceId: ${sourceId}`);
  }

  const url = new URL(`${TMDB_BASE}/${mediaType}/${id}`);
  const headers = tmdbAuth(url);
  url.searchParams.set("language", "zh-CN");
  url.searchParams.set("append_to_response", "credits");

  const res = await fetch(url, { headers, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`TMDB detail failed: ${res.status}`);
  const data = (await res.json()) as TmdbMovieDetail & TmdbTvDetail;

  const directors =
    data.credits?.crew?.filter((c) => c.job === "Director").map((c) => c.name) ??
    [];
  const creator =
    mediaType === "movie"
      ? directors.join("、") || null
      : data.created_by?.map((c) => c.name).join("、") ||
        directors.join("、") ||
        null;

  return {
    source: "tmdb",
    sourceId,
    title: data.title ?? data.name ?? "",
    originalTitle: data.original_title ?? data.original_name ?? null,
    type: mediaType === "movie" ? "movie" : "tv",
    coverUrl: cover(data.poster_path),
    creator,
    year: (data.release_date ?? data.first_air_date ?? "").slice(0, 4) || null,
    externalRating: round1(data.vote_average),
    episodes: mediaType === "tv" ? (data.number_of_episodes ?? null) : null,
    synopsis: data.overview || null,
    genres: (data.genres ?? []).map((g) => g.name),
    cast: (data.credits?.cast ?? [])
      .slice()
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
      .slice(0, 8)
      .map((c) => ({
        name: c.name,
        character: c.character || null,
        url: `https://www.themoviedb.org/person/${c.id}`,
      })),
  };
}
