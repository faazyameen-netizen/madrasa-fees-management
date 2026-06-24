create extension if not exists "uuid-ossp";

create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_no text not null unique,
  student_id uuid not null references students(id) on delete cascade,
  month integer not null,
  year integer not null,
  total_amount numeric(10, 2) not null default 0,
  paid_amount numeric(10, 2) not null default 0,
  status text not null default 'Unpaid',
  created_at timestamptz default now()
);

create unique index if not exists invoices_student_month_year_idx
  on invoices (student_id, month, year);

alter table invoices enable row level security;

drop policy if exists "Allow anon full access" on invoices;
create policy "Allow anon full access"
on invoices
for all
to anon
using (true)
with check (true);