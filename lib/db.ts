import { neonConfig } from "@neondatabase/serverless";
import { sql } from "@vercel/postgres";
import { proxyEnabled } from "./proxy";
import type {
  CastMember,
  MediaType,
  ReviewStatus,
  ReviewWithWork,
  WorkSummary,
} from "./types";

// Neon pool queries use WebSockets by default, which bypass the proxy set in
// lib/proxy.ts. With a proxy configured, run queries over fetch (HTTP) so
// they go through the global dispatcher like everything else.
if (proxyEnabled) {
  neonConfig.poolQueryViaFetch = true;
}

// Tables are created lazily on first use so the app works on a fresh database.
let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS works (
        id SERIAL PRIMARY KEY,
        source VARCHAR(20) NOT NULL,
        source_id VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        original_title TEXT,
        type VARCHAR(20) NOT NULL,
        cover_url TEXT,
        creator TEXT,
        year VARCHAR(10),
        external_rating REAL,
        episodes INTEGER,
        synopsis TEXT,
        genres TEXT,
        cast_members TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (source, source_id)
      )
    `;
    // 已存在的库补充新列（幂等）
    await sql`ALTER TABLE works ADD COLUMN IF NOT EXISTS genres TEXT`;
    await sql`ALTER TABLE works ADD COLUMN IF NOT EXISTS cast_members TEXT`;
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        work_id INTEGER NOT NULL REFERENCES works (id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'completed',
        my_rating REAL,
        comment TEXT,
        watched_at DATE,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `;
  })();
  return schemaReady;
}

/** Insert the work if new, otherwise return the existing row's id. */
export async function upsertWork(work: WorkSummary): Promise<number> {
  await ensureSchema();
  const { rows } = await sql`
    INSERT INTO works (
      source, source_id, title, original_title, type, cover_url,
      creator, year, external_rating, episodes, synopsis, genres, cast_members
    ) VALUES (
      ${work.source}, ${work.sourceId}, ${work.title}, ${work.originalTitle},
      ${work.type}, ${work.coverUrl}, ${work.creator}, ${work.year},
      ${work.externalRating}, ${work.episodes}, ${work.synopsis},
      ${JSON.stringify(work.genres)}, ${JSON.stringify(work.cast)}
    )
    ON CONFLICT (source, source_id) DO UPDATE SET
      title = EXCLUDED.title,
      original_title = EXCLUDED.original_title,
      cover_url = EXCLUDED.cover_url,
      creator = EXCLUDED.creator,
      external_rating = EXCLUDED.external_rating,
      episodes = EXCLUDED.episodes,
      synopsis = EXCLUDED.synopsis,
      genres = EXCLUDED.genres,
      cast_members = EXCLUDED.cast_members
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function createReview(input: {
  workId: number;
  status: ReviewStatus;
  myRating: number | null;
  comment: string | null;
  watchedAt: string | null;
}): Promise<number> {
  await ensureSchema();
  const { rows } = await sql`
    INSERT INTO reviews (work_id, status, my_rating, comment, watched_at)
    VALUES (
      ${input.workId}, ${input.status}, ${input.myRating}, ${input.comment},
      ${input.watchedAt}
    )
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function updateReview(input: {
  reviewId: number;
  status: ReviewStatus;
  myRating: number | null;
  comment: string | null;
  watchedAt: string | null;
}): Promise<void> {
  await ensureSchema();
  await sql`
    UPDATE reviews
    SET status = ${input.status},
        my_rating = ${input.myRating},
        comment = ${input.comment},
        watched_at = ${input.watchedAt},
        updated_at = now()
    WHERE id = ${input.reviewId}
  `;
}

export async function deleteReview(reviewId: number): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM reviews WHERE id = ${reviewId}`;
}

interface ReviewRow {
  review_id: number;
  status: ReviewStatus;
  my_rating: number | null;
  comment: string | null;
  watched_at: string | null;
  updated_at: string;
  work_id: number;
  title: string;
  original_title: string | null;
  type: MediaType;
  cover_url: string | null;
  creator: string | null;
  year: string | null;
  external_rating: number | null;
  episodes: number | null;
  synopsis: string | null;
  genres: string | null;
  cast_members: string | null;
}

function parseJsonArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toReviewWithWork(row: ReviewRow): ReviewWithWork {
  return {
    reviewId: row.review_id,
    status: row.status,
    myRating: row.my_rating,
    comment: row.comment,
    watchedAt: row.watched_at ? String(row.watched_at).slice(0, 10) : null,
    updatedAt: String(row.updated_at),
    work: {
      id: row.work_id,
      title: row.title,
      originalTitle: row.original_title,
      type: row.type,
      coverUrl: row.cover_url,
      creator: row.creator,
      year: row.year,
      externalRating: row.external_rating,
      episodes: row.episodes,
      synopsis: row.synopsis,
      genres: parseJsonArray<string>(row.genres),
      cast: parseJsonArray<CastMember>(row.cast_members),
    },
  };
}

const REVIEW_SELECT = `
  SELECT r.id AS review_id, r.status, r.my_rating, r.comment, r.watched_at,
         r.updated_at, w.id AS work_id, w.title, w.original_title, w.type,
         w.cover_url, w.creator, w.year, w.external_rating, w.episodes,
         w.synopsis, w.genres, w.cast_members
  FROM reviews r
  JOIN works w ON w.id = r.work_id
`;

export async function listReviews(): Promise<ReviewWithWork[]> {
  await ensureSchema();
  const { rows } = await sql.query<ReviewRow>(
    `${REVIEW_SELECT} ORDER BY r.updated_at DESC`,
  );
  return rows.map(toReviewWithWork);
}

export async function getReviewByWorkId(
  workId: number,
): Promise<ReviewWithWork | null> {
  await ensureSchema();
  const { rows } = await sql.query<ReviewRow>(
    `${REVIEW_SELECT} WHERE w.id = $1 LIMIT 1`,
    [workId],
  );
  return rows[0] ? toReviewWithWork(rows[0]) : null;
}
