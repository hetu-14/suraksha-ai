-- WhyMyBill: schema + seed (generated migration)

-- ============================================================================
--  SuRaksha AI · WhyMyBill schema  (run in Supabase → SQL Editor)
-- ============================================================================

create extension if not exists pgcrypto;

-- ---- Customers ------------------------------------------------------------
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  account_no      text unique not null,
  name            text not null,
  type            text not null check (type in ('domestic','commercial')),
  area            text not null,
  address         text,
  meter_no        text,
  phone           text,
  email           text,
  vulnerable      boolean default false,
  connection_date date,
  created_at      timestamptz default now()
);

-- ---- Tariff history (rate revisions over time) ----------------------------
create table if not exists public.tariffs (
  id             uuid primary key default gen_random_uuid(),
  customer_type  text not null check (customer_type in ('domestic','commercial')),
  rate_per_scm   numeric not null,
  fixed_charge   numeric not null default 0,
  tax_pct        numeric not null default 0,
  effective_from date not null
);

-- ---- Bills ----------------------------------------------------------------
create table if not exists public.bills (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.customers(id) on delete cascade,
  cycle_label     text not null,
  period_start    date not null,
  period_end      date not null,
  opening_reading numeric not null,
  closing_reading numeric not null,
  units_scm       numeric generated always as (closing_reading - opening_reading) stored,
  rate_per_scm    numeric not null,
  gas_charge      numeric not null,
  fixed_charge    numeric not null default 0,
  tax             numeric not null default 0,
  arrears         numeric not null default 0,
  amount          numeric not null,
  status          text not null default 'due' check (status in ('paid','due','overdue')),
  due_date        date,
  paid_on         date,
  generated_at    timestamptz default now()
);

create index if not exists bills_customer_period_idx on public.bills (customer_id, period_end);

-- ---- Row Level Security ---------------------------------------------------
-- Demo-friendly: anonymous READ only. No write policies => inserts/updates
-- require the service role (used by your seed / billing jobs).
-- For production, replace the read policies below with auth.uid()-scoped ones.
alter table public.customers enable row level security;
alter table public.bills     enable row level security;
alter table public.tariffs   enable row level security;

drop policy if exists "public read customers" on public.customers;
drop policy if exists "public read bills"     on public.bills;
drop policy if exists "public read tariffs"   on public.tariffs;

create policy "public read customers" on public.customers for select using (true);
create policy "public read bills"     on public.bills     for select using (true);
create policy "public read tariffs"   on public.tariffs   for select using (true);

-- ===== seed =====
-- ============================================================================
--  SuRaksha AI · WhyMyBill seed  (run AFTER schema.sql, in Supabase SQL Editor)
--  Mirrors lib/seed.ts so live DB and local fallback behave identically.
-- ============================================================================

truncate table public.bills, public.customers restart identity cascade;

insert into public.customers (account_no, name, type, area, meter_no, phone, email, connection_date) values
  ('GJ-559210', 'Riddhi Mehta',              'domestic',   'Maninagar, Ahmedabad', 'MTR-559210', '+91 98••• ••231', 'riddhi@example.com',            '2021-06-14'),
  ('GJ-330118', 'Ankit Shah',                'domestic',   'Vastrapur, Ahmedabad', 'MTR-330118', '+91 97••• ••884', 'ankit@example.com',             '2020-02-11'),
  ('GJ-880142', 'Patel Foods (Commercial)',  'commercial', 'Naroda, Ahmedabad',    'MTR-880142', '+91 96••• ••093', 'accounts@patelfoods.example',   '2019-09-03');

insert into public.tariffs (customer_type, rate_per_scm, fixed_charge, tax_pct, effective_from) values
  ('domestic',   33, 40, 0, '2024-01-01'),
  ('domestic',   36, 40, 0, '2025-07-01'),
  ('commercial', 52, 150, 0, '2024-01-01'),
  ('commercial', 55, 150, 0, '2025-07-01');

-- Riddhi — normal seasonal (winter heating, in line with last winter)
with c as (select id from public.customers where account_no = 'GJ-559210')
insert into public.bills (customer_id, cycle_label, period_start, period_end, opening_reading, closing_reading, rate_per_scm, gas_charge, fixed_charge, amount, status, due_date, paid_on)
select c.id, v.* from c, (values
  ('Nov–Dec 2024', '2024-11-01'::date, '2024-12-31'::date, 4210, 4251, 33, 1353, 40, 1393, 'paid', null::date, '2025-01-08'::date),
  ('Jan–Feb 2025', '2025-01-01',       '2025-02-28',       4251, 4306, 33, 1815, 40, 1855, 'paid', null,       '2025-03-09'),
  ('Mar–Apr 2025', '2025-03-01',       '2025-04-30',       4306, 4339, 33, 1089, 40, 1129, 'paid', null,       '2025-05-07'),
  ('May–Jun 2025', '2025-05-01',       '2025-06-30',       4339, 4368, 33,  957, 40,  997, 'paid', null,       '2025-07-06'),
  ('Jul–Aug 2025', '2025-07-01',       '2025-08-31',       4368, 4399, 36, 1116, 40, 1156, 'paid', null,       '2025-09-08'),
  ('Sep–Oct 2025', '2025-09-01',       '2025-10-31',       4399, 4431, 36, 1152, 40, 1192, 'paid', null,       '2025-11-06'),
  ('Nov–Dec 2025', '2025-11-01',       '2025-12-31',       4431, 4481, 36, 1800, 40, 1840, 'paid', null,       '2026-01-09'),
  ('Jan–Feb 2026', '2026-01-01',       '2026-02-28',       4481, 4539, 36, 2088, 40, 2128, 'due',  '2026-03-15', null)
) as v(cycle_label, period_start, period_end, opening_reading, closing_reading, rate_per_scm, gas_charge, fixed_charge, amount, status, due_date, paid_on);

-- Ankit — possible in-premise leak (sustained, non-seasonal doubling)
with c as (select id from public.customers where account_no = 'GJ-330118')
insert into public.bills (customer_id, cycle_label, period_start, period_end, opening_reading, closing_reading, rate_per_scm, gas_charge, fixed_charge, amount, status, due_date, paid_on)
select c.id, v.* from c, (values
  ('Nov–Dec 2024', '2024-11-01'::date, '2024-12-31'::date, 8850, 8880, 33,  990, 40, 1030, 'paid', null::date, '2025-01-07'::date),
  ('Jan–Feb 2025', '2025-01-01',       '2025-02-28',       8880, 8924, 33, 1452, 40, 1492, 'paid', null,       '2025-03-08'),
  ('Mar–Apr 2025', '2025-03-01',       '2025-04-30',       8924, 8955, 33, 1023, 40, 1063, 'paid', null,       '2025-05-06'),
  ('May–Jun 2025', '2025-05-01',       '2025-06-30',       8955, 8985, 33,  990, 40, 1030, 'paid', null,       '2025-07-05'),
  ('Jul–Aug 2025', '2025-07-01',       '2025-08-31',       8985, 9017, 36, 1152, 40, 1192, 'paid', null,       '2025-09-07'),
  ('Sep–Oct 2025', '2025-09-01',       '2025-10-31',       9017, 9050, 36, 1188, 40, 1228, 'paid', null,       '2025-11-05'),
  ('Nov–Dec 2025', '2025-11-01',       '2025-12-31',       9050, 9084, 36, 1224, 40, 1264, 'paid', null,       '2026-01-08'),
  ('Jan–Feb 2026', '2026-01-01',       '2026-02-28',       9084, 9156, 36, 2592, 40, 2632, 'due',  '2026-03-15', null)
) as v(cycle_label, period_start, period_end, opening_reading, closing_reading, rate_per_scm, gas_charge, fixed_charge, amount, status, due_date, paid_on);

-- Patel Foods — meter under-registration (sharp unexplained drop)
with c as (select id from public.customers where account_no = 'GJ-880142')
insert into public.bills (customer_id, cycle_label, period_start, period_end, opening_reading, closing_reading, rate_per_scm, gas_charge, fixed_charge, amount, status, due_date, paid_on)
select c.id, v.* from c, (values
  ('Nov–Dec 2024', '2024-11-01'::date, '2024-12-31'::date, 120400, 120620, 52, 11440, 150, 11590, 'paid', null::date, '2025-01-06'::date),
  ('Jan–Feb 2025', '2025-01-01',       '2025-02-28',       120620, 120845, 52, 11700, 150, 11850, 'paid', null,       '2025-03-05'),
  ('Mar–Apr 2025', '2025-03-01',       '2025-04-30',       120845, 121063, 52, 11336, 150, 11486, 'paid', null,       '2025-05-05'),
  ('May–Jun 2025', '2025-05-01',       '2025-06-30',       121063, 121285, 52, 11544, 150, 11694, 'paid', null,       '2025-07-04'),
  ('Jul–Aug 2025', '2025-07-01',       '2025-08-31',       121285, 121504, 55, 12045, 150, 12195, 'paid', null,       '2025-09-06'),
  ('Sep–Oct 2025', '2025-09-01',       '2025-10-31',       121504, 121728, 55, 12320, 150, 12470, 'paid', null,       '2025-11-04'),
  ('Nov–Dec 2025', '2025-11-01',       '2025-12-31',       121728, 121949, 55, 12155, 150, 12305, 'paid', null,       '2026-01-07'),
  ('Jan–Feb 2026', '2026-01-01',       '2026-02-28',       121949, 122077, 55,  7040, 150,  7190, 'due',  '2026-03-15', null)
) as v(cycle_label, period_start, period_end, opening_reading, closing_reading, rate_per_scm, gas_charge, fixed_charge, amount, status, due_date, paid_on);
