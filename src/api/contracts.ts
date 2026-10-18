import type { Address, BuyingMode, PaymentMethod } from '@/types';
export interface PriceInput {
    productId: string;
    mode: BuyingMode;
    sizeLabel?: string;
    variantId?: string;
    fabricId?: string;
    addonIds?: string[];
    rush?: boolean;
}
export interface PriceQuote {
    basePrice: number;
    variantAdd: number;
    fabricPrice: number;
    stitchingCharge: number;
    rushCharge?: number;
    addonsTotal: number;
    discountAmount: number;
    total: number;
    breakdown: {
        label: string;
        amount: number;
    }[];
}
export interface OrderLineInput extends PriceInput {
    quantity: number;
    measurementProfileId?: string;
    measurementSnapshot?: Record<string, number>;
    notes?: string;
}
export interface CreateOrderInput {
    email: string;
    items: OrderLineInput[];
    shippingAddress: Pick<Address, 'fullName' | 'line1' | 'line2' | 'city' | 'postalCode' | 'phone'>;
    paymentMethod: PaymentMethod;
    deliveryMethod: 'standard' | 'express';
    couponCode?: string;
    loyaltyPointsRedeemed?: number;
    customerNotes?: string;
    idempotencyKey: string;
}
export interface CouponResult {
    valid: boolean;
    code: string;
    discount: number;
    message: string;
}
export interface Banner {
    id: string;
    title: string;
    image: string;
    link: string;
    placement: string;
    sortOrder: number;
}
export interface CmsPage {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: string;
    updatedAt: string;
}
