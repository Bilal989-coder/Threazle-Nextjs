'use client';
import { useEffect, useState } from 'react';
/** False during server render and the first client render; true right after. Keeps browser-only state (saved items, bag) out of hydration. */
export function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}
