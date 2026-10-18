import { AuthScreen } from '@/views/Account';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: "Forgot Password" };
export default function Page() { return <AuthScreen kind='forgot-password'/>; }
