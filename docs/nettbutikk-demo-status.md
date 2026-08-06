# Nettbutikk-demo – status

_Sist oppdatert: 2026-08-06 · Branch: `feature/nettbutikk-demo`_

## Formål

En klikkbar frontend-demo av en klikk-og-hent nettbutikk for Kulør Rognan, bygget for å vise kunden hvordan løsningen kan fungere og se ut – som beslutningsgrunnlag for et pilotprosjekt. Ingen database, ingen backend, ingen ekte betaling.

## Lenker

- **Preview (feature-branch):** https://feature-nettbutikk-demo--kulor-rognan.netlify.app/
- **Nettbutikk-demo:** `/nettbutikk-demo/`
- **Admin-demo:** `/admin-demo/`
- **Produksjon (upåvirket av dette arbeidet):** https://kulor-rognan.netlify.app/

## Hva er bygget

### Nettbutikk-demo (`nettbutikk-demo/`)
- **Forside** – kategori-innganger, populære produkter, populære farger, fordeler med klikk og hent
- **Kategoriside** (`kategori.html?type=inne|ute|tilbehor`) – underkategori-faner + produktgrid
- **Produktside** (`produkt.html?id=...`) – variantvalg, antall, fargevalg (kun der relevant), kundekommentar
- **Handlekurv** – endre antall, fjerne vare, totalsum
- **Checkout** – kundeinfo, klikk-og-hent-bekreftelse, illustrativ Vipps-knapp med tydelig demo-melding
- **Ordrebekreftelse** – ordrenummer, produkter, beløp, hentestedsinfo

### Admin-demo (`admin-demo/`)
- Ordreliste med statusfilter, ordredetalj med statusendring (Ny → Under blanding → Klar til henting → Utlevert)
- Produkttabell med aktiver/deaktiver, opprett/rediger produkt (navn, ikon, beskrivelse, kategori, varianter/priser, fargekrav)
- Egen, separat header/footer – ikke koblet til den offentlige nettbutikkmenyen

### Integrasjon med eksisterende nettside
- `index.html`, alle nettbutikksider og footeren deler **én** header/footer-komponent (`assets/layout.js`), identisk med den opprinnelige forsiden
- «Nettbutikk» er et fast menypunkt i hovedmenyen, markert aktivt inne i butikken
- Kategoriene (Innemaling/Utemaling/Tilbehør) vises som en intern butikkmeny-stripe under headeren i stedet for egen topp-navigasjon
- Handlekurvikon lagt til i headeren, kun på nettbutikksider

### Produktlogikk
Variantvisningen styres av produkttype (`variantType` i `nettbutikk-demo/data.js`) i stedet for å anta «spannstørrelse» for alt:

| Type | Variant | Farge |
|---|---|---|
| Maling/beis (6 produkter) | Spannstørrelse i liter | Ja (unntatt Mursealer) |
| Flatpensel | Bredde (35/50/70 mm) | Nei |
| Malerrull Profi | Rullbredde og lugg | Nei |
| Malerteip | Bredde og lengde | Nei |
| Sparkelmasse | Størrelse (kg) | Nei |

Samme variantetikett følger varen gjennom hele kjeden: produktkort → produktside → handlekurv → checkout → bekreftelse → admin-ordre.

## Teknisk

- Ren HTML/CSS (Tailwind CDN) og vanilla JS – ingen build-steg, ingen avhengigheter
- Handlekurv lagres i `localStorage` på klientsiden
- Admin-endringer (ordrestatus, produkter) lever kun i sideøktens minne
- Netlify branch deploy aktivert spesifikt for `feature/nettbutikk-demo` (produksjonsbranch `main` er uendret)

## Commits på branchen

1. `8b1288a` – Nettbutikk- og admin-demo bygget
2. `69684db` – Nettbutikk integrert i forsidens hero/seksjoner
3. `9b76f32` – Én felles header/footer for hele nettstedet
4. `2460285` – Produktlogikk rettet per produkttype, sticky-header-fiks, tittel-fiks

## Kjente, bevisste begrensninger (demo, ikke produksjon)

- Ingen ekte betaling – Vipps-knappen viser en tydelig demo-melding
- Ingen database – alt er statiske eksempeldata i `data.js` / `app.js`
- Mobilmenyen er dekorativ (samme som på eksisterende produksjonsside – ikke noe denne demoen har endret)
- Fargevalg bruker en kuratert liste med 12 «populære farger» + fritekstfelt + lenke til leverandør, ikke et fullt fargeregister

## Neste steg

Se [nettbutikk-utviklingsplan.md](nettbutikk-utviklingsplan.md) for planen mot en reell MVP.
