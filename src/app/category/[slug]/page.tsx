import { notFound } from 'next/navigation';
import Catalog from '@/views/Catalog';
import { getProducts } from '@/api/catalog';
import { categoriesCached, fabricTypesCached, listingQuery, meta, type SearchValues } from '@/lib/server-catalog';
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { const { slug } = await params; const category = (await categoriesCached()).find(c => c.slug === slug); return meta(category?.name || 'Collection', `/category/${slug}`, category?.description); }
export default async function Page({ params, searchParams }: {
    params: Promise<{
        slug: string;
    }>;
    searchParams: Promise<SearchValues>;
}) {
    const [{ slug }, search, categories] = await Promise.all([params, searchParams, categoriesCached()]);
    const category = categories.find(c => c.slug === slug);
    if (!category)
        notFound();
    const [data, types] = await Promise.all([getProducts(listingQuery(search, { categorySlug: slug })), fabricTypesCached().catch(() => [])]);
    return <Catalog data={data} categories={categories} fabricTypes={types} title={category.name} description={category.description || 'Tradition, in your own expression.'}/>;
}
