'use client';
import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import type { Category, PaginatedResult, Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { Breadcrumbs, EmptyState, Field, Modal, Note } from '@/components/ui';
import { useCatalogGrid } from '@/hooks/useCatalogGrid';
import { GRID_CHOICES, clearCatalogFilters, removeCatalogFilter, setCatalogFilter } from '@/lib/storefront-ui';
import { money } from '@/lib/commerce';
import { searchHref } from '@/lib/navigation';
import { features } from '@/lib/config';

interface CatalogProps {
    data: PaginatedResult<Product>;
    categories: Category[];
    title: string;
    description: string;
    fabricTypes?: string[];
}

function GridGlyph({ columns }: { columns: number }) {
    return (
        <svg width='21' height='19' viewBox={`0 0 ${columns * 4 + 1} 19`} fill='none' aria-hidden='true'>
            {Array.from({ length: columns }, (_, i) => <rect key={i} x={i * 4 + 0.5} y='1.5' width='3' height='16' rx='0.2' stroke='currentColor' strokeWidth='0.8' />)}
        </svg>
    );
}

export default function Catalog({ data, categories, title, description, fabricTypes = [] }: CatalogProps) {
    const router = useRouter();
    const pathname = usePathname();
    const query = useSearchParams();
    const [pending, startTransition] = useTransition();
    const [drawer, setDrawer] = useState(false);
    const [searchText, setSearchText] = useState(query.get('q') || '');
    useEffect(() => { setSearchText(query.get('q') || ''); }, [query]);
    const [low, setLow] = useState(query.get('priceMin') || '');
    const [high, setHigh] = useState(query.get('priceMax') || '');
    const [priceError, setPriceError] = useState('');
    const grid = useCatalogGrid();
    const queryLow = query.get('priceMin') || '';
    const queryHigh = query.get('priceMax') || '';
    const search = query.toString();
    const selectedFabrics = query.getAll('fabricTypes');
    const selectedSizes = query.getAll('sizes');
    // Standard letter sizes plus any other size (e.g. chest 40) present in the current results.
    const sizeChoices = [...new Set(['S', 'M', 'L', 'XL', 'XXL', ...data.items.flatMap(product => product.readyMadeSizes.map(size => size.sizeLabel)), ...selectedSizes])];
    const selectedFabric = query.get('fabric');
    const saleRoute = pathname === '/sale';
    const currentMode = query.get('mode') || '';
    const categoryNames = new Map(categories.map(category => [category.id, category.name]));

    useEffect(() => {
        setLow(queryLow);
        setHigh(queryHigh);
        setPriceError('');
    }, [queryLow, queryHigh]);

    function navigate(next: string) {
        startTransition(() => router.push(`${pathname}${next ? `?${next}` : ''}`, { scroll: false }));
    }

    function update(key: string, value: string | string[]) {
        navigate(setCatalogFilter(search, key, value));
    }

    // Collection switcher: works the same on /new-arrivals and on /category/* pages.
    const onCategoryRoute = pathname.startsWith('/category/');
    const currentCollection = onCategoryRoute ? pathname.split('/')[2] || '' : query.get('categorySlug') || '';
    function changeCollection(slug: string) {
        const rest = new URLSearchParams(search);
        rest.delete('categorySlug');
        rest.delete('page');
        const qs = rest.toString();
        if (onCategoryRoute) {
            startTransition(() => router.push(`${slug ? `/category/${slug}` : '/shop'}${qs ? `?${qs}` : ''}`));
        } else {
            update('categorySlug', slug);
        }
    }

    function goToPage(page: number) {
        startTransition(() => router.push(`${pathname}?${setCatalogFilter(search, 'page', String(page))}`, { scroll: true }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function clear() {
        setLow('');
        setHigh('');
        setPriceError('');
        navigate(clearCatalogFilters(search));
    }

    function applyPrice(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const from = low === '' ? undefined : Number(low);
        const to = high === '' ? undefined : Number(high);
        if ((from !== undefined && (!Number.isFinite(from) || from < 0)) ||
            (to !== undefined && (!Number.isFinite(to) || to < 0)) ||
            (from !== undefined && to !== undefined && from > to)) {
            setPriceError('Enter a valid minimum and maximum price.');
            return;
        }
        setPriceError('');
        navigate(setCatalogFilter(setCatalogFilter(search, 'priceMin', low), 'priceMax', high));
    }

    const chips = [...query.entries()].filter(([key]) => ['mode', 'priceMin', 'priceMax', 'fabricTypes', 'sizes', 'categorySlug', 'onSaleOnly'].includes(key));
    const priceLimit = Math.max(50000, ...data.items.map(product => Math.ceil(product.basePrice / 5000) * 5000), Number(high) || 0, Number(low) || 0);
    const imageSizes = grid.columns === 2
        ? '(max-width:767px) calc((100vw - 48px) / 2), (max-width:960px) calc((100vw - 72px) / 2), (max-width:1504px) calc((100vw - 312px) / 2), 596px'
        : grid.columns === 6
            ? '(max-width:767px) calc((100vw - 48px) / 2), (max-width:1199px) 23vw, (max-width:1504px) calc((100vw - 400px) / 6), 184px'
            : '(max-width:767px) calc((100vw - 48px) / 2), (max-width:960px) 23vw, (max-width:1504px) calc((100vw - 352px) / 4), 288px';

    function chipLabel(key: string, value: string) {
        if (key === 'mode') return value === 'stitch' ? 'Stitch / Customize' : 'Ready-made';
        if (key === 'priceMin') return `From ${money(Number(value))}`;
        if (key === 'priceMax') return `Up to ${money(Number(value))}`;
        if (key === 'categorySlug') return categories.find(category => category.slug === value)?.name || value;
        if (key === 'onSaleOnly') return 'On sale';
        if (key === 'sizes') return `Size ${value}`;
        return value;
    }

    const filters = (
        <>
            <div className='filter-heading'><h2>Refine your edit</h2><button type='button' onClick={clear}>Clear all</button></div>
            {(
                <fieldset className='catalog-filter-group'>
                    <legend>Collection</legend>
                    <Field label='Select a collection'>
                        <select value={currentCollection} onChange={event => changeCollection(event.target.value)}>
                            <option value=''>All collections</option>
                            {categories.map(category => <option key={category.id} value={category.slug}>{category.name}</option>)}
                        </select>
                    </Field>
                </fieldset>
            )}
            {features.customization && <fieldset className='catalog-filter-group'>
                <legend>Shop your way</legend>
                {(features.customization ? [['ready_made', 'Ready-made'], ['stitch', 'Stitch / Customize']] : [['ready_made', 'Ready-made']]).map(([value, label]) => (
                    <label className='catalog-filter-check' key={value}>
                        <input type='checkbox' checked={currentMode === value} onChange={event => update('mode', event.target.checked ? value : '')} />
                        <span>{label}</span>
                    </label>
                ))}
            </fieldset>}
            <fieldset className='catalog-filter-group'>
                <legend>Size in stock</legend>
                <div className='size-filter-options'>
                    {sizeChoices.map(size => (
                        <label className={`size-filter-chip ${selectedSizes.includes(size) ? 'selected' : ''}`} key={size}>
                            <input type='checkbox' className='sr-only' checked={selectedSizes.includes(size)} onChange={event => update('sizes', event.target.checked ? [...selectedSizes, size] : selectedSizes.filter(value => value !== size))} />
                            <span>{size}</span>
                        </label>
                    ))}
                </div>
            </fieldset>
            {features.customization && fabricTypes.length > 0 && (
                <fieldset className='catalog-filter-group'>
                    <legend>Fabric</legend>
                    {fabricTypes.map(fabric => (
                        <label className='catalog-filter-check' key={fabric}>
                            <input type='checkbox' checked={selectedFabrics.includes(fabric)} onChange={event => update('fabricTypes', event.target.checked ? [...selectedFabrics, fabric] : selectedFabrics.filter(value => value !== fabric))} />
                            <span>{fabric}</span>
                        </label>
                    ))}
                </fieldset>
            )}
            <form className='catalog-price-filter' onSubmit={applyPrice}>
                <fieldset className='catalog-filter-group'>
                    <legend>Price range</legend>
                    <p className='filter-price-caption'>{high ? `Up to ${money(Number(high))}` : 'Any price'}<span>Base design price</span></p>
                    <input type='range' aria-label='Maximum base price' min='0' max={priceLimit} step='100' value={high === '' ? priceLimit : Number(high)} onChange={event => setHigh(event.target.value)} />
                    <div className='range-labels'><span>{money(0)}</span><span>{money(priceLimit)}</span></div>
                    <div className='price-range-inputs'>
                        <Field label='Minimum'><input type='number' min='0' step='1' inputMode='numeric' value={low} onChange={event => setLow(event.target.value)} placeholder='0' /></Field>
                        <Field label='Maximum'><input type='number' min='0' step='1' inputMode='numeric' value={high} onChange={event => setHigh(event.target.value)} placeholder='Any' /></Field>
                    </div>
                    {priceError && <p className='field-error' role='alert'>{priceError}</p>}
                    <button className='button button-outline compact full-width' disabled={pending}>Apply price</button>
                </fieldset>
            </form>
            {!saleRoute && (
                <fieldset className='catalog-filter-group'>
                    <legend>Discover</legend>
                    <label className='catalog-filter-check'>
                        <input type='checkbox' checked={query.get('onSaleOnly') === 'true'} onChange={event => update('onSaleOnly', event.target.checked ? 'true' : '')} />
                        <span>Discounted designs</span>
                    </label>
                </fieldset>
            )}
            <p className='filter-footnote'>Thoughtfully selected.<br />Made to be yours.</p>
        </>
    );

    return (
        <div className='container catalog-page'>
            <Breadcrumbs items={[{ label: title }]} />
            <div className='page-heading'>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            {pathname === '/search' && <form role='search' className='catalog-search-form' onSubmit={event => { event.preventDefault(); const href = searchHref(searchText); if (href) startTransition(() => router.push(href)); }}><label className='sr-only' htmlFor='catalog-search'>Search the collection</label><input id='catalog-search' type='search' value={searchText} maxLength={150} onChange={event => setSearchText(event.target.value)} placeholder='Search for a design or SKU…' /><button className='button' type='submit'>Search<ArrowRight size={16}/></button></form>}
            {selectedFabric && <Note>Choose a compatible design to continue with your selected fabric. Compatibility is checked on the product page.</Note>}
            <div className='catalog-toolbar'>
                <span className='catalog-count' aria-live='polite'>{pending ? 'Updating your edit…' : `${data.total} ${data.total === 1 ? 'design' : 'designs'}`}</span>
                <button className='filter-mobile text-button' aria-haspopup='dialog' onClick={() => setDrawer(true)}><SlidersHorizontal size={16} />Filters{chips.length ? ` (${chips.length})` : ''}</button>
                <label className='sort-control'>
                    <span>Sort by</span>
                    <select aria-label='Sort products' value={query.get('sort') || 'newest'} onChange={event => update('sort', event.target.value)}>
                        <option value='newest'>Newest first</option>
                        <option value='best_selling'>Best selling</option>
                        <option value='price_asc'>Price: low to high</option>
                        <option value='price_desc'>Price: high to low</option>
                    </select>
                </label>
                <div className='grid-choices' role='group' aria-label='Products per row'>
                    {GRID_CHOICES.map(columns => (
                        <button
                            type='button'
                            key={columns}
                            className={`grid-choice grid-choice--${columns} ${columns === grid.columns ? 'is-selected' : ''}`}
                            aria-label={`${columns} columns`}
                            aria-pressed={columns === grid.columns}
                            title={`${columns} products per row`}
                            disabled={columns > grid.maximum}
                            onClick={() => grid.select(columns)}
                        ><GridGlyph columns={columns} /><span>{columns}</span></button>
                    ))}
                </div>
            </div>
            {chips.length > 0 && (
                <div className='active-filters' aria-label='Active filters'>
                    {chips.map(([key, value]) => <button key={`${key}:${value}`} onClick={() => navigate(removeCatalogFilter(search, key, value))} aria-label={`Remove ${chipLabel(key, value)} filter`}>{chipLabel(key, value)}<X size={13} /></button>)}
                    <button className='clear-filter-chip' onClick={clear}>Clear all</button>
                </div>
            )}
            <div className='catalog-layout'>
                <aside className='filters' aria-label='Product filters'>{filters}</aside>
                <div aria-busy={pending} className={`catalog-results ${pending ? 'is-pending' : ''}`}>
                    {data.items.length ? (
                        <div className='catalog-grid' data-columns={grid.columns}>
                            {data.items.map((product, index) => (
                                <div key={product.id} className='catalog-grid-item'>
                                    <ProductCard product={product} categoryLabel={categoryNames.get(product.categoryId)} sizes={imageSizes} priority={index < 2} />
                                    {selectedFabric && product.isCustomizable && product.compatibleFabricIds.includes(selectedFabric) && <Link className='fabric-carry-link' href={`/product/${product.slug}?mode=stitch&fabric=${encodeURIComponent(selectedFabric)}`}>Use selected fabric<ArrowRight size={14} /></Link>}
                                </div>
                            ))}
                        </div>
                    ) : <EmptyState title='Nothing quite like that—yet.' text='Try a wider price range, a different collection or another search.' />}
                    {data.totalPages > 1 && (
                        <nav className='pagination' aria-label='Catalog pages'>
                            <button className='button button-outline compact' disabled={pending || data.page <= 1} onClick={() => goToPage(data.page - 1)}><ArrowLeft size={16} />Previous</button>
                            <span>Page {data.page} of {data.totalPages}</span>
                            <button className='button button-outline compact' disabled={pending || data.page >= data.totalPages} onClick={() => goToPage(data.page + 1)}>Next<ArrowRight size={16} /></button>
                        </nav>
                    )}
                </div>
            </div>
            {drawer && (
                <Modal title='Refine your edit' drawer onClose={() => setDrawer(false)}>
                    <div className='filters-mobile-body'>
                        {filters}
                        <button className='button full-width' onClick={() => setDrawer(false)}>Show {data.total} designs</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
