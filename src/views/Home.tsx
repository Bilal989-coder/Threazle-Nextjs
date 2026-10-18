'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight, Ruler, Scissors, Shirt, Sparkles } from 'lucide-react';
import type { Category, Fabric, Product } from '@/types';
import type { Banner } from '@/api/contracts';
import { config, isDemo, features, safeInternalPath } from '@/lib/config';
import { Photo, ProductVisual, FabricSwatch } from '@/components/Photo';
import { ProductShelf } from '@/components/ProductShelf';
import { carouselLength, carouselPosition } from '@/lib/catalog-presentation';
import { ButtonLink, Eyebrow, SectionTitle, EmptyState, Note } from '@/components/ui';
interface Props {
    categories: Category[];
    arrivals: Product[];
    favorites: Product[];
    fabrics: Fabric[];
    banners: Banner[];
    editorialImage?: string;
}
export default function Home({ categories, arrivals, favorites, fabrics, banners, editorialImage }: Props) {
    const [slide, setSlide] = useState(0);
    const story = [
        { tag: 'THE OCCASION EDIT', title: <>Tradition, woven<br />into <em>your story.</em></>, text: 'Considered silhouettes. Quiet details. Menswear for the moments that become memories.' },
        { tag: 'THE EVERYDAY EDIT', title: <>A little heritage.<br />An <em>everyday feeling.</em></>, text: 'Soft shades. Enduring forms. Discover a new expression of the familiar.' },
        { tag: 'PERSONAL BY DESIGN', title: <>Not just made.<br /><em>Made for you.</em></>, text: features.customization ? 'Choose a design, find your fabric and make the details your own.' : 'Find a considered design and choose the ready-made size that fits you.' }
    ];
    const count = carouselLength(banners.length, story.length);
    const position = carouselPosition(slide, count);
    const current = story[position % story.length], heroProduct = arrivals[position % Math.max(arrivals.length, 1)], banner = banners[position];
    // The admin CMS stores a banner's focal point on its URL as `#focus=<0-100>` (percent from the top).
    const rawHero = banner?.image || config.heroImage || heroProduct?.images[0]?.url || '/images/placeholder.svg';
    const focusMatch = /#focus=(\d{1,3})$/.exec(rawHero);
    const heroImage = rawHero.replace(/#focus=\d{1,3}$/, '');
    const heroFocus = focusMatch ? Math.min(100, Number(focusMatch[1])) : undefined;
    const heroLink = banner?.link ? safeInternalPath(banner.link, '/new-arrivals') : heroProduct ? `/product/${heroProduct.slug}` : '/new-arrivals';
    return <>
    <section className='hero' aria-label='Featured collections'>
      <div className='hero-left'><div className='hero-content'><Eyebrow>{current.tag}</Eyebrow><h1>{current.title}</h1><p>{current.text}</p><div className='hero-buttons'><ButtonLink href='/new-arrivals?mode=ready_made' className='button-ivory'>Shop ready-made</ButtonLink><Link href={features.customization ? '/custom-tailoring' : '/size-guide'} className='hero-custom'>{features.customization ? 'Stitch / Customize' : 'Find your size'} <ArrowUpRight size={18}/></Link></div><div className='hero-bottom'><span>PERSONAL IN EXPRESSION.</span><div className='hero-controls'><button aria-label='Previous featured collection' disabled={count < 2} onClick={() => setSlide(carouselPosition(position - 1, count))}><ChevronLeft size={18}/></button><span aria-live='polite'>{String(position + 1).padStart(2, '0')} <i /> {String(count).padStart(2, '0')}</span><button aria-label='Next featured collection' disabled={count < 2} onClick={() => setSlide(carouselPosition(position + 1, count))}><ChevronRight size={18}/></button></div></div></div></div>
      <div className='hero-right'><span className='hero-vertical'>A NEW EXPRESSION OF HERITAGE</span><div className='hero-photo' key={heroImage}><Photo name={heroImage} alt={banner?.title || heroProduct?.images[0]?.alt || 'Threazle collection — photography pending'} priority={slide === 0} sizes='(max-width:640px) 100vw,50vw' style={heroFocus !== undefined ? { objectPosition: `center ${heroFocus}%` } : undefined}/></div><div className='hero-art-caption'><span>THE THREAZLE COLLECTION</span><span>{String(position + 1).padStart(2, '0')} / THE DETAILS MATTER</span></div><Link href={heroLink} className='hero-product-link'><span>{banner?.title || heroProduct?.name || 'Discover the collection'}<small>Explore the design</small></span><ArrowUpRight size={24}/></Link></div>
    </section>
    <div className='value-strip'><div><Scissors size={18}/><span>{features.customization ? 'Ready-made & made-to-measure' : 'Ready-made, thoughtfully designed'}</span></div><div><Ruler size={18}/><span>A fit that starts with you</span></div><div><Sparkles size={18}/><span>Traditional roots. Modern expression.</span></div></div>
    
    <section className='section container'><SectionTitle eyebrow='FIND YOUR EXPRESSION' title='A wardrobe, rooted in heritage.' text='From everyday rituals to extraordinary occasions.'/><div className='category-grid'>{categories.filter(c => !c.parentId).map(c => <Link href={`/category/${c.slug}`} key={c.id} className='category-card'><div><Photo name={c.thumbnailImage || c.heroImage || '/images/placeholder.svg'} alt={`${c.name} collection`} sizes='(max-width:640px) 45vw,20vw'/><span className='category-arrow'><ArrowUpRight size={20}/></span></div><h3>{c.name}</h3><p>{c.description || 'Explore the collection'}</p></Link>)}</div></section>
    <section className='section section-alt'><div className='container'><SectionTitle eyebrow='NEW CHAPTERS' title='The latest, thoughtfully chosen.' href='/new-arrivals' link='Shop new arrivals'/>{arrivals.length ? <ProductShelf products={arrivals} label='New arrivals'/> : <EmptyState title='A new chapter is coming.' text='No published designs are available just yet.' href='/pages/contact' label='Get in touch'/>}</div></section>
    {features.customization ? <section className='tailoring-story container section'><div className='tailoring-image'><div className='arch-outline'/><Photo name={editorialImage || heroImage} alt='An editorial detail from the Threazle collection' sizes='(max-width:640px) 100vw,45vw'/><div className='small-story-card'><Scissors size={30}/><span>THE DETAILS<br />MAKE IT YOURS.</span></div></div><div className='tailoring-copy'><Eyebrow>YOUR STYLE. YOUR SIGNATURE.</Eyebrow><h2>Some things<br />should fit <em>only you.</em></h2><p>A collar you love. A fabric that feels right. Measurements that tell your story. Custom tailoring begins with your choices.</p><div className='story-steps'><div><Shirt size={22}/><small>01</small><span>Choose your design</span></div><div><Scissors size={22}/><small>02</small><span>Make it personal</span></div><div><Ruler size={22}/><small>03</small><span>Find your fit</span></div></div><ButtonLink href='/custom-tailoring'>Discover custom tailoring</ButtonLink></div></section> : <section className='tailoring-story container section'>
        <div className='tailoring-image'><div className='arch-outline' /><Photo name={editorialImage || heroImage} alt='A detail from the ready-made collection' sizes='(max-width:640px) 100vw,45vw' /></div>
        <div className='tailoring-copy'><Eyebrow>CONSIDERED. READY TO WEAR.</Eyebrow><h2>Find your<br /><em>everyday signature.</em></h2><p>Explore our ready-made collection, choose your standard size and see availability before you order. Cash on delivery keeps checkout simple.</p><div className='story-steps'><div><Shirt size={22} /><small>01</small><span>Choose a design</span></div><div><Ruler size={22} /><small>02</small><span>Find your size</span></div><div><Sparkles size={22} /><small>03</small><span>Make it yours</span></div></div><ButtonLink href='/shop'>Explore ready-made</ButtonLink></div>
    </section>}
    {features.customization && fabrics.length > 0 && <section className='fabric-section'><div className='container'><SectionTitle eyebrow='THE FABRIC OF YOUR STORY' title='It all starts with a feeling.' href='/fabrics' link='Explore the fabric library'/><div className='fabric-preview-grid'>{fabrics.slice(0, 4).map(f => <Link key={f.id} href={`/fabrics/${f.slug}`}><FabricSwatch color={f.colorHex} image={f.swatchImage} name={f.name}/><div><h3>{f.name}</h3><ArrowUpRight size={19}/></div><p>{f.type} · {f.composition}</p></Link>)}</div></div></section>}
    {favorites.length > 0 && <section className='section container'><SectionTitle eyebrow='THE CONSIDERED EDIT' title='Pieces to return to.' text='Selected favorites from the catalog.' href='/new-arrivals'/><ProductShelf products={favorites} label='Selected favorites'/></section>}
    <section className='quote-section'><div className='container'><Eyebrow>THE THREAZLE PERSPECTIVE</Eyebrow><blockquote>A little of where we come from.<br />A little of <em>who we become.</em></blockquote><span className='quote-credit'>THE COLLECTION, IN OUR OWN WORDS</span><Link href='/pages/about' className='text-link'>Discover Threazle <ArrowUpRight size={16}/></Link></div></section>
  </>;
}
