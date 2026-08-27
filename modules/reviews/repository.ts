import "server-only";

import { getDatabase } from "@/infrastructure/database/client";
import type {
  CastMember,
  CatalogWork,
  MediaType,
} from "@/modules/catalog/domain";
import type {
  ReviewDraft,
  ReviewStatus,
  ReviewWithWork,
} from "@/modules/reviews/domain";

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

interface SavedReviewRow {
  review_id: number;
  work_id: number;
}

function parseJsonArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
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
    watchedAt: row.watched_at ? String(row.watched_at) : null,
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

/** 作品快照与观后感在同一 SQL 语句中保存，任一部分失败都会整体回滚。 */
export async function saveReviewWithWork(
  work: CatalogWork,
  review: ReviewDraft,
): Promise<SavedReviewRow> {
  const sql = getDatabase();
  const rows = (await sql`
    WITH saved_work AS (
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
        type = EXCLUDED.type,
        cover_url = EXCLUDED.cover_url,
        creator = EXCLUDED.creator,
        year = EXCLUDED.year,
        external_rating = EXCLUDED.external_rating,
        episodes = EXCLUDED.episodes,
        synopsis = EXCLUDED.synopsis,
        genres = EXCLUDED.genres,
        cast_members = EXCLUDED.cast_members
      RETURNING id
    ), saved_review AS (
      INSERT INTO reviews (work_id, status, my_rating, comment, watched_at)
      SELECT id, ${review.status}, ${review.myRating}, ${review.comment},
             ${review.watchedAt}
      FROM saved_work
      RETURNING id, work_id
    )
    SELECT id AS review_id, work_id FROM saved_review
  `) as SavedReviewRow[];

  const saved = rows[0];
  if (!saved) throw new Error("Failed to save review");
  return saved;
}

export async function updateReviewRecord(
  reviewId: number,
  review: ReviewDraft,
): Promise<boolean> {
  const sql = getDatabase();
  const rows = await sql`
    UPDATE reviews
    SET status = ${review.status},
        my_rating = ${review.myRating},
        comment = ${review.comment},
        watched_at = ${review.watchedAt},
        updated_at = now()
    WHERE id = ${reviewId}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function deleteReviewRecord(reviewId: number): Promise<boolean> {
  const sql = getDatabase();
  const rows = await sql`
    DELETE FROM reviews WHERE id = ${reviewId} RETURNING id
  `;
  return rows.length > 0;
}

export async function listReviewRecords(): Promise<ReviewWithWork[]> {
  const sql = getDatabase();
  const rows = (await sql.query(
    `${REVIEW_SELECT} ORDER BY r.updated_at DESC`,
  )) as ReviewRow[];
  return rows.map(toReviewWithWork);
}

export async function findLatestReviewByWorkId(
  workId: number,
): Promise<ReviewWithWork | null> {
  const sql = getDatabase();
  const rows = (await sql.query(
    `${REVIEW_SELECT}
     WHERE w.id = $1
     ORDER BY r.updated_at DESC, r.id DESC
     LIMIT 1`,
    [workId],
  )) as ReviewRow[];
  return rows[0] ? toReviewWithWork(rows[0]) : null;
}
