import type { MetadataRoute } from 'next';
import { config, isDemo } from '@/lib/config';
export default function robots(): MetadataRoute.Robots {
    const index = config.enableIndexing && !isDemo;
    return { rules: [{ userAgent: '*', allow: index ? '/' : undefined, disallow: index ? ['/account/', '/checkout/', '/cart/', '/order/', '/track-order/', '/auth/', '/search/'] : ['/'] }], sitemap: index ? `${config.siteUrl}/sitemap.xml` : undefined };
}
