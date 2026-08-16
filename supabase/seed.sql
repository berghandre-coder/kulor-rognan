-- Pilot content only. This file is tenant-specific seed data, not platform core.
-- Run after migrations, then upload logo/product images to store-assets/<store-id>/.

do $$
declare
    pilot_store_id uuid;
begin
    insert into public.stores (
        slug, name, legal_name, region, footer_tagline, address,
        phone_display, phone_href, opening_hours,
        supplier_color_url, supplier_color_label
    ) values (
        'kulor-rognan',
        'Kulør Rognan',
        'Kulør Rognan Fargehandel',
        'Din lokale ekspert i Saltdal',
        'Din lokale ekspert på maling, gulv og solskjerming i Saltdal. Vi leverer kvalitet og fagkunnskap.',
        'Strandgata 11, 8250 Rognan',
        '75 69 06 50',
        '+4775690650',
        '[{"label":"Man - Fre","value":"09:00 - 17:00"},{"label":"Lørdag","value":"10:00 - 14:00"},{"label":"Søndag","value":"Stengt","muted":true}]'::jsonb,
        'https://www.butinoxinterior.no/vare-farger/',
        'Butinox'
    )
    on conflict (slug) do update set
        name = excluded.name,
        legal_name = excluded.legal_name,
        region = excluded.region,
        footer_tagline = excluded.footer_tagline,
        address = excluded.address,
        phone_display = excluded.phone_display,
        phone_href = excluded.phone_href,
        opening_hours = excluded.opening_hours,
        supplier_color_url = excluded.supplier_color_url,
        supplier_color_label = excluded.supplier_color_label;

    select id into pilot_store_id from public.stores where slug = 'kulor-rognan';

    insert into public.categories (store_id, slug, name, description, sort_order)
    values
        (pilot_store_id, 'inne', 'Maling inne', 'Vegg, tak, panel og gulv - velg riktig produkt for rommet ditt.', 10),
        (pilot_store_id, 'ute', 'Maling ute', 'Fasade, terrasse og mur - værbestandige produkter for norsk klima.', 20),
        (pilot_store_id, 'tilbehor', 'Tilbehør', 'Pensler, ruller, tape og forarbeid du trenger for et godt resultat.', 30)
    on conflict (store_id, slug) do update set
        name = excluded.name,
        description = excluded.description,
        sort_order = excluded.sort_order,
        is_active = true;

    insert into public.categories (store_id, parent_id, slug, name, sort_order)
    select pilot_store_id, parent.id, child.slug, child.name, child.sort_order
    from (values
        ('inne', 'veggmaling', 'Veggmaling', 11),
        ('inne', 'takmaling', 'Takmaling', 12),
        ('inne', 'panel-dor-list', 'Panel, dør og list', 13),
        ('inne', 'grunning-inne', 'Grunning', 14),
        ('inne', 'gulvmaling', 'Gulvmaling', 15),
        ('ute', 'hus-fasade', 'Hus og fasade', 21),
        ('ute', 'terrasse-platting', 'Terrasse og platting', 22),
        ('ute', 'dor-vindu', 'Dør og vindu', 23),
        ('ute', 'mur-grunnmur', 'Mur og grunnmur', 24),
        ('ute', 'grunning-forarbeid-ute', 'Grunning og forarbeid', 25),
        ('tilbehor', 'pensler', 'Pensler', 31),
        ('tilbehor', 'ruller', 'Ruller', 32),
        ('tilbehor', 'tape', 'Tape', 33),
        ('tilbehor', 'sparkel-forarbeid', 'Sparkel og forarbeid', 34)
    ) as child(parent_slug, slug, name, sort_order)
    join public.categories parent
      on parent.store_id = pilot_store_id and parent.slug = child.parent_slug
    on conflict (store_id, slug) do update set
        parent_id = excluded.parent_id,
        name = excluded.name,
        sort_order = excluded.sort_order,
        is_active = true;

    insert into public.products (
        store_id, category_id, slug, name, short_description, use_area,
        icon, tint, variant_type, has_color, vat_rate_basis_points,
        is_featured, sort_order
    )
    select
        pilot_store_id, category.id, seed.slug, seed.name, seed.short_description,
        seed.use_area, seed.icon, seed.tint, seed.variant_type, seed.has_color,
        2500, seed.is_featured, seed.sort_order
    from (values
        ('veggmaling-inne', 'veggmaling', 'Kulør Interiør Matt', 'Slitesterk mattmalt veggmaling for innendørs bruk. Lett å påføre, god dekkevne.', 'Vegg innendørs', 'format_paint', 'inne', 'spann', true, true, 10),
        ('takmaling-inne', 'takmaling', 'Kulør Interiør Takmaling', 'Sprutfri takmaling med god kontrastevne og lav lukt. Enkel å jobbe med over hodehøyde.', 'Tak innendørs', 'roofing', 'inne', 'spann', true, false, 20),
        ('snekkermaling-inne', 'panel-dor-list', 'Kulør Snekkermaling Innendørs', 'Halvblank maling for panel, dører og listverk. Robust og enkel å holde ren.', 'Panel, dør og list', 'door_front', 'inne', 'spann', true, true, 30),
        ('fasademaling-ute', 'hus-fasade', 'Kulør Fasademaling', 'Værbestandig akrylmaling for tre- og panelfasader. God dekkevne og lang holdbarhet.', 'Hus og fasade', 'home_work', 'ute', 'spann', true, true, 40),
        ('terrassebeis-ute', 'terrasse-platting', 'Kulør Terrassebeis', 'Beskyttende beis for terrassebord og platting. Fremhever trestrukturen.', 'Terrasse og platting', 'deck', 'ute', 'spann', true, true, 50),
        ('mursealer-ute', 'mur-grunnmur', 'Kulør Mursealer', 'Beskyttende, transparent impregnering for mur og grunnmur. Farges ikke.', 'Mur og grunnmur', 'domain', 'ute', 'spann', false, false, 60),
        ('flatpensel', 'pensler', 'Kulør Flatpensel', 'Flatpensel med syntetbust for jevne strøk med både vann- og oljebasert maling.', 'Pensler', 'brush', 'tilbehor', 'bredde', false, false, 70),
        ('malerrull', 'ruller', 'Kulør Malerrull Profi', 'Malerrull med skumkjerne for jevn påføring. Velg lugglengde etter overflaten du skal male.', 'Ruller', 'construction', 'tilbehor', 'rullbredde', false, false, 80),
        ('malerteip', 'tape', 'Kulør Malerteip', 'Malerteip som gir rene avslutningslinjer. Tåler inntil 5 dager utendørs.', 'Avdekking', 'horizontal_rule', 'tilbehor', 'tape', false, false, 90),
        ('sparkelmasse', 'sparkel-forarbeid', 'Kulør Sparkelmasse', 'Ferdigblandet sparkelmasse for utjevning av mindre skader og sprekker før maling.', 'Forarbeid', 'texture', 'tilbehor', 'storrelse', false, false, 100)
    ) as seed(slug, category_slug, name, short_description, use_area, icon, tint, variant_type, has_color, is_featured, sort_order)
    join public.categories category
      on category.store_id = pilot_store_id and category.slug = seed.category_slug
    on conflict (store_id, slug) do update set
        category_id = excluded.category_id,
        name = excluded.name,
        short_description = excluded.short_description,
        use_area = excluded.use_area,
        icon = excluded.icon,
        tint = excluded.tint,
        variant_type = excluded.variant_type,
        has_color = excluded.has_color,
        vat_rate_basis_points = excluded.vat_rate_basis_points,
        is_featured = excluded.is_featured,
        sort_order = excluded.sort_order,
        is_active = true;

    -- Replace variants in seed environments so reruns remain deterministic.
    delete from public.product_variants
    where store_id = pilot_store_id
      and product_id in (select id from public.products where store_id = pilot_store_id);

    insert into public.product_variants (
        store_id, product_id, label, price_ore, campaign_price_ore,
        stock_status, expected_lead_time, sort_order
    )
    select
        pilot_store_id, product.id, seed.label, seed.price_ore,
        seed.campaign_price_ore, seed.stock_status, seed.expected_lead_time,
        seed.sort_order
    from (values
        ('veggmaling-inne', '0,68 l', 34900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 1),
        ('veggmaling-inne', '2,7 l', 109000, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 2),
        ('veggmaling-inne', '9 l', 299000, 279000, 'in_stock', 'Normalt klar for henting samme dag', 3),
        ('takmaling-inne', '0,68 l', 32900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 1),
        ('takmaling-inne', '2,7 l', 99000, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 2),
        ('takmaling-inne', '9 l', 279000, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 3),
        ('snekkermaling-inne', '0,68 l', 39900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 1),
        ('snekkermaling-inne', '2,7 l', 119000, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 2),
        ('fasademaling-ute', '2,7 l', 129000, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 1),
        ('fasademaling-ute', '9 l', 349000, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 2),
        ('terrassebeis-ute', '0,68 l', 42900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 1),
        ('terrassebeis-ute', '2,7 l', 109000, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 2),
        ('mursealer-ute', '2,7 l', 37900, null::integer, 'remote_stock', '3–7 dager', 1),
        ('mursealer-ute', '9 l', 99000, null::integer, 'remote_stock', '3–7 dager', 2),
        ('flatpensel', '35 mm', 9900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 1),
        ('flatpensel', '50 mm', 12900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 2),
        ('flatpensel', '70 mm', 15900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 3),
        ('malerrull', '100 mm – kort lugg (glatte flater)', 7900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 1),
        ('malerrull', '180 mm – middels lugg (standard vegg og tak)', 9900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 2),
        ('malerrull', '250 mm – lang lugg (grov struktur og mur)', 12900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 3),
        ('malerteip', '19 mm × 33 m', 4900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 1),
        ('malerteip', '30 mm × 33 m', 6900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 2),
        ('malerteip', '50 mm × 33 m', 8900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 3),
        ('sparkelmasse', '0,33 kg', 6900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 1),
        ('sparkelmasse', '1 kg', 12900, null::integer, 'in_stock', 'Normalt klar for henting samme dag', 2),
        ('sparkelmasse', '5 kg', 34900, null::integer, 'remote_stock', '3–7 dager', 3)
    ) as seed(product_slug, label, price_ore, campaign_price_ore, stock_status, expected_lead_time, sort_order)
    join public.products product
      on product.store_id = pilot_store_id and product.slug = seed.product_slug;

    insert into public.colors (store_id, slug, name, code, hex, sort_order)
    values
        (pilot_store_id, 'kritthvit', 'Kritthvit', 'S 0502-Y', '#F5F1E8', 1),
        (pilot_store_id, 'kremhvit', 'Kremhvit', 'S 0505-Y20R', '#F1E8DA', 2),
        (pilot_store_id, 'lys-gra', 'Lys Grå', 'S 2002-Y', '#D8D5CE', 3),
        (pilot_store_id, 'varm-beige', 'Varm Beige', 'S 1010-Y30R', '#E4D3BB', 4),
        (pilot_store_id, 'sandbeige', 'Sandbeige', 'S 1515-Y30R', '#C9AE8C', 5),
        (pilot_store_id, 'duegra', 'Duegrå', 'S 3005-Y20R', '#B8ADA0', 6),
        (pilot_store_id, 'skifergra', 'Skifergrå', 'S 6502-B', '#6E7275', 7),
        (pilot_store_id, 'antrasitt', 'Antrasitt', 'S 7500-N', '#4A4A48', 8),
        (pilot_store_id, 'sort', 'Sort', 'S 9000-N', '#1B1B1B', 9),
        (pilot_store_id, 'havbla', 'Havblå', 'S 4030-R80B', '#3B5B7A', 10),
        (pilot_store_id, 'skoggronn', 'Skoggrønn', 'S 6020-G10Y', '#3C5A3E', 11),
        (pilot_store_id, 'teglrod', 'Teglrød', 'S 3560-Y70R', '#A24632', 12)
    on conflict (store_id, slug) do update set
        name = excluded.name,
        code = excluded.code,
        hex = excluded.hex,
        sort_order = excluded.sort_order,
        is_active = true;
end;
$$;
