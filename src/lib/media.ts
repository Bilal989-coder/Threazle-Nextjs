import { imageManifest } from '@/data/images.generated';
import { safeImageSource } from '@/lib/config';

const BASE = '/images/products';
export const PLACEHOLDER_IMAGE = '/images/placeholder.svg';
export interface MediaMetadata {
    width: number;
    height: number;
    widths: number[];
    color?: string;
    blur?: string;
}
export const FALLBACK_METADATA: MediaMetadata = { width: 900, height: 1200, widths: [] };

/** Accept both manifest keys and paths such as /images/products/name-640.webp. */
export function imageKey(source: string): string | null {
    if (typeof source !== 'string' || !source) return null;
    if (Object.prototype.hasOwnProperty.call(imageManifest, source)) return source;
    const match = source.split('?')[0].match(/^\/images\/products\/([a-z0-9-]+)-(\d+)\.webp$/i);
    if (!match || !Object.prototype.hasOwnProperty.call(imageManifest, match[1])) return null;
    const metadata = imageManifest[match[1]];
    return metadata.widths.includes(Number(match[2])) ? match[1] : null;
}

export function photoMetadata(source: string): MediaMetadata | null {
    const key = imageKey(source);
    if (key) return imageManifest[key];
    if (/^\/images\/details\/(classic-band-collar|raised-mandarin-collar|embroidered-collar)-(160|320|640)\.webp$/.test(source)) {
        return { width: 640, height: 640, widths: [160, 320, 640] };
    }
    return null;
}

export function largestPhoto(source: string): string {
    const key = imageKey(source);
    if (!key) return safeImageSource(source);
    const widths = imageManifest[key].widths;
    return `${BASE}/${key}-${Math.max(...widths)}.webp`;
}

export function responsivePhotoSources(source: string): string {
    const key = imageKey(source);
    return key ? imageManifest[key].widths.map(width => `${BASE}/${key}-${width}.webp ${width}w`).join(', ') : '';
}

/** Used only to identify the same photograph stored at multiple thumbnail widths. */
export function photoIdentity(source: string): string {
    return imageKey(source) || safeImageSource(source).split('?')[0];
}
