import { OrderDetail } from '@/views/Orders';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: 'Your order' };
export default async function Page({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { const { id } = await params; return <OrderDetail id={id} confirmation={true}/>; }
