'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import type { Product } from '@/types';
import { FALLBACK_METADATA, PLACEHOLDER_IMAGE, largestPhoto, photoMetadata, responsivePhotoSources } from '@/lib/media';

// Compatibility exports for existing sharing/thumbnail consumers.
export const photoMeta = (source: string) => photoMetadata(source) || FALLBACK_METADATA;
export const photoSrc = (name: string, width: number) => `/images/products/${name}-${width}.webp`;
export const photoSrcSet = responsivePhotoSources;
export const photoLargest = largestPhoto;
export const photoShare = largestPhoto;

interface PhotoProps {
    name: string;
    alt: string;
    sizes?: string;
    priority?: boolean;
    className?: string;
    style?: CSSProperties;
    fit?: 'cover' | 'contain';
    quality?: 75 | 85;
}

/** Fixed CSS frames + genuine source metadata keep different photo ratios undistorted. */
export function Photo({ name, alt, sizes = '(max-width:767px) 50vw, (max-width:1199px) 25vw, 22vw', priority = false, className = '', style, fit = 'cover', quality = 85 }: PhotoProps) {
    const [failedSource, setFailedSource] = useState<string | null>(null);
    useEffect(() => setFailedSource(null), [name]);
    const failed = failedSource === name;
    const source = failed ? PLACEHOLDER_IMAGE : largestPhoto(name);
    const metadata = photoMetadata(name) || FALLBACK_METADATA;
    return (
        <Image
            className={`photo photo--${fit} ${className}`}
            src={source}
            alt={failed || source === PLACEHOLDER_IMAGE ? `${alt} — photograph unavailable` : alt}
            width={metadata.width}
            height={metadata.height}
            sizes={sizes}
            quality={quality}
            preload={priority}
            loading={priority ? undefined : 'lazy'}
            onError={() => setFailedSource(name)}
            draggable={false}
            style={{ objectFit: fit, ...style }}
        />
    );
}

export function ProductVisual({ product, index = 0, sizes, priority }: {
    product: Product;
    index?: number;
    sizes?: string;
    priority?: boolean;
}) {
    const image = product.images[index] || product.images[0];
    return <Photo name={image?.url || PLACEHOLDER_IMAGE} alt={image?.alt || product.name} sizes={sizes} priority={priority} fit='cover' />;
}

export function productAlt(product: Product, index = 0) {
    return product.images[index]?.alt || `${product.name} — view ${index + 1}`;
}

export function FabricSwatch({ color, image, name }: { color: string; image?: string; name: string }) {
    return image ? <Photo name={image} alt={`${name} fabric swatch`} /> : (
        <div className='fabric-swatch' style={{ background: /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#a68a56' }} role='img' aria-label={`${name} colour swatch`}>
            <span className='swatch-weave' /><span className='swatch-fold' />
        </div>
    );
}
