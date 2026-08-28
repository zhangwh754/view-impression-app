import { isOwner } from "@/auth";
import { reviewsToCsv } from "@/modules/reviews/csv";
import { listReviews } from "@/modules/reviews/service";

export async function GET() {
  if (!(await isOwner())) {
    return new Response("Forbidden", { status: 403 });
  }

  const csv = reviewsToCsv(await listReviews());
  const filename = `reviews-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
