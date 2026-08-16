# MVP-plan for pilotkunde – Kulør Rognan

_Foreløpig plan · Sist oppdatert: 2026-08-16 · Erstatter tidligere versjon (se Git-historikk for opprinnelig utgave)_

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
- Stripe Checkout opprettes med **ordrens beregnede `total_inc_vat_ore`**. Stripe-resultatet er ikke kilden til MVA-beregningen; prisgrunnlag, MVA-satser og MVA-beløp beregnes og lagres i AEMAs ordrelogikk før betalingssesjonen opprettes.
- Webhooken skal kontrollere at betalt beløp og valuta samsvarer med ordrens lagrede `total_inc_vat_ore` og `currency` før betalingsstatus settes til «betalt».
- Webhook-håndtering krever en liten serverdel – naturlig som en Netlify Function, slik at man ikke trenger å innføre en separat backend-plattform bare for dette (se pkt. 5).

## 3A. MVA – obligatorisk fra første ordre

MVA er en del av MVP-ens produkt-, pris- og ordremodell fra start og skal være ferdig definert før Stripe- og ordreimplementasjonen låses. Alle pengebeløp som lagres eller sendes til betaling håndteres som **heltall i øre**. MVA-satsen lagres som heltall i **basispunkter** (`vat_rate_basis_points`), der `2500` betyr 25,00 %. Modellen er dermed ikke låst til én sats.

**Produktmodellen:**
- Hvert produkt har en eksplisitt `vat_rate_basis_points`, med `2500` som forhåndsvalgt standard for vanlige varer i piloten.
- Variantens `price_ore` og eventuell `campaign_price_ore` er pris **inkl. MVA**, fordi dette er prisen som vises til og betales av sluttkunden.
- Pris eks. MVA beregnes fra pris inkl. MVA og produktets sats. Den skal ikke vedlikeholdes manuelt som en uavhengig pris som kan komme ut av synk.

**Ordre- og ordrelinjemodellen:**
- Ved ordreopprettelse beregnes MVA på hver ordrelinjes samlede inklusivbeløp: `line_amount_ex_vat_ore = round(line_amount_inc_vat_ore × 10000 / (10000 + vat_rate_basis_points))`, og `line_vat_ore` er differansen. Dette gir én konsekvent avrunding per ordrelinje.
- Hver ordrelinje lagrer snapshot av produktnavn, antall, `unit_price_inc_vat_ore`, `unit_price_ex_vat_ore`, `vat_rate_basis_points`, `line_amount_ex_vat_ore`, `line_vat_ore` og `line_amount_inc_vat_ore`. Produktpris eller MVA-sats kan dermed endres senere uten at ordrehistorikken endres.
- Ordren lagrer `subtotal_ex_vat_ore`, `vat_total_ore`, `total_inc_vat_ore` og et satsvist `vat_breakdown`. Summen av eks. MVA og MVA skal alltid være lik total inkl. MVA.
- Ved flere MVA-satser summeres linjene først per sats og deretter til ordretotalen; det brukes ikke én global sats på hele ordren.

**Admin:**
- Butikkansatte kan se og sette MVA-sats på produktet. 25 % er forhåndsvalgt ved vanlig produktregistrering, men andre satser kan registreres.
- Produktpriser registreres og vises som pris inkl. MVA, med beregnet pris eks. MVA tilgjengelig fra samme ørebaserte beregning.
- Ordredetaljen viser sum eks. MVA, samlet MVA og total inkl. MVA, samt sats/MVA-beløp per ordrelinje.

**Kundeside og ordrebekreftelse:**
- Alle produkt-, handlekurv- og checkoutpriser vises inkl. MVA.
- Ordreoppsummering og ordrebekreftelse viser minst total inkl. MVA og hvor mye MVA som inngår; MVP-en viser i tillegg sum eks. MVA.

**Stripe:**
- Stripe belastes med `total_inc_vat_ore`. Serverdelen beregner ordren på nytt fra databaseprisene, lagrer MVA-snapshot og oppretter deretter betalingssesjonen.
- Klientens handlekurvpris eller Stripe sin beregning skal aldri brukes som fasit for MVA. Webhooken bekrefter betalt beløp mot det forventede, lagrede ordrebeløpet før ordren markeres betalt.

## 4. Data, bilder og admin (Supabase)

- **Supabase Database**: produkter, priser, tekster, butikkdata, kategorier, farger og ordre lagres her – ikke i statiske filer i koden (slik dagens demo gjør med `data.js`).
- **MVA i produkt- og ordredata**: produktet har eksplisitt MVA-sats; variantpris er inkl. MVA; ordre og ordrelinjer lagrer ørebaserte MVA-snapshots og totalsummer som definert i pkt. 3A.
- **Supabase Storage**: produktbilder, logoer og andre opplastede bilder lagres her, **ikke** i Netlify-deployen. Dette holder selve applikasjonskoden liten og uavhengig av innhold.
- **Bildekomprimering**: samme prinsipp som i AEMA Booking – mål om bilder rundt **~130 KB** der det gir god nok kvalitet, for å holde lagrings- og båndbreddekostnader lave.
- **Admin uten deploy**: butikken skal kunne opprette/redigere produkter, priser, bilder og tekster gjennom adminpanelet (bygger videre på admin-demoens produktskjema) uten at det krever en ny Netlify-deploy.
- **MVA i admin**: 25 % er standard ved produktregistrering, men kan endres. Ordredetaljer viser eks. MVA, MVA og inkl. MVA.
- Produktdataene inkluderer også lagerstatus og forventet leveringstid (se pkt. 13) – samme prinsipp, ingen deploy for å endre dette.

## 5. Netlify og deploy-strategi

Netlify brukes primært til selve applikasjonen/frontend-koden – ikke til innhold. Dette er en bevisst arkitekturbeslutning for å holde løpende Netlify-forbruk lavt:

- **Endring av produkt, pris, tekst eller bilde i admin skal ikke utløse en ny deploy.** Frontend henter dette fra Supabase ved kjøretid (via Supabase sin klient/PostgREST-API), på samme måte som dagens demo henter fra `data.js` – bare at kilden byttes fra en statisk fil til en levende database.
- **Deploy skal normalt kun være nødvendig når selve programvaren/koden endres** (nye funksjoner, feilrettinger, design-endringer).
- Dette tilsier at man kan videreføre en enkel, statisk frontend-arkitektur (i tråd med dagens demo) fremfor å innføre et tyngre rammeverk med statisk generering ved bygg – siden statisk generering ved bygg ville krevd ny deploy for hver innholdsendring, i strid med kravet over.
- **Stripe-webhooken** håndteres av en Netlify Function i samme prosjekt, slik at man slipper å sette opp og betale for en egen backend-tjeneste bare for dette.

## 6. Kontoer og infrastruktur i pilotfasen

- **AEMAs eksisterende Supabase- og Netlify-kontoer** brukes i første omgang – det opprettes **ikke** nye hovedkontoer bare for Kulør Rognan nå.
- For Supabase brukes e-postaliaset **`kulornettbutikk@aema.no`** ved opprettelse av konto.
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
- **Investeringslogikk:** Kulør- og Happy Homes-kjedene består til sammen av rundt **98 butikker (38 + 60)**. Selv om kun **~10 % (≈10 butikker)** velger løsningen ved en eventuell kjedeutrulling, representerer det et vesentlig større inntektsgrunnlag enn piloten alene – dette er hva som gjør den lave pilotprisen til en fornuftig investering, ikke bare en rabatt. Konkret prising for en slik utrulling er fortsatt ikke fastsatt (jf. neste punkt), så regnestykket er foreløpig kvalitativt.
- **Piloten selger seg selv best gjennom resultater, ikke bare teknikk.** Målet er at Kulør Rognan lykkes med **økt salg** gjennom løsningen – det er dette som faktisk gjør piloten til et overbevisende case å vise frem for kjedene, mer enn at løsningen bare fungerer teknisk. Se pkt. 10.
- **600 kr/mnd skal ikke automatisk bli standardpris** for senere enkeltkunder eller en eventuell kjedeutrulling – prisen for videre skalering vurderes separat når det blir aktuelt, og avhenger blant annet av volum og hvilken infrastrukturmodell (single-tenant vs. multi-tenant) som er i bruk da.
- **Større videreutvikling og spesialtilpasninger kommer utenfor månedsprisen.**
- Hold fortsatt **produktregistrering utover avtalt antall** utenfor fastprisen for etablering.
- Lagerstatus/fjernlager (pkt. 13) åpner for en prisstrategi der butikken bevisst kan selge enkelte bestillingsvarer med lavere margin for å trekke kunder til nettbutikken, uten å finansiere eget varelager for dem – en del av salgsargumentet, ikke noe som endrer AEMAs egen prising i pkt. 8.

## 9. Avtaleverk som må på plass før pilotstart

- **Lisens-/tjenesteavtale (SaaS-modell)**, ikke en vanlig utviklingskontrakt med kode-overlevering – må tydelig regulere bruksrett vs. eierskap, oppsigelsestid, og hva som skjer med kundens *data* (ikke koden) ved oppsigelse. Dataportabilitet er rimelig å love; kildekode er det ikke.
- **Databehandleravtale (DPA)** for kundedata (navn, e-post, telefon, ordrehistorikk) mellom AEMA og Kulør Rognan, samt vurdering av underleverandøravtaler (Supabase, Netlify, e-posttjeneste).
- **Stripe-forhold**: presiser i avtalen at kunden inngår og eier sin egen Stripe-avtale, og at AEMA kun integrerer mot denne – ikke opptrer som betalingsformidler.
- **SLA/driftsavtale**: oppetid, support-responstid, og hva som inngår i de 600 kr/mnd vs. faktureres separat (SMS-forbruk, større produktimport, spesialtilpasninger, jf. pkt. 8).
- **Immaterialrett-klausul** som eksplisitt sier at kildekode, design-templates og plattformarkitektur forblir AEMAs eiendom.

Dette er ikke teknisk arbeid, men bør på plass parallelt med utviklingen – ikke etter at piloten er live.

## 10. Suksesskriterier for piloten

Avklar med kunden på forhånd hva som avgjør om piloten regnes som vellykket. Det viktigste kriteriet er forretningsresultatet, ikke bare at teknikken virker:

- **Målbar salgsøkning for Kulør Rognan** knyttet til nettbutikken/klikk-og-hent i testperioden – det overordnede målet for piloten, og det som gir et reelt case å vise frem for Kulør- og Happy Homes-kjedene. Avklar med kunden på forhånd hvordan dette skal måles (f.eks. omsetning via nettbutikken, sammenlignet mot en tilsvarende periode uten løsningen, eller mot butikkens egne salgsmål).
- Et gitt antall reelle ordre gjennomført klikk-og-hent i løpet av en definert testperiode (f.eks. 4–8 uker)
- Butikkens ansatte kan drifte ordreflyten og redigere produkter/priser/bilder i admin uten løpende bistand fra AEMA, og uten at det krever noen deploy
- Stripe-betalingsflyten fungerer uten kritiske feil, med kundens egen konto
- Kundetilbakemelding på om løsningen faktisk sparer tid i butikken
- Butikken har lagt inn og solgt minst én fjernlager-/bestillingsvare (pkt. 13) i løpet av testperioden, med lagerstatus og leveringstid tydelig kommunisert til kunden gjennom hele kjøpsflyten

## 11. Risikoer

- **Forventningsavklaring om eierskap** er fortsatt den største risikoen – uten tydelig avtale kan kunden anta de kjøper koden. Konsekvent bruk av «etablering»/«implementering» fremfor «kjøp» i all kommunikasjon reduserer denne risikoen, men avtalen (pkt. 9) må uansett være eksplisitt.
- **Avhengighet til AEMA som leverandør**: siden koden ikke overleveres, er kunden avhengig av AEMAs fortsatte drift. En enkel driftskontinuitetsplan styrker tilliten i salget.
- **Kjede-mulighet er en mulighet, ikke en forpliktelse**: Kulør/Happy Homes-utrulling er en strategisk oppside som begrunner lav pilotpris, men bør ikke loves til kunden som noe konkret før det faktisk er avtalt.
- **Teknisk suksess er ikke nok**: en pilot som fungerer feilfritt men ikke gir Kulør Rognan økt salg, er et svakt utgangspunkt for en kjedesamtale. Salgsmåling (pkt. 10) bør derfor på plass fra dag én, ikke legges til underveis.
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

## 13. Lagervarer og fjernlager/bestillingsvarer

Kulør Rognan skal ikke være begrenset til varer de fysisk har på lager i butikk. MVP-en støtter også bestillingsvarer fra leverandør/fjernlager (f.eks. gulv, tepper, fliser, tapet), slik at butikken kan tilby et betydelig større sortiment **uten å binde kapital eller lagerplass lokalt**. Dette er en kommersiell fordel, ikke bare en teknisk detalj – se koblingen til pkt. 8 og 10 under.

**Viktig avgrensning:** dette skal i MVP-en være **manuelt administrert av butikken**. Ingen integrasjon mot leverandør-, kjede- eller ERP-lager nå – målet er kun å gjøre plattformen *klar* for begge vareflytene, ikke å automatisere dem.

**MVP-funksjonalitet:**
- To lagerstatuser per produkt/variant: **På lager** og **Fjernlager/bestillingsvare**
- Kunden kan gjennomføre kjøp med Stripe og velge klikk-og-hent uansett status – ingen egen kjøpsflyt for bestillingsvarer
- Nettbutikken viser tydelig forventet leveringstid basert på status, f.eks. «På lager – normalt klar for henting samme dag» / «Fjernlager – forventet levering til butikk 3–7 dager»

**Datamodell** (utvidelse av `product_variants` fra [nettbutikk-utviklingsplan.md](nettbutikk-utviklingsplan.md) pkt. 2):
- `products.vat_rate_basis_points`: eksplisitt MVA-sats per produkt (`2500` = 25,00 %), jf. pkt. 3A
- `product_variants.price_ore`: ordinær pris inkl. MVA i øre
- `stock_status`: `på_lager` eller `fjernlager`
- `expected_lead_time`: tekst vist til kunden (f.eks. «3–7 dager»)
- `supplier_reference`: internt felt for leverandør/fjernlager-referanse – vises kun i admin, aldri til kunden
- `campaign_price_ore`: valgfri alternativ pris inkl. MVA i øre, for bevisst lavere margin på enkelte bestillingsvarer

**Adminpanelet:**
- Butikken setter lagerstatus, forventet leveringstid, ev. leverandørreferanse og kampanjepris manuelt per produkt/variant – samme skjema-mønster som dagens admin-demo, ikke en ny arbeidsflyt
- Admin bør vise lagerstatus per ordrelinje, slik at butikken kan planlegge henting riktig når en ordre blander lagervarer og fjernlagervarer

**Kundereise/produktvisning:**
- Lagerstatus og forventet leveringstid vises på produktkort og produktside, ved siden av pris og variant
- Handlekurv, checkout og bekreftelse viser samme informasjon per linje – spesielt viktig når en ordre inneholder en blanding av lagervarer og fjernlagervarer, slik at kunden vet hva som er klart raskt og hva som tar tid
- Ordrestatus-flyten (Ny → Under blanding → Klar til henting → Utlevert) er uendret, men «klar til henting»-tidspunktet vil naturlig variere mer for fjernlagervarer

## Neste steg

1. Avklar punkt 9 (avtaleverk) og eierskaps-/eksklusivitetsspørsmål med kunden før utvikling starter
2. Sett opp privat kjernerepo basert på dagens `nettbutikk-demo/`/`admin-demo/`, med konfigurasjonslag for hvitmerking og `store_id` i datamodellen
3. Opprett navngitte Supabase- og Netlify-prosjekter på AEMAs eksisterende kontoer (pkt. 6)
4. Migrer eksisterende demo-sider til Supabase for data/bilder og Stripe for betaling, uten build-avhengighet til innhold (pkt. 3–5, 12)
5. Oppdater [nettbutikk-utviklingsplan.md](nettbutikk-utviklingsplan.md) sin betalingsdel til Stripe, så de to dokumentene ikke motsier hverandre
6. Definer testperiode og suksesskriterier (pkt. 10) skriftlig med kunden før pilotstart
