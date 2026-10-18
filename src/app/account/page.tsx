import { AccountOverview } from '@/views/Account';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: "My account" };
export default function Page() { return <AccountOverview />; }
