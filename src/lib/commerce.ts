import type { CartItem, MeasurementFieldDef, Product } from '@/types';
import type { OrderLineInput, PriceInput } from '@/api/contracts';
export const money = (value: number) => `Rs. ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 }).format(value)}`;
export const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export function subtotal(items: CartItem[]): number { return roundMoney(items.reduce((sum, i) => sum + roundMoney(i.unitPrice * i.quantity), 0)); }
/** Mirrors the source backend/order.service.ts, NOT a universal shipping policy. */
export function shipping(net: number, method: 'standard' | 'express'): number { return method === 'express' ? 500 : net >= 10000 ? 0 : 250; }
export function previewTotals(items: CartItem[], delivery: 'standard' | 'express', discount = 0, loyalty = 0) {
    const sub = subtotal(items);
    if (![sub, discount, loyalty].every(Number.isFinite) || discount < 0 || loyalty < 0 || discount + loyalty > sub)
        throw new Error('Discounts exceed the merchandise total. Reduce points or remove the coupon.');
    const net = roundMoney(sub - discount - loyalty), ship = shipping(net, delivery);
    return { subtotal: sub, discount, loyalty, shipping: ship, total: roundMoney(net + ship) };
}
export function quoteInput(item: CartItem): PriceInput {
    return { productId: item.productId, mode: item.mode, ...(item.mode === 'ready_made' ? { sizeLabel: item.sizeLabel } : { variantId: item.customization?.variantId, fabricId: item.customization?.fabricId, addonIds: item.customization?.addonIds ?? [], ...(item.customization?.rush ? { rush: true } : {}) }) };
}
/** The backend prefers a live saved profile over a snapshot when both are sent.
 * Omit profile ID deliberately: the exact measurements reviewed in this cart win. */
export function orderLine(item: CartItem): OrderLineInput {
    return { ...quoteInput(item), quantity: item.quantity, ...(item.mode === 'stitch' ? { measurementSnapshot: { ...item.customization?.measurementSnapshot }, notes: item.customization?.notes || undefined } : {}) };
}
export function validateMeasurements(values: Record<string, number>, fields: MeasurementFieldDef[]): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const f of fields) {
        const n = values[f.key];
        if (!Number.isFinite(n) || n <= 0)
            errors[f.key] = `Enter ${f.label.toLowerCase()} in ${f.unit}.`;
        else if (f.min != null && n < f.min)
            errors[f.key] = `Minimum ${f.min} ${f.unit}.`;
        else if (f.max != null && n > f.max)
            errors[f.key] = `Maximum ${f.max} ${f.unit}.`;
    }
    for (const key of Object.keys(values))
        if (!fields.some(f => f.key === key))
            errors[key] = 'Unknown measurement field.';
    return errors;
}
export function stableJson(value: unknown): string {
    if (value === undefined)
        return 'null';
    if (value === null || typeof value !== 'object')
        return JSON.stringify(value);
    if (Array.isArray(value))
        return '[' + value.map(stableJson).join(',') + ']';
    return '{' + Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => JSON.stringify(k) + ':' + stableJson(v)).join(',') + '}';
}
export async function fingerprint(value: unknown): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stableJson(value)));
    return Array.from(new Uint8Array(hash)).map(x => x.toString(16).padStart(2, '0')).join('');
}
export function cartKey(item: CartItem): string {
    return stableJson({ productId: item.productId, mode: item.mode, sizeLabel: item.sizeLabel, customization: item.mode === 'stitch' ? { variantId: item.customization?.variantId, fabricId: item.customization?.fabricId, measurementSnapshot: item.customization?.measurementSnapshot, notes: item.customization?.notes, addonIds: [...(item.customization?.addonIds || [])].sort(), rush: item.customization?.rush || undefined } : undefined });
}
export function mergeCart(items: CartItem[], incoming: CartItem, editingId?: string): CartItem[] {
    if (!Number.isInteger(incoming.quantity) || incoming.quantity < 1 || incoming.quantity > 50)
        throw new Error('Quantity must be between 1 and 50.');
    const next = items.filter(i => i.id !== editingId).map(i => ({ ...i }));
    const index = next.findIndex(i => cartKey(i) === cartKey(incoming));
    const mergedQuantity = incoming.quantity + (index >= 0 ? next[index].quantity : 0);
    const limit = Math.min(50, incoming.mode === 'ready_made' ? (incoming.maxQuantity ?? 0) : 50);
    if (mergedQuantity > limit)
        throw new Error(`Only ${limit} of this selection can be added.`);
    if (index >= 0)
        next[index] = { ...structuredClone(incoming), id: next[index].id, quantity: mergedQuantity };
    else
        next.push(structuredClone(incoming));
    if (next.length > 30)
        throw new Error('Your bag can contain up to 30 different selections.');
    return next;
}
/** Parse untrusted tab-storage defensively; authoritative IDs/prices are revalidated before checkout. */
export function restoreCart(raw: string | null): CartItem[] {
    if (!raw || raw.length > 150000)
        return [];
    try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length > 30)
            return [];
        const ids = new Set<string>();
        return parsed.filter((x: CartItem) => {
            if (!x || typeof x.id !== 'string' || ids.has(x.id) || typeof x.productId !== 'string' || typeof x.productSlug !== 'string' || typeof x.productName !== 'string' || typeof x.productImage !== 'string' || typeof x.categoryId !== 'string' || !['ready_made', 'stitch'].includes(x.mode) || !Number.isInteger(x.quantity) || x.quantity < 1 || x.quantity > 50 || !Number.isFinite(x.unitPrice) || x.unitPrice < 0 || !x.leadTimeDays || !Number.isFinite(x.leadTimeDays.min) || !Number.isFinite(x.leadTimeDays.max))
                return false;
            if (x.mode === 'ready_made' && (typeof x.sizeLabel !== 'string' || !Number.isInteger(x.maxQuantity) || Number(x.maxQuantity) < 0))
                return false;
            if (x.mode === 'stitch') {
                const c = x.customization;
                if (!c || !Array.isArray(c.addonIds) || c.addonIds.length > 20 || c.addonIds.some(id => typeof id !== 'string') || !c.measurementSnapshot || Array.isArray(c.measurementSnapshot) || Object.keys(c.measurementSnapshot).length > 30 || Object.values(c.measurementSnapshot).some(n => !Number.isFinite(n) || n <= 0 || n > 1000))
                    return false;
                if (c.notes !== undefined && (typeof c.notes !== 'string' || c.notes.length > 500))
                    return false;
                if (c.rush !== undefined && typeof c.rush !== 'boolean')
                    return false;
                for (const key of ['variantId', 'variantName', 'fabricId', 'fabricName', 'fabricSwatch', 'measurementProfileId', 'measurementProfileName'] as const)
                    if (c[key] !== undefined && typeof c[key] !== 'string')
                        return false;
            }
            ids.add(x.id);
            return true;
        });
    }
    catch {
        return [];
    }
}
export function readyAvailability(p: Product, size: string): number { return p.status === 'active' && p.isReadymade ? (p.readyMadeSizes.find(s => s.sizeLabel === size)?.stockQty ?? 0) : 0; }
