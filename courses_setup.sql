-- ============================================================
-- Madrasa Fees Management — Courses table setup
-- Run this in Supabase: Project -> SQL Editor -> New query -> Run
-- (Only run this once — running it twice will duplicate the seed rows,
--  same as supabase_setup.sql. If that happens, delete from courses;
--  then re-run just the insert block below.)
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  course_name text not null,
  tuition_fee numeric(10, 2) not null default 0,
  exam_fee numeric(10, 2) not null default 0,
  book_fee numeric(10, 2) not null default 0,
  created_at timestamptz default now()
);

-- Row Level Security must be enabled, but we add a permissive policy
-- so the frontend (using the public "anon" key) can read/write directly.
-- Same approach as the students table — fine for a private/internal
-- admin tool, not for a publicly exposed one.
alter table courses enable row level security;

drop policy if exists "Allow anon full access" on courses;
create policy "Allow anon full access"
on courses
for all
to anon
using (true)
with check (true);

-- Seed data matching the Courses & Fee Structure mockup
insert into courses (course_name, tuition_fee, exam_fee, book_fee)
values
  ('Hifz', 1500, 500, 2000),
  ('Aalim', 1200, 400, 1500),
  ('Nazra', 800, 300, 1000),
  ('Quran Tajweed', 1000, 350, 1200);
