import { OrderList } from '@/views/Orders';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: "Your orders" };
export default function Page() { return <OrderList />; }
