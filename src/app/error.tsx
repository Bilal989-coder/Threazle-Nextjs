'use client';
import { useEffect } from 'react';
import { ErrorState, ButtonLink } from '@/components/ui';
export default function ErrorPage({ error, reset }: {
    error: Error & {
        digest?: string;
    };
    reset: () => void;
}) {
    useEffect(() => {
        if (process.env.NODE_ENV === 'development')
            console.error('Storefront view failed:', error.message);
    }, [error]);
    return <div className='container error-page'><ErrorState error='The store could not load this page. Please try again. If the issue continues, contact Threazle.' retry={reset}/><ButtonLink href='/pages/contact' secondary>Contact the store</ButtonLink><small>Reference: {error.digest || 'request unavailable'}</small></div>;
}
