'use client';
import { PLACEHOLDER_IMAGE } from '@/lib/media';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Gift, Heart, LockKeyhole, LogOut, MapPin, Package, Pencil, Plus, Ruler, Trash2, User } from 'lucide-react';
import type { Address, Category, MeasurementProfile, Product } from '@/types';
import { ORDER_STATUS_LABEL } from '@/types';
import { getOrders } from '@/api/orders';
import { validDeliveryAddress } from '@/lib/checkout-validation';
import { useAuth } from '@/providers/AuthProvider';
import { useStore } from '@/context/store';
import { useMounted } from '@/hooks/useMounted';
import { config, isAuthConfigured, isDemo, features, safeInternalPath } from '@/lib/config';
import { getSupabase } from '@/lib/supabase';
import { useResource } from '@/hooks/useResource';
import { deleteAddress, deleteProfile, getAddresses, getLoyaltyConfig, getLoyaltySummary, getProfile, getProfiles, getWishlist, saveAddress, saveProfile, updateProfile } from '@/api/account';
import { getProductById } from '@/api/catalog';
import { money, validateMeasurements } from '@/lib/commerce';
import { ProductCard } from '@/components/ProductCard';
import { Photo } from '@/components/Photo';
import { Breadcrumbs, ButtonLink, EmptyState, ErrorState, Eyebrow, Field, Loading, Modal, Note } from '@/components/ui';
const NAV = [['/account', 'Overview', User], ['/account/orders', 'Your orders', Package], ['/account/measurements', 'Measurements', Ruler], ['/account/addresses', 'Address book', MapPin], ['/account/wishlist', 'Saved pieces', Heart], ['/account/rewards', 'Rewards', Gift]] as const;
export function AccountShell({ children, title, publicAccess = false }: {
    children: ReactNode;
    title: string;
    publicAccess?: boolean;
}) {
    const auth = useAuth(), pathname = usePathname(), store = useStore();
    const [signingOut, setSigningOut] = useState(false);
    // Server HTML always shows the session check; render account content only after hydration so a
    // session restored from storage before this streamed boundary hydrates cannot cause a mismatch.
    const mounted = useMounted();
    async function logout() {
        setSigningOut(true);
        try {
            await auth.signOut();
        }
        catch (e) {
            store.notify((e as Error).message);
        }
        finally {
            setSigningOut(false);
        }
    }
    if (!mounted || auth.loading)
        return <Loading label='Checking your session…'/>;
    if (!publicAccess && !auth.user)
        return <div className='container account-page'><EmptyState title='Your personal corner of Threazle.' text={isDemo ? 'Account features require your connected backend. This preview does not create customer accounts.' : 'Sign in to view orders, saved addresses and your wishlist.'} href={`/account/login?next=${encodeURIComponent(pathname)}`} label='Sign in'/></div>;
    return <div className='container account-page'><Breadcrumbs items={[{ label: 'My account', href: '/account' }, { label: title }]}/><div className='page-heading'><Eyebrow>YOUR THREAZLE</Eyebrow><h1>{title}</h1></div><div className='account-layout'><nav className='account-nav' aria-label='Account navigation'>{NAV.filter(([href]) => (features.customization || href !== '/account/measurements') && (features.loyalty || href !== '/account/rewards')).map(([href, label, Icon]) => <Link href={href} key={href} className={pathname === href || href !== '/account' && pathname.startsWith(href + '/') ? 'active' : ''}><Icon size={18}/>{label}</Link>)}{auth.user && <button disabled={signingOut} onClick={() => void logout()}><LogOut size={18}/>{signingOut ? 'Signing out…' : 'Sign out'}</button>}</nav><div className='account-content'>{children}</div></div></div>;
}
export function AccountOverview() {
    const { user } = useAuth(), store = useStore();
    const data = useResource(user ? `profile:${user.id}` : null, () => getProfile());
    const recentOrders = useResource(user && !isDemo ? `recent-orders:${user.id}` : null, () => getOrders());
    const [name, setName] = useState(''), [phone, setPhone] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
    useEffect(() => { setName(data.data?.fullName || ''); setPhone(data.data?.phone || ''); setError(''); }, [data.data]);
    async function save(e: React.FormEvent) {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            await updateProfile({ fullName: name.trim(), phone: phone.trim() });
            data.refresh();
            store.notify('Your profile has been updated.');
        }
        catch (e) { setError((e as Error).message); }
        finally { setBusy(false); }
    }
    return (
        <AccountShell title='Welcome back.'>
            {data.loading ? <Loading /> : data.error ? <ErrorState error={data.error} retry={data.refresh} /> : data.data && <>
                <div className='account-welcome'><h2>{data.data.fullName}</h2><p>Everything you need for your next chapter.</p></div>
                <div className='account-shortcuts'>
                    <Link href='/account/orders'><Package /><h3>Your orders</h3><p>Follow every step.</p><ArrowRight size={18} /></Link>
                    <Link href='/account/addresses'><MapPin /><h3>Your addresses</h3><p>Ready for your next order.</p><ArrowRight size={18} /></Link>
                    <Link href='/account/wishlist'><Heart /><h3>Your saved pieces</h3><p>Return to your favourites.</p><ArrowRight size={18} /></Link>
                </div>
                <section className='account-recent-orders' aria-label='Recent orders'>
                    <div className='account-section-title'><h2>Recent orders</h2><Link href='/account/orders' className='text-link'>View all<ArrowRight size={15} /></Link></div>
                    {recentOrders.loading ? <Loading label='Loading recent orders…' /> : recentOrders.error ? <ErrorState error={recentOrders.error} retry={recentOrders.refresh} /> : recentOrders.data?.length ?
                        <div className='order-list'>{[...recentOrders.data].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 3).map(order => (
                            <Link className='order-list-card' href={`/account/orders/${encodeURIComponent(order.id)}`} key={order.id}>
                                <div><span className='eyebrow'>{new Date(order.createdAt).toLocaleDateString('en-GB')}</span><h3>{order.orderNumber}</h3><p>{order.items.length} selection(s) · {money(order.grandTotal)}</p></div>
                                <div><span className={`status-badge status-${order.status}`}>{ORDER_STATUS_LABEL[order.status] || order.status}</span><ArrowRight size={18} /></div>
                            </Link>
                        ))}</div> : <p>Your first order will appear here. <Link className='text-link' href='/shop'>Explore the collection</Link></p>}
                </section>
                <form onSubmit={save} className='account-form'><h2>Your details</h2>
                    <div className='form-grid'>
                        <Field label='Full name'><input required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} autoComplete='name' /></Field>
                        <Field label='Phone number (optional)'><input type='tel' maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} autoComplete='tel' /></Field>
                        <Field label='Email' hint='Email identity is managed by your sign-in provider.'><input type='email' readOnly value={data.data.email} /></Field>
                    </div>
                    {error && <p className='field-error' role='alert'>{error}</p>}
                    <button className='button' disabled={busy}>{busy ? 'Saving…' : 'Save details'}</button>
                </form>
            </>}
        </AccountShell>
    );
}
export function AuthScreen({ kind }: {
    kind: 'login' | 'signup' | 'forgot-password' | 'verify' | 'reset-password';
}) {
    const params = useSearchParams(), router = useRouter(), auth = useAuth();
    const next = safeInternalPath(params.get('next'));
    const [name, setName] = useState(''), [email, setEmail] = useState(params.get('email') || ''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [token, setToken] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (busy)
            return;
        setError('');
        setMessage('');
        if (isDemo || !isAuthConfigured) {
            setError('Sign-in is temporarily unavailable. Please try again in a few minutes, or continue as a guest.');
            return;
        }
        if (kind === 'signup' && name.trim().length < 2) {
            setError('Enter your full name using at least two characters.');
            return;
        }
        if ((kind === 'signup' || kind === 'reset-password') && password !== confirm) {
            setError('The passwords do not match.');
            return;
        }
        setBusy(true);
        try {
            const client = getSupabase();
            const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
            if (kind === 'login') {
                const result = await client.auth.signInWithPassword({ email: email.trim(), password });
                if (result.error)
                    throw result.error;
                router.replace(next);
                router.refresh();
            }
            if (kind === 'signup') {
                const result = await client.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim(), account_type: 'customer' }, emailRedirectTo: callback } });
                if (result.error)
                    throw result.error;
                if (result.data.session) {
                    router.replace(next);
                    router.refresh();
                }
                else {
                    setMessage('Check your inbox for the confirmation link before signing in.');
                    setPassword('');
                    setConfirm('');
                }
            }
            if (kind === 'forgot-password') {
                const result = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password` });
                if (result.error)
                    throw result.error;
                setMessage('If this address is eligible, a password-reset email will arrive. Check your inbox and spam folder.');
            }
            if (kind === 'verify') {
                const result = await client.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'signup' });
                if (result.error)
                    throw result.error;
                router.replace(next);
                router.refresh();
            }
            if (kind === 'reset-password') {
                if (!auth.user)
                    throw new Error('Open the recovery link from your email before choosing a new password.');
                const result = await client.auth.updateUser({ password });
                if (result.error)
                    throw result.error;
                setPassword('');
                setConfirm('');
                setMessage('Your password was updated. You can continue to your account.');
            }
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    const heading = kind === 'login' ? 'Welcome back' : kind === 'signup' ? 'Create your account' : kind === 'verify' ? 'Verify your email' : kind === 'reset-password' ? 'Set a new password' : 'Reset your password';
    const intro = kind === 'login' ? 'Sign in to see your orders, saved measurements and wishlist.' : kind === 'signup' ? 'It takes a minute. Your measurements and favourites stay with you on every device.' : kind === 'forgot-password' ? 'Enter the email you registered with and we’ll send you a secure reset link.' : kind === 'verify' ? 'Enter the code from your confirmation email.' : 'Choose a strong password you don’t use anywhere else.';
    const tabs = kind === 'login' || kind === 'signup';
    return <div className='auth-shell'>
        <aside className='auth-visual' aria-hidden='true'>
            <Photo name={config.heroImage || PLACEHOLDER_IMAGE} alt='' sizes='50vw' />
            <div className='auth-visual-copy'>
                <span className='eyebrow'>THE THREAZLE ACCOUNT</span>
                <h2>Your fit, remembered.</h2>
                <ul>
                    <li><Ruler size={18}/>Save your measurements once and reuse them on every custom order</li>
                    <li><Package size={18}/>Track every order from tailoring to your door</li>
                    <li><Heart size={18}/>Keep your wishlist across phone and laptop</li>
                    <li><Gift size={18}/>View your reward points and purchase history</li>
                </ul>
            </div>
        </aside>
        <div className='auth-main'>
            <div className='auth-card'>
                <Link href='/' className='auth-brand' aria-label='Threazle home'>THREAZLE<span>THREADS OF TRADITION</span></Link>
                {tabs && <div className='auth-tabs' role='tablist' aria-label='Account'>
                    <Link role='tab' aria-selected={kind === 'login'} className={kind === 'login' ? 'is-active' : ''} href={`/account/login${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`}>Sign in</Link>
                    <Link role='tab' aria-selected={kind === 'signup'} className={kind === 'signup' ? 'is-active' : ''} href={`/account/signup${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`}>Create account</Link>
                </div>}
                <h1>{heading}</h1>
                <p className='auth-intro'>{intro}</p>
                <form onSubmit={submit} noValidate={false}>
                    {kind === 'signup' && <Field label='Full name'><input autoComplete='name' placeholder='e.g. Ahmed Khan' value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={100}/></Field>}
                    {kind !== 'reset-password' && <Field label='Email address'><input type='email' autoComplete='email' placeholder='you@example.com' value={email} onChange={e => setEmail(e.target.value)} required maxLength={254}/></Field>}
                    {['login', 'signup', 'reset-password'].includes(kind) && <div className='auth-password'>
                        {kind === 'login' && <Link className='auth-forgot' href='/account/forgot-password'>Forgot password?</Link>}
                        <Field label='Password' hint={kind === 'login' ? undefined : 'At least 8 characters. Mix letters, numbers and a symbol.'}>
                            <span className='password-input'><input type={showPassword ? 'text' : 'password'} autoComplete={kind === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={kind === 'login' ? 1 : 8} maxLength={128}/><button type='button' className='password-toggle' aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>
                        </Field>
                    </div>}
                    {['signup', 'reset-password'].includes(kind) && <Field label='Confirm password'><input type={showPassword ? 'text' : 'password'} autoComplete='new-password' value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} maxLength={128}/></Field>}
                    {kind === 'verify' && <Field label='Confirmation code' hint='You can also simply open the link in the email.'><input inputMode='numeric' autoComplete='one-time-code' value={token} onChange={e => setToken(e.target.value)} required minLength={6} maxLength={10}/></Field>}
                    {error && <p className='field-error' role='alert'>{error}</p>}
                    {message && <p className='success-message' role='status'>{message}</p>}
                    <button className='button full-width auth-submit' disabled={busy}>{busy ? 'Please wait…' : kind === 'login' ? 'Sign in' : kind === 'signup' ? 'Create account' : kind === 'forgot-password' ? 'Send reset link' : kind === 'verify' ? 'Verify email' : 'Update password'}<ArrowRight size={17}/></button>
                    {kind === 'signup' && <p className='auth-legal'>By creating an account you agree to our <Link href='/pages/privacy'>privacy policy</Link>.</p>}
                </form>
                {tabs && <div className='auth-divider'><span>or</span></div>}
                {tabs && <Link className='button button-outline full-width auth-guest' href={next.startsWith('/checkout') ? '/checkout' : '/new-arrivals'}>{next.startsWith('/checkout') ? 'Continue as guest' : 'Continue shopping'}<ArrowRight size={16}/></Link>}
                {!tabs && <Link className='text-link auth-back' href='/account/login'><ArrowLeft size={15}/>Back to sign in</Link>}
                {auth.user && <ButtonLink href={next} secondary className='full-width'>Continue to your account</ButtonLink>}
                <p className='auth-secure'><LockKeyhole size={14}/>Your password is handled by the configured sign-in provider. See our privacy policy for details.</p>
            </div>
        </div>
    </div>;
}
export function AuthCallback() {
    const params = useSearchParams(), router = useRouter();
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        async function finish() {
            try {
                if (params.get('error'))
                    throw new Error(params.get('error_description') || 'The confirmation link could not be used.');
                if (!isAuthConfigured || isDemo)
                    throw new Error('Sign-in is temporarily unavailable. Please try again shortly.');
                const auth = getSupabase().auth;
                // getSession waits for SDK URL detection. Do not exchange a PKCE code twice.
                let { data, error } = await auth.getSession();
                if (error)
                    throw error;
                if (!data.session && params.get('code')) {
                    const result = await auth.exchangeCodeForSession(params.get('code')!);
                    if (result.error)
                        throw result.error;
                    data = { session: result.data.session };
                }
                if (!data.session)
                    throw new Error('This link has expired or was opened in a different browser. Request a fresh link in this browser.');
                if (active) {
                    router.replace(safeInternalPath(params.get('next')));
                    router.refresh();
                }
            }
            catch (e) {
                if (active)
                    setError((e as Error).message);
            }
        }
        void finish();
        return () => { active = false; };
    }, [params, router]);
    return <div className='container auth-callback'>{error ? <><ErrorState error={error}/><ButtonLink href='/account/login'>Return to sign in</ButtonLink></> : <Loading label='Completing your sign-in…'/>}</div>;
}
const EMPTY_ADDRESS: Omit<Address, 'id'> = { label: 'Home', fullName: '', line1: '', line2: '', city: '', postalCode: '', phone: '', isDefault: false };
export function AddressBook() {
    const { user } = useAuth(), store = useStore(), data = useResource(user ? `addresses:${user.id}` : null, () => getAddresses());
    const [form, setForm] = useState<Omit<Address, 'id'>>({ ...EMPTY_ADDRESS }), [editing, setEditing] = useState<string | undefined>(), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [deleting, setDeleting] = useState<string | null>(null);
    useEffect(() => { setOpen(false); setDeleting(null); setEditing(undefined); setForm({ ...EMPTY_ADDRESS }); setError(''); }, [user?.id]);
    function edit(address?: Address) { setForm(address ? { label: address.label, fullName: address.fullName, line1: address.line1, line2: address.line2 || '', city: address.city, postalCode: address.postalCode, phone: address.phone, isDefault: address.isDefault } : { ...EMPTY_ADDRESS }); setEditing(address?.id); setError(''); setOpen(true); }
    async function save(e: React.FormEvent) {
        e.preventDefault();
        if (busy) return;
        if (!validDeliveryAddress(form)) { setError('Review the recipient, street, city, postal code and phone number.'); return; }
        setBusy(true);
        setError('');
        try {
            await saveAddress(form, editing);
            setOpen(false);
            data.refresh();
            store.notify('Address saved. Existing orders are unchanged.');
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function remove() {
        if (!deleting || busy)
            return;
        setBusy(true);
        try {
            await deleteAddress(deleting);
            setDeleting(null);
            data.refresh();
        }
        catch (e) {
            store.notify((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return <AccountShell title='Your address book.'>{data.loading ? <Loading /> : data.error ? <ErrorState error={data.error} retry={data.refresh}/> : <><div className='account-section-title'><p>Keep your next delivery a little simpler.</p><button className='button compact' onClick={() => edit()} disabled={(data.data?.length || 0) >= 20}><Plus size={16}/>Add address</button></div><div className='address-grid'>{data.data?.map(address => <article className='address-card' key={address.id}><span className='eyebrow'>{address.label}{address.isDefault ? ' · DEFAULT' : ''}</span><h3>{address.fullName}</h3><p>{address.line1}<br />{address.line2 && <>{address.line2}<br /></>}{address.city}, {address.postalCode}<br />{address.phone}</p><div className='row-actions'><button className='text-button' onClick={() => edit(address)}><Pencil size={14}/>Edit</button><button className='text-button' onClick={() => setDeleting(address.id)}><Trash2 size={14}/>Delete</button></div></article>)}</div>{data.data?.length === 0 && <p>No saved addresses yet. Guest checkout is still available.</p>}</>}{open && <Modal title={editing ? 'Edit address' : 'Add an address'} onClose={() => {
                if (!busy)
                    setOpen(false);
            }}><form onSubmit={save}><div className='form-grid'>{(['label', 'fullName', 'line1', 'line2', 'city', 'postalCode', 'phone'] as const).map(key => <Field key={key} label={{ label: 'Address label', fullName: 'Recipient name', line1: 'Street address', line2: 'Additional details (optional)', city: 'City', postalCode: 'Postal code', phone: 'Phone number' }[key]}><input value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={key !== 'line2'} minLength={key === 'fullName' || key === 'city' ? 2 : key === 'line1' ? 3 : undefined} maxLength={key === 'label' ? 40 : key === 'phone' ? 20 : key === 'postalCode' ? 6 : key.startsWith('line') ? 200 : 100} pattern={key === 'postalCode' ? '[0-9]{4,6}' : undefined} type={key === 'phone' ? 'tel' : 'text'}/></Field>)}</div><label className='consent-check'><input type='checkbox' checked={!!form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}/>Make this my default address</label>{error && <p className='field-error' role='alert'>{error}</p>}<button className='button full-width' disabled={busy}>{busy ? 'Saving…' : 'Save address'}</button></form></Modal>}{deleting && <Modal title='Delete this saved address?' onClose={() => {
                if (!busy)
                    setDeleting(null);
            }}><p>Placed orders keep their original address. This only removes your saved address-book entry.</p><button className='button' disabled={busy} onClick={() => void remove()}>{busy ? 'Deleting…' : 'Delete saved address'}</button></Modal>}</AccountShell>;
}
export function Measurements({ categories }: {
    categories: Category[];
}) {
    const { user } = useAuth(), store = useStore(), data = useResource(user ? `measurements:${user.id}` : null, () => getProfiles());
    const [editing, setEditing] = useState<string | undefined>(), [name, setName] = useState(''), [categoryId, setCategory] = useState(categories[0]?.id || ''), [values, setValues] = useState<Record<string, number>>({}), [notes, setNotes] = useState(''), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [deleting, setDeleting] = useState<string | null>(null);
    useEffect(() => { setOpen(false); setDeleting(null); setEditing(undefined); setName(''); setValues({}); setNotes(''); setError(''); }, [user?.id]);
    const category = categories.find(c => c.id === categoryId);
    function edit(profile?: MeasurementProfile) { setName(profile?.profileName || ''); setCategory(profile?.categoryId || categories[0]?.id || ''); { const fields = categories.find(c => c.id === (profile?.categoryId || categories[0]?.id))?.measurementFields || []; setValues(Object.fromEntries(Object.entries(profile?.values || {}).filter(([key]) => fields.some(field => field.key === key)))); } setNotes(profile?.notes || ''); setEditing(profile?.id); setError(''); setOpen(true); }
    async function save(e: React.FormEvent) {
        e.preventDefault();
        if (busy) return;
        if (!name.trim()) { setError('Give this measurement profile a name.'); return; }
        if (!category?.measurementFields.length) {
            setError('Choose a category with a configured measurement guide.');
            return;
        }
        const errors = validateMeasurements(values, category.measurementFields);
        if (Object.keys(errors).length) {
            setError(Object.values(errors)[0]);
            return;
        }
        setBusy(true);
        setError('');
        try {
            await saveProfile({ profileName: name.trim(), categoryId, values: { ...values }, notes: notes.trim() || undefined }, editing);
            setOpen(false);
            data.refresh();
            store.notify('Measurements saved. Your existing bag items and orders have not changed.');
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function remove() {
        if (!deleting || busy)
            return;
        setBusy(true);
        try {
            await deleteProfile(deleting);
            setDeleting(null);
            data.refresh();
        }
        catch (e) {
            store.notify((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return <AccountShell title='A fit worth remembering.'>{data.loading ? <Loading /> : data.error ? <ErrorState error={data.error} retry={data.refresh}/> : <><div className='account-section-title'><p>Save a profile for yourself or someone you love.</p><button className='button compact' disabled={!categories.length || (data.data?.length || 0) >= 20} onClick={() => edit()}><Plus size={16}/>New profile</button></div><Note>Profiles are category-specific. Changing them does not silently change garments already ordered.</Note><div className='address-grid'>{data.data?.map(profile => { const category = categories.find(c => c.id === profile.categoryId); return <article className='address-card' key={profile.id}><Eyebrow>{category?.name || 'Garment measurements'}</Eyebrow><h3>{profile.profileName}</h3><dl className='compact-dl'>{Object.entries(profile.values).map(([key, n]) => <div key={key}><dt>{category?.measurementFields.find(f => f.key === key)?.label || key}</dt><dd>{n} {category?.measurementFields.find(f => f.key === key)?.unit || ''}</dd></div>)}</dl><div className='row-actions'><button className='text-button' onClick={() => edit(profile)}><Pencil size={14}/>Edit</button><button className='text-button' onClick={() => setDeleting(profile.id)}><Trash2 size={14}/>Delete</button></div></article>; })}</div>{!data.data?.length && <p>No measurements saved yet.</p>}</>}{open && <Modal title={editing ? 'Edit measurement profile' : 'Create measurement profile'} onClose={() => {
                if (!busy)
                    setOpen(false);
            }}><form onSubmit={save}><Field label='Profile name'><input required maxLength={60} value={name} onChange={e => setName(e.target.value)} placeholder='My measurements, Father…'/></Field><Field label='Garment category'><select value={categoryId} onChange={e => { setCategory(e.target.value); setValues({}); }} required>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><div className='measurement-grid'>{category?.measurementFields.map(field => <Field key={field.key} label={`${field.label} (${field.unit})`} hint={field.helpText}><input type='number' required min={field.min ?? 0.01} max={field.max ?? 1000} step='any' value={values[field.key] ?? ''} onChange={e => setValues(v => { const next = { ...v }; if (e.target.value === '') delete next[field.key]; else next[field.key] = Number(e.target.value); return next; })}/></Field>)}</div><Field label='Notes (optional)'><textarea value={notes} maxLength={500} onChange={e => setNotes(e.target.value)} rows={2}/></Field>{error && <p className='field-error' role='alert'>{error}</p>}<button className='button full-width' disabled={busy}>{busy ? 'Saving…' : 'Save measurements'}</button></form></Modal>}{deleting && <Modal title='Delete this profile?' onClose={() => {
                if (!busy)
                    setDeleting(null);
            }}><p>This removes the saved profile. Order snapshots remain unchanged.</p><button className='button' disabled={busy} onClick={() => void remove()}>{busy ? 'Deleting…' : 'Delete profile'}</button></Modal>}</AccountShell>;
}
export function Wishlist() {
    const auth = useAuth(), store = useStore(), mounted = useMounted();
    const list = useResource(mounted && !auth.loading && store.hydrated ? `wishlist:${auth.user?.id || 'guest'}:${store.wishlist.join(',')}` : null, async (signal) => {
        if (auth.user && !isDemo)
            return getWishlist();
        const products: Product[] = [];
        for (let i = 0; i < store.wishlist.length; i += 4) {
            const batch = await Promise.all(store.wishlist.slice(i, i + 4).map(id => getProductById(id, signal)));
            products.push(...batch.filter((p): p is Product => !!p));
        }
        return products;
    });
    return <AccountShell title='Pieces that stayed with you.' publicAccess>{!auth.user && <Note>Guest favorites are saved on this device. Sign in to sync them to your account.</Note>}{list.loading ? <Loading label='Loading your saved pieces…'/> : list.error ? <ErrorState error={list.error} retry={list.refresh}/> : list.data?.length ? <div className='product-grid wishlist-grid'>{list.data.map(p => <ProductCard key={p.id} product={p}/>)}</div> : <EmptyState title='Save a little inspiration.' text='Tap the heart on a design to find it here later.'/>}</AccountShell>;
}
export function Rewards() {
    const { user } = useAuth(), data = useResource(user ? `rewards:${user.id}` : null, async () => { const [summary, config] = await Promise.all([getLoyaltySummary(), getLoyaltyConfig()]); return { summary, config }; });
    return <AccountShell title='Your next chapter, rewarded.'>{data.loading ? <Loading /> : data.error ? <ErrorState error={data.error} retry={data.refresh}/> : data.data && <><div className='reward-balance'><Eyebrow>YOUR BALANCE</Eyebrow><h2>{data.data.summary.balance}<small>points</small></h2><p>Redeem eligible points on your next order.</p></div><div className='rewards-rules'><p>Earn one point per {money(data.data.config.earnRatePkrPerPoint)} of eligible spend.</p><p>Each point redeems for {money(data.data.config.redeemValuePkrPerPoint)}. Minimum: {data.data.config.minPointsToRedeem} points.</p><p>Up to {data.data.config.maxRedeemPctOfOrder}% of eligible merchandise value. Points expire according to the configured {data.data.config.pointsExpiryMonths}-month period.</p></div><h2>Your points history</h2>{data.data.summary.transactions.length ? <div className='table-scroll'><table><thead><tr><th>Date</th><th>Activity</th><th>Points</th><th>Details</th></tr></thead><tbody>{data.data.summary.transactions.map(t => <tr key={t.id}><td>{new Date(t.createdAt).toLocaleDateString('en-GB')}</td><td>{t.type}</td><td>{t.points}</td><td>{t.reason}{t.orderId && <Link href={`/account/orders/${t.orderId}`}> {t.orderNumber || 'View order'}</Link>}</td></tr>)}</tbody></table></div> : <p>Your first eligible reward will appear here.</p>}</>}</AccountShell>;
}
