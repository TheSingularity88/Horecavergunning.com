import { ExternalLink, Info } from 'lucide-react';
import type { Language } from '@/app/lib/translations';
import type { LegesEntry } from '@/app/lib/leges-content';

/**
 * Municipal fee (leges) table.
 *
 * This is the most citable thing on a permit page: a concrete amount, attributed
 * to the gemeente, with the tariff year and the date we checked it. Answer
 * engines quote specifics, and until now these pages carried none — they said
 * "the gemeente charges its own leges" without ever saying how much.
 *
 * Every row carries its own source link on purpose. A published fee with no
 * provenance is worth less than no fee at all, because a reader cannot tell
 * whether it is current, and municipal leges change every 1 January.
 */
export function LegesTable({
  entries,
  locale,
}: {
  entries: LegesEntry[];
  locale: Language;
}) {
  const en = locale === 'en';
  const euro = (v: number) =>
    new Intl.NumberFormat(en ? 'en-GB' : 'nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(v);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(en ? 'en-GB' : 'nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  // Show the oldest verification date — the table is only as fresh as its
  // stalest row, and claiming otherwise would overstate our diligence.
  const oldestCheck = entries
    .map((e) => e.verifiedOn)
    .sort()[0];

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <caption className="sr-only">
            {en
              ? 'Municipal fees charged by Gemeente Amsterdam'
              : 'Leges die de gemeente Amsterdam in rekening brengt'}
          </caption>
          <thead className="bg-slate-50 text-left">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold text-slate-900">
                {en ? 'What the gemeente charges for' : 'Waarvoor de gemeente leges rekent'}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                {en ? 'Amount' : 'Bedrag'}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                {en ? 'Tariff year' : 'Tariefjaar'}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-slate-900">
                {en ? 'Source' : 'Bron'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((e) => (
              <tr key={e.item + e.tariffYear} className="align-top">
                <td className="px-4 py-3 text-slate-900">
                  {en ? e.itemEn : e.item}
                  {e.note && (
                    <span className="block text-slate-500 mt-0.5">
                      {en ? e.noteEn ?? e.note : e.note}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                  {e.amountEur === null
                    ? en
                      ? 'Not published'
                      : 'Niet gepubliceerd'
                    : euro(e.amountEur)}
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{e.tariffYear}</td>
                <td className="px-4 py-3">
                  <a
                    href={e.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 underline"
                  >
                    {en ? 'Gemeente Amsterdam' : 'Gemeente Amsterdam'}
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 flex items-start gap-2 text-sm text-slate-500">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          {en ? (
            <>
              These are the gemeente&apos;s own fees, separate from our service fee, and are
              payable to Gemeente Amsterdam. Leges are revised on 1 January each year.
              Last checked by us on {formatDate(oldestCheck)} — always verify the current
              amount with the gemeente before you budget.
            </>
          ) : (
            <>
              Dit zijn de leges van de gemeente zelf, los van ons servicetarief, en u betaalt
              ze aan de gemeente Amsterdam. Leges worden elk jaar op 1 januari herzien.
              Door ons gecontroleerd op {formatDate(oldestCheck)} — controleer het actuele
              bedrag altijd bij de gemeente voordat u begroot.
            </>
          )}
        </span>
      </p>
    </div>
  );
}
