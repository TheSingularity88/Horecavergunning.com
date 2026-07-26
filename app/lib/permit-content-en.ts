import type { PermitCopy } from './permit-content';

/**
 * English copy for the permit landing pages.
 *
 * These are FAITHFUL translations of the Dutch entries in permit-content.ts —
 * the same claims, in the same order, at the same strength. No fee, deadline,
 * statutory reference or requirement appears here that is not in the Dutch, and
 * no Dutch hedge has been dropped. Each was checked against the Dutch original
 * by a separate reviewer before landing.
 *
 * Dutch legal terms are kept (exploitatievergunning, Bibob, KvK, leges) because
 * that is what the reader will meet on the gemeente's own forms; a short gloss
 * is given on first use.
 *
 * A slug missing from this map simply gets NO English page — see
 * getPermitCopy(). We would rather have no English page than one that serves
 * Dutch prose under an English URL.
 */
export const PERMIT_CONTENT_EN: Record<string, PermitCopy> = {
  exploitatievergunning: {
    metaTitle: "Exploitatievergunning Amsterdam | Fixed-Fee Application",
    metaDescription: "Need an exploitatievergunning (operating permit) for your Amsterdam venue? We handle the whole application for a fixed fee. See costs, requirements and process.",
    h1: "Applying for an exploitatievergunning (operating permit) in Amsterdam",
    intro: "An exploitatievergunning is compulsory for virtually every hospitality operator in Amsterdam. We arrange the entire application for you — from gathering the right documents to filing with the gemeente (municipality) and the Bibob check (integrity screening) — so that you can concentrate on your business. One fixed price, clear from the outset.",
    what: {
      "title": "What is an exploitatievergunning?",
      "paragraphs": [
        "The exploitatievergunning is the basic permit that allows you to run a hospitality business. Through it, the gemeente Amsterdam assesses, among other things, public order, the personal conduct of the operator (via the Wet Bibob) and whether your premises are suitable for hospitality use under the bestemmingsplan (zoning plan).",
        "Without a valid exploitatievergunning you may not open or continue to run your hospitality business. The permit is issued in the name of the operator and the premises; a new permit therefore has to be applied for when a business is taken over or relocated."
      ]
    },
    when: {
      "title": "When do you need an exploitatievergunning?",
      "paragraphs": [
        "You need an exploitatievergunning as soon as you start or take over a hospitality business that is open to the public: a café, restaurant, lunchroom, snack bar or hotel with a food and drink operation. A (new) application is also required if the legal form of the company changes, if there is a new owner, or if building work alters the layout.",
        "Not sure whether your situation requires a permit? We assess this free of charge during the intake and tell you straight away exactly which permits you need."
      ]
    },
    requirements: [
      "Valid proof of identity for all leidinggevenden (managers)",
      "Recent extract from the Kamer van Koophandel (KvK, Chamber of Commerce)",
      "Lease or purchase agreement for the premises",
      "Floor plan showing the surface area and layout",
      "Completed Bibob questionnaire with supporting evidence",
      "Business financial details (financing, origin of funds)"
    ],
    process: [
      {
        "title": "Free intake",
        "body": "We map out your situation and establish which permits are needed."
      },
      {
        "title": "Gathering documents",
        "body": "You supply the paperwork; we check it for completeness and accuracy."
      },
      {
        "title": "Filing the application",
        "body": "We submit the complete application to the gemeente Amsterdam."
      },
      {
        "title": "Guidance through the Bibob check",
        "body": "We guide you through the integrity screening and answer any additional questions."
      },
      {
        "title": "Decision",
        "body": "You receive the permit; we keep track of the deadlines and the correspondence."
      }
    ],
    kostenIntro: "For handling your exploitatievergunning application in full, we charge a fixed service fee. That way you know exactly where you stand in advance.",
    kostenNote: "Please note: on top of our service fee, the gemeente Amsterdam charges its own leges (municipal fees) for processing the application. These municipal costs are separate from our services.",
    faqs: [
      {
        "q": "How long does it take to apply for an exploitatievergunning?",
        "a": "The gemeente normally has 8 to 13 weeks to reach a decision, depending on the Bibob check. A complete, error-free application speeds this process up considerably — and that is what we take care of."
      },
      {
        "q": "Do I need other permits besides the exploitatievergunning?",
        "a": "Often, yes. Consider an alcoholvergunning (alcohol licence) if you serve alcohol, and a terrasvergunning (terrace permit) if you have a terrace. During the intake we determine the complete package for your business."
      },
      {
        "q": "What does an exploitatievergunning cost?",
        "a": "Our service fee is a fixed price, which you can see at the bottom of this page. The gemeente also charges its own leges. With us you will not face any surprises afterwards."
      }
    ],
  },
  alcoholvergunning: {
    metaTitle: "Apply for an Alcoholvergunning (Alcoholwet) | Fixed Fee",
    metaDescription: "Need an alcoholvergunning under the Alcoholwet? We handle the full application, including the social hygiene requirements. Fixed fee, see costs and conditions.",
    h1: "Apply for an alcoholvergunning (alcohol licence)",
    intro: "Do you want to serve alcohol in your hospitality venue? Then you need an alcoholvergunning (formerly the drank- en horecavergunning) under the Alcoholwet, the Dutch Alcohol Act. We take care of the entire application for a fixed price.",
    what: {
      "title": "What is an alcoholvergunning?",
      "paragraphs": [
        "The alcoholvergunning is the permit under Article 3 of the Alcoholwet that you need in order to serve low-alcohol and high-alcohol drinks for consumption on the premises. The permit sets requirements for the layout of your premises and for the leidinggevenden (the managers named on the permit).",
        "All leidinggevenden must meet the sociale hygiëne (social hygiene) requirements — usually demonstrated with a Verklaring Sociale Hygiëne, a social hygiene certificate — and must be added to the permit."
      ]
    },
    when: {
      "title": "When do you need an alcoholvergunning?",
      "paragraphs": [
        "You need the permit as soon as you serve alcohol in a café, restaurant, hotel or other hospitality venue. The permit must also be amended when a new leidinggevende joins or when you carry out building work on the area where alcohol is served.",
        "You usually apply for the alcoholvergunning at the same time as the exploitatievergunning (operating permit). We align both procedures with each other so that you can open as quickly as possible."
      ]
    },
    requirements: [
      "Verklaring Sociale Hygiëne for all leidinggevenden",
      "Valid proof of identity for all leidinggevenden",
      "Extract from the Kamer van Koophandel (KvK, the Dutch Chamber of Commerce)",
      "Floor plan showing the areas where alcohol is served and their surface areas",
      "Employment contracts or appointment documents for the leidinggevenden"
    ],
    process: [
      {
        "title": "Free intake",
        "body": "We check whether all leidinggevenden meet the requirements."
      },
      {
        "title": "Collecting documents",
        "body": "We collect the Verklaring Sociale Hygiëne certificates and the other documents."
      },
      {
        "title": "Submitting the application",
        "body": "We submit the application to the gemeente (municipality)."
      },
      {
        "title": "Decision",
        "body": "You receive the permit and may serve alcohol."
      }
    ],
    kostenIntro: "For handling your alcoholvergunning from start to finish we charge a fixed service fee. No hourly billing.",
    kostenNote: "The gemeente also charges its own leges (municipal processing fees). These municipal costs are separate from our service fee.",
    faqs: [
      {
        "q": "What is the difference from the old drank- en horecavergunning?",
        "a": "The Drank- en Horecawet was replaced by the Alcoholwet in 2021. The permit is now called an alcoholvergunning, but the essence — a permit to serve alcohol — is the same."
      },
      {
        "q": "Do I need a Verklaring Sociale Hygiëne?",
        "a": "Yes, all leidinggevenden must meet the sociale hygiëne requirements. We help you demonstrate this correctly in the application."
      }
    ],
  },
  terrasvergunning: {
    metaTitle: "Apply for a terrasvergunning in Amsterdam | Fixed fee",
    metaDescription: "Need a terrasvergunning (terrace permit) for your venue? We arrange the application, including terrace plan and conditions. Fixed fee — see costs and process.",
    h1: "Apply for a terrasvergunning (terrace permit)",
    intro: "For many hospitality businesses a terrace is worth its weight in gold, but it requires a separate terrasvergunning from the gemeente (municipality). We take care of the application, including the right drawings and supporting documentation, for a fixed price.",
    what: {
      "title": "What is a terrasvergunning?",
      "paragraphs": [
        "The terrasvergunning gives you permission to operate a terrace at your hospitality business, either on the public highway or on your own land. Among other things, the gemeente assesses the dimensions, the clearance for pedestrians and emergency services, and the appearance of the terrace in relation to its surroundings.",
        "The permit sets out exactly how large your terrace may be, where it may be placed and which opening hours apply."
      ]
    },
    when: {
      "title": "When do you need a terrasvergunning?",
      "paragraphs": [
        "You need a terrasvergunning as soon as you want to place chairs and tables outside for your guests — whether that is on the pavement, on a square or on your own land. Extending or altering an existing terrace also requires a new application.",
        "Terrace rules differ from area to area and from season to season. We know the Amsterdam rules and make sure your application fits them."
      ]
    },
    requirements: [
      "A valid exploitatievergunning (operating permit) for the business",
      "A terrace floor plan with exact dimensions",
      "A site drawing showing the surrounding public space",
      "Photographs of the façade and the desired terrace location"
    ],
    process: [
      {
        "title": "Free intake",
        "body": "We assess whether the terrace you have in mind is feasible."
      },
      {
        "title": "Preparing the drawings",
        "body": "We produce a correct terrace plan and site drawing."
      },
      {
        "title": "Submitting the application",
        "body": "We file the application with the gemeente."
      },
      {
        "title": "Decision",
        "body": "You receive the terrasvergunning, stating the permitted dimensions."
      }
    ],
    kostenIntro: "For handling your terrasvergunning we charge a fixed service fee.",
    kostenNote: "On top of that, the gemeente charges its own leges (permit fees) and possibly precariobelasting (a tax on the use of public space). These costs are separate from our service fee.",
    faqs: [
      {
        "q": "Can I have a terrace all year round?",
        "a": "In many areas a terrace season applies, with specific start and end dates. We will tell you which rules apply at your location."
      },
      {
        "q": "Do I need an exploitatievergunning first?",
        "a": "Yes, a terrasvergunning belongs to a business that holds a valid exploitatievergunning. We can combine both processes for you."
      }
    ],
  },
  bibob: {
    metaTitle: "Bibob screening for hospitality: questionnaire guidance",
    metaDescription: "Bibob screening for your hospitality permit? We guide you through the questionnaire and evidence so your application runs smoothly. Fixed fee — see the process.",
    h1: "Bibob screening for hospitality: professional guidance",
    intro: "For many hospitality entrepreneurs, the Bibob screening (integrity check) is the most nerve-racking part of the permit application. We guide you step by step through completing the Bibob questionnaire correctly and in full, so that delays and rejection are avoided.",
    what: {
      "title": "What is the Wet Bibob (Bibob Act)?",
      "paragraphs": [
        "Bibob stands for Bevordering Integriteitsbeoordelingen door het Openbaar Bestuur (promotion of integrity assessments by public administration). Under the Wet Bibob, the gemeente (municipality) assesses whether a permit might be misused for criminal activity, money laundering for example. The screening focuses on the origin of your funding and the background of the people involved.",
        "A Bibob screening is not an accusation — it is a standard integrity investigation. A well-substantiated, transparent application usually passes the screening without problems."
      ]
    },
    when: {
      "title": "When will you have to deal with Bibob?",
      "paragraphs": [
        "The Bibob screening is part of the application for an exploitatievergunning (operating permit) and also comes into play when you take over an existing business. The gemeente asks you to complete an extensive questionnaire about your company, your funding and the people involved.",
        "Unclear or incomplete answers often lead to follow-up questions or delays. Our guidance prevents that."
      ]
    },
    requirements: [
      "Fully completed Bibob questionnaire form",
      "Proof of the origin of your funding (bank statements, loans)",
      "Agreements with financiers and investors",
      "Lease or purchase agreement for the premises",
      "Substantiation of the company structure and the people involved"
    ],
    process: [
      {
        "title": "Free intake",
        "body": "We go through your situation and determine what supporting documentation is needed."
      },
      {
        "title": "Completing the questionnaire",
        "body": "We help you fill in the Bibob questionnaire correctly and in full."
      },
      {
        "title": "Gathering supporting evidence",
        "body": "We organise the supporting documents on your funding and its origin."
      },
      {
        "title": "Support with queries",
        "body": "We answer any follow-up questions from the gemeente on your behalf."
      }
    ],
    kostenIntro: "For our Bibob guidance we charge a fixed service fee.",
    kostenNote: "The Bibob screening itself is carried out by the gemeente. Our fee covers the professional guidance and the substantiation of your application.",
    faqs: [
      {
        "q": "Does a Bibob screening mean I am under suspicion?",
        "a": "No. The Bibob screening is a standard integrity investigation that comes with almost every hospitality permit. It is not an accusation."
      },
      {
        "q": "What happens if I fill in the questionnaire incorrectly?",
        "a": "Incomplete or unclear answers lead to follow-up questions, delays or, in the worst case, rejection. Our guidance prevents mistakes."
      }
    ],
  },
  overname: {
    metaTitle: "Taking over a hospitality venue: arranging the permits",
    metaDescription: "Taking over a hospitality venue? Existing permits do not transfer automatically — you must apply again. We handle the full permit process at a fixed fee.",
    h1: "Taking over a hospitality venue: permits arranged",
    intro: "When you take over a hospitality business, the existing permits do not automatically transfer with it. As the new exploitant (operator) you have to apply again for the exploitatievergunning (operating permit) and the alcoholvergunning (alcohol licence). We guide you through the whole takeover on the permit side for a fixed fee.",
    what: {
      "title": "What does a takeover mean for your permits?",
      "paragraphs": [
        "An exploitatievergunning is issued in the name of the exploitant and of the premises. When ownership changes hands, the old permit lapses and the new entrepreneur has to apply for a permit of their own — including a new Bibob-toets (integrity screening).",
        "It is sensible to set the permit application in motion before the takeover actually goes through, so that you can stay open without interruption."
      ]
    },
    when: {
      "title": "When does this apply?",
      "paragraphs": [
        "With every takeover of an existing hospitality business: whether you are taking over a café, a restaurant or a snack bar. A new application may also be needed when a partner joins or leaves the business.",
        "During the intake we assess exactly which permits have to be applied for again, and we plan the process around your takeover date."
      ]
    },
    requirements: [
      "Purchase or takeover agreement for the business",
      "Extract from the Kamer van Koophandel (KvK — Dutch Chamber of Commerce) for the new business",
      "Bibob questionnaire with supporting documentation",
      "Lease agreement or proof of ownership of the premises",
      "Identity documents of the new managers (leidinggevenden)"
    ],
    process: [
      {
        "title": "Free intake",
        "body": "We establish which permits have to be applied for again for your takeover."
      },
      {
        "title": "Gathering documents",
        "body": "We collect the paperwork for the new applications."
      },
      {
        "title": "Submitting the applications",
        "body": "We file the exploitatievergunning and alcoholvergunning in good time."
      },
      {
        "title": "Bibob & decision",
        "body": "We guide you through the Bibob screening until the permit is in place."
      }
    ],
    kostenIntro: "For the complete takeover process on the permit side we charge a fixed service fee.",
    kostenNote: "The gemeente (municipality) charges its own leges (municipal fees) per application. These costs are separate from our service fee.",
    faqs: [
      {
        "q": "Can I take over the previous owner's permit?",
        "a": "No. An exploitatievergunning is tied to the person it is issued to and lapses when ownership changes hands. As the new exploitant you apply for a permit of your own."
      },
      {
        "q": "Do I have to go through the Bibob screening again?",
        "a": "Yes — as the new exploitant you go through a Bibob screening of your own. We guide you through it so that it runs smoothly."
      }
    ],
  },
  verbouwing: {
    metaTitle: "Hospitality renovation: gebruiksvergunning & notifications",
    metaDescription: "Renovating your hospitality venue? We arrange the permits and notifications for renovation and fire-safe use. Fixed price — see the process and requirements.",
    h1: "Renovation and gebruiksvergunning (building use permit) for hospitality venues",
    intro: "Are you planning to renovate your hospitality business or lay it out differently? If so, you will be dealing with permits and notifications relating to (fire-safe) use, and sometimes an omgevingsvergunning (environment and planning permit). We handle the permit process around your renovation.",
    what: {
      "title": "Which permits are involved in a renovation?",
      "paragraphs": [
        "Depending on the nature of the renovation, you may need an omgevingsvergunning, a notification or permit for fire-safe use, and sometimes an amendment to your exploitatievergunning (operating permit) if the layout changes.",
        "We assess which procedures apply to your renovation and make sure your venue can reopen safely and with the right permits in place."
      ]
    },
    when: {
      "title": "When do you need this?",
      "paragraphs": [
        "When you change the layout, increase the number of visitors, make structural alterations, or add something like a kitchen or an extraction system. A changed floor plan can also have consequences for your existing permits.",
        "Not sure whether your renovation requires a permit? We assess this during the intake."
      ]
    },
    requirements: [
      "Existing and new floor plan of the premises",
      "Description of the renovation and the installations",
      "Details of the maximum occupancy and escape routes",
      "A valid exploitatievergunning for the venue"
    ],
    process: [
      {
        "title": "Free intake",
        "body": "We determine which permits and notifications are required."
      },
      {
        "title": "Documents and drawings",
        "body": "We prepare the necessary drawings and supporting documentation."
      },
      {
        "title": "Submitting the application or notification",
        "body": "We submit the correct applications and notifications."
      },
      {
        "title": "Decision",
        "body": "You can reopen safely and with the right permits in place."
      }
    ],
    kostenIntro: "For arranging the permits around your renovation, we charge a fixed service fee.",
    kostenNote: "Depending on the procedure, the gemeente (municipality) charges its own fees (leges). Construction costs and third-party costs are separate from our service fee.",
    faqs: [
      {
        "q": "Do I always need a permit for a renovation?",
        "a": "Not always — it depends on the nature and scale of the work. During the intake we assess which permits or notifications apply to you."
      },
      {
        "q": "Does my exploitatievergunning need to be amended?",
        "a": "If the layout or the number of visitors changes, an amendment may be required. We arrange this at the same time as the renovation procedures."
      }
    ],
  },
};
