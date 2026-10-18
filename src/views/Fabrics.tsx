'use client';
import { useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Category, Fabric, PaginatedResult } from '@/types';
import { money } from '@/lib/commerce';
import { FabricSwatch, Photo } from '@/components/Photo';
import { Breadcrumbs, ButtonLink, EmptyState, Eyebrow, Field, Note, Modal } from '@/components/ui';
export function FabricLibrary({ data, categories, types }: {
    data: PaginatedResult<Fabric>;
    categories: Category[];
    types: string[];
}) {
    const query = useSearchParams(), router = useRouter(), [search, setSearch] = useState(query.get('search') || ''), [pending, start] = useTransition();
    const [preview, setPreview] = useState<Fabric | null>(null);
    useEffect(() => { setSearch(query.get('search') || ''); }, [query]);
    function update(key: string, value: string) {
        const q = new URLSearchParams(query.toString());
        value ? q.set(key, value) : q.delete(key);
        if (key !== 'page')
            q.delete('page');
        start(() => router.push(`/fabrics?${q}`, { scroll: false }));
    }
    return <div className='container fabrics-page'><Breadcrumbs items={[{ label: 'Fabric library' }]}/><div className='page-heading'><Eyebrow>THE FABRIC OF YOUR STORY</Eyebrow><h1>It starts with a feeling.</h1><p>Discover textures, colors and materials for a garment that feels like you.</p></div><div className='fabric-toolbar'><form onSubmit={e => { e.preventDefault(); update('search', search); }}><Field label='Search fabrics'><input value={search} onChange={e => setSearch(e.target.value)} placeholder='A fabric name or texture…'/></Field><button className='button compact'>Search</button></form><Field label='Garment'><select value={query.get('categoryId') || ''} onChange={e => update('categoryId', e.target.value)}><option value=''>All garments</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label='Fabric type'><select value={query.get('type') || ''} onChange={e => update('type', e.target.value)}><option value=''>All types</option>{types.map(t => <option key={t}>{t}</option>)}</select></Field><Field label='Availability'><select value={query.get('stockStatus') || ''} onChange={e => update('stockStatus', e.target.value)}><option value=''>All</option><option value='in_stock'>In stock</option><option value='low_stock'>Low stock</option></select></Field></div><p className='muted' aria-live='polite'>{pending ? 'Updating fabrics…' : `${data.total} fabrics`}</p><div className={pending ? 'fabric-library-grid is-pending' : 'fabric-library-grid'} aria-busy={pending}>{data.items.map(f => <article className='fabric-card-wrap' key={f.id}><Link className='fabric-card' href={`/fabrics/${f.slug}`}><div><FabricSwatch image={f.swatchImage} name={f.name} color={f.colorHex}/><span className='category-arrow'><ArrowUpRight size={18}/></span></div><span className='eyebrow'>{f.type} · {f.color}</span><h3>{f.name}</h3><p>{f.composition}</p><strong>{money(f.price)}<small> / {f.priceUnit.replaceAll('_', ' ')}</small></strong><span className='stock-label'>{f.stockStatus.replaceAll('_', ' ')}</span></Link><button type='button' className='fabric-preview-button' onClick={() => setPreview(f)} aria-label={`Quick look at ${f.name}`}>Quick look<ArrowUpRight size={15}/></button></article>)}</div>{!data.items.length && <EmptyState title='Nothing in this weave.' text='Try another type, search or category.' href='/fabrics' label='See all fabrics'/>}{data.totalPages > 1 && <nav className='pagination' aria-label='Fabric pages'><button className='button button-outline compact' disabled={pending || data.page === 1} onClick={() => update('page', String(data.page - 1))}><ArrowLeft size={15}/>Previous</button><span>{data.page} / {data.totalPages}</span><button className='button button-outline compact' disabled={pending || data.page >= data.totalPages} onClick={() => update('page', String(data.page + 1))}>Next<ArrowRight size={15}/></button></nav>}{preview && <Modal title={preview.name} onClose={() => setPreview(null)}><div className='fabric-quick-look'><div className='fabric-quick-swatch'><FabricSwatch color={preview.colorHex} image={preview.swatchImage || preview.images[0]} name={preview.name}/></div><Eyebrow>{preview.type} · {preview.color}</Eyebrow><p>{preview.composition}</p><p>{preview.description}</p><p className='price'>{money(preview.price)} <small>/ {preview.priceUnit.replaceAll('_', ' ')}</small></p><p className='stock-label'>{preview.stockStatus.replaceAll('_', ' ')}</p><ButtonLink href={`/fabrics/${preview.slug}`} onClick={() => setPreview(null)}>Choose a compatible design</ButtonLink></div></Modal>}</div>;
}
export function FabricDetail({ fabric: f, categories }: {
    fabric: Fabric;
    categories: Category[];
}) {
    const compatible = categories.filter(c => f.compatibleCategoryIds.includes(c.id));
    return <div className='container fabric-detail-page'><Breadcrumbs items={[{ label: 'Fabrics', href: '/fabrics' }, { label: f.name }]}/><div className='fabric-detail-grid'><div className='fabric-detail-photo'><FabricSwatch image={f.swatchImage || f.images[0]} name={f.name} color={f.colorHex}/></div><div><Eyebrow>{f.type.toUpperCase()} · {f.color.toUpperCase()}</Eyebrow><h1>{f.name}</h1><p className='price'>{money(f.price)} <small> / {f.priceUnit.replaceAll('_', ' ')}</small></p><p>{f.description}</p><p><strong>Composition</strong><br />{f.composition}</p><p className='stock-label'>{f.stockStatus.replaceAll('_', ' ')}</p><h3>Start with a design.</h3><p>Choose a compatible garment category. This fabric is carried forward when you open a design that offers it.</p><div className='fabric-category-links'>{compatible.map(c => <ButtonLink key={c.id} href={`/category/${c.slug}?mode=stitch&fabric=${encodeURIComponent(f.id)}`} secondary>{c.name}</ButtonLink>)}</div>{f.stockStatus === 'out_of_stock' && <Note>This fabric cannot currently be selected for a new garment.</Note>}{!compatible.length && <Note>No compatible categories are configured yet. Please contact us before ordering.</Note>}<small>The final garment price is calculated on its product page, using the selected design, material and extras.</small></div></div></div>;
}
