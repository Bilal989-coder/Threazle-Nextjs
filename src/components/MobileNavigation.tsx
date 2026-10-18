'use client';
import { features } from '@/lib/config';


import { useId, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, Heart, Package, Ruler, Search, Scissors, User, HelpCircle } from 'lucide-react';
import type { Category } from '@/types';
import { navigationCollections, badgeCount, searchHref } from '@/lib/navigation';
import { Photo } from './Photo';
import { Modal } from './ui';

interface Props {
    categories: Category[];
    savedCount: number;
    signedIn: boolean;
    onClose: () => void;
}

/** Customer navigation, separate from the bag drawer. All links use the existing routes. */
export function MobileNavigation({ categories, savedCount, signedIn, onClose }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const id = useId();
    const [expanded, setExpanded] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const collections = navigationCollections(categories);

    function followSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const href = searchHref(query);
        if (!href) return;
        onClose();
        router.push(href);
    }

    return (
        <Modal title='Explore Threazle' drawer className='navigation-drawer' onClose={onClose}>
            <div className='mobile-navigation'>
                <p className='mobile-nav-intro'>Considered pieces. A personal expression.</p>
                <form className='mobile-nav-search' role='search' onSubmit={followSearch}>
                    <Search size={18} aria-hidden='true' />
                    <label className='sr-only' htmlFor={`${id}-search`}>Search collections and designs</label>
                    <input id={`${id}-search`} type='search' maxLength={150} value={query}
                        onChange={event => setQuery(event.target.value)} placeholder='Find your next piece…'
                        autoComplete='off' enterKeyHint='search' />
                    <button type='submit' aria-label='Search collections and designs'><ArrowRight size={18} /></button>
                </form>
                <nav aria-label='Mobile main navigation'>
                    <div className='mobile-nav-edits'>
                        <Link href='/new-arrivals' onClick={onClose} aria-current={pathname === '/new-arrivals' ? 'page' : undefined}>
                            New arrivals <ArrowRight size={15} />
                        </Link>
                        <Link href='/sale' onClick={onClose} aria-current={pathname === '/sale' ? 'page' : undefined}>
                            The sale edit <ArrowRight size={15} />
                        </Link>
                    </div>
                    <div className='mobile-nav-section-label'><span>The collections</span><Link href='/shop' onClick={onClose}>View all</Link></div>
                    <ul className='mobile-collection-list'>
                        {collections.map(({ category, children }, index) => {
                            const isOpen = expanded === category.id;
                            const current = pathname === `/category/${category.slug}`;
                            const panelId = `${id}-collection-${index}`;
                            const href = `/category/${encodeURIComponent(category.slug)}`;
                            return (
                                <li key={category.id} className={`mobile-collection ${isOpen ? 'is-expanded' : ''} ${current ? 'is-current' : ''}`}>
                                    <button type='button' className='mobile-collection-toggle' aria-expanded={isOpen}
                                        aria-controls={panelId} onClick={() => setExpanded(isOpen ? null : category.id)}>
                                        <span className='mobile-collection-photo' aria-hidden='true'>
                                            <Photo name={category.thumbnailImage || category.heroImage || '/images/placeholder.svg'} alt='' sizes='52px' quality={75} />
                                        </span>
                                        <span className='mobile-collection-label'><strong>{category.name}</strong><small>Explore the collection</small></span>
                                        <ChevronDown className='mobile-collection-chevron' size={18} aria-hidden='true' />
                                    </button>
                                    <div id={panelId} hidden={!isOpen} className='mobile-collection-panel'>
                                        <Link className='mobile-browse-collection' href={href} onClick={onClose} aria-current={current ? 'page' : undefined}>Shop all {category.name}<ArrowRight size={15} /></Link>
                                        <div className='mobile-mode-links'>
                                            <Link href={`${href}?mode=ready_made`} onClick={onClose}>Ready-made</Link>
                                            <Link href={`${href}?mode=stitch`} onClick={onClose}>Stitch / Customize</Link>
                                        </div>
                                        {children.length > 0 && <div className='mobile-child-links'>{children.map(child => <Link key={child.id} href={`/category/${encodeURIComponent(child.slug)}`} onClick={onClose}>{child.name}<ArrowRight size={14} /></Link>)}</div>}
                                        {features.customization && <Link href={`/fabrics?categoryId=${encodeURIComponent(category.id)}`} onClick={onClose}>Explore compatible fabrics<ArrowRight size={14} /></Link>}
                                        <Link href={`/size-guide?category=${encodeURIComponent(category.slug)}`} onClick={onClose}>Size & measurement guide<Ruler size={15} /></Link>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {collections.length === 0 && <p className='muted'>Collections are loading or temporarily unavailable. You can still search or browse new arrivals.</p>}
                    {features.customization && <Link href='/fabrics' className='mobile-fabric-link' onClick={onClose}><span>Find your fabric<small>The starting point of something personal</small></span><ArrowRight size={19} /></Link>}
                    {features.customization && <Link className='mobile-tailoring-callout' href='/custom-tailoring' onClick={onClose}>
                        <Scissors size={24} aria-hidden='true' /><span><strong>Made for you.</strong><small>Discover custom tailoring</small></span><ArrowRight size={19} />
                    </Link>}
                </nav>
                <nav aria-label='Mobile account and support' className='mobile-utility-grid'>
                    <Link href={signedIn ? '/account' : '/account/login'} onClick={onClose}><User size={20} /><span>{signedIn ? 'My account' : 'Sign in'}</span></Link>
                    <Link href='/account/wishlist' onClick={onClose}><Heart size={20} /><span>Saved pieces {savedCount > 0 && <b className='mobile-saved-count'>{badgeCount(savedCount)}</b>}</span></Link>
                    <Link href='/track-order' onClick={onClose}><Package size={20} /><span>Track order</span></Link>
                    <Link href='/pages/contact' onClick={onClose}><HelpCircle size={20} /><span>Need a hand?</span></Link>
                </nav>
                <div className='mobile-nav-bottom'><span>PAKISTAN · PKR</span><Link href='/pages/about' onClick={onClose}>Our story <ArrowRight size={13} /></Link></div>
            </div>
        </Modal>
    );
}
