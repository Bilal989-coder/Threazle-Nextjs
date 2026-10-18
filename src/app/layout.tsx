import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { serif, sans } from './fonts';
import '@/styles/globals.css';
import '@/styles/refinement.css';
import Layout from '@/components/Layout';
import { AuthProvider } from '@/providers/AuthProvider';
import { StoreProvider } from '@/context/store';
import { categoriesCached } from '@/lib/server-catalog';
import { config, isDemo } from '@/lib/config';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    metadataBase: new URL(config.siteUrl),
    title: { default: 'Threazle — Threads of Tradition', template: '%s | Threazle' },
    description: 'A modern expression of heritage. Discover ready-made menswear and custom tailoring.',
    robots: { index: config.enableIndexing && !isDemo, follow: config.enableIndexing && !isDemo },
    referrer: 'no-referrer', icons: { icon: '/brand/favicon.webp', apple: '/brand/apple-touch-icon.webp' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#1f2a44' };
export default async function RootLayout({ children }: {
    children: ReactNode;
}) {
    // A catalog outage must not prevent the user from reaching sign-in or contact.
    const categories = await categoriesCached().catch(() => []);
    return <html lang='en'><body className={`${serif.variable} ${sans.variable}`}><AuthProvider><StoreProvider><Suspense fallback={<main className='container loading-state'>Opening Threazle…</main>}><Layout categories={categories}>{children}</Layout></Suspense></StoreProvider></AuthProvider></body></html>;
}
