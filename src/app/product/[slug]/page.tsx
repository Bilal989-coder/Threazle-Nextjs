import { notFound } from 'next/navigation';
import ProductPage from '@/views/Product';
import { getAddons, getCompatibleFabrics, getRelated } from '@/api/catalog';
import { categoriesCached, productCached, meta } from '@/lib/server-catalog';
import { config, isDemo, safeImageSource } from '@/lib/config';
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) {
    const { slug } = await params, p = await productCached(slug);
    if (!p)
        return meta('Design not found', `/product/${slug}`);
    const result = meta(p.metaTitle || p.name, `/product/${p.slug}`, p.metaDescription || p.shortDescription);
    return { ...result, openGraph: { ...result.openGraph, images: p.images[0] ? [{ url: safeImageSource(p.images[0].url), alt: p.images[0].alt || p.name }] : [] } };
}
export default async function Page({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) {
    const { slug } = await params, p = await productCached(slug);
    if (!p)
        notFound();
    const categories = await categoriesCached(), category = categories.find(c => c.id === p.categoryId);
    if (!category)
        throw new Error('The product category is unavailable. Please contact the store.');
    const [fabrics, addons, related] = await Promise.all([p.isCustomizable ? getCompatibleFabrics(p) : Promise.resolve([]), p.isCustomizable ? getAddons() : Promise.resolve([]), getRelated(p).catch(() => [])]);
    const schema = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.shortDescription, image: p.images.map(image => new URL(safeImageSource(image.url), config.siteUrl).href), brand: { '@type': 'Brand', name: 'Threazle' }, url: `${config.siteUrl}/product/${p.slug}` };
    return <>{!isDemo && <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}/>}<ProductPage key={p.id} product={p} category={category} fabrics={fabrics} addons={addons.filter(a => p.addonIds.includes(a.id))} related={related}/></>;
}
