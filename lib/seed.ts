import { CustomerWithBills, Bill, CustomerType, BillStatus } from "./types";

// Local seed data — mirrors supabase/seed.sql so the app works before the DB
// is wired, and gives the explanation engine >1 year of history to reason over.

type Row = {
  cycle: string;
  start: string;
  end: string;
  open: number;
  close: number;
  rate: number;
  fixed: number;
  tax?: number;
  arrears?: number;
  lateFee?: number;
  manualAdjustment?: boolean;
  areaAverageScm?: number;
  status: BillStatus;
  dueDate?: string;
  paidOn?: string;
};

function buildBills(customerId: string, rows: Row[]): Bill[] {
  return rows.map((r, i) => {
    const units = r.close - r.open;
    const gas = +(units * r.rate).toFixed(2);
    const tax = r.tax ?? 0;
    const arrears = r.arrears ?? 0;
    const lateFee = r.lateFee ?? 0;
    const amount = +(gas + r.fixed + tax + arrears + lateFee).toFixed(2);
    return {
      id: `${customerId}-b${i + 1}`,
      customerId,
      cycleLabel: r.cycle,
      periodStart: r.start,
      periodEnd: r.end,
      openingReading: r.open,
      closingReading: r.close,
      unitsScm: units,
      ratePerScm: r.rate,
      gasCharge: gas,
      fixedCharge: r.fixed,
      tax,
      arrears,
      lateFee,
      manualAdjustment: r.manualAdjustment ?? false,
      areaAverageScm: r.areaAverageScm,
      amount,
      status: r.status,
      dueDate: r.dueDate,
      paidOn: r.paidOn,
    };
  });
}

// Reading meters accumulate; we derive open/close from a running total.
function cycles(
  base: number,
  seq: { cycle: string; start: string; end: string; units: number; rate: number; fixed: number; tax?: number; arrears?: number; lateFee?: number; manualAdjustment?: boolean; areaAverageScm?: number; status: BillStatus; dueDate?: string; paidOn?: string }[]
): Row[] {
  let reading = base;
  return seq.map((s) => {
    const open = reading;
    const close = reading + s.units;
    reading = close;
    return { cycle: s.cycle, start: s.start, end: s.end, open, close, rate: s.rate, fixed: s.fixed, tax: s.tax, arrears: s.arrears, lateFee: s.lateFee, manualAdjustment: s.manualAdjustment, areaAverageScm: s.areaAverageScm, status: s.status, dueDate: s.dueDate, paidOn: s.paidOn };
  });
}

const riddhi = cycles(4210, [
  { cycle: "Nov–Dec 2024", start: "2024-11-01", end: "2024-12-31", units: 41, rate: 33, fixed: 40, status: "paid", paidOn: "2025-01-08" },
  { cycle: "Jan–Feb 2025", start: "2025-01-01", end: "2025-02-28", units: 55, rate: 33, fixed: 40, status: "paid", paidOn: "2025-03-09" },
  { cycle: "Mar–Apr 2025", start: "2025-03-01", end: "2025-04-30", units: 33, rate: 33, fixed: 40, status: "paid", paidOn: "2025-05-07" },
  { cycle: "May–Jun 2025", start: "2025-05-01", end: "2025-06-30", units: 29, rate: 33, fixed: 40, status: "paid", paidOn: "2025-07-06" },
  { cycle: "Jul–Aug 2025", start: "2025-07-01", end: "2025-08-31", units: 31, rate: 36, fixed: 40, status: "paid", paidOn: "2025-09-08" },
  { cycle: "Sep–Oct 2025", start: "2025-09-01", end: "2025-10-31", units: 32, rate: 36, fixed: 40, status: "paid", paidOn: "2025-11-06" },
  { cycle: "Nov–Dec 2025", start: "2025-11-01", end: "2025-12-31", units: 50, rate: 36, fixed: 40, status: "paid", paidOn: "2026-01-09" },
  { cycle: "Jan–Feb 2026", start: "2026-01-01", end: "2026-02-28", units: 58, rate: 36, fixed: 40, areaAverageScm: 48, status: "due", dueDate: "2026-03-15" },
]);

const ankit = cycles(8850, [
  { cycle: "Nov–Dec 2024", start: "2024-11-01", end: "2024-12-31", units: 30, rate: 33, fixed: 40, status: "paid", paidOn: "2025-01-07" },
  { cycle: "Jan–Feb 2025", start: "2025-01-01", end: "2025-02-28", units: 44, rate: 33, fixed: 40, status: "paid", paidOn: "2025-03-08" },
  { cycle: "Mar–Apr 2025", start: "2025-03-01", end: "2025-04-30", units: 31, rate: 33, fixed: 40, status: "paid", paidOn: "2025-05-06" },
  { cycle: "May–Jun 2025", start: "2025-05-01", end: "2025-06-30", units: 30, rate: 33, fixed: 40, status: "paid", paidOn: "2025-07-05" },
  { cycle: "Jul–Aug 2025", start: "2025-07-01", end: "2025-08-31", units: 32, rate: 36, fixed: 40, status: "paid", paidOn: "2025-09-07" },
  { cycle: "Sep–Oct 2025", start: "2025-09-01", end: "2025-10-31", units: 33, rate: 36, fixed: 40, status: "paid", paidOn: "2025-11-05" },
  { cycle: "Nov–Dec 2025", start: "2025-11-01", end: "2025-12-31", units: 34, rate: 36, fixed: 40, status: "paid", paidOn: "2026-01-08" },
  { cycle: "Jan–Feb 2026", start: "2026-01-01", end: "2026-02-28", units: 72, rate: 36, fixed: 40, status: "due", dueDate: "2026-03-15" },
]);

const patel = cycles(120400, [
  { cycle: "Nov–Dec 2024", start: "2024-11-01", end: "2024-12-31", units: 220, rate: 52, fixed: 150, status: "paid", paidOn: "2025-01-06" },
  { cycle: "Jan–Feb 2025", start: "2025-01-01", end: "2025-02-28", units: 225, rate: 52, fixed: 150, status: "paid", paidOn: "2025-03-05" },
  { cycle: "Mar–Apr 2025", start: "2025-03-01", end: "2025-04-30", units: 218, rate: 52, fixed: 150, status: "paid", paidOn: "2025-05-05" },
  { cycle: "May–Jun 2025", start: "2025-05-01", end: "2025-06-30", units: 222, rate: 52, fixed: 150, status: "paid", paidOn: "2025-07-04" },
  { cycle: "Jul–Aug 2025", start: "2025-07-01", end: "2025-08-31", units: 219, rate: 55, fixed: 150, status: "paid", paidOn: "2025-09-06" },
  { cycle: "Sep–Oct 2025", start: "2025-09-01", end: "2025-10-31", units: 224, rate: 55, fixed: 150, status: "paid", paidOn: "2025-11-04" },
  { cycle: "Nov–Dec 2025", start: "2025-11-01", end: "2025-12-31", units: 221, rate: 55, fixed: 150, status: "paid", paidOn: "2026-01-07" },
  { cycle: "Jan–Feb 2026", start: "2026-01-01", end: "2026-02-28", units: 128, rate: 55, fixed: 150, status: "due", dueDate: "2026-03-15" },
]);

export const seedCustomers: CustomerWithBills[] = [
  {
    id: "cust-riddhi", accountNo: "GJ-559210", name: "Riddhi Mehta", type: "domestic" as CustomerType,
    area: "Maninagar, Ahmedabad", meterNo: "MTR-559210", phone: "+91 98••• ••231", email: "riddhi@example.com",
    vulnerable: false, connectionDate: "2021-06-14", bills: buildBills("cust-riddhi", riddhi),
  },
  {
    id: "cust-ankit", accountNo: "GJ-330118", name: "Ankit Shah", type: "domestic" as CustomerType,
    area: "Vastrapur, Ahmedabad", meterNo: "MTR-330118", phone: "+91 97••• ••884", email: "ankit@example.com",
    vulnerable: false, connectionDate: "2020-02-11", bills: buildBills("cust-ankit", ankit),
  },
  {
    id: "cust-patel", accountNo: "GJ-880142", name: "Patel Foods (Commercial)", type: "commercial" as CustomerType,
    area: "Naroda, Ahmedabad", meterNo: "MTR-880142", phone: "+91 96••• ••093", email: "accounts@patelfoods.example",
    vulnerable: false, connectionDate: "2019-09-03", bills: buildBills("cust-patel", patel),
  },
];
