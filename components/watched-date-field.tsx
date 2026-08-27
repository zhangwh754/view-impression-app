"use client";

import { useState } from "react";

const inputClass =
  "rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400";

/** 观看时间可精确到年或月，也可以明确选择“不记得”。 */
export default function WatchedDateField({
  defaultValue,
}: {
  defaultValue?: string | null;
}) {
  const [defaultYear, defaultMonth] = (defaultValue ?? "").split("-");
  const [year, setYear] = useState(
    /^\d{4}$/.test(defaultYear ?? "") ? defaultYear : "",
  );
  const [month, setMonth] = useState(
    /^\d{2}$/.test(defaultMonth ?? "") ? String(Number(defaultMonth)) : "",
  );
  const [unknown, setUnknown] = useState(!/^\d{4}$/.test(defaultYear ?? ""));

  const value = !unknown && /^\d{4}$/.test(year)
    ? year + (month ? `-${month.padStart(2, "0")}` : "")
    : "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="watchedAt" value={value} />
      <input
        type="number"
        min="1900"
        max="2100"
        placeholder="年份，如 2026"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        disabled={unknown}
        className={`${inputClass} w-36 disabled:cursor-not-allowed disabled:opacity-50`}
      />
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        disabled={unknown}
        className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <option value="">月份（可选）</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>
            {m} 月
          </option>
        ))}
      </select>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={unknown}
          onChange={(e) => setUnknown(e.target.checked)}
          className="size-4 accent-zinc-900 dark:accent-zinc-100"
        />
        不记得
      </label>
    </div>
  );
}
