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
            <img src="/blog/amsterdam-permit.svg" alt="Horecavergunning Amsterdam Illustratie" fetchpriority="high" loading="eager" class="w-full h-auto rounded-xl shadow-md border border-slate-100" />
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
            <img src="/blog/amsterdam-permit.svg" alt="Amsterdam Hospitality Permit Illustration" fetchpriority="high" loading="eager" class="w-full h-auto rounded-xl shadow-md border border-slate-100" />
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
    slug: "wet-bibob-onderzoek-uitleg-tips",
    image: "/blog/bibob-procedure.svg",
    author: "Pieter van der Zandt",
    date: "10-01-2026",
    content: {
      nl: {
        title: "De Wet Bibob in de Horeca: Voorkom dat uw vergunning geweigerd wordt",
        excerpt: "De Bibob-toets is de nachtmerrie van elke starter. Lees wat er precies onderzocht wordt, welke documenten u nodig heeft en hoe u problemen voorkomt.",
        body: `
          <p class="lead text-xl text-slate-600 mb-6">De Wet Bibob (Bevordering Integriteitsbeoordelingen door het Openbaar Bestuur) is in het leven geroepen om te voorkomen dat de overheid ongewild criminele activiteiten faciliteert. Voor u als horecaondernemer betekent dit dat u met de billen bloot moet.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Wat onderzoekt de gemeente?</h2>
          <p class="mb-4">Bij een Bibob-onderzoek wordt gekeken naar de financiering van uw onderneming en de achtergrond van de betrokken personen. De kernvraag is: "Waar komt het geld vandaan?"</p>
          <ul class="list-disc pl-6 mb-6 space-y-2 marker:text-amber-500">
             <li><strong>Financiering:</strong> Eigen vermogen, leningen van familie of bankkrediet? Alles moet traceerbaar zijn.</li>
             <li><strong>Zakelijke relaties:</strong> Met wie doet u zaken? Zijn er banden met het criminele circuit?</li>
             <li><strong>Verleden:</strong> Heeft u (of uw zakenpartner) strafbare feiten gepleegd?</li>
          </ul>

          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Veelgemaakte fouten</h2>
          <p class="mb-4">Een weigering komt vaak niet door criminele opzet, maar door <strong>onvolledige administratie</strong>. Veelgemaakte fouten zijn:</p>
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li>Geen leenovereenkomsten op papier hebben bij leningen van vrienden of familie.</li>
            <li>Contante stortingen waarvan de herkomst niet te bewijzen is.</li>
            <li>Onverklaarbare verschillen tussen uw belastingaangifte en uw vermogen.</li>
          </ul>

          <p class="mb-4">Zorg dat uw dossier compleet is voordat u de aanvraag indient. Twijfelgevallen leiden direct tot extra vragen en maanden vertraging.</p>
        `,
        category: "Wetgeving",
        readTime: "5 min lezen"
      },
      en: {
        title: "The Bibob Act in Hospitality: Prevent Your Permit from Being Refused",
        excerpt: "The Bibob test is every starter's nightmare. Read exactly what is investigated, which documents you need, and how to avoid problems.",
        body: `
          <p class="lead text-xl text-slate-600 mb-6">The Bibob Act (Public Administration Probity Screening Act) was created to prevent the government from unwittingly facilitating criminal activities. For you as a hospitality entrepreneur, this means total transparency.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">What does the municipality investigate?</h2>
          <p class="mb-4">A Bibob investigation looks at the financing of your business and the background of the people involved. The core question is: "Where does the money come from?"</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Common Mistakes</h2>
          <p class="mb-4">A refusal is often not due to criminal intent, but due to <strong>incomplete administration</strong>. Common mistakes include:</p>
          <ul class="list-disc pl-6 mb-6 space-y-2">
            <li>Not having written loan agreements for loans from friends or family.</li>
            <li>Cash deposits where the origin cannot be proven.</li>
            <li>Unexplained differences between your tax return and your assets.</li>
          </ul>
        `,
        category: "Legislation",
        readTime: "5 min read"
      }
    }
  },
  {
    slug: "horecabedrijf-overnemen-stappenplan",
    image: "/blog/horeca-overname.svg",
    author: "Jeroen de Vries",
    date: "03-01-2026",
    content: {
      nl: {
        title: "Een bestaande horecazaak overnemen: Waar moet u op letten?",
        excerpt: "Een draaiende zaak overnemen lijkt makkelijker dan nieuw starten, maar er zijn valkuilen. Een gids over goodwill, inventaris en vergunningen.",
        body: `
          <p class="lead text-xl text-slate-600 mb-6">Het overnemen van een bestaand restaurant of café geeft u een vliegende start. Er is al omzet, er is personeel en er zijn vaste gasten. Maar u koopt ook de 'lijken in de kast' van de vorige eigenaar als u niet oppast.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">De vergunning is persoonsgebonden!</h2>
          <p class="mb-4">De grootste misvatting is dat u de vergunning "mee koopt". <strong>Dit is onjuist.</strong> Een horecavergunning staat op naam (of BV) van de ondernemer. U moet als nieuwe eigenaar <em>altijd</em> een nieuwe exploitatievergunning aanvragen.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Due Diligence: Boekenonderzoek</h2>
          <p class="mb-4">Voordat u tekent, moet u (laten) kijken naar de cijfers:</p>
          <ul class="list-disc pl-6 mb-6 space-y-2 marker:text-amber-500">
            <li><strong>Personeel:</strong> U bent wettelijk verplicht het personeel over te nemen met behoud van rechten (anciënniteit, contractvorm).</li>
            <li><strong>Leverancierscontracten:</strong> Zit u vast aan een brouwerijcontract? Dit kan uw marges flink drukken.</li>
            <li><strong>Schulden:</strong> Controleer op openstaande belastingschulden of leverancierskredieten.</li>
          </ul>
        `,
        category: "Financiën",
        readTime: "7 min lezen"
      },
      en: {
        title: "Taking Over an Existing Hospitality Business: What to Watch Out For?",
        excerpt: "Taking over a running business seems easier than starting new, but there are pitfalls. A guide on goodwill, inventory, and permits.",
        body: `
           <p class="lead text-xl text-slate-600 mb-6">Taking over an existing restaurant or café gives you a flying start. There is already turnover, staff, and regular guests. But you also buy the previous owner's 'skeletons in the closet' if you're not careful.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">The permit is personal!</h2>
          <p class="mb-4">The biggest misconception is that you "buy" the permit with the business. <strong>This is incorrect.</strong> A hospitality permit is issued to the entrepreneur (or legal entity). As the new owner, you must <em>always</em> apply for a new exploitation permit.</p>
        `,
        category: "Finance",
        readTime: "7 min read"
      }
    }
  },
  {
    slug: "alcoholwet-sociale-hygiene-verklaring",
    image: "/blog/alcohol-wet.svg",
    author: "Sarah Jansen",
    date: "28-12-2025",
    content: {
      nl: {
        title: "Alcohol schenken? Alles over de Alcoholwet en Sociale Hygiëne",
        excerpt: "Geen alcoholvergunning zonder Sociale Hygiëne. Ontdek aan welke eisen uw pand en personeel moeten voldoen om legaal te mogen tappen.",
        body: `
          <p class="lead text-xl text-slate-600 mb-6">Wilt u bier, wijn of sterke drank schenken? Dan valt u onder de Alcoholwet (voorheen Drank- en Horecawet). Dit is een van de strengst gecontroleerde wetten in Nederland.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Diploma Sociale Hygiëne</h2>
          <p class="mb-4">Op uw vergunning moeten leidinggevenden staan die in het bezit zijn van de Verklaring Sociale Hygiëne. Daarnaast is de regel: <strong>Tijdens openingsuren moet er áltijd minstens één persoon aanwezig zijn die dit diploma heeft én op de vergunning staat.</strong></p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Bouwkundige Eisen</h2>
          <p class="mb-4">Uw pand moet aan specifieke inrichtingseisen voldoen, anders krijgt u geen vergunning:</p>
          <ul class="list-disc pl-6 mb-6 space-y-2 marker:text-amber-500">
            <li>Minimaal 35m² vloeroppervlakte voor de horecalokaliteit.</li>
            <li>Minimaal 2,40 meter hoog.</li>
            <li>Twee volledig gescheiden toiletten met voorportaal (handen wassen).</li>
            <li>Goed werkend ventilatiesysteem.</li>
          </ul>
        `,
        category: "Wetgeving",
        readTime: "4 min lezen"
      },
      en: {
        title: "Serving Alcohol? Everything about the Alcohol Act and Social Hygiene",
        excerpt: "No alcohol permit without Social Hygiene. Discover the requirements for your building and staff to legally serve drinks.",
        body: `
          <p class="lead text-xl text-slate-600 mb-6">Do you want to serve beer, wine, or spirits? Then you fall under the Alcohol Act. This is one of the most strictly enforced laws in the Netherlands.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Social Hygiene Diploma</h2>
          <p class="mb-4">Your permit must list managers who possess the Social Hygiene Declaration. Furthermore, the rule is: <strong>During opening hours, there must always be at least one person present who has this diploma AND is listed on the permit.</strong></p>
        `,
        category: "Legislation",
        readTime: "4 min read"
      }
    }
  },
  {
    slug: "horeca-administratie-tips-winst",
    image: "/blog/finance-admin.svg",
    author: "Mark van den Berg",
    date: "15-12-2025",
    content: {
      nl: {
        title: "Grip op uw horeca cijfers: 5 tips voor een gezonde administratie",
        excerpt: "In de horeca zijn de marges dun. Een strakke administratie is geen luxe, maar noodzaak. Lees hoe u lekken in uw cashflow dicht.",
        body: `
          <p class="lead text-xl text-slate-600 mb-6">Omzet is leuk, maar winst is waar het om draait. Veel horecaondernemers sturen op gevoel en kijken pas aan het eind van het jaar naar de cijfers. Dat is te laat.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Kostprijsberekening is heilig</h2>
          <p class="mb-4">Weet u precies wat dat biertje u kost? Niet alleen de inkoop, maar ook de breuk, het tappen, de koeling en de personeelskosten? Zonder accurate kostprijsberekening (calculatie) is uw menukaart een gokspel.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Personeelskosten vs. Omzet</h2>
          <p class="mb-4">De grootste kostenpost is personeel. Houd dagelijks uw arbeidsproductiviteit in de gaten. Een vuistregel in de horeca is dat personeelskosten niet hoger mogen zijn dan 30-35% van de omzet. Gebruik een kassasysteem dat dit real-time toont.</p>
        `,
        category: "Financiën",
        readTime: "5 min lezen"
      },
      en: {
        title: "Grip on your Hospitality Numbers: 5 Tips for Healthy Administration",
        excerpt: "In hospitality, margins are thin. Tight administration is not a luxury, but a necessity. Read how to plug leaks in your cash flow.",
        body: `
          <p class="lead text-xl text-slate-600 mb-6">Turnover is nice, but profit is what matters. Many hospitality entrepreneurs steer by gut feeling and only look at the numbers at the end of the year. That is too late.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Cost Price Calculation is Sacred</h2>
          <p class="mb-4">Do you know exactly what that beer costs you? Not just the purchase price, but also breakage, pouring, cooling, and staff costs? Without accurate cost calculation, your menu is a gamble.</p>
        `,
        category: "Finance",
        readTime: "5 min read"
      }
    }
  },
  {
    slug: "terrasvergunning-regels-seizoen-2026",
    image: "/blog/terrace-permit.svg",
    author: "Lisa Bakker",
    date: "01-12-2025",
    content: {
      nl: {
        title: "Terrasvergunning 2026: Regels voor zomer en winter",
        excerpt: "Een terras is een goudmijn, maar de regels worden strenger. Mag u een overkapping plaatsen? En hoe zit het met gevelbankjes?",
        body: `
          <p class="lead text-xl text-slate-600 mb-6">Zodra de zon schijnt, willen gasten naar buiten. Een terras kan uw omzet verdubbelen. Maar de openbare ruimte is schaars, zeker in drukke steden.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Winterterras en Overkappingen</h2>
          <p class="mb-4">Sinds de coronacrisis zijn gemeenten soepeler geworden met winterterrassen, maar permanente bouwwerken (overkappingen, schermen nagelvast aan de grond) vereisen vaak een omgevingsvergunning naast uw terrasvergunning.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">De 2-meter regel</h2>
          <p class="mb-4">Houd altijd rekening met de looproute. In de meeste gemeenten moet er minimaal 1,5 tot 2 meter vrije loopruimte overblijven voor voetgangers en rolstoelgebruikers. Zet u uw bord of plantenbak daar buiten? Dan riskeert u een boete of intrekking van de vergunning.</p>
        `,
        category: "Wetgeving",
        readTime: "4 min lezen"
      },
      en: {
        title: "Terrace Permit 2026: Rules for Summer and Winter",
        excerpt: "A terrace is a goldmine, but rules are getting stricter. Can you install a covering? And what about facade benches?",
        body: `
          <p class="lead text-xl text-slate-600 mb-6">As soon as the sun shines, guests want to go outside. A terrace can double your turnover. But public space is scarce, especially in busy cities.</p>
          
          <h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">Winter Terrace and Coverings</h2>
          <p class="mb-4">Since the corona crisis, municipalities have become more lenient with winter terraces, but permanent structures often require an environmental permit in addition to your terrace permit.</p>
        `,
        category: "Legislation",
        readTime: "4 min read"
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