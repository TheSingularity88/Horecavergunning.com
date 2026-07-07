import { createPublicClient } from '@/app/lib/supabase/public';

export interface PublicSettings {
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  whatsappNumber: string; // digits only, for wa.me links
  socialProofMode: 'facts' | 'companies';
  socialProofCompanies: string[];
}

// Defaults = the current placeholders. The owner overrides these from the
// admin dashboard; only then do real values appear (and LocalBusiness JSON-LD).
export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  contactEmail: 'info@horecavergunning.nl',
  contactPhone: '020 - 123 45 67',
  contactAddress: 'Keizersgracht 123, 1015 CJ Amsterdam',
  whatsappNumber: '31612345678',
  socialProofMode: 'facts',
  socialProofCompanies: [],
};

// Which settings are considered "real" (owner-provided), used to decide whether
// to emit LocalBusiness structured data.
export function hasRealContact(s: PublicSettings): boolean {
  return (
    s.contactEmail !== DEFAULT_PUBLIC_SETTINGS.contactEmail ||
    s.contactAddress !== DEFAULT_PUBLIC_SETTINGS.contactAddress
  );
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
