import { AuthScreen } from '@/views/Account';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: "Login" };
export default function Page() { return <AuthScreen kind='login'/>; }
