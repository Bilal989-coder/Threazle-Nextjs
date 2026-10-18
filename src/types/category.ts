export type MeasurementFieldType = 'number';
export interface MeasurementFieldDef {
    key: string;
    label: string;
    unit: 'in' | 'cm';
    helpText?: string;
    min?: number;
    max?: number;
    /** Optional close-up photo uploaded by staff for this measurement (shown in the guide). */
    image?: string;
}
export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    heroImage: string;
    thumbnailImage: string;
    parentId: string | null;
    leadTimeDays: {
        min: number;
        max: number;
    };
    measurementFields: MeasurementFieldDef[];
    sortOrder: number;
    /** Labour charge for custom stitching in this category (display only; the server prices orders). */
    stitchingCharge?: number;
    /** Optional rush-stitching upgrade price (0 = not offered). */
    rushStitchingCharge?: number;
}
