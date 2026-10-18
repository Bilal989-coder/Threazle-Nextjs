import Catalog from '@/views/Catalog';
import { getProducts } from '@/api/catalog';
import { categoriesCached, fabricTypesCached, listingQuery, meta, type SearchValues } from '@/lib/server-catalog';
export const metadata = meta("New arrivals", '/new-arrivals');
export default async function Page({ searchParams }: {
    searchParams: Promise<SearchValues>;
}) {
    const params = await searchParams;
    const [data, categories, types] = await Promise.all([getProducts(listingQuery(params, { isNew: true })), categoriesCached(), fabricTypesCached().catch(() => [])]);
    return <Catalog data={data} categories={categories} fabricTypes={types} title={"New arrivals"} description={"The latest additions to the Threazle collection."}/>;
}
