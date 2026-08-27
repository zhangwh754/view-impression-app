import { searchCatalog } from "@/modules/catalog/service";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return Response.json({ results: [] });
  if (q.length > 100) {
    return Response.json(
      { results: [], errors: ["搜索关键词不能超过 100 个字符"] },
      { status: 400 },
    );
  }

  return Response.json(await searchCatalog(q));
}
