import { searchCatalog } from "@/modules/catalog/service";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const q = searchParams.get("q")?.trim();
  const requestedSource = searchParams.get("source") ?? "bangumi";
  if (!q) return Response.json({ results: [] });
  if (q.length > 100) {
    return Response.json(
      { results: [], errors: ["搜索关键词不能超过 100 个字符"] },
      { status: 400 },
    );
  }
  if (requestedSource !== "bangumi" && requestedSource !== "tmdb") {
    return Response.json(
      { results: [], errors: ["不支持的搜索来源"] },
      { status: 400 },
    );
  }

  return Response.json(await searchCatalog(q, requestedSource));
}
