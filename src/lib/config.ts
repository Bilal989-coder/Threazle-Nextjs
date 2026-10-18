/** Public browser configuration only. Business secrets remain in Express. */
export const config = {
    mode: 'api',
    releasePhase: Number(process.env.NEXT_PUBLIC_RELEASE_PHASE || '1'),
    apiUrl: (process.env.NEXT_PUBLIC_API_URL || '/api/v1').replace(/\/+$/, ''),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
    imageHosts: (process.env.NEXT_PUBLIC_IMAGE_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean),
    enableIndexing: process.env.NEXT_PUBLIC_ENABLE_INDEXING === 'true',
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || '',
    whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, ''),
    heroImage: process.env.NEXT_PUBLIC_HERO_IMAGE || '',
    // Business contact details shown in the footer and on the Contact page.
    supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '',
    businessAddress: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || '',
    businessHours: process.env.NEXT_PUBLIC_BUSINESS_HOURS || '',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || '',
} as const;
// Compatibility symbol for existing view guards. This release has no demo mode.
export const isDemo: boolean = false;
export const features = { customization: config.releasePhase >= 2, loyalty: config.releasePhase >= 3, coupons: config.releasePhase >= 3 } as const;
export const isAuthConfigured = Boolean(config.supabaseUrl && config.supabaseKey);
export function safeInternalPath(value: string | null | undefined, fallback = '/account'): string {
    if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value))
        return fallback;
    try {
        const parsed = new URL(value, 'https://threazle.invalid');
        return parsed.origin === 'https://threazle.invalid' ? parsed.pathname + parsed.search + parsed.hash : fallback;
    }
    catch {
        return fallback;
    }
}
export function safeImageSource(value?: string): string {
    if (!value)
        return '/images/placeholder.svg';
    if (value.startsWith('/') && !value.startsWith('//') && !/[\\\x00-\x20]/.test(value))
        return value;
    try {
        const url = new URL(value);
        const hosts = [...config.imageHosts];
        if (config.supabaseUrl)
            hosts.push(new URL(config.supabaseUrl).hostname);
        if (url.protocol === 'https:' && !url.username && !url.password && !url.port && hosts.includes(url.hostname))
            return url.href;
    }
    catch { /* Invalid or unapproved media is never fetched. */ }
    return '/images/placeholder.svg';
}
