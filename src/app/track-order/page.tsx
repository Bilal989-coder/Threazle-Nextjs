import { TrackOrder } from '@/views/Orders';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: "Track your order" };
export default function Page() { return <TrackOrder />; }
