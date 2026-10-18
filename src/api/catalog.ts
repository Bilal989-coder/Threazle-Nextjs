import type { AddonService, Category, Fabric, PaginatedResult, Product } from '@/types';
import type { Banner, CmsPage, PriceInput, PriceQuote } from './contracts';
import { request, type Query } from './client';
import { normalizeProduct } from '@/lib/catalog-presentation';
export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
    return request('/categories', { signal });
}
export async function getCategory(slug: string): Promise<Category | null> {
    return request(`/categories/${encodeURIComponent(slug)}`);
}
export async function getProducts(query: Query = {}, signal?: AbortSignal): Promise<PaginatedResult<Product>> {
    const result = await request<PaginatedResult<Product>>('/products', { query, signal });
    return { ...result, items: result.items.map(normalizeProduct) };
}
export async function getProduct(slug: string, signal?: AbortSignal): Promise<Product | null> {
    try {
        const product = await request<Product | null>(`/products/slug/${encodeURIComponent(slug)}`, { signal });
        return product ? normalizeProduct(product) : null;
    }
    catch (error) {
        if ((error as {
            status?: number;
        }).status === 404)
            return null;
        throw error;
    }
}
export async function getShelf(shelf: 'new-arrivals' | 'best-sellers', limit = 8): Promise<Product[]> {
    return (await request<Product[]>(`/products/${shelf}`, { query: { limit } })).map(normalizeProduct);
}
export async function getRelated(product: Product, limit = 4): Promise<Product[]> {
    const products: Product[] = await request(`/products/${encodeURIComponent(product.id)}/related`, { query: { limit } });
    return products.map(normalizeProduct);
}
export async function getFabrics(query: Query = {}, signal?: AbortSignal): Promise<PaginatedResult<Fabric>> {
    return request('/fabrics', { query: { page: 1, pageSize: 100, ...query }, signal });
}
export async function getFabric(slug: string): Promise<Fabric | null> {
    try { return await request<Fabric | null>(`/fabrics/slug/${encodeURIComponent(slug)}`); }
    catch (error) {
        if ((error as { status?: number }).status === 404) return null;
        throw error;
    }
}
/** Follow all pages: bounded 100-item pages and no silent first-page truncation. */
export async function getCompatibleFabrics(product: Product): Promise<Fabric[]> {
    const result: Fabric[] = [];
    let page = 1;
    for (;;) {
        const data = await getFabrics({ categoryId: product.categoryId, page, pageSize: 100 });
        result.push(...data.items);
        if (page >= data.totalPages)
            break;
        if (page++ >= 50)
            throw new Error('Fabric catalog is too large. Add a filtered compatibility endpoint.');
    }
    return result.filter(f => product.compatibleFabricIds.includes(f.id));
}
export async function getAddons(): Promise<AddonService[]> { return request('/addons'); }
export async function getBanners(placement = 'homepage_hero'): Promise<Banner[]> { return request('/cms/banners', { query: { placement } }); }
export async function getPage(slug: string): Promise<CmsPage | null> {
    try {
        const page = await request<CmsPage | null>(`/cms/pages/${encodeURIComponent(slug)}`);
        return page?.status === 'published' ? page : null;
    }
    catch (error) {
        if ((error as { status?: number }).status === 404) return null;
        throw error;
    }
}
export async function computePrice(input: PriceInput, signal?: AbortSignal): Promise<PriceQuote> { return request('/products/compute-price', { method: 'POST', body: input, signal }); }
export async function getProductById(id: string, signal?: AbortSignal): Promise<Product | null> {
    try {
        const product = await request<Product | null>(`/products/${encodeURIComponent(id)}`, { signal });
        return product ? normalizeProduct(product) : null;
    }
    catch (error) {
        if ((error as {
            status?: number;
        }).status === 404)
            return null;
        throw error;
    }
}
