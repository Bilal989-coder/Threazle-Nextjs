import { Wishlist } from '@/views/Account';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: "Saved pieces" };
export default function Page() { return <Wishlist />; }
