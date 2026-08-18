"use client";

import { useRef, useState } from "react";

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DateField({
  defaultValue,
}: {
  defaultValue?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");

  function pick(d: Date) {
    setValue(toISODate(d));
  }

  const buttonClass =
    "rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        id="watchedAt"
        name="watchedAt"
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
      <button type="button" className={buttonClass} onClick={() => pick(new Date())}>
        今天
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          pick(d);
        }}
      >
        昨天
      </button>
      {value && (
        <button type="button" className={buttonClass} onClick={() => setValue("")}>
          清除
        </button>
      )}
    </div>
  );
}
