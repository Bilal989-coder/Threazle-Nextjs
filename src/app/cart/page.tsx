import Cart from '@/views/Cart';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: "Your bag" };
export default function Page() { return <Cart />; }
