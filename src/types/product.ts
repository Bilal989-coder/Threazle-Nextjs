export type ProductStatus = 'active' | 'draft' | 'out_of_stock';
export type BuyingMode = 'ready_made' | 'stitch';
export interface ProductImage {
    id: string;
    url: string;
    alt: string;
    isPrimary?: boolean;
}
export interface ProductVariant {
    id: string;
    styleName: string;
    description?: string;
    image: string;
    priceAdd: number;
}
export interface ReadyMadeSize {
    id: string;
    sizeLabel: string;
    stockQty: number;
    priceOverride?: number;
}
export interface AddonService {
    id: string;
    name: string;
    description: string;
    price: number;
}
export interface ProductReview {
    id: string;
    customerName: string;
    rating: number;
    title: string;
    comment: string;
    date: string;
    verified: boolean;
}
export interface Product {
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    description: string;
    shortDescription: string;
    basePrice: number;
    images: ProductImage[];
    isReadymade: boolean;
    isCustomizable: boolean;
    defaultMode: BuyingMode;
    status: ProductStatus;
    isNew?: boolean;
    isBestSeller?: boolean;
    /** Percentage off, derived by the server from the active sale rules. */
    discountPercent?: number;
    /** Price after the active sale, computed by the server with the same rule that prices an order. */
    salePrice?: number;
    rating: number;
    reviewCount: number;
    variants: ProductVariant[];
    readyMadeSizes: ReadyMadeSize[];
    compatibleFabricIds: string[];
    addonIds: string[];
    metaTitle?: string;
    metaDescription?: string;
}
/** `original` is set only when the product is on sale (price < original). Both come from the server, so they match what checkout charges. */
export function getDisplayPrice(product: Product): {
    price: number;
    original?: number;
    from: boolean;
} {
    const onSale = product.salePrice != null && product.salePrice < product.basePrice;
    const price = onSale ? (product.salePrice as number) : product.basePrice;
    return { price, original: onSale ? product.basePrice : undefined, from: product.isCustomizable };
}
