-- ---------------------------------------------------------------------------
-- 009  Seed the per-permit required-documents templates.
--
-- Why: required_documents was completely empty, so snapshotChecklist() (see
-- app/lib/actions/requests.ts) copied nothing into case_documents on approval.
-- Every case therefore had a zero-row checklist, and the client portal told
-- customers "please upload your documents" without ever being able to say
-- which. Seeding these templates is what makes the checklist real.
--
-- Source: the per-permit requirement lists already published on the public
-- permit pages (app/lib/permit-content.ts `requirements`). Using the owner's
-- own published copy rather than inventing a legal list — these are editable
-- at /dashboard/admin/permit-types/[id] and should be reviewed against the
-- current Amsterdam requirements.
--
-- Idempotent: a single set-based INSERT whose NOT EXISTS is evaluated against
-- the pre-statement snapshot, so permit types the owner has already configured
-- are skipped wholesale and re-running never duplicates.
-- ---------------------------------------------------------------------------

insert into public.required_documents
  (permit_type_id, name_nl, name_en, is_required, sort_order)
select
  pt.id,
  x.name_nl,
  x.name_en,
  true,
  x.sort_order
from (
  values
    -- (permit slug, sort order, NL name, EN name)
    ('exploitatievergunning', 1, 'Geldig identiteitsbewijs van alle leidinggevenden', 'Valid ID for every manager'),
    ('exploitatievergunning', 2, 'Recent uittreksel Kamer van Koophandel (KvK)', 'Recent Chamber of Commerce (KvK) extract'),
    ('exploitatievergunning', 3, 'Huur- of koopovereenkomst van het pand', 'Lease or purchase agreement for the premises'),
    ('exploitatievergunning', 4, 'Plattegrond met oppervlakte en indeling', 'Floor plan with surface areas and layout'),
    ('exploitatievergunning', 5, 'Ingevuld Bibob-vragenformulier met onderbouwing', 'Completed Bibob questionnaire with supporting evidence'),
    ('exploitatievergunning', 6, 'Zakelijke financiële gegevens (financiering, herkomst middelen)', 'Business financials (funding, origin of funds)'),

    ('alcoholvergunning', 1, 'Verklaring Sociale Hygiëne van alle leidinggevenden', 'Social Hygiene certificate for every manager'),
    ('alcoholvergunning', 2, 'Geldig identiteitsbewijs van alle leidinggevenden', 'Valid ID for every manager'),
    ('alcoholvergunning', 3, 'Uittreksel Kamer van Koophandel (KvK)', 'Chamber of Commerce (KvK) extract'),
    ('alcoholvergunning', 4, 'Plattegrond met de schenkruimtes en oppervlakten', 'Floor plan showing serving areas and surface areas'),
    ('alcoholvergunning', 5, 'Arbeidsovereenkomsten of aanstelling van leidinggevenden', 'Employment contracts or appointment of managers'),

    ('terrasvergunning', 1, 'Geldige exploitatievergunning voor de zaak', 'Valid operating permit for the venue'),
    ('terrasvergunning', 2, 'Terrasplattegrond met exacte afmetingen', 'Terrace plan with exact dimensions'),
    ('terrasvergunning', 3, 'Situatietekening met de openbare ruimte eromheen', 'Site drawing showing the surrounding public space'),
    ('terrasvergunning', 4, 'Foto''s van de gevel en de gewenste terraslocatie', 'Photos of the facade and the intended terrace location'),

    ('bibob', 1, 'Volledig ingevuld Bibob-vragenformulier', 'Fully completed Bibob questionnaire'),
    ('bibob', 2, 'Bewijs van herkomst van financiering (bankafschriften, leningen)', 'Proof of the origin of funding (bank statements, loans)'),
    ('bibob', 3, 'Overeenkomsten met financiers en investeerders', 'Agreements with financiers and investors'),
    ('bibob', 4, 'Huur- of koopovereenkomst van het pand', 'Lease or purchase agreement for the premises'),
    ('bibob', 5, 'Onderbouwing van de bedrijfsstructuur en betrokkenen', 'Explanation of the company structure and people involved'),

    ('overname', 1, 'Koop- of overnameovereenkomst van de onderneming', 'Purchase or transfer agreement for the business'),
    ('overname', 2, 'Uittreksel Kamer van Koophandel (KvK) van de nieuwe onderneming', 'Chamber of Commerce (KvK) extract for the new company'),
    ('overname', 3, 'Bibob-vragenformulier met onderbouwing', 'Bibob questionnaire with supporting evidence'),
    ('overname', 4, 'Huurovereenkomst of eigendomsbewijs van het pand', 'Lease agreement or proof of ownership of the premises'),
    ('overname', 5, 'Identiteitsbewijzen van de nieuwe leidinggevenden', 'IDs of the new managers'),

    ('verbouwing', 1, 'Bestaande en nieuwe plattegrond van het pand', 'Existing and new floor plans of the premises'),
    ('verbouwing', 2, 'Beschrijving van de verbouwing en installaties', 'Description of the renovation and installations'),
    ('verbouwing', 3, 'Gegevens over maximale bezetting en vluchtroutes', 'Details of maximum occupancy and escape routes'),
    ('verbouwing', 4, 'Geldige exploitatievergunning van de zaak', 'Valid operating permit for the venue')
) as x(slug, sort_order, name_nl, name_en)
join public.permit_types pt on pt.slug = x.slug
where not exists (
  select 1
  from public.required_documents rd
  where rd.permit_type_id = pt.id
);
