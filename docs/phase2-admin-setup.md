# Fase 2 – manuell Supabase-klargjøring

Initial migration og `seed.sql` er allerede kjørt og skal **ikke** kjøres på nytt.

## 1. Kjør fase 2-migrasjonen én gang

Åpne Supabase SQL Editor og kjør innholdet i:

`supabase/migrations/202608160002_admin_catalog.sql`

Migrasjonen:

- endrer lagrede lagerverdier fra `pa_lager`/`fjernlager` til `in_stock`/`remote_stock`
- oppdaterer tilhørende constraints
- oppretter den atomiske RPC-funksjonen `save_catalog_product`
- gir kun rollen `authenticated` rett til å kjøre funksjonen

Ikke kjør `202608160001_initial_storefront.sql` eller `seed.sql` på nytt.

## 2. Opprett adminbruker

1. Gå til **Authentication → Users** i Supabase Dashboard.
2. Opprett/inviter butikkens adminbruker og sørg for at e-postadressen er bekreftet.
3. Kopier brukerens UUID fra Auth-brukeren.

Ikke legg passord, access token eller service-role key i repoet, `stores.settings`, `stores.theme` eller frontend-konfigurasjon.

## 3. Koble brukeren til Kulør Rognan

Kjør følgende én gang i SQL Editor etter at `AUTH_USER_UUID` er erstattet med brukerens UUID:

```sql
insert into public.store_members (store_id, user_id, role)
select id, 'AUTH_USER_UUID'::uuid, 'admin'
from public.stores
where slug = 'kulor-rognan'
on conflict (store_id, user_id) do update
set role = excluded.role;
```

Admin-klienten leser denne medlemsraden etter innlogging. Alle katalogkall bruker brukerens JWT, og RLS kontrollerer `store_id`.

## 4. Test innlogging og CRUD

Start lokal server:

```powershell
node scripts/serve-local.mjs
```

Åpne `http://127.0.0.1:4173/admin-demo/` og test:

1. Logg inn.
2. Rediger et eksisterende produkt.
3. Endre pris, MVA, lagerstatus og leveringstid.
4. Last opp et produktbilde.
5. Lagre og kontroller at endringen vises i nettbutikken uten ny deploy.

## 5. Kjør authenticated RLS-test

Åpne `supabase/tests/phase2_authenticated_rls.sql`, erstatt `REPLACE_WITH_AUTH_USER_UUID` med Auth-brukerens UUID og kjør hele filen i SQL Editor.

Testen oppretter en midlertidig butikk nummer to i en transaksjon, bekrefter at Kulør-brukeren ikke kan lese eller skrive denne butikkens data, og avslutter med `rollback`.

Forventet resultat: **Success. No rows returned.**

## 6. Netlify før produksjon

Registrer disse miljøvariablene i Netlify med samme verdier som lokalt:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (publishable key)
- `STORE_SLUG=kulor-rognan`

Det skal ikke registreres eller eksponeres en service-role key i frontend.
