import type { BuyingMode } from './product';
export interface CartItemCustomization {
    variantId?: string;
    variantName?: string;
    fabricId?: string;
    fabricName?: string;
    fabricSwatch?: string;
    measurementProfileId?: string;
    measurementProfileName?: string;
    measurementSnapshot?: Record<string, number>;
    addonIds: string[];
    notes?: string;
    /** Optional rush stitching (shorter lead time, extra charge). */
    rush?: boolean;
}
export interface CartItem {
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string;
    categoryId: string;
    mode: BuyingMode;
    sizeLabel?: string;
    quantity: number;
    /** Ready-made only: units in stock for this size when it was added — caps the quantity stepper. */
    maxQuantity?: number;
    unitPrice: number;
    customization?: CartItemCustomization;
    leadTimeDays: {
        min: number;
        max: number;
    };
}
export interface Cart {
    items: CartItem[];
    couponCode?: string;
    couponDiscount?: number;
}
export function cartSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}
