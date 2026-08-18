import type { MediaType } from "@/lib/types";
import { MEDIA_TYPE_LABELS } from "@/lib/types";
import Link from "next/link";

export interface FilterState {
  type: string;
  genre: string;
  rating: string;
  year: string;
}

export const RATING_FILTERS = [
  { key: "high", label: "9–10 分" },
  { key: "mid", label: "7–8 分" },
  { key: "low", label: "1–6 分" },
  { key: "none", label: "未评分" },
] as const;

export function buildHref(
  current: FilterState,
  overrides: Partial<FilterState>,
): string {
  const merged = { ...current, ...overrides };
  const qs = Object.entries(merged)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `/?${qs}` : "/";
}

function Pill({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? "border-transparent bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-500"
      }`}
    >
      {children}
    </Link>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-14 shrink-0 text-sm text-zinc-500">{label}</span>
      {children}
    </div>
  );
}

export default function FilterBar({
  current,
  genres,
  years,
}: {
  current: FilterState;
  /** 当前大类型下存在的小类型标签 */
  genres: string[];
  /** 观看日期中存在的年份（倒序） */
  years: string[];
}) {
  const hasAnyFilter =
    current.type || current.genre || current.rating || current.year;

  return (
    <div className="mb-8 space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <Row label="大类型">
        <Pill active={!current.type} href={buildHref(current, { type: "", genre: "" })}>
          全部
        </Pill>
        {(Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((t) => (
          <Pill
            key={t}
            active={current.type === t}
            href={buildHref(current, { type: t, genre: "" })}
          >
            {MEDIA_TYPE_LABELS[t]}
          </Pill>
        ))}
      </Row>

      {genres.length > 0 && (
        <Row label="小类型">
          <Pill active={!current.genre} href={buildHref(current, { genre: "" })}>
            全部
          </Pill>
          {genres.map((g) => (
            <Pill
              key={g}
              active={current.genre === g}
              href={buildHref(current, { genre: g })}
            >
              {g}
            </Pill>
          ))}
        </Row>
      )}

      <Row label="评分">
        <Pill active={!current.rating} href={buildHref(current, { rating: "" })}>
          全部
        </Pill>
        {RATING_FILTERS.map((r) => (
          <Pill
            key={r.key}
            active={current.rating === r.key}
            href={buildHref(current, { rating: r.key })}
          >
            {r.label}
          </Pill>
        ))}
      </Row>

      {years.length > 0 && (
        <Row label="观看年份">
          <Pill active={!current.year} href={buildHref(current, { year: "" })}>
            全部
          </Pill>
          {years.map((y) => (
            <Pill
              key={y}
              active={current.year === y}
              href={buildHref(current, { year: y })}
            >
              {y}
            </Pill>
          ))}
        </Row>
      )}

      {hasAnyFilter && (
        <div className="pt-1">
          <Link href="/" scroll={false} className="text-sm text-zinc-500 underline">
            清除全部筛选
          </Link>
        </div>
      )}
    </div>
  );
}
