'use client';
import { PLACEHOLDER_IMAGE } from '@/lib/media';
import { config } from '@/lib/config';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Ruler, Scissors, Shirt, Sparkles } from 'lucide-react';
import type { Category } from '@/types';
import { Breadcrumbs, ButtonLink, Eyebrow, Note, SectionTitle } from '@/components/ui';
import { Photo } from '@/components/Photo';
import { MeasurementGuide } from '@/components/MeasurementGuide';
export function TailoringGuide() {
    return <div className='container tailoring-page'><Breadcrumbs items={[{ label: 'Custom tailoring' }]}/><div className='editorial-intro'><div><Eyebrow>YOUR STYLE. YOUR SIGNATURE.</Eyebrow><h1>A little more<br /><em>made for you.</em></h1><p>A fabric that feels right. Details you return to. A fit that starts with your measurements.</p><ButtonLink href='/shop?mode=stitch'>Explore custom designs</ButtonLink></div><div><Photo name={config.heroImage || PLACEHOLDER_IMAGE} alt='Close-up of hand-finished embroidery on an ivory sherwani collar' sizes='(max-width:640px) 100vw,45vw'/></div></div><section className='section'><SectionTitle eyebrow='THE WAY TO YOUR PERFECT PIECE' title='Four steps. Entirely personal.'/><div className='how-grid'>{[{ icon: Shirt, title: 'Choose your style', text: 'Begin with a customizable design, then choose its available collar, cut or style variation.' }, { icon: Scissors, title: 'Find your fabric', text: 'Explore the materials configured for your design. The price updates as you choose.' }, { icon: Ruler, title: 'Make it fit', text: 'Enter the measurements requested by the garment’s guide, or use your saved category profile.' }, { icon: Sparkles, title: 'Finish the details', text: 'Add available extras and a note. Review the full specification before adding it to your bag.' }].map((item, i) => <article key={item.title}><span>0{i + 1}</span><item.icon size={27}/><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section><div className='guide-cta'><h2>Good measurements make a difference.</h2><p>Follow your garment’s actual field labels and units. Unsure where to measure? Ask before ordering.</p><ButtonLink href='/size-guide' secondary>Open the measurement guide</ButtonLink></div><Note>Stitching estimates come from the configured category. Delivery follows production; express delivery does not itself shorten stitching time.</Note><div className='row-actions'><Link className='text-link' href='/pages/returns'>Custom-order returns information<ArrowRight size={15}/></Link><Link className='text-link' href='/pages/contact'>Ask a question<ArrowRight size={15}/></Link></div></div>;
}
export function SizeGuide({ categories }: {
    categories: Category[];
}) {
    const params = useSearchParams(), [slug, setSlug] = useState(params.get('category') || categories[0]?.slug || '');
    const category = categories.find(c => c.slug === slug) || categories[0];
    return <div className='container size-guide-page'>
        <Breadcrumbs items={[{ label: 'Size & measurements' }]}/>
        <div className='page-heading'><Eyebrow>THE DETAILS OF A GOOD FIT</Eyebrow><h1>Measure with confidence.</h1><p>Choose your garment, then follow the numbered points. Each number on the drawing matches a step in the list.</p></div>
        <div className='category-tabs' role='tablist' aria-label='Measurement category'>{categories.map(c => <button key={c.id} role='tab' className={category?.id === c.id ? 'active' : ''} aria-selected={category?.id === c.id} onClick={() => setSlug(c.slug)}>{c.name}</button>)}</div>
        {category
            ? <section className='size-guide-board' aria-label={`${category.name} measurement guide`}>
                <div className='size-guide-board-head'><h2>{category.name}</h2><span>{category.measurementFields.length} measurements · {category.measurementFields[0]?.unit === 'cm' ? 'centimetres' : 'inches'}</span></div>
                <MeasurementGuide key={category.id} fields={category.measurementFields} categoryName={category.name}/>
            </section>
            : <Note>Measurement guides will appear here once garment categories are set up.</Note>}
        <div className='guide-cta'><h2>Not sure about a measurement?</h2><p>Send us a message before you order. Our tailor will walk you through it.</p><ButtonLink href='/pages/contact' secondary>Talk to our tailor</ButtonLink></div>
    </div>;
}
