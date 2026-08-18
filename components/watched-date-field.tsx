"use client";

import { useState } from "react";

const inputClass =
  "rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400";

/** 观看时间：年必填、月可选。提交值为 "2026" 或 "2026-08"。 */
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

  const value = /^\d{4}$/.test(year)
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
        className={`${inputClass} w-36`}
      />
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className={inputClass}
      >
        <option value="">月份（可选）</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>
            {m} 月
          </option>
        ))}
      </select>
    </div>
  );
}
