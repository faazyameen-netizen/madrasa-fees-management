-- ============================================================
-- Madrasa Fees Management — Students table setup
-- Run this in Supabase: Project -> SQL Editor -> New query -> Run
-- ============================================================

create extension if not exists "uuid-ossp";

create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  roll_no text not null,
  full_name text not null,
  course text,
  category text,
  guardian_name text,
  phone text,
  admission_date date,
  status text default 'Active',
  address text,
  created_at timestamptz default now()
);

-- Row Level Security must be enabled, but we add a permissive policy
-- so the frontend (using the public "anon" key) can read/write directly.
-- NOTE: this means anyone with your anon key + URL can modify this table.
-- That's fine for a private/internal admin tool, but if you ever expose
-- this publicly, swap this for Supabase Auth + per-user policies.
alter table students enable row level security;

drop policy if exists "Allow anon full access" on students;
create policy "Allow anon full access"
on students
for all
to anon
using (true)
with check (true);

-- Optional: sample seed data matching the screenshots
insert into students (roll_no, full_name, course, category, guardian_name, phone, admission_date, status, address)
values
  ('STU001', 'Muhammad Ali', 'Hifz', 'A', 'Abdul Rahman', '1234567890', '2024-01-10', 'Active', 'Kozhikode, Kerala'),
  ('STU002', 'Umar Farooq', 'Aalim', 'B', 'Yusuf Khan', '9876543210', '2024-02-15', 'Active', 'Malappuram, Kerala'),
  ('STU003', 'Fatima Noor', 'Nazra', 'C', 'Ibrahim Noor', '9123456780', '2024-03-01', 'Active', 'Kannur, Kerala'),
  ('STU004', 'Abdullah Khan', 'Hifz', 'A', 'Salim Khan', '9988776655', '2023-12-05', 'Inactive', 'Wayanad, Kerala'),
  ('STU005', 'Ayesha Bibi', 'Aalim', 'B', 'Rafiq Ahmed', '8877665544', '2024-04-20', 'Active', 'Kasaragod, Kerala');
