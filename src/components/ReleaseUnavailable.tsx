import Link from 'next/link';
export function ReleaseUnavailable({ title }: { title: string }) {
    return <main className='container section'><div className='page-heading'><span className='eyebrow'>THREAZLE</span><h1>{title}</h1><p>This service is not open yet. Our ready-made collection is available to browse and order.</p><Link className='button' href='/shop'>Shop ready-made</Link></div></main>;
}
