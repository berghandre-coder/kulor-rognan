-- AEMA Storefront phase 2: authenticated catalog administration.
-- Run once after 202608160001_initial_storefront.sql. Do not rerun seed.sql.

-- Use stable, language-neutral stock values in persisted data.
alter table public.product_variants
    drop constraint if exists product_variants_stock_status_check;

alter table public.order_items
    drop constraint if exists order_items_stock_status_check;

update public.product_variants
set stock_status = case stock_status
    when 'pa_lager' then 'in_stock'
    when 'fjernlager' then 'remote_stock'
    else stock_status
end;

update public.order_items
set stock_status = case stock_status
    when 'pa_lager' then 'in_stock'
    when 'fjernlager' then 'remote_stock'
    else stock_status
end;

alter table public.product_variants
    alter column stock_status set default 'in_stock',
    add constraint product_variants_stock_status_check
        check (stock_status in ('in_stock', 'remote_stock'));

alter table public.order_items
    add constraint order_items_stock_status_check
        check (stock_status in ('in_stock', 'remote_stock'));

-- Save a product and all submitted variants in one transaction. The caller
-- supplies a store id, but RLS and this explicit membership check both enforce
-- that it belongs to the authenticated user. No service-role client is needed.
create or replace function public.save_catalog_product(
    product_data jsonb,
    variant_data jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
    target_store_id uuid;
    target_product_id uuid;
    target_variant_id uuid;
    saved_variant_id uuid;
    submitted_variant_ids uuid[] := array[]::uuid[];
    variant_row jsonb;
begin
    if jsonb_typeof(product_data) <> 'object' then
        raise exception 'product_data must be an object';
    end if;

    if jsonb_typeof(variant_data) <> 'array' or jsonb_array_length(variant_data) = 0 then
        raise exception 'At least one product variant is required';
    end if;

    target_store_id := nullif(product_data ->> 'store_id', '')::uuid;
    if target_store_id is null or not public.is_store_member(target_store_id) then
        raise exception 'Not authorized for requested store' using errcode = '42501';
    end if;

    target_product_id := coalesce(
        nullif(product_data ->> 'id', '')::uuid,
        gen_random_uuid()
    );

    insert into public.products (
        id,
        store_id,
        category_id,
        slug,
        name,
        short_description,
        description,
        use_area,
        image_path,
        icon,
        tint,
        variant_type,
        has_color,
        vat_rate_basis_points,
        is_featured,
        is_active,
        sort_order
    ) values (
        target_product_id,
        target_store_id,
        (product_data ->> 'category_id')::uuid,
        product_data ->> 'slug',
        product_data ->> 'name',
        nullif(product_data ->> 'short_description', ''),
        nullif(product_data ->> 'description', ''),
        nullif(product_data ->> 'use_area', ''),
        nullif(product_data ->> 'image_path', ''),
        nullif(product_data ->> 'icon', ''),
        nullif(product_data ->> 'tint', ''),
        coalesce(nullif(product_data ->> 'variant_type', ''), 'storrelse'),
        coalesce((product_data ->> 'has_color')::boolean, false),
        coalesce((product_data ->> 'vat_rate_basis_points')::integer, 2500),
        coalesce((product_data ->> 'is_featured')::boolean, false),
        coalesce((product_data ->> 'is_active')::boolean, true),
        coalesce((product_data ->> 'sort_order')::integer, 0)
    )
    on conflict (id) do update set
        category_id = excluded.category_id,
        slug = excluded.slug,
        name = excluded.name,
        short_description = excluded.short_description,
        description = excluded.description,
        use_area = excluded.use_area,
        image_path = excluded.image_path,
        icon = excluded.icon,
        tint = excluded.tint,
        variant_type = excluded.variant_type,
        has_color = excluded.has_color,
        vat_rate_basis_points = excluded.vat_rate_basis_points,
        is_featured = excluded.is_featured,
        is_active = excluded.is_active,
        sort_order = excluded.sort_order
    where products.store_id = target_store_id
    returning id into target_product_id;

    if target_product_id is null then
        raise exception 'Product does not belong to requested store' using errcode = '42501';
    end if;

    for variant_row in select value from jsonb_array_elements(variant_data)
    loop
        target_variant_id := coalesce(
            nullif(variant_row ->> 'id', '')::uuid,
            gen_random_uuid()
        );
        saved_variant_id := null;

        insert into public.product_variants (
            id,
            store_id,
            product_id,
            label,
            sku,
            price_ore,
            campaign_price_ore,
            stock_status,
            expected_lead_time,
            supplier_reference,
            is_active,
            sort_order
        ) values (
            target_variant_id,
            target_store_id,
            target_product_id,
            variant_row ->> 'label',
            nullif(variant_row ->> 'sku', ''),
            (variant_row ->> 'price_ore')::integer,
            nullif(variant_row ->> 'campaign_price_ore', '')::integer,
            coalesce(nullif(variant_row ->> 'stock_status', ''), 'in_stock'),
            coalesce(nullif(variant_row ->> 'expected_lead_time', ''), 'Normalt klar for henting samme dag'),
            nullif(variant_row ->> 'supplier_reference', ''),
            coalesce((variant_row ->> 'is_active')::boolean, true),
            coalesce((variant_row ->> 'sort_order')::integer, 0)
        )
        on conflict (id) do update set
            label = excluded.label,
            sku = excluded.sku,
            price_ore = excluded.price_ore,
            campaign_price_ore = excluded.campaign_price_ore,
            stock_status = excluded.stock_status,
            expected_lead_time = excluded.expected_lead_time,
            supplier_reference = excluded.supplier_reference,
            is_active = excluded.is_active,
            sort_order = excluded.sort_order
        where product_variants.store_id = target_store_id
          and product_variants.product_id = target_product_id
        returning id into saved_variant_id;

        if saved_variant_id is null then
            raise exception 'Variant does not belong to requested product and store' using errcode = '42501';
        end if;

        submitted_variant_ids := array_append(submitted_variant_ids, saved_variant_id);
    end loop;

    -- Preserve rows referenced by order history; variants removed in admin are
    -- deactivated instead of deleted.
    update public.product_variants
    set is_active = false
    where store_id = target_store_id
      and product_id = target_product_id
      and not (id = any(submitted_variant_ids));

    return target_product_id;
end;
$$;

revoke all on function public.save_catalog_product(jsonb, jsonb) from public;
grant execute on function public.save_catalog_product(jsonb, jsonb) to authenticated;
