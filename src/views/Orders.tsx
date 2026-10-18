'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Package, Printer, Truck } from 'lucide-react';
import { ORDER_STATUS_LABEL, ORDER_STATUS_SEQUENCE } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { useStore } from '@/context/store';
import { useResource } from '@/hooks/useResource';
import { cancelOrder, getOrder, getOrders, trackOrder, type TrackingSummary } from '@/api/orders';
import { isDemo } from '@/lib/config';
import { receiptPath } from '@/lib/order-access';
import { money } from '@/lib/commerce';
import { Photo } from '@/components/Photo';
import { AccountShell } from './Account';
import { Breadcrumbs, ButtonLink, EmptyState, ErrorState, Eyebrow, Field, Loading, Modal, Note } from '@/components/ui';
const date = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export function OrderList() {
    const { user } = useAuth(), data = useResource(user && !isDemo ? `orders:${user.id}` : null, () => getOrders());
    return <AccountShell title='Your orders.'>{data.loading ? <Loading label='Finding your orders…'/> : data.error ? <ErrorState error={data.error} retry={data.refresh}/> : data.data?.length ? <div className='order-list'>{data.data.map(order => <Link className='order-list-card' href={`/account/orders/${order.id}`} key={order.id}><div><span className='eyebrow'>{date(order.createdAt)}</span><h3>{order.orderNumber}</h3><p>{order.items.length} selection(s) · {money(order.grandTotal)}</p></div><div><span className={`status-badge status-${order.status}`}>{ORDER_STATUS_LABEL[order.status] || order.status}</span><small>Payment: {order.paymentStatus}</small><ArrowRight size={20}/></div></Link>)}</div> : <EmptyState title='Your next story starts here.' text='Orders placed with your account will appear here.'/>}</AccountShell>;
}
export function OrderDetail({ id, confirmation = false }: {
    id: string;
    confirmation?: boolean;
}) {
    const auth = useAuth(), store = useStore();
    const cached = store.orders.find(order => order.id === id);
    const data = useResource(!auth.loading && !isDemo ? `order:${id}:${auth.user?.id || 'guest'}` : null, () => getOrder(id, !!auth.user), cached);
    useEffect(() => {
        const timer = setInterval(() => { if (document.visibilityState === 'visible') data.refresh(); }, 15000);
        return () => clearInterval(timer);
    }, [id, auth.user?.id, data.refresh]);
    const [cancel, setCancel] = useState(false), [reason, setReason] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
    async function cancelPurchase() {
        if (busy)
            return;
        setBusy(true);
        setError('');
        try {
            const updated = await cancelOrder(id, reason.trim());
            store.rememberOrder(updated);
            data.refresh();
            setCancel(false);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    const order = data.data;
    if (auth.loading || data.loading && !order)
        return <Loading label='Loading your order…'/>;
    if (isDemo)
        return <div className='container'><EmptyState title='We couldn’t open this order.' text='Order details are temporarily unavailable. Please try again shortly or contact us with your order number.'/></div>;
    if (data.error)
        return <div className='container private-page'><ErrorState error={data.error} retry={data.refresh}/><p>If this order belongs to an account, <Link href={`/account/login?next=${encodeURIComponent('/account/orders/' + id)}`}>sign in with that account</Link>.</p></div>;
    if (!order)
        return <Loading />;
    const custom = order.items.some(i => i.mode === 'stitch'), sequence = ORDER_STATUS_SEQUENCE.filter(s => custom || !['fabric_sourced', 'in_tailoring', 'quality_check'].includes(s));
    const currentIndex = sequence.indexOf(order.status), isClosed = ['cancelled', 'returned'].includes(order.status), canCancel = !!auth.user && order.customerId === auth.user.id && ['placed', 'confirmed'].includes(order.status);
    return <div className='container order-details-page private-page'><Breadcrumbs items={[{ label: 'Orders', href: '/account/orders' }, { label: order.orderNumber }]}/><div className='order-confirmation-heading'>{confirmation && <span className='confirmation-icon'><Check size={30}/></span>}<Eyebrow>{confirmation ? 'YOUR ORDER IS WITH US' : 'YOUR THREAZLE ORDER'}</Eyebrow><h1>{confirmation ? 'The next chapter begins.' : order.orderNumber}</h1><p>{confirmation ? `Order ${order.orderNumber} has been received.` : `Placed ${date(order.createdAt)}`}</p><span className={`status-badge status-${order.status}`}>{ORDER_STATUS_LABEL[order.status] || order.status}</span></div>{!order.customerId && <Note>This private receipt grants access to your guest order. <a href={receiptPath(order.id)}>Save this receipt link</a> and do not share it publicly. You can also track {order.orderNumber} using your checkout email or phone.</Note>}{!order.customerId && !auth.user && confirmation && order.customerEmail && <div className='guest-account-offer'><div><strong>Keep every order in one place.</strong><p>Create a free account with {order.customerEmail} — this order is added to it automatically once your email is confirmed.</p></div><Link className='button button-outline' href={`/account/signup?email=${encodeURIComponent(order.customerEmail || '')}&next=${encodeURIComponent('/account/orders')}`}>Create account</Link></div>}<div className='order-details-layout'><div><div className='timeline-card'><h2>Your order’s journey</h2>{isClosed ? <p>This order is {order.status}. See the status history below.</p> : <ol className='order-timeline'>{sequence.map((status, index) => <li key={status} className={index < currentIndex ? 'done' : index === currentIndex ? 'current' : ''}><span>{index < currentIndex ? <Check size={14}/> : index + 1}</span><div><strong>{ORDER_STATUS_LABEL[status]}</strong>{order.statusHistory.find(h => h.status === status) && <small>{date(order.statusHistory.find(h => h.status === status)!.timestamp)}</small>}</div></li>)}</ol>}{order.estimatedReadyDate && <p>Estimated ready date: {date(order.estimatedReadyDate)}. Transit follows dispatch.</p>}{order.trackingNumber && <p className='tracking-number'><Truck size={18}/>Courier tracking number: <strong>{order.trackingNumber}</strong></p>}<details className='line-details'><summary>Status history</summary>{order.statusHistory.map((event, i) => <p key={`${event.timestamp}-${i}`}><strong>{ORDER_STATUS_LABEL[event.status]}</strong> · {date(event.timestamp)}</p>)}</details></div><h2>Your pieces</h2>{order.items.map(item => <article className='receipt-item' key={item.id}><Photo name={item.productImage || '/images/placeholder.svg'} alt={item.productName} sizes='110px'/><div><h3>{item.productName}</h3><p>{item.mode === 'stitch' ? 'Custom stitched' : `Ready-made · ${item.sizeLabel || ''}`} · Qty {item.quantity}</p><strong>{money(item.lineTotal)}</strong>{item.customization && <details className='line-details'><summary>Original customization</summary><p>{item.customization.variantName} · {item.customization.fabricName}</p><dl className='compact-dl'>{Object.entries(item.customization.measurementSnapshot || {}).map(([field, value]) => <div key={field}><dt>{field.replaceAll('_', ' ')}</dt><dd>{value}</dd></div>)}</dl>{item.customization.notes && <p>{item.customization.notes}</p>}<small>Units match the category guide used when this order was placed.</small></details>}</div></article>)}</div><aside className='order-summary'><h3>Order summary</h3><div className='total-row'><span>Subtotal</span><span>{money(order.subtotal)}</span></div>{order.discountTotal > 0 && <div className='total-row'><span>Discounts</span><span>−{money(order.discountTotal)}</span></div>}{order.loyaltyDiscount > 0 && <div className='total-row'><span>Reward points</span><span>−{money(order.loyaltyDiscount)}</span></div>}<div className='total-row'><span>Delivery</span><span>{order.shippingTotal === 0 ? 'Complimentary' : money(order.shippingTotal)}</span></div>{order.taxTotal > 0 && <div className='total-row'><span>Tax</span><span>{money(order.taxTotal)}</span></div>}<div className='grand-total'><span>Total</span><strong>{money(order.grandTotal)}</strong></div><p>Payment: <strong>{order.paymentMethod === 'cod' ? 'Cash on delivery' : order.paymentMethod}</strong> · {order.paymentStatus}</p>{order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && <p className='muted'>Payment has not been collected.</p>}<div className='review-address'><h3>Delivering to</h3><p>{order.shippingAddress.fullName}<br />{order.shippingAddress.line1}<br />{order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}{order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />{order.shippingAddress.phone}</p></div><button className='button button-outline full-width' onClick={() => window.print()}><Printer size={16}/>Print order summary</button>{canCancel && <button className='text-button' onClick={() => setCancel(true)}>Request cancellation</button>}<Link className='text-link' href='/pages/contact'>Need help with your order?</Link></aside></div>{cancel && <Modal title='Cancel this order?' onClose={() => {
                if (!busy)
                    setCancel(false);
            }}><p>The backend checks whether this order can still be cancelled. Orders already in production or dispatch may not be eligible.</p><Field label='Reason (optional)'><textarea maxLength={300} value={reason} onChange={e => setReason(e.target.value)} rows={3}/></Field>{error && <p className='field-error' role='alert'>{error}</p>}<button className='button' disabled={busy} onClick={() => void cancelPurchase()}>{busy ? 'Checking eligibility…' : 'Confirm cancellation'}</button></Modal>}</div>;
}

export function TrackOrder() {
    const [reference, setReference] = useState('');
    const [contact, setContact] = useState('');
    const [result, setResult] = useState<TrackingSummary | null>(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function submit(event: React.FormEvent) {
        event.preventDefault();
        if (busy) return;
        setError(''); setResult(null); setBusy(true);
        try { setResult(await trackOrder(reference.trim(), contact.trim())); }
        catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not look up the order.'); }
        finally { setBusy(false); }
    }
    return <div className='container tracking-page'>
        <Breadcrumbs items={[{ label: 'Track an order' }]} />
        <div className='page-heading'><Eyebrow>FROM OUR HANDS TO YOURS</Eyebrow><h1>Follow your order.</h1><p>Every chapter, from confirmation to your doorstep.</p></div>
        <div className='tracking-card'>
            <Package size={30} /><h2>Where is your order?</h2>
            <p>Use the order number on your receipt and the email or phone you entered at checkout.</p>
            <form onSubmit={submit}>
                <Field label='Order number'><input required value={reference} onChange={event => setReference(event.target.value)} maxLength={24} autoComplete='off' spellCheck={false} placeholder='TZL-…' /></Field>
                <Field label='Checkout email or phone'><input required value={contact} onChange={event => setContact(event.target.value)} maxLength={254} autoComplete='off' /></Field>
                {error && <p className='field-error' role='alert'>{error}</p>}
                <button className='button full-width' disabled={busy}>{busy ? 'Checking your order…' : 'Track order'}<ArrowRight size={17} /></button>
            </form>
            {result && <section className='tracking-result' aria-live='polite'>
                <h3>{result.orderNumber}</h3><p className={`status-badge status-${result.status}`}>{ORDER_STATUS_LABEL[result.status]}</p>
                {result.trackingNumber && <p>Courier reference: <strong>{result.trackingNumber}</strong></p>}
                {result.estimatedReadyDate && <p>Estimated ready date: {date(result.estimatedReadyDate)}</p>}
                <ol>{result.statusHistory.map((event, index) => <li key={`${event.timestamp}-${index}`}><strong>{ORDER_STATUS_LABEL[event.status]}</strong> · {date(event.timestamp)}</li>)}</ol>
            </section>}
            <Note>Full receipts remain private. Use your saved receipt link or sign in to view your address and order details.</Note>
            <ButtonLink href='/account/orders' secondary>Open my account orders</ButtonLink>
        </div>
    </div>;
}
