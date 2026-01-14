import { Beer, Coffee, Utensils, Wine } from 'lucide-react';

export function SocialProof() {
  const logos = [
    { name: "Cafe Amsterdam", icon: Coffee },
    { name: "De Houten Klaas", icon: Beer },
    { name: "Bistro 99", icon: Utensils },
    { name: "Wine Bar V", icon: Wine },
    { name: "Club Z", icon: Beer },
  ];

  return (
    <div className="bg-white border-b border-slate-100 py-8">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">
          Trusted by 50+ venues in Amsterdam, Rotterdam, and Utrecht
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo, i) => (
            <div key={i} className="flex items-center gap-2">
              <logo.icon className="w-6 h-6" />
              <span className="font-bold text-lg text-slate-700">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
