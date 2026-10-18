import { features } from '@/lib/config';
import { ReleaseUnavailable } from '@/components/ReleaseUnavailable';
import { TailoringGuide } from '@/views/Guides';
import { meta } from '@/lib/server-catalog';
export const metadata = meta('Custom tailoring', '/custom-tailoring');
export default function Page() { return features.customization ? <TailoringGuide /> : <ReleaseUnavailable title='Custom tailoring' />; }
