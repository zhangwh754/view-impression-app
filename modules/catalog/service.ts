import "server-only";

import type {
  CatalogProvider,
  CatalogSource,
  CatalogWork,
} from "@/modules/catalog/domain";
import { bangumiProvider } from "@/modules/catalog/providers/bangumi";
import { tmdbProvider } from "@/modules/catalog/providers/tmdb";

const providers = [bangumiProvider, tmdbProvider] as const;
const providerBySource = new Map<CatalogSource, CatalogProvider>(
  providers.map((provider) => [provider.source, provider]),
);

export interface CatalogSearchResult {
  results: CatalogWork[];
  errors: string[];
}

/** 仅搜索用户当前选择的目录，默认使用 Bangumi。 */
export async function searchCatalog(
  query: string,
  source: CatalogSource = "bangumi",
): Promise<CatalogSearchResult> {
  const provider = providerBySource.get(source);
  if (!provider) return { results: [], errors: ["不支持的搜索来源"] };

  try {
    return { results: await provider.search(query), errors: [] };
  } catch (error) {
    console.error(`${provider.displayName} catalog search failed`, error);
    return { results: [], errors: [`${provider.displayName} 暂时不可用`] };
  }
}

export async function getCatalogWork(
  source: CatalogSource,
  sourceId: string,
): Promise<CatalogWork> {
  const provider = providerBySource.get(source);
  if (!provider) throw new Error(`Unsupported catalog source: ${source}`);
  return provider.getDetail(sourceId);
}
