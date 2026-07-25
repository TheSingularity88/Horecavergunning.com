'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Check } from 'lucide-react';
import { fetchPublicSettings, DEFAULT_PUBLIC_SETTINGS, type PublicSettings } from '../lib/public-settings';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { useLanguage } from '../context/LanguageContext';

export default function ContactClient() {
  const { language } = useLanguage();
  const nl = language !== 'en';
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS);

  useEffect(() => {
    fetchPublicSettings().then(setContact);
  }, []);

  const s = {
    title: nl ? 'Neem contact op' : 'Get in touch',
    subtitle: nl
      ? 'Vragen over een vergunning of uw aanvraag? Wij reageren doorgaans binnen één werkdag.'
      : 'Questions about a permit or your application? We usually reply within one business day.',
    name: nl ? 'Uw naam' : 'Your name',
    email: nl ? 'E-mailadres' : 'Email address',
    phone: nl ? 'Telefoon (optioneel)' : 'Phone (optional)',
    company: nl ? 'Bedrijfsnaam (optioneel)' : 'Company name (optional)',
    message: nl ? 'Uw bericht' : 'Your message',
    submit: nl ? 'Verstuur bericht' : 'Send message',
    submitting: nl ? 'Versturen...' : 'Sending...',
    successTitle: nl ? 'Bedankt voor uw bericht!' : 'Thanks for your message!',
    successDesc: nl
      ? 'Wij nemen zo snel mogelijk contact met u op.'
      : 'We will get back to you as soon as possible.',
    error: nl ? 'Er ging iets mis. Probeer het opnieuw.' : 'Something went wrong. Please try again.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'contact',
          name: form.name,
          email: form.email,
          phone: form.phone,
          company_name: form.company,
          message: form.message,
          locale: language,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || s.error);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : s.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar />
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-slate-900 mb-4"
            >
              {s.title}
            </motion.h1>
            <p className="text-slate-600 mb-8">{s.subtitle}</p>

            {/* Only render channels that are actually configured — the form
                below is always available, so an unconfigured channel costs us
                nothing, while a dead phone number costs us the lead. */}
            <div className="space-y-4 text-slate-700">
              {contact.contactEmail && (
                <a href={`mailto:${contact.contactEmail}`} className="flex items-center gap-3 hover:text-amber-600">
                  <span className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-amber-500" />
                  </span>
                  {contact.contactEmail}
                </a>
              )}
              {contact.contactPhone && (
                <a href={`tel:${contact.contactPhone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-3 hover:text-amber-600">
                  <span className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-amber-500" />
                  </span>
                  {contact.contactPhone}
                </a>
              )}
              {contact.contactAddress && (
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-amber-500" />
                  </span>
                  {contact.contactAddress}
                </div>
              )}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
          >
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{s.successTitle}</h2>
                <p className="text-slate-600">{s.successDesc}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
                )}
                <Input
                  label={s.name}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
                <Input
                  label={s.email}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label={s.phone}
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                  <Input
                    label={s.company}
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  />
                </div>
                <Textarea
                  label={s.message}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={5}
                  required
                />
                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Spinner size="sm" className="text-slate-900" />
                      {s.submitting}
                    </span>
                  ) : (
                    s.submit
                  )}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
