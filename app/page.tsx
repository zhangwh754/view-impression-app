import AuthButton from "@/components/auth-button";
import CardDeleteButton from "@/components/card-delete-button";
import SiteTabs from "@/components/site-tabs";
import FilterBar, {
  buildHref,
  type FilterState,
} from "@/components/filter-bar";
import { isOwner as checkIsOwner } from "@/auth";
import { MEDIA_TYPE_LABELS } from "@/modules/catalog/domain";
import type {
  ReviewSort,
  ReviewWithWork,
} from "@/modules/reviews/domain";
import { listReviews } from "@/modules/reviews/service";
import Image from "next/image";
import Link from "next/link";
import Form from "next/form";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

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

function matchKeyword(review: ReviewWithWork, keyword: string): boolean {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("zh-CN");
  if (!normalizedKeyword) return true;

  return [
    review.work.title,
    review.work.originalTitle,
    review.comment,
  ].some((value) =>
    value?.toLocaleLowerCase("zh-CN").includes(normalizedKeyword),
  );
}

function pick(param: string | string[] | undefined): string {
  return typeof param === "string" ? param : "";
}

function parseSort(param: string): ReviewSort {
  return param === "watched" ||
    param === "updated" ||
    param === "work-year"
    ? param
    : "rating";
}

function parsePage(param: string): number {
  const page = Number(param);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function pageHref(current: FilterState, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const current: FilterState = {
    q: pick(sp.q).trim(),
    sort: parseSort(pick(sp.sort)),
    type: pick(sp.type),
    genre: pick(sp.genre),
    rating: pick(sp.rating),
    year: pick(sp.year),
  };
  const requestedPage = parsePage(pick(sp.page));

  const reviews = await listReviews(current.sort);
  const owner = await checkIsOwner();

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
      matchKeyword(r, current.q) &&
      (!current.genre || r.work.genres.includes(current.genre)) &&
      matchRating(r, current.rating) &&
      (!current.year || r.watchedAt?.startsWith(current.year)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageReviews = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <SiteTabs active="reviews" />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">我的观后感</h1>
        <div className="flex items-center gap-4">
          <AuthButton />
          {owner && (
            <>
              <a
                href="/api/reviews/export"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:border-zinc-500 dark:border-zinc-700"
              >
                导出 CSV
              </a>
              <Link
                href="/add"
                className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900"
              >
                + 添加
              </Link>
            </>
          )}
        </div>
      </div>

      {reviews.length > 0 && (
        <Form action="/" className="mb-4 flex flex-wrap gap-2">
          {(["sort", "type", "genre", "rating", "year"] as const).map((key) =>
            current[key] ? (
              <input
                key={key}
                type="hidden"
                name={key}
                value={current[key]}
              />
            ) : null,
          )}
          <label htmlFor="library-search" className="sr-only">
            搜索观后感记录
          </label>
          <input
            id="library-search"
            name="q"
            type="search"
            defaultValue={current.q}
            placeholder="搜索作品名、原名或观后感…"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            搜索
          </button>
          {current.q && (
            <Link
              href={buildHref(current, { q: "" })}
              scroll={false}
              className="self-center px-2 text-sm text-zinc-500 underline"
            >
              清除搜索
            </Link>
          )}
        </Form>
      )}

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
          {current.q
            ? `没有找到包含“${current.q}”的记录。`
            : "当前筛选条件下没有记录。"}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-zinc-500">
            共 {filtered.length} 条
            {totalPages > 1 ? ` · 第 ${currentPage} / ${totalPages} 页` : ""}
          </p>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {pageReviews.map((r) => (
              <li key={r.reviewId} className="group relative">
                {owner && (
                  <CardDeleteButton reviewId={r.reviewId} title={r.work.title} />
                )}
                <Link
                  href={`/work/${r.work.id}`}
                  className="group/link block overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 transition hover:border-zinc-400 dark:hover:border-zinc-500"
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
                    {r.myRating !== null && (
                      <span className="absolute bottom-2 right-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                        ★ {r.myRating}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium group-hover/link:underline">
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
          {totalPages > 1 && (
            <nav
              aria-label="首页分页"
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              {currentPage > 1 ? (
                <Link
                  href={pageHref(current, currentPage - 1)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm transition hover:border-zinc-500"
                >
                  上一页
                </Link>
              ) : (
                <span className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm text-zinc-400">
                  上一页
                </span>
              )}
              <span className="text-sm text-zinc-500">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={pageHref(current, currentPage + 1)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm transition hover:border-zinc-500"
                >
                  下一页
                </Link>
              ) : (
                <span className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm text-zinc-400">
                  下一页
                </span>
              )}
              <Form action="/" className="flex items-center gap-2">
                {(
                  ["q", "sort", "type", "genre", "rating", "year"] as const
                ).map((key) =>
                  current[key] ? (
                    <input
                      key={key}
                      type="hidden"
                      name={key}
                      value={current[key]}
                    />
                  ) : null,
                )}
                <label htmlFor="pagination-page" className="text-sm text-zinc-500">
                  跳至
                </label>
                <input
                  id="pagination-page"
                  name="page"
                  type="number"
                  min={1}
                  max={totalPages}
                  defaultValue={currentPage}
                  className="w-16 rounded-lg border border-zinc-300 bg-transparent px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700"
                />
                <span className="text-sm text-zinc-500">页</span>
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm transition hover:border-zinc-500 dark:border-zinc-700"
                >
                  跳转
                </button>
              </Form>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
