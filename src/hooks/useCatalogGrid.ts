'use client';
import { useEffect, useState } from 'react';
import { GRID_STORAGE_KEY, effectiveGridColumns, maxGridColumns, parseGridColumns, type GridColumns } from '@/lib/storefront-ui';

export function useCatalogGrid() {
    const [preferred, setPreferred] = useState<GridColumns>(4);
    const [viewportWidth, setViewportWidth] = useState(1440);
    useEffect(() => {
        try { setPreferred(parseGridColumns(window.localStorage.getItem(GRID_STORAGE_KEY))); }
        catch { /* Private browsing/storage restrictions never block the catalog. */ }
        const measure = () => setViewportWidth(window.innerWidth);
        measure();
        window.addEventListener('resize', measure, { passive: true });
        const sync = (event: StorageEvent) => {
            if (event.key === GRID_STORAGE_KEY) setPreferred(parseGridColumns(event.newValue));
        };
        window.addEventListener('storage', sync);
        return () => { window.removeEventListener('resize', measure); window.removeEventListener('storage', sync); };
    }, []);
    function select(columns: GridColumns) {
        setPreferred(columns);
        try { window.localStorage.setItem(GRID_STORAGE_KEY, String(columns)); }
        catch { /* The current session still retains its selected view. */ }
    }
    return { columns: effectiveGridColumns(preferred, viewportWidth), maximum: maxGridColumns(viewportWidth), select };
}
