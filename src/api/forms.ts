import { request } from './client';
export const sendContact = (body: {
    name: string;
    email: string;
    subject?: string;
    message: string;
    website?: string;
}) => request<{
    received: boolean;
}>('/forms/contact', { method: 'POST', body });
export const subscribe = (email: string, website = '') => request<{
    subscribed: boolean;
}>('/forms/newsletter', { method: 'POST', body: { email, website } });
