"use client";

import { deleteReview } from "@/app/actions";
import { useFormStatus } from "react-dom";

export default function DeleteReviewButton() {
  const { action, pending } = useFormStatus();
  const deleting = pending && action === deleteReview;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        formAction={deleteReview}
        disabled={pending}
        onClick={(e) => {
          if (!window.confirm("确定删除这条观后感吗？此操作不可恢复。")) {
            e.preventDefault();
          }
        }}
        className="rounded-lg border border-red-300 px-5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
      >
        {deleting ? "删除中…" : "删除"}
      </button>
      {deleting && (
        <span role="status" className="text-sm text-zinc-500">
          正在删除，请稍候…
        </span>
      )}
    </div>
  );
}
