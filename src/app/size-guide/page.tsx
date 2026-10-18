import { SizeGuide } from '@/views/Guides';
import { categoriesCached, meta } from '@/lib/server-catalog';
export const metadata = meta('Size & measurement guide', '/size-guide');
export default async function Page() { return <SizeGuide categories={await categoriesCached()}/>; }
