/** Presentation-only rules. No API contracts, product prices or stock are changed. */
export type GridColumns = 2 | 4 | 6;
export const GRID_STORAGE_KEY = 'threazle:catalog-columns:v1';
export const GRID_CHOICES: readonly GridColumns[] = [2, 4, 6];

export function parseGridColumns(value: unknown): GridColumns {
    return value === 2 || value === '2' ? 2 : value === 6 || value === '6' ? 6 : 4;
}

export function maxGridColumns(viewportWidth: number): GridColumns {
    if (viewportWidth < 768) return 2;
    if (viewportWidth < 1200) return 4;
    return 6;
}

export function effectiveGridColumns(preferred: GridColumns, viewportWidth: number): GridColumns {
    return Math.min(preferred, maxGridColumns(viewportWidth)) as GridColumns;
}

/** CMS/editorial pages only. All commerce, account and payment pages stay in flow. */
export function usesRevealHeader(pathname: string): boolean {
    const path = pathname.replace(/\/+$/, '') || '/';
    return path === '/' || path === '/custom-tailoring' || path === '/size-guide' || path.startsWith('/pages/');
}

export type HeaderMode = 'flow' | 'hidden' | 'revealed';
export interface HeaderScrollState {
    mode: HeaderMode;
    previousY: number;
    direction: -1 | 0 | 1;
    distance: number;
}

/** Direction hysteresis avoids flickering on trackpads and elastic overscroll. */
export function nextHeaderState(
    previous: HeaderScrollState,
    scrollY: number,
    naturalBottom: number,
    enabled: boolean,
    pinned = false,
): HeaderScrollState {
    const y = Math.max(0, Number.isFinite(scrollY) ? scrollY : 0);
    if (!enabled || y <= naturalBottom) {
        return { mode: 'flow', previousY: y, direction: 0, distance: 0 };
    }
    if (pinned) return { mode: 'revealed', previousY: y, direction: 0, distance: 0 };
    const delta = y - previous.previousY;
    if (Math.abs(delta) < 1) return { ...previous, previousY: y, mode: previous.mode === 'flow' ? 'hidden' : previous.mode };
    const direction = delta > 0 ? 1 : -1;
    const distance = previous.direction === direction ? previous.distance + Math.abs(delta) : Math.abs(delta);
    const mode = distance >= 12 ? (direction === 1 ? 'hidden' : 'revealed') : previous.mode === 'flow' ? 'hidden' : previous.mode;
    return { mode, previousY: y, direction, distance };
}

/** Repeat query keys are retained for the backend's fabricTypes array. */
export function setCatalogFilter(search: string, key: string, values: string | string[]): string {
    const params = new URLSearchParams(search);
    params.delete(key);
    const input = Array.isArray(values) ? values : [values];
    for (const value of [...new Set(input.filter(Boolean))]) params.append(key, value);
    if (key !== 'page') params.delete('page');
    return params.toString();
}

export function removeCatalogFilter(search: string, key: string, value?: string): string {
    const params = new URLSearchParams(search);
    const remaining = value === undefined ? [] : params.getAll(key).filter(item => item !== value);
    return setCatalogFilter(search, key, remaining);
}

export function clearCatalogFilters(search: string): string {
    const original = new URLSearchParams(search);
    const clean = new URLSearchParams();
    for (const key of ['q', 'sort', 'fabric']) {
        const value = original.get(key);
        if (value) clean.set(key, value);
    }
    return clean.toString();
}

export interface ImageBox { width: number; height: number }
/** Same viewport frame, original proportions. No forced stretching or fake detail. */
export function containImage(image: ImageBox, frame: ImageBox): ImageBox {
    if (image.width <= 0 || image.height <= 0 || frame.width <= 0 || frame.height <= 0) return { width: 0, height: 0 };
    const scale = Math.min(frame.width / image.width, frame.height / image.height);
    return { width: image.width * scale, height: image.height * scale };
}
