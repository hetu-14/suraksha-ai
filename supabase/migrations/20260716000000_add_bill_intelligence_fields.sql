-- Fields required by WhyMyBill intelligence. Values are written by the billing
-- pipeline, never inferred from the customer-facing UI.
alter table public.bills
  add column if not exists late_fee numeric not null default 0,
  add column if not exists manual_adjustment boolean not null default false,
  add column if not exists area_average_scm numeric;
