// ---- Shared appointment records ----
// The booking page, the customer dashboard, and the Health Score all read and
// write this one store, so a visit booked anywhere is visible everywhere.

export type ServiceId = "inspection" | "stove" | "geyser" | "pressure" | "leak" | "meter" | "regulator" | "connection";
export type AppointmentStatus = "Booked" | "Assigned" | "En Route" | "Reached" | "Started" | "Completed" | "Cancelled";

export type Appointment = {
  id: string;
  serviceId: ServiceId;
  service: string;
  date: string;
  slot: string;
  engineer: string;
  status: AppointmentStatus;
  reason: string;
  cost: string;
  createdAt: string;
  cancellationReason?: string;
};

export const appointmentsStorageKey = "suraksha:appointments:GJ-559210";

export const appointmentStatusFlow: AppointmentStatus[] = ["Booked", "Assigned", "En Route", "Reached", "Started", "Completed"];

export const starterAppointments: Appointment[] = [
  { id: "APT-2847", serviceId: "inspection", service: "Annual Safety Inspection", engineer: "Ramesh Kumar", date: "Mon · Jul 20", slot: "10:00 – 11:00", status: "Assigned", reason: "Annual safety check due", cost: "₹0 · covered", createdAt: "Jul 14" },
];

export function readAppointments(): Appointment[] {
  if (typeof window === "undefined") return starterAppointments;
  try {
    const saved = JSON.parse(window.localStorage.getItem(appointmentsStorageKey) ?? "null");
    if (Array.isArray(saved)) {
      const valid = saved.filter((item): item is Appointment => item && typeof item.id === "string" && typeof item.serviceId === "string");
      if (valid.length || saved.length === 0) return valid;
    }
  } catch { /* fall back to the starter schedule */ }
  return starterAppointments;
}

export function writeAppointments(appointments: Appointment[]) {
  try {
    window.localStorage.setItem(appointmentsStorageKey, JSON.stringify(appointments));
  } catch { /* the session remains usable without persistence */ }
}

/**
 * Returns the active inspection visit, creating one only when none exists —
 * booking from the dashboard never duplicates an already-scheduled visit.
 */
export function ensureInspectionBooked(): { created: boolean; appointment: Appointment } {
  const appointments = readAppointments();
  const existing = appointments.find((item) => item.serviceId === "inspection" && item.status !== "Cancelled" && item.status !== "Completed");
  if (existing) return { created: false, appointment: existing };
  const booking: Appointment = {
    id: `APT-${Math.floor(10000 + Math.random() * 89999)}`,
    serviceId: "inspection",
    service: "Annual Safety Inspection",
    engineer: "Ramesh Kumar",
    date: "Tomorrow · Jul 18",
    slot: "10:00 – 11:00",
    status: "Booked",
    reason: "Annual safety check due",
    cost: "₹0 · covered",
    createdAt: "Today",
  };
  writeAppointments([booking, ...appointments]);
  return { created: true, appointment: booking };
}
