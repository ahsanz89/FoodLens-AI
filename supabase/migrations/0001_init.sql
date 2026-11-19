-- FoodLens AI schema. Run with `supabase db push`.
create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Guest',
  avatar_url text,
  auth_provider text not null default 'anonymous',
  preferred_language text not null default 'en',
  is_guest boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  dietary_preferences jsonb not null default '[]',
  allergies jsonb not null default '[]',
  cuisine_preferences jsonb not null default '[]',
  cooking_skill text not null default 'Beginner',
  preferred_cooking_time integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  category text not null default 'Other',
  image_url text,
  created_at timestamptz not null default now()
);

create table public.kitchen_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id),
  custom_name text,
  quantity numeric,
  unit text,
  expiry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ingredient_id is not null or custom_name is not null)
);
create index on public.kitchen_ingredients (user_id);

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  image_path text,                 -- storage path (private bucket), deleted after analysis
  processing_status text not null default 'pending',
  detected_ingredients jsonb not null default '[]',
  confirmed_ingredients jsonb not null default '[]',
  model_provider text,
  created_at timestamptz not null default now()
);
create index on public.scans (user_id, created_at desc);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  cuisine text not null default 'Other',
  difficulty text not null default 'Easy',
  prep_time_minutes integer not null default 0,
  cook_time_minutes integer not null default 0,
  servings integer not null default 2,
  image_url text,
  instructions jsonb not null default '[]',
  nutrition_estimate jsonb,
  allergens jsonb not null default '[]',
  source_type text not null default 'seed',
  created_at timestamptz not null default now()
);
create index on public.recipes (cuisine);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id),
  ingredient_name text not null,
  quantity numeric,
  unit text,
  is_optional boolean not null default false
);
create index on public.recipe_ingredients (recipe_id);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  ingredient_name text not null,
  quantity numeric,
  unit text,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.shopping_list_items (user_id);

create table public.recipe_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index on public.recipe_history (user_id, viewed_at desc);

create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  request_type text not null,
  model_provider text not null,
  token_usage integer,
  estimated_cost numeric,
  status text not null,
  created_at timestamptz not null default now()
);
create index on public.ai_usage_logs (user_id, created_at desc);

-- Aggregate-only ad analytics: deliberately no user_id column to avoid a parallel ad profile.
create table public.ad_impression_events (
  id uuid primary key default gen_random_uuid(),
  ad_format text not null,
  placement text not null,
  event_type text not null,
  created_at timestamptz not null default now()
);

-- Server-authoritative daily quota (config row, so limits are adjustable without an app release)
create table public.app_settings (key text primary key, value jsonb not null);
insert into public.app_settings values ('free_scans_per_day', '3');

create table public.scan_credits (
  user_id uuid not null references public.users(id) on delete cascade,
  day date not null default current_date,
  used integer not null default 0,
  bonus integer not null default 0,
  primary key (user_id, day)
);

-- Atomically consume one scan. Returns false when the user is over the limit.
create or replace function public.consume_scan(p_user uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare lim int; ok boolean;
begin
  select (value)::int into lim from app_settings where key = 'free_scans_per_day';
  insert into scan_credits (user_id, day) values (p_user, current_date) on conflict do nothing;
  update scan_credits set used = used + 1
   where user_id = p_user and day = current_date and used < coalesce(lim, 3) + bonus
  returning true into ok;
  return coalesce(ok, false);
end $$;

-- Called by the reward-verification endpoint only (service role).
create or replace function public.grant_bonus_scan(p_user uuid) returns void
language sql security definer set search_path = public as $$
  insert into scan_credits (user_id, day, bonus) values (p_user, current_date, 1)
  on conflict (user_id, day) do update set bonus = scan_credits.bonus + 1;
$$;
revoke all on function public.consume_scan(uuid), public.grant_bonus_scan(uuid) from public, anon, authenticated;

-- Create profile rows automatically for new (incl. anonymous) auth users.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into users (id, email, is_guest, auth_provider)
  values (new.id, new.email, coalesce(new.is_anonymous, false), coalesce(new.raw_app_meta_data->>'provider', 'anonymous'));
  insert into user_preferences (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------
alter table public.users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.kitchen_ingredients enable row level security;
alter table public.scans enable row level security;
alter table public.favorites enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.recipe_history enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.scan_credits enable row level security;
alter table public.ad_impression_events enable row level security;
alter table public.app_settings enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;

create policy "own profile" on public.users for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own prefs" on public.user_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own kitchen" on public.kitchen_ingredients for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own scans" on public.scans for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own shopping" on public.shopping_list_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own history" on public.recipe_history for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "read own usage" on public.ai_usage_logs for select using (user_id = auth.uid());   -- writes: service role only
create policy "read own credits" on public.scan_credits for select using (user_id = auth.uid());  -- writes: functions only
create policy "insert ad events" on public.ad_impression_events for insert to authenticated with check (true); -- aggregate, no reads for clients
create policy "read catalogue" on public.ingredients for select to authenticated using (true);
create policy "read recipes" on public.recipes for select to authenticated using (true);
create policy "read recipe ingredients" on public.recipe_ingredients for select to authenticated using (true);
-- app_settings: no policies => clients cannot read or write; service role bypasses RLS.

-- Private bucket for scan photos; objects live under <user_id>/...
insert into storage.buckets (id, name, public) values ('scans', 'scans', false) on conflict do nothing;
create policy "own scan files" on storage.objects for all to authenticated
  using (bucket_id = 'scans' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'scans' and (storage.foldername(name))[1] = auth.uid()::text);

-- Guest -> account migration: link the anonymous user to an email/Google identity via
-- supabase.auth.updateUser / linkIdentity. The user id is preserved, so no data copy is needed.
