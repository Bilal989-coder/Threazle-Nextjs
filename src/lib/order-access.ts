/** Guest capabilities stay in the receipt fragment and tab storage, never in query logs. */
const prefix = 'threazle.receipt-access.v1:';
const valid = (value: string | null | undefined): value is string => !!value && /^[A-Za-z0-9_-]{43}$/.test(value);
const memory = new Map<string, string>();
export function rememberOrderAccess(id: string, token?: string): void {
  if (!valid(token)) return;
  memory.set(id, token);
  if (typeof window !== 'undefined') {
    try { sessionStorage.setItem(prefix + id, token); } catch { /* Fragment keeps the receipt shareable. */ }
  }
}
export function getOrderAccess(id: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  // Only read a fragment when it belongs to this order page.
  if (window.location.pathname.split('/').filter(Boolean).at(-1) === id) {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('access');
    if (valid(token)) { rememberOrderAccess(id, token); return token; }
  }
  const cached = memory.get(id);
  if (cached) return cached;
  try { const token = sessionStorage.getItem(prefix + id); return valid(token) ? token : undefined; }
  catch { return undefined; }
}
export function receiptPath(id: string): string {
  const token = getOrderAccess(id);
  return `/order/confirmation/${encodeURIComponent(id)}${token ? `#access=${token}` : ''}`;
}
