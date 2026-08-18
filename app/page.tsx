import FilterBar, { type FilterState } from "@/components/filter-bar";
import { listReviews } from "@/lib/db";
import type { ReviewWithWork } from "@/lib/types";
import { MEDIA_TYPE_LABELS, REVIEW_STATUS_LABELS } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

function matchRating(r: ReviewWithWork, bucket: string): boolean {
  const n = r.myRating;
  switch (bucket) {
    case "high":
      return n !== null && n >= 9;
    case "mid":
      return n !== null && n >= 7 && n <= 8;
    case "low":
      return n !== null && n >= 1 && n <= 6;
    case "none":
      return n === null;
    default:
      return true;
  }
}

function pick(param: string | string[] | undefined): string {
  return typeof param === "string" ? param : "";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const current: FilterState = {
    type: pick(sp.type),
    genre: pick(sp.genre),
    rating: pick(sp.rating),
    year: pick(sp.year),
  };

  const reviews = await listReviews();

  // 大类型先行过滤；小类型、年份的可选项都基于当前大类型下的数据
  const byType = current.type
    ? reviews.filter((r) => r.work.type === current.type)
    : reviews;

  const genreCounts = new Map<string, number>();
  for (const r of byType) {
    for (const g of r.work.genres) {
      genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
    }
  }
  const genres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);

  const years = [
    ...new Set(
      byType
        .map((r) => r.watchedAt?.slice(0, 4))
        .filter((y): y is string => Boolean(y)),
    ),
  ].sort((a, b) => b.localeCompare(a));

  const filtered = byType.filter(
    (r) =>
      (!current.genre || r.work.genres.includes(current.genre)) &&
      matchRating(r, current.rating) &&
      (!current.year || r.watchedAt?.startsWith(current.year)),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的观后感</h1>
        <Link
          href="/add"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900"
        >
          + 添加
        </Link>
      </div>

      {reviews.length > 0 && (
        <FilterBar current={current} genres={genres} years={years} />
      )}

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-20 text-center text-zinc-500">
          <p>还没有任何记录。</p>
          <p className="mt-2">
            点击右上角「添加」，搜索一部作品开始写观后感吧。
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-20 text-center text-zinc-500">
          当前筛选条件下没有记录。
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-zinc-500">共 {filtered.length} 条</p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((r) => (
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
        </>
      )}
    </main>
  );
}
