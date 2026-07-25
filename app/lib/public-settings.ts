import { createPublicClient } from '@/app/lib/supabase/public';

export interface PublicSettings {
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  whatsappNumber: string; // digits only, for wa.me links
  socialProofMode: 'facts' | 'companies';
  socialProofCompanies: string[];
}

/**
 * Defaults are EMPTY on purpose.
 *
 * These used to be invented placeholders — a Keizersgracht address, a
 * 020-123 45 67 phone, info@horecavergunning.nl (the wrong TLD; the site is
 * .com) and a real-format WhatsApp number belonging to nobody we know. All of
 * it shipped to production, so a visitor who wanted to get in touch hit a dead
 * number, a bounced address, or a stranger's WhatsApp. For a site whose whole
 * job is collecting leads, publishing fake contact details is worse than
 * publishing none: consumers now hide any channel that is not configured.
 *
 * Fill these in at /dashboard/admin/settings and every channel appears, along
 * with the LocalBusiness structured data that depends on a real address.
 */
export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  whatsappNumber: '',
  socialProofMode: 'facts',
  socialProofCompanies: [],
};

/**
 * True once the owner has supplied real contact details. Gates LocalBusiness
 * structured data — fake or absent NAP in schema.org markup hurts SEO.
 */
export function hasRealContact(s: PublicSettings): boolean {
  return Boolean(s.contactEmail.trim() || s.contactAddress.trim());
}

const asString = (v: unknown): string | null =>
  typeof v === 'string' ? v : v == null ? null : String(v);

/**
 * Reads the `public_*` settings (anon-readable via RLS). Safe in both server
 * and client components. Falls back to defaults on any error.
 */
export async function fetchPublicSettings(): Promise<PublicSettings> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('system_settings')
      .select('key, value')
      .like('key', 'public\\_%');

    const map = new Map<string, unknown>();
    (data || []).forEach((r) => map.set((r as { key: string }).key, (r as { value: unknown }).value));

    const mode = asString(map.get('public_socialproof_mode'));
    const companies = asString(map.get('public_socialproof_companies'));

    return {
      contactEmail: asString(map.get('public_contact_email')) || DEFAULT_PUBLIC_SETTINGS.contactEmail,
      contactPhone: asString(map.get('public_contact_phone')) || DEFAULT_PUBLIC_SETTINGS.contactPhone,
      contactAddress:
        asString(map.get('public_contact_address')) || DEFAULT_PUBLIC_SETTINGS.contactAddress,
      whatsappNumber:
        asString(map.get('public_whatsapp_number')) || DEFAULT_PUBLIC_SETTINGS.whatsappNumber,
      socialProofMode: mode === 'companies' ? 'companies' : 'facts',
      socialProofCompanies: companies
        ? companies.split('\n').map((c) => c.trim()).filter(Boolean)
        : [],
    };
  } catch {
    return DEFAULT_PUBLIC_SETTINGS;
  }
}
