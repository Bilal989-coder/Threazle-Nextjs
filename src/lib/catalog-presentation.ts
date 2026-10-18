import type { Product } from '@/types';
import { features } from './config';

/** Preserve gallery order except for the actual admin-selected primary image. */
export function normalizeProduct(product: Product): Product {
    return { ...product, ...(!features.customization && { isCustomizable: false, defaultMode: 'ready_made' as const }), images: [...product.images].sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary))) };
}

export function carouselPosition(index: number, length: number): number {
    const count = Math.max(1, Math.floor(Number.isFinite(length) ? length : 1));
    const position = Number.isFinite(index) ? Math.trunc(index) : 0;
    return ((position % count) + count) % count;
}

export function pageNumber(value: unknown): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(1, Math.min(10000, Math.floor(numeric) || 1)) : 1;
}

/** No dates are invented; the backend already filters CMS banners by publication window. */
export function carouselLength(bannerCount: number, fallbackCount: number): number {
    return Math.max(1, bannerCount || fallbackCount);
}
