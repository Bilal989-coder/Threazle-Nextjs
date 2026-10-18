import { features } from '@/lib/config';
import { ReleaseUnavailable } from '@/components/ReleaseUnavailable';
import { pageNumber } from '@/lib/catalog-presentation';
import { FabricLibrary } from '@/views/Fabrics';
import { getFabrics } from '@/api/catalog';
import { categoriesCached, fabricTypesCached, meta, type SearchValues } from '@/lib/server-catalog';
export const metadata = meta('Fabric library', '/fabrics');
export default async function Page({ searchParams }: {
    searchParams: Promise<SearchValues>;
}) {
    if (!features.customization) return <ReleaseUnavailable title='Fabric selection' />;
    const p = await searchParams;
    const one = (key: string) => Array.isArray(p[key]) ? p[key][0] : p[key];
    const [data, categories, types] = await Promise.all([getFabrics({ page: pageNumber(one('page')), pageSize: 12, categoryId: one('categoryId'), type: one('type'), search: one('search'), stockStatus: ['in_stock', 'low_stock', 'out_of_stock'].includes(one('stockStatus') || '') ? one('stockStatus') : undefined }), categoriesCached(), fabricTypesCached().catch(() => [])]);
    return <FabricLibrary data={data} categories={categories} types={types}/>;
}
