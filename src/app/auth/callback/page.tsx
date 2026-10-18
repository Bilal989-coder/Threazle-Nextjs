import { AuthCallback } from '@/views/Account';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: "Complete sign-in" };
export default function Page() { return <AuthCallback />; }
