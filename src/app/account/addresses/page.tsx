import { AddressBook } from '@/views/Account';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: "Address book" };
export default function Page() { return <AddressBook />; }
