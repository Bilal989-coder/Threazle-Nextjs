export type FabricPriceUnit = 'flat' | 'per_meter' | 'per_suit';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export interface Fabric {
    id: string;
    name: string;
    slug: string;
    type: string;
    color: string;
    colorHex: string;
    composition: string;
    description: string;
    swatchImage: string;
    images: string[];
    price: number;
    priceUnit: FabricPriceUnit;
    stockStatus: StockStatus;
    compatibleCategoryIds: string[];
    isFeatured?: boolean;
}
