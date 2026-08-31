"use client";

import { saveReview, type SaveReviewState } from "@/app/actions";
import ReviewFields from "@/components/review-fields";
import type { CatalogSource, CatalogWork } from "@/modules/catalog/domain";
import { MEDIA_TYPE_LABELS } from "@/modules/catalog/domain";
import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

interface ExistingWork {
  source: CatalogSource;
  sourceId: string;
}

const initialSaveState: SaveReviewState = { message: "" };
const SEARCH_SOURCE_LABELS: Record<CatalogSource, string> = {
  bangumi: "Bangumi",
  tmdb: "IMDb / TMDB",
};

function workKey(work: Pick<CatalogWork, "source" | "sourceId">): string {
  return `${work.source}:${work.sourceId}`;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-5 py-2 text-sm font-medium text-white dark:text-zinc-900 disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "保存中…" : "保存观后感"}
      </button>
      {pending && (
        <span role="status" className="text-sm text-zinc-500">
          正在获取作品详情并保存，请稍候…
        </span>
      )}
    </div>
  );
}

function ReviewForm({
  selected,
  defaultWatchedAt,
}: {
  selected: CatalogWork;
  defaultWatchedAt: string;
}) {
  const [state, formAction] = useActionState(saveReview, initialSaveState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="source" value={selected.source} />
      <input type="hidden" name="sourceId" value={selected.sourceId} />
      <ReviewFields defaultWatchedAt={defaultWatchedAt} />
      {state.message && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      )}
      <SaveButton />
    </form>
  );
}

export default function SearchAndReview({
  existingWorks,
}: {
  existingWorks: ExistingWork[];
}) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<CatalogSource>("bangumi");
  const [results, setResults] = useState<CatalogWork[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<CatalogWork | null>(null);
  // 新记录只默认当前年份，不预选月份。
  const [currentYear] = useState(() => String(new Date().getFullYear()));
  const existingKeys = new Set(existingWorks.map(workKey));

  function selectSource(nextSource: CatalogSource) {
    if (nextSource === source) return;
    setSource(nextSource);
    setResults([]);
    setErrors([]);
    setSearched(false);
    setSelected(null);
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    setSelected(null);
    try {
      const searchParams = new URLSearchParams({ q, source });
      const res = await fetch(`/api/search?${searchParams}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setErrors(data.errors ?? []);
    } catch {
      setResults([]);
      setErrors(["搜索请求失败，请稍后重试"]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={runSearch} className="space-y-3">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            搜索来源
          </legend>
          <div className="inline-flex rounded-lg border border-zinc-300 p-1 dark:border-zinc-700">
            {(["bangumi", "tmdb"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={source === option}
                disabled={loading}
                onClick={() => selectSource(option)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition disabled:cursor-wait disabled:opacity-50 ${
                  source === option
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {SEARCH_SOURCE_LABELS[option]}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入电影 / 动漫 / 电视剧名称…"
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-sm font-medium text-white dark:text-zinc-900 disabled:opacity-50"
          >
            {loading ? "搜索中…" : "搜索"}
          </button>
        </div>
      </form>

      {errors.length > 0 && (
        <p className="text-sm text-amber-600">
          搜索失败：{errors.join("；")}
        </p>
      )}

      {!selected && searched && !loading && results.length === 0 && (
        <p className="text-sm text-zinc-500">没有找到相关结果，换个关键词试试。</p>
      )}

      {!selected && results.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {results.map((r) => {
            const alreadyAdded = existingKeys.has(workKey(r));
            return (
            <li key={`${r.source}-${r.sourceId}`}>
              <button
                type="button"
                disabled={alreadyAdded}
                onClick={() => setSelected(r)}
                className="flex w-full gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-left transition hover:border-zinc-400 dark:hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                  {r.coverUrl ? (
                    <Image
                      src={r.coverUrl}
                      alt={r.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                      无封面
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {MEDIA_TYPE_LABELS[r.type]}
                    {r.year ? ` · ${r.year}` : ""}
                    {r.externalRating ? ` · 评分 ${r.externalRating}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    来源：{SEARCH_SOURCE_LABELS[r.source]}
                  </p>
                  {alreadyAdded && (
                    <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                      已添加
                    </p>
                  )}
                </div>
              </button>
            </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:flex-row">
            <div className="relative mx-auto h-40 w-28 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800 sm:mx-0">
              {selected.coverUrl ? (
                <Image
                  src={selected.coverUrl}
                  alt={selected.title}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                  无封面
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold">{selected.title}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {MEDIA_TYPE_LABELS[selected.type]}
                {selected.year ? ` · ${selected.year}` : ""}
                {selected.externalRating
                  ? ` · 评分 ${selected.externalRating}`
                  : ""}
              </p>
              <p className="mt-2 line-clamp-3 text-sm text-zinc-500">
                {selected.synopsis}
              </p>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mt-3 text-sm text-zinc-500 underline"
              >
                重新选择
              </button>
            </div>
          </div>

          <ReviewForm
            key={workKey(selected)}
            selected={selected}
            defaultWatchedAt={currentYear}
          />
        </div>
      )}
    </div>
  );
}
