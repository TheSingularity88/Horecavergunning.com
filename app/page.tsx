import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SocialProof } from './components/SocialProof';
import { ProblemSolution } from './components/ProblemSolution';
import { AiReview } from './components/AiReview';
import { Services } from './components/Services';
import { Pricing } from './components/Pricing';
import { Quiz } from './components/Quiz';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { HomeJsonLd } from './components/seo/HomeJsonLd';
import { createPublicClient } from './lib/supabase/public';
import { fetchPublicSettings, hasRealContact } from './lib/public-settings';
import type { PermitType } from './lib/types/database';

// Revalidate hourly; the admin permit-type editor also purges the
// 'permit-types' tag on save for immediate updates.
export const revalidate = 3600;

async function getPermitTypes(): Promise<PermitType[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('permit_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    return (data as PermitType[]) || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [permitTypes, settings] = await Promise.all([
    getPermitTypes(),
    fetchPublicSettings(),
  ]);

  const nap = hasRealContact(settings)
    ? {
        email: settings.contactEmail,
        phone: settings.contactPhone,
        address: settings.contactAddress,
      }
    : undefined;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-500 selection:text-white">
      <HomeJsonLd nap={nap} />
      <Navbar />
      <Hero />
      <SocialProof mode={settings.socialProofMode} companies={settings.socialProofCompanies} />
      <ProblemSolution />
      <AiReview />
      <Services />
      <Pricing permitTypes={permitTypes} />
      <Quiz permitTypes={permitTypes} />
      <FAQ />
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}
