"use client";

import { deleteReview } from "@/app/actions";
import { useFormStatus } from "react-dom";

function DeleteIcon({ title }: { title: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`删除《${title}》的观后感`}
      title="删除这条观后感"
      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white transition hover:bg-red-600 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
    >
      {pending ? "…" : "✕"}
    </button>
  );
}

export default function CardDeleteButton({
  reviewId,
  title,
}: {
  reviewId: number;
  title: string;
}) {
  return (
    <form
      action={deleteReview}
      onSubmit={(e) => {
        if (!window.confirm(`确定删除《${title}》的观后感吗？此操作不可恢复。`)) {
          e.preventDefault();
        }
      }}
      className="absolute right-2 top-2 z-10"
    >
      <input type="hidden" name="reviewId" value={reviewId} />
      <DeleteIcon title={title} />
    </form>
  );
}
