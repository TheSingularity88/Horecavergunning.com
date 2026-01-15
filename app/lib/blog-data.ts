export interface BlogPost {
  slug: string;
  image: string;
  author: string;
  date: string;
  content: {
    nl: {
      title: string;
      excerpt: string;
      body: string;
      category: string;
      readTime: string;
    };
    en: {
      title: string;
      excerpt: string;
      body: string;
      category: string;
      readTime: string;
    };
  };
}

export const blogPosts: BlogPost[] = [
  {
    slug: "horecavergunning-aanvragen-amsterdam-voorwaarden",
    image: "/blog/amsterdam-permit.svg",
    author: "Team HorecaVergunning",
    date: "15-01-2026",
    content: {
      nl: {
        title: "Horecavergunning aanvragen in Amsterdam: Alle voorwaarden op een rij",
        excerpt: "Wilt u een horecazaak starten in Amsterdam? Wij zetten alle harde eisen, van Bibob tot geluidsnormen, overzichtelijk voor u onder elkaar.",
        body: `
          <p class="lead text-xl text-slate-600 mb-6">Droomt u van een eigen café aan de gracht of een restaurant in de Pijp? Een horecavergunning aanvragen in Amsterdam is een proces met strikte voorwaarden. In dit artikel zetten we de belangrijkste eisen en stappen helder op een rij, gebaseerd op de actuele regels van de Gemeente Amsterdam.</p>
          
          <p class="mb-4">Amsterdam hanteert een streng maar rechtvaardig beleid om de leefbaarheid in de stad te bewaken en ondermijning tegen te gaan. Voordat u uw deuren kunt openen, krijgt u te maken met verschillende toetsingen. Dit zijn de belangrijkste pijlers.</p>
    
          <div class="my-8">
            <img src="/blog/amsterdam-permit.svg" alt="Horecavergunning Amsterdam Illustratie" class="w-full h-auto rounded-xl shadow-md border border-slate-100" />
            <p class="text-sm text-slate-400 mt-2 text-center italic">Een goede voorbereiding is het halve werk bij uw vergunningaanvraag.</p>
          </div>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">1. De Exploitatievergunning</h2>
          <p class="mb-4">De basis van elke horecazaak is de exploitatievergunning. Deze is verplicht als u eten of drinken verkoopt voor consumptie ter plaatse. De gemeente toetst hierbij op drie hoofdzaken:</p>
          <ul class="list-disc pl-6 mb-6 space-y-2 marker:text-amber-500">
            <li><strong>Openbare orde en veiligheid:</strong> Vormt uw zaak geen gevaar voor de omgeving?</li>
            <li><strong>Woon- en leefklimaat:</strong> Geeft uw zaak niet te veel overlast voor omwonenden?</li>
            <li><strong>Integriteit (Wet Bibob):</strong> Is er geen sprake van crimineel geld of criminele banden?</li>
          </ul>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">2. De Wet Bibob: Streng Toezicht</h2>
          <p class="mb-4">Amsterdam staat bekend om zijn strenge Bibob-toetsing. Dit is vaak het meest ingrijpende deel van de aanvraag. U moet tot in detail kunnen aantonen waar uw investeringsgeld vandaan komt. </p>
          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
            <p class="font-semibold text-amber-900">Let op:</p>
            <p class="text-amber-800 text-sm">Zorg dat uw administratie van de afgelopen 5 jaar op orde is. Onduidelijke geldstromen zijn de nummer 1 reden voor weigering.</p>
          </div>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Locatie en Bestemmingsplan</h2>
          <p class="mb-4">Niet elk pand is geschikt voor horeca. Het bestemmingsplan van de gemeente is leidend. Zelfs als er 'Horeca' op de gevel staat, betekent dit niet automatisch dat u er zomaar mag beginnen. Controleer altijd eerst de bestemming op <a href="https://www.ruimtelijkeplannen.nl" target="_blank" rel="nofollow" class="text-amber-600 underline">Ruimtelijkeplannen.nl</a> of bij het stadsdeel.</p>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Checklist Benodigde Documenten</h2>
          <p class="mb-4">Een complete aanvraag versnelt het proces aanzienlijk. Zorg dat u de volgende stukken digitaal klaar heeft staan:</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div>
                <ul class="space-y-3">
                    <li class="flex items-center"><span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span> Geldig legitimatiebewijs</li>
                    <li class="flex items-center"><span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span> Huur- of koopovereenkomst</li>
                    <li class="flex items-center"><span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span> Plattegrond van de zaak (schaal 1:100)</li>
                    <li class="flex items-center"><span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span> Ondernemingsplan</li>
                </ul>
            </div>
            <div>
                 <img src="/blog/checklist.svg" alt="Checklist illustratie" class="w-full h-auto rounded-lg" />
            </div>
          </div>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Alcohol en Terras</h2>
          <p class="mb-4">Wilt u alcohol schenken? Dan heeft u naast de exploitatievergunning ook een <strong>Alcoholwetvergunning</strong> nodig. Hiervoor gelden extra eisen aan uw pand (zoals ventilatie en toiletgroepen) en aan uw personeel (Sociale Hygiëne). Voor een terras op de openbare weg is een aparte <strong>Terrasvergunning</strong> vereist.</p>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Hulp nodig bij uw aanvraag?</h2>
          <p class="mb-4">Het aanvragen van een horecavergunning in Amsterdam kan overweldigend zijn door de hoeveelheid regels en formulieren. Een kleine fout kan leiden tot weken vertraging. HorecaVergunning.com helpt u graag bij het compleet en correct indienen van uw dossier.</p>
        `,
        category: "Wetgeving",
        readTime: "6 min lezen"
      },
      en: {
        title: "Applying for a Hospitality Permit in Amsterdam: All Conditions Listed",
        excerpt: "Do you want to start a hospitality business in Amsterdam? We list all the hard requirements, from Bibob to noise standards, clearly for you.",
        body: `
          <p class="lead text-xl text-slate-600 mb-6">Dreaming of your own café on the canals or a restaurant in De Pijp? Applying for a hospitality permit in Amsterdam is a process with strict conditions. In this article, we clearly list the most important requirements and steps, based on the current regulations of the Municipality of Amsterdam.</p>
          
          <p class="mb-4">Amsterdam maintains a strict but fair policy to monitor the quality of life in the city and combat undermining. Before you can open your doors, you will face various checks. These are the main pillars.</p>
    
          <div class="my-8">
            <img src="/blog/amsterdam-permit.svg" alt="Amsterdam Hospitality Permit Illustration" class="w-full h-auto rounded-xl shadow-md border border-slate-100" />
            <p class="text-sm text-slate-400 mt-2 text-center italic">Good preparation is half the work for your permit application.</p>
          </div>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">1. The Exploitation Permit</h2>
          <p class="mb-4">The basis of every hospitality business is the exploitation permit. This is mandatory if you sell food or drinks for consumption on the premises. The municipality checks three main points:</p>
          <ul class="list-disc pl-6 mb-6 space-y-2 marker:text-amber-500">
            <li><strong>Public order and safety:</strong> Does your business pose a danger to the environment?</li>
            <li><strong>Living environment:</strong> Does your business cause too much nuisance for residents?</li>
            <li><strong>Integrity (Bibob Act):</strong> Is there no evidence of criminal money or criminal ties?</li>
          </ul>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">2. The Bibob Act: Strict Supervision</h2>
          <p class="mb-4">Amsterdam is known for its strict Bibob assessment. This is often the most intrusive part of the application. You must demonstrate in detail where your investment money comes from.</p>
          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
            <p class="font-semibold text-amber-900">Note:</p>
            <p class="text-amber-800 text-sm">Ensure your administration for the past 5 years is in order. Unclear money flows are the number 1 reason for refusal.</p>
          </div>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Location and Zoning Plan</h2>
          <p class="mb-4">Not every building is suitable for hospitality. The municipality's zoning plan is leading. Even if 'Hospitality' is on the facade, this does not automatically mean you can just start. Always check the destination first on <a href="https://www.ruimtelijkeplannen.nl" target="_blank" rel="nofollow" class="text-amber-600 underline">Ruimtelijkeplannen.nl</a> or at the district.</p>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Checklist Required Documents</h2>
          <p class="mb-4">A complete application speeds up the process significantly. Ensure you have the following documents ready digitally:</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div>
                <ul class="space-y-3">
                    <li class="flex items-center"><span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span> Valid ID</li>
                    <li class="flex items-center"><span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span> Rental or purchase agreement</li>
                    <li class="flex items-center"><span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span> Floor plan (scale 1:100)</li>
                    <li class="flex items-center"><span class="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 text-xs">✓</span> Business plan</li>
                </ul>
            </div>
            <div>
                 <img src="/blog/checklist.svg" alt="Checklist illustration" class="w-full h-auto rounded-lg" />
            </div>
          </div>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Alcohol and Terrace</h2>
          <p class="mb-4">Do you want to serve alcohol? Then, in addition to the exploitation permit, you also need an <strong>Alcohol Law Permit</strong>. Extra requirements apply to your building (such as ventilation and toilets) and to your staff (Social Hygiene). A separate <strong>Terrace Permit</strong> is required for a terrace on the public road.</p>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Need help with your application?</h2>
          <p class="mb-4">Applying for a hospitality permit in Amsterdam can be overwhelming due to the amount of rules and forms. A small mistake can lead to weeks of delay. HorecaVergunning.com is happy to help you submit your file completely and correctly.</p>
        `,
        category: "Legislation",
        readTime: "6 min read"
      }
    }
  },
  {
    slug: "lange-termijn-stroomcontracten-duurder-maar-gas-goedkoper",
    image: "/blog/energy-graph.jpg",
    author: "Jeroen de Vries",
    date: "14-01-2025",
    content: {
      nl: {
        title: "Lange termijn stroomcontracten duurder, maar gas goedkoper",
        excerpt: "De prijzen voor energiecontracten met een vaste looptijd zijn de afgelopen maand flink verschoven. Stroom werd duurder, gas juist goedkoper.",
        body: `
          <p class="mb-4">De prijzen voor energiecontracten met een vaste looptijd zijn de afgelopen maand flink verschoven. Wie nu een contract voor drie jaar afsluit voor stroom, betaalt gemiddeld meer dan een maand geleden. De gasprijs voor lange termijn contracten is daarentegen gedaald.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Stroomprijs stijgt, gasprijs daalt</h2>
          <p class="mb-4">Uit een analyse van de actuele energietarieven blijkt dat leveranciers hun prijzen voor de langere termijn hebben aangepast. Dit heeft te maken met de onzekerheid op de internationale energiemarkten en de verwachtingen voor de komende winter.</p>
          
          <p class="mb-4">Voor ondernemers in de horeca is dit een belangrijk signaal. De energiekosten vormen immers een aanzienlijk deel van de vaste lasten. Het kan lonen om nu nog de gasprijs vast te zetten, terwijl het voor stroom misschien verstandig is om even af te wachten of te kiezen voor een variabel tarief.</p>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Wat betekent dit voor uw horecazaak?</h2>
          <p class="mb-4">Als horecaondernemer verbruikt u veel energie. Koeling, verlichting, keukenapparatuur en verwarming draaien vaak overuren. Een stijging van de stroomprijs tikt dan ook hard aan.</p>
          
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li>Controleer uw huidige contractdata.</li>
            <li>Vergelijk de nieuwe tarieven met uw huidige kosten.</li>
            <li>Overweeg verduurzamingsmaatregelen om het verbruik te drukken.</li>
          </ul>
    
          <p class="mb-4">Het is raadzaam om niet blind te varen op de krantenkoppen, maar uw specifieke situatie door te rekenen. Soms kan een iets hoger tarief met meer zekerheid toch de beste keuze zijn voor uw bedrijfsvoering.</p>
        `,
        category: "Energie",
        readTime: "4 min lezen"
      },
      en: {
        title: "Long-term electricity contracts more expensive, but gas cheaper",
        excerpt: "Prices for fixed-term energy contracts have shifted significantly over the past month. Electricity became more expensive, while gas became cheaper.",
        body: `
          <p class="mb-4">Prices for fixed-term energy contracts have shifted significantly over the past month. Anyone signing a three-year contract for electricity now pays more on average than a month ago. The gas price for long-term contracts, on the other hand, has fallen.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Electricity price rises, gas price falls</h2>
          <p class="mb-4">An analysis of current energy rates shows that suppliers have adjusted their prices for the longer term. This is due to uncertainty in international energy markets and expectations for the coming winter.</p>
          
          <p class="mb-4">For entrepreneurs in the hospitality industry, this is an important signal. Energy costs form a significant part of fixed costs. It may pay off to fix the gas price now, while for electricity it might be wise to wait or choose a variable rate.</p>
    
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">What does this mean for your hospitality business?</h2>
          <p class="mb-4">As a hospitality entrepreneur, you consume a lot of energy. Cooling, lighting, kitchen equipment, and heating often run overtime. An increase in electricity prices hits hard.</p>
          
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li>Check your current contract dates.</li>
            <li>Compare new rates with your current costs.</li>
            <li>Consider sustainability measures to reduce consumption.</li>
          </ul>
    
          <p class="mb-4">It is advisable not to rely blindly on headlines, but to calculate your specific situation. Sometimes a slightly higher rate with more certainty can still be the best choice for your business operations.</p>
        `,
        category: "Energy",
        readTime: "4 min read"
      }
    }
  },
  {
    slug: "nieuwe-bibob-regels-2025",
    image: "/blog/bibob-wet.jpg",
    author: "Sarah Jansen",
    date: "10-01-2025",
    content: {
      nl: {
        title: "Nieuwe Bibob-regels per 2025: Wat verandert er?",
        excerpt: "De Wet Bibob wordt aangescherpt. Gemeenten krijgen meer bevoegdheden om vergunningen te weigeren bij vermoeden van crimineel geld.",
        body: "<p>De Wet Bibob is een belangrijk instrument voor gemeenten...</p>",
        category: "Wetgeving",
        readTime: "6 min lezen"
      },
      en: {
        title: "New Bibob Rules as of 2025: What Changes?",
        excerpt: "The Bibob Act is being tightened. Municipalities get more powers to refuse permits in case of suspected criminal money.",
        body: "<p>The Bibob Act is an important instrument for municipalities...</p>",
        category: "Legislation",
        readTime: "6 min read"
      }
    }
  },
  {
    slug: "horeca-personeel-tekort-oplossingen",
    image: "/blog/staff.jpg",
    author: "Mark van den Berg",
    date: "05-01-2025",
    content: {
      nl: {
        title: "Creatieve oplossingen voor het personeelstekort",
        excerpt: "Het vinden van goed personeel blijft een uitdaging. Wij zetten 5 creatieve strategieën op een rij die werken.",
        body: "<p>Personeelstekort is dé hoofdpijn van elke horecaondernemer...</p>",
        category: "Personeel",
        readTime: "3 min lezen"
      },
      en: {
        title: "Creative Solutions for Staff Shortages",
        excerpt: "Finding good staff remains a challenge. We list 5 creative strategies that work.",
        body: "<p>Staff shortage is the headache of every hospitality entrepreneur...</p>",
        category: "Staff",
        readTime: "3 min read"
      }
    }
  },
    {
    slug: "duurzame-terrasverwarming",
    image: "/blog/terrace.jpg",
    author: "Lisa Bakker",
    date: "28-12-2024",
    content: {
      nl: {
        title: "Duurzame terrasverwarming: Wel of niet doen?",
        excerpt: "Met de stijgende energieprijzen is terrasverwarming een kostenpost. Wat zijn de duurzame alternatieven?",
        body: "<p>Gasten willen graag buiten zitten, ook als het wat frisser is...</p>",
        category: "Duurzaamheid",
        readTime: "5 min lezen"
      },
      en: {
        title: "Sustainable Terrace Heating: Do or Don't?",
        excerpt: "With rising energy prices, terrace heating is a cost item. What are the sustainable alternatives?",
        body: "<p>Guests like to sit outside, even if it is a bit chilly...</p>",
        category: "Sustainability",
        readTime: "5 min read"
      }
    }
  }
];

export const categories = {
  nl: [
    "Energie",
    "Wetgeving",
    "Personeel",
    "Duurzaamheid",
    "Marketing",
    "Financiën"
  ],
  en: [
    "Energy",
    "Legislation",
    "Staff",
    "Sustainability",
    "Marketing",
    "Finance"
  ]
};