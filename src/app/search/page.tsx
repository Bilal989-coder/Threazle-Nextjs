import Catalog from '@/views/Catalog';
import { getProducts } from '@/api/catalog';
import { categoriesCached, fabricTypesCached, listingQuery, meta, type SearchValues } from '@/lib/server-catalog';
export const metadata = meta("Search the collection", '/search');
export default async function Page({ searchParams }: {
    searchParams: Promise<SearchValues>;
}) {
    const params = await searchParams;
    const [data, categories, types] = await Promise.all([getProducts(listingQuery(params, {})), categoriesCached(), fabricTypesCached().catch(() => [])]);
    return <Catalog data={data} categories={categories} fabricTypes={types} title={"Search the collection"} description={"A design, a fabric, a name. Find what you came for."}/>;
}
