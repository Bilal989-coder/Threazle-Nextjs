'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Heart, Info, Minus, Plus, Ruler, Scissors, ShoppingBag, Truck } from 'lucide-react';
import type { AddonService, BuyingMode, CartItem, Category, Fabric, Product } from '@/types';
import { computePrice, getProduct } from '@/api/catalog';
import { getProfiles } from '@/api/account';
import { useResource } from '@/hooks/useResource';
import { useAuth } from '@/providers/AuthProvider';
import { useStore } from '@/context/store';
import { features, isDemo } from '@/lib/config';
import { money, readyAvailability, validateMeasurements } from '@/lib/commerce';
import { ProductGallery } from '@/components/ProductGallery';
import { MeasurementGuide } from '@/components/MeasurementGuide';
import { useMounted } from '@/hooks/useMounted';
import { StyleOptionImage } from '@/components/StyleOptionImage';
import { resolveStylePreview } from '@/lib/style-preview';
import { FabricSwatch } from '@/components/Photo';
import { ProductCard } from '@/components/ProductCard';
import { Breadcrumbs, Eyebrow, Field, Note, Modal, SectionTitle } from '@/components/ui';
interface Props {
    product: Product;
    category: Category;
    fabrics: Fabric[];
    addons: AddonService[];
    related: Product[];
}
export default function ProductPage({ product: p, category, fabrics, addons, related }: Props) {
    const params = useSearchParams(), store = useStore(), { user, loading: authLoading } = useAuth();
    const requested = params.get('mode');
    const initial: BuyingMode = requested === 'stitch' && p.isCustomizable ? 'stitch' : requested === 'ready_made' && p.isReadymade ? 'ready_made' : p.defaultMode === 'stitch' && p.isCustomizable ? 'stitch' : p.isReadymade ? 'ready_made' : 'stitch';
    const [mode, setMode] = useState<BuyingMode>(initial), [size, setSize] = useState(''), [quantity, setQuantity] = useState(1), [step, setStep] = useState(0);
    const [variantId, setVariant] = useState(p.variants[0]?.id || ''), [fabricId, setFabric] = useState(''), [values, setValues] = useState<Record<string, number>>({}), [selectedAddons, setAddons] = useState<string[]>([]), [notes, setNotes] = useState(''), [profileId, setProfile] = useState(''), [rush, setRush] = useState(false);
    const [error, setError] = useState(''), [fieldErrors, setFields] = useState<Record<string, string>>({}), [busy, setBusy] = useState(false), [help, setHelp] = useState(false), [fabricNotice, setFabricNotice] = useState('');
    const editing = params.get('edit') || undefined, initialized = useRef(''), adding = useRef(false);
    const previousOwner = useRef<string | null | undefined>(undefined);
    useEffect(() => {
        if (authLoading) return;
        const owner = user?.id ?? null;
        if (previousOwner.current !== undefined && previousOwner.current !== null && previousOwner.current !== owner) {
            setProfile(''); setValues({}); setFields({}); setNotes(''); setStep(0);
        }
        previousOwner.current = owner;
    }, [authLoading, user?.id]);
    useEffect(() => {
        if (editing) return;
        if (requested === 'stitch' && p.isCustomizable) setMode('stitch');
        if (requested === 'ready_made' && p.isReadymade) setMode('ready_made');
    }, [requested, editing, p.isCustomizable, p.isReadymade]);
    // Same markup on server and first client render (avoids a stuck 'disabled' attribute), then enable.
    const mounted = useMounted();
    const profileResource = useResource(features.customization && !authLoading && user && !isDemo ? `profiles:${user.id}` : null, () => getProfiles());
    const profiles = profileResource.data?.filter(profile => profile.categoryId === category.id) || [];
    useEffect(() => {
        if (!store.hydrated)
            return;
        const key = `${p.id}:${editing || ''}:${params.get('fabric') || ''}`;
        if (initialized.current === key)
            return;
        initialized.current = key;
        if (editing) {
            const item = store.cart.find(i => i.id === editing && i.productId === p.id);
            if (!item) {
                setError('That bag selection is no longer available. Add a new selection instead.');
                return;
            }
            setMode(item.mode);
            setSize(item.sizeLabel || '');
            setQuantity(item.quantity);
            setVariant(item.customization?.variantId || p.variants[0]?.id || '');
            setFabric(item.customization?.fabricId || '');
            setValues({ ...item.customization?.measurementSnapshot });
            setProfile(item.customization?.measurementProfileId || '');
            setAddons([...(item.customization?.addonIds || [])]);
            setNotes(item.customization?.notes || '');
            setRush(Boolean(item.customization?.rush));
            setStep(item.mode === 'stitch' ? 3 : 0);
        }
        else if (params.get('fabric')) {
            const fabric = fabrics.find(f => f.id === params.get('fabric') && f.stockStatus !== 'out_of_stock');
            if (fabric && p.isCustomizable) {
                setFabric(fabric.id);
                setMode('stitch');
                setFabricNotice(`${fabric.name} is ready for this design.`);
            }
            else
                setFabricNotice('Your selected fabric is not available for this design. Choose one of the compatible options below.');
        }
    }, [store.hydrated, p.id, editing, params, fabrics, store.cart, p.variants, p.isCustomizable]);
    const priceInput = useMemo(() => ({ productId: p.id, mode, ...(mode === 'ready_made' ? { sizeLabel: size || undefined } : { variantId: variantId || undefined, fabricId: fabricId || undefined, addonIds: selectedAddons, ...(rush ? { rush: true } : {}) }) }), [p.id, mode, size, variantId, fabricId, selectedAddons, rush]);
    const canQuote = p.status === 'active' && (mode === 'stitch' || Boolean(size));
    const price = useResource(canQuote ? `quote:${JSON.stringify(priceInput)}` : null, signal => computePrice(priceInput, signal));
    const selectedFabric = fabrics.find(f => f.id === fabricId), selectedStyle = p.variants.find(v => v.id === variantId), inStock = readyAvailability(p, size), saved = mounted && store.wishlist.includes(p.id);
    function changeMode(next: BuyingMode) { setMode(next); setQuantity(1); setError(''); setFields({}); }
    function validateStep(index: number): boolean {
        setError('');
        setFields({});
        if (index === 0 && p.variants.length && !p.variants.some(v => v.id === variantId)) {
            setError('Choose a design style.');
            return false;
        }
        if (index === 1 && p.compatibleFabricIds.length && (!selectedFabric || selectedFabric.stockStatus === 'out_of_stock')) {
            setError('Choose an available fabric.');
            return false;
        }
        if (index === 2) {
            if (!category.measurementFields.length) {
                setError('Please contact us to share your measurements for this design.');
                return false;
            }
            const errors = validateMeasurements(values, category.measurementFields);
            if (Object.keys(errors).length) {
                setFields(errors);
                setError('Please review the highlighted measurements.');
                return false;
            }
        }
        if (index === 3 && selectedAddons.some(id => !p.addonIds.includes(id))) {
            setError('An extra is no longer available. Please reselect your extras.');
            return false;
        }
        return true;
    }
    async function add() {
        if (adding.current)
            return;
        setError('');
        if (mode === 'ready_made' && !size) {
            setError('Choose a size before adding to your bag.');
            return;
        }
        if (mode === 'stitch') {
            for (let i = 0; i < 4; i++) {
                if (!validateStep(i)) {
                    setStep(i);
                    return;
                }
            }
        }
        if (editing && !store.cart.some(i => i.id === editing)) {
            setError('The selection you were editing was removed. Return to your bag and start again.');
            return;
        }
        adding.current = true;
        setBusy(true);
        try {
            const current = await getProduct(p.slug);
            if (!current || current.id !== p.id || current.status !== 'active')
                throw new Error('This design is no longer available.');
            if ((mode === 'stitch' && !current.isCustomizable) || (mode === 'ready_made' && !current.isReadymade))
                throw new Error('This buying option is no longer offered. Reload the design to see available options.');
            if (mode === 'stitch' && ((variantId && !current.variants.some(v => v.id === variantId)) || (fabricId && !current.compatibleFabricIds.includes(fabricId)) || selectedAddons.some(id => !current.addonIds.includes(id))))
                throw new Error('A selected style, fabric or extra changed. Reload the design and review your selection.');
            const max = readyAvailability(current, size);
            if (mode === 'ready_made' && quantity > max)
                throw new Error(`Only ${max} remain in this size. Choose another quantity or size.`);
            const quote = await computePrice(priceInput);
            if (!Number.isFinite(quote.total) || quote.total < 0)
                throw new Error('Unable to confirm this price. Please retry.');
            const profile = profiles.find(profile => profile.id === profileId);
            const item: CartItem = { id: editing || crypto.randomUUID(), productId: p.id, productName: p.name, productSlug: p.slug, productImage: p.images[0]?.url || '/images/placeholder.svg', categoryId: p.categoryId, mode, quantity, unitPrice: quote.total, leadTimeDays: { ...category.leadTimeDays }, ...(mode === 'ready_made' ? { sizeLabel: size, maxQuantity: max } : { customization: { variantId: variantId || undefined, variantName: selectedStyle?.styleName, fabricId: fabricId || undefined, fabricName: selectedFabric?.name, fabricSwatch: selectedFabric?.swatchImage, measurementProfileId: profileId || undefined, measurementProfileName: profile?.profileName, measurementSnapshot: { ...values }, addonIds: [...selectedAddons], notes: notes.trim() || undefined, ...(rush ? { rush: true } : {}) } }) };
            store.addItem(item, editing);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
            adding.current = false;
        }
    }
    return <div className='container product-page'><Breadcrumbs items={[{ label: category.name, href: `/category/${category.slug}` }, { label: p.name }]}/><div className='product-detail-grid'><div className='product-gallery'><ProductGallery product={p}/></div><section className='buy-box' aria-label='Configure your garment'><div className='buy-heading'><Eyebrow>{category.name.toUpperCase()}</Eyebrow><button className='icon-button' onClick={() => void store.toggleWishlist(p)} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} aria-pressed={saved}><Heart size={20} fill={saved ? 'currentColor' : 'none'}/></button></div><h1>{p.name}</h1><p className='product-intro'>{p.shortDescription}</p><div className='pdp-price' aria-live='polite'>{price.data ? money(price.data.total) : `${p.isCustomizable ? 'From ' : ''}${money(p.salePrice ?? p.basePrice)}`}<small>{price.loading ? 'Refreshing price…' : mode === 'stitch' ? 'Configured price per garment' : 'Price per garment'}</small></div>
    {p.isReadymade && p.isCustomizable && <div className='buy-mode-tabs' role='group' aria-label='Buying mode'>{p.isReadymade && <button aria-pressed={mode === 'ready_made'} className={mode === 'ready_made' ? 'selected' : ''} onClick={() => changeMode('ready_made')}><ShoppingBag size={17}/>Ready-Made</button>}{p.isCustomizable && <button aria-pressed={mode === 'stitch'} className={mode === 'stitch' ? 'selected' : ''} onClick={() => changeMode('stitch')}><Scissors size={17}/>Stitch / Customize</button>}</div>}
    {editing && <Note>Editing an existing bag selection. Your changes will replace that line, not create a second one.</Note>}
    {mode === 'ready_made' ? <><div className='size-heading'><strong>Select your size</strong><button className='text-button' onClick={() => setHelp(true)}><Ruler size={15}/>Size guide</button></div><div className='size-options'>{p.readyMadeSizes.map(s => <button key={s.id} className={size === s.sizeLabel ? 'selected' : ''} aria-pressed={size === s.sizeLabel} disabled={s.stockQty < 1 || p.status !== 'active'} title={s.stockQty < 1 ? 'Currently unavailable' : undefined} onClick={() => { setSize(s.sizeLabel); setQuantity(1); setError(''); }}>{s.sizeLabel}</button>)}</div>{!p.readyMadeSizes.length && <p className='field-error'>No ready-made sizes are configured.</p>}{size && <p className='stock-label'>{inStock > 0 ? `${inStock} currently available in size ${size}` : 'This size is unavailable.'}</p>}</> : <div className='wizard'><ol className='wizard-progress'>{['Style', 'Fabric', 'Measurements', 'Review'].map((label, i) => <li className={i === step ? 'active' : i < step ? 'complete' : ''} key={label}><button type='button' disabled={i > step} aria-current={i === step ? 'step' : undefined} onClick={() => { setStep(i); setError(''); }}><span>{i < step ? <Check size={13}/> : i + 1}</span>{label}</button></li>)}</ol>
    {step === 0 && <div className='wizard-stage'><h3>Your design, your details.</h3><p>Choose the style for this garment.</p>{p.variants.length ? <div className='style-options'>{p.variants.map(v => <button className={`style-option ${variantId === v.id ? 'selected' : ''}`} key={v.id} aria-pressed={variantId === v.id} onClick={() => setVariant(v.id)}><StyleOptionImage variant={v} product={p}/><span><strong>{v.styleName}</strong>{v.description && <small>{v.description}</small>}<small>{v.priceAdd ? `+ ${money(v.priceAdd)}` : 'Included'}</small></span>{variantId === v.id && <Check size={17}/>}</button>)}</div> : <Note>This design uses its original style. Continue to choose your fabric.</Note>}{p.variants.some(v => resolveStylePreview(v, p).isReference) && <p className='style-reference-note'>Close-ups illustrate the collar shape and finish. Fabric and colour follow your garment selection.</p>}</div>}
    {step === 1 && <div className='wizard-stage'><h3>The fabric makes it personal.</h3><p>Only fabrics compatible with this garment are listed.</p>{fabricNotice && <Note>{fabricNotice}</Note>}<div className='fabric-choices'>{fabrics.map(f => <button key={f.id} disabled={f.stockStatus === 'out_of_stock'} className={`fabric-choice ${fabricId === f.id ? 'selected' : ''}`} aria-pressed={fabricId === f.id} onClick={() => setFabric(f.id)}><FabricSwatch color={f.colorHex} image={f.swatchImage} name={f.name}/><strong>{f.name}</strong><small>{f.composition}</small><small>{f.stockStatus === 'out_of_stock' ? 'Unavailable' : `${money(f.price)} · ${f.priceUnit.replaceAll('_', ' ')}`}</small></button>)}</div>{!fabrics.length && <Note>{p.compatibleFabricIds.length ? 'No compatible fabrics could be loaded. Contact us before ordering.' : 'Fabric is included with this design; no separate selection is configured.'}</Note>}<p className='muted'>The live price summary reflects the configured charge. Fabric unit labels describe the catalog rate.</p></div>}
    {step === 2 && <div className='wizard-stage'><div className='size-heading'><h3>A fit that starts with you.</h3><button className='text-button' onClick={() => setHelp(true)}><Info size={16}/>How to measure</button></div>{user && <Field label='Use saved measurements'><select value={profileId} onChange={e => {
                        setProfile(e.target.value);
                        const profile = profiles.find(x => x.id === e.target.value);
                        if (profile) {
                            // Only the fields this category currently asks for (staff may have changed the field list since the profile was saved).
                            setValues(Object.fromEntries(Object.entries(profile.values).filter(([key]) => category.measurementFields.some(field => field.key === key))));
                            setFields({});
                        }
                    }}><option value=''>Enter new measurements</option>{profiles.map(profile => <option value={profile.id} key={profile.id}>{profile.profileName}</option>)}</select></Field>}{profileResource.error && <p className='field-error'>Saved profiles could not load. Enter your measurements below.</p>}{!user && <p className='muted'>You can enter measurements as a guest. <Link href={`/account/login?next=${encodeURIComponent('/product/' + p.slug + '?mode=stitch')}`}>Sign in</Link> to use your saved profiles.</p>}<div className='measurement-grid'>{category.measurementFields.map(field => <Field key={field.key} label={`${field.label} (${field.unit})`} hint={field.helpText}><input type='number' inputMode='decimal' min={field.min ?? 0.01} max={field.max ?? 1000} step='any' value={values[field.key] ?? ''} aria-invalid={!!fieldErrors[field.key]} aria-describedby={fieldErrors[field.key] ? `error-${field.key}` : undefined} onChange={e => {
                        setProfile('');
                        setValues(old => {
                            const next = { ...old };
                            if (e.target.value === '')
                                delete next[field.key];
                            else
                                next[field.key] = Number(e.target.value);
                            return next;
                        });
                    }}/>{fieldErrors[field.key] && <span className='field-error' id={`error-${field.key}`}>{fieldErrors[field.key]}</span>}</Field>)}</div><Note>Follow the category guide and its units. Your exact measurements are copied into the bag; later profile edits will not change this selection.</Note></div>}
    {step === 3 && <div className='wizard-stage'><h3>The finishing touches.</h3>{(category.rushStitchingCharge ?? 0) > 0 && <label className='addon-option rush-option'><input type='checkbox' checked={rush} onChange={e => setRush(e.target.checked)}/><span><strong>Rush stitching</strong><small>Ready in about {category.leadTimeDays.min} working days instead of {category.leadTimeDays.min}–{category.leadTimeDays.max}.</small></span><strong>+ {money(category.rushStitchingCharge ?? 0)}</strong></label>}<div className='addon-options'>{addons.map(a => <label key={a.id} className='addon-option'><input type='checkbox' checked={selectedAddons.includes(a.id)} onChange={e => setAddons(ids => e.target.checked ? [...ids, a.id] : ids.filter(id => id !== a.id))}/><span><strong>{a.name}</strong><small>{a.description}</small></span><strong>+ {money(a.price)}</strong></label>)}</div><Field label='Notes for your order' hint='Optional. Maximum 500 characters.'><textarea rows={3} value={notes} maxLength={500} onChange={e => setNotes(e.target.value)} placeholder='Any detail you would like us to know…'/></Field><div className='configuration-review'><strong>Your selection</strong><p>{selectedStyle?.styleName || 'Original design'} · {selectedFabric?.name || 'Included fabric'}</p><dl className='compact-dl'>{category.measurementFields.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{values[field.key]} {field.unit}</dd></div>)}</dl><small>Stitching estimate: {rush ? `about ${category.leadTimeDays.min}` : `${category.leadTimeDays.min}–${category.leadTimeDays.max}`} working days, before delivery.</small></div></div>}
    <div className='wizard-navigation'>{step > 0 && <button className='text-button' onClick={() => { setStep(step - 1); setError(''); }}><ArrowLeft size={15}/>Back</button>}{step < 3 && <button className='button compact' onClick={() => {
                    if (validateStep(step))
                        setStep(step + 1);
                }}>Continue<ArrowRight size={16}/></button>}</div></div>}
    {price.data && mode === 'stitch' && <details className='price-breakdown'><summary>Price breakdown <strong>{money(price.data.total)}</strong></summary>{price.data.breakdown.map((row, index) => <div className='total-row' key={index}><span>{row.label}</span><span>{money(row.amount)}</span></div>)}</details>}
    {(error || price.error) && <p className='field-error' role='alert'>{error || price.error?.message}</p>}
    {(mode === 'ready_made' || step === 3) && <div className='purchase-panel'><div className='add-to-bag-row'><div className='quantity-control'><button disabled={quantity <= 1} aria-label='Decrease quantity' onClick={() => setQuantity(q => q - 1)}><Minus size={16}/></button><span>{quantity}</span><button disabled={quantity >= Math.min(50, mode === 'ready_made' ? inStock : 50)} aria-label='Increase quantity' onClick={() => setQuantity(q => q + 1)}><Plus size={16}/></button></div><button className='button full-width' disabled={!mounted || busy || p.status !== 'active' || !store.hydrated || price.loading || !!price.error} onClick={() => void add()}>{busy ? 'Checking your selection…' : editing ? 'Update your bag' : 'Add to bag'}<ShoppingBag size={17}/></button></div></div>}
    <div className='delivery-details'><div><Truck size={18}/><span>{mode === 'ready_made' ? 'Cash on delivery across Pakistan. Standard delivery Rs. 250, free on orders of Rs. 10,000 or more.' : `Stitched to order in ${category.leadTimeDays.min}–${category.leadTimeDays.max} working days, then delivered.`}</span></div><div><Ruler size={18}/><span>Need help with your fit? <Link href='/pages/contact'>Speak to us</Link></span></div></div><details className='pdp-accordion'><summary>About this design</summary><p>{p.description}</p></details><details className='pdp-accordion'><summary>Shipping, returns & care</summary><p>Review the current policies before ordering, especially for personalized garments.</p><Link href='/pages/shipping'>Shipping information</Link><Link href='/pages/returns'>Returns & exchanges</Link></details>
    </section></div>{related.length > 0 && <section className='section'><SectionTitle eyebrow='A LITTLE MORE YOU' title='Complete the expression.'/><div className='product-grid'>{related.map(product => <ProductCard key={product.id} product={product}/>)}</div></section>}{help && <Modal title={`How to measure — ${category.name}`} onClose={() => setHelp(false)}><MeasurementGuide fields={category.measurementFields} categoryName={category.name} compact/><div className='measure-actions'><Link href={`/size-guide?category=${category.slug}`} className='button button-outline'>Open the full measurement guide<Ruler size={16}/></Link><Link href='/pages/contact' className='text-link'>Need help? Talk to our tailor</Link></div></Modal>}</div>;
}
