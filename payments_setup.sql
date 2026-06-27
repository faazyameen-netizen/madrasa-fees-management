create extension if not exists "uuid-ossp";

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(10, 2) not null,
  payment_mode text not null default 'Cash',
  payment_date date not null default current_date,
  note text,
  created_at timestamptz default now()
);

alter table payments enable row level security;

drop policy if exists "Allow anon full access" on payments;
create policy "Allow anon full access"
on payments
for all
to anon
using (true)
with check (true);