import { searchBangumi } from "@/lib/bangumi";
import { searchTmdb } from "@/lib/tmdb";
import type { WorkSummary } from "@/lib/types";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return Response.json({ results: [] });

  // Query both sources in parallel; a failure in one must not kill the other.
  const [tmdb, bangumi] = await Promise.allSettled([
    searchTmdb(q),
    searchBangumi(q),
  ]);

  const results: WorkSummary[] = [
    ...(bangumi.status === "fulfilled" ? bangumi.value : []),
    ...(tmdb.status === "fulfilled" ? tmdb.value : []),
  ];

  const errors = [
    bangumi.status === "rejected" ? `Bangumi: ${bangumi.reason}` : null,
    tmdb.status === "rejected" ? `TMDB: ${tmdb.reason}` : null,
  ].filter(Boolean);

  return Response.json({ results, errors });
}
