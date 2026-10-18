'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { lockDialogScroll } from '@/lib/dialog-scroll';
import { ArrowRight, ChevronRight, House, Info, X, RefreshCw } from 'lucide-react';
export function Eyebrow({ children }: {
    children: ReactNode;
}) { return <span className='eyebrow'>{children}</span>; }
export function ButtonLink({ href, children, secondary = false, className = '', onClick }: {
    href: string;
    children: ReactNode;
    secondary?: boolean;
    className?: string;
    onClick?: () => void;
}) { return <Link href={href} onClick={onClick} className={`button ${secondary ? 'button-outline' : ''} ${className}`}>{children}<ArrowRight size={16}/></Link>; }
export function Breadcrumbs({ items }: {
    items: {
        label: string;
        href?: string;
    }[];
}) { return <nav aria-label='Breadcrumb' className='breadcrumbs'><Link href='/' aria-label='Home' className='breadcrumb-home'><House size={16}/></Link>{items.map((item, i) => <span key={i}><ChevronRight size={12}/>{item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current='page'>{item.label}</span>}</span>)}</nav>; }
export function SectionTitle({ eyebrow, title, text, href, link = 'Explore the collection' }: {
    eyebrow?: string;
    title: string;
    text?: string;
    href?: string;
    link?: string;
}) { return <div className='section-title'><div>{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}<h2>{title}</h2>{text && <p>{text}</p>}</div>{href && <Link href={href} className='text-link'>{link}<ArrowRight size={17}/></Link>}</div>; }
export function Note({ children }: {
    children: ReactNode;
}) { return <div className='demo-note'><Info size={16}/><span>{children}</span></div>; }
export function EmptyState({ title, text, href = '/shop', label = 'Explore the collection' }: {
    title: string;
    text: string;
    href?: string;
    label?: string;
}) { return <div className='empty-state'><span className='empty-monogram'>T</span><h2>{title}</h2><p>{text}</p><ButtonLink href={href}>{label}</ButtonLink></div>; }
export function ErrorState({ error, retry }: {
    error: Error | string;
    retry?: () => void;
}) { return <div className='service-error' role='alert'><h2>A small pause.</h2><p>{typeof error === 'string' ? error : error.message}</p>{retry && <button className='button button-outline' onClick={retry}><RefreshCw size={16}/>Try again</button>}</div>; }
export function Loading({ label = 'Loading the collection…' }: {
    label?: string;
}) { return <div className='loading-state' role='status'><span className='loading-line'/>{label}</div>; }
export function Field({ label, children, hint }: {
    label: string;
    children: ReactNode;
    hint?: string;
}) { return <label className='field'><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Modal({ title, children, onClose, drawer = false, className = '' }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    drawer?: boolean;
    className?: string;
}) {
    const ref = useRef<HTMLDialogElement>(null), heading = useId();
    useEffect(() => {
        const d = ref.current, previous = document.activeElement as HTMLElement | null;
        const unlock = lockDialogScroll(document);
        if (d && !d.open)
            d.showModal();
        return () => { d?.close(); unlock(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
    }, []);
    return <dialog ref={ref} className={`modal ${drawer ? 'drawer' : ''} ${className}`} aria-labelledby={heading} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => {
            const box = e.currentTarget.getBoundingClientRect();
            if (e.target === e.currentTarget && (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom)) onClose();
        }}><div className='modal-content'><div className='modal-heading'><h3 id={heading}>{title}</h3><button className='icon-button' aria-label='Close dialog' onClick={onClose}><X size={21}/></button></div>{children}</div></dialog>;
}
