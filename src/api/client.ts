import { config } from '@/lib/config';
export class ApiError extends Error {
    constructor(message: string, public status = 0, public code = 'NETWORK_ERROR', public fieldErrors?: Record<string, string | string[]>) {
        super(message);
        this.name = 'ApiError';
    }
}
export type Query = Record<string, string | number | boolean | readonly string[] | undefined | null>;
export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    query?: Query;
    signal?: AbortSignal;
    authenticated?: boolean;
    timeoutMs?: number;
    guestAccessToken?: string;
}
export function buildApiUrl(path: string, query?: Query): string {
    if (!path.startsWith('/') || path.startsWith('//') || /[\\\r\n]/.test(path))
        throw new ApiError('Invalid API path.', 0, 'CONFIGURATION_ERROR');
    const browserOrigin = typeof window !== 'undefined' ? window.location.origin : config.siteUrl;
    const base = typeof window === 'undefined' ? (process.env.API_INTERNAL_URL || config.apiUrl) : config.apiUrl;
    const url = new URL(base + path, browserOrigin);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && (['localhost', '127.0.0.1'].includes(url.hostname) || (typeof window === 'undefined' && !!process.env.API_INTERNAL_URL && url.origin === new URL(process.env.API_INTERNAL_URL).origin))))
        throw new ApiError('The backend must use HTTPS.', 0, 'CONFIGURATION_ERROR');
    for (const [key, value] of Object.entries(query || {})) {
        if (value === undefined || value === null || value === '')
            continue;
        if (Array.isArray(value))
            value.forEach(v => url.searchParams.append(key, v));
        else
            url.searchParams.set(key, String(value));
    }
    return url.toString();
}
/** No hidden mutation retries, no fallback to fixtures, no browser-supplied prices. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const abort = new AbortController();
    let timedOut = false;
    const forwardAbort = () => abort.abort();
    options.signal?.addEventListener('abort', forwardAbort, { once: true });
    if (options.signal?.aborted)
        abort.abort();
    const timer = setTimeout(() => { timedOut = true; abort.abort(); }, options.timeoutMs ?? 15000);
    try {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (options.guestAccessToken) headers['X-Order-Access-Token'] = options.guestAccessToken;
        if (options.body !== undefined)
            headers['Content-Type'] = 'application/json';
        if (options.authenticated && typeof window === 'undefined')
            throw new ApiError('Customer requests must use the signed-in browser client.', 401, 'SESSION_REQUIRED');
        if (options.authenticated && typeof window !== 'undefined') {
            const { getSupabase } = await import('@/lib/supabase');
            const { data, error } = await getSupabase().auth.getSession();
            if (error || !data.session?.access_token)
                throw new ApiError('Please sign in again.', 401, 'SESSION_EXPIRED');
            headers.Authorization = `Bearer ${data.session.access_token}`;
        }
        const response = await fetch(buildApiUrl(path, options.query), {
            method: options.method ?? 'GET', headers,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
            signal: abort.signal, credentials: 'omit', referrerPolicy: 'no-referrer',
            // PERFORMANCE: anonymous catalog reads made while rendering on the server are reused for 20 s
            // (Next.js data cache) instead of calling the API on every page view. Browser requests,
            // signed-in requests, writes and private receipts are never cached.
            ...(typeof window === 'undefined' && !options.authenticated && !options.guestAccessToken && (options.method ?? 'GET') === 'GET'
                ? { next: { revalidate: 20 } }
                : { cache: 'no-store' as RequestCache }),
        });
        if (response.status === 204)
            return undefined as T;
        const json = await response.json().catch(() => null);
        if (!response.ok || json?.success === false) {
            throw new ApiError(json?.error?.message || (response.status === 429 ? 'Too many requests. Please wait a moment.' : 'The service could not complete this request.'), response.status, json?.error?.code || 'API_ERROR', json?.error?.fieldErrors);
        }
        if (!json || !Object.prototype.hasOwnProperty.call(json, 'data'))
            throw new ApiError('The backend returned an unexpected response.', response.status, 'INVALID_RESPONSE');
        return json.data as T;
    }
    catch (error) {
        if (error instanceof ApiError)
            throw error;
        if (options.signal?.aborted)
            throw error;
        if (timedOut)
            throw new ApiError(options.method === 'POST' && path === '/orders'
                ? 'The request timed out. Your order may still have been received; retry the same checkout, not a new one.'
                : 'The request timed out. Please check your connection and try again.', 0, 'TIMEOUT');
        throw new ApiError('Unable to reach the store. Please check your connection and try again.');
    }
    finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', forwardAbort);
    }
}
