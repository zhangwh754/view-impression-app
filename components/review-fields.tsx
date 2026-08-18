import DateField from "@/components/date-field";
import type { ReviewStatus } from "@/lib/types";
import { REVIEW_STATUS_LABELS } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400";

const pillClass =
  "inline-block rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-1.5 text-sm transition peer-checked:bg-zinc-900 peer-checked:text-white dark:peer-checked:bg-zinc-100 dark:peer-checked:text-zinc-900 peer-checked:border-transparent";

export default function ReviewFields({
  defaultStatus = "completed",
  defaultRating,
  defaultComment,
  defaultWatchedAt,
}: {
  defaultStatus?: ReviewStatus;
  defaultRating?: number | null;
  defaultComment?: string | null;
  defaultWatchedAt?: string | null;
}) {
  return (
    <div className="space-y-4">
      <div>
        <span className="mb-2 block text-sm font-medium">状态</span>
        <div className="flex gap-2">
          {(Object.keys(REVIEW_STATUS_LABELS) as ReviewStatus[]).map((s) => (
            <label key={s} className="cursor-pointer">
              <input
                type="radio"
                name="status"
                value={s}
                defaultChecked={s === defaultStatus}
                className="peer sr-only"
              />
              <span className={pillClass}>{REVIEW_STATUS_LABELS[s]}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">我的评分</span>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer">
            <input
              type="radio"
              name="myRating"
              value=""
              defaultChecked={defaultRating == null}
              className="peer sr-only"
            />
            <span className={pillClass}>不评分</span>
          </label>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="myRating"
                value={n}
                defaultChecked={defaultRating === n}
                className="peer sr-only"
              />
              <span className={pillClass}>{n}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">观看日期</span>
        <DateField defaultValue={defaultWatchedAt} />
      </div>

      <div>
        <label htmlFor="comment" className="mb-2 block text-sm font-medium">
          评论
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={6}
          placeholder="写下你的观后感…"
          defaultValue={defaultComment ?? ""}
          className={inputClass}
        />
      </div>
    </div>
  );
}
