import type { NextConfig } from 'next';
const hosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean);
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
        hosts.push(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname);
    }
    catch {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL.');
    }
}
if (hosts.some(host => /[\s*:/@\\]/.test(host) || !/^[a-z0-9.-]+$/i.test(host))) {
    throw new Error('Image hosts must be exact hostnames without schemes, wildcards, ports or paths.');
}
const nextConfig: NextConfig = {
    // Normal App Router deployment: dynamic backend product IDs and customer orders
    // cannot use the previous fixed static export.
    poweredByHeader: false,
    output: 'standalone',
    async rewrites() {
        const internal = process.env.API_INTERNAL_URL;
        return internal ? [{ source: '/api/v1/:path*', destination: `${internal.replace(/\/+$/, '')}/:path*` }] : [];
    },
    images: {
        remotePatterns: [...new Set(hosts)].map(hostname => ({ protocol: 'https' as const, hostname, port: '', pathname: '/**' })),
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [320, 480, 640, 750, 828, 1080, 1280, 1600],
        imageSizes: [32, 48, 64, 96, 128, 192, 256],
        qualities: [75, 85],
        maximumRedirects: 0,
    },
    async headers() {
        return [{ source: '/:path*', headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'no-referrer' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ] }, { source: '/images/:path*', headers: [
                    { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
                ] }];
    },
};
export default nextConfig;
