export type LoyaltyTransactionType = 'earn' | 'redeem' | 'adjust' | 'expire';
export interface LoyaltyTransaction {
    id: string;
    type: LoyaltyTransactionType;
    points: number;
    reason: string;
    orderId?: string;
    orderNumber?: string;
    createdAt: string;
}
export interface LoyaltyConfig {
    earnRatePkrPerPoint: number;
    redeemValuePkrPerPoint: number;
    minPointsToRedeem: number;
    maxRedeemPctOfOrder: number;
    pointsExpiryMonths: number;
}
export interface LoyaltySummary {
    balance: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    transactions: LoyaltyTransaction[];
}
