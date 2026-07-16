"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Card, Kpi } from "@/components/ui";
import Typewriter from "@/components/Typewriter";
import { connectionStorageKey, normalizeConnectionStatus } from "@/lib/connectionStatus";
import { healthProfileStorageKey, normalizeHealthProfile } from "@/lib/healthScore";
import { AlertCircle, Calendar, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, Download, FileText, MapPin, Navigation, Phone, RefreshCw, ShieldAlert, Star, Truck, UserRound, Wrench, X } from "lucide-react";

type ServiceId = "inspection" | "stove" | "geyser" | "pressure" | "leak" | "meter" | "regulator" | "connection";
type AppointmentStatus = "Booked" | "Assigned" | "On route" | "Reached site" | "Work started" | "Completed" | "Cancelled";
type Appointment = { id: string; serviceId: ServiceId; service: string; date: string; slot: string; engineer: string; status: AppointmentStatus; reason: string; cost: string; createdAt: string; cancellationReason?: string };

const storageKey = "suraksha:appointments:GJ-559210";
const statusFlow: AppointmentStatus[] = ["Booked", "Assigned", "On route", "Reached site", "Work started", "Completed"];
const days = ["Today · Jul 16", "Tomorrow · Jul 17", "Sat · Jul 18", "Sun · Jul 19", "Mon · Jul 20", "Tue · Jul 21", "Wed · Jul 22"];
const slots = ["09:00 – 10:00", "10:00 – 11:00", "11:00 – 12:00", "12:00 – 01:00", "02:00 – 03:00", "03:00 – 04:00", "04:00 – 05:00", "05:00 – 06:00"];
const baseBlocked: Record<string, string[]> = { "Today · Jul 16": ["09:00 – 10:00", "02:00 – 03:00"], "Tomorrow · Jul 17": ["10:00 – 11:00"], "Sat · Jul 18": ["12:00 – 01:00", "04:00 – 05:00"] };

const services: Array<{ id: ServiceId; label: string; duration: string; cost: string; icon: string; specialist: string; preparation: string[] }> = [
  { id: "inspection", label: "Annual Safety Inspection", duration: "60 min", cost: "₹0 · covered", icon: "🛡️", specialist: "Safety Specialist", preparation: ["Keep meter and kitchen access clear", "Ensure an adult is present", "Keep appliance controls accessible"] },
  { id: "stove", label: "Gas Stove Issue", duration: "60 min", cost: "₹300 – ₹700 if parts are needed", icon: "🍳", specialist: "Appliance Technician", preparation: ["Turn off the stove and isolation valve", "Keep the stove area clear", "Do not attempt a repair yourself"] },
  { id: "geyser", label: "PNG Geyser Issue", duration: "75 min", cost: "₹300 – ₹700 if parts are needed", icon: "🚿", specialist: "Appliance Technician", preparation: ["Switch off the geyser", "Keep the bathroom accessible", "Share any error code with the engineer"] },
  { id: "pressure", label: "Low Pressure Complaint", duration: "45 min", cost: "₹0 · covered", icon: "〰️", specialist: "Network Technician", preparation: ["Note when pressure is lowest", "Keep stove knobs switched off", "Keep meter accessible"] },
  { id: "leak", label: "Gas Leakage Inspection", duration: "60 min", cost: "₹0 · safety service", icon: "⚠️", specialist: "Safety Specialist", preparation: ["Turn off the isolation valve", "Open doors and windows", "Do not use electrical switches or flames"] },
  { id: "meter", label: "Meter Check / Replacement", duration: "45 min", cost: "₹0 · covered", icon: "📊", specialist: "Meter Specialist", preparation: ["Keep the meter area accessible", "Keep your last bill handy", "Ensure an adult is present"] },
  { id: "regulator", label: "Regulator Servicing", duration: "30 min", cost: "₹0 · preventive service", icon: "⚙️", specialist: "Safety Specialist", preparation: ["Turn off the isolation valve", "Keep the regulator accessible", "Do not disconnect any pipe yourself"] },
  { id: "connection", label: "New Connection Setup", duration: "120 min", cost: "₹0 · included in application", icon: "🔗", specialist: "Installation Specialist", preparation: ["Keep kitchen route accessible", "Keep layout approval ready", "An adult owner should be present"] },
];

const reasons: Array<{ id: string; label: string; service: ServiceId; priority: "Normal" | "High" | "Critical"; message: string }> = [
  { id: "annual", label: "Annual safety check due", service: "inspection", priority: "Normal", message: "A preventive safety visit is recommended based on your service profile." },
  { id: "smell", label: "Gas smell or suspected leak", service: "leak", priority: "Critical", message: "This could be a safety emergency. Do not wait for a normal booking." },
  { id: "pressure", label: "Low flame or low pressure", service: "pressure", priority: "High", message: "A network and appliance pressure check is recommended." },
  { id: "bill", label: "High or unusual gas bill", service: "inspection", priority: "High", message: "Review WhyMyBill first. Book a safety inspection if unusual use continues." },
  { id: "meter", label: "Meter reading or display issue", service: "meter", priority: "Normal", message: "A meter specialist can inspect the reading and device." },
  { id: "regulator", label: "Regulator or pipeline concern", service: "regulator", priority: "High", message: "Regulator servicing is recommended before the concern becomes urgent." },
  { id: "stove", label: "Gas stove issue", service: "stove", priority: "Normal", message: "An appliance technician can inspect the stove safely." },
  { id: "geyser", label: "PNG geyser issue", service: "geyser", priority: "Normal", message: "An appliance technician can inspect the geyser and gas line." },
];

const engineers = [
  { name: "Ramesh Kumar", specialty: "Safety Specialist", visits: 324, experience: "5 years", rating: 4.8, initials: "RK" },
  { name: "Sunil Sharma", specialty: "Meter Specialist", visits: 287, experience: "6 years", rating: 4.7, initials: "SS" },
  { name: "Manoj Patel", specialty: "Appliance Technician", visits: 241, experience: "4 years", rating: 4.9, initials: "MP" },
];

const starterAppointments: Appointment[] = [{ id: "APT-2847", serviceId: "inspection", service: "Annual Safety Inspection", engineer: "Ramesh Kumar", date: "Mon · Jul 20", slot: "10:00 – 11:00", status: "Assigned", reason: "Annual safety check due", cost: "₹0 · covered", createdAt: "Jul 14" }];
const pastAppointments = [
  { id: "APT-2631", service: "Meter Check", engineer: "Sunil Sharma", date: "Jun 12, 2026", finding: "Gas pressure normal · no meter issue detected", rating: 5 },
  { id: "APT-2502", service: "Gas Appliance Repair", engineer: "Manoj Patel", date: "May 05, 2026", finding: "Stove burner cleaned · operation restored", rating: 4 },
];

function StarRating({ rating }: { rating: number }) { return <span className="inline-flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-ink-200"}`} />)}</span>; }
function serviceFor(id: ServiceId | null) { return services.find((service) => service.id === id) ?? services[0]; }

export default function AppointmentBooking() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<ServiceId | null>(null);
  const [selectedReason, setSelectedReason] = useState("annual");
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>(starterAppointments);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("Timing conflict");
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [healthNeedsInspection, setHealthNeedsInspection] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (Array.isArray(saved)) setAppointments(saved.filter((item): item is Appointment => item && typeof item.id === "string" && typeof item.serviceId === "string"));
      const health = normalizeHealthProfile(JSON.parse(window.localStorage.getItem(healthProfileStorageKey) ?? "null"));
      setHealthNeedsInspection(!health.preventiveInspectionBooked);
      const queryService = new URLSearchParams(window.location.search).get("service");
      if (queryService === "connection") { setSelectedService("connection"); setSelectedReason("annual"); setStep(2); }
    } catch { /* Safe defaults remain available when browser storage is unavailable. */ }
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) { try { window.localStorage.setItem(storageKey, JSON.stringify(appointments)); } catch { /* Session state remains usable. */ } } }, [appointments, loaded]);

  const reason = reasons.find((item) => item.id === selectedReason) ?? reasons[0];
  const recommendation = selectedService ? serviceFor(selectedService) : serviceFor(reason.service);
  const activeAppointments = appointments.filter((appointment) => appointment.status !== "Cancelled" && appointment.status !== "Completed");
  const earliest = useMemo(() => slots.find((slot) => !(baseBlocked[days[0]] ?? []).includes(slot)) ?? "Tomorrow · 10:00", []);
  const assignedEngineer = engineers.find((engineer) => engineer.specialty === recommendation.specialist) ?? engineers[0];
  const selectedAppointment = activeAppointments[0];

  function selectReason(id: string) {
    const next = reasons.find((item) => item.id === id) ?? reasons[0];
    setSelectedReason(id);
    setSelectedService(next.service);
  }

  function isSlotBlocked(slot: string) {
    return (baseBlocked[selectedDay] ?? []).includes(slot) || appointments.some((appointment) => appointment.date === selectedDay && appointment.slot === slot && appointment.status !== "Cancelled" && appointment.id !== reschedulingId);
  }

  function confirmBooking() {
    if (!selectedService || !selectedSlot) return;
    const service = serviceFor(selectedService);
    const booking: Appointment = { id: reschedulingId ?? `APT-${Math.floor(10000 + Math.random() * 89999)}`, serviceId: service.id, service: service.label, date: selectedDay, slot: selectedSlot, engineer: assignedEngineer.name, status: "Booked", reason: reason.label, cost: service.cost, createdAt: "Today" };
    setAppointments((current) => reschedulingId ? current.map((item) => item.id === reschedulingId ? booking : item) : [booking, ...current]);
    if (selectedService === "connection") {
      try { const connection = normalizeConnectionStatus(JSON.parse(window.localStorage.getItem(connectionStorageKey) ?? "null")); window.localStorage.setItem(connectionStorageKey, JSON.stringify({ ...connection, appointment: `${selectedDay} · ${selectedSlot}` })); } catch { /* Booking is still confirmed. */ }
    }
    if (selectedService === "inspection" || selectedService === "regulator") {
      try { const health = normalizeHealthProfile(JSON.parse(window.localStorage.getItem(healthProfileStorageKey) ?? "null")); window.localStorage.setItem(healthProfileStorageKey, JSON.stringify({ ...health, preventiveInspectionBooked: true })); setHealthNeedsInspection(false); } catch { /* The appointment remains confirmed. */ }
    }
    setNotice(reschedulingId ? "Your appointment has been rescheduled and the engineer has been notified." : "Appointment booked. You will receive confirmation and engineer updates here.");
    setReschedulingId(null); setSelectedSlot(null); setStep(1);
  }

  function beginReschedule(appointment: Appointment) { setReschedulingId(appointment.id); setSelectedService(appointment.serviceId); setSelectedDay(appointment.date); setSelectedSlot(null); setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function cancelAppointment() { if (!cancelTarget) return; setAppointments((current) => current.map((item) => item.id === cancelTarget ? { ...item, status: "Cancelled", cancellationReason: cancelReason } : item)); setNotice("Appointment cancelled. You can book a new slot whenever you need one."); setCancelTarget(null); }
  function advanceStatus(id: string) { setAppointments((current) => current.map((item) => { const at = statusFlow.indexOf(item.status); return item.id === id && at >= 0 && at < statusFlow.length - 1 ? { ...item, status: statusFlow[at + 1] } : item; })); }
  function downloadReport(service: string, date: string, findings: string) { const report = `SuRaksha AI – Digital Service Report\n\nService: ${service}\nDate: ${date}\nFindings: ${findings}\n\nSafety reminder: If you smell gas, close the isolation valve, open windows, and call the emergency helpline.`; const url = URL.createObjectURL(new Blob([report], { type: "text/plain" })); const link = document.createElement("a"); link.href = url; link.download = `${service.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.txt`; link.click(); URL.revokeObjectURL(url); }

  return <div className="space-y-6 reveal">
    {notice && <div className="fixed top-4 right-4 z-50 max-w-sm bg-brand-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-start gap-3 anim-fade-up"><CheckCircle2 className="w-5 h-5 shrink-0" /><span className="text-sm font-semibold flex-1">{notice}</span><button onClick={() => setNotice(null)} aria-label="Dismiss message"><X className="w-4 h-4" /></button></div>}
    <header className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-sky-900 text-white p-6 sm:p-8 relative overflow-hidden shadow-soft"><div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-sky-500/20 rounded-full blur-3xl" /><div className="relative max-w-3xl"><p className="text-sky-300 text-xs font-semibold uppercase tracking-widest">Service scheduling & visit tracking</p><h1 className="text-2xl sm:text-3xl font-extrabold mt-1"><Typewriter speed={40} segments={[{ text: "Book the right gas service." }]} /></h1><p className="text-ink-300 mt-2 text-sm">Tell us what is happening, choose a real available slot, then track your engineer and service report in one place.</p></div></header>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Kpi label="Upcoming visits" value={activeAppointments.length} sub={activeAppointments[0] ? `${activeAppointments[0].date} · ${activeAppointments[0].slot}` : "No visit scheduled"} icon={<Calendar className="w-4 h-4" />} /><Kpi label="Earliest appointment" value={earliest} sub="Today · live slot availability" icon={<Clock3 className="w-4 h-4" />} /><Kpi label="Engineer arrival" value={selectedAppointment?.status === "On route" ? "25 min" : "Within 4 hours"} sub={selectedAppointment?.status === "On route" ? "Live ETA" : "For a confirmed visit"} icon={<Navigation className="w-4 h-4 text-sky-600" />} /><Kpi label="Service rating" value="4.8 ★" sub="Your recent visit rating" accent="text-amber-600" icon={<Star className="w-4 h-4" />} /></div>

    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5"><Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-ink-900">What do you need help with?</h2><p className="text-xs text-ink-500 mt-1">We recommend the right service before you schedule it.</p></div>{reason.priority !== "Normal" && <Badge tone={reason.priority === "Critical" ? "red" : "amber"}>{reason.priority} priority</Badge>}</div><label className="block text-xs font-semibold text-ink-600 mt-5 mb-2">Appointment reason</label><select value={selectedReason} onChange={(event) => selectReason(event.target.value)} className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-sky-500"><option value="">Choose an issue</option>{reasons.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><div className={`mt-4 rounded-xl border p-4 ${reason.priority === "Critical" ? "border-red-200 bg-red-50" : "border-sky-100 bg-sky-50"}`}><div className="flex gap-3"><span className={`h-9 w-9 rounded-lg grid place-items-center ${reason.priority === "Critical" ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"}`}>{reason.priority === "Critical" ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}</span><div><p className="text-sm font-bold text-ink-900">Recommended: {recommendation.label}</p><p className="text-xs text-ink-600 mt-1">{reason.message}</p><p className="text-xs font-semibold text-ink-700 mt-2">Expected duration: {recommendation.duration} · Expected cost: {recommendation.cost}</p></div></div>{reason.id === "bill" && <Link href="/customer/explainbill" className="mt-3 inline-flex text-xs font-bold text-sky-700 hover:underline">Review WhyMyBill and leak analysis <ChevronRight className="w-3.5 h-3.5" /></Link>}{reason.priority === "Critical" && <div className="mt-3 flex flex-wrap gap-2"><a href="tel:1800-XXX-XXXX" className="rounded-lg bg-red-600 text-white px-3 py-2 text-xs font-bold"><Phone className="w-3.5 h-3.5 inline mr-1" />Call emergency helpline</a><Link href="/customer/gascare" className="rounded-lg border border-red-200 text-red-700 px-3 py-2 text-xs font-bold">Open GasGuard</Link></div>}</div></Card>

        {reason.priority !== "Critical" && <Card className="p-6"><div className="flex items-center gap-2 mb-6">{([1, 2, 3] as const).map((number, index) => <div key={number} className="flex items-center gap-2"><button onClick={() => number < step && setStep(number)} className={`h-8 w-8 rounded-full text-xs font-bold grid place-items-center ${step === number ? "bg-sky-500 text-white" : step > number ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-400"}`}>{step > number ? <Check className="w-4 h-4" /> : number}</button><span className={`text-xs font-medium ${step === number ? "text-ink-900" : "text-ink-400"}`}>{["Service", "Schedule", "Confirm"][index]}</span>{index < 2 && <ChevronRight className="w-3 h-3 text-ink-300" />}</div>)}</div>
          {step === 1 && <div><h3 className="font-bold text-ink-900">Choose a service</h3>{healthNeedsInspection && <button onClick={() => { setSelectedService("inspection"); setSelectedReason("annual"); }} className="mt-3 w-full rounded-xl border border-brand-200 bg-brand-50 p-3 text-left"><p className="text-xs font-bold text-brand-800">Recommended for you · Annual safety inspection due</p><p className="text-xs text-brand-700 mt-1">Your regulator was last checked 14 months ago. Choose this service to protect your equipment health score.</p></button>}<div className="grid sm:grid-cols-2 gap-2 mt-4">{services.map((service) => <button key={service.id} onClick={() => { setSelectedService(service.id); setStep(2); }} className={`rounded-xl border p-3 text-left transition ${selectedService === service.id ? "border-sky-400 bg-sky-50" : "border-ink-100 hover:border-sky-300 hover:bg-sky-50/50"}`}><span className="text-lg">{service.icon}</span><p className="font-semibold text-sm text-ink-800 mt-2">{service.label}</p><p className="text-[11px] text-ink-500 mt-1">{service.duration} · {service.cost}</p></button>)}</div></div>}
          {step === 2 && <div><h3 className="font-bold text-ink-900">Choose an available slot</h3><p className="text-xs text-ink-500 mt-1">Slots update for your selected day and service.</p><div className="flex gap-2 overflow-x-auto pb-1 mt-5">{days.map((day) => <button key={day} onClick={() => { setSelectedDay(day); setSelectedSlot(null); }} className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold ${selectedDay === day ? "bg-sky-500 border-sky-500 text-white" : "border-ink-100 text-ink-600 hover:border-sky-300"}`}>{day}</button>)}</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">{slots.map((slot) => { const blocked = isSlotBlocked(slot); return <button key={slot} disabled={blocked} onClick={() => setSelectedSlot(slot)} className={`rounded-xl border py-2.5 text-xs font-semibold ${selectedSlot === slot ? "bg-sky-500 border-sky-500 text-white" : blocked ? "bg-ink-50 border-ink-100 text-ink-300 line-through" : "border-ink-100 text-ink-700 hover:border-sky-300 hover:bg-sky-50"}`}>{slot}</button>; })}</div><div className="flex gap-3 mt-6"><button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-600">Back</button><button disabled={!selectedSlot} onClick={() => setStep(3)} className="flex-1 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Continue</button></div></div>}
          {step === 3 && <div><h3 className="font-bold text-ink-900">Review your appointment</h3><div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-4 space-y-2 text-sm">{[["Service", recommendation.label], ["Date", selectedDay], ["Time", selectedSlot ?? "—"], ["Engineer", `${assignedEngineer.name} · ${assignedEngineer.specialty}`], ["Expected cost", recommendation.cost], ["Location", "B-204, Shivalay Apartments, Andheri"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><span className="text-ink-500">{label}</span><span className="text-right font-semibold text-ink-800">{value}</span></div>)}</div><div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3"><p className="text-xs font-bold text-amber-900">Before the engineer visits</p><ul className="mt-2 space-y-1 text-xs text-amber-800">{recommendation.preparation.map((item) => <li key={item}><Check className="w-3.5 h-3.5 inline mr-1" />{item}</li>)}</ul></div><div className="flex gap-3 mt-5"><button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-600">Back</button><button onClick={confirmBooking} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white">{reschedulingId ? "Confirm reschedule" : "Confirm booking"}</button></div></div>}
        </Card>}
      </div>

      <aside className="space-y-4"><Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><UserRound className="w-4 h-4 text-sky-600" /> Your assigned specialist</h2>{selectedAppointment ? <><div className="mt-4 flex items-center gap-3"><div className="h-11 w-11 rounded-full bg-gradient-to-br from-sky-400 to-sky-700 text-white grid place-items-center font-bold">{selectedAppointment.engineer.split(" ").map((part) => part[0]).join("")}</div><div><p className="font-bold text-sm text-ink-900">{selectedAppointment.engineer}</p><p className="text-xs text-ink-500">{engineers.find((item) => item.name === selectedAppointment.engineer)?.specialty ?? "Service specialist"}</p></div></div><div className="grid grid-cols-3 gap-2 mt-4 text-center">{[["Visits", engineers.find((item) => item.name === selectedAppointment.engineer)?.visits ?? 0], ["Experience", engineers.find((item) => item.name === selectedAppointment.engineer)?.experience ?? "—"], ["Rating", `${engineers.find((item) => item.name === selectedAppointment.engineer)?.rating ?? "—"} ★`]].map(([label, value]) => <div key={label as string} className="rounded-lg bg-ink-50 p-2"><div className="text-xs font-bold text-ink-800">{value}</div><div className="text-[10px] text-ink-500 mt-0.5">{label}</div></div>)}</div></> : <p className="text-sm text-ink-600 mt-3">Your certified specialist is assigned immediately after you confirm a slot.</p>}</Card>
        <Card className="p-5 border-red-100 bg-red-50"><h2 className="font-bold text-red-900 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Gas emergency?</h2><p className="text-xs text-red-800 mt-2">For gas smell, leakage, or fire risk, do not use normal booking. Close the valve, open windows, and call now.</p><a href="tel:1800-XXX-XXXX" className="mt-4 flex justify-center items-center gap-2 rounded-xl bg-red-600 px-3 py-2.5 text-xs font-bold text-white"><Phone className="w-3.5 h-3.5" /> Emergency helpline</a></Card>
        <Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><Clock3 className="w-4 h-4 text-sky-600" /> Next available slots</h2><div className="mt-4 space-y-3">{[["Today", "04:00 – 05:00"], ["Tomorrow", "09:00 – 10:00"], ["Tomorrow", "02:00 – 03:00"]].map(([day, time]) => <button key={`${day}-${time}`} onClick={() => { setSelectedDay(day === "Today" ? days[0] : days[1]); setSelectedSlot(time); setStep(3); }} className="w-full rounded-xl border border-ink-100 p-3 text-left hover:border-sky-300 hover:bg-sky-50"><p className="text-xs text-ink-500">{day}</p><p className="text-sm font-bold text-ink-800 mt-0.5">{time}</p></button>)}</div></Card></aside>
    </div>

    <Card className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-ink-900 flex items-center gap-2"><Truck className="w-4 h-4 text-sky-600" /> Appointment tracking</h2><p className="text-xs text-ink-500 mt-1">Every visit has clear status, engineer details, and a digital outcome.</p></div><Badge tone="sky">{activeAppointments.length} active</Badge></div>{activeAppointments.length === 0 ? <p className="mt-5 rounded-xl bg-ink-50 p-4 text-sm text-ink-600">No active appointment. Choose a service above to book a visit.</p> : <div className="mt-5 space-y-4">{activeAppointments.map((appointment) => { const flowIndex = Math.max(0, statusFlow.indexOf(appointment.status)); return <div key={appointment.id} className="rounded-xl border border-sky-200 bg-sky-50/50 p-4"><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><p className="font-bold text-ink-900">{appointment.service}</p><p className="text-xs text-ink-600 mt-1">{appointment.date} · {appointment.slot} · {appointment.engineer} · #{appointment.id}</p><p className="text-xs text-ink-500 mt-1">Reason: {appointment.reason} · Expected cost: {appointment.cost}</p></div><Badge tone="sky">{appointment.status}</Badge></div><div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-2">{statusFlow.map((status, index) => <div key={status} className="text-center"><span className={`mx-auto h-7 w-7 rounded-full grid place-items-center text-xs ${index <= flowIndex ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-400"}`}>{index < flowIndex ? <Check className="w-3.5 h-3.5" /> : index + 1}</span><p className={`mt-1 text-[10px] leading-tight ${index <= flowIndex ? "font-semibold text-ink-700" : "text-ink-400"}`}>{status}</p></div>)}</div><div className="mt-4 flex flex-wrap gap-2">{flowIndex < statusFlow.length - 1 && <button onClick={() => advanceStatus(appointment.id)} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white"><RefreshCw className="w-3.5 h-3.5 inline mr-1" />Refresh live status</button>}<button onClick={() => beginReschedule(appointment)} className="rounded-lg border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700">Reschedule</button><button onClick={() => setCancelTarget(appointment.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Cancel</button></div></div>; })}</div>}</Card>

    <Card className="p-6"><h2 className="font-bold text-ink-900 flex items-center gap-2"><FileText className="w-4 h-4 text-ink-500" /> Visit history & digital reports</h2><div className="mt-4 divide-y divide-ink-100">{pastAppointments.map((appointment) => <div key={appointment.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-sm font-semibold text-ink-800">{appointment.service}</p><p className="text-xs text-ink-500 mt-1">Completed {appointment.date} · {appointment.engineer} · #{appointment.id}</p><p className="text-xs text-brand-700 mt-1"><Check className="w-3.5 h-3.5 inline mr-1" />{appointment.finding}</p></div><div className="flex items-center gap-3"><StarRating rating={appointment.rating} /><button onClick={() => downloadReport(appointment.service, appointment.date, appointment.finding)} className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-bold text-ink-700"><Download className="w-3.5 h-3.5 inline mr-1" />View report</button></div></div>)}</div></Card>

    {cancelTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4"><Card className="w-full max-w-md p-6"><div className="flex items-start justify-between"><div><h2 className="font-bold text-ink-900">Cancel appointment</h2><p className="text-xs text-ink-500 mt-1">Your reason helps us improve scheduling.</p></div><button onClick={() => setCancelTarget(null)}><X className="w-5 h-5 text-ink-500" /></button></div><label className="block text-xs font-semibold text-ink-600 mt-5 mb-2">Reason</label><select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"><option>Not required</option><option>Timing conflict</option><option>Issue resolved</option><option>Booked by mistake</option></select><div className="flex gap-3 mt-5"><button onClick={() => setCancelTarget(null)} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-600">Keep appointment</button><button onClick={cancelAppointment} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white">Confirm cancellation</button></div></Card></div>}
  </div>;
}
