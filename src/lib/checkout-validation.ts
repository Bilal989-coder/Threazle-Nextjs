/** Mirrors the current storefront's supported shipping fields; no business prices live here. */
export interface DeliveryContact {
    fullName: string;
    line1: string;
    city: string;
    postalCode: string;
    phone: string;
}
export function validDeliveryAddress(address: DeliveryContact): boolean {
    return address.fullName.trim().length >= 2 && address.fullName.trim().length <= 100
        && address.line1.trim().length >= 3 && address.line1.trim().length <= 200
        && address.city.trim().length >= 2 && address.city.trim().length <= 80
        && /^\d{4,6}$/.test(address.postalCode.trim())
        && /^\+?[\d\s-]{10,20}$/.test(address.phone.trim())
        && address.phone.replace(/\D/g, '').length >= 10
        && address.phone.replace(/\D/g, '').length <= 15;
}
export function validCheckoutEmail(value: string): boolean {
    const email = value.trim();
    return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
