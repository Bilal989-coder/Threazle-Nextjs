import type { Product, ProductVariant } from '@/types';
import { photoIdentity, PLACEHOLDER_IMAGE } from './media';
import { safeImageSource } from './config';

export interface StylePreview {
    source: string;
    alt: string;
    isReference: boolean;
}

const collarReferences: Record<string, string> = {
    'classic band collar': 'classic-band-collar',
    'band collar': 'classic-band-collar',
    'raised mandarin collar': 'raised-mandarin-collar',
    'mandarin collar': 'raised-mandarin-collar',
    'embroidered collar': 'embroidered-collar',
};

/** Known collar names may use labelled detail references; unknown styles are not guessed. */
export function resolveStylePreview(variant: ProductVariant, product: Product): StylePreview {
    const source = safeImageSource(variant.image);
    const label = variant.styleName.trim().toLowerCase().replace(/\s+/g, ' ');
    const reference = collarReferences[label];
    const isReference = source.startsWith('/images/details/');
    const identity = photoIdentity(variant.image || '');
    const sameAsProduct = product.images.some(image => photoIdentity(image.url) === identity);
    const duplicated = product.variants.filter(item => photoIdentity(item.image || '') === identity).length > 1;
    if (reference && (source === PLACEHOLDER_IMAGE || sameAsProduct || duplicated || isReference)) {
        return { source: `/images/details/${reference}-640.webp`, alt: `${variant.styleName} — close-up style reference`, isReference: true };
    }
    return { source, alt: `${variant.styleName} detail`, isReference };
}
