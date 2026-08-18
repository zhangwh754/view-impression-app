import { updateReview } from "@/app/actions";
import DeleteReviewButton from "@/components/delete-review-button";
import ReviewFields from "@/components/review-fields";
import { getReviewByWorkId } from "@/lib/db";
import { MEDIA_TYPE_LABELS, REVIEW_STATUS_LABELS } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workId = Number(id);
  if (!Number.isInteger(workId) || workId <= 0) notFound();

  const review = await getReviewByWorkId(workId);
  if (!review) notFound();

  const { work } = review;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 underline">
        ← 返回首页
      </Link>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        <div className="relative mx-auto aspect-[2/3] w-full max-w-56 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:mx-0">
          {work.coverUrl ? (
            <Image
              src={work.coverUrl}
              alt={work.title}
              fill
              sizes="224px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              无封面
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{work.title}</h1>
          {work.originalTitle && work.originalTitle !== work.title && (
            <p className="mt-1 text-sm text-zinc-500">{work.originalTitle}</p>
          )}
          {work.genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {work.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-300"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-zinc-500">类型</dt>
              <dd>{MEDIA_TYPE_LABELS[work.type]}</dd>
            </div>
            {work.year && (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-zinc-500">年份</dt>
                <dd>{work.year}</dd>
              </div>
            )}
            {work.creator && (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-zinc-500">
                  {work.type === "movie" ? "导演" : "主创"}
                </dt>
                <dd>{work.creator}</dd>
              </div>
            )}
            {work.episodes !== null && (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-zinc-500">集数</dt>
                <dd>{work.episodes}</dd>
              </div>
            )}
            {work.externalRating !== null && (
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-zinc-500">外部评分</dt>
                <dd>{work.externalRating} / 10</dd>
              </div>
            )}
          </dl>
          {work.synopsis && (
            <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {work.synopsis}
            </p>
          )}
          {work.cast.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-zinc-500">
                {work.type === "anime" ? "声优" : "主演"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {work.cast.map((c) => {
                  const label = c.character
                    ? `${c.name}（${c.character}）`
                    : c.name;
                  return c.url ? (
                    <a
                      key={`${c.name}-${c.character}`}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs transition hover:border-zinc-400 hover:underline"
                    >
                      {label}
                    </a>
                  ) : (
                    <span
                      key={`${c.name}-${c.character}`}
                      className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="mt-10 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="mb-6 text-lg font-semibold">
          我的观后感
          <span className="ml-3 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-normal">
            {REVIEW_STATUS_LABELS[review.status]}
            {review.myRating !== null ? ` · ★ ${review.myRating}` : ""}
          </span>
        </h2>
        <form action={updateReview} className="space-y-6">
          <input type="hidden" name="reviewId" value={review.reviewId} />
          <input type="hidden" name="workId" value={work.id} />
          <ReviewFields
            defaultStatus={review.status}
            defaultRating={review.myRating}
            defaultComment={review.comment}
            defaultWatchedAt={review.watchedAt}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-5 py-2 text-sm font-medium text-white dark:text-zinc-900"
            >
              保存修改
            </button>
            <DeleteReviewButton reviewId={review.reviewId} />
          </div>
        </form>
      </section>
    </main>
  );
}
