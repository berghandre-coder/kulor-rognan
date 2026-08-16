-- MANUAL SECURITY TEST — do not run before 202608160002_admin_catalog.sql.
-- Replace REPLACE_WITH_AUTH_USER_UUID below with the Auth user id that is a
-- Kulør Rognan member. There is only one value to replace.
-- The whole test is transactional and rolls back its isolated fixture.

begin;

insert into public.stores (id, slug, name, address, is_active)
values (
    '22222222-2222-4222-8222-222222222222',
    'rls-isolation-test',
    'RLS Isolation Test',
    'Testveien 1',
    false
);

insert into public.categories (id, store_id, slug, name, is_active)
values (
    '22222222-2222-4222-8222-222222222223',
    '22222222-2222-4222-8222-222222222222',
    'test-category',
    'Test category',
    false
);

insert into public.products (
    id, store_id, category_id, slug, name, vat_rate_basis_points, is_active
)
values (
    '22222222-2222-4222-8222-222222222224',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222223',
    'private-test-product',
    'Private test product',
    2500,
    false
);

-- Supabase's auth.uid() reads request.jwt.claim.sub. Set that dedicated claim
-- explicitly, and also set the JSON claims object for auth.jwt()/compatibility.
select set_config(
    'aema.test_user_id',
    'REPLACE_WITH_AUTH_USER_UUID',
    true
);
select set_config(
    'request.jwt.claim.sub',
    current_setting('aema.test_user_id'),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
    'request.jwt.claims',
    jsonb_build_object(
        'sub', current_setting('aema.test_user_id'),
        'role', 'authenticated'
    )::text,
    true
);
set local role authenticated;

do $$
declare
    expected_user_id uuid := current_setting('aema.test_user_id')::uuid;
    actual_user_id uuid := auth.uid();
begin
    if actual_user_id is distinct from expected_user_id then
        raise exception 'FAILED: JWT simulation error. auth.uid()=%, expected=%',
            actual_user_id,
            expected_user_id;
    end if;

    if not exists (
        select 1
        from public.store_members
        where user_id = expected_user_id
    ) then
        raise exception 'FAILED: auth.uid() is correct, but no readable store_members row exists for user %',
            expected_user_id;
    end if;

    if not exists (select 1 from public.stores where slug = 'kulor-rognan') then
        raise exception 'FAILED: membership exists, but authenticated user cannot read own Kulør Rognan store';
    end if;

    if exists (select 1 from public.stores where slug = 'rls-isolation-test') then
        raise exception 'FAILED: authenticated user can read another store';
    end if;

    update public.products
    set name = 'RLS WRITE LEAK'
    where id = '22222222-2222-4222-8222-222222222224';

    if found then
        raise exception 'FAILED: authenticated user can update another store';
    end if;

    begin
        insert into public.products (
            store_id, category_id, slug, name, vat_rate_basis_points, is_active
        ) values (
            '22222222-2222-4222-8222-222222222222',
            '22222222-2222-4222-8222-222222222223',
            'forbidden-insert',
            'Forbidden insert',
            2500,
            false
        );
        raise exception 'FAILED: authenticated user can insert into another store';
    exception
        when sqlstate '42501' then null;
    end;
end;
$$;

reset role;
rollback;

-- Expected result: Success. No rows returned.
