# Netlify-deploy av fase 2

Dette oppsettet deployer kun den statiske applikasjonen og `public-config`-funksjonen. SQL, seed, dokumentasjon, lokale miljøfiler og testscripts publiseres ikke.

## Netlify

### Build settings

`netlify.toml` setter følgende automatisk:

- Build command: `node scripts/build-netlify.mjs`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

Repoets rot skal være Netlify **Base directory**. Ikke legg inn en annen publish-mappe manuelt i Dashboard med mindre den samsvarer med `dist`.

### Environment variables

Legg variablene inn under **Project configuration → Environment variables**:

```text
SUPABASE_URL=https://nwnzqvfdtpytoqkosqpi.supabase.co
SUPABASE_ANON_KEY=<prosjektets sb_publishable_-nøkkel>
STORE_SLUG=kulor-rognan
```

Variablene må være tilgjengelige for **Functions**. På planer uten egne scopes brukes standard/all scopes. Sett dem minst for **Production**. Deploy Previews bør bare få samme verdier dersom alle som kan pushe preview-kode er betrodde.

Ikke legg inn `service_role`, secret key, databasepassord eller adminpassord.

Etter at miljøvariabler opprettes eller endres må du starte en ny deploy, fordi Functions får verdiene som gjaldt da deployen ble opprettet.

## Supabase Auth URL Configuration

Gå til **Authentication → URL Configuration**.

### Site URL

Sett den eksakte produksjonsadressen:

```text
https://DITT_NETLIFY_SITE_NAVN.netlify.app
```

Når et eget domene blir produksjonsadressen, byttes Site URL til dette domenet.

### Additional Redirect URLs

Legg inn:

```text
https://DITT_NETLIFY_SITE_NAVN.netlify.app/admin-demo/**
http://127.0.0.1:4173/admin-demo/**
http://localhost:4173/admin-demo/**
```

Vanlig innlogging med e-post/passord bruker ikke redirect i dagens løsning. URL-innstillingene er likevel nødvendige for fremtidige bekreftelses-, invitasjons- og passord-reset-lenker.

For Netlify Deploy Previews kan følgende eventuelt legges til:

```text
https://**--DITT_NETLIFY_SITE_NAVN.netlify.app/admin-demo/**
```

Bruk preview-wildcard bare når preview-grener og bidragsytere er betrodde. Produksjonsadressen skal alltid være eksakt.

## Deploy-rekkefølge

1. Opprett eller koble Netlify-siten til det private repoet.
2. Kontroller at Base directory er repoets rot.
3. Legg inn de tre miljøvariablene med Functions-scope.
4. Deploy produksjonsbranch.
5. Sett Supabase Site URL til den endelige Netlify-adressen.
6. Legg inn de nødvendige Additional Redirect URLs.
7. Trigger en ny Netlify-deploy dersom miljøvariablene ble endret etter første deploy.

Initial migration, fase-2-migrasjon og `seed.sql` skal ikke kjøres på nytt.

## Kontroll etter deploy

1. Åpne `https://DITT_NETLIFY_SITE_NAVN.netlify.app/.netlify/functions/public-config` og bekreft `"enabled":true`, riktig `storeSlug` og riktig Supabase-host. Publishable key i dette svaret er offentlig klientkonfigurasjon, ikke en hemmelig nøkkel.
2. Åpne `/nettbutikk-demo/` og bekreft at produkter/priser samsvarer med live Supabase.
3. Åpne `/admin-demo/` eller `/admin`, logg inn på nytt og bekreft riktig butikk/rolle.
4. Endre en ufarlig produkttekst eller pris, lagre og last nettbutikken på nytt uten deploy.
5. Last opp/bytt et testbilde og kontroller at det vises fra Supabase Storage.
6. Logg ut, last admin på nytt og bekreft at innlogging kreves.
7. Kontroller Netlify Function logs for `public-config` og nettleserkonsollen for feil.

Sessionen er origin-bundet i `sessionStorage`. Lokal innlogging overføres derfor ikke til Netlify-domenet; første innlogging online må gjøres på nytt.
