-- ============================================================
-- Madrasa Fees Management — Scholarship Categories setup
-- Run this in Supabase: Project -> SQL Editor -> New query -> Run
-- (Run only once — running twice will duplicate the 3 seed rows.
--  If that happens: delete from scholarship_categories;
--  then re-run just the insert block below.)
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists scholarship_categories (
  id uuid primary key default uuid_generate_v4(),
  category_letter text not null,
  category_name text not null,
  discount_percentage numeric(5, 2) not null default 0,
  description text,
  created_at timestamptz default now()
);

alter table scholarship_categories enable row level security;

drop policy if exists "Allow anon full access" on scholarship_categories;
create policy "Allow anon full access"
on scholarship_categories
for all
to anon
using (true)
with check (true);

insert into scholarship_categories (category_letter, category_name, discount_percentage, description)
values
  ('A', 'Category A', 50, '50% waiver on total applicable fees'),
  ('B', 'Category B', 30, '30% waiver on total applicable fees'),
  ('C', 'Category C', 10, '10% waiver on total applicable fees');