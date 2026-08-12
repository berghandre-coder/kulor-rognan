# MVP-plan for pilotkunde – kjøp + leie, leverandøreid kode

_Foreløpig plan · Sist oppdatert: 2026-08-12_

Kulør Rognan ønsker å gå videre fra klikkbar demo (se [nettbutikk-demo-status.md](nettbutikk-demo-status.md)) til en reell pilot de kan teste i butikken. Nytt i denne fasen: kunden skal **kjøpe etablering og leie løsningen løpende**, mens **du (leverandør) beholder eierskap til kildekoden** for å kunne videreselge den til andre fargehandlere/butikker senere. Dette er en forretningsmodell-endring som påvirker arkitektur, avtaleverk og prising – ikke bare teknisk leveranse. Denne planen dekker det som er nytt; teknisk detaljplan for selve nettbutikken (database, betaling, klikk-og-hent-flyt) ligger fortsatt i [nettbutikk-utviklingsplan.md](nettbutikk-utviklingsplan.md).

## 1. Hva forretningsmodellen krever av arkitekturen

Fordi koden skal gjenbrukes til flere kunder senere, bør MVP-en bygges **hvitmerke-klar** allerede nå, selv om den kun driftes for én kunde i piloten:

- **Ingen hardkodede kundespesifikke verdier i kildekoden.** Butikknavn, logo, farger, adresse, åpningstider, produktkatalog og fargeutvalg skal styres via konfigurasjon/database per kunde – ikke skrives inn i komponenter (slik dagens demo dels gjør, med "Kulør Rognan" flere steder).
- **Én kjerne-kodebase, flere driftede instanser.** Anbefalt modell for MVP-fasen: **single-tenant per kunde** (egen database og egen driftet instans per butikk), bygget fra samme private kjernerepo. Full delt multi-tenant-arkitektur (én backend for alle kunder samtidig) er **for tidlig** å bygge for én pilotkunde – det er betydelig mer kompleksitet (tenant-isolasjon, tilgangsstyring på tvers av kunder) som ikke gir verdi før dere faktisk har flere betalende kunder. Anbefalingen er å designe datamodellen slik at en fremtidig migrering til multi-tenant er rimelig (f.eks. konsekvent bruk av en `store_id`/tenant-nøkkel i databasen fra dag én), uten å bygge selve multi-tenant-infrastrukturen nå.
- **Repo-strategi:** Kildekoden bør ligge i et **privat repo som du eier** (ikke kundens GitHub-organisasjon). Kundens driftsmiljø (Vercel/Netlify-prosjekt, domene) kan peke til en deploy fra dette repoet, men kunden får ikke tilgang til selve kildekoden – kun til den ferdige tjenesten. Dette er en ren driftsavtale, ikke en kode-leveranse.

## 2. Hva kunden faktisk får – kjøp + leie

| | Innhold |
|---|---|
| **Kjøper (engangs, etablering)** | Oppsett, konfigurering av butikkens katalog/farger/design, opplæring, publisering |
| **Leier (løpende, abonnement)** | Hosting, drift, backup, sikkerhetsoppdateringer, support, mindre innholdsendringer, bruksrett til plattformen |
| **Eier IKKE** | Kildekoden, retten til å videreutvikle/videreselge løsningen selv, retten til å ta med koden til en annen leverandør ved oppsigelse |

Dette må stå eksplisitt i avtalen (se pkt. 4) – uten det vil kunden naturlig anta at "kjøpe" betyr å eie koden, siden det er det ordet vanligvis betyr for et vanlig nettsidekjøp.

## 3. Teknisk MVP-omfang for piloten

Gjenbruker arkitekturen fra [nettbutikk-utviklingsplan.md](nettbutikk-utviklingsplan.md) (Next.js + Supabase + Vercel + Vipps), med disse presiseringene for hvitmerke-klarhet:

- **Konfigurasjonslag** per butikk: navn, logo, primærfarger, adresse, åpningstider, kontaktinfo, hentested – hentes fra database/config, ikke fra kildekoden
- **Katalog og fargeutvalg** administreres av butikken selv i adminpanelet (bygger videre på admin-demoens produktskjema), ikke av utvikleren
- Samme MVP-avgrensning som tidligere plan: klikk-og-hent, Vipps-betaling, e-postvarsling, enkelt adminpanel, 50–75 produkter, ingen kortbetaling/SMS/fullt fargeregister i første versjon

**Fra demo til pilot – det som faktisk må bygges nå** (demoen i dag er ren frontend uten dette):
1. Ekte database (Supabase) og datamodell med `store_id` forberedt for fremtidig flerkunde-bruk
2. Ekte Vipps-betalingsintegrasjon med webhook-bekreftelse
3. E-postutsending (bekreftelse + klar-til-henting)
4. Innlogging for butikkens adminbrukere
5. Migrering av demoens frontend-komponenter til å hente data fra database i stedet for statiske `data.js`-filer

## 4. Avtaleverk som må på plass før pilotstart

- **Lisens-/tjenesteavtale (SaaS-modell)**, ikke en vanlig utviklingskontrakt med kode-overlevering – må tydelig regulere bruksrett vs. eierskap, oppsigelsestid og hva som skjer med kundens *data* (ikke koden) ved oppsigelse (dataportabilitet er rimelig å love, kildekode er det ikke)
- **Databehandleravtale (DPA)** for kundedata (navn, e-post, telefon, ordrehistorikk)
- **SLA/driftsavtale**: oppetid, support-responstid, hva som inngår i den månedlige leien vs. faktureres separat (jf. tidligere avklart: SMS-forbruk, større produktimport, nettbetaling utover Vipps)
- Vurder om det trengs en enkel **immaterialrett-klausul** som eksplisitt sier at kildekode, design-templates og plattformarkitektur forblir din eiendom

Dette er ikke teknisk arbeid, men bør på plass parallelt med utviklingen – ikke etter at piloten er live.

## 5. Kommersiell modell

Bygger videre på prisnivået dere allerede har landet på:

- **Referansekunde/pilot (Kulør Rognan):** 34 900 kr etablering + 990 kr/mnd, mot at dere får bruke løsningen som demo/case overfor fremtidige kunder – bør skrives inn i avtalen som en eksplisitt gjenytelse
- **Ordinær pris for neste kunder:** 44 900 kr + 1 290 kr/mnd blir mer lønnsomt per kunde nummer to og utover, siden plattformen da allerede er bygget – etableringskostnaden per ny kunde bør i praksis gå ned over tid (mindre "bygge nytt", mer "konfigurere og sette opp"), noe som styrker forretningscaset for å eie og gjenbruke koden
- Hold **produktregistrering utover avtalt antall** og **nettbetaling/kort** utenfor fastprisen, som allerede planlagt

## 6. Suksesskriterier for piloten

Avklar med kunden på forhånd hva som avgjør om piloten regnes som vellykket, f.eks.:

- Et gitt antall reelle ordre gjennomført klikk-og-hent i løpet av en definert testperiode (f.eks. 4–8 uker)
- Butikkens ansatte kan drifte ordreflyten i admin uten løpende bistand fra deg
- Ingen kritiske feil i betalingsflyten
- Kundetilbakemelding på om løsningen faktisk sparer tid i butikken

## 7. Risikoer spesifikt til denne modellen

- **Forventningsavklaring om eierskap** er den største risikoen – uten tydelig avtale kan kunden anta de kjøper koden. Avklares skriftlig før piloten starter, ikke underveis.
- **Avhengighet til deg som leverandør**: siden koden ikke overleveres, er kunden avhengig av din fortsatte drift. Vurder hva som skjer ved f.eks. sykdom/kapasitetsbrist – en enkel driftskontinuitetsplan styrker tilliten i salget.
- **Konkurranseklausul/eksklusivitet**: avklar om kunden forventer at løsningen skal være unik for dem i deres marked (f.eks. ikke selges til en konkurrerende fargehandel i samme by), siden dette direkte påvirker videresalgsstrategien din.
- Samme tekniske/juridiske risikoer som i [nettbutikk-utviklingsplan.md](nettbutikk-utviklingsplan.md) punkt 9 (fargedata, Vipps-oppsett, driftsrutine) gjelder fortsatt.

## Neste steg

1. Avklar punkt 4 (avtaleverk) og punkt 7 (eierskap/eksklusivitet) med kunden før utvikling starter
2. Sett opp privat kjernerepo adskilt fra dette demo-repoet, med konfigurasjonslag for hvitmerking
3. Bygg MVP-omfanget i punkt 3 mot Supabase + ekte Vipps-integrasjon
4. Definer testperiode og suksesskriterier (punkt 6) skriftlig med kunden før pilotstart
