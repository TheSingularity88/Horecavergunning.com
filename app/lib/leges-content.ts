/**
 * Municipal fees (leges) charged by Gemeente Amsterdam.
 *
 * SOURCE OF EVERY FIGURE BELOW:
 * Tarieventabel behorende bij de Algemene legesverordening Amsterdam 2026,
 * adopted 13 November 2025, published as Gemeenteblad 2025 nr. 500847. The
 * verordening states "De datum van ingang van heffing is 1 januari 2026"
 * (art. 13 lid 2). Figures were read from the official publication and
 * independently re-checked against the consolidated text on
 * lokaleregelgeving.overheid.nl, and cross-checked arithmetically against the
 * 2025 tariffs times the 3.69% indexation the verordening itself states.
 *
 * WHY THE SHAPE:
 * `sourceUrl` and `verifiedOn` are required fields, so a figure cannot reach
 * the site without provenance and a date. Dutch leges are revised every
 * 1 January, so an unsourced or undated amount is a liability, not an asset.
 *
 * `amountEur: null` means the gemeente publishes no single figure. That is a
 * real and useful answer — notably for Bibob, which has NO separate leges, a
 * fact worth stating plainly because people assume it costs extra.
 *
 * DELIBERATELY NOT PUBLISHED HERE:
 * - The bouwactiviteit fee for a verbouwing. It is a six-bracket percentage of
 *   construction cost with a €250 minimum, so quoting "€250" as if it were the
 *   price would mislead almost every reader.
 * - The conceptverzoek fee: the figure could not be tied cleanly to its article
 *   during verification, so it is left out rather than published on a shaky
 *   citation.
 *
 * MAINTENANCE: re-check each January, then bump `tariffYear` and `verifiedOn`.
 * LegesTable surfaces the OLDEST verifiedOn of its rows, so a stale row shows.
 */

const VERORDENING =
  'https://zoek.officielebekendmakingen.nl/gmb-2025-500847.pdf';
const CONSOLIDATED = 'https://lokaleregelgeving.overheid.nl/CVDR747167';
const CHECKED = '2026-07-26';
const YEAR = '2026';

export interface LegesEntry {
  /** What the fee is for, in Dutch. */
  item: string;
  /** Same, in English. */
  itemEn: string;
  /** null when the gemeente publishes no single figure. */
  amountEur: number | null;
  /** The tariff period the amount belongs to, e.g. "2026". */
  tariffYear: string;
  /** The page the figure was read on. Official sources only. */
  sourceUrl: string;
  /** ISO date the figure was last confirmed at that URL. */
  verifiedOn: string;
  note?: string;
  noteEn?: string;
}

const base = { tariffYear: YEAR, verifiedOn: CHECKED, sourceUrl: VERORDENING };

export const LEGES_BY_PERMIT: Record<string, LegesEntry[]> = {
  exploitatievergunning: [
    {
      ...base,
      item: 'Nieuwe exploitatievergunning horecabedrijf — zonder terras',
      itemEn: 'New operating permit for a hospitality business — without a terrace',
      amountEur: 3010.8,
    },
    {
      ...base,
      item: 'Nieuwe exploitatievergunning horecabedrijf — met terras',
      itemEn: 'New operating permit for a hospitality business — with a terrace',
      amountEur: 3621.5,
      note: 'Een terras zit in de exploitatievergunning; er is geen losse terrasvergunning bij een nieuwe aanvraag.',
      noteEn:
        'A terrace is part of the operating permit; there is no separate terrace permit for a new application.',
    },
    {
      ...base,
      item: 'Wijzigen of toevoegen van één leidinggevende',
      itemEn: 'Changing or adding one manager',
      amountEur: 404.8,
      note: 'Iedere volgende leidinggevende in dezelfde aanvraag: € 41,70.',
      noteEn: 'Each additional manager in the same application: € 41.70.',
    },
    {
      ...base,
      item: 'Overige wijzigingen in de exploitatievergunning',
      itemEn: 'Other amendments to the operating permit',
      amountEur: 483.4,
    },
    {
      ...base,
      item: 'Verlenging exploitatievergunning — zonder terras',
      itemEn: 'Renewal of the operating permit — without a terrace',
      amountEur: 1909,
      note: 'Met terras: € 2.404,20.',
      noteEn: 'With a terrace: € 2,404.20.',
    },
  ],

  alcoholvergunning: [
    {
      ...base,
      item: 'Alcoholvergunning (artikel 3 Alcoholwet) — nieuwe aanvraag',
      itemEn: 'Alcohol licence (article 3 Alcoholwet) — new application',
      amountEur: 1882.1,
      note: 'Dit bedrag komt bovenop de leges voor de exploitatievergunning; het zijn twee losse aanvragen.',
      noteEn:
        'This is on top of the operating permit fee; they are two separate applications.',
    },
    {
      ...base,
      item: 'Wijzigen of toevoegen van één leidinggevende',
      itemEn: 'Changing or adding one manager',
      amountEur: 404.8,
      note: 'Staat een leidinggevende op zowel de exploitatie- als de alcoholvergunning, dan betaalt u dit bedrag twee keer.',
      noteEn:
        'If a manager is named on both the operating permit and the alcohol licence, this fee is payable twice.',
    },
    {
      ...base,
      item: 'Overige wijzigingen in de alcoholvergunning',
      itemEn: 'Other amendments to the alcohol licence',
      amountEur: 483.4,
    },
    {
      ...base,
      item: 'Ontheffing artikel 35 Alcoholwet (tijdelijk schenken, bijvoorbeeld bij een evenement)',
      itemEn: 'Article 35 exemption (temporary licence, e.g. for an event)',
      amountEur: 360,
    },
  ],

  terrasvergunning: [
    {
      ...base,
      sourceUrl: CONSOLIDATED,
      item: 'Aanpassing van een terras bij een bestaande exploitatievergunning',
      itemEn: 'Adjusting a terrace on an existing operating permit',
      amountEur: 681.3,
      note: 'Uitgezonderd een verkleining van het terrasoppervlak binnen de vergunde contouren.',
      noteEn:
        'Excluding a reduction of the terrace area within the already permitted outline.',
    },
    {
      ...base,
      item: 'Nieuw terras: via de exploitatievergunning "met terras"',
      itemEn: 'A new terrace: via the operating permit "with terrace"',
      amountEur: 3621.5,
      note: 'Amsterdam kent geen losse terrasvergunning bij een nieuwe aanvraag — het terras zit in de exploitatievergunning. Het verschil met "zonder terras" (€ 3.010,80) is € 610,70.',
      noteEn:
        'Amsterdam has no separate terrace permit for a new application — the terrace is part of the operating permit. The difference from "without terrace" (€ 3,010.80) is € 610.70.',
    },
    {
      ...base,
      item: 'Schenkt u alcohol op het terras: overige wijziging alcoholvergunning',
      itemEn: 'If you serve alcohol on the terrace: other amendment to the alcohol licence',
      amountEur: 483.4,
    },
  ],

  bibob: [
    {
      ...base,
      item: 'Bibob-onderzoek',
      itemEn: 'Bibob screening',
      amountEur: null,
      note: 'De gemeente Amsterdam rekent géén aparte leges voor de Bibob-toets. Het onderzoek hoort bij de vergunningaanvraag, waarvan u de leges al betaalt.',
      noteEn:
        'Gemeente Amsterdam charges no separate fee for the Bibob screening. It forms part of the permit application whose fee you already pay.',
    },
    {
      ...base,
      item: 'Exploitatievergunning waar de Bibob-toets bij hoort — zonder terras',
      itemEn: 'The operating permit the Bibob screening belongs to — without a terrace',
      amountEur: 3010.8,
    },
  ],

  overname: [
    {
      ...base,
      item: 'Nieuwe exploitatievergunning op naam van de nieuwe exploitant — zonder terras',
      itemEn: 'New operating permit in the new operator’s name — without a terrace',
      amountEur: 3010.8,
      note: 'Bestaande vergunningen gaan niet mee over; met terras is het tarief € 3.621,50.',
      noteEn:
        'Existing permits do not transfer; with a terrace the fee is € 3,621.50.',
    },
    {
      ...base,
      item: 'Nieuwe alcoholvergunning op naam van de nieuwe exploitant',
      itemEn: 'New alcohol licence in the new operator’s name',
      amountEur: 1882.1,
    },
    {
      ...base,
      item: 'Alleen de samenwerkingsvorm wijzigt (VOF, CV of maatschap) en er blijft minimaal één persoon in',
      itemEn:
        'Only the partnership form changes (VOF, CV or maatschap) and at least one person stays on',
      amountEur: 570.3,
      note: 'Nieuw tarief per 1 januari 2026, per vergunning. Voorheen betaalde u in dit geval de volledige vergunningprijs.',
      noteEn:
        'New tariff from 1 January 2026, per permit. Previously this situation cost the full permit fee.',
    },
  ],

  verbouwing: [
    {
      ...base,
      sourceUrl: CONSOLIDATED,
      item: 'Omgevingsvergunning — binnenplanse omgevingsplanactiviteit (ruimtelijk deel)',
      itemEn: 'Environment permit — planning activity within the plan (spatial part)',
      amountEur: 565.5,
    },
    {
      ...base,
      sourceUrl: CONSOLIDATED,
      item: 'Omgevingsvergunning — bouwactiviteit (bouwtechnisch deel)',
      itemEn: 'Environment permit — building activity (technical part)',
      amountEur: null,
      note: 'Dit tarief is een percentage van de bouwkosten volgens een staffel, met een minimum van € 250. Wij noemen hier bewust geen vast bedrag: bij een verbouwing van enige omvang loopt dit al snel in de duizenden euro’s.',
      noteEn:
        'This fee is a percentage of the construction cost on a sliding scale, with a € 250 minimum. We deliberately quote no flat figure: for a renovation of any size it quickly runs into thousands of euros.',
    },
    {
      ...base,
      sourceUrl: CONSOLIDATED,
      item: 'Gebruiksvergunning brandveilig gebruik',
      itemEn: 'Fire-safety use permit',
      amountEur: null,
      note: 'Hiervoor kent de legestabel geen apart tarief; brandveilig gebruik loopt mee in de omgevingsvergunning.',
      noteEn:
        'The fee table lists no separate tariff for this; fire-safe use is handled within the environment permit.',
    },
  ],
};

export function getLeges(slug: string): LegesEntry[] {
  return LEGES_BY_PERMIT[slug] ?? [];
}
