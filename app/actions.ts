"use server";

import { isOwner } from "@/auth";
import { getBangumiDetail } from "@/lib/bangumi";
import {
  createReview,
  deleteReview as dbDeleteReview,
  updateReview as dbUpdateReview,
  upsertWork,
} from "@/lib/db";
import { getTmdbDetail } from "@/lib/tmdb";
import type { ReviewStatus, Source } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** 所有写操作仅主人可用；Server Action 可被直接 POST 调用，必须服务端校验。 */
async function requireOwner() {
  if (!(await isOwner())) {
    throw new Error("Unauthorized");
  }
}

function parseRating(raw: FormDataEntryValue | null): number | null {
  const n = Number(raw);
  // 10 分制，仅整数
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : null;
}

function parseStatus(raw: FormDataEntryValue | null): ReviewStatus {
  return raw === "plan" || raw === "watching" || raw === "completed"
    ? raw
    : "completed";
}

function parseText(raw: FormDataEntryValue | null): string | null {
  const s = typeof raw === "string" ? raw.trim() : "";
  return s || null;
}

/** 观看时间：仅接受 "2026" 或 "2026-08" 格式。 */
function parseWatchedAt(raw: FormDataEntryValue | null): string | null {
  const s = typeof raw === "string" ? raw.trim() : "";
  return /^\d{4}(-(0[1-9]|1[0-2]))?$/.test(s) ? s : null;
}

/** Fetch full detail from the source, store the work, then attach the review. */
export async function saveReview(formData: FormData) {
  await requireOwner();
  const source = formData.get("source") as Source;
  const sourceId = String(formData.get("sourceId") ?? "");
  if ((source !== "tmdb" && source !== "bangumi") || !sourceId) {
    throw new Error("Invalid work selection");
  }

  const detail =
    source === "tmdb"
      ? await getTmdbDetail(sourceId)
      : await getBangumiDetail(sourceId);

  const workId = await upsertWork(detail);
  await createReview({
    workId,
    status: parseStatus(formData.get("status")),
    myRating: parseRating(formData.get("myRating")),
    comment: parseText(formData.get("comment")),
    watchedAt: parseWatchedAt(formData.get("watchedAt")),
  });

  revalidatePath("/");
  redirect("/");
}

export async function updateReview(formData: FormData) {
  await requireOwner();
  const reviewId = Number(formData.get("reviewId"));
  const workId = Number(formData.get("workId"));
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    throw new Error("Invalid review id");
  }

  await dbUpdateReview({
    reviewId,
    status: parseStatus(formData.get("status")),
    myRating: parseRating(formData.get("myRating")),
    comment: parseText(formData.get("comment")),
    watchedAt: parseWatchedAt(formData.get("watchedAt")),
  });

  revalidatePath("/");
  if (Number.isInteger(workId) && workId > 0) {
    revalidatePath(`/work/${workId}`);
    redirect(`/work/${workId}`);
  }
  redirect("/");
}

export async function deleteReview(formData: FormData) {
  await requireOwner();
  const reviewId = Number(formData.get("reviewId"));
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    throw new Error("Invalid review id");
  }

  await dbDeleteReview(reviewId);
  revalidatePath("/");
  redirect("/");
}
