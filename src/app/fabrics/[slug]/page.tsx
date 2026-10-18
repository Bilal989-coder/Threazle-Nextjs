import { features } from '@/lib/config';
import { ReleaseUnavailable } from '@/components/ReleaseUnavailable';
import { notFound } from 'next/navigation';
import { FabricDetail } from '@/views/Fabrics';
import { getFabric } from '@/api/catalog';
import { categoriesCached, meta } from '@/lib/server-catalog';
export async function generateMetadata({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) { if (!features.customization) return meta('Fabric selection', '/fabrics'); const { slug } = await params; const f = await getFabric(slug); return meta(f?.name || 'Fabric', `/fabrics/${slug}`, f?.description); }
export default async function Page({ params }: {
    params: Promise<{
        slug: string;
    }>;
}) {
    if (!features.customization) return <ReleaseUnavailable title='Fabric selection' />;
    const { slug } = await params;
    const [fabric, categories] = await Promise.all([getFabric(slug), categoriesCached()]);
    if (!fabric)
        notFound();
    return <FabricDetail fabric={fabric} categories={categories}/>;
}
