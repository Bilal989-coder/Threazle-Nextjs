/** Explicit visual-preview fixtures. Never used as an API error fallback. */
import fixture from './demo.json';
import type { AddonService, Category, Fabric, PaginatedResult, Product } from '@/types';
import type { PriceInput, PriceQuote } from '@/api/contracts';
import type { Query } from '@/api/client';
export const demoData = fixture as unknown as {
    categories: Category[];
    products: Product[];
    fabrics: Fabric[];
    addons: AddonService[];
};
export function demoList(q: Query): PaginatedResult<Product> {
    let items = [...demoData.products];
    if (q.search)
        items = items.filter(p => p.name.toLowerCase().includes(String(q.search).toLowerCase()));
    if (q.categorySlug) {
        const c = demoData.categories.find(c => c.slug === q.categorySlug);
        items = items.filter(p => p.categoryId === c?.id);
    }
    if (q.mode === 'stitch')
        items = items.filter(p => p.isCustomizable);
    if (q.mode === 'ready_made')
        items = items.filter(p => p.isReadymade);
    if (q.onSaleOnly === true || q.onSaleOnly === 'true')
        items = items.filter(p => p.salePrice != null);
    if (q.isNew === true || q.isNew === 'true')
        items = items.filter(p => p.isNew);
    if (q.priceMin !== undefined && q.priceMin !== null && q.priceMin !== '')
        items = items.filter(p => p.basePrice >= Number(q.priceMin));
    if (q.priceMax !== undefined && q.priceMax !== null && q.priceMax !== '')
        items = items.filter(p => p.basePrice <= Number(q.priceMax));
    if (q.fabricTypes) {
        const types = Array.isArray(q.fabricTypes) ? q.fabricTypes : [String(q.fabricTypes)];
        items = items.filter(p => demoData.fabrics.some(f => p.compatibleFabricIds.includes(f.id) && types.includes(f.type)));
    }
    if (q.sort === 'price_asc')
        items.sort((a, b) => a.basePrice - b.basePrice);
    if (q.sort === 'price_desc')
        items.sort((a, b) => b.basePrice - a.basePrice);
    const total = items.length, page = Math.max(1, Number(q.page) || 1), pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 12));
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
export function demoQuote(input: PriceInput): PriceQuote {
    const p = demoData.products.find(p => p.id === input.productId);
    if (!p)
        throw new Error('Preview product not found.');
    let basePrice = p.basePrice, variantAdd = 0, fabricPrice = 0, stitchingCharge = 0, addonsTotal = 0;
    if (input.mode === 'ready_made')
        basePrice = p.readyMadeSizes.find(s => s.sizeLabel === input.sizeLabel)?.priceOverride ?? basePrice;
    else {
        variantAdd = p.variants.find(v => v.id === input.variantId)?.priceAdd ?? 0;
        fabricPrice = demoData.fabrics.find(f => f.id === input.fabricId)?.price ?? 0;
        stitchingCharge = 2000;
        addonsTotal = demoData.addons.filter(a => input.addonIds?.includes(a.id)).reduce((s, a) => s + a.price, 0);
    }
    const discountAmount = p.salePrice == null ? 0 : Math.max(0, p.basePrice - p.salePrice);
    const breakdown = [{ label: 'Base price', amount: basePrice }, { label: 'Style', amount: variantAdd }, { label: 'Fabric', amount: fabricPrice }, { label: 'Stitching', amount: stitchingCharge }, { label: 'Add-ons', amount: addonsTotal }, { label: 'Sale', amount: -discountAmount }].filter(x => x.amount !== 0);
    return { basePrice, variantAdd, fabricPrice, stitchingCharge, addonsTotal, discountAmount, total: Math.max(0, basePrice + variantAdd + fabricPrice + stitchingCharge + addonsTotal - discountAmount), breakdown };
}
