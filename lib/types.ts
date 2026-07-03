// ---- Domain types (mirror the Supabase schema) ----

export type CustomerType = "domestic" | "commercial";
export type BillStatus = "paid" | "due" | "overdue";

export type Bill = {
  id: string;
  customerId: string;
  cycleLabel: string;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  openingReading: number;
  closingReading: number;
  unitsScm: number;
  ratePerScm: number;
  gasCharge: number;
  fixedCharge: number;
  tax: number;
  arrears: number;
  amount: number;
  status: BillStatus;
  dueDate?: string;
  paidOn?: string;
};

export type Customer = {
  id: string;
  accountNo: string;
  name: string;
  type: CustomerType;
  area: string;
  address?: string;
  meterNo?: string;
  phone?: string;
  email?: string;
  vulnerable?: boolean;
  connectionDate?: string;
};

export type CustomerWithBills = Customer & {
  // bills sorted oldest -> newest
  bills: Bill[];
};

// ---- Explanation engine output ----

export type Verdict = "normal" | "leak" | "under";
export type LeakLevel = "none" | "watch" | "high";

export type ExplanationFactor = {
  label: string;
  amount: number; // signed rupees contribution vs previous cycle
  detail: string;
};

export type BillExplanation = {
  billId: string;
  verdict: Verdict;
  confidence: number; // 0-99
  headline: string;
  narrative: string;
  factors: ExplanationFactor[]; // decomposition of amount change vs previous cycle
  amountDeltaVsPrev: number;
  // leak assessment
  leakPct: number; // 0-99 estimated probability of a leak
  leakLevel: LeakLevel;
  leakReasons: string[]; // human-readable signals behind the score
  away: boolean; // was the premise unoccupied this cycle
  comparisons: {
    vsPrevPct: number | null;
    vsYearPct: number | null;
    vsAvgPct: number | null;
    avgUnits: number | null;
    yoyLabel: string | null;
  };
  safety: {
    flag: "safe" | "investigate" | "meter";
    title: string;
    message: string;
  };
};
