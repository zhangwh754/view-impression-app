"use client";

import { saveReview } from "@/app/actions";
import ReviewFields from "@/components/review-fields";
import type { WorkSummary } from "@/lib/types";
import { MEDIA_TYPE_LABELS } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";
import { useFormStatus } from "react-dom";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-5 py-2 text-sm font-medium text-white dark:text-zinc-900 disabled:opacity-50"
    >
      {pending ? "保存中…" : "保存观后感"}
    </button>
  );
}

export default function SearchAndReview() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WorkSummary[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<WorkSummary | null>(null);
  // 新记录默认观看日期为今天（仅在挂载时计算一次，避免水合差异）
  const [today] = useState(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  });

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    setSelected(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
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
      <form onSubmit={runSearch} className="flex gap-2">
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
      </form>

      {errors.length > 0 && (
        <p className="text-sm text-amber-600">
          部分数据源失败：{errors.join("；")}
        </p>
      )}

      {!selected && searched && !loading && results.length === 0 && (
        <p className="text-sm text-zinc-500">没有找到相关结果，换个关键词试试。</p>
      )}

      {!selected && results.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {results.map((r) => (
            <li key={`${r.source}-${r.sourceId}`}>
              <button
                type="button"
                onClick={() => setSelected(r)}
                className="flex w-full gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-left transition hover:border-zinc-400 dark:hover:border-zinc-500"
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
                    来源：{r.source === "bangumi" ? "Bangumi" : "TMDB"}
                  </p>
                </div>
              </button>
            </li>
          ))}
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

          <form action={saveReview} className="space-y-6">
            <input type="hidden" name="source" value={selected.source} />
            <input type="hidden" name="sourceId" value={selected.sourceId} />
            <ReviewFields defaultWatchedAt={today} />
            <SaveButton />
          </form>
        </div>
      )}
    </div>
  );
}
