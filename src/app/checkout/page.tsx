import Checkout from '@/views/Checkout';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: "Checkout" };
export default function Page() { return <Checkout />; }
