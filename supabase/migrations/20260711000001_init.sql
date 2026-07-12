-- Styliste: stylist toolbox schema (profiles, clients, items, wardrobe, lookbooks)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per stylist, mirrors auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  business_name text not null default '',
  brand_color text not null default '#0f766e',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: own update" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, business_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'business_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- clients: a stylist's client roster
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  email text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index clients_stylist_idx on public.clients (stylist_id);

alter table public.clients enable row level security;

create policy "clients: own all" on public.clients
  for all using (auth.uid() = stylist_id) with check (auth.uid() = stylist_id);

-- ---------------------------------------------------------------------------
-- items: the stylist's item library (recommendable products)
-- hue/saturation/lightness are derived from color_hex at write time so we can
-- filter by hue range in SQL (the color-exact search slice).
-- ---------------------------------------------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  brand text not null default '',
  category text not null default 'other',
  price_cents integer,
  product_url text not null default '',
  image_url text not null default '',
  color_hex text not null default '#808080',
  hue smallint not null default 0,        -- 0-359
  saturation smallint not null default 0, -- 0-100
  lightness smallint not null default 50, -- 0-100
  created_at timestamptz not null default now()
);

create index items_stylist_idx on public.items (stylist_id);
create index items_hue_idx on public.items (stylist_id, hue);

alter table public.items enable row level security;

create policy "items: own all" on public.items
  for all using (auth.uid() = stylist_id) with check (auth.uid() = stylist_id);

-- ---------------------------------------------------------------------------
-- wardrobe_items: what a client already owns
-- ---------------------------------------------------------------------------
create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  stylist_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  brand text not null default '',
  category text not null default 'other',
  color_hex text not null default '#808080',
  hue smallint not null default 0,
  saturation smallint not null default 0,
  lightness smallint not null default 50,
  image_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index wardrobe_client_idx on public.wardrobe_items (client_id);

alter table public.wardrobe_items enable row level security;

create policy "wardrobe: own all" on public.wardrobe_items
  for all using (auth.uid() = stylist_id) with check (auth.uid() = stylist_id);

-- ---------------------------------------------------------------------------
-- lookbooks + lookbook_items: shareable curated collections
-- ---------------------------------------------------------------------------
create table public.lookbooks (
  id uuid primary key default gen_random_uuid(),
  stylist_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  title text not null,
  description text not null default '',
  share_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now()
);

create index lookbooks_stylist_idx on public.lookbooks (stylist_id);

alter table public.lookbooks enable row level security;

create policy "lookbooks: own all" on public.lookbooks
  for all using (auth.uid() = stylist_id) with check (auth.uid() = stylist_id);

create table public.lookbook_items (
  id uuid primary key default gen_random_uuid(),
  lookbook_id uuid not null references public.lookbooks (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  note text not null default '',
  position integer not null default 0,
  unique (lookbook_id, item_id)
);

create index lookbook_items_lookbook_idx on public.lookbook_items (lookbook_id);

alter table public.lookbook_items enable row level security;

create policy "lookbook_items: own all" on public.lookbook_items
  for all using (
    exists (
      select 1 from public.lookbooks l
      where l.id = lookbook_id and l.stylist_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.lookbooks l
      where l.id = lookbook_id and l.stylist_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Public share access: clients open lookbooks via an unguessable token, no
-- login. RLS stays locked; this security-definer RPC is the only public door.
-- ---------------------------------------------------------------------------
create or replace function public.get_lookbook_by_token(p_token text)
returns jsonb
language sql
security definer set search_path = public
stable
as $$
  select jsonb_build_object(
    'id', l.id,
    'title', l.title,
    'description', l.description,
    'created_at', l.created_at,
    'client_name', c.name,
    'stylist', jsonb_build_object(
      'full_name', p.full_name,
      'business_name', p.business_name,
      'brand_color', p.brand_color
    ),
    'items', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', li.id,
            'note', li.note,
            'position', li.position,
            'name', i.name,
            'brand', i.brand,
            'category', i.category,
            'price_cents', i.price_cents,
            'product_url', i.product_url,
            'image_url', i.image_url,
            'color_hex', i.color_hex
          ) order by li.position, li.id
        )
        from public.lookbook_items li
        join public.items i on i.id = li.item_id
        where li.lookbook_id = l.id
      ),
      '[]'::jsonb
    )
  )
  from public.lookbooks l
  join public.profiles p on p.id = l.stylist_id
  left join public.clients c on c.id = l.client_id
  where l.share_token = p_token;
$$;

revoke all on function public.get_lookbook_by_token(text) from public;
grant execute on function public.get_lookbook_by_token(text) to anon, authenticated;
