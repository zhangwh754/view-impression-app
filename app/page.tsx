import { listReviews } from "@/lib/db";
import { MEDIA_TYPE_LABELS, REVIEW_STATUS_LABELS } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home() {
  const reviews = await listReviews();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的观后感</h1>
        <Link
          href="/add"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900"
        >
          + 添加
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-20 text-center text-zinc-500">
          <p>还没有任何记录。</p>
          <p className="mt-2">
            点击右上角「添加」，搜索一部作品开始写观后感吧。
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {reviews.map((r) => (
            <li key={r.reviewId}>
              <Link
                href={`/work/${r.work.id}`}
                className="group block overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 transition hover:border-zinc-400 dark:hover:border-zinc-500"
              >
                <div className="relative aspect-[2/3] w-full bg-zinc-100 dark:bg-zinc-800">
                  {r.work.coverUrl ? (
                    <Image
                      src={r.work.coverUrl}
                      alt={r.work.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                      无封面
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                    {REVIEW_STATUS_LABELS[r.status]}
                  </span>
                  {r.myRating !== null && (
                    <span className="absolute bottom-2 right-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                      ★ {r.myRating}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium group-hover:underline">
                    {r.work.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {MEDIA_TYPE_LABELS[r.work.type]}
                    {r.work.year ? ` · ${r.work.year}` : ""}
                    {r.work.externalRating
                      ? ` · 外部 ${r.work.externalRating}`
                      : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
