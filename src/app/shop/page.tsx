import Catalog from '@/views/Catalog';
import { getProducts } from '@/api/catalog';
import { categoriesCached, fabricTypesCached, listingQuery, meta, type SearchValues } from '@/lib/server-catalog';
export const metadata = meta('The collection', '/shop');
export default async function Page({ searchParams }: { searchParams: Promise<SearchValues> }) {
    const params = await searchParams;
    const [data, categories, types] = await Promise.all([
        getProducts(listingQuery(params)), categoriesCached(), fabricTypesCached().catch(() => []),
    ]);
    return <Catalog data={data} categories={categories} fabricTypes={types} title='The collection' description='New chapters and signature designs. Find the expression that feels like you.' />;
}
