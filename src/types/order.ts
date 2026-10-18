import type { CartItemCustomization } from './cart';
import type { BuyingMode } from './product';
export type OrderStatus = 'placed' | 'confirmed' | 'fabric_sourced' | 'in_tailoring' | 'quality_check' | 'ready_for_dispatch' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentMethod = 'card' | 'jazzcash' | 'easypaisa' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    placed: 'Placed',
    confirmed: 'Confirmed',
    fabric_sourced: 'Fabric Sourced',
    in_tailoring: 'In Tailoring',
    quality_check: 'Quality Check',
    ready_for_dispatch: 'Ready for Dispatch',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
};
export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
    'placed',
    'confirmed',
    'fabric_sourced',
    'in_tailoring',
    'quality_check',
    'ready_for_dispatch',
    'shipped',
    'delivered',
];
export interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string;
    mode: BuyingMode;
    sizeLabel?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    customization?: CartItemCustomization;
}
export interface Address {
    id: string;
    label: string;
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    phone: string;
    isDefault?: boolean;
}
export interface OrderStatusEvent {
    status: OrderStatus;
    note?: string;
    timestamp: string;
}
export interface Order {
    id: string;
    orderNumber: string;
    customerId?: string;
    customerEmail?: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    items: OrderItem[];
    subtotal: number;
    discountTotal: number;
    loyaltyPointsRedeemed: number;
    loyaltyDiscount: number;
    shippingTotal: number;
    taxTotal: number;
    grandTotal: number;
    shippingAddress: Address;
    estimatedReadyDate?: string;
    trackingNumber?: string;
    statusHistory: OrderStatusEvent[];
    createdAt: string;
    couponCode?: string;
}
