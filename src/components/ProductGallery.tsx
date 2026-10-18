'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Expand, Minus, Plus, X } from 'lucide-react';
import type { Product } from '@/types';
import { Photo } from './Photo';
import { FALLBACK_METADATA, PLACEHOLDER_IMAGE, largestPhoto, photoIdentity, photoMetadata } from '@/lib/media';
import { containImage } from '@/lib/storefront-ui';

interface GalleryImage { source: string; alt: string }
interface View { scale: number; x: number; y: number }
interface Point { x: number; y: number }
const INITIAL_VIEW: View = { scale: 1, x: 0, y: 0 };

export function ProductGallery({ product }: { product: Product }) {
    const images = useMemo<GalleryImage[]>(() => {
        const seen = new Set<string>();
        const photos = product.images.filter(image => {
            const identity = photoIdentity(image.url);
            if (seen.has(identity)) return false;
            seen.add(identity);
            return true;
        }).map((image, index) => ({ source: image.url, alt: image.alt || `${product.name} — view ${index + 1}` }));
        return photos.length ? photos : [{ source: PLACEHOLDER_IMAGE, alt: `${product.name} — photograph unavailable` }];
    }, [product.images, product.name]);
    const [index, setIndex] = useState(0);
    const [viewer, setViewer] = useState<number | null>(null);
    const track = useRef<HTMLDivElement>(null);
    const active = Math.min(index, images.length - 1);
    const activeRef = useRef(active);
    activeRef.current = active;
    const drag = useRef({ x: 0, y: 0, moved: false });

    const goTo = useCallback((nextIndex: number, smooth = true) => {
        const next = (nextIndex + images.length) % images.length;
        setIndex(next);
        activeRef.current = next;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        track.current?.scrollTo({ left: next * track.current.clientWidth, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
    }, [images.length]);

    useEffect(() => {
        setIndex(0);
        activeRef.current = 0;
        setViewer(null);
        track.current?.scrollTo({ left: 0, behavior: 'auto' });
    }, [product.id]);

    useEffect(() => {
        const element = track.current;
        if (!element) return;
        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const next = Math.min(images.length - 1, Math.max(0, Math.round(element.scrollLeft / Math.max(1, element.clientWidth))));
                setIndex(next);
            });
        };
        const observer = new ResizeObserver(() => {
            element.scrollTo({ left: activeRef.current * element.clientWidth, behavior: 'auto' });
        });
        observer.observe(element);
        element.addEventListener('scroll', onScroll, { passive: true });
        return () => { observer.disconnect(); element.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
    }, [images.length]);

    return (
        <div className='pg' role='region' aria-label={`${product.name} image gallery`} onKeyDown={event => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                goTo(active + (event.key === 'ArrowRight' ? 1 : -1));
            }
        }}>
            {images.length > 1 && (
                <div className='pg-thumbs' aria-label='Product photos'>
                    {images.map((image, i) => (
                        <button type='button' key={image.source} aria-pressed={i === active} aria-label={`Show photo ${i + 1} of ${images.length}`} className={i === active ? 'is-active' : ''} onClick={() => goTo(i)}>
                            <Photo name={image.source} alt='' sizes='(max-width:960px) 64px, 76px' fit='cover' />
                        </button>
                    ))}
                </div>
            )}
            <div className='pg-stage'>
                <div
                    className='pg-track'
                    ref={track}
                    aria-roledescription='carousel'
                    aria-label='Product photographs'
                    onPointerDownCapture={event => { drag.current = { x: event.clientX, y: event.clientY, moved: false }; }}
                    onPointerMoveCapture={event => {
                        if (event.pointerType === 'mouse' && event.buttons === 0) return;
                        if (Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 10) drag.current.moved = true;
                    }}
                    onClickCapture={event => {
                        // Keyboard-generated clicks (detail === 0) must remain available.
                        if (event.detail !== 0 && drag.current.moved) { event.preventDefault(); event.stopPropagation(); }
                        drag.current.moved = false;
                    }}
                >
                    {images.map((image, i) => (
                        <ZoomSlide key={image.source} image={image} index={i} total={images.length} active={i === active} onOpen={() => setViewer(i)} />
                    ))}
                </div>
                {images.length > 1 && <>
                    <button type='button' className='pg-arrow pg-prev' aria-label='Previous photo' onClick={() => goTo(active - 1)}><ChevronLeft size={20} /></button>
                    <button type='button' className='pg-arrow pg-next' aria-label='Next photo' onClick={() => goTo(active + 1)}><ChevronRight size={20} /></button>
                </>}
                <span className='pg-count' aria-live='polite'>{active + 1} / {images.length}</span>
                <button type='button' className='pg-expand' aria-label='Open full-screen view' onClick={() => setViewer(active)}><Expand size={17} /></button>
            </div>
            <p className='pg-caption'><span className='pg-caption-desktop'>Hover to zoom · click for full screen</span><span className='pg-caption-touch'>Swipe for more · tap to zoom</span></p>
            {viewer !== null && <Lightbox images={images} title={product.name} start={viewer} onClose={next => { setViewer(null); goTo(next, false); }} />}
        </div>
    );
}

const HOVER_ZOOM = 2.5;

/** One photo slide. With a mouse on desktop, a high-resolution copy magnifies around the cursor. */
function ZoomSlide({ image, index, total, active, onOpen }: { image: GalleryImage; index: number; total: number; active: boolean; onOpen: () => void }) {
    const [zooming, setZooming] = useState(false);
    const lens = useRef<HTMLImageElement>(null);
    const origin = useRef('50% 50%');
    const canZoom = image.source !== PLACEHOLDER_IMAGE;
    function track(event: ReactPointerEvent<HTMLButtonElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
        origin.current = `${x}% ${y}%`;
        if (lens.current) lens.current.style.transformOrigin = origin.current;
    }
    return (
        <button
            type='button'
            className={`pg-slide ${zooming ? 'is-zooming' : ''}`}
            tabIndex={active ? 0 : -1}
            aria-label={`Enlarge photo ${index + 1} of ${total}`}
            onClick={onOpen}
            onPointerEnter={event => {
                if (!canZoom || event.pointerType !== 'mouse' || !window.matchMedia('(min-width: 961px) and (hover: hover)').matches) return;
                track(event);
                setZooming(true);
            }}
            onPointerMove={event => { if (zooming) track(event); }}
            onPointerLeave={() => setZooming(false)}
        >
            <Photo name={image.source} alt={image.alt} priority={index === 0} sizes='(max-width:767px) 100vw, (max-width:960px) calc(100vw - 64px), (max-width:1504px) 46vw, 644px' fit='cover' />
            {zooming && (
                // eslint-disable-next-line @next/next/no-img-element
                <img ref={lens} className='pg-lens' src={largestPhoto(image.source)} alt='' aria-hidden='true' draggable={false} style={{ transform: `scale(${HOVER_ZOOM})`, transformOrigin: origin.current }} />
            )}
        </button>
    );
}

function Lightbox({ images, title, start, onClose }: { images: GalleryImage[]; title: string; start: number; onClose: (index: number) => void }) {
    const [index, setIndex] = useState(start);
    const [view, setView] = useState<View>(INITIAL_VIEW);
    const [frame, setFrame] = useState({ width: 0, height: 0 });
    const [natural, setNatural] = useState<{ source: string; width: number; height: number } | null>(null);
    const [failed, setFailed] = useState<string | null>(null);
    const dialog = useRef<HTMLDialogElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const pointers = useRef(new Map<number, Point>());
    const viewRef = useRef(view);
    viewRef.current = view;
    const gesture = useRef({ origin: { x: 0, y: 0 }, midpoint: { x: 0, y: 0 }, distance: 0, initial: INITIAL_VIEW, moved: false, wasPinch: false, lastTap: 0 });
    const image = images[index];
    const source = failed === image.source ? PLACEHOLDER_IMAGE : largestPhoto(image.source);
    const metadata = photoMetadata(image.source) || FALLBACK_METADATA;
    const dimensions = natural?.source === source ? natural : metadata;
    const box = containImage(dimensions, { width: Math.max(0, frame.width - 32), height: Math.max(0, frame.height - 32) });
    // Enlarging beyond native pixels does not reveal more detail. Cap accordingly.
    const maxZoom = source === PLACEHOLDER_IMAGE || !box.width ? 1 : Math.max(1, Math.min(4, dimensions.width / box.width));

    useEffect(() => {
        const previousFocus = document.activeElement as HTMLElement | null;
        const oldOverflow = document.body.style.overflow;
        dialog.current?.showModal();
        document.body.style.overflow = 'hidden';
        return () => {
            dialog.current?.close();
            document.body.style.overflow = oldOverflow;
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, []);

    useEffect(() => {
        const element = stage.current;
        if (!element) return;
        const update = () => setFrame({ width: element.clientWidth, height: element.clientHeight });
        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const clamp = useCallback((candidate: View): View => {
        const scale = Math.min(maxZoom, Math.max(1, candidate.scale));
        const maxX = Math.max(0, (box.width * scale - frame.width) / 2);
        const maxY = Math.max(0, (box.height * scale - frame.height) / 2);
        return { scale, x: Math.min(maxX, Math.max(-maxX, candidate.x)), y: Math.min(maxY, Math.max(-maxY, candidate.y)) };
    }, [box.width, box.height, frame.width, frame.height, maxZoom]);

    useEffect(() => { setView(current => clamp(current)); }, [clamp]);
    const local = useCallback((point: Point) => {
        const bounds = stage.current?.getBoundingClientRect();
        return bounds ? { x: point.x - bounds.left - bounds.width / 2, y: point.y - bounds.top - bounds.height / 2 } : { x: 0, y: 0 };
    }, []);
    const zoomAt = useCallback((scale: number, point: Point = { x: 0, y: 0 }) => {
        setView(current => {
            const ratio = Math.min(maxZoom, Math.max(1, scale)) / current.scale;
            return clamp({ scale: current.scale * ratio, x: point.x - (point.x - current.x) * ratio, y: point.y - (point.y - current.y) * ratio });
        });
    }, [clamp, maxZoom]);

    function go(delta: number) {
        setIndex(current => (current + delta + images.length) % images.length);
        setView(INITIAL_VIEW);
        pointers.current.clear();
    }

    function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
        if ((event.target as HTMLElement).closest('button')) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const g = gesture.current;
        g.initial = viewRef.current;
        g.origin = { x: event.clientX, y: event.clientY };
        g.moved = false;
        g.wasPinch = pointers.current.size > 1;
        if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            g.distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
            g.midpoint = local({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        }
    }

    function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        if (!pointers.current.has(event.pointerId)) return;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const g = gesture.current;
        if (Math.hypot(event.clientX - g.origin.x, event.clientY - g.origin.y) > 8) g.moved = true;
        if (pointers.current.size >= 2) {
            const [a, b] = [...pointers.current.values()];
            const midpoint = local({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
            const scale = Math.min(maxZoom, Math.max(1, g.initial.scale * Math.hypot(a.x - b.x, a.y - b.y) / g.distance));
            const ratio = scale / g.initial.scale;
            setView(clamp({ scale, x: midpoint.x - (g.midpoint.x - g.initial.x) * ratio, y: midpoint.y - (g.midpoint.y - g.initial.y) * ratio }));
        } else if (g.initial.scale > 1) {
            setView(clamp({ ...g.initial, x: g.initial.x + event.clientX - g.origin.x, y: g.initial.y + event.clientY - g.origin.y }));
        }
    }

    function pointerUp(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
        if (!pointers.current.has(event.pointerId)) return;
        pointers.current.delete(event.pointerId);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        const g = gesture.current;
        if (pointers.current.size) {
            g.origin = [...pointers.current.values()][0];
            g.initial = viewRef.current;
            g.moved = true;
            g.wasPinch = true;
            return;
        }
        if (cancelled || g.wasPinch) return;
        const deltaX = event.clientX - g.origin.x;
        const deltaY = event.clientY - g.origin.y;
        if (g.initial.scale === 1 && g.moved && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) { go(deltaX < 0 ? 1 : -1); return; }
        if (g.moved) return;
        const now = Date.now();
        if (event.pointerType === 'mouse' || now - g.lastTap < 300) {
            viewRef.current.scale > 1 ? setView(INITIAL_VIEW) : zoomAt(Math.min(2, maxZoom), local({ x: event.clientX, y: event.clientY }));
            g.lastTap = 0;
        } else g.lastTap = now;
    }

    useEffect(() => {
        const element = stage.current;
        if (!element) return;
        const wheel = (event: WheelEvent) => {
            event.preventDefault();
            zoomAt(viewRef.current.scale * (event.deltaY < 0 ? 1.12 : 1 / 1.12), local({ x: event.clientX, y: event.clientY }));
        };
        element.addEventListener('wheel', wheel, { passive: false });
        return () => element.removeEventListener('wheel', wheel);
    }, [zoomAt, local]);

    return (
        <dialog ref={dialog} className='lightbox' aria-label={`${title} — full-screen photos`} onCancel={event => { event.preventDefault(); onClose(index); }} onKeyDown={event => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); event.stopPropagation(); go(event.key === 'ArrowRight' ? 1 : -1); }
            if (event.key === '+' || event.key === '=') zoomAt(view.scale + 0.5);
            if (event.key === '-') zoomAt(view.scale - 0.5);
            if (event.key === '0') setView(INITIAL_VIEW);
        }}>
            <div className='lb-top'>
                <span className='lb-title'>{title}<small>{index + 1} / {images.length}</small></span>
                <div className='lb-tools'>
                    <button aria-label='Zoom out' disabled={view.scale <= 1} onClick={() => zoomAt(view.scale - 0.5)}><Minus size={18} /></button>
                    <span aria-live='polite'>{Math.round(view.scale * 100)}%</span>
                    <button aria-label='Zoom in' disabled={view.scale >= maxZoom - 0.01} onClick={() => zoomAt(view.scale + 0.5)}><Plus size={18} /></button>
                    <button aria-label='Close full-screen view' onClick={() => onClose(index)}><X size={22} /></button>
                </div>
            </div>
            <div ref={stage} className={`lb-stage ${view.scale > 1 ? 'is-zoomed' : ''}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => pointerUp(event)} onPointerCancel={event => pointerUp(event, true)}>
                <img
                    key={source}
                    className='lb-img'
                    src={source}
                    alt={image.alt}
                    draggable={false}
                    onLoad={event => setNatural({ source, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                    onError={() => { setFailed(image.source); setView(INITIAL_VIEW); }}
                    style={{ width: box.width || 'auto', height: box.height || 'auto', transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
                />
                {images.length > 1 && <>
                    <button className='lb-arrow lb-prev' aria-label='Previous full-screen photo' onClick={() => go(-1)}><ChevronLeft size={26} /></button>
                    <button className='lb-arrow lb-next' aria-label='Next full-screen photo' onClick={() => go(1)}><ChevronRight size={26} /></button>
                </>}
                <span className='lb-hint'>{view.scale > 1 ? 'Drag to explore · double-tap to reset' : maxZoom > 1 ? 'Pinch, double-tap or use + to see the details' : 'Full photograph · maximum available resolution'}</span>
            </div>
            {images.length > 1 && <div className='lb-thumbs'>{images.map((item, i) => <button key={item.source} aria-label={`Show full-screen photo ${i + 1}`} aria-pressed={i === index} className={i === index ? 'is-active' : ''} onClick={() => { setIndex(i); setView(INITIAL_VIEW); }}><Photo name={item.source} alt='' sizes='64px' fit='cover' /></button>)}</div>}
        </dialog>
    );
}
