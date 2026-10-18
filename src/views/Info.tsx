'use client';
import { useState } from 'react';
import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import type { CmsPage } from '@/api/contracts';
import { sendContact } from '@/api/forms';
import { config, isDemo } from '@/lib/config';
import { Breadcrumbs, ButtonLink, Eyebrow, Field, Note } from '@/components/ui';
export function ContentPage({ page, title }: {
    page: CmsPage | null;
    title: string;
}) {
    return <div className='container content-page'><Breadcrumbs items={[{ label: title }]}/><div className='page-heading'><Eyebrow>THE DETAILS</Eyebrow><h1>{page?.title || title}</h1></div>{page ? <article className='rich-content' dangerouslySetInnerHTML={{ __html: page.content }}/> : <div className='unpublished-content'><h2>This information is not published yet.</h2><p>Please contact Threazle for the current {title.toLowerCase()} information before placing an order.</p><Note>No delivery promises, return rules or business policies have been invented to fill this page.</Note><ButtonLink href='/pages/contact' secondary>Contact Threazle</ButtonLink></div>}</div>;
}
export function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' }), [busy, setBusy] = useState(false), [error, setError] = useState(''), [sent, setSent] = useState(false);
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (busy)
            return;
        setError('');
        setSent(false);
        if (isDemo) {
            setError('This is a design preview. No message has been sent. Connect the backend to enable this form.');
            return;
        }
        setBusy(true);
        try {
            await sendContact(form);
            setSent(true);
            setForm({ name: '', email: '', subject: '', message: '', website: '' });
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return <div className='container contact-page'><Breadcrumbs items={[{ label: 'Contact' }]}/><div className='page-heading'><Eyebrow>A CONVERSATION STARTS HERE</Eyebrow><h1>Let’s find your expression.</h1><p>Questions about a design, your measurements or an order? Message us and our team will help.</p></div><div className='contact-layout'><div><h2>We’re here to help.</h2><p>Please include your order number for an existing purchase. Never send passwords, card details or private account links.</p>{config.supportEmail && <a className='contact-method' href={`mailto:${config.supportEmail}`}><Mail size={22}/>{config.supportEmail}</a>}{config.whatsapp && <a className='contact-method' href={`https://wa.me/${config.whatsapp}`} target='_blank' rel='noopener noreferrer'><MessageCircle size={22}/>WhatsApp +{config.whatsapp}</a>}{config.supportPhone && <a className='contact-method' href={`tel:${config.supportPhone.replace(/[^\d+]/g, '')}`}><Phone size={22}/>{config.supportPhone}</a>}{config.businessAddress && <p className='contact-method'><MapPin size={22}/>{config.businessAddress}</p>}{config.businessHours && <p className='contact-method'><Clock size={22}/>{config.businessHours}</p>}</div><form onSubmit={submit}><div className='form-grid'><Field label='Your name'><input required minLength={2} maxLength={100} autoComplete='name' value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/></Field><Field label='Email address'><input type='email' required maxLength={254} autoComplete='email' value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}/></Field></div><Field label='Subject (optional)'><input maxLength={120} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}/></Field><Field label='Your message'><textarea required minLength={10} maxLength={3000} rows={6} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}/></Field><div className='honeypot' aria-hidden='true'><label>Leave website blank<input tabIndex={-1} autoComplete='off' value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}/></label></div>{error && <p className='field-error' role='alert'>{error}</p>}{sent && <p className='success-message' role='status'>Thank you. We’ve received your message and will get back to you soon.</p>}<button className='button' disabled={busy}>{busy ? 'Submitting…' : 'Send message'}<ArrowRight size={16}/></button></form></div></div>;
}
