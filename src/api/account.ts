import type { Address, CustomerProfile, LoyaltyConfig, LoyaltySummary, MeasurementProfile, Product } from '@/types';
import { request } from './client';
const me = '/customers/me';
export const getProfile = () => request<CustomerProfile>(me, { authenticated: true });
export const updateProfile = (body: {
    fullName?: string;
    phone?: string;
}) => request<CustomerProfile>(me, { method: 'PATCH', body, authenticated: true });
export const getAddresses = () => request<Address[]>(`${me}/addresses`, { authenticated: true });
export const saveAddress = (body: Omit<Address, 'id'>, id?: string) => request<Address>(`${me}/addresses${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PATCH' : 'POST', body, authenticated: true });
export const deleteAddress = (id: string) => request<void>(`${me}/addresses/${encodeURIComponent(id)}`, { method: 'DELETE', authenticated: true });
export const getProfiles = () => request<MeasurementProfile[]>(`${me}/measurement-profiles`, { authenticated: true });
export type ProfileInput = Pick<MeasurementProfile, 'profileName' | 'categoryId' | 'values' | 'notes'>;
export const saveProfile = (body: ProfileInput, id?: string) => request<MeasurementProfile>(`${me}/measurement-profiles${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PATCH' : 'POST', body, authenticated: true });
export const deleteProfile = (id: string) => request<void>(`${me}/measurement-profiles/${encodeURIComponent(id)}`, { method: 'DELETE', authenticated: true });
export const getWishlist = () => request<Product[]>(`${me}/wishlist`, { authenticated: true });
export const changeWishlist = (id: string, add: boolean) => request<void>(`${me}/wishlist/${encodeURIComponent(id)}`, { method: add ? 'POST' : 'DELETE', authenticated: true });
export const mergeWishlist = (productIds: string[]) => request<{
    productIds: string[];
}>(`${me}/wishlist/merge`, { method: 'POST', body: { productIds }, authenticated: true });
export const getLoyaltyConfig = () => request<LoyaltyConfig>('/customers/loyalty/config');
export const getLoyaltySummary = () => request<LoyaltySummary>(`${me}/loyalty`, { authenticated: true });
export const getMaxPoints = (subtotal: number) => request<{
    maxPoints: number;
}>(`${me}/loyalty/max-redeemable`, { query: { subtotal }, authenticated: true });
