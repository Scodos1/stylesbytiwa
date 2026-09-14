-- Styles By Tiwa — Supabase schema + RLS (run in Supabase SQL editor)
-- Project: https://zlglsosfzrybgfuvwldk.supabase.co

-- 1) Tables
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric not null check (price > 0),
  category text not null check (category in ('vintage_shirts','two_piece_long','two_piece_short','greg_shirt')),
  image text not null default '',
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  badge text not null default '',
  description text not null default '',
  button_label text not null default 'View Products',
  button_link text not null default 'shop.html',
  sort_order int not null default 0,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  video_url text not null default '',
  poster_url text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 2) Enable RLS
alter table public.products enable row level security;
alter table public.collections enable row level security;
alter table public.videos enable row level security;

-- 3) Public read (shop + homepage work without login)
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (true);

drop policy if exists "public read collections" on public.collections;
create policy "public read collections" on public.collections for select using (true);

drop policy if exists "public read videos" on public.videos;
create policy "public read videos" on public.videos for select using (true);

-- 4) Admin-only write (single allowed email — matches admin.js protectPage)
-- Replace with your admin email if different:
-- admin email in repo: alagbefareed@gmail.com
drop policy if exists "admin write products" on public.products;
create policy "admin write products" on public.products
  for all using (auth.jwt() ->> 'email' = 'alagbefareed@gmail.com')
  with check (auth.jwt() ->> 'email' = 'alagbefareed@gmail.com');

drop policy if exists "admin write collections" on public.collections;
create policy "admin write collections" on public.collections
  for all using (auth.jwt() ->> 'email' = 'alagbefareed@gmail.com')
  with check (auth.jwt() ->> 'email' = 'alagbefareed@gmail.com');

drop policy if exists "admin write videos" on public.videos;
create policy "admin write videos" on public.videos
  for all using (auth.jwt() ->> 'email' = 'alagbefareed@gmail.com')
  with check (auth.jwt() ->> 'email' = 'alagbefareed@gmail.com');

-- 5) Storage bucket: product-images (public read, admin write)
insert into storage.buckets (id, name, public)
values ('product-images','product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read product-images" on storage.objects;
create policy "public read product-images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "admin write product-images" on storage.objects;
create policy "admin write product-images" on storage.objects
  for all using (bucket_id = 'product-images' and auth.jwt() ->> 'email' = 'alagbefareed@gmail.com')
  with check (bucket_id = 'product-images' and auth.jwt() ->> 'email' = 'alagbefareed@gmail.com');

-- 6) Quick verification queries (run after):
-- select * from public.products order by created_at desc limit 5;
-- select * from public.collections order by sort_order asc limit 5;
