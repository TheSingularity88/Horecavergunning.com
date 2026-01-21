export type Language = 'en' | 'nl';

export const translations = {
  en: {
    navbar: {
      services: "Services",
      pricing: "Pricing",
      faq: "FAQ",
      about: "About",
      login: "Login",
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
      result_download: "Download Guide",
      back: "Back",
      restart: "Start Over"
    },
    footer: {
      tagline: "Empowering Dutch hospitality with simplified legal and financial support.",
      services: "Services",
      company: "Company",
      contact: "Contact",
      rights: "© 2026 HorecaVergunning BV. All rights reserved."
    },
    whatsapp: "WhatsApp Us",
    blog: {
      title: "Hospitality Knowledge & News",
      subtitle: "Stay up to date with the latest legislation, trends, and tips for the hospitality industry.",
      search_placeholder: "Search our articles...",
      search_button: "Search",
      read_more: "Read more",
      load_more: "Load more articles",
      back_to_overview: "Back to overview",
      related_articles: "We recommend these articles:",
      share_article: "Share this article:",
      about_author: "About",
      published_on: "Published on",
      read_time: "read",
      categories: "Topics",
      recent_posts: "Recent Posts",
      newsletter: {
        title: "Stay Updated",
        desc: "Receive the latest hospitality updates and legislation directly in your mailbox.",
        placeholder: "Your email address",
        button: "Subscribe"
      },
      cta: {
        title: "Need a Hospitality Permit?",
        desc: "Arranging your permit fast and affordable. We handle all the paperwork.",
        features: ["Fixed low price", "Started within 24 hours", "100% Satisfaction"],
        button: "Apply Now"
      }
    },
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
    },
    dashboard: {
      nav: {
        dashboard: "Dashboard",
        clients: "Clients",
        cases: "Cases",
        tasks: "Tasks",
        documents: "Documents",
        requests: "Requests",
        users: "Users",
        settings: "Settings",
        activity: "Activity",
        profile: "Profile",
        logout: "Log out",
        admin: "Admin",
        collapse: "Collapse"
      },
      auth: {
        login: "Sign in",
        logout: "Log out",
        email: "Email",
        password: "Password",
        forgotPassword: "Forgot password?",
        rememberMe: "Remember me",
        loginSubtitle: "Sign in to your account",
        backToHome: "Back to homepage",
        backToLogin: "Back to login",
        resetPasswordSubtitle: "Reset your password",
        checkEmail: "Check your email",
        resetEmailSent: "We've sent a password reset link to your email address.",
        sendResetLink: "Send reset link",
        forgotPasswordInstructions: "Enter your email address and we will send you a link to reset your password."
      },
      greeting: {
        morning: "Good morning",
        afternoon: "Good afternoon",
        evening: "Good evening"
      },
      subtitle: "Here's what's happening with your cases today.",
      stats: {
        totalClients: "Total Clients",
        activeCases: "Active Cases",
        pendingTasks: "Pending Tasks",
        upcomingDeadlines: "Upcoming Deadlines"
      },
      recentCases: "Recent Cases",
      upcomingTasks: "Upcoming Tasks",
      common: {
        search: "Search...",
        searchPlaceholder: "Search...",
        viewAll: "View all",
        noData: "No data yet",
        noTasks: "No pending tasks",
        status: "Status",
        priority: "Priority",
        allStatuses: "All Statuses",
        allTypes: "All Types",
        back: "Back",
        cancel: "Cancel",
        save: "Save",
        saving: "Saving...",
        create: "Create",
        edit: "Edit",
        delete: "Delete",
        loading: "Loading...",
        dangerZone: "Danger Zone"
      },
      clients: {
        companyName: "Company",
        contactName: "Contact Name",
        contact: "Contact",
        location: "Location",
        email: "Email",
        phone: "Phone",
        address: "Address",
        city: "City",
        postalCode: "Postal Code",
        kvkNumber: "KVK Number",
        notes: "Notes",
        addClient: "Add Client",
        newClient: "New Client",
        clientDetails: "Client Details",
        noClients: "No clients found",
        deleteClient: "Delete Client",
        deleteConfirm: "Are you sure you want to delete this client? This action cannot be undone.",
        statusActive: "Active",
        statusInactive: "Inactive",
        statusPending: "Pending"
      },
      cases: {
        title: "Cases",
        caseTitle: "Case",
        client: "Client",
        description: "Description",
        caseType: "Case Type",
        deadline: "Deadline",
        municipality: "Municipality",
        referenceNumber: "Reference Number",
        addCase: "Add Case",
        newCase: "New Case",
        caseDetails: "Case Details",
        noCases: "No cases found"
      },
      tasks: {
        title: "Tasks",
        addTask: "Add Task",
        newTask: "New Task",
        noTasks: "No tasks found"
      },
      documents: {
        title: "Documents",
        upload: "Upload",
        noDocuments: "No documents found"
      }
    },
    clientPortal: {
      nav: {
        dashboard: "Dashboard",
        cases: "My Cases",
        documents: "Documents",
        requests: "Requests",
        profile: "My Profile"
      },
      auth: {
        registerSubtitle: "Create your client account",
        companyInfo: "Company Information",
        contactInfo: "Contact Information",
        accountInfo: "Account Information",
        confirmPassword: "Confirm Password",
        register: "Create Account",
        creating: "Creating account...",
        termsNote: "By creating an account, you agree to our terms of service and privacy policy.",
        alreadyHaveAccount: "Already have an account?",
        registrationSuccess: "Registration Successful!",
        checkEmail: "Please check your email to verify your account. Once verified, you can log in to your client portal.",
        goToLogin: "Go to Login",
        noAccount: "Don't have an account?",
        registerHere: "Register as a client"
      },
      dashboard: {
        subtitle: "Here's the status of your permit applications.",
        activeCases: "Active Cases",
        completedCases: "Completed",
        documents: "Documents",
        pendingRequests: "Pending Requests",
        recentCases: "My Cases",
        recentRequests: "My Requests",
        noCases: "No cases yet",
        noRequests: "No requests yet",
        quickActions: "Quick Actions"
      },
      actions: {
        newRequest: "New Permit Request",
        newRequestDesc: "Start a new application",
        uploadDocument: "Upload Document",
        uploadDocumentDesc: "Add required files",
        updateProfile: "Update Profile",
        updateProfileDesc: "Edit contact info"
      },
      cases: {
        title: "My Cases",
        subtitle: "Track the progress of your permit applications",
        noResults: "No cases found matching your filters",
        noCases: "You don't have any cases yet",
        submitRequest: "Submit a permit request",
        progress: "Progress",
        currentStatus: "Current status",
        details: "Case Details",
        lastUpdated: "Last Updated",
        tasks: "Tasks",
        documents: "Documents",
        uploadNew: "Upload",
        noDocuments: "No documents yet",
        quickActions: "Actions",
        actionRequired: "Action required from you",
        actionRequiredDesc: "Please check if there are any documents you need to upload or information you need to provide.",
        uploadDocuments: "Upload documents",
        rejected: "Application Rejected",
        rejectedDesc: "Your application has been rejected. Please contact us for more information."
      },
      documents: {
        title: "My Documents",
        subtitle: "Manage and upload documents for your cases",
        upload: "Upload Document",
        uploadTitle: "Upload Document",
        noDocuments: "You haven't uploaded any documents yet",
        uploadFirst: "Upload your first document",
        download: "Download",
        category: "Category",
        relatedCase: "Related Case (optional)",
        notes: "Notes (optional)",
        notesPlaceholder: "Add any notes about this document...",
        dropzone: "Drag and drop or click to select",
        maxSize: "Maximum file size: 10MB",
        uploading: "Uploading..."
      },
      profile: {
        title: "My Profile",
        subtitle: "View and update your company information",
        companyInfo: "Company Information",
        contactInfo: "Contact Information",
        addressInfo: "Address",
        accountStatus: "Account Status",
        memberSince: "Member since"
      },
      requests: {
        title: "My Requests",
        subtitle: "View and submit permit application requests",
        newRequest: "New Request",
        noRequests: "You haven't submitted any requests yet",
        submitFirst: "Submit your first request",
        submittedOn: "Submitted on",
        urgent: "Urgent",
        statusPending: "Pending Review",
        statusReviewing: "Under Review",
        statusApproved: "Approved",
        statusConverted: "Converted to Case",
        statusRejected: "Rejected",
        viewCase: "View Case",
        howItWorks: "How It Works",
        step1Title: "Submit Request",
        step1Desc: "Fill out the form with your permit details",
        step2Title: "We Review",
        step2Desc: "Our team reviews your request within 2 business days",
        step3Title: "Case Created",
        step3Desc: "Once approved, we create a case and start working",
        newRequestTitle: "Submit New Request",
        newRequestSubtitle: "Tell us about the permit you need and we'll get started",
        selectType: "What type of permit do you need?",
        details: "Request Details",
        titleLabel: "Request Title",
        titlePlaceholder: "e.g., New restaurant opening permit",
        descriptionLabel: "Description",
        descriptionPlaceholder: "Please describe your request in detail. Include any relevant information about your business, location, or specific requirements.",
        municipalityLabel: "Municipality (optional)",
        municipalityPlaceholder: "e.g., Amsterdam, Rotterdam",
        urgency: "Urgency",
        normalUrgency: "Normal",
        normalUrgencyDesc: "Standard processing time",
        urgentUrgency: "Urgent",
        urgentUrgencyDesc: "Prioritized review (may incur additional fees)",
        submit: "Submit Request",
        submitting: "Submitting...",
        submitNote: "By submitting, you agree to our terms of service",
        needHelp: "Need Help?",
        needHelpDesc: "Not sure which permit you need? Our team is here to help. Contact us via WhatsApp or email.",
        submitted: "Request Submitted!",
        submittedDesc: "Thank you for your request. Our team will review it and get back to you within 2 business days.",
        viewRequests: "View My Requests",
        backToDashboard: "Back to Dashboard",
        submitNew: "Submit a new request",
        errors: {
          typeRequired: "Please select a request type",
          titleRequired: "Please enter a title",
          descriptionRequired: "Please provide a description"
        }
      }
    }
  },
  nl: {
    navbar: {
      services: "Diensten",
      pricing: "Tarieven",
      faq: "Veelgestelde Vragen",
      about: "Over Ons",
      login: "Login",
      book: "Intake Boeken"
    },
    hero: {
      badge: "Nu nieuwe klanten acceptatie voor 2026",
      headline_start: "Focus op uw Gasten.",
      headline_end: "Wij regelen uw Horecavergunning.",
      subheadline: "Volledige ondersteuning bij exploitatievergunning aanvragen, Bibob toets en financiën voor horecaondernemers. Vaste maandbedragen.",
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
          desc: "Wij regelen uw exploitatievergunning, alcoholvergunning en terrasvergunning. Ook begeleiden wij de complete Bibob toets zodat u snel open kunt."
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
      result_download: "Download Gids",
      back: "Terug",
      restart: "Opnieuw Beginnen"
    },
    footer: {
      tagline: "De Nederlandse horeca versterken met eenvoudige juridische en financiële support.",
      services: "Diensten",
      company: "Bedrijf",
      contact: "Contact",
      rights: "© 2026 HorecaVergunning BV. Alle rechten voorbehouden."
    },
    whatsapp: "App Ons",
    blog: {
      title: "HorecaKennis & Nieuws",
      subtitle: "Blijf op de hoogte van de laatste wetgeving, trends en tips voor de horeca.",
      search_placeholder: "Zoek door onze artikelen...",
      search_button: "Zoeken",
      read_more: "Lees verder",
      load_more: "Laad meer artikelen",
      back_to_overview: "Terug naar overzicht",
      related_articles: "Deze artikelen kunnen we je aanraden:",
      share_article: "Deel dit artikel:",
      about_author: "Over",
      published_on: "Gepubliceerd op",
      read_time: "lezen",
      categories: "Onderwerpen",
      recent_posts: "Meest recente berichten",
      newsletter: {
        title: "Blijf op de hoogte",
        desc: "Ontvang de laatste horeca-updates en wetgeving direct in je mailbox.",
        placeholder: "Uw e-mailadres",
        button: "Inschrijven"
      },
      cta: {
        title: "Horecavergunning nodig?",
        desc: "Regel uw vergunning snel en voordelig. Wij nemen al het papierwerk uit handen.",
        features: ["Vaste lage prijs", "Binnen 24 uur gestart", "100% Tevredenheid"],
        button: "Vraag nu aan"
      }
    },
    faq: {
      title: "Veelgestelde Vragen",
      items: [
        {
          q: "Wanneer heb ik een horecavergunning nodig?",
          a: "U heeft meestal een exploitatievergunning nodig als u een horecabedrijf start, overneemt of wijzigt. Schenkt u alcohol? Dan is ook een alcoholvergunning (Drank- en Horecawet) verplicht."
        },
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
    },
    dashboard: {
      nav: {
        dashboard: "Dashboard",
        clients: "Klanten",
        cases: "Zaken",
        tasks: "Taken",
        documents: "Documenten",
        requests: "Aanvragen",
        users: "Gebruikers",
        settings: "Instellingen",
        activity: "Activiteit",
        profile: "Profiel",
        logout: "Uitloggen",
        admin: "Beheer",
        collapse: "Inklappen"
      },
      auth: {
        login: "Inloggen",
        logout: "Uitloggen",
        email: "E-mail",
        password: "Wachtwoord",
        forgotPassword: "Wachtwoord vergeten?",
        rememberMe: "Onthoud mij",
        loginSubtitle: "Log in op uw account",
        backToHome: "Terug naar homepage",
        backToLogin: "Terug naar inloggen",
        resetPasswordSubtitle: "Wachtwoord opnieuw instellen",
        checkEmail: "Controleer uw e-mail",
        resetEmailSent: "We hebben een link naar uw e-mailadres gestuurd om uw wachtwoord opnieuw in te stellen.",
        sendResetLink: "Verstuur reset link",
        forgotPasswordInstructions: "Voer uw e-mailadres in en wij sturen u een link om uw wachtwoord opnieuw in te stellen."
      },
      greeting: {
        morning: "Goedemorgen",
        afternoon: "Goedemiddag",
        evening: "Goedenavond"
      },
      subtitle: "Dit is wat er vandaag met uw zaken gebeurt.",
      stats: {
        totalClients: "Totaal Klanten",
        activeCases: "Actieve Zaken",
        pendingTasks: "Openstaande Taken",
        upcomingDeadlines: "Aankomende Deadlines"
      },
      recentCases: "Recente Zaken",
      upcomingTasks: "Aankomende Taken",
      common: {
        search: "Zoeken...",
        searchPlaceholder: "Zoeken...",
        viewAll: "Bekijk alles",
        noData: "Nog geen gegevens",
        noTasks: "Geen openstaande taken",
        status: "Status",
        priority: "Prioriteit",
        allStatuses: "Alle Statussen",
        allTypes: "Alle Types",
        back: "Terug",
        cancel: "Annuleren",
        save: "Opslaan",
        saving: "Opslaan...",
        create: "Aanmaken",
        edit: "Bewerken",
        delete: "Verwijderen",
        loading: "Laden...",
        dangerZone: "Gevarenzone"
      },
      clients: {
        companyName: "Bedrijf",
        contactName: "Contactpersoon",
        contact: "Contact",
        location: "Locatie",
        email: "E-mail",
        phone: "Telefoon",
        address: "Adres",
        city: "Plaats",
        postalCode: "Postcode",
        kvkNumber: "KVK Nummer",
        notes: "Notities",
        addClient: "Klant Toevoegen",
        newClient: "Nieuwe Klant",
        clientDetails: "Klantgegevens",
        noClients: "Geen klanten gevonden",
        deleteClient: "Klant Verwijderen",
        deleteConfirm: "Weet u zeker dat u deze klant wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.",
        statusActive: "Actief",
        statusInactive: "Inactief",
        statusPending: "In behandeling"
      },
      cases: {
        title: "Zaken",
        caseTitle: "Zaak",
        client: "Klant",
        description: "Beschrijving",
        caseType: "Zaaktype",
        deadline: "Deadline",
        municipality: "Gemeente",
        referenceNumber: "Referentienummer",
        addCase: "Zaak Toevoegen",
        newCase: "Nieuwe Zaak",
        caseDetails: "Zaakgegevens",
        noCases: "Geen zaken gevonden"
      },
      tasks: {
        title: "Taken",
        addTask: "Taak Toevoegen",
        newTask: "Nieuwe Taak",
        noTasks: "Geen taken gevonden"
      },
      documents: {
        title: "Documenten",
        upload: "Uploaden",
        noDocuments: "Geen documenten gevonden"
      }
    },
    clientPortal: {
      nav: {
        dashboard: "Dashboard",
        cases: "Mijn Zaken",
        documents: "Documenten",
        requests: "Aanvragen",
        profile: "Mijn Profiel"
      },
      auth: {
        registerSubtitle: "Maak uw klantenaccount aan",
        companyInfo: "Bedrijfsgegevens",
        contactInfo: "Contactgegevens",
        accountInfo: "Accountgegevens",
        confirmPassword: "Bevestig Wachtwoord",
        register: "Account Aanmaken",
        creating: "Account aanmaken...",
        termsNote: "Door een account aan te maken, gaat u akkoord met onze algemene voorwaarden en privacyverklaring.",
        alreadyHaveAccount: "Heeft u al een account?",
        registrationSuccess: "Registratie Succesvol!",
        checkEmail: "Controleer uw e-mail om uw account te verifiëren. Na verificatie kunt u inloggen op uw klantenportaal.",
        goToLogin: "Naar Inloggen",
        noAccount: "Heeft u nog geen account?",
        registerHere: "Registreer als klant"
      },
      dashboard: {
        subtitle: "Dit is de status van uw vergunningaanvragen.",
        activeCases: "Actieve Zaken",
        completedCases: "Afgerond",
        documents: "Documenten",
        pendingRequests: "Openstaande Aanvragen",
        recentCases: "Mijn Zaken",
        recentRequests: "Mijn Aanvragen",
        noCases: "Nog geen zaken",
        noRequests: "Nog geen aanvragen",
        quickActions: "Snelle Acties"
      },
      actions: {
        newRequest: "Nieuwe Vergunningaanvraag",
        newRequestDesc: "Start een nieuwe aanvraag",
        uploadDocument: "Document Uploaden",
        uploadDocumentDesc: "Voeg benodigde bestanden toe",
        updateProfile: "Profiel Bijwerken",
        updateProfileDesc: "Bewerk contactgegevens"
      },
      cases: {
        title: "Mijn Zaken",
        subtitle: "Volg de voortgang van uw vergunningaanvragen",
        noResults: "Geen zaken gevonden die aan uw filters voldoen",
        noCases: "U heeft nog geen zaken",
        submitRequest: "Dien een vergunningaanvraag in",
        progress: "Voortgang",
        currentStatus: "Huidige status",
        details: "Zaakgegevens",
        lastUpdated: "Laatst Bijgewerkt",
        tasks: "Taken",
        documents: "Documenten",
        uploadNew: "Uploaden",
        noDocuments: "Nog geen documenten",
        quickActions: "Acties",
        actionRequired: "Actie van u vereist",
        actionRequiredDesc: "Controleer of er documenten zijn die u moet uploaden of informatie die u moet verstrekken.",
        uploadDocuments: "Documenten uploaden",
        rejected: "Aanvraag Afgewezen",
        rejectedDesc: "Uw aanvraag is afgewezen. Neem contact met ons op voor meer informatie."
      },
      documents: {
        title: "Mijn Documenten",
        subtitle: "Beheer en upload documenten voor uw zaken",
        upload: "Document Uploaden",
        uploadTitle: "Document Uploaden",
        noDocuments: "U heeft nog geen documenten geüpload",
        uploadFirst: "Upload uw eerste document",
        download: "Downloaden",
        category: "Categorie",
        relatedCase: "Gerelateerde Zaak (optioneel)",
        notes: "Notities (optioneel)",
        notesPlaceholder: "Voeg notities toe over dit document...",
        dropzone: "Sleep bestanden of klik om te selecteren",
        maxSize: "Maximale bestandsgrootte: 10MB",
        uploading: "Uploaden..."
      },
      profile: {
        title: "Mijn Profiel",
        subtitle: "Bekijk en werk uw bedrijfsgegevens bij",
        companyInfo: "Bedrijfsgegevens",
        contactInfo: "Contactgegevens",
        addressInfo: "Adres",
        accountStatus: "Account Status",
        memberSince: "Lid sinds"
      },
      requests: {
        title: "Mijn Aanvragen",
        subtitle: "Bekijk en dien vergunningaanvragen in",
        newRequest: "Nieuwe Aanvraag",
        noRequests: "U heeft nog geen aanvragen ingediend",
        submitFirst: "Dien uw eerste aanvraag in",
        submittedOn: "Ingediend op",
        urgent: "Spoed",
        statusPending: "Wacht op Beoordeling",
        statusReviewing: "In Behandeling",
        statusApproved: "Goedgekeurd",
        statusConverted: "Omgezet naar Zaak",
        statusRejected: "Afgewezen",
        viewCase: "Bekijk Zaak",
        howItWorks: "Hoe Het Werkt",
        step1Title: "Dien Aanvraag In",
        step1Desc: "Vul het formulier in met uw vergunningdetails",
        step2Title: "Wij Beoordelen",
        step2Desc: "Ons team beoordeelt uw aanvraag binnen 2 werkdagen",
        step3Title: "Zaak Aangemaakt",
        step3Desc: "Na goedkeuring maken we een zaak aan en gaan we aan de slag",
        newRequestTitle: "Nieuwe Aanvraag Indienen",
        newRequestSubtitle: "Vertel ons welke vergunning u nodig heeft en we gaan aan de slag",
        selectType: "Welk type vergunning heeft u nodig?",
        details: "Aanvraagdetails",
        titleLabel: "Titel Aanvraag",
        titlePlaceholder: "bijv. Nieuwe restaurant opening vergunning",
        descriptionLabel: "Omschrijving",
        descriptionPlaceholder: "Beschrijf uw aanvraag in detail. Vermeld relevante informatie over uw bedrijf, locatie of specifieke vereisten.",
        municipalityLabel: "Gemeente (optioneel)",
        municipalityPlaceholder: "bijv. Amsterdam, Rotterdam",
        urgency: "Urgentie",
        normalUrgency: "Normaal",
        normalUrgencyDesc: "Standaard verwerkingstijd",
        urgentUrgency: "Spoed",
        urgentUrgencyDesc: "Prioritaire behandeling (extra kosten mogelijk)",
        submit: "Aanvraag Indienen",
        submitting: "Indienen...",
        submitNote: "Door in te dienen gaat u akkoord met onze algemene voorwaarden",
        needHelp: "Hulp Nodig?",
        needHelpDesc: "Niet zeker welke vergunning u nodig heeft? Ons team helpt u graag. Neem contact op via WhatsApp of e-mail.",
        submitted: "Aanvraag Ingediend!",
        submittedDesc: "Bedankt voor uw aanvraag. Ons team beoordeelt deze en neemt binnen 2 werkdagen contact met u op.",
        viewRequests: "Bekijk Mijn Aanvragen",
        backToDashboard: "Terug naar Dashboard",
        submitNew: "Dien een nieuwe aanvraag in",
        errors: {
          typeRequired: "Selecteer een type aanvraag",
          titleRequired: "Voer een titel in",
          descriptionRequired: "Geef een omschrijving"
        }
      }
    }
  }
};
