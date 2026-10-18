import { getOrderAccess, rememberOrderAccess } from '@/lib/order-access';
import type { Order, PaymentMethod } from '@/types';
import type { CouponResult, CreateOrderInput } from './contracts';
import { request } from './client';
/** Guest orders use the private UUID returned by the supplied backend, not an invented tracking endpoint. */
export const getOrder = (id: string, authenticated = false) => request<Order>(`/orders/${encodeURIComponent(id)}`, { authenticated, guestAccessToken: getOrderAccess(id) });
export const getOrders = () => request<Order[]>('/orders', { authenticated: true });
export async function createOrder(body: CreateOrderInput, authenticated: boolean): Promise<{ order: Order; pointsEarned: number; guestAccessToken?: string }> {
    const result = await request<{ order: Order; pointsEarned: number; guestAccessToken?: string }>('/orders', { method: 'POST', body, authenticated, timeoutMs: 30000 });
    rememberOrderAccess(result.order.id, result.guestAccessToken);
    return result;
}
export interface TrackingSummary {
    orderNumber: string;
    status: Order['status'];
    hasCustomItems: boolean;
    createdAt: string;
    estimatedReadyDate?: string;
    trackingNumber?: string;
    statusHistory: { status: Order['status']; timestamp: string }[];
}
export const trackOrder = (orderNumber: string, contact: string) => request<TrackingSummary>('/orders/track', { method: 'POST', body: { orderNumber, contact } });
export const cancelOrder = (id: string, reason: string) => request<Order>(`/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: { reason }, authenticated: true });
export const paymentMethods = () => request<{
    methods: PaymentMethod[];
}>('/payments/methods');
export const applyCoupon = (code: string, subtotal: number, authenticated: boolean) => request<CouponResult>('/orders/apply-coupon', { method: 'POST', body: { code, subtotal }, authenticated });
