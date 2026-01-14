import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SocialProof } from './components/SocialProof';
import { ProblemSolution } from './components/ProblemSolution';
import { Services } from './components/Services';
import { Pricing } from './components/Pricing';
import { Quiz } from './components/Quiz';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-500 selection:text-white">
      <Navbar />
      <Hero />
      <SocialProof />
      <ProblemSolution />
      <Services />
      <Pricing />
      <Quiz />
      <Footer />
      <FloatingWhatsApp />
    </main>
  );
}