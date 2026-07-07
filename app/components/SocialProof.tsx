'use client';
import { Beer, Coffee, Utensils, Wine, MapPin, Clock, BadgeEuro, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SocialProofProps {
  mode?: 'facts' | 'companies';
  companies?: string[];
}

const COMPANY_ICONS = [Coffee, Beer, Utensils, Wine, Coffee];

export function SocialProof({ mode = 'facts', companies = [] }: SocialProofProps) {
  const { language, t } = useLanguage();
  const nl = language !== 'en';

  // Company-names mode: only used when the admin enables it and provides names.
  if (mode === 'companies' && companies.length > 0) {
    return (
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">
            {t.social_proof.trusted_by}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
            {companies.map((name, i) => {
              const Icon = COMPANY_ICONS[i % COMPANY_ICONS.length];
              return (
                <div key={i} className="flex items-center gap-2">
                  <Icon className="w-6 h-6 text-slate-500" />
                  <span className="font-bold text-lg text-slate-700">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Facts mode (default): honest, verifiable trust signals — no invented names.
  const facts = [
    { icon: MapPin, label: nl ? 'Amsterdam-specialist' : 'Amsterdam specialist' },
    { icon: Clock, label: nl ? 'Reactie binnen 1 werkdag' : 'Reply within 1 business day' },
    { icon: BadgeEuro, label: nl ? 'Vaste prijs per vergunning' : 'Fixed price per permit' },
    { icon: ShieldCheck, label: nl ? '100% begeleiding, ook bij Bibob' : 'Full guidance, incl. Bibob' },
  ];

  return (
    <div className="bg-white border-b border-slate-100 py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {facts.map((fact, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <fact.icon className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-slate-700">{fact.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
