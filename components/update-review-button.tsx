"use client";

import { updateReview } from "@/app/actions";
import { useFormStatus } from "react-dom";

export default function UpdateReviewButton() {
  const { action, pending } = useFormStatus();
  const saving = pending && action === updateReview;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-5 py-2 text-sm font-medium text-white dark:text-zinc-900 disabled:cursor-wait disabled:opacity-50"
      >
        {saving ? "保存中…" : "保存修改"}
      </button>
      {saving && (
        <span role="status" className="text-sm text-zinc-500">
          正在保存修改，请稍候…
        </span>
      )}
    </div>
  );
}
