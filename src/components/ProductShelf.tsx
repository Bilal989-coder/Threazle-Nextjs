'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

/** A manual, touch-scrollable carousel: all supplied shelf products remain reachable. */
export function ProductShelf({ products, label }: { products: Product[]; label: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const id = useId();
    const [limits, setLimits] = useState({ previous: false, next: false });
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const update = () => setLimits({ previous: element.scrollLeft > 2, next: element.scrollLeft + element.clientWidth < element.scrollWidth - 2 });
        update();
        element.addEventListener('scroll', update, { passive: true });
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => { element.removeEventListener('scroll', update); observer.disconnect(); };
    }, [products]);
    function move(direction: number) {
        const element = ref.current;
        if (!element) return;
        element.scrollBy({ left: element.clientWidth * direction, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
    return (
        <div className='product-shelf' role='region' aria-label={label} aria-roledescription='carousel'>
            <div className='product-shelf-controls'>
                <button type='button' aria-label={`Previous ${label.toLowerCase()}`} aria-controls={id} disabled={!limits.previous} onClick={() => move(-1)}><ArrowLeft size={18} /></button>
                <button type='button' aria-label={`Next ${label.toLowerCase()}`} aria-controls={id} disabled={!limits.next} onClick={() => move(1)}><ArrowRight size={18} /></button>
            </div>
            <div id={id} ref={ref} className='product-shelf-track' tabIndex={0} aria-label={`${label} products`}>
                {products.map(product => <ProductCard product={product} key={product.id} sizes='(max-width:640px) 46vw, (max-width:960px) 30vw, 23vw' />)}
            </div>
        </div>
    );
}
