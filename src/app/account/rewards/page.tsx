import { features } from '@/lib/config';
import { ReleaseUnavailable } from '@/components/ReleaseUnavailable';
import { Rewards } from '@/views/Account';
import { privateMeta } from '@/lib/server-catalog';
export const metadata = { ...privateMeta, title: "Your rewards" };
export default function Page() { return features.loyalty ? <Rewards /> : <ReleaseUnavailable title='Rewards' />; }
