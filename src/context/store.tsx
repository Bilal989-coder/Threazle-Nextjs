'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CartItem, Order, Product } from '@/types';
import { changeWishlist, mergeWishlist } from '@/api/account';
import { mergeCart, restoreCart } from '@/lib/commerce';
import { isDemo } from '@/lib/config';
import { useAuth } from '@/providers/AuthProvider';
const CART_KEY = isDemo ? 'threazle.preview.cart.v2' : 'threazle.cart.v2';
const WISH_KEY = isDemo ? 'threazle.preview.wishlist.v2' : 'threazle.guest-wishlist.v2';
interface Store {
    cart: CartItem[];
    hydrated: boolean;
    bagOpen: boolean;
    setBagOpen: (v: boolean) => void;
    addItem: (item: CartItem, editingId?: string) => void;
    removeItem: (id: string) => void;
    quantity: (id: string, qty: number) => void;
    replaceCart: (items: CartItem[]) => void;
    clearCart: () => void;
    wishlist: string[];
    wishlistProducts: Product[];
    toggleWishlist: (p: Product) => Promise<void>;
    notice: string;
    notify: (message: string) => void;
    orders: Order[];
    rememberOrder: (order: Order) => void;
}
const Context = createContext<Store | undefined>(undefined);
export function StoreProvider({ children }: {
    children: ReactNode;
}) {
    const { user, loading: authLoading } = useAuth();
    const [cart, setCartState] = useState<CartItem[]>([]), [hydrated, setHydrated] = useState(false), [bagOpen, setBagOpen] = useState(false);
    const [wishlist, setWishlist] = useState<string[]>([]), [wishlistProducts, setWishlistProducts] = useState<Product[]>([]), [notice, notify] = useState(''), [orders, setOrders] = useState<Order[]>([]);
    const [ordersOwner, setOrdersOwner] = useState<string | null>(null);
    const [wishlistOwner, setWishlistOwner] = useState<string | null>(null);
    const ownerRef = useRef<string | null>(user?.id ?? null);
    ownerRef.current = user?.id ?? null;
    const visibleWishlist = wishlistOwner === ownerRef.current ? wishlist : [];
    const cartRef = useRef<CartItem[]>([]);
    function setCart(next: CartItem[] | ((items: CartItem[]) => CartItem[])) { const value = typeof next === 'function' ? next(cartRef.current) : next; cartRef.current = value; setCartState(value); }
    const previousUser = useRef<string | null | undefined>(undefined), timer = useRef<ReturnType<typeof setTimeout> | null>(null), wishBusy = useRef(new Set<string>());
    useEffect(() => {
        if (authLoading || hydrated)
            return;
        try {
            // The bag survives closing the tab (localStorage); older tab-only bags are migrated once.
            const envelope = JSON.parse(localStorage.getItem(CART_KEY) || sessionStorage.getItem(CART_KEY) || 'null');
            if (envelope && envelope.version === 2) {
                let items = restoreCart(JSON.stringify(envelope.items));
                if (envelope.owner !== 'guest' && envelope.owner !== (user?.id || 'guest'))
                    items = items.filter(item => item.mode === 'ready_made');
                setCart(items);
            }
            const ids = JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
            if (Array.isArray(ids))
                setWishlist(ids.filter(x => typeof x === 'string').slice(0, 200));
        }
        catch { }
        setHydrated(true);
    }, [authLoading, hydrated, user?.id]);
    useEffect(() => {
        if (!hydrated || (previousUser.current !== undefined && previousUser.current !== (user?.id ?? null)))
            return;
        try {
            localStorage.setItem(CART_KEY, JSON.stringify({ version: 2, owner: user?.id || 'guest', items: cart }));
            sessionStorage.removeItem(CART_KEY);
        }
        catch {
            notify('Your browser could not save your bag. Keep this page open until checkout.');
        }
    }, [cart, hydrated, user?.id]);
    useEffect(() => {
        if (!hydrated || user || wishlistOwner !== null)
            return;
        try {
            localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
        }
        catch { }
    }, [wishlist, wishlistOwner, user, hydrated]);
    useEffect(() => {
        if (authLoading || !hydrated)
            return;
        const id = user?.id ?? null, prior = previousUser.current;
        previousUser.current = id;
        if (prior !== undefined && prior !== id) {
            setOrders([]);
            setOrdersOwner(id);
            setWishlistProducts([]);
            setWishlist([]);
            setWishlistOwner(id);
            if (prior !== null)
                setCart(items => items.filter(i => i.mode === 'ready_made')); // Do not discard an unresolved checkout retry key.
            if (!id) {
                setWishlist([]);
                try {
                    localStorage.removeItem(WISH_KEY);
                }
                catch { }
            }
        }
        if (!id || isDemo)
            return;
        let active = true;
        let guest: string[] = [];
        try {
            guest = JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
        }
        catch { }
        mergeWishlist(Array.isArray(guest) ? guest.filter(x => typeof x === 'string').slice(0, 200) : []).then(result => {
            if (active) {
                setWishlist(result.productIds);
                setWishlistOwner(id);
                try { localStorage.removeItem(WISH_KEY); } catch { /* Server wishlist is still valid. */ }
            }
        }).catch(() => {
            if (active)
                notify('Your saved wishlist could not be loaded. Retry from your account.');
        });
        return () => { active = false; };
    }, [user?.id, authLoading, hydrated]);
    useEffect(() => {
        if (!notice)
            return;
        if (timer.current)
            clearTimeout(timer.current);
        timer.current = setTimeout(() => notify(''), 6500);
        return () => {
            if (timer.current)
                clearTimeout(timer.current);
        };
    }, [notice]);
    function addItem(item: CartItem, editingId?: string) { const next = mergeCart(cartRef.current, item, editingId); setCart(next); setBagOpen(true); notify(editingId ? 'Your selection has been updated.' : 'Added to your bag.'); }
    async function toggleWishlist(p: Product) {
        const mutationOwner = user?.id ?? null;
        const operationKey = `${mutationOwner || 'guest'}:${p.id}`;
        if (wishBusy.current.has(operationKey)) return;
        wishBusy.current.add(operationKey);
        const saved = visibleWishlist.includes(p.id);
        try {
            if (user && !isDemo)
                await changeWishlist(p.id, !saved);
            if (ownerRef.current !== mutationOwner) return;
            setWishlistOwner(mutationOwner);
            setWishlist(ids => saved ? ids.filter(id => id !== p.id) : [...new Set([...ids, p.id])].slice(0, 200));
            setWishlistProducts(ps => saved ? ps.filter(x => x.id !== p.id) : [...ps.filter(x => x.id !== p.id), p]);
            notify(saved ? 'Removed from saved pieces.' : 'Saved to your wishlist.');
        }
        catch (e) {
            if (ownerRef.current === mutationOwner) notify(e instanceof Error ? e.message : 'Unable to update wishlist.');
        }
        finally {
            wishBusy.current.delete(operationKey);
        }
    }
    function quantity(id: string, qty: number) {
        const item = cartRef.current.find(i => i.id === id);
        if (!item)
            return;
        try {
            setCart(mergeCart(cartRef.current, { ...item, quantity: qty }, id));
        }
        catch (e) {
            notify((e as Error).message);
        }
    }
    return <Context.Provider value={{ cart, hydrated, bagOpen, setBagOpen, addItem, removeItem: id => setCart(a => a.filter(i => i.id !== id)), quantity, replaceCart: setCart, clearCart: () => setCart([]), wishlist: visibleWishlist, wishlistProducts: wishlistOwner === ownerRef.current ? wishlistProducts : [], toggleWishlist, notice, notify, orders: ordersOwner === ownerRef.current ? orders : [], rememberOrder: o => { if (!o.customerId || o.customerId === ownerRef.current) { setOrdersOwner(ownerRef.current); setOrders(a => [structuredClone(o), ...a.filter(x => x.id !== o.id)]); } } }}>{children}</Context.Provider>;
}
export function useStore() {
    const c = useContext(Context);
    if (!c)
        throw new Error('StoreProvider missing.');
    return c;
}
