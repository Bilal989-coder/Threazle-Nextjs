'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Heart, Scissors } from 'lucide-react';
import { getDisplayPrice, type Product } from '@/types';
import { useStore } from '@/context/store';
import { useMounted } from '@/hooks/useMounted';
import { money } from '@/lib/commerce';
import { ProductVisual } from './Photo';
import { ButtonLink, Modal } from './ui';
export function ProductCard({ product, categoryLabel, sizes, priority = false }: {
    product: Product;
    categoryLabel?: string;
    sizes?: string;
    priority?: boolean;
}) {
    const store = useStore(), [quick, setQuick] = useState(false);
    const mounted = useMounted(), saved = mounted && store.wishlist.includes(product.id), price = getDisplayPrice(product), href = `/product/${product.slug}`;
    return <><article className='product-card'><div className='product-visual'><Link href={href} aria-label={`View ${product.name}`} tabIndex={-1}><ProductVisual product={product} sizes={sizes} priority={priority}/>{product.images.length > 1 && <div className='product-hover-art' aria-hidden='true'><ProductVisual product={product} index={1} sizes={sizes}/></div>}</Link>{(price.original || product.isNew) && <span className='product-badge'>{price.original ? 'On sale' : 'New arrival'}</span>}<button className={`icon-button wishlist-button ${saved ? 'is-saved' : ''}`} aria-label={`${saved ? 'Remove' : 'Save'} ${product.name} ${saved ? 'from' : 'to'} wishlist`} aria-pressed={saved} onClick={() => void store.toggleWishlist(product)}><Heart size={18} fill={saved ? 'currentColor' : 'none'}/></button><button className='quick-view' onClick={() => setQuick(true)}>Quick view<ArrowUpRight size={15}/></button></div><div className='product-card-meta'><span>{categoryLabel || (product.isReadymade ? 'Ready to wear' : 'Made to measure')}</span>{product.isCustomizable && <span><Scissors size={13}/>Customizable</span>}</div><Link className='product-name' href={href}>{product.name}</Link><div className='product-price'><span>{price.from ? 'From ' : ''}{money(price.price)}</span>{price.original && <del>{money(price.original)}</del>}</div></article>{quick && <Modal title='A closer look' onClose={() => setQuick(false)}><div className='quick-grid'><div className='quick-visual'><ProductVisual product={product} sizes='(max-width:640px) 90vw,330px'/></div><div><span className='eyebrow'>THE THREAZLE COLLECTION</span><h2>{product.name}</h2><p>{product.shortDescription}</p><p className='price'>{price.from ? 'From ' : ''}{money(price.price)}</p><ButtonLink href={href} onClick={() => setQuick(false)}>Explore the details</ButtonLink></div></div></Modal>}</>;
}
