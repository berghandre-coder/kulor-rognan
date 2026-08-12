# Utviklingsplan – Kulør Rognan nettbutikk (klikk-og-hent, maling)

_Foreløpig plan · Sist oppdatert: 2026-08-06_

Denne planen beskriver veien fra dagens klikkbare demo (se [nettbutikk-demo-status.md](nettbutikk-demo-status.md)) til en reell, salgbar MVP. Den bygger videre på eksisterende designspråk og forutsetter en enkel, mobiltilpasset og rimelig-å-drifte løsning – ikke overutvikling av første versjon.

## 1. Anbefalt teknisk arkitektur

> **Oppdatert:** Betaling, hosting og deploy-strategi under er erstattet av beslutningene i [mvp-plan-pilotkunde.md](mvp-plan-pilotkunde.md) (pkt. 3–5) – Stripe i stedet for Vipps, og en statisk frontend på Netlify (viderefører dagens demo) i stedet for Next.js/Vercel, slik at innholdsendringer i admin ikke krever ny deploy. Resten av denne planen (database, klikk-og-hent-flyt, admin) gjelder fortsatt.

- **Frontend:** Statisk frontend (viderefører dagens `nettbutikk-demo/`), hostet på Netlify. Henter data fra Supabase ved kjøretid i stedet for bygge-tidspunkt, slik at admin-endringer ikke krever ny deploy.
- **Backend/database:** Supabase (Postgres + Auth + Storage) – ferdig database, innlogging for adminbruker og bildelagring uten egen serverdrift.
- **Betaling:** Stripe (kundens egen konto) som eneste metode i MVP – dekker både kort og andre Stripe-støttede betalingsmetoder uten behov for en egen Vipps-integrasjon ved siden av.
- **E-post:** Transaksjonell e-post via Resend eller Postmark.
- **SMS:** Ikke i MVP – legges til senere via norsk SMS-gateway, fakturert etter forbruk.
- **Admin:** Egen enkel, passordbeskyttet adminseksjon, bygget videre på dagens admin-demo-mønster.

## 2. Databasestruktur

- **categories** – hovedkategori (Innemaling/Utemaling) + underkategori (Vegg, Tak, Panel/dør/list, Fasade, Terrasse, Mur/grunnmur)
- **products** – navn, beskrivelse, merke, kategori/underkategori, bilde, aktiv/inaktiv
- **product_variants** – variant (spannstørrelse, bredde, rullbredde/lugg, bredde×lengde, størrelse – se demoens `variantType`-modell) + pris
- **colors** – kuratert liste over «populære farger»: navn, kode, hex, leverandør, sortering
- **orders** – kundeinfo, status (`ny` → `under_blanding` → `klar_til_henting` → `utlevert`), betalingsstatus, betalings-ID, totalsum
- **order_items** – ordre-referanse, produktvariant, valgt farge (referanse eller fritekst), antall, pris, kundekommentar
- **admin_users** – enkel autentisering for butikkansatte

## 3. Fargevalg

Siden leverandører (f.eks. Butinox) ikke tilbyr API/eksport, bygges løsningen rundt at hele fargekartet ikke kan registreres manuelt:

1. **Populære farger** – 30–60 kuraterte farger med navn, kode og tilnærmet fargeswatch
2. **Fritekstfelt for fargekode** – hovedmekanismen som løser «hundrevis av farger»-problemet
3. **Lenke til leverandørens fargeunivers** – åpner i ny fane
4. **Søk** i de populære fargene
5. **Import av fullt fargeregister** – egen betalt tilleggstjeneste senere, betinget av leverandøravtale
6. **Disclaimer** ved alle fargevisninger om at skjermfarger kun er veiledende

## 4. Betalingsflyt

1. Kunde bygger handlekurv og går til «Til betaling»
2. Ordre opprettes med status `ny` og betalingsstatus `venter` **før** betaling startes
3. Betaling via Stripe Checkout/Payment Intents, mot kundens egen Stripe-konto
4. Betaling bekreftes via **Stripe webhook** (håndtert av en Netlify Function), ikke bare klientside-redirect
5. Ved bekreftet betaling: e-postbekreftelse sendes, ordren dukker opp i admin
6. Mislykket/avbrutt betaling: ordre forblir uåpnet, ingen varsling sendes

## 5. Klikk-og-hent-flyt

**Ny ordre → Under blanding → Klar til henting → Utlevert**

- Butikkansatt endrer status manuelt i admin
- Overgang til «Klar til henting» trigger e-post (SMS i fase 2) til kunden
- Retur/refusjon håndteres manuelt i Stripe-dashbordet i MVP

## 6. Adminløsning

- **Produkter:** opprette/redigere, priser, varianter, aktiver/deaktiver
- **Ordre:** filtrere på status, se detaljer (variant, fargekode, kommentar, kontaktinfo), endre status, «kontakt kunde»-lenker

Ingen rollestyring, ingen rapportmoduler, ingen kassaintegrasjon i MVP.

## 7. Juridiske og praktiske avklaringer

- Ikke skrap/kopier bilder eller fargekart fra leverandørens side – lenk ut i stedet
- Avklar skriftlig med leverandør om bruk av varemerke/fargenavn, og mulighet for fargeregister senere
- **GDPR:** personvernerklæring og databehandleravtaler med hosting-, e-post- og betalingsleverandør
- **Stripe-avtale** må opprettes og eies av kunden (butikken) tidlig – tar tid, og AEMA opptrer ikke som betalingsformidler (se [mvp-plan-pilotkunde.md](mvp-plan-pilotkunde.md) pkt. 3)
- Ansvarsfraskrivelse i kjøpsvilkår for feilblanding grunnet feil fargekode fra kunde

## 8. MVP vs. senere

**MVP (fase 1):** Kategori → produkt → variant → antall → farge (der relevant) → Stripe-betaling → ordrestatus-flyt → e-postvarsling → enkelt adminpanel → 50–75 produkter.

**Fase 2:** SMS-varsling, importert fargeregister, kundekonto/ordrehistorikk, rabattkoder, flere admin-brukere, lagerintegrasjon.

## 9. Risikoer og avklaringer med kunden

- Leverandøravtale om fargedata kan forsinkes – MVP fungerer uavhengig av dette (fritekstfelt)
- Stripe-oppsett (kundens egen konto) tar tid og bør startes tidlig
- Driftsrutine i butikk: klikk-og-hent krever at ansatte oppdaterer ordrestatus fortløpende
- Scope-kryp på produkt-/fargeregistrering – hold fast avtalt antall i etableringsprisen
- Refusjon/kansellering er manuell i MVP

## 10. Omtrentlig utviklingsomfang

> **Erstattet av** det mer detaljerte og oppdaterte estimatet i [mvp-plan-pilotkunde.md](mvp-plan-pilotkunde.md) pkt. 12, som skiller mellom fra-bunnen-arbeid og det som gjenbrukes direkte fra dagens demo. Tabellen under står som generell referanse, med Vipps-raden rettet til Stripe.

| Del | Timer |
|---|---|
| Design/oppsett (videreføring av eksisterende) | 15–20 |
| Produktkatalog + kategori/variant-struktur | 25–35 |
| Fargevalgsløsning | 15–20 |
| Handlekurv + checkout | 15–20 |
| Stripe-betalingsintegrasjon | 15–20 |
| Ordre-/klikk-og-hent-flyt + statuser + e-post | 20–30 |
| Adminpanel | 30–40 |
| Testing, mobiltilpasning, publisering, opplæring | 15–20 |
| **Sum** | **~150–205 t** |

Produktregistrering (50–75 stk) kommer i tillegg eller inkluderes avhengig av hvor mye rådata kunden kan levere.

## Status vs. plan

Den nåværende frontend-demoen (se [nettbutikk-demo-status.md](nettbutikk-demo-status.md)) dekker kundereisen og adminopplevelsen visuelt og funksjonelt, men uten punkt 1 (ekte backend/database), 4 (ekte betaling/webhook) og 5–6 sin persistens. Den er ment som salgsdemo for pilotbeslutningen, ikke som utgangspunkt for produksjonskode.
