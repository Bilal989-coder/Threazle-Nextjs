import { features } from '@/lib/config';
import { ReleaseUnavailable } from '@/components/ReleaseUnavailable';
import { Measurements } from '@/views/Account';
import { categoriesCached, privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: 'Your measurements' };
export default async function Page() { if (!features.customization) return <ReleaseUnavailable title='Saved measurements' />; const categories = await categoriesCached(); return <Measurements categories={categories}/>; }
