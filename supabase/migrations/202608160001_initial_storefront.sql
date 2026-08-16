-- AEMA Storefront: first production-ready data model.
-- The pilot is single-tenant, but every tenant-owned row carries store_id.

create extension if not exists pgcrypto;

create table public.stores (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    name text not null,
    legal_name text,
    region text,
    footer_tagline text,
    logo_path text,
    address text not null,
    phone_display text,
    phone_href text,
    opening_hours jsonb not null default '[]'::jsonb check (jsonb_typeof(opening_hours) = 'array'),
    supplier_color_url text,
    supplier_color_label text,
    theme jsonb not null default '{}'::jsonb check (jsonb_typeof(theme) = 'object'),
    settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (id, slug)
);

create table public.store_members (
    store_id uuid not null references public.stores(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
    created_at timestamptz not null default now(),
    primary key (store_id, user_id)
);

create table public.categories (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    parent_id uuid,
    slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    name text not null,
    description text,
    image_path text,
    icon text,
    sort_order integer not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (store_id, slug),
    unique (id, store_id),
    foreign key (parent_id, store_id)
        references public.categories(id, store_id) on delete cascade
);

create table public.products (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    category_id uuid not null,
    slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    name text not null,
    short_description text,
    description text,
    use_area text,
    image_path text,
    icon text,
    tint text,
    variant_type text not null default 'storrelse',
    has_color boolean not null default false,
    vat_rate_basis_points integer not null default 2500
        check (vat_rate_basis_points between 0 and 10000),
    is_featured boolean not null default false,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (store_id, slug),
    unique (id, store_id),
    foreign key (category_id, store_id)
        references public.categories(id, store_id) on delete restrict
);

create table public.product_variants (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    product_id uuid not null,
    label text not null,
    sku text,
    price_ore integer not null check (price_ore >= 0),
    campaign_price_ore integer check (
        campaign_price_ore is null
        or (campaign_price_ore >= 0 and campaign_price_ore < price_ore)
    ),
    stock_status text not null default 'pa_lager'
        check (stock_status in ('pa_lager', 'fjernlager')),
    expected_lead_time text not null default 'Normalt klar for henting samme dag',
    supplier_reference text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (id, store_id),
    foreign key (product_id, store_id)
        references public.products(id, store_id) on delete cascade
);

create table public.colors (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete cascade,
    slug text not null,
    name text not null,
    code text not null,
    hex text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
    supplier text,
    is_featured boolean not null default true,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (store_id, slug),
    unique (id, store_id)
);

create table public.orders (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete restrict,
    order_number text not null,
    status text not null default 'ny'
        check (status in ('ny', 'under_blanding', 'klar_til_henting', 'utlevert', 'kansellert')),
    payment_status text not null default 'venter'
        check (payment_status in ('venter', 'betalt', 'mislykket', 'refundert', 'delvis_refundert')),
    stripe_checkout_session_id text,
    stripe_payment_intent_id text,
    customer_name text not null,
    customer_email text not null,
    customer_phone text not null,
    customer_comment text,
    currency text not null default 'nok' check (currency = lower(currency)),
    subtotal_ex_vat_ore integer not null check (subtotal_ex_vat_ore >= 0),
    vat_total_ore integer not null check (vat_total_ore >= 0),
    total_inc_vat_ore integer not null check (total_inc_vat_ore >= 0),
    vat_breakdown jsonb not null default '[]'::jsonb
        check (jsonb_typeof(vat_breakdown) = 'array'),
    paid_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (store_id, order_number),
    unique (stripe_checkout_session_id),
    check (subtotal_ex_vat_ore + vat_total_ore = total_inc_vat_ore),
    unique (id, store_id)
);

create table public.order_items (
    id uuid primary key default gen_random_uuid(),
    store_id uuid not null references public.stores(id) on delete restrict,
    order_id uuid not null,
    product_variant_id uuid,
    product_name text not null,
    product_slug text,
    variant_label text not null,
    variant_value text not null,
    color_label text,
    customer_comment text,
    quantity integer not null check (quantity > 0),
    unit_price_inc_vat_ore integer not null check (unit_price_inc_vat_ore >= 0),
    unit_price_ex_vat_ore integer not null check (unit_price_ex_vat_ore >= 0),
    vat_rate_basis_points integer not null
        check (vat_rate_basis_points between 0 and 10000),
    line_amount_ex_vat_ore integer not null check (line_amount_ex_vat_ore >= 0),
    line_vat_ore integer not null check (line_vat_ore >= 0),
    line_amount_inc_vat_ore integer not null check (line_amount_inc_vat_ore >= 0),
    stock_status text not null check (stock_status in ('pa_lager', 'fjernlager')),
    expected_lead_time text,
    created_at timestamptz not null default now(),
    check (line_amount_ex_vat_ore + line_vat_ore = line_amount_inc_vat_ore),
    check (unit_price_inc_vat_ore * quantity = line_amount_inc_vat_ore),
    foreign key (order_id, store_id)
        references public.orders(id, store_id) on delete cascade,
    foreign key (product_variant_id, store_id)
        references public.product_variants(id, store_id) on delete restrict
);

create index categories_store_parent_idx on public.categories(store_id, parent_id, sort_order);
create index products_store_category_idx on public.products(store_id, category_id, is_active, sort_order);
create index product_variants_store_product_idx on public.product_variants(store_id, product_id, is_active, sort_order);
create index colors_store_active_idx on public.colors(store_id, is_active, sort_order);
create index orders_store_status_idx on public.orders(store_id, status, created_at desc);
create index orders_store_payment_idx on public.orders(store_id, payment_status, created_at desc);
create index order_items_order_idx on public.order_items(order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger stores_set_updated_at before update on public.stores
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants
for each row execute function public.set_updated_at();
create trigger colors_set_updated_at before update on public.colors
for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.is_store_member(requested_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.store_members member
        where member.store_id = requested_store_id
          and member.user_id = auth.uid()
    );
$$;

revoke all on function public.is_store_member(uuid) from public;
grant execute on function public.is_store_member(uuid) to authenticated;

alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.colors enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy stores_public_read on public.stores
for select to anon using (is_active);
create policy stores_member_read on public.stores
for select to authenticated using (public.is_store_member(id));
create policy stores_member_update on public.stores
for update to authenticated
using (public.is_store_member(id))
with check (public.is_store_member(id));

create policy store_members_self_read on public.store_members
for select to authenticated using (user_id = auth.uid());

create policy categories_public_read on public.categories
for select to anon using (is_active);
create policy categories_member_all on public.categories
for all to authenticated
using (public.is_store_member(store_id))
with check (public.is_store_member(store_id));

create policy products_public_read on public.products
for select to anon using (is_active);
create policy products_member_all on public.products
for all to authenticated
using (public.is_store_member(store_id))
with check (public.is_store_member(store_id));

create policy product_variants_public_read on public.product_variants
for select to anon using (
    is_active
    and exists (
        select 1 from public.products product
        where product.id = product_variants.product_id
          and product.store_id = product_variants.store_id
          and product.is_active
    )
);
create policy product_variants_member_all on public.product_variants
for all to authenticated
using (public.is_store_member(store_id))
with check (public.is_store_member(store_id));

create policy colors_public_read on public.colors
for select to anon using (is_active);
create policy colors_member_all on public.colors
for all to authenticated
using (public.is_store_member(store_id))
with check (public.is_store_member(store_id));

create policy orders_member_read on public.orders
for select to authenticated using (public.is_store_member(store_id));
create policy orders_member_update on public.orders
for update to authenticated
using (public.is_store_member(store_id))
with check (public.is_store_member(store_id));

create policy order_items_member_read on public.order_items
for select to authenticated using (public.is_store_member(store_id));

-- Explicit grants keep internal supplier references and customer/order data away
-- from the public PostgREST role. Checkout will write orders server-side later.
revoke all on public.stores, public.store_members, public.categories, public.products,
    public.product_variants, public.colors, public.orders, public.order_items
from anon, authenticated;

grant select on public.stores, public.categories, public.products, public.colors to anon;
grant select (
    id, store_id, product_id, label, sku, price_ore, campaign_price_ore,
    stock_status, expected_lead_time, is_active, sort_order, created_at, updated_at
) on public.product_variants to anon;

grant select, update on public.stores to authenticated;
grant select on public.store_members to authenticated;
grant select, insert, update, delete on public.categories, public.products,
    public.product_variants, public.colors to authenticated;
grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;
grant select on public.order_items to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'store-assets',
    'store-assets',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy store_assets_public_read on storage.objects
for select to public using (bucket_id = 'store-assets');

create policy store_assets_member_insert on storage.objects
for insert to authenticated with check (
    bucket_id = 'store-assets'
    and public.is_store_member(case
        when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then ((storage.foldername(name))[1])::uuid
    end)
);

create policy store_assets_member_update on storage.objects
for update to authenticated
using (
    bucket_id = 'store-assets'
    and public.is_store_member(case
        when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then ((storage.foldername(name))[1])::uuid
    end)
)
with check (
    bucket_id = 'store-assets'
    and public.is_store_member(case
        when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then ((storage.foldername(name))[1])::uuid
    end)
);

create policy store_assets_member_delete on storage.objects
for delete to authenticated using (
    bucket_id = 'store-assets'
    and public.is_store_member(case
        when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$'
        then ((storage.foldername(name))[1])::uuid
    end)
);
