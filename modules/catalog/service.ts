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

/** 并行搜索全部目录；单一提供方失败时保留其他结果。 */
export async function searchCatalog(query: string): Promise<CatalogSearchResult> {
  const settled = await Promise.allSettled(
    providers.map((provider) => provider.search(query)),
  );

  const results: CatalogWork[] = [];
  const errors: string[] = [];

  settled.forEach((result, index) => {
    const provider = providers[index];
    if (result.status === "fulfilled") {
      results.push(...result.value);
      return;
    }

    console.error(`${provider.displayName} catalog search failed`, result.reason);
    errors.push(`${provider.displayName} 暂时不可用`);
  });

  return { results, errors };
}

export async function getCatalogWork(
  source: CatalogSource,
  sourceId: string,
): Promise<CatalogWork> {
  const provider = providerBySource.get(source);
  if (!provider) throw new Error(`Unsupported catalog source: ${source}`);
  return provider.getDetail(sourceId);
}
