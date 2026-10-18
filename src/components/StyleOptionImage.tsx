'use client';
import type { Product, ProductVariant } from '@/types';
import { resolveStylePreview } from '@/lib/style-preview';
import { Photo } from './Photo';

export function StyleOptionImage({ variant, product }: { variant: ProductVariant; product: Product }) {
    const preview = resolveStylePreview(variant, product);
    return (
        <span className='style-option-image' data-reference={preview.isReference}>
            <Photo name={preview.source} alt={preview.alt} sizes='(max-width:640px) 80px, 96px' fit='contain' />
        </span>
    );
}
