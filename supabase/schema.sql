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
  late_fee        numeric not null default 0,
  manual_adjustment boolean not null default false,
  area_average_scm numeric,
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
