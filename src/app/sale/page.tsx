import Catalog from '@/views/Catalog';
import { getProducts } from '@/api/catalog';
import { categoriesCached, fabricTypesCached, listingQuery, meta, type SearchValues } from '@/lib/server-catalog';
export const metadata = meta("The considered sale", '/sale');
export default async function Page({ searchParams }: {
    searchParams: Promise<SearchValues>;
}) {
    const params = await searchParams;
    const [data, categories, types] = await Promise.all([getProducts(listingQuery(params, { onSaleOnly: true })), categoriesCached(), fabricTypesCached().catch(() => [])]);
    return <Catalog data={data} categories={categories} fabricTypes={types} title={"The considered sale"} description={"Explore designs with an active offer. Prices are provided by the store."}/>;
}
