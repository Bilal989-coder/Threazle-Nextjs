export interface MeasurementProfile {
    id: string;
    customerId: string;
    profileName: string;
    categoryId: string;
    values: Record<string, number>;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
