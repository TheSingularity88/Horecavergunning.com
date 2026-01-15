export type Language = 'en' | 'nl';

export const translations = {
  en: {
    navbar: {
      services: "Services",
      pricing: "Pricing",
      about: "About",
      login: "Client Login",
      book: "Book Intake"
    },
    hero: {
      badge: "Now accepting new clients for 2026",
      headline_start: "Focus on Your Guests.",
      headline_end: "We Handle the Government.",
      subheadline: "Complete legal, financial, and permit support for Dutch hospitality entrepreneurs. Fixed monthly rates. No hourly surprises.",
      cta_primary: "Book Free Intake",
      cta_secondary: "View Packages",
      fixed_rates: "Fixed Rates",
      support: "24/7 Support"
    },
    social_proof: {
      trusted_by: "Trusted by 50+ venues in Amsterdam, Rotterdam, and Utrecht"
    },
    problem_solution: {
      problem_title: "The Struggle",
      problem_1: "Endless paperwork and unclear government forms",
      problem_2: "Stress about Bibob investigations and inspections",
      problem_3: "Unpredictable legal costs and hourly bills",
      solution_title: "The Horecavergunning Way",
      solution_1: "We handle all filings, permits, and deadlines",
      solution_2: "Proactive Bibob management and compliance checks",
      solution_3: "Fixed monthly fee. Unlimited advice. Peace of mind."
    },
    services: {
      title: "Everything You Need to Run a Compliant Venue",
      subtitle: "From the moment you sign the lease to your daily operations, we've got you covered.",
      items: [
        {
          title: "Permits & Bibob",
          desc: "Fast-track your liquor and terrace permits. We manage the complex Bibob screening process so you open on time."
        },
        {
          title: "Legal & Contracts",
          desc: "Watertight employment contracts, rental agreements, and terms & conditions tailored for hospitality."
        },
        {
          title: "Finance & Tax",
          desc: "Real-time insight into your margins, tax filings, and annual accounts. Optimized for Horeca businesses."
        },
        {
          title: "Project Management",
          desc: "Starting fresh or renovating? We coordinate contractors and regulations for smooth takeovers and builds."
        }
      ]
    },
    pricing: {
      title: "Transparent, Fixed Monthly Rates",
      subtitle: "No hourly billing. Choose the package that fits your stage.",
      starter: {
        name: "Starter",
        desc: "Essential compliance for new venues.",
        cta: "Get Started",
        features: ["Permit Application", "Basic Administration", "Quarterly Tax Filing"]
      },
      growth: {
        name: "Growth",
        badge: "Most Popular",
        desc: "Full peace of mind for established businesses.",
        cta: "Get Started",
        features: ["Everything in Starter", "Monthly Financial Reports", "Unlimited Legal Advice", "Payroll (up to 5 staff)"]
      },
      all_in: {
        name: "All-in",
        price: "Custom",
        desc: "For groups and complex takeovers.",
        cta: "Contact Sales",
        features: ["Multi-venue Support", "Dedicated Account Manager", "M&A Support", "Crisis Management"]
      }
    },
    quiz: {
      step_label: "Permit Check - Step",
      q1: "What is your current situation?",
      q1_opt: ["Starting a new business", "Taking over an existing one", "Already open & operating"],
      q2: "What do you need help with most?",
      q2_opt: ["Permits & Bibob", "Finance & Admin", "Everything (Full Support)"],
      q3: "Where is your venue located?",
      q3_opt: ["Amsterdam", "Rotterdam", "Utrecht", "Other"],
      result_title: "Good news! We can help.",
      result_desc: "Based on your answers, our **Starter Package** is the perfect fit to get you compliant quickly.",
      result_cta: "Book Free Consultation",
      result_download: "Download Guide"
    },
    footer: {
      tagline: "Empowering Dutch hospitality with simplified legal and financial support.",
      services: "Services",
      company: "Company",
      contact: "Contact",
      rights: "© 2026 HorecaVergunning BV. All rights reserved."
    },
    whatsapp: "WhatsApp Us",
    faq: {
      title: "Frequently Asked Questions",
      items: [
        {
          q: "Who is HorecaVergunning suitable for?",
          a: "From startup entrepreneurs opening their first coffee bar to experienced owners with multiple venues. We support anyone who wants to get rid of administrative hassle."
        },
        {
          q: "Am I required to purchase a fixed subscription?",
          a: "No, although our subscriptions offer the most peace of mind, we are happy to help on a project basis. For example, for a one-off permit application or a takeover."
        },
        {
          q: "What can I expect within my monthly package?",
          a: "Complete unburdening. Depending on your package, we handle your permits, contracts, financial administration, and tax filings. You get one point of contact for all these matters."
        },
        {
          q: "Will I receive hourly invoices afterwards?",
          a: "No. We believe in fixed prices. For additional work outside your package, we always provide a clear quote in advance. Never surprises afterwards."
        },
        {
          q: "Is it possible to purchase extra services outside my bundle?",
          a: "Absolutely. Do you temporarily need extra legal help or a specialist document? We act fast and expand our service temporarily with clear agreements."
        },
        {
          q: "What is the response time for urgent questions?",
          a: "We understand that hospitality operates 24/7. We are always reachable for emergencies. For regular questions, we typically respond within one business day."
        }
      ]
    }
  },
  nl: {
    navbar: {
      services: "Diensten",
      pricing: "Tarieven",
      about: "Over Ons",
      login: "Klant Login",
      book: "Intake Boeken"
    },
    hero: {
      badge: "Nu nieuwe klanten acceptatie voor 2026",
      headline_start: "Focus op uw Gasten.",
      headline_end: "Wij regelen de Overheid.",
      subheadline: "Volledige juridische, financiële en vergunning ondersteuning voor horecaondernemers. Vaste maandbedragen. Geen verrassingen achteraf.",
      cta_primary: "Gratis Intake Boeken",
      cta_secondary: "Bekijk Pakketten",
      fixed_rates: "Vaste Tarieven",
      support: "24/7 Support"
    },
    social_proof: {
      trusted_by: "Vertrouwd door 50+ zaken in Amsterdam, Rotterdam en Utrecht"
    },
    problem_solution: {
      problem_title: "De Strijd",
      problem_1: "Eindeloos papierwerk en onduidelijke formulieren",
      problem_2: "Stress over Bibob-onderzoeken en controles",
      problem_3: "Onvoorspelbare advocaatkosten en uurtje-factuurtje",
      solution_title: "De Horecavergunning Manier",
      solution_1: "Wij regelen alle aanvragen, vergunningen en deadlines",
      solution_2: "Proactief Bibob-beheer en compliance checks",
      solution_3: "Vast maandbedrag. Onbeperkt advies. Rust.",
    },
    services: {
      title: "Alles wat u nodig heeft voor een compliant zaak",
      subtitle: "Vanaf het moment dat u tekent tot de dagelijkse operatie: wij staan naast u.",
      items: [
        {
          title: "Vergunningen & Bibob",
          desc: "Versnel uw drank- en terrasvergunningen. Wij managen het complexe Bibob-proces zodat u op tijd open gaat."
        },
        {
          title: "Juridisch & Contracten",
          desc: "Waterdichte arbeidscontracten, huurovereenkomsten en algemene voorwaarden, op maat voor de horeca."
        },
        {
          title: "Finance & Belasting",
          desc: "Real-time inzicht in marges, belastingaangiftes en jaarrekeningen. Geoptimaliseerd voor horecabedrijven."
        },
        {
          title: "Projectmanagement",
          desc: "Nieuw starten of verbouwen? Wij coördineren aannemers en regelgeving voor soepele overnames en verbouwingen."
        }
      ]
    },
    pricing: {
      title: "Transparante, Vaste Maandtarieven",
      subtitle: "Geen uurtje-factuurtje. Kies het pakket dat bij uw fase past.",
      starter: {
        name: "Starter",
        desc: "Essentiële compliance voor nieuwe zaken.",
        cta: "Starten",
        features: ["Vergunningaanvraag", "Basis Administratie", "Kwartaalaangifte BTW"]
      },
      growth: {
        name: "Groei",
        badge: "Meest Gekozen",
        desc: "Volledige rust voor gevestigde zaken.",
        cta: "Starten",
        features: ["Alles in Starter", "Maandelijkse Financiële Rapportage", "Onbeperkt Juridisch Advies", "Salarisadministratie (tot 5 man)"]
      },
      all_in: {
        name: "All-in",
        price: "Maatwerk",
        desc: "Voor groepen en complexe overnames.",
        cta: "Neem Contact Op",
        features: ["Multi-venue Ondersteuning", "Eigen Accountmanager", "Overnamebegeleiding (M&A)", "Crisismanagement"]
      }
    },
    quiz: {
      step_label: "Vergunning Check - Stap",
      q1: "Wat is uw huidige situatie?",
      q1_opt: ["Ik start een nieuwe zaak", "Ik neem een zaak over", "Ik ben al open & operationeel"],
      q2: "Waar heeft u het meeste hulp bij nodig?",
      q2_opt: ["Vergunningen & Bibob", "Finance & Admin", "Alles (Volledige Support)"],
      q3: "Waar is uw zaak gevestigd?",
      q3_opt: ["Amsterdam", "Rotterdam", "Utrecht", "Elders"],
      result_title: "Goed nieuws! Wij kunnen helpen.",
      result_desc: "Op basis van uw antwoorden is ons **Starter Pakket** de perfecte match om snel compliant te zijn.",
      result_cta: "Gratis Consult Boeken",
      result_download: "Download Gids"
    },
    footer: {
      tagline: "De Nederlandse horeca versterken met eenvoudige juridische en financiële support.",
      services: "Diensten",
      company: "Bedrijf",
      contact: "Contact",
      rights: "© 2026 HorecaVergunning BV. Alle rechten voorbehouden."
    },
    whatsapp: "App Ons",
    faq: {
      title: "Veelgestelde Vragen",
      items: [
        {
          q: "Voor welke ondernemers is HorecaVergunning geschikt?",
          a: "Van startende ondernemers die hun eerste koffiebar openen tot ervaren eigenaars met meerdere vestigingen. Wij ondersteunen iedereen die af wil van administratieve rompslomp."
        },
        {
          q: "Ben ik verplicht om een vast abonnement af te nemen?",
          a: "Nee, hoewel onze abonnementen de meeste rust en zekerheid bieden, helpen we u ook graag op projectbasis. Bijvoorbeeld bij een eenmalige vergunningaanvraag of een overname."
        },
        {
          q: "Wat kan ik verwachten binnen mijn maandelijkse pakket?",
          a: "Volledige ontzorging. Afhankelijk van uw pakket regelen wij uw vergunningen, contracten, financiële administratie en fiscale aangiftes. U krijgt één aanspreekpunt voor al deze zaken."
        },
        {
          q: "Krijg ik achteraf nog facturen per uur?",
          a: "Nee. Wij geloven in vaste prijzen. Voor extra werkzaamheden buiten uw pakket geven we altijd vooraf een duidelijke prijsopgave. Nooit verrassingen achteraf."
        },
        {
          q: "Is het mogelijk om extra diensten af te nemen buiten mijn bundel?",
          a: "Absoluut. Heeft u tijdelijk extra juridische hulp nodig of een specialistisch document? Dan schakelen we snel en breiden we onze service tijdelijk uit tegen heldere afspraken."
        },
        {
          q: "Wat is de reactietijd bij dringende vragen?",
          a: "Wij begrijpen dat de horeca 24/7 doorgaat. Voor spoedgevallen zijn wij altijd bereikbaar. Op reguliere vragen reageren wij doorgaans binnen één werkdag."
        }
      ]
    }
  }
};
