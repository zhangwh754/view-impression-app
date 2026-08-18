"use client";

import { deleteReview } from "@/app/actions";

export default function DeleteReviewButton({ reviewId }: { reviewId: number }) {
  return (
    <form
      action={deleteReview}
      onSubmit={(e) => {
        if (!window.confirm("确定删除这条观后感吗？此操作不可恢复。")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="reviewId" value={reviewId} />
      <button
        type="submit"
        className="rounded-lg border border-red-300 px-5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
      >
        删除
      </button>
    </form>
  );
}
