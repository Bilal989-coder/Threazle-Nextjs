import { cache } from 'react';
import { pageNumber } from './catalog-presentation';
import type { Metadata } from 'next';
import { getCategories, getProduct, getFabrics, getPage } from '@/api/catalog';
import { request, type Query } from '@/api/client';
import { config, isDemo } from './config';
export const categoriesCached = cache(getCategories);
export const productCached = cache(getProduct);
export const cmsPageCached = cache(getPage);
export const fabricTypesCached = cache(async (): Promise<string[]> => request('/fabrics/types'));
export type SearchValues = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
export function listingQuery(params: SearchValues, extra: Query = {}): Query {
    const q: Query = { page: pageNumber(one(params.page)), pageSize: 12, ...extra };
    if (one(params.q))
        q.search = one(params.q)!.slice(0, 150);
    if (one(params.categorySlug))
        q.categorySlug = one(params.categorySlug);
    const mode = one(params.mode);
    if (mode === 'stitch' || mode === 'custom')
        q.mode = 'stitch';
    if (mode === 'ready_made' || mode === 'ready')
        q.mode = 'ready_made';
    const sort = one(params.sort);
    if (sort && ['newest', 'price_asc', 'price_desc', 'best_selling'].includes(sort))
        q.sort = sort;
    for (const key of ['priceMin', 'priceMax'] as const) {
        const raw = one(params[key]);
        if (raw !== undefined && raw !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0)
            q[key] = Number(raw);
    }
    if (one(params.onSaleOnly) === 'true') q.onSaleOnly = true;
    if (params.sizes)
        q.sizes = (Array.isArray(params.sizes) ? params.sizes : [params.sizes]).map(size => size.slice(0, 20)).slice(0, 12);
    if (params.fabricTypes)
        q.fabricTypes = Array.isArray(params.fabricTypes) ? params.fabricTypes : [params.fabricTypes];
    // Path-specific filters always win; a category route cannot request another category.
    return { ...q, ...extra };
}
export function meta(title: string, path: string, description = 'Considered menswear. Ready-made designs and personal tailoring from Threazle.'): Metadata {
    return { title, description, alternates: { canonical: path }, openGraph: { title: `${title} | Threazle`, description, url: path, type: 'website' } };
}
export const privateMeta: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };
