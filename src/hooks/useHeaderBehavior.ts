'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { nextHeaderState, usesRevealHeader, type HeaderMode, type HeaderScrollState } from '@/lib/storefront-ui';

/** Measures the natural header slot. Never adds scrolling behavior to commerce routes. */
export function useHeaderBehavior(
    pathname: string,
    header: RefObject<HTMLElement | null>,
    slot: RefObject<HTMLDivElement | null>,
    pinned: boolean,
) {
    const enabled = usesRevealHeader(pathname);
    const pinnedRef = useRef(pinned);
    pinnedRef.current = pinned;
    const [presentation, setPresentation] = useState<{ pathname: string; mode: HeaderMode; animate: boolean }>({ pathname, mode: 'flow', animate: false });

    useEffect(() => {
        const element = header.current;
        const wrapper = slot.current;
        if (!element || !wrapper) return;
        let frame = 0;
        let state: HeaderScrollState = { mode: 'flow', previousY: window.scrollY, direction: 0, distance: 0 };
        const measure = () => {
            wrapper.style.setProperty('--measured-header-height', `${element.offsetHeight}px`);
        };
        const update = () => {
            frame = 0;
            const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const y = Math.min(maxY, Math.max(0, window.scrollY));
            const naturalBottom = wrapper.getBoundingClientRect().top + y + wrapper.offsetHeight;
            const previousMode = state.mode;
            state = nextHeaderState(state, y, naturalBottom, enabled, pinnedRef.current);
            if (state.mode !== previousMode) {
                setPresentation({ pathname, mode: state.mode, animate: previousMode !== 'flow' && state.mode !== 'flow' });
            }
        };
        const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
        measure();
        setPresentation({ pathname, mode: 'flow', animate: false });
        const observer = new ResizeObserver(() => { measure(); schedule(); });
        observer.observe(element);
        // No scroll listener at all on listing/detail/checkout/account pages.
        if (enabled) window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
        if (enabled) update();
        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, [pathname, enabled, header, slot]);

    // Route changes render a normal header immediately, before effects run.
    const mode = enabled && presentation.pathname === pathname ? presentation.mode : 'flow';
    return { mode, enabled, animate: mode !== 'flow' && presentation.animate };
}
