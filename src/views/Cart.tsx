'use client';
import { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/store';
import { useMounted } from '@/hooks/useMounted';
import { repriceCart } from '@/services/reprice';
import { money, subtotal } from '@/lib/commerce';
import { isDemo } from '@/lib/config';
import { BagLines } from '@/components/BagLines';
import { Breadcrumbs, Eyebrow, EmptyState, ErrorState, Loading, Note } from '@/components/ui';
export default function Cart() {
    const store = useStore(), router = useRouter(), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const mounted = useMounted();
    async function proceed() {
        if (busy)
            return;
        setBusy(true);
        setError('');
        try {
            const result = await repriceCart(store.cart);
            store.replaceCart(result.items);
            if (result.changed) {
                store.notify('Some prices have changed. Review your updated bag, then continue.');
            }
            else
                router.push('/checkout');
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    if (!mounted || !store.hydrated)
        return <Loading label='Opening your bag…'/>;
    return <div className='container cart-page'><Breadcrumbs items={[{ label: 'Your bag' }]}/><div className='page-heading'><Eyebrow>YOUR NEXT CHAPTER</Eyebrow><h1>A considered selection.</h1><p>{store.cart.length ? 'The pieces you chose, all in one place.' : 'Every story begins with a first piece.'}</p></div>{!store.cart.length ? <EmptyState title='Your bag is waiting.' text='Explore ready-made designs or create something personal.'/> : <div className='cart-layout'><div><BagLines items={store.cart} edit onQuantity={store.quantity} onRemove={store.removeItem}/>{error && <ErrorState error={error}/>}<Note>Your bag stays in this browser tab. Prices and availability are checked again before ordering.</Note></div><aside className='order-summary'><h3>Your selection</h3><div className='total-row'><span>Subtotal</span><strong>{money(subtotal(store.cart))}</strong></div><p className='muted'>Delivery, applicable discounts and final totals are shown at checkout.</p><button className='button full-width' onClick={proceed} disabled={busy}>{busy ? 'Checking availability…' : 'Continue to checkout'}<ArrowRight size={17}/></button><div className='summary-trust'><ShieldCheck size={17}/><span>No payment details are stored in your bag.</span></div></aside></div>}</div>;
}
