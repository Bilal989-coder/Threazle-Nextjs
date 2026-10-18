import Home from '@/views/Home';
import { getShelf, getFabrics, getBanners } from '@/api/catalog';
import { categoriesCached, meta } from '@/lib/server-catalog';
import { isDemo } from '@/lib/config';
export const metadata = meta('Threads of Tradition', '/');
export default async function Page() {
    const [categories, arrivals, favorites, fabrics, banners] = await Promise.all([categoriesCached(), getShelf('new-arrivals', 8), getShelf('best-sellers', 8), getFabrics({ pageSize: 4 }).catch(() => null), getBanners().catch(() => [])]);
    return <Home categories={categories} arrivals={arrivals} favorites={favorites} fabrics={fabrics?.items || []} banners={banners} editorialImage={isDemo ? 'cream-sherwani-3' : arrivals.find(p => p.images.length > 1)?.images[1]?.url}/>;
}
