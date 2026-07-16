import { getSupabase, hasSupabaseEnv } from "./supabaseClient";
import { seedCustomers } from "./seed";
import { Bill, CustomerWithBills } from "./types";

// Data source of record. Uses Supabase when configured, otherwise falls back
// to the local seed so the app is fully demonstrable before the DB is wired.

export const usingLiveDb = hasSupabaseEnv();

/* eslint-disable */
function mapBill(row: any): Bill {
  return {
    id: row.id,
    customerId: row.customer_id,
    cycleLabel: row.cycle_label,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    openingReading: Number(row.opening_reading),
    closingReading: Number(row.closing_reading),
    unitsScm: Number(row.units_scm),
    ratePerScm: Number(row.rate_per_scm),
    gasCharge: Number(row.gas_charge),
    fixedCharge: Number(row.fixed_charge),
    tax: Number(row.tax ?? 0),
    arrears: Number(row.arrears ?? 0),
    lateFee: Number(row.late_fee ?? 0),
    manualAdjustment: Boolean(row.manual_adjustment ?? false),
    areaAverageScm: row.area_average_scm == null ? undefined : Number(row.area_average_scm),
    amount: Number(row.amount),
    status: row.status,
    dueDate: row.due_date ?? undefined,
    paidOn: row.paid_on ?? undefined,
  };
}

function mapCustomer(row: any, bills: Bill[]): CustomerWithBills {
  return {
    id: row.id,
    accountNo: row.account_no,
    name: row.name,
    type: row.type,
    area: row.area,
    address: row.address ?? undefined,
    meterNo: row.meter_no ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    vulnerable: row.vulnerable ?? false,
    connectionDate: row.connection_date ?? undefined,
    bills: bills
      .filter((b) => b.customerId === row.id)
      .sort((a, b) => +new Date(a.periodEnd) - +new Date(b.periodEnd)),
  };
}

export async function getCustomersWithBills(): Promise<CustomerWithBills[]> {
  const sb = getSupabase();
  if (!sb) return seedCustomers;

  try {
    const [{ data: custs, error: e1 }, { data: bills, error: e2 }] = await Promise.all([
      sb.from("customers").select("*").order("name"),
      sb.from("bills").select("*").order("period_end"),
    ]);
    if (e1 || e2 || !custs || !bills) throw e1 || e2;
    const mappedBills = bills.map(mapBill);
    return custs.map((c) => mapCustomer(c, mappedBills));
  } catch (err) {
    console.error("[bills] Supabase fetch failed, using seed fallback:", err);
    return seedCustomers;
  }
}
