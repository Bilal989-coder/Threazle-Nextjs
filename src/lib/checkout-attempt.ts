/** Small, non-PII retry record. Never save the address, email or request body here. */
export interface CheckoutAttempt {
    key: string;
    hash: string;
    owner: string;
    state: 'pending' | 'complete';
    orderId?: string;
    createdAt: number;
}
export const ATTEMPT_KEY = 'threazle.checkout.v2';
export function readAttempt(storage: Pick<Storage, 'getItem'>): CheckoutAttempt | null {
    try {
        const x = JSON.parse(storage.getItem(ATTEMPT_KEY) || 'null');
        return x && typeof x.key === 'string' && typeof x.hash === 'string' && typeof x.owner === 'string' && ['pending', 'complete'].includes(x.state) && Number.isFinite(x.createdAt) ? x : null;
    }
    catch {
        return null;
    }
}
export function resolveAttempt(previous: CheckoutAttempt | null, hash: string, owner: string, key: string, now: number): CheckoutAttempt {
    if (previous?.state === 'pending') {
        if (previous.owner !== owner || previous.hash !== hash)
            throw new Error('An earlier submission has not been confirmed. Restore the same checkout details and retry, or contact support before placing another order.');
        return previous;
    }
    return { key, hash, owner, state: 'pending', createdAt: now };
}
