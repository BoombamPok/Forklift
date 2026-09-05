-- Roles, profiles, and the helper function every RLS policy in this
-- project is built on. See docs/decisions for the reasoning.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'manager', 'staff', 'read_only');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'staff',
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth.users row - holds the app role and display name Supabase Auth does not.';

alter table public.profiles enable row level security;

-- Generic "touch updated_at" trigger reused by every table below that has one.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- security definer: RLS policies call this to check the caller's role
-- without recursing back into profiles' own RLS.
create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Every new auth.users row gets a profile row automatically, defaulting to
-- the least-privileged non-viewer role. Admins can promote via `profiles`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "Admins can update profiles"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
