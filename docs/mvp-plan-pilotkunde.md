# MVP-plan for pilotkunde – Kulør Rognan

_Foreløpig plan · Sist oppdatert: 2026-08-12 · Erstatter tidligere versjon (se Git-historikk for opprinnelig utgave)_

Kulør Rognan går videre fra klikkbar demo (se [nettbutikk-demo-status.md](nettbutikk-demo-status.md)) til en reell pilot de kan teste i butikken. Kunden betaler for **etablering/implementering** pluss et løpende **abonnement**, mens **AEMA beholder fullt eierskap** til kildekode og plattformarkitektur, med rett til å videreutvikle og videreselge løsningen til andre kunder. Dette dokumentet er styrende for de kommersielle og arkitektoniske beslutningene som er tatt for piloten. Teknisk detaljplan for selve nettbutikk-funksjonaliteten (databasestruktur for produkter/kategorier, klikk-og-hent-flyt osv.) ligger fortsatt i [nettbutikk-utviklingsplan.md](nettbutikk-utviklingsplan.md), men **betalingsdelen i det dokumentet er utdatert** (beskriver Vipps) – dette dokumentet er nå fasit for betaling og infrastruktur.

**Utgangspunkt bekreftet:** Kunden er svært fornøyd med design og brukeropplevelse i dagens `nettbutikk-demo/`. Denne beholdes derfor som frontend-grunnlag for MVP-en – det bygges **ikke** om fra bunnen. Arbeidet videre handler om å koble eksisterende sider og admin-mønstre til ekte Supabase-data og Stripe-betaling (se pkt. 12 for hva dette faktisk sparer av tid), samt å trekke ut hvitmerke-konfigurasjonen (pkt. 1).

## 1. Arkitektur og eierskap

Fordi koden skal gjenbrukes til flere kunder senere, bygges MVP-en **hvitmerke-klar** allerede nå, selv om den kun driftes for én kunde i piloten:

- **Ingen hardkodede kundespesifikke verdier i kjernen.** Butikknavn, logo, farger, adresse, åpningstider, produktkatalog og fargeutvalg skal styres via Supabase (database/config) per kunde – ikke skrives inn i komponenter (slik dagens demo dels gjør, med «Kulør Rognan» flere steder direkte i koden).
- **Én privat kjerne-kodebase som AEMA eier**, adskilt fra kundens driftsmiljø. Anbefalt modell for pilotfasen: **single-tenant** (egen database og egen driftet instans for Kulør Rognan), bygget fra samme kjernerepo. Full delt multi-tenant-arkitektur er for tidlig å bygge for én pilotkunde.
- **Datamodellen forberedes for flere kunder fra dag én**, blant annet med konsekvent `store_id` på alle relevante tabeller, slik at en fremtidig overgang til en mer komplett multi-tenant-modell kan gjøres **uten å bygge plattformen på nytt**.
- **Samme økonomiske prinsipp gjelder på tvers av AEMAs produkter**: unngå én full Supabase-instans/prosjekt per kunde der en sikker multi-tenant-løsning kan dele infrastruktur. Dette gjelder også AEMA Booking, og bør legges til grunn når flere kunder kommer til – ikke bare for Kulør Rognan.
- Kunden får **ikke** tilgang til kildekoden, Netlify-, Supabase- eller GitHub-infrastrukturen (se pkt. 6).

## 2. Hva kunden faktisk får

| | Innhold |
|---|---|
| **Etablering/implementering (engangs)** | Oppsett, konfigurering av butikkens katalog/farger/design, opplæring, publisering |
| **Abonnement (løpende)** | Hosting, drift, backup, sikkerhetsoppdateringer, support, mindre innholdsendringer, bruksrett til plattformen |
| **AEMA beholder** | Fullt eierskap til kildekode og plattformarkitektur, samt retten til å videreutvikle og videreselge løsningen til andre kunder |

Kunden har bruksrett **så lenge abonnementet løper** – ikke en varig eiendomsrett. Bruk konsekvent «etablering» eller «implementering» om engangsbeløpet i all kommunikasjon med kunden; unngå formuleringer som «kjøp av løsning» eller «kjøp av kode», som lett kan mistolkes som eierskapsoverdragelse. Dette må også stå eksplisitt i avtalen (se pkt. 9).

## 3. Betaling: Stripe

Vipps er tatt ut av MVP-en. Kunden ønsker Stripe fra start:

- **Kunden oppretter og eier sin egen Stripe-konto/betalingsavtale.** Løsningen integreres mot denne kontoen – AEMA formidler ikke betalinger på egne vegne, og har dermed ikke selvstendig PCI-/betalingsansvar.
- **Transaksjonskostnader fra Stripe bæres av kunden**, ikke av AEMA, og inngår ikke i de 600 kr/mnd.
- Ordre opprettes med status «venter» før betaling, og bekreftes serverside via **Stripe webhook** (ikke bare klientside-redirect), samme prinsipp som tidligere beskrevet for Vipps.
- Webhook-håndtering krever en liten serverdel – naturlig som en Netlify Function, slik at man ikke trenger å innføre en separat backend-plattform bare for dette (se pkt. 5).

## 4. Data, bilder og admin (Supabase)

- **Supabase Database**: produkter, priser, tekster, butikkdata, kategorier, farger og ordre lagres her – ikke i statiske filer i koden (slik dagens demo gjør med `data.js`).
- **Supabase Storage**: produktbilder, logoer og andre opplastede bilder lagres her, **ikke** i Netlify-deployen. Dette holder selve applikasjonskoden liten og uavhengig av innhold.
- **Bildekomprimering**: samme prinsipp som i AEMA Booking – mål om bilder rundt **~130 KB** der det gir god nok kvalitet, for å holde lagrings- og båndbreddekostnader lave.
- **Admin uten deploy**: butikken skal kunne opprette/redigere produkter, priser, bilder og tekster gjennom adminpanelet (bygger videre på admin-demoens produktskjema) uten at det krever en ny Netlify-deploy.

## 5. Netlify og deploy-strategi

Netlify brukes primært til selve applikasjonen/frontend-koden – ikke til innhold. Dette er en bevisst arkitekturbeslutning for å holde løpende Netlify-forbruk lavt:

- **Endring av produkt, pris, tekst eller bilde i admin skal ikke utløse en ny deploy.** Frontend henter dette fra Supabase ved kjøretid (via Supabase sin klient/PostgREST-API), på samme måte som dagens demo henter fra `data.js` – bare at kilden byttes fra en statisk fil til en levende database.
- **Deploy skal normalt kun være nødvendig når selve programvaren/koden endres** (nye funksjoner, feilrettinger, design-endringer).
- Dette tilsier at man kan videreføre en enkel, statisk frontend-arkitektur (i tråd med dagens demo) fremfor å innføre et tyngre rammeverk med statisk generering ved bygg – siden statisk generering ved bygg ville krevd ny deploy for hver innholdsendring, i strid med kravet over.
- **Stripe-webhooken** håndteres av en Netlify Function i samme prosjekt, slik at man slipper å sette opp og betale for en egen backend-tjeneste bare for dette.

## 6. Kontoer og infrastruktur i pilotfasen

- **AEMAs eksisterende Supabase- og Netlify-kontoer** brukes i første omgang – det opprettes **ikke** nye hovedkontoer bare for Kulør Rognan nå.
- Det opprettes **egne, tydelig navngitte prosjekter/sites** for denne løsningen på disse kontoene (f.eks. et Supabase-prosjekt og en Netlify-site med et gjenkjennbart navn som skiller det fra AEMAs øvrige prosjekter og fra andre fremtidige kunder).
- Løsningen organiseres slik at Supabase-prosjektet og Netlify-siten **senere kan flyttes** til egne AEMA-organisasjoner/team når det blir naturlig (typisk når flere kunder kommer til), uten at det krever en ombygging av koden.
- **Kunden eier ikke** Netlify-, Supabase- eller GitHub-infrastrukturen – dette er AEMAs driftsressurser, jf. pkt. 1 og 2.

## 7. Månedlige kostnader

Kostnader som kan ligge hos AEMA i pilotfasen:

- Netlify
- Supabase
- E-posttjeneste (transaksjonell e-post for ordrebekreftelse mv.)
- Eventuell Twilio/SMS, dersom dette tas i bruk senere
- Eventuelt domene, dersom AEMA må holde dette

**Stripe-gebyrer ligger hos kunden**, ikke hos AEMA (jf. pkt. 3).

Med komprimerte produktbilder i Supabase Storage (~130 KB) og én lokal butikk med moderat trafikk forventes svært lave variable infrastrukturkostnader i pilotfasen – dette bør ikke overdrives i kostnadsbildet overfor kunden eller internt.

## 8. Kommersiell modell

- **Pilotpris antydet til kunden:** ca. **30 000 kr i etablering/implementering** + **600 kr/mnd** i abonnement.
- Dette er bevisst en **lav pilot-/referansepris**, fordi Kulør Rognan kan bli inngangen til en større utrulling mot **Kulør- og Happy Homes-kjedene**. Verdien av en referansekunde og et fungerende kjede-case vurderes som del av avtalen, ikke bare den direkte inntekten.
- **600 kr/mnd skal ikke automatisk bli standardpris** for senere enkeltkunder eller en eventuell kjedeutrulling – prisen for videre skalering vurderes separat når det blir aktuelt, og avhenger blant annet av volum og hvilken infrastrukturmodell (single-tenant vs. multi-tenant) som er i bruk da.
- **Større videreutvikling og spesialtilpasninger kommer utenfor månedsprisen.**
- Hold fortsatt **produktregistrering utover avtalt antall** utenfor fastprisen for etablering.

## 9. Avtaleverk som må på plass før pilotstart

- **Lisens-/tjenesteavtale (SaaS-modell)**, ikke en vanlig utviklingskontrakt med kode-overlevering – må tydelig regulere bruksrett vs. eierskap, oppsigelsestid, og hva som skjer med kundens *data* (ikke koden) ved oppsigelse. Dataportabilitet er rimelig å love; kildekode er det ikke.
- **Databehandleravtale (DPA)** for kundedata (navn, e-post, telefon, ordrehistorikk) mellom AEMA og Kulør Rognan, samt vurdering av underleverandøravtaler (Supabase, Netlify, e-posttjeneste).
- **Stripe-forhold**: presiser i avtalen at kunden inngår og eier sin egen Stripe-avtale, og at AEMA kun integrerer mot denne – ikke opptrer som betalingsformidler.
- **SLA/driftsavtale**: oppetid, support-responstid, og hva som inngår i de 600 kr/mnd vs. faktureres separat (SMS-forbruk, større produktimport, spesialtilpasninger, jf. pkt. 8).
- **Immaterialrett-klausul** som eksplisitt sier at kildekode, design-templates og plattformarkitektur forblir AEMAs eiendom.

Dette er ikke teknisk arbeid, men bør på plass parallelt med utviklingen – ikke etter at piloten er live.

## 10. Suksesskriterier for piloten

Avklar med kunden på forhånd hva som avgjør om piloten regnes som vellykket, f.eks.:

- Et gitt antall reelle ordre gjennomført klikk-og-hent i løpet av en definert testperiode (f.eks. 4–8 uker)
- Butikkens ansatte kan drifte ordreflyten og redigere produkter/priser/bilder i admin uten løpende bistand fra AEMA, og uten at det krever noen deploy
- Stripe-betalingsflyten fungerer uten kritiske feil, med kundens egen konto
- Kundetilbakemelding på om løsningen faktisk sparer tid i butikken

## 11. Risikoer

- **Forventningsavklaring om eierskap** er fortsatt den største risikoen – uten tydelig avtale kan kunden anta de kjøper koden. Konsekvent bruk av «etablering»/«implementering» fremfor «kjøp» i all kommunikasjon reduserer denne risikoen, men avtalen (pkt. 9) må uansett være eksplisitt.
- **Avhengighet til AEMA som leverandør**: siden koden ikke overleveres, er kunden avhengig av AEMAs fortsatte drift. En enkel driftskontinuitetsplan styrker tilliten i salget.
- **Kjede-mulighet er en mulighet, ikke en forpliktelse**: Kulør/Happy Homes-utrulling er en strategisk oppside som begrunner lav pilotpris, men bør ikke loves til kunden som noe konkret før det faktisk er avtalt.
- **Konkurranseklausul/eksklusivitet**: avklar om kunden forventer at løsningen skal være unik for dem i deres marked, siden dette direkte påvirker videresalgsstrategien.
- **Stripe vs. tidligere Vipps-antakelse**: alt tidligere planarbeid som forutsatte Vipps (inkl. deler av [nettbutikk-utviklingsplan.md](nettbutikk-utviklingsplan.md) og den nåværende demoens Vipps-styrte betalingsknapp) må oppdateres i tråd med dette dokumentet før faktisk utvikling starter.
- Øvrige risikoer fra tidligere plan (fargedata, driftsrutine i butikk, scope-kryp på produktregistrering) gjelder fortsatt.

## 12. Omfang og tidsestimat

Fordi dagens demo beholdes som frontend-grunnlag (se innledningen), er ikke dette et fra-bunnen-estimat. Utviklingstimer er delt i det som gjenbrukes direkte fra `nettbutikk-demo/`/`admin-demo/` og det som uansett er nytt arbeid (backend, betaling, infrastruktur fantes ikke i demoen):

| Del | Fra bunnen | Med demo som grunnlag |
|---|---|---|
| Kjerneoppsett: repo, whitelabel-konfig, `store_id` | 10–15 | 8–12 |
| Supabase-database (skjema, RLS) | 15–20 | 15–20 (uendret – finnes ikke i demoen) |
| Supabase Storage + bildekomprimering | 8–12 | 8–12 (uendret) |
| Migrere frontend fra `data.js` til Supabase | 20–25 | 10–15 (sider/komponenter er ferdig bygget) |
| Fargevalgsløsning | 15–20 | 4–6 (UI-en er nesten ferdig) |
| Handlekurv + checkout (Stripe) | 10–15 | 8–12 |
| Stripe-integrasjon | 15–20 | 15–20 (uendret – demoens betalingsknapp er ren staffasje) |
| Ordreflyt + statuser + e-post | 15–20 | 10–15 (admin-UI for statusendring finnes) |
| Adminpanel (auth, bilde-CRUD, ekte lagring) | 25–35 | 18–25 (skjema/ikonvelger finnes) |
| Netlify-oppsett | 8–10 | 5–8 |
| Testing, mobiltilpasning, publisering, opplæring | 15–20 | 12–16 |
| **Sum** | **~166–232 t** | **~120–160 t** |

Ikke inkludert i timeestimatet: avtaleverk/juridisk arbeid (pkt. 9). Ved 30 000 kr i etablering (pkt. 8) mot 120–160 utviklingstimer er den effektive timeprisen lav – bevisst akseptert som investering i en gjenbrukbar plattform, men bør holdes synlig i egen intern kalkyle, ikke bare i kundens tilbud.

## Neste steg

1. Avklar punkt 9 (avtaleverk) og eierskaps-/eksklusivitetsspørsmål med kunden før utvikling starter
2. Sett opp privat kjernerepo basert på dagens `nettbutikk-demo/`/`admin-demo/`, med konfigurasjonslag for hvitmerking og `store_id` i datamodellen
3. Opprett navngitte Supabase- og Netlify-prosjekter på AEMAs eksisterende kontoer (pkt. 6)
4. Migrer eksisterende demo-sider til Supabase for data/bilder og Stripe for betaling, uten build-avhengighet til innhold (pkt. 3–5, 12)
5. Oppdater [nettbutikk-utviklingsplan.md](nettbutikk-utviklingsplan.md) sin betalingsdel til Stripe, så de to dokumentene ikke motsier hverandre
6. Definer testperiode og suksesskriterier (pkt. 10) skriftlig med kunden før pilotstart
