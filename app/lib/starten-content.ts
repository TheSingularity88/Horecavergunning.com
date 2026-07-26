import type { Language } from './translations';

/**
 * Content for /horeca-starten-amsterdam — the "which permits do I actually
 * need, and in what order?" page.
 *
 * WHY THIS PAGE EXISTS, AND WHY IT IS NOT ANOTHER SERVICE LIST:
 * /vergunningen is a service-and-price hub, and each permit page covers one
 * permit in depth. Neither answers the question someone actually types before
 * they know our vocabulary — "what do I need to open a place in Amsterdam".
 * That question is a decision, so this page leads with the answer, then the
 * decision table, then the order. Answer engines lift self-contained answers;
 * a page that buries the answer under a pitch does not get quoted.
 *
 * FACTUAL DISCIPLINE:
 * Every claim here is either (a) restated from the owner's existing permit
 * copy, or (b) a stable statutory fact (the Alcoholwet governs serving
 * alcohol; the Wet Bibob allows an integrity screening; the gemeente decides).
 * There are deliberately NO leges amounts and NO processing times on this
 * page: those are set per gemeente and change, we do not have verified current
 * figures, and publishing a wrong number on a professional services site is
 * worse than publishing none. The permit pages carry the owner's own hedged
 * timing claim; this page points at them instead of restating it.
 */

export interface StartenSituation {
  situation: string;
  permits: string[];
  note: string;
}

export interface StartenStep {
  title: string;
  body: string;
}

export interface StartenCopy {
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** The direct answer. Kept self-contained so it can be quoted on its own. */
  answer: string;
  situationsTitle: string;
  situationsIntro: string;
  situations: StartenSituation[];
  colSituation: string;
  colPermits: string;
  colNote: string;
  orderTitle: string;
  orderIntro: string;
  steps: StartenStep[];
  caveatTitle: string;
  caveat: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
}

const NL: StartenCopy = {
  metaTitle: 'Horeca starten in Amsterdam: welke vergunningen? | Vast tarief',
  metaDescription:
    'Welke vergunningen heeft u nodig om een horecazaak te starten in Amsterdam? Per situatie op een rij: exploitatievergunning, alcoholvergunning, terras en Bibob.',
  h1: 'Horeca starten in Amsterdam: welke vergunningen heeft u nodig?',
  answer:
    'Om in Amsterdam een horecazaak te exploiteren heeft u vrijwel altijd een exploitatievergunning nodig. Schenkt u alcohol, dan komt daar een alcoholvergunning op grond van de Alcoholwet bij. Wilt u een terras, dan is een aparte terrasvergunning vereist. Bij de aanvraag hoort een Bibob-toets: een integriteitsonderzoek van de gemeente naar de ondernemer en de financiering. De gemeente Amsterdam beslist over alle drie de vergunningen.',
  situationsTitle: 'Welke vergunningen horen bij uw situatie?',
  situationsIntro:
    'Welke vergunningen u nodig heeft, hangt af van wat u precies gaat doen. De meest voorkomende situaties:',
  situations: [
    {
      situation: 'Nieuwe zaak zonder alcohol (koffiebar, lunchroom, snackbar)',
      permits: ['Exploitatievergunning'],
      note: 'Ook zonder alcohol is een exploitatievergunning vereist.',
    },
    {
      situation: 'Nieuwe zaak mét alcohol (café, restaurant, bar)',
      permits: ['Exploitatievergunning', 'Alcoholvergunning'],
      note: 'Beide vraagt u meestal gelijktijdig aan; de leidinggevenden moeten voldoen aan de eisen sociale hygiëne.',
    },
    {
      situation: 'Zaak met terras',
      permits: ['Exploitatievergunning', 'Terrasvergunning'],
      note: 'De terrasvergunning komt bovenop de exploitatievergunning en vraagt een terrasplattegrond.',
    },
    {
      situation: 'Bestaande zaak overnemen',
      permits: ['Exploitatievergunning', 'Alcoholvergunning (indien van toepassing)'],
      note: 'Bestaande vergunningen gaan niet automatisch mee over: als nieuwe exploitant vraagt u opnieuw aan.',
    },
    {
      situation: 'Verbouwing of gewijzigde indeling',
      permits: ['Wijziging exploitatievergunning', 'Mogelijk gebruiksvergunning'],
      note: 'Een verbouwing die de indeling wijzigt, vraagt om een nieuwe of gewijzigde aanvraag.',
    },
  ],
  colSituation: 'Situatie',
  colPermits: 'Vergunningen',
  colNote: 'Let op',
  orderTitle: 'In welke volgorde pakt u het aan?',
  orderIntro:
    'De volgorde bepaalt hoe snel u open kunt. Dit is de route die wij voor onze klanten aanhouden:',
  steps: [
    {
      title: 'Bepaal welke vergunningen u nodig heeft',
      body: 'Leg vast wat u gaat doen — wel of geen alcohol, wel of geen terras, nieuwbouw of overname. Dat bepaalt het hele traject.',
    },
    {
      title: 'Controleer het pand',
      body: 'Is het pand volgens het bestemmingsplan geschikt voor horeca? Dit is een van de eerste dingen waar de gemeente op toetst.',
    },
    {
      title: 'Verzamel de documenten',
      body: 'Identiteitsbewijzen van alle leidinggevenden, een recent KvK-uittreksel, de huur- of koopovereenkomst en een plattegrond met oppervlaktes.',
    },
    {
      title: 'Vul de Bibob-vragenlijst in',
      body: 'De onderbouwing van uw financiering hoort hierbij. Onvolledige Bibob-stukken zijn een van de meest voorkomende vertragingen.',
    },
    {
      title: 'Dien de aanvragen gelijktijdig in',
      body: 'Exploitatie- en alcoholvergunning tegelijk indienen scheelt tijd, omdat de gemeente ze samen kan behandelen.',
    },
  ],
  caveatTitle: 'Belangrijk om te weten',
  caveat:
    'Wij zijn een particuliere dienstverlener en niet de gemeente Amsterdam. Wij bereiden de aanvraag voor en begeleiden het traject; de gemeente beslist. Vergunningseisen, doorlooptijden en leges worden regelmatig gewijzigd — controleer bedragen en termijnen altijd bij de gemeente Amsterdam.',
  faqTitle: 'Veelgestelde vragen',
  faqs: [
    {
      q: 'Heb ik een exploitatievergunning nodig als ik geen alcohol schenk?',
      a: 'Ja. De exploitatievergunning geldt voor het exploiteren van een voor publiek toegankelijk horecabedrijf, ongeacht of u alcohol schenkt. De alcoholvergunning komt daar alleen bij als u wél schenkt.',
    },
    {
      q: 'Kan ik de vergunning van de vorige eigenaar overnemen?',
      a: 'Nee. Bestaande vergunningen gaan bij een overname niet automatisch mee over. De vergunning staat op naam van de exploitant en het pand, dus als nieuwe exploitant vraagt u opnieuw aan.',
    },
    {
      q: 'Wat is de Bibob-toets en krijg ik die altijd?',
      a: 'De Bibob-toets is een integriteitsonderzoek waarmee de gemeente onder andere de herkomst van uw financiering beoordeelt. Bij horeca-aanvragen hoort deze toets standaard bij het traject.',
    },
    {
      q: 'Kan ik alvast open terwijl de aanvraag loopt?',
      a: 'Nee. Zonder geldige exploitatievergunning mag u uw horecazaak niet openen of voortzetten.',
    },
  ],
  ctaTitle: 'Wilt u weten wat úw situatie nodig heeft?',
  ctaBody:
    'Vertel ons over uw zaak. Wij bepalen kosteloos welke vergunningen u precies nodig heeft en wat het kost — vooraf, zonder verrassingen.',
  ctaButton: 'Gratis intake aanvragen',
};

const EN: StartenCopy = {
  metaTitle: 'Opening a venue in Amsterdam: which permits? | Fixed fee',
  metaDescription:
    'Which permits do you need to open a hospitality business in Amsterdam? Set out per situation: operating permit, alcohol licence, terrace permit and the Bibob check.',
  h1: 'Opening a hospitality business in Amsterdam: which permits do you need?',
  answer:
    'To run a hospitality business in Amsterdam you will almost always need an exploitatievergunning (operating permit). If you serve alcohol, an alcoholvergunning (alcohol licence) under the Alcoholwet is required as well. If you want a terrace, that needs a separate terrasvergunning. Every application involves a Bibob check: an integrity screening by the gemeente into the operator and the financing. Gemeente Amsterdam decides on all three permits.',
  situationsTitle: 'Which permits apply to your situation?',
  situationsIntro:
    'What you need depends on exactly what you are going to do. The most common situations:',
  situations: [
    {
      situation: 'New venue without alcohol (coffee bar, lunchroom, takeaway)',
      permits: ['Exploitatievergunning'],
      note: 'An operating permit is required even without alcohol.',
    },
    {
      situation: 'New venue serving alcohol (café, restaurant, bar)',
      permits: ['Exploitatievergunning', 'Alcoholvergunning'],
      note: 'These are usually applied for together; the managers must meet the social hygiene requirements.',
    },
    {
      situation: 'Venue with a terrace',
      permits: ['Exploitatievergunning', 'Terrasvergunning'],
      note: 'The terrace permit comes on top of the operating permit and requires a terrace plan.',
    },
    {
      situation: 'Taking over an existing business',
      permits: ['Exploitatievergunning', 'Alcoholvergunning (if applicable)'],
      note: 'Existing permits do not transfer automatically: as the new operator you apply again.',
    },
    {
      situation: 'Renovation or a changed layout',
      permits: ['Amended operating permit', 'Possibly a use permit'],
      note: 'Building work that changes the layout calls for a new or amended application.',
    },
  ],
  colSituation: 'Situation',
  colPermits: 'Permits',
  colNote: 'Note',
  orderTitle: 'In what order should you tackle it?',
  orderIntro:
    'The order determines how quickly you can open. This is the route we follow for our clients:',
  steps: [
    {
      title: 'Establish which permits you need',
      body: 'Pin down what you are going to do — alcohol or not, terrace or not, new build or takeover. That determines the whole process.',
    },
    {
      title: 'Check the premises',
      body: 'Is the property suitable for hospitality use under the bestemmingsplan (zoning plan)? This is one of the first things the gemeente assesses.',
    },
    {
      title: 'Gather the documents',
      body: 'Proof of identity for every manager, a recent KvK (Chamber of Commerce) extract, the lease or purchase agreement, and a floor plan with surface areas.',
    },
    {
      title: 'Complete the Bibob questionnaire',
      body: 'Evidence of how you are financing the business belongs here. Incomplete Bibob paperwork is one of the most common causes of delay.',
    },
    {
      title: 'File the applications together',
      body: 'Submitting the operating permit and alcohol licence at the same time saves time, because the gemeente can handle them together.',
    },
  ],
  caveatTitle: 'Important to know',
  caveat:
    'We are a private service provider, not the gemeente Amsterdam. We prepare the application and guide the process; the gemeente decides. Permit requirements, processing times and leges (municipal fees) change regularly — always verify amounts and deadlines with the gemeente Amsterdam.',
  faqTitle: 'Frequently asked questions',
  faqs: [
    {
      q: 'Do I need an operating permit if I do not serve alcohol?',
      a: 'Yes. The exploitatievergunning applies to running a hospitality business open to the public, whether or not you serve alcohol. The alcohol licence is only added when you do serve.',
    },
    {
      q: 'Can I take over the previous owner’s permit?',
      a: 'No. Existing permits do not transfer automatically in a takeover. The permit is issued in the name of the operator and the premises, so as the new operator you apply again.',
    },
    {
      q: 'What is the Bibob check, and do I always get one?',
      a: 'The Bibob check is an integrity screening through which the gemeente assesses, among other things, the origin of your financing. For hospitality applications it is a standard part of the process.',
    },
    {
      q: 'Can I open while the application is still running?',
      a: 'No. Without a valid operating permit you may not open or continue to run your hospitality business.',
    },
  ],
  ctaTitle: 'Want to know what your situation needs?',
  ctaBody:
    'Tell us about your venue. We will determine, free of charge, exactly which permits you need and what it costs — upfront, with no surprises.',
  ctaButton: 'Request a free intake',
};

export const STARTEN_SLUG = 'horeca-starten-amsterdam';

export function getStartenCopy(locale: Language): StartenCopy {
  return locale === 'en' ? EN : NL;
}
