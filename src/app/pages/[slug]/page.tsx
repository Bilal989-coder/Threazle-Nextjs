import sanitizeHtml from 'sanitize-html';
import { ContentPage, ContactPage } from '@/views/Info';
import { notFound } from 'next/navigation';
import { CONTENT_TITLES as titles } from '@/lib/content';
import { meta, cmsPageCached } from '@/lib/server-catalog';
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) {
    const { slug } = await params;
    if (slug === 'contact') return meta(titles.contact, '/pages/contact');
    const page = await cmsPageCached(slug);
    return { ...meta(page?.title || titles[slug] || 'Information', `/pages/${slug}`),
        ...(!page ? { robots: { index: false, follow: false } } : {}) };
}
export default async function Page({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) {
    const { slug } = await params;
    if (slug === 'contact')
        return <ContactPage />;
    const page = await cmsPageCached(slug);
    if (!page && !Object.prototype.hasOwnProperty.call(titles, slug)) notFound();
    const safe = page ? { ...page, content: sanitizeHtml(page.content, { allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'blockquote', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td'], allowedAttributes: { a: ['href', 'title'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'] }, allowedSchemes: ['https', 'mailto', 'tel'], allowProtocolRelative: false, transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) } }) } : null;
    return <ContentPage page={safe} title={titles[slug] || page?.title || 'Information'}/>;
}
