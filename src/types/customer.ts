import type { Address } from './order';
export interface CustomerProfile {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    loyaltyPointsBalance: number;
    wishlistProductIds: string[];
    addresses: Address[];
    createdAt: string;
}
