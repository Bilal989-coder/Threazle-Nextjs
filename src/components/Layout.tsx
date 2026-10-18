'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ArrowUpRight, ChevronDown, Heart, Menu, MessageCircle, Search, ShoppingBag, User, X } from 'lucide-react';
import type { Category } from '@/types';
import { useStore } from '@/context/store';
import { useAuth } from '@/providers/AuthProvider';
import { config, isDemo, features } from '@/lib/config';
import { money, subtotal } from '@/lib/commerce';
import { getProducts } from '@/api/catalog';
import { subscribe } from '@/api/forms';
import { useResource } from '@/hooks/useResource';
import { useHeaderBehavior } from '@/hooks/useHeaderBehavior';
import { useMounted } from '@/hooks/useMounted';
import { Photo } from './Photo';
import { MobileNavigation } from './MobileNavigation';
import { badgeCount, navigationCollections, searchHref } from '@/lib/navigation';
import { ButtonLink, ErrorState, Loading, Modal } from './ui';
export default function Layout({ children, categories }: {
    children: ReactNode;
    categories: Category[];
}) {
    const store = useStore(), { user } = useAuth(), pathname = usePathname(), params = useSearchParams(), router = useRouter();
    const [mobile, setMobile] = useState(false), [menu, setMenu] = useState(''), [search, setSearch] = useState(false), [query, setQuery] = useState(''), [searchTerm, setSearchTerm] = useState('');
    const [email, setEmail] = useState(''), [submitting, setSubmitting] = useState(false), [newsletterMessage, setNewsletterMessage] = useState('');
    const rootCollections = navigationCollections(categories).map(item => item.category);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null), header = useRef<HTMLElement>(null), menuButton = useRef<HTMLButtonElement | null>(null);
    const headerSlot = useRef<HTMLDivElement>(null);
    const [headerFocused, setHeaderFocused] = useState(false);
    const mounted = useMounted();
    const headerBehavior = useHeaderBehavior(pathname, header, headerSlot, Boolean(menu || mobile || search || store.bagOpen || headerFocused));
    const saved = mounted && store.hydrated ? store.wishlist.length : 0, count = mounted ? store.cart.reduce((sum, i) => sum + i.quantity, 0) : 0, active = categories.find(c => c.slug === menu);
    function cancelClose() {
        if (closeTimer.current)
            clearTimeout(closeTimer.current);
    }
    function scheduleClose() { cancelClose(); closeTimer.current = setTimeout(() => setMenu(''), 260); }
    useEffect(() => () => cancelClose(), []);
    // Every new page starts at the top (filters and sorting on the same page keep their position).
    useEffect(() => {
        if (window.location.hash) return;
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }, [pathname]);
    useEffect(() => { cancelClose(); setMenu(''); setMobile(false); setSearch(false); setHeaderFocused(false); store.setBagOpen(false); }, [pathname, params.toString()]);
    useEffect(() => { const t = setTimeout(() => setSearchTerm(query.trim()), 250); return () => clearTimeout(t); }, [query]);
    const suggestions = useResource(search && searchTerm.length >= 2 ? `search:${searchTerm}` : null, signal => getProducts({ search: searchTerm, pageSize: 6 }, signal));
    async function subscribeEmail(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (submitting)
            return;
        setSubmitting(true);
        setNewsletterMessage('');
        try {
            if (isDemo) {
                setNewsletterMessage('Subscriptions are temporarily unavailable. Please try again later.');
            }
            else {
                await subscribe(email);
                setEmail('');
                setNewsletterMessage('Your subscription request has been received.');
            }
        }
        catch (e) {
            setNewsletterMessage((e as Error).message);
        }
        finally {
            setSubmitting(false);
        }
    }
    return <><a className='skip-link' href='#main'>Skip to content</a><div className='announcement'><span>A modern expression of tradition.</span><span className='announcement-right'>READY-MADE & MADE TO MEASURE<i />PKR · PAKISTAN</span></div>
    <div ref={headerSlot} className='site-header-slot'>
    <header ref={header} className={`header header-stable header--${headerBehavior.mode}`} data-header-behavior={headerBehavior.enabled ? 'scroll-reveal' : 'normal'} data-header-mode={headerBehavior.mode} data-animate={headerBehavior.animate} onPointerEnter={cancelClose} onPointerLeave={scheduleClose} onFocusCapture={() => setHeaderFocused(true)} onBlur={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setHeaderFocused(false);
                scheduleClose();
            }
        }} onKeyDown={e => {
            if (e.key === 'Escape') {
                setMenu('');
                menuButton.current?.focus();
            }
        }}>
      <div className='header-main container'><div className='header-left'><div className='mobile-header-actions'><button className='icon-button' aria-label='Open navigation' aria-haspopup='dialog' aria-expanded={mobile} onClick={() => { setMenu(''); setMobile(true); }}><Menu size={22}/></button><button className='icon-button' aria-label='Search products' aria-haspopup='dialog' onClick={() => { setMenu(''); setSearch(true); }}><Search size={20}/></button></div>{features.customization && <Link href='/custom-tailoring' className='header-tailoring'>MADE FOR YOU</Link>}</div><Link href='/' className='wordmark' aria-label='Threazle home'><Image src='/brand/logo-mark.webp' width={27} height={26} alt='' className='brand-mark'/>THREAZLE<span>THREADS OF TRADITION</span></Link><div className='header-actions'><button aria-label='Search products' className='icon-button desktop-only' onClick={() => { setMenu(''); setSearch(true); }}><Search size={20}/></button><Link href={mounted && user ? '/account' : '/account/login'} aria-label='My account' className='icon-button desktop-only'><User size={20}/></Link><Link href='/account/wishlist' aria-label={`My wishlist, ${saved} saved`} className='icon-button wishlist-trigger desktop-only'><Heart size={20} fill={saved ? 'currentColor' : 'none'}/>{saved > 0 && <span className='count-badge' aria-hidden='true'>{badgeCount(saved)}</span>}</Link><button className='icon-button bag-trigger' aria-label={`Open shopping bag, ${count} items`} onClick={() => { setMenu(''); store.setBagOpen(true); }}><ShoppingBag size={20}/>{count > 0 && <span className='count-badge'>{badgeCount(count)}</span>}</button></div></div>
      <nav className='desktop-nav' aria-label='Main navigation'><Link href='/new-arrivals' onPointerEnter={() => setMenu('')}>New arrivals</Link>{rootCollections.map(c => <button key={c.id} aria-expanded={menu === c.slug} aria-controls='collection-menu' className={menu === c.slug ? 'active' : ''} onPointerEnter={e => {
                if (e.pointerType === 'mouse') {
                    cancelClose();
                    setMenu(c.slug);
                }
            }} onClick={e => { cancelClose(); menuButton.current = e.currentTarget; setMenu(v => v === c.slug ? '' : c.slug); }} onFocus={e => { menuButton.current = e.currentTarget; cancelClose(); }} onKeyDown={e => {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMenu(c.slug);
                    requestAnimationFrame(() => header.current?.querySelector<HTMLAnchorElement>('#collection-menu a')?.focus());
                }
            }}>{c.name}<ChevronDown size={12}/></button>)}{features.customization && <Link href='/fabrics' onPointerEnter={() => setMenu('')}>Fabrics</Link>}<Link href='/sale' className='sale-link' onPointerEnter={() => setMenu('')}>Sale</Link></nav>
      {active && <div id='collection-menu' className='mega-menu' onPointerEnter={cancelClose}><div className='container mega-inner'><div><span className='eyebrow'>THE COLLECTION</span><h2>{active.name}</h2>{active.description && <p className='mega-intro'>{active.description}</p>}<Link className='text-link' href={`/category/${active.slug}`}>Explore all {active.name}<ArrowRight size={15}/></Link></div><div><h4>SHOP YOUR WAY</h4><Link href={`/category/${active.slug}?mode=ready_made`}>Ready-made</Link><Link href={`/category/${active.slug}?mode=stitch`}>Stitch / Customize</Link><Link href='/size-guide'>Find your fit</Link></div><div><h4>EXPLORE THE DETAILS</h4><Link href={`/category/${active.slug}?fabricTypes=Cotton`}>Cotton</Link><Link href={`/category/${active.slug}?fabricTypes=Jamawar`}>Jamawar</Link>{features.customization && <Link href={`/fabrics?categoryId=${encodeURIComponent(active.id)}`}>Compatible fabrics</Link>}</div><Link href={`/category/${active.slug}`} className='mega-editorial'><Photo name={active.thumbnailImage || active.heroImage || '/images/placeholder.svg'} alt={`${active.name} collection`} sizes='(max-width:1440px) 22vw, 330px'/><span>Shop the {active.name.toLowerCase()} edit<ArrowUpRight size={16}/></span></Link></div></div>}
    </header>
    </div>
    {active && <button className='menu-scrim' aria-label='Close collection menu' tabIndex={-1} onClick={() => setMenu('')}/>}
    <main id='main'>{children}</main>
    <section className='newsletter'><div className='container newsletter-inner'><div><span className='eyebrow'>LET THE NEXT CHAPTER FIND YOU</span><h2>A little Threazle, in your inbox.</h2></div><div><form onSubmit={subscribeEmail}><label className='sr-only' htmlFor='newsletter-email'>Email address</label><input id='newsletter-email' type='email' autoComplete='email' placeholder='Your email address' required maxLength={254} value={email} onChange={e => setEmail(e.target.value)}/><button disabled={submitting} aria-label='Subscribe to newsletter'><ArrowRight size={23}/></button></form><small>New collections and considered details. Subscribe only with your own email.</small>{newsletterMessage && <p role='status'>{newsletterMessage}</p>}</div></div></section>
    <footer className='container'><div className='footer-grid'><div className='footer-brand'><Link href='/' className='wordmark'>THREAZLE<span>THREADS OF TRADITION</span></Link><p>A little heritage.<br />An expression of you.</p><span className='footer-tag'>READY-MADE · MADE TO MEASURE</span></div><div><h3 className='footer-heading'>THE COLLECTIONS</h3>{categories.slice(0, 6).map(c => <Link key={c.id} href={`/category/${c.slug}`}>{c.name}</Link>)}<Link href='/new-arrivals'>New arrivals</Link></div><div><h3 className='footer-heading'>HERE TO HELP</h3>{features.customization && <Link href='/custom-tailoring'>Custom tailoring</Link>}<Link href='/size-guide'>Measurement guide</Link><Link href='/track-order'>Track your order</Link><Link href='/pages/contact'>Contact us</Link><Link href='/pages/faqs'>FAQs</Link></div><div><h3 className='footer-heading'>THE DETAILS</h3><Link href='/pages/about'>Our story</Link><Link href='/pages/shipping'>Shipping information</Link><Link href='/pages/returns'>Returns & exchanges</Link><Link href='/pages/privacy'>Privacy</Link><Link href='/account'>My account</Link></div><div className='footer-contact'><h3 className='footer-heading'>GET IN TOUCH</h3>{config.whatsapp && <a href={`https://wa.me/${config.whatsapp}`} target='_blank' rel='noopener noreferrer'>WhatsApp +{config.whatsapp}</a>}{config.supportPhone && <a href={`tel:${config.supportPhone.replace(/[^\d+]/g, '')}`}>{config.supportPhone}</a>}{config.supportEmail && <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>}{config.businessAddress && <span>{config.businessAddress}</span>}<Link href='/pages/contact'>Contact form</Link>{(config.instagram || config.facebook || config.tiktok) && <div className='footer-social'>{config.instagram && <a href={config.instagram} target='_blank' rel='noopener noreferrer'>Instagram</a>}{config.facebook && <a href={config.facebook} target='_blank' rel='noopener noreferrer'>Facebook</a>}{config.tiktok && <a href={config.tiktok} target='_blank' rel='noopener noreferrer'>TikTok</a>}</div>}</div></div><div className='footer-bottom'><span>© {new Date().getFullYear()} Threazle. All rights reserved.</span><span>PKR · Delivering across Pakistan</span></div></footer>
    {config.whatsapp ? <a className='support-float' href={`https://wa.me/${config.whatsapp}`} target='_blank' rel='noopener noreferrer' aria-label='Chat on WhatsApp'><MessageCircle size={23}/></a> : <Link href='/pages/contact' className='support-float' aria-label='Contact Threazle'><MessageCircle size={23}/></Link>}
    {store.notice && <div className='toast' role='status'>{store.notice}<button aria-label='Dismiss notification' onClick={() => store.notify('')}><X size={16}/></button></div>}
    {mobile && <MobileNavigation categories={categories} signedIn={mounted && !!user} savedCount={saved} onClose={() => setMobile(false)} />}
    {search && <Modal title='Find your expression' onClose={() => setSearch(false)}><form className='search-form' onSubmit={e => {
                e.preventDefault();
                const href = searchHref(query);
                if (href) { setSearch(false); router.push(href); }
            }}><input aria-label='Search the collection' autoFocus value={query} maxLength={150} onChange={e => setQuery(e.target.value)} placeholder='Sherwani, cotton, a favorite design…'/><button className='icon-button' aria-label='Submit search'><Search size={22}/></button></form><div className='search-suggestions'>{suggestions.loading ? <Loading label='Finding your pieces…'/> : suggestions.error ? <ErrorState error={suggestions.error} retry={suggestions.refresh}/> : suggestions.data?.items.map(p => <Link key={p.id} href={`/product/${p.slug}`} onClick={() => setSearch(false)}><span>{p.name}</span><span>{money(p.salePrice ?? p.basePrice)}<ArrowUpRight size={16}/></span></Link>)}{suggestions.data?.total === 0 && <p>No designs matched “{searchTerm}”. Try another name.</p>}{!searchTerm && categories.map(c => <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setSearch(false)}>{c.name}<ArrowRight size={16}/></Link>)}</div></Modal>}
    {store.bagOpen && <Modal title={`Your bag (${count})`} drawer onClose={() => store.setBagOpen(false)}>{store.cart.length ? <><div className='mini-lines'>{store.cart.map(item => <div className='mini-line' key={item.id}><Photo name={item.productImage} alt={item.productName} sizes='90px' fit='cover'/><div><Link href={`/product/${item.productSlug}`} onClick={() => store.setBagOpen(false)}>{item.productName}</Link><p>{item.mode === 'stitch' ? 'Custom stitched' : `Size ${item.sizeLabel}`} · Qty {item.quantity}</p><strong>{money(item.unitPrice * item.quantity)}</strong><button className='text-button' onClick={() => store.removeItem(item.id)}>Remove</button></div></div>)}</div><div className='summary-row'><span>Subtotal</span><strong>{money(subtotal(store.cart))}</strong></div><p className='muted'>Shipping and final prices are confirmed at checkout.</p><ButtonLink href='/cart' className='full-width' onClick={() => store.setBagOpen(false)}>View your bag</ButtonLink><ButtonLink href='/checkout' secondary className='full-width' onClick={() => store.setBagOpen(false)}>Continue to checkout</ButtonLink></> : <div className='mini-empty'><ShoppingBag size={32}/><h3>A story waiting to begin.</h3><p>Your bag is currently empty.</p><ButtonLink href='/shop' onClick={() => store.setBagOpen(false)}>Explore the collection</ButtonLink></div>}</Modal>}
  </>;
}
