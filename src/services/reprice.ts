import { computePrice, getProduct, getCategories } from '@/api/catalog';
import { quoteInput, readyAvailability, roundMoney, validateMeasurements } from '@/lib/commerce';
import type { CartItem } from '@/types';
/** Re-read the public catalog before every final checkout. Browser stock is not authoritative. */
export async function repriceCart(items: CartItem[], signal?: AbortSignal): Promise<{
    items: CartItem[];
    changed: boolean;
}> {
    if (!items.length)
        throw new Error('Your bag is empty.');
    if (items.length > 30)
        throw new Error('A bag can contain at most 30 selections.');
    const categories = items.some(i => i.mode === 'stitch') ? await getCategories(signal) : [];
    const result: CartItem[] = [];
    // A bounded batch avoids firing dozens of concurrent requests at the supplied API.
    for (let start = 0; start < items.length; start += 3) {
        const batch = await Promise.all(items.slice(start, start + 3).map(async (item) => {
            const p = await getProduct(item.productSlug, signal);
            if (!p || p.id !== item.productId || p.status !== 'active')
                throw new Error(`${item.productName} is no longer available. Remove it from your bag.`);
            if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50)
                throw new Error(`Check the quantity of ${item.productName}.`);
            const max = readyAvailability(p, item.sizeLabel || '');
            if (item.mode === 'ready_made' && (!p.isReadymade || item.quantity > max))
                throw new Error(`${item.productName}: only ${max} remain in size ${item.sizeLabel}. Update your bag.`);
            if (item.mode === 'stitch') {
                const c = item.customization, category = categories.find(c => c.id === p.categoryId);
                if (!p.isCustomizable || !c || !category)
                    throw new Error(`Please reconfigure ${p.name}.`);
                if ((p.variants.length > 0 && !p.variants.some(v => v.id === c.variantId)) || (c.variantId && !p.variants.some(v => v.id === c.variantId)))
                    throw new Error(`Choose a current style for ${p.name}.`);
                if ((p.compatibleFabricIds.length > 0 && !p.compatibleFabricIds.includes(c.fabricId || '')) || (c.fabricId && !p.compatibleFabricIds.includes(c.fabricId)))
                    throw new Error(`Choose an available fabric for ${p.name}.`);
                if (c.addonIds.some(id => !p.addonIds.includes(id)))
                    throw new Error(`An extra for ${p.name} is no longer available.`);
                if (!category.measurementFields.length) throw new Error(`Measurement guidance for ${p.name} is not available. Contact the store before ordering.`);
                const errors = validateMeasurements(c.measurementSnapshot || {}, category.measurementFields);
                if (Object.keys(errors).length)
                    throw new Error(`Review the measurements for ${p.name}: ${Object.values(errors)[0]}`);
            }
            const quote = await computePrice(quoteInput(item), signal);
            if (!Number.isFinite(quote.total) || quote.total < 0)
                throw new Error(`A valid price was not returned for ${p.name}.`);
            return { ...structuredClone(item), unitPrice: quote.total, ...(item.mode === 'ready_made' ? { maxQuantity: max } : {}), productImage: p.images[0]?.url || item.productImage };
        }));
        result.push(...batch);
    }
    return { items: result, changed: result.some((item, i) => roundMoney(item.unitPrice) !== roundMoney(items[i].unitPrice)) };
}
