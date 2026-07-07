// ============================================================================
// SEO content for the per-permit landing pages (app/[slug]/page.tsx).
// Keyed by the permit_types.slug. Long-form Dutch copy lives here (code-
// reviewed, versioned); the live PRICE comes from the DB at render time.
// Only slugs present here get a public page (allowlist for generateStaticParams).
// ============================================================================

export interface PermitSection {
  title: string;
  paragraphs: string[];
}

export interface PermitFaq {
  q: string;
  a: string;
}

export interface PermitContent {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  what: PermitSection;
  when: PermitSection;
  /** Fallback checklist when no required_documents rows exist in the DB yet. */
  requirements: string[];
  process: { title: string; body: string }[];
  kostenIntro: string;
  kostenNote: string;
  faqs: PermitFaq[];
  related: string[];
}

export const PERMIT_CONTENT: Record<string, PermitContent> = {
  exploitatievergunning: {
    slug: 'exploitatievergunning',
    metaTitle: 'Exploitatievergunning aanvragen in Amsterdam | Vast tarief',
    metaDescription:
      'Exploitatievergunning aanvragen voor uw horecazaak in Amsterdam? Wij verzorgen de volledige aanvraag tegen een vaste prijs. Bekijk de kosten, voorwaarden en het proces.',
    h1: 'Exploitatievergunning aanvragen in Amsterdam',
    intro:
      'Een exploitatievergunning is voor vrijwel elke horecaondernemer in Amsterdam verplicht. Wij regelen de volledige aanvraag voor u — van het verzamelen van de juiste documenten tot het indienen bij de gemeente en de Bibob-toets — zodat u zich kunt richten op uw zaak. Eén vaste prijs, vooraf duidelijk.',
    what: {
      title: 'Wat is een exploitatievergunning?',
      paragraphs: [
        'De exploitatievergunning is de basisvergunning om een horecabedrijf te mogen exploiteren. De gemeente Amsterdam toetst hiermee onder andere de openbare orde, het levensgedrag van de ondernemer (via de Wet Bibob) en of uw pand geschikt is voor horeca volgens het bestemmingsplan.',
        'Zonder geldige exploitatievergunning mag u uw horecazaak niet openen of voortzetten. De vergunning staat op naam van de exploitant en het pand; bij een overname of verhuizing moet daarom een nieuwe vergunning worden aangevraagd.',
      ],
    },
    when: {
      title: 'Wanneer heeft u een exploitatievergunning nodig?',
      paragraphs: [
        'U heeft een exploitatievergunning nodig zodra u een voor publiek toegankelijk horecabedrijf start of overneemt: een café, restaurant, lunchroom, snackbar of hotel met horeca. Ook bij een wijziging van de ondernemingsvorm, een nieuwe eigenaar of een verbouwing die de indeling wijzigt, is een (nieuwe) aanvraag nodig.',
        'Twijfelt u of uw situatie vergunningplichtig is? Wij beoordelen dit kosteloos tijdens de intake en vertellen u direct welke vergunningen u precies nodig heeft.',
      ],
    },
    requirements: [
      'Geldig identiteitsbewijs van alle leidinggevenden',
      'Recent uittreksel Kamer van Koophandel (KvK)',
      'Huur- of koopovereenkomst van het pand',
      'Plattegrond met oppervlakte en indeling',
      'Ingevuld Bibob-vragenformulier met onderbouwing',
      'Zakelijke financiële gegevens (financiering, herkomst middelen)',
    ],
    process: [
      { title: 'Gratis intake', body: 'Wij brengen uw situatie in kaart en bepalen welke vergunningen nodig zijn.' },
      { title: 'Documenten verzamelen', body: 'U levert de stukken aan; wij controleren ze op volledigheid en juistheid.' },
      { title: 'Aanvraag indienen', body: 'Wij dienen de complete aanvraag in bij de gemeente Amsterdam.' },
      { title: 'Bibob-toets begeleiden', body: 'Wij begeleiden de integriteitstoets en beantwoorden aanvullende vragen.' },
      { title: 'Besluit', body: 'U ontvangt de vergunning; wij houden de termijnen en communicatie in de gaten.' },
    ],
    kostenIntro:
      'Voor het volledig verzorgen van uw exploitatievergunning rekenen wij een vaste servicetarief. U weet dus vooraf precies waar u aan toe bent.',
    kostenNote:
      'Let op: bovenop ons servicetarief brengt de gemeente Amsterdam eigen leges in rekening voor het in behandeling nemen van de aanvraag. Deze gemeentelijke kosten staan los van onze dienstverlening.',
    faqs: [
      {
        q: 'Hoe lang duurt het aanvragen van een exploitatievergunning?',
        a: 'De gemeente heeft doorgaans 8 tot 13 weken de tijd om te beslissen, afhankelijk van de Bibob-toets. Een complete, foutloze aanvraag versnelt dit traject aanzienlijk — daar zorgen wij voor.',
      },
      {
        q: 'Heb ik naast de exploitatievergunning nog andere vergunningen nodig?',
        a: 'Vaak wel. Denk aan een alcoholvergunning als u alcohol schenkt en een terrasvergunning voor een terras. Tijdens de intake bepalen wij het complete pakket voor uw zaak.',
      },
      {
        q: 'Wat kost een exploitatievergunning?',
        a: 'Ons servicetarief is een vaste prijs die u onderaan deze pagina ziet. De gemeente rekent daarnaast eigen leges. U komt bij ons niet voor verrassingen achteraf te staan.',
      },
    ],
    related: ['alcoholvergunning', 'terrasvergunning', 'bibob'],
  },

  alcoholvergunning: {
    slug: 'alcoholvergunning',
    metaTitle: 'Alcoholvergunning aanvragen (Alcoholwet) | Vast tarief',
    metaDescription:
      'Alcoholvergunning aanvragen op grond van de Alcoholwet? Wij regelen de volledige aanvraag inclusief eisen sociale hygiëne. Vaste prijs, bekijk de kosten en voorwaarden.',
    h1: 'Alcoholvergunning aanvragen',
    intro:
      'Wilt u alcohol schenken in uw horecazaak? Dan heeft u een alcoholvergunning (voorheen drank- en horecavergunning) nodig op grond van de Alcoholwet. Wij verzorgen de volledige aanvraag tegen een vaste prijs.',
    what: {
      title: 'Wat is een alcoholvergunning?',
      paragraphs: [
        'De alcoholvergunning is de vergunning op grond van artikel 3 van de Alcoholwet die u nodig heeft om zwak- en sterkalcoholhoudende drank te schenken voor gebruik ter plaatse. De vergunning stelt eisen aan de inrichting van uw pand en aan de leidinggevenden.',
        'Alle leidinggevenden moeten voldoen aan de eisen van sociale hygiëne — meestal aangetoond met een Verklaring Sociale Hygiëne — en op de vergunning worden bijgeschreven.',
      ],
    },
    when: {
      title: 'Wanneer heeft u een alcoholvergunning nodig?',
      paragraphs: [
        'U heeft de vergunning nodig zodra u alcohol schenkt in een café, restaurant, hotel of andere horecagelegenheid. Ook bij een nieuwe leidinggevende of een verbouwing van de schenkruimte moet de vergunning worden aangepast.',
        'De alcoholvergunning vraagt u meestal gelijktijdig met de exploitatievergunning aan. Wij stemmen beide trajecten op elkaar af zodat u zo snel mogelijk open kunt.',
      ],
    },
    requirements: [
      'Verklaring Sociale Hygiëne van alle leidinggevenden',
      'Geldig identiteitsbewijs van alle leidinggevenden',
      'Uittreksel Kamer van Koophandel (KvK)',
      'Plattegrond met de schenkruimtes en oppervlakten',
      'Arbeidsovereenkomsten of aanstelling van leidinggevenden',
    ],
    process: [
      { title: 'Gratis intake', body: 'Wij controleren of alle leidinggevenden aan de eisen voldoen.' },
      { title: 'Documenten verzamelen', body: 'Wij verzamelen de verklaringen sociale hygiëne en overige stukken.' },
      { title: 'Aanvraag indienen', body: 'Wij dienen de aanvraag in bij de gemeente.' },
      { title: 'Besluit', body: 'U ontvangt de vergunning en mag alcohol schenken.' },
    ],
    kostenIntro:
      'Voor het volledig verzorgen van uw alcoholvergunning rekenen wij een vaste servicetarief. Geen uurtje-factuurtje.',
    kostenNote:
      'De gemeente brengt daarnaast eigen leges in rekening. Deze gemeentelijke kosten staan los van ons servicetarief.',
    faqs: [
      {
        q: 'Wat is het verschil met de oude drank- en horecavergunning?',
        a: 'De Drank- en Horecawet is in 2021 vervangen door de Alcoholwet. De vergunning heet nu alcoholvergunning, maar de kern — een vergunning om alcohol te schenken — is hetzelfde.',
      },
      {
        q: 'Heb ik een Verklaring Sociale Hygiëne nodig?',
        a: 'Ja, alle leidinggevenden moeten voldoen aan de eisen van sociale hygiëne. Wij helpen u dit correct aan te tonen bij de aanvraag.',
      },
    ],
    related: ['exploitatievergunning', 'terrasvergunning', 'bibob'],
  },

  terrasvergunning: {
    slug: 'terrasvergunning',
    metaTitle: 'Terrasvergunning aanvragen in Amsterdam | Vast tarief',
    metaDescription:
      'Terrasvergunning aanvragen voor uw horecazaak? Wij regelen de aanvraag inclusief terrasplattegrond en voorwaarden. Vaste prijs — bekijk de kosten en het proces.',
    h1: 'Terrasvergunning aanvragen',
    intro:
      'Een terras is voor veel horecazaken goud waard, maar vereist een aparte terrasvergunning van de gemeente. Wij verzorgen de aanvraag inclusief de juiste tekeningen en onderbouwing, tegen een vaste prijs.',
    what: {
      title: 'Wat is een terrasvergunning?',
      paragraphs: [
        'De terrasvergunning geeft u toestemming om op de openbare weg of op eigen terrein een terras te exploiteren bij uw horecazaak. De gemeente toetst onder meer de afmetingen, de doorgang voor voetgangers en hulpdiensten, en de uitstraling in relatie tot de omgeving.',
        'De vergunning bepaalt precies hoe groot uw terras mag zijn, waar het mag staan en welke openingstijden gelden.',
      ],
    },
    when: {
      title: 'Wanneer heeft u een terrasvergunning nodig?',
      paragraphs: [
        'U heeft een terrasvergunning nodig zodra u stoelen en tafels buiten wilt plaatsen voor uw gasten — of dat nu op de stoep, een plein of eigen terrein is. Ook een uitbreiding of wijziging van een bestaand terras vereist een nieuwe aanvraag.',
        'Terrasregels verschillen per gebied en per seizoen. Wij kennen de Amsterdamse regels en zorgen dat uw aanvraag daarop aansluit.',
      ],
    },
    requirements: [
      'Geldige exploitatievergunning voor de zaak',
      'Terrasplattegrond met exacte afmetingen',
      'Situatietekening met de openbare ruimte eromheen',
      'Foto’s van de gevel en de gewenste terraslocatie',
    ],
    process: [
      { title: 'Gratis intake', body: 'Wij beoordelen de haalbaarheid van uw gewenste terras.' },
      { title: 'Tekeningen opstellen', body: 'Wij zorgen voor een correcte terras- en situatietekening.' },
      { title: 'Aanvraag indienen', body: 'Wij dienen de aanvraag in bij de gemeente.' },
      { title: 'Besluit', body: 'U ontvangt de terrasvergunning met de toegestane afmetingen.' },
    ],
    kostenIntro: 'Voor het verzorgen van uw terrasvergunning rekenen wij een vaste servicetarief.',
    kostenNote:
      'De gemeente rekent daarnaast eigen leges en mogelijk precariobelasting voor het gebruik van de openbare ruimte. Deze kosten staan los van ons servicetarief.',
    faqs: [
      {
        q: 'Kan ik het hele jaar een terras hebben?',
        a: 'In veel gebieden geldt een terrasseizoen met specifieke start- en einddata. Wij informeren u over de regels die voor uw locatie gelden.',
      },
      {
        q: 'Heb ik eerst een exploitatievergunning nodig?',
        a: 'Ja, een terrasvergunning hoort bij een zaak met een geldige exploitatievergunning. Wij kunnen beide trajecten voor u combineren.',
      },
    ],
    related: ['exploitatievergunning', 'alcoholvergunning', 'overname'],
  },

  bibob: {
    slug: 'bibob',
    metaTitle: 'Bibob-toets horeca: begeleiding bij de Bibob-vragenlijst',
    metaDescription:
      'Bibob-toets voor uw horecavergunning? Wij begeleiden u bij de Bibob-vragenlijst en onderbouwing zodat uw aanvraag soepel verloopt. Vaste prijs — bekijk het proces.',
    h1: 'Bibob-toets horeca: professionele begeleiding',
    intro:
      'De Bibob-toets is voor veel horecaondernemers het meest spannende onderdeel van de vergunningaanvraag. Wij begeleiden u stap voor stap bij het correct en volledig invullen van de Bibob-vragenlijst, zodat vertraging en afwijzing worden voorkomen.',
    what: {
      title: 'Wat is de Wet Bibob?',
      paragraphs: [
        'Bibob staat voor Bevordering Integriteitsbeoordelingen door het Openbaar Bestuur. Met de Wet Bibob toetst de gemeente of een vergunning mogelijk wordt misbruikt voor criminele activiteiten, bijvoorbeeld witwassen. De toets richt zich op de herkomst van uw financiering en de achtergrond van betrokkenen.',
        'De Bibob-toets is geen beschuldiging — het is een standaard integriteitsonderzoek. Een goed onderbouwde, transparante aanvraag doorloopt de toets doorgaans zonder problemen.',
      ],
    },
    when: {
      title: 'Wanneer krijgt u met Bibob te maken?',
      paragraphs: [
        'De Bibob-toets is onderdeel van de aanvraag van een exploitatievergunning en speelt ook bij overnames. De gemeente vraagt u een uitgebreide vragenlijst in te vullen over uw onderneming, financiering en betrokkenen.',
        'Onduidelijke of onvolledige antwoorden leiden vaak tot aanvullende vragen of vertraging. Onze begeleiding voorkomt dat.',
      ],
    },
    requirements: [
      'Volledig ingevuld Bibob-vragenformulier',
      'Bewijs van herkomst van financiering (bankafschriften, leningen)',
      'Overeenkomsten met financiers en investeerders',
      'Huur- of koopovereenkomst van het pand',
      'Onderbouwing van de bedrijfsstructuur en betrokkenen',
    ],
    process: [
      { title: 'Gratis intake', body: 'Wij nemen uw situatie door en bepalen welke onderbouwing nodig is.' },
      { title: 'Vragenlijst invullen', body: 'Wij helpen u de Bibob-vragenlijst correct en volledig in te vullen.' },
      { title: 'Onderbouwing verzamelen', body: 'Wij ordenen de bewijsstukken over financiering en herkomst.' },
      { title: 'Begeleiding bij vragen', body: 'Wij beantwoorden namens u eventuele aanvullende vragen van de gemeente.' },
    ],
    kostenIntro: 'Voor onze Bibob-begeleiding rekenen wij een vaste servicetarief.',
    kostenNote:
      'De Bibob-toets zelf wordt door de gemeente uitgevoerd. Ons tarief betreft de professionele begeleiding en onderbouwing van uw aanvraag.',
    faqs: [
      {
        q: 'Betekent een Bibob-toets dat ik verdacht ben?',
        a: 'Nee. De Bibob-toets is een standaard integriteitsonderzoek dat bij vrijwel elke horecavergunning hoort. Het is geen beschuldiging.',
      },
      {
        q: 'Wat gebeurt er als ik de vragenlijst verkeerd invul?',
        a: 'Onvolledige of onduidelijke antwoorden leiden tot aanvullende vragen, vertraging of in het ergste geval afwijzing. Onze begeleiding voorkomt fouten.',
      },
    ],
    related: ['exploitatievergunning', 'overname', 'alcoholvergunning'],
  },

  overname: {
    slug: 'overname',
    metaTitle: 'Horecazaak overnemen: vergunningen bij een overname regelen',
    metaDescription:
      'Een horecazaak overnemen? Bij een overname moet u de vergunningen opnieuw aanvragen. Wij regelen het volledige vergunningtraject tegen een vaste prijs.',
    h1: 'Horecazaak overnemen: de vergunningen geregeld',
    intro:
      'Bij de overname van een horecazaak gaan de bestaande vergunningen niet automatisch mee over. Als nieuwe exploitant moet u de exploitatie- en alcoholvergunning opnieuw aanvragen. Wij begeleiden de complete overname op vergunninggebied tegen een vaste prijs.',
    what: {
      title: 'Wat betekent een overname voor uw vergunningen?',
      paragraphs: [
        'Een exploitatievergunning staat op naam van de exploitant en het pand. Bij een eigenaarswissel vervalt de oude vergunning en moet de nieuwe ondernemer een eigen vergunning aanvragen — inclusief een nieuwe Bibob-toets.',
        'Het is verstandig de vergunningaanvraag al vóór de daadwerkelijke overname in gang te zetten, zodat u zonder onderbreking open kunt blijven.',
      ],
    },
    when: {
      title: 'Wanneer speelt dit?',
      paragraphs: [
        'Bij elke overname van een bestaande horecazaak: of u nu een café, restaurant of snackbar overneemt. Ook bij het toetreden of uittreden van een vennoot kan een nieuwe aanvraag nodig zijn.',
        'Wij beoordelen tijdens de intake precies welke vergunningen opnieuw moeten worden aangevraagd en plannen het traject rond uw overnamedatum.',
      ],
    },
    requirements: [
      'Koop- of overnameovereenkomst van de onderneming',
      'Uittreksel Kamer van Koophandel (KvK) van de nieuwe onderneming',
      'Bibob-vragenformulier met onderbouwing',
      'Huurovereenkomst of eigendomsbewijs van het pand',
      'Identiteitsbewijzen van de nieuwe leidinggevenden',
    ],
    process: [
      { title: 'Gratis intake', body: 'Wij bepalen welke vergunningen bij uw overname opnieuw nodig zijn.' },
      { title: 'Documenten verzamelen', body: 'Wij verzamelen de stukken voor de nieuwe aanvragen.' },
      { title: 'Aanvragen indienen', body: 'Wij dienen exploitatie- en alcoholvergunning tijdig in.' },
      { title: 'Bibob & besluit', body: 'Wij begeleiden de Bibob-toets tot de vergunning rond is.' },
    ],
    kostenIntro: 'Voor het volledige overnametraject op vergunninggebied rekenen wij een vaste servicetarief.',
    kostenNote:
      'De gemeente rekent per aanvraag eigen leges. Deze kosten staan los van ons servicetarief.',
    faqs: [
      {
        q: 'Kan ik de vergunning van de vorige eigenaar overnemen?',
        a: 'Nee. Een exploitatievergunning is persoonsgebonden en vervalt bij een eigenaarswissel. Als nieuwe exploitant vraagt u een eigen vergunning aan.',
      },
      {
        q: 'Moet ik opnieuw door de Bibob-toets?',
        a: 'Ja, als nieuwe exploitant doorloopt u een eigen Bibob-toets. Wij begeleiden u hierbij zodat het soepel verloopt.',
      },
    ],
    related: ['exploitatievergunning', 'bibob', 'alcoholvergunning'],
  },

  verbouwing: {
    slug: 'verbouwing',
    metaTitle: 'Verbouwing horeca: gebruiksvergunning en meldingen regelen',
    metaDescription:
      'Uw horecazaak verbouwen? Wij regelen de vergunningen en meldingen rondom verbouwing en brandveilig gebruik. Vaste prijs — bekijk het proces en de voorwaarden.',
    h1: 'Verbouwing & gebruiksvergunning voor de horeca',
    intro:
      'Gaat u uw horecazaak verbouwen of anders indelen? Dan krijgt u te maken met vergunningen en meldingen rondom (brandveilig) gebruik en soms een omgevingsvergunning. Wij regelen het vergunningtraject rondom uw verbouwing.',
    what: {
      title: 'Welke vergunningen spelen bij een verbouwing?',
      paragraphs: [
        'Afhankelijk van de aard van de verbouwing heeft u mogelijk een omgevingsvergunning nodig, een melding of vergunning brandveilig gebruik, en soms een aanpassing van uw exploitatievergunning als de indeling wijzigt.',
        'Wij beoordelen welke trajecten voor uw verbouwing van toepassing zijn en zorgen dat uw zaak veilig en vergund kan heropenen.',
      ],
    },
    when: {
      title: 'Wanneer heeft u dit nodig?',
      paragraphs: [
        'Bij het wijzigen van de indeling, het vergroten van het aantal bezoekers, constructieve aanpassingen of het toevoegen van bijvoorbeeld een keuken of afzuiging. Ook een gewijzigde plattegrond kan gevolgen hebben voor uw bestaande vergunningen.',
        'Twijfelt u of uw verbouwing vergunningplichtig is? Wij beoordelen dit tijdens de intake.',
      ],
    },
    requirements: [
      'Bestaande en nieuwe plattegrond van het pand',
      'Beschrijving van de verbouwing en installaties',
      'Gegevens over maximale bezetting en vluchtroutes',
      'Geldige exploitatievergunning van de zaak',
    ],
    process: [
      { title: 'Gratis intake', body: 'Wij bepalen welke vergunningen en meldingen nodig zijn.' },
      { title: 'Documenten en tekeningen', body: 'Wij verzorgen de benodigde tekeningen en onderbouwing.' },
      { title: 'Aanvraag/melding indienen', body: 'Wij dienen de juiste aanvragen en meldingen in.' },
      { title: 'Besluit', body: 'U kunt veilig en vergund heropenen.' },
    ],
    kostenIntro: 'Voor het verzorgen van de vergunningen rondom uw verbouwing rekenen wij een vaste servicetarief.',
    kostenNote:
      'De gemeente rekent afhankelijk van het traject eigen leges. Bouwkundige kosten en die van derden staan los van ons servicetarief.',
    faqs: [
      {
        q: 'Heb ik altijd een vergunning nodig voor een verbouwing?',
        a: 'Niet altijd — het hangt af van de aard en omvang. Wij beoordelen tijdens de intake welke vergunningen of meldingen voor u van toepassing zijn.',
      },
      {
        q: 'Moet mijn exploitatievergunning worden aangepast?',
        a: 'Als de indeling of het aantal bezoekers wijzigt, kan een aanpassing nodig zijn. Wij regelen dit gelijktijdig met de verbouwingstrajecten.',
      },
    ],
    related: ['exploitatievergunning', 'terrasvergunning', 'overname'],
  },
};

export const PERMIT_SLUGS = Object.keys(PERMIT_CONTENT);

export function getPermitContent(slug: string): PermitContent | null {
  return PERMIT_CONTENT[slug] ?? null;
}
