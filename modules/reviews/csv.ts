import type { ReviewWithWork } from "@/modules/reviews/domain";
import { MEDIA_TYPE_LABELS } from "@/modules/catalog/domain";

const CSV_HEADERS = [
  "作品",
  "类型",
  "我的评分",
  "观看时间",
  "观后感",
] as const;

/** 避免 CSV 字段被表格软件当作公式执行。 */
function neutralizeFormula(value: string): string {
  return /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function escapeCsvField(value: string | number | null): string {
  const text = neutralizeFormula(value === null ? "" : String(value));
  return `"${text.replaceAll('"', '""')}"`;
}

export function reviewsToCsv(reviews: ReviewWithWork[]): string {
  const rows = reviews.map((review) => [
    review.work.title,
    MEDIA_TYPE_LABELS[review.work.type],
    review.myRating,
    review.watchedAt,
    review.comment,
  ]);

  return [CSV_HEADERS, ...rows]
    .map((row) => row.map(escapeCsvField).join(","))
    .join("\r\n");
}
