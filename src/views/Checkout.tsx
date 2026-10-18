'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Truck } from 'lucide-react';
import type { Address, CartItem, Order } from '@/types';
import { useStore } from '@/context/store';
import { useMounted } from '@/hooks/useMounted';
import { useAuth } from '@/providers/AuthProvider';
import { useResource } from '@/hooks/useResource';
import { getAddresses, getLoyaltyConfig, getLoyaltySummary, getMaxPoints } from '@/api/account';
import { applyCoupon, createOrder, paymentMethods } from '@/api/orders';
import { request, ApiError } from '@/api/client';
import type { CreateOrderInput, CouponResult } from '@/api/contracts';
import { isDemo, features } from '@/lib/config';
import { receiptPath } from '@/lib/order-access';
import { ATTEMPT_KEY, readAttempt, resolveAttempt, type CheckoutAttempt } from '@/lib/checkout-attempt';
import { fingerprint, money, orderLine, previewTotals, stableJson, subtotal } from '@/lib/commerce';
import { validCheckoutEmail, validDeliveryAddress } from '@/lib/checkout-validation';
import { repriceCart } from '@/services/reprice';
import { BagLines } from '@/components/BagLines';
import { Breadcrumbs, EmptyState, Eyebrow, Field, Loading, Note } from '@/components/ui';
const BLANK: Omit<Address, 'id' | 'label' | 'isDefault'> = { fullName: '', line1: '', line2: '', city: '', postalCode: '', phone: '' };
export default function Checkout() {
    const store = useStore(), auth = useAuth(), router = useRouter();
    const mounted = useMounted();
    const [step, setStep] = useState(0), [email, setEmail] = useState(''), [address, setAddress] = useState({ ...BLANK }), [delivery, setDelivery] = useState<'standard' | 'express'>('standard');
    const [notes, setNotes] = useState(''), [code, setCode] = useState(''), [coupon, setCoupon] = useState<(CouponResult & {
        subtotal: number;
    }) | null>(null), [points, setPoints] = useState(0), [error, setError] = useState(''), [busy, setBusy] = useState(false), [couponBusy, setCouponBusy] = useState(false), [accepted, setAccepted] = useState(false), [confirmedItems, setConfirmedItems] = useState<CartItem[] | null>(null);
    const submitting = useRef(false), previousOwner = useRef<string | null | undefined>(undefined);
    const sub = subtotal(store.cart), owner = auth.user?.id || 'guest';
    const methods = useResource(!isDemo ? 'payment-methods' : null, () => paymentMethods());
    const addressBook = useResource(!auth.loading && auth.user && !isDemo ? `checkout-addresses:${owner}` : null, () => getAddresses());
    const loyalty = useResource(features.loyalty && !auth.loading && auth.user && !isDemo ? `checkout-loyalty:${owner}:${sub}` : null, async () => { const [config, summary, max] = await Promise.all([getLoyaltyConfig(), getLoyaltySummary(), getMaxPoints(sub)]); return { config, summary, max }; });
    useEffect(() => {
        if (auth.loading)
            return;
        if (previousOwner.current !== undefined && previousOwner.current !== owner) {
            setAddress({ ...BLANK });
            setCoupon(null);
            setPoints(0);
            setStep(0);
            setConfirmedItems(null);
        }
        previousOwner.current = owner;
        setEmail(auth.user?.email || '');
    }, [owner, auth.loading, auth.user?.email]);
    useEffect(() => {
        if (coupon && coupon.subtotal !== sub)
            setCoupon(null);
    }, [sub, coupon]);
    const discount = coupon?.subtotal === sub ? coupon.discount : 0;
    const loyaltyValue = loyalty.data ? points * loyalty.data.config.redeemValuePkrPerPoint : 0;
    let total: ReturnType<typeof previewTotals> | null = null, totalsError = '';
    try {
        total = previewTotals(store.cart, delivery, discount, loyaltyValue);
    }
    catch (e) {
        totalsError = (e as Error).message;
    }
    const canCod = methods.data?.methods.includes('cod') ?? false;
    function updateAddress<K extends keyof typeof BLANK>(key: K, value: string) { setAddress(a => ({ ...a, [key]: value })); }
    function payload(items: CartItem[], couponCode?: string): Omit<CreateOrderInput, 'idempotencyKey'> {
        return { email: email.trim(), items: items.map(orderLine), shippingAddress: { fullName: address.fullName.trim(), line1: address.line1.trim(), ...(address.line2?.trim() ? { line2: address.line2.trim() } : {}), city: address.city.trim(), postalCode: address.postalCode.trim(), phone: address.phone.trim() }, paymentMethod: 'cod', deliveryMethod: delivery, ...(couponCode ? { couponCode } : {}), ...(points ? { loyaltyPointsRedeemed: points } : {}), ...(notes.trim() ? { customerNotes: notes.trim() } : {}) };
    }
    function validAddress() { return validDeliveryAddress(address); }
    async function applyCode() {
        if (couponBusy)
            return;
        setCouponBusy(true);
        setError('');
        setCoupon(null);
        try {
            if (isDemo)
                throw new Error('Coupon validation requires your connected backend. No discount was applied in this preview.');
            const result = await applyCoupon(code.trim(), sub, !!auth.user);
            if (!result.valid)
                throw new Error(result.message || 'This code cannot be applied.');
            setCoupon({ ...result, subtotal: sub });
            setCode(result.code);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setCouponBusy(false);
        }
    }
    function finishOrder(order: Order, attempt: CheckoutAttempt) {
        // A real server receipt remains authoritative even if tab storage fails.
        store.rememberOrder(order);
        try {
            sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify({ ...attempt, state: 'complete', orderId: order.id }));
        }
        catch { /* Still navigate to the confirmed private order. */ }
        store.clearCart();
        router.replace(receiptPath(order.id));
    }
    async function review() {
        if (busy)
            return;
        setError('');
        if (!validCheckoutEmail(email)) { setError('Enter a valid contact email.'); setStep(0); return; }
        if (!validAddress()) {
            setError('Review your delivery details, including a 4–6 digit postal code and valid phone number.');
            setStep(1);
            return;
        }
        // An already-submitted order may have consumed its own last stock unit,
        // coupon or points. Reconcile that same request, not a new stock check.
        try {
            const previous = readAttempt(sessionStorage);
            if (previous?.state === 'pending') {
                const hash = await fingerprint(payload(store.cart, coupon?.code));
                resolveAttempt(previous, hash, owner, previous.key, Date.now());
                setConfirmedItems(structuredClone(store.cart));
                setStep(3);
                setAccepted(false);
                return;
            }
        }
        catch (e) {
            setError((e as Error).message);
            return;
        }
        if (totalsError) {
            setError(totalsError);
            return;
        }
        if (points && (!loyalty.data || loyalty.loading || loyalty.error || points > loyalty.data.max.maxPoints || points < loyalty.data.config.minPointsToRedeem)) {
            setError('Choose an eligible amount of reward points or use zero.');
            return;
        }
        if (!isDemo && !canCod) {
            setError('No supported payment method is currently available. Please try again later.');
            return;
        }
        setBusy(true);
        try {
            const fresh = await repriceCart(store.cart);
            store.replaceCart(fresh.items);
            if (fresh.changed) {
                setCoupon(null);
                setPoints(0);
                setError('Prices have changed. Your bag has been updated; review the new totals and apply any discounts again.');
                return;
            }
            if (coupon) {
                const checked = await applyCoupon(coupon.code, sub, !!auth.user);
                if (!checked.valid || checked.discount !== coupon.discount) {
                    setCoupon(checked.valid ? { ...checked, subtotal: sub } : null);
                    setError('Your coupon was updated. Review the new total before continuing.');
                    return;
                }
            }
            setConfirmedItems(structuredClone(fresh.items));
            setStep(3);
            setAccepted(false);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function placeOrder() {
        if (submitting.current)
            return;
        setError('');
        if (isDemo) {
            setError('This is a design preview. No real order or payment has been submitted.');
            return;
        }
        if (!accepted || !confirmedItems) {
            setError('Review your details and acknowledge the ordering information first.');
            return;
        }
        if (!validCheckoutEmail(email) || !validAddress()) {
            setError('Please review your email and delivery details.');
            setStep(0);
            return;
        }
        submitting.current = true;
        setBusy(true);
        let attemptStarted = false;
        let replaying = false;
        try {
            if (!canCod && readAttempt(sessionStorage)?.state !== 'pending') throw new Error('Cash on delivery is currently unavailable.');
            // Prevent an expired signed-in session from silently becoming a guest checkout.
            if (auth.user) {
                const identity = await request<{
                    customer?: unknown;
                }>('/auth/me', { authenticated: true });
                if (!identity.customer)
                    throw new Error('Please use a customer account to place an order.');
            }
            const previous = readAttempt(sessionStorage);
            if (previous?.state === 'pending') {
                const base = payload(store.cart, coupon?.code);
                const hash = await fingerprint(base);
                const attempt = resolveAttempt(previous, hash, owner, previous.key, Date.now());
                replaying = true;
                attemptStarted = true;
                const result = await createOrder({ ...base, idempotencyKey: attempt.key }, !!auth.user);
                finishOrder(result.order, attempt);
                return;
            }
            const fresh = await repriceCart(store.cart);
            store.replaceCart(fresh.items);
            if (fresh.changed || stableJson(fresh.items.map(orderLine)) !== stableJson(confirmedItems.map(orderLine))) {
                setStep(2);
                setConfirmedItems(null);
                throw new Error('Your selection changed. Please review it once more before ordering.');
            }
            if (coupon) {
                const checked = await applyCoupon(coupon.code, subtotal(fresh.items), !!auth.user);
                if (!checked.valid || checked.discount !== coupon.discount) {
                    setCoupon(checked.valid ? { ...checked, subtotal: subtotal(fresh.items) } : null);
                    setStep(2);
                    throw new Error('The coupon changed. Review the updated order.');
                }
            }
            if (points) {
                const [max, latestConfig] = await Promise.all([getMaxPoints(subtotal(fresh.items)), getLoyaltyConfig()]);
                if (!loyalty.data || latestConfig.redeemValuePkrPerPoint !== loyalty.data.config.redeemValuePkrPerPoint || points < latestConfig.minPointsToRedeem) {
                    setStep(2);
                    loyalty.refresh();
                    throw new Error('The reward rules changed. Review your points and total again.');
                }
                if (points > max.maxPoints)
                    throw new Error('Your available rewards changed. Reduce points and review again.');
            }
            const base = payload(fresh.items, coupon?.code), hash = await fingerprint(base);
            const attempt = resolveAttempt(readAttempt(sessionStorage), hash, owner, crypto.randomUUID(), Date.now());
            sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
            attemptStarted = true;
            const result = await createOrder({ ...base, idempotencyKey: attempt.key }, !!auth.user);
            finishOrder(result.order, attempt);
        }
        catch (e) {
            if (attemptStarted && !replaying && e instanceof ApiError && [400, 401, 403, 404, 422, 429].includes(e.status)) {
                try {
                    sessionStorage.removeItem(ATTEMPT_KEY);
                }
                catch { }
            }
            const uncertain = attemptStarted && (!(e instanceof ApiError) || e.status === 0 || e.status >= 500);
            setError(`${(e as Error).message}${uncertain ? ' Your submission may have reached the server. Retry with the same details; the same checkout key will be reused. Do not start a second order.' : ''}`);
        }
        finally {
            submitting.current = false;
            setBusy(false);
        }
    }
    if (!mounted || !store.hydrated || auth.loading)
        return <Loading label='Preparing your checkout…'/>;
    if (!store.cart.length)
        return <div className='container'><EmptyState title='Your bag is empty.' text='Choose your pieces before continuing to checkout.'/></div>;
    return <div className='container checkout-page'><Breadcrumbs items={[{ label: 'Bag', href: '/cart' }, { label: 'Checkout' }]}/><div className='page-heading'><Eyebrow>THE FINISHING DETAILS</Eyebrow><h1>Make it yours.</h1><p>A few details, then the next chapter begins.</p></div><ol className='checkout-progress'>{['Contact', 'Delivery', 'Preferences', 'Review'].map((title, i) => <li className={step === i ? 'active' : i < step ? 'complete' : ''} key={title}><button disabled={i > step || busy} onClick={() => { setStep(i); setError(''); }} aria-current={i === step ? 'step' : undefined}><span>{i < step ? <Check size={14}/> : i + 1}</span>{title}</button></li>)}</ol>{isDemo && <Note>Design preview. Forms can be explored, but no real order or payment is submitted.</Note>}<div className='checkout-layout'><section className='checkout-form'>
    {step === 0 && <form onSubmit={e => { e.preventDefault(); if (!validCheckoutEmail(email)) { setError('Enter a valid contact email.'); return; } setStep(1); setError(''); }}><h2>How can we reach you?</h2>{!auth.user && <p>Checkout as a guest, or <Link href='/account/login?next=/checkout'>sign in</Link> for saved addresses and order history.</p>}<Field label='Email address'><input type='email' autoComplete='email' required maxLength={254} readOnly={!!auth.user} value={email} onChange={e => setEmail(e.target.value)}/></Field><Note>This email identifies your order for tracking. Save the receipt link after checkout. No account is required.</Note><button className='button'>Continue to delivery<ArrowRight size={16}/></button></form>}
    {step === 1 && <form onSubmit={e => {
                e.preventDefault();
                if (!validAddress()) {
                    setError('Please check your address and phone number.');
                    return;
                }
                setStep(2);
                setError('');
            }}><h2>Where should it arrive?</h2>{addressBook.data && addressBook.data.length > 0 && <Field label='Use a saved address'><select defaultValue='' onChange={e => {
                    const found = addressBook.data?.find(a => a.id === e.target.value);
                    if (found)
                        setAddress({ fullName: found.fullName, line1: found.line1, line2: found.line2 || '', city: found.city, postalCode: found.postalCode, phone: found.phone });
                    else setAddress({ ...BLANK });
                }}><option value=''>Enter a new address</option>{addressBook.data.map(a => <option value={a.id} key={a.id}>{a.label} · {a.city}</option>)}</select></Field>}<div className='form-grid'><Field label='Recipient’s full name'><input autoComplete='shipping name' required minLength={2} maxLength={100} value={address.fullName} onChange={e => updateAddress('fullName', e.target.value)}/></Field><Field label='Phone number'><input type='tel' autoComplete='shipping tel' required minLength={10} maxLength={20} value={address.phone} onChange={e => updateAddress('phone', e.target.value)}/></Field><Field label='Street address'><input autoComplete='shipping address-line1' required minLength={3} maxLength={200} value={address.line1} onChange={e => updateAddress('line1', e.target.value)}/></Field><Field label='Apartment or additional details (optional)'><input autoComplete='shipping address-line2' maxLength={200} value={address.line2 || ''} onChange={e => updateAddress('line2', e.target.value)}/></Field><Field label='City'><input autoComplete='shipping address-level2' required minLength={2} maxLength={80} value={address.city} onChange={e => updateAddress('city', e.target.value)}/></Field><Field label='Postal code' hint='4–6 digits'><input inputMode='numeric' autoComplete='shipping postal-code' pattern='[0-9]{4,6}' required maxLength={6} value={address.postalCode} onChange={e => updateAddress('postalCode', e.target.value)}/></Field></div><p className='muted'>Delivery country: Pakistan</p><button className='button'>Continue<ArrowRight size={16}/></button></form>}
    {step === 2 && <><h2>The final preferences.</h2><fieldset className='checkout-options'><legend>Delivery method</legend>{(['standard', 'express'] as const).map(method => <label className='payment-option' key={method}><input type='radio' name='delivery' checked={delivery === method} onChange={() => setDelivery(method)}/><Truck size={19}/><span><strong>{method === 'standard' ? 'Standard delivery' : 'Express delivery'}</strong><small>{method === 'standard' ? 'Rs. 250 · Free on a net merchandise total of Rs. 10,000 or more.' : 'Rs. 500 · Priority dispatch; delivery timing is confirmed by the store.'}</small></span></label>)}</fieldset><fieldset className='checkout-options'><legend>Payment</legend>{methods.loading ? <Loading label='Checking payment availability…'/> : methods.error ? <p className='field-error' role='alert'>{methods.error.message}<button className='text-button' onClick={methods.refresh}>Retry</button></p> : <label className='payment-option'><input type='radio' checked readOnly disabled={!isDemo && !canCod}/><span><strong>Cash on delivery</strong><small>{isDemo || canCod ? 'Pay in cash when your order arrives.' : 'Not currently available.'}</small></span></label>}<small>Card and mobile-wallet payments are not available yet. You never pay online on this page.</small></fieldset>{features.coupons && <div className='coupon-form'><Field label='Coupon code'><input value={code} maxLength={40} onChange={e => {
                setCode(e.target.value);
                if (coupon)
                    setCoupon(null);
            }} placeholder='Enter your code'/></Field><button className='button coupon-apply' type='button' disabled={couponBusy} onClick={() => { if (!code.trim()) { setError('Enter your coupon code first.'); return; } void applyCode(); }}>{couponBusy ? 'Checking…' : 'Apply'}</button></div>}{coupon && <p className='success-message'>{coupon.code} applied · {money(coupon.discount)} <button className='text-button' onClick={() => { setCoupon(null); setCode(''); }}>Remove</button></p>}{features.loyalty && auth.user && <div className='rewards-checkout'><h3>Your rewards</h3>{loyalty.loading ? <p>Checking points…</p> : loyalty.error ? <p className='field-error'>Rewards are temporarily unavailable. Use 0 points to continue.</p> : loyalty.data ? <><p>Balance: {loyalty.data.summary.balance} points · Maximum for this order: {loyalty.data.max.maxPoints}</p><Field label='Points to redeem'><input type='number' min={0} max={loyalty.data.max.maxPoints} step={1} value={points} onChange={e => setPoints(Math.max(0, Math.floor(Number(e.target.value) || 0)))}/></Field><small>Minimum redemption: {loyalty.data.config.minPointsToRedeem} points. Each point is worth {money(loyalty.data.config.redeemValuePkrPerPoint)}.</small></> : null}{loyalty.error && <button className='text-button' onClick={() => setPoints(0)}>Remove points</button>}</div>}<Field label='Order notes (optional)'><textarea value={notes} maxLength={500} rows={3} onChange={e => setNotes(e.target.value)}/></Field><button className='button' disabled={busy || couponBusy} onClick={() => void review()}>{busy ? 'Confirming your selection…' : 'Review your order'}<ArrowRight size={16}/></button></>}
    {step === 3 && <><h2>One last look.</h2><div className='review-address'><h3>Contact & delivery</h3><p>{email}</p><p>{address.fullName}<br />{address.line1}{address.line2 && <><br />{address.line2}</>}<br />{address.city}, {address.postalCode}<br />{address.phone}</p><p>{delivery === 'express' ? 'Express' : 'Standard'} delivery · Cash on delivery</p><button className='text-button' onClick={() => setStep(0)}>Edit details</button></div><BagLines items={store.cart}/><label className='consent-check'><input type='checkbox' checked={accepted} onChange={e => setAccepted(e.target.checked)}/><span>I have reviewed my sizes, order details and the <Link href='/pages/shipping'>shipping</Link> and <Link href='/pages/returns'>returns</Link> information.</span></label><button className='button full-width' disabled={busy || !accepted || !!totalsError} onClick={() => void placeOrder()}><LockKeyhole size={17}/>{busy ? 'Placing your order…' : 'Place order · ' + money(total?.total || 0)}</button><p className='muted'>You’ll pay in cash when your order is delivered.</p></>}
    {(error || totalsError) && <p role='alert' className='field-error checkout-error'>{error || totalsError}</p>}{step > 0 && <button type='button' className='button button-outline back-step' disabled={busy} onClick={() => { setStep(step - 1); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><ArrowLeft size={16}/>Back</button>}</section><aside className='order-summary'><h3>Your order</h3>{store.cart.map(item => <div className='summary-item' key={item.id}><span>{item.productName}<small>{item.mode === 'stitch' ? 'Custom stitched' : `Size ${item.sizeLabel}`} · Qty {item.quantity}</small></span><span>{money(item.unitPrice * item.quantity)}</span></div>)}{total && <><div className='total-row'><span>Subtotal</span><span>{money(total.subtotal)}</span></div>{total.discount > 0 && <div className='total-row'><span>Coupon</span><span>−{money(total.discount)}</span></div>}{total.loyalty > 0 && <div className='total-row'><span>Rewards</span><span>−{money(total.loyalty)}</span></div>}<div className='total-row'><span>Delivery</span><span>{total.shipping === 0 ? 'Complimentary' : money(total.shipping)}</span></div><div className='grand-total'><span>Total</span><strong>{money(total.total)}</strong></div></>}{store.cart.some(item => item.mode === 'stitch') && <p className='order-lead-time'><Truck size={16}/><span>Custom stitching: {Math.max(...store.cart.filter(item => item.mode === 'stitch').map(item => item.leadTimeDays.min))}–{Math.max(...store.cart.filter(item => item.mode === 'stitch').map(item => item.leadTimeDays.max))} working days before delivery.</span></p>}<small>All prices in PKR. Your receipt confirms the final total.</small><Link href='/cart' className='text-link'>Edit your bag</Link></aside></div></div>;
}
