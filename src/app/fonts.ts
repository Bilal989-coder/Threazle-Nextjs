import localFont from 'next/font/local';

// Installed from npm, self-hosted by Next.js. No external font request at runtime.
export const serif = localFont({
    variable: '--font-serif',
    display: 'swap',
    fallback: ['Georgia', 'Times New Roman', 'serif'],
    src: [
        { path: '../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2', weight: '400', style: 'normal' },
        { path: '../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-italic.woff2', weight: '400', style: 'italic' },
        { path: '../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff2', weight: '500', style: 'normal' },
        { path: '../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff2', weight: '600', style: 'normal' },
    ],
});
export const sans = localFont({
    variable: '--font-sans',
    display: 'swap',
    fallback: ['Arial', 'Helvetica', 'sans-serif'],
    src: [{ path: '../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', weight: '400 700', style: 'normal' }],
});
