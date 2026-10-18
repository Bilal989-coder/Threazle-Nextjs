import type { MetadataRoute } from 'next';
import { getProducts, getFabrics, getPage } from '@/api/catalog';
import { categoriesCached } from '@/lib/server-catalog';
import { CONTENT_TITLES } from '@/lib/content';
import { config, isDemo } from '@/lib/config';

/** Only public, actually published resources. Private order URLs never belong here. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    if (!config.enableIndexing || isDemo) return [];
    const categories = await categoriesCached();
    const paths = ['/', '/shop', '/new-arrivals', '/sale', '/fabrics', '/custom-tailoring', '/size-guide', '/pages/contact',
        ...categories.map(category => `/category/${encodeURIComponent(category.slug)}`)];
    let page = 1;
    for (;;) {
        const result = await getProducts({ page, pageSize: 100 });
        paths.push(...result.items.map(product => `/product/${encodeURIComponent(product.slug)}`));
        if (page >= result.totalPages) break;
        if (page++ >= 50) throw new Error('Product catalog exceeds 5,000 records; add segmented sitemaps.');
    }
    page = 1;
    for (;;) {
        const result = await getFabrics({ page, pageSize: 100 });
        paths.push(...result.items.map(fabric => `/fabrics/${encodeURIComponent(fabric.slug)}`));
        if (page >= result.totalPages) break;
        if (page++ >= 50) throw new Error('Fabric catalog exceeds 5,000 records; add segmented sitemaps.');
    }
    const published = await Promise.all(Object.keys(CONTENT_TITLES).filter(slug => slug !== 'contact').map(getPage));
    for (const entry of published) if (entry) paths.push(`/pages/${encodeURIComponent(entry.slug)}`);
    return [...new Set(paths)].map(path => ({ url: config.siteUrl + path }));
}
