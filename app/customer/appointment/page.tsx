"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Card, Kpi } from "@/components/ui";
import { connectionStorageKey, normalizeConnectionStatus } from "@/lib/connectionStatus";
import { healthProfileStorageKey, normalizeHealthProfile } from "@/lib/healthScore";
import { downloadServiceReportPdf } from "@/lib/serviceReportPdf";
import { emitPlatformEvent } from "@/lib/platform";
import { appointmentsStorageKey as storageKey, appointmentStatusFlow as statusFlow, starterAppointments, type Appointment, type AppointmentStatus, type ServiceId } from "@/lib/appointments";
import { AlertTriangle, BarChart3, Calendar, Check, CheckCircle2, ChevronRight, Clock3, CookingPot, Download, FileText, Link2, MessageCircle, Navigation, Phone, RefreshCw, Settings2, ShieldAlert, ShieldCheck, ShowerHead, Star, Truck, UserRound, Waves, X, type LucideIcon } from "lucide-react";

type ServiceCategory = "Safety" | "Meter" | "Appliance" | "Connection" | "Emergency";
const days = ["Today · Jul 17", "Tomorrow · Jul 18", "Sun · Jul 19", "Mon · Jul 20", "Tue · Jul 21", "Wed · Jul 22", "Thu · Jul 23"];
const slots = ["09:00 – 10:00", "10:00 – 11:00", "11:00 – 12:00", "12:00 – 01:00", "02:00 – 03:00", "03:00 – 04:00", "04:00 – 05:00", "05:00 – 06:00"];
const baseBlocked: Record<string, string[]> = { "Today · Jul 17": ["09:00 – 10:00", "10:00 – 11:00", "11:00 – 12:00", "12:00 – 01:00", "02:00 – 03:00", "03:00 – 04:00"], "Tomorrow · Jul 18": ["10:00 – 11:00"], "Sun · Jul 19": ["12:00 – 01:00", "04:00 – 05:00"] };

const services: Array<{ id: ServiceId; label: string; category: ServiceCategory; duration: string; cost: string; icon: LucideIcon; specialist: string; preparation: string[] }> = [
  { id: "inspection", label: "Annual Safety Inspection", category: "Safety", duration: "60 min", cost: "₹0 · covered", icon: ShieldCheck, specialist: "Safety Specialist", preparation: ["Keep meter and kitchen access clear", "Ensure an adult is present", "Keep appliance controls accessible"] },
  { id: "stove", label: "Gas Stove Issue", category: "Appliance", duration: "60 min", cost: "₹300 – ₹700 if parts are needed", icon: CookingPot, specialist: "Appliance Technician", preparation: ["Turn off the stove and isolation valve", "Keep the stove area clear", "Do not attempt a repair yourself"] },
  { id: "geyser", label: "PNG Geyser Issue", category: "Appliance", duration: "75 min", cost: "₹300 – ₹700 if parts are needed", icon: ShowerHead, specialist: "Appliance Technician", preparation: ["Switch off the geyser", "Keep the bathroom accessible", "Share any error code with the engineer"] },
  { id: "pressure", label: "Low Pressure Complaint", category: "Emergency", duration: "45 min", cost: "₹0 · covered", icon: Waves, specialist: "Network Technician", preparation: ["Note when pressure is lowest", "Keep stove knobs switched off", "Keep meter accessible"] },
  { id: "leak", label: "Gas Leakage Inspection", category: "Emergency", duration: "60 min", cost: "₹0 · safety service", icon: AlertTriangle, specialist: "Safety Specialist", preparation: ["Turn off the isolation valve", "Open doors and windows", "Do not use electrical switches or flames"] },
  { id: "meter", label: "Meter Check / Replacement", category: "Meter", duration: "45 min", cost: "₹0 · covered", icon: BarChart3, specialist: "Meter Specialist", preparation: ["Keep the meter area accessible", "Keep your last bill handy", "Ensure an adult is present"] },
  { id: "regulator", label: "Regulator Servicing", category: "Safety", duration: "30 min", cost: "₹0 · preventive service", icon: Settings2, specialist: "Safety Specialist", preparation: ["Turn off the isolation valve", "Keep the regulator accessible", "Do not disconnect any pipe yourself"] },
  { id: "connection", label: "New Connection Setup", category: "Connection", duration: "120 min", cost: "₹0 · included in application", icon: Link2, specialist: "Installation Specialist", preparation: ["Keep kitchen route accessible", "Keep layout approval ready", "An adult owner should be present"] },
];
const serviceCategories: Array<"All" | ServiceCategory> = ["All", "Safety", "Meter", "Appliance", "Connection", "Emergency"];

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
  { name: "Ramesh Kumar", specialty: "Safety Specialist", visits: 324, experience: "5 years", rating: 4.8, initials: "RK", phone: "+919876522104", certifications: ["Gas Safety Certified", "PNG Specialist"] },
  { name: "Sunil Sharma", specialty: "Meter Specialist", visits: 287, experience: "6 years", rating: 4.7, initials: "SS", phone: "+919876522105", certifications: ["Meter Calibration Certified", "PNG Specialist"] },
  { name: "Manoj Patel", specialty: "Appliance Technician", visits: 241, experience: "4 years", rating: 4.9, initials: "MP", phone: "+919876522106", certifications: ["Gas Appliance Certified", "PNG Specialist"] },
];

const pastAppointments = [
  { id: "APT-2631", service: "Meter Check", engineer: "Sunil Sharma", date: "Jun 12, 2026", finding: "Gas pressure normal · no meter issue detected", rating: 5 },
  { id: "APT-2502", service: "Gas Appliance Repair", engineer: "Manoj Patel", date: "May 05, 2026", finding: "Stove burner cleaned · operation restored", rating: 4 },
];

function StarRating({ rating }: { rating: number }) { return <span className="inline-flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-ink-200"}`} />)}</span>; }
function AppointmentTab({ active, label, sub, badge, onClick }: { active: boolean; label: string; sub: string; badge?: number; onClick: () => void }) {
  return <button onClick={onClick} className={`relative shrink-0 rounded-xl px-4 py-2.5 text-left transition ${active ? "bg-ink-900 text-white shadow-sm" : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"}`}><span className="block text-sm font-bold">{label}{badge !== undefined && <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/15 text-white" : "bg-sky-100 text-sky-700"}`}>{badge}</span>}</span><span className={`mt-0.5 block text-[10px] ${active ? "text-ink-300" : "text-ink-400"}`}>{sub}</span></button>;
}
function serviceFor(id: ServiceId | null) { return services.find((service) => service.id === id) ?? services[0]; }
function isServiceId(value: string | null): value is ServiceId { return services.some((service) => service.id === value); }
function visitUpdate(status: AppointmentStatus) {
  if (status === "En Route") return { label: "Engineer en route · live ETA", value: "35 minutes", note: "Location update received just now" };
  if (status === "Assigned") return { label: "Expected arrival window", value: "Within 4 hours", note: "Engineer assigned and visit queue confirmed" };
  if (status === "Reached") return { label: "Live status", value: "Engineer has arrived", note: "Please keep the meter accessible" };
  if (status === "Started") return { label: "Live status", value: "Inspection in progress", note: "Your report will be available after completion" };
  return { label: "Booking status", value: "Confirmed", note: "Engineer assignment is in progress" };
}

export default function AppointmentBooking() {
  const [activeTab, setActiveTab] = useState<"book" | "visits" | "history">("book");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<ServiceId | null>(null);
  const [serviceCategory, setServiceCategory] = useState<"All" | ServiceCategory>("All");
  const [selectedReason, setSelectedReason] = useState("annual");
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>(starterAppointments);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("Timing conflict");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);
  const [loaded, setLoaded] = useState(false);
  const [healthNeedsInspection, setHealthNeedsInspection] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (Array.isArray(saved)) setAppointments(saved.filter((item): item is Appointment => item && typeof item.id === "string" && typeof item.serviceId === "string"));
      const health = normalizeHealthProfile(JSON.parse(window.localStorage.getItem(healthProfileStorageKey) ?? "null"));
      setHealthNeedsInspection(!health.preventiveInspectionBooked);
      const queryService = new URLSearchParams(window.location.search).get("service");
      if (isServiceId(queryService)) {
        setSelectedService(queryService);
        setSelectedReason(reasons.find((item) => item.service === queryService)?.id ?? "annual");
        setStep(2);
      }
    } catch { /* Safe defaults remain available when browser storage is unavailable. */ }
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) { try { window.localStorage.setItem(storageKey, JSON.stringify(appointments)); } catch { /* Session state remains usable. */ } } }, [appointments, loaded]);

  const reason = reasons.find((item) => item.id === selectedReason) ?? reasons[0];
  const recommendation = selectedService ? serviceFor(selectedService) : serviceFor(reason.service);
  const activeAppointments = appointments.filter((appointment) => appointment.status !== "Cancelled" && appointment.status !== "Completed");
  const earliest = useMemo(() => {
    const todaySlot = slots.find((slot) => !(baseBlocked[days[0]] ?? []).includes(slot) && !appointments.some((appointment) => appointment.date === days[0] && appointment.slot === slot && appointment.status !== "Cancelled"));
    return todaySlot ? `Today · ${todaySlot}` : `Tomorrow · ${slots.find((slot) => !(baseBlocked[days[1]] ?? []).includes(slot)) ?? "09:00 – 10:00"}`;
  }, [appointments]);
  const expectedWait = earliest.startsWith("Today") ? "Under 1 day" : "1 day";
  const filteredServices = serviceCategory === "All" ? services : services.filter((service) => service.category === serviceCategory);
  const assignedEngineer = engineers.find((engineer) => engineer.specialty === recommendation.specialist) ?? engineers[0];
  const selectedAppointment = activeAppointments[0];

  function selectReason(id: string) {
    const next = reasons.find((item) => item.id === id) ?? reasons[0];
    setSelectedReason(id);
    setSelectedService(next.service);
  }

  function selectRecommendedService() {
    setSelectedService("inspection");
    setSelectedReason("annual");
    setStep(2);
  }

  function selectQuickSlot(day: string, slot: string) {
    setSelectedService((current) => current ?? reason.service);
    setSelectedDay(day === "Today" ? days[0] : days[1]);
    setSelectedSlot(slot);
    setStep(3);
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
    if (selectedService === "inspection" || selectedService === "regulator") setHealthNeedsInspection(false);
    // The platform effect engine owns the fan-out: health profile, TrustPoints
    // mission, KPIs, feeds, and the safety console all update from this emit.
    const event = emitPlatformEvent({
      type: reschedulingId ? "AppointmentRescheduled" : "AppointmentBooked",
      module: "Appointments",
      summary: reschedulingId ? `${service.label} rescheduled` : `${service.label} booked`,
      entities: [{ type: "appointment", id: booking.id, label: service.label }, { type: "engineer", id: assignedEngineer.initials, label: assignedEngineer.name }],
      data: { appointmentId: booking.id, service: service.label, serviceId: service.id, date: selectedDay, slot: selectedSlot, engineer: assignedEngineer.name },
    });
    const synced = event.impact.filter((module) => module !== "Notifications").slice(0, 3).join(", ");
    setNotice(reschedulingId ? "Your appointment has been rescheduled and the engineer has been notified." : `Appointment booked. Updated across ${synced}.`);
    setReschedulingId(null); setSelectedSlot(null); setStep(1); setActiveTab("visits");
  }

  function beginReschedule(appointment: Appointment) { setReschedulingId(appointment.id); setSelectedService(appointment.serviceId); setSelectedDay(appointment.date); setSelectedSlot(null); setStep(2); setActiveTab("book"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function cancelAppointment() {
    if (!cancelTarget) return;
    const target = appointments.find((item) => item.id === cancelTarget);
    setAppointments((current) => current.map((item) => item.id === cancelTarget ? { ...item, status: "Cancelled", cancellationReason: cancelReason } : item));
    if (target) emitPlatformEvent({ type: "AppointmentCancelled", module: "Appointments", summary: `${target.service} cancelled`, entities: [{ type: "appointment", id: target.id, label: target.service }], data: { appointmentId: target.id, service: target.service, serviceId: target.serviceId, reason: cancelReason } });
    setNotice("Appointment cancelled. You can book a new slot whenever you need one.");
    setCancelTarget(null);
  }
  function advanceStatus(id: string) {
    setAppointments((current) => current.map((item) => {
      const at = statusFlow.indexOf(item.status);
      if (item.id !== id || at < 0 || at >= statusFlow.length - 1) return item;
      const next = statusFlow[at + 1];
      if (next === "Completed") emitPlatformEvent({ type: "AppointmentCompleted", module: "Appointments", summary: `${item.service} completed`, entities: [{ type: "appointment", id: item.id, label: item.service }], data: { appointmentId: item.id, service: item.service, serviceId: item.serviceId, engineer: item.engineer } });
      return { ...item, status: next };
    }));
  }

  return <div className="space-y-6 reveal">
    {notice && <div className="fixed top-4 right-4 z-50 max-w-sm bg-brand-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-start gap-3 anim-fade-up"><CheckCircle2 className="w-5 h-5 shrink-0" /><span className="text-sm font-semibold flex-1">{notice}</span><button onClick={() => setNotice(null)} aria-label="Dismiss message"><X className="w-4 h-4" /></button></div>}
    <header className="rounded-xl bg-ink-950 text-white p-6 sm:p-8 relative overflow-hidden "><div className="relative max-w-3xl"><p className="text-sky-300 text-xs font-semibold uppercase tracking-widest">Service scheduling & visit tracking</p><h1 className="text-2xl sm:text-3xl font-bold mt-1">Book the right gas service.</h1><p className="text-ink-300 mt-2 text-sm">Tell us what is happening, choose a real available slot, then track your engineer and service report in one place.</p></div></header>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Kpi label="Upcoming visits" value={activeAppointments.length} sub={activeAppointments[0] ? `${activeAppointments[0].date} · ${activeAppointments[0].slot}` : "No visit scheduled"} icon={<Calendar className="w-4 h-4" />} /><Kpi label="Earliest appointment" value={earliest} sub={`Expected wait: ${expectedWait}`} icon={<Clock3 className="w-4 h-4" />} /><Kpi label="Engineer arrival" value={selectedAppointment?.status === "En Route" ? "35 min" : "Within 4 hours"} sub={selectedAppointment?.status === "En Route" ? "Live ETA · en route" : "For a confirmed visit"} icon={<Navigation className="w-4 h-4 text-sky-600" />} /><Kpi label="Service reliability" value="92%" sub="First-visit resolution" accent="text-brand-600" icon={<CheckCircle2 className="w-4 h-4" />} /></div>

    <nav aria-label="Appointment sections" className="sticky top-3 z-10 flex gap-1 overflow-x-auto rounded-xl border border-ink-100 bg-white/95 p-1.5  backdrop-blur">
      <AppointmentTab active={activeTab === "book"} label="Book service" sub="Choose service & slot" onClick={() => setActiveTab("book")} />
      <AppointmentTab active={activeTab === "visits"} label="My visits" sub={`${activeAppointments.length} active`} onClick={() => setActiveTab("visits")} badge={activeAppointments.length} />
      <AppointmentTab active={activeTab === "history"} label="History & reports" sub="Past service records" onClick={() => setActiveTab("history")} />
    </nav>

    {activeTab === "book" && <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5"><Card className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-ink-900">What do you need help with?</h2><p className="text-xs text-ink-500 mt-1">We recommend the right service before you schedule it.</p></div>{reason.priority !== "Normal" && <Badge tone={reason.priority === "Critical" ? "red" : "amber"}>{reason.priority} priority</Badge>}</div><label className="block text-xs font-semibold text-ink-600 mt-5 mb-2">Appointment reason</label><select value={selectedReason} onChange={(event) => selectReason(event.target.value)} className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none focus:border-sky-500"><option value="">Choose an issue</option>{reasons.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><div className={`mt-4 rounded-xl border p-4 ${reason.priority === "Critical" ? "border-red-200 bg-red-50" : "border-sky-100 bg-sky-50"}`}><div className="flex gap-3"><span className={`h-9 w-9 rounded-lg grid place-items-center ${reason.priority === "Critical" ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"}`}>{reason.priority === "Critical" ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}</span><div><p className="text-sm font-bold text-ink-900">Recommended: {recommendation.label}</p><p className="text-xs text-ink-600 mt-1">{reason.message}</p><p className="text-xs font-semibold text-ink-700 mt-2">Expected duration: {recommendation.duration} · Expected cost: {recommendation.cost}</p></div></div>{reason.id === "bill" && <Link href="/customer/explainbill" className="mt-3 inline-flex text-xs font-bold text-sky-700 hover:underline">Review WhyMyBill and leak analysis <ChevronRight className="w-3.5 h-3.5" /></Link>}{reason.priority === "Critical" && <div className="mt-3 flex flex-wrap gap-2"><a href="tel:1800-XXX-XXXX" className="rounded-lg bg-red-600 text-white px-3 py-2 text-xs font-bold"><Phone className="w-3.5 h-3.5 inline mr-1" />Call emergency helpline</a><Link href="/customer/gascare" className="rounded-lg border border-red-200 text-red-700 px-3 py-2 text-xs font-bold">Open GasGuard</Link></div>}</div></Card>

        {reason.priority !== "Critical" && <Card className="p-6"><div className="flex items-center gap-2 mb-6">{([1, 2, 3] as const).map((number, index) => <div key={number} className="flex items-center gap-2"><button onClick={() => number < step && setStep(number)} className={`h-8 w-8 rounded-full text-xs font-bold grid place-items-center ${step === number ? "bg-sky-500 text-white" : step > number ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-400"}`}>{step > number ? <Check className="w-4 h-4" /> : number}</button><span className={`text-xs font-medium ${step === number ? "text-ink-900" : "text-ink-400"}`}>{["Service", "Schedule", "Confirm"][index]}</span>{index < 2 && <ChevronRight className="w-3 h-3 text-ink-300" />}</div>)}</div>
          {step === 1 && <div><h3 className="font-bold text-ink-900">Choose a service</h3><p className="mt-1 text-xs text-ink-500">Browse by service category to find the right specialist faster.</p>{healthNeedsInspection && <button onClick={selectRecommendedService} className="mt-3 w-full rounded-xl border border-brand-200 bg-brand-50 p-3 text-left"><p className="text-xs font-bold text-brand-800">Recommended for you · Annual safety inspection due</p><p className="text-xs text-brand-700 mt-1">Your regulator was last checked 14 months ago. Choose this service to protect your equipment health score.</p></button>}<div className="mt-4 flex gap-2 overflow-x-auto pb-1">{serviceCategories.map((category) => <button key={category} onClick={() => setServiceCategory(category)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${serviceCategory === category ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-600 hover:border-sky-300 hover:text-sky-700"}`}>{category}</button>)}</div><div className="grid sm:grid-cols-2 gap-2 mt-3">{filteredServices.map((service) => <button key={service.id} onClick={() => { setSelectedService(service.id); setStep(2); }} className={`rounded-xl border p-3 text-left transition ${selectedService === service.id ? "border-sky-400 bg-sky-50" : "border-ink-100 hover:border-sky-300 hover:bg-sky-50/50"}`}><div className="flex items-start justify-between gap-2"><service.icon className="w-5 h-5 text-sky-700" /><span className="rounded-full bg-ink-50 px-2 py-0.5 text-[10px] font-bold text-ink-500">{service.category}</span></div><p className="font-semibold text-sm text-ink-800 mt-2">{service.label}</p><p className="text-[11px] text-ink-500 mt-1">{service.duration} · {service.cost}</p></button>)}</div></div>}
          {step === 2 && <div><h3 className="font-bold text-ink-900">Choose an available slot</h3><p className="text-xs text-ink-500 mt-1">Slots update for your selected day and service.</p><div className="flex gap-2 overflow-x-auto pb-1 mt-5">{days.map((day) => <button key={day} onClick={() => { setSelectedDay(day); setSelectedSlot(null); }} className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold ${selectedDay === day ? "bg-sky-500 border-sky-500 text-white" : "border-ink-100 text-ink-600 hover:border-sky-300"}`}>{day}</button>)}</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">{slots.map((slot) => { const blocked = isSlotBlocked(slot); return <button key={slot} disabled={blocked} onClick={() => setSelectedSlot(slot)} className={`rounded-xl border py-2.5 text-xs font-semibold ${selectedSlot === slot ? "bg-sky-500 border-sky-500 text-white" : blocked ? "bg-ink-50 border-ink-100 text-ink-300 line-through" : "border-ink-100 text-ink-700 hover:border-sky-300 hover:bg-sky-50"}`}>{slot}</button>; })}</div><div className="flex gap-3 mt-6"><button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-600">Back</button><button disabled={!selectedSlot} onClick={() => setStep(3)} className="flex-1 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Continue</button></div></div>}
          {step === 3 && <div><h3 className="font-bold text-ink-900">Review your appointment</h3><div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-4 space-y-2 text-sm">{[["Service", recommendation.label], ["Date", selectedDay], ["Time", selectedSlot ?? "—"], ["Engineer", `${assignedEngineer.name} · ${assignedEngineer.specialty}`], ["Location", "B-204, Shivalay Apartments, Andheri"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><span className="text-ink-500">{label}</span><span className="text-right font-semibold text-ink-800">{value}</span></div>)}</div><div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3"><p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Expected cost</p><p className="mt-0.5 text-sm font-bold text-brand-900">{recommendation.cost}</p><p className="mt-1 text-[11px] text-brand-800">You will be informed before any chargeable part or work begins.</p></div><div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3"><p className="text-xs font-bold text-amber-900">Visit preparation checklist</p><p className="mt-1 text-[11px] text-amber-800">A prepared visit helps your engineer resolve the issue on the first visit.</p><ul className="mt-2 space-y-1 text-xs text-amber-800">{recommendation.preparation.map((item) => <li key={item}><Check className="w-3.5 h-3.5 inline mr-1" />{item}</li>)}</ul></div><div className="flex gap-3 mt-5"><button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-600">Back</button><button onClick={confirmBooking} className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white">{reschedulingId ? "Confirm reschedule" : "Confirm booking"}</button></div></div>}
        </Card>}
      </div>

      <aside className="space-y-4"><Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><UserRound className="w-4 h-4 text-sky-600" /> Your assigned specialist</h2>{selectedAppointment ? <>{(() => { const engineer = engineers.find((item) => item.name === selectedAppointment.engineer) ?? assignedEngineer; return <><div className="mt-4 flex items-center gap-3"><div className="h-11 w-11 rounded-full bg-sky-600 text-white grid place-items-center font-bold">{engineer.initials}</div><div><p className="font-bold text-sm text-ink-900">{engineer.name}</p><p className="text-xs text-ink-500">{engineer.specialty}</p></div></div><div className="grid grid-cols-3 gap-2 mt-4 text-center">{[["Visits", engineer.visits], ["Experience", engineer.experience], ["Rating", `${engineer.rating} / 5`]].map(([label, value]) => <div key={label as string} className="rounded-lg bg-ink-50 p-2"><div className="text-xs font-bold text-ink-800">{value}</div><div className="text-[10px] text-ink-500 mt-0.5">{label}</div></div>)}</div><div className="mt-4"><p className="text-[10px] font-bold uppercase tracking-wide text-ink-500">Safety certifications</p><div className="mt-2 flex flex-wrap gap-1.5">{engineer.certifications.map((certification) => <span key={certification} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-800"><CheckCircle2 className="w-3 h-3" />{certification}</span>)}</div></div><div className="mt-4 grid grid-cols-2 gap-2"><a href={`tel:${engineer.phone}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-200 py-2 text-xs font-bold text-sky-700"><Phone className="w-3.5 h-3.5" />Call</a><a href={`sms:${engineer.phone}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 py-2 text-xs font-bold text-white"><MessageCircle className="w-3.5 h-3.5" />Message</a></div></>; })()}</> : <p className="text-sm text-ink-600 mt-3">Your certified specialist is assigned immediately after you confirm a slot.</p>}</Card>
        <Card className="p-5 border-red-100 bg-red-50"><h2 className="font-bold text-red-900 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Gas emergency?</h2><p className="text-xs text-red-800 mt-2">For gas smell, leakage, or fire risk, do not use normal booking. Move to fresh air, avoid switches or flames, and contact GasGuard immediately.</p><div className="mt-3 rounded-lg border border-red-200 bg-white/70 p-2.5 text-[11px] font-semibold text-red-800">Call from outside: 1906 · Gas Emergency Helpline</div><a href="tel:1906" className="mt-3 flex justify-center items-center gap-2 rounded-xl bg-red-600 px-3 py-2.5 text-xs font-bold text-white"><Phone className="w-3.5 h-3.5" /> Call 1906</a><Link href="/customer/gascare" className="mt-2 flex justify-center items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-xs font-bold text-red-700">Open GasGuard guidance</Link></Card>
        <Card className="p-5"><h2 className="font-bold text-ink-900 flex items-center gap-2"><Clock3 className="w-4 h-4 text-sky-600" /> Next available slots</h2><div className="mt-4 space-y-3">{[["Today", "04:00 – 05:00"], ["Tomorrow", "09:00 – 10:00"], ["Tomorrow", "02:00 – 03:00"]].map(([day, time]) => <button key={`${day}-${time}`} onClick={() => selectQuickSlot(day, time)} className="w-full rounded-xl border border-ink-100 p-3 text-left hover:border-sky-300 hover:bg-sky-50"><p className="text-xs text-ink-500">{day}</p><p className="text-sm font-bold text-ink-800 mt-0.5">{time}</p></button>)}</div></Card></aside>
    </div>}

    {activeTab === "visits" && <Card className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-ink-900 flex items-center gap-2"><Truck className="w-4 h-4 text-sky-600" /> Appointment tracking</h2><p className="text-xs text-ink-500 mt-1">Every visit has clear status, engineer details, and a digital outcome.</p></div><div className="flex items-center gap-2"><Badge tone="sky">{activeAppointments.length} active</Badge><button onClick={() => setActiveTab("book")} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white">Book service</button></div></div>{activeAppointments.length === 0 ? <p className="mt-5 rounded-xl bg-ink-50 p-4 text-sm text-ink-600">No active appointment. Choose a service above to book a visit.</p> : <div className="mt-5 space-y-4">{activeAppointments.map((appointment) => { const flowIndex = Math.max(0, statusFlow.indexOf(appointment.status)); const update = visitUpdate(appointment.status); const engineer = engineers.find((item) => item.name === appointment.engineer) ?? assignedEngineer; const bookedService = serviceFor(appointment.serviceId); return <div key={appointment.id} className="rounded-xl border border-sky-200 bg-sky-50/50 p-4"><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><p className="font-bold text-ink-900">{appointment.service}</p><p className="text-xs text-ink-600 mt-1">{appointment.date} · {appointment.slot} · {appointment.engineer} · #{appointment.id}</p><p className="text-xs text-ink-500 mt-1">Reason: {appointment.reason} · Expected cost: {appointment.cost}</p></div><Badge tone="sky">{appointment.status}</Badge></div><div className="mt-4 flex items-center gap-3 rounded-xl border border-sky-100 bg-white p-3"><span className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 grid place-items-center"><Navigation className="w-4 h-4" /></span><div><p className="text-xs text-ink-500">{update.label}</p><p className="text-sm font-bold text-ink-900">{update.value}</p><p className="text-[11px] text-sky-700 mt-0.5">{update.note}</p></div></div><div className="mt-3 grid sm:grid-cols-[1fr_auto] gap-3 rounded-xl border border-ink-100 bg-white p-3"><div><p className="text-xs font-bold text-ink-900">{engineer.name} · {engineer.specialty}</p><p className="mt-1 text-[11px] text-ink-500">{engineer.certifications.join(" · ")}</p></div><div className="flex gap-2"><a href={`tel:${engineer.phone}`} className="inline-flex items-center gap-1 rounded-lg border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700"><Phone className="w-3.5 h-3.5" />Call</a><a href={`sms:${engineer.phone}`} className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white"><MessageCircle className="w-3.5 h-3.5" />Message</a></div></div><div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3"><p className="text-[11px] font-bold text-amber-900">Before visit checklist</p><p className="mt-1 text-[11px] text-amber-800">{bookedService.preparation.slice(0, 2).join(" · ")}</p></div><div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-2">{statusFlow.map((status, index) => <div key={status} className="text-center"><span className={`mx-auto h-7 w-7 rounded-full grid place-items-center text-xs ${index <= flowIndex ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-400"}`}>{index < flowIndex ? <Check className="w-3.5 h-3.5" /> : index + 1}</span><p className={`mt-1 text-[10px] leading-tight ${index <= flowIndex ? "font-semibold text-ink-700" : "text-ink-400"}`}>{status}</p></div>)}</div><div className="mt-4 flex flex-wrap gap-2">{flowIndex < statusFlow.length - 1 && <button onClick={() => advanceStatus(appointment.id)} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white"><RefreshCw className="w-3.5 h-3.5 inline mr-1" />Refresh live status</button>}<button onClick={() => beginReschedule(appointment)} className="rounded-lg border border-sky-200 px-3 py-2 text-xs font-bold text-sky-700">Reschedule</button><button onClick={() => setCancelTarget(appointment.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600">Cancel</button></div></div>; })}</div>}</Card>}

    {activeTab === "history" && <Card className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-ink-900 flex items-center gap-2"><FileText className="w-4 h-4 text-ink-500" /> Visit history & digital reports</h2><p className="text-xs text-ink-500 mt-1">Review past service outcomes and download verified reports anytime.</p></div><Badge tone="brand">{pastAppointments.length} completed</Badge></div><div className="mt-4 divide-y divide-ink-100">{pastAppointments.map((appointment) => <div key={appointment.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-sm font-semibold text-ink-800">{appointment.service}</p><p className="text-xs text-ink-500 mt-1">Completed {appointment.date} · {appointment.engineer} · #{appointment.id}</p><p className="text-xs text-brand-700 mt-1"><Check className="w-3.5 h-3.5 inline mr-1" />{appointment.finding}</p></div><div className="flex items-center gap-3"><StarRating rating={appointment.rating} /><button onClick={() => downloadServiceReportPdf({ appointmentId: appointment.id, service: appointment.service, date: appointment.date, engineer: appointment.engineer, findings: appointment.finding })} className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-bold text-ink-700"><Download className="w-3.5 h-3.5 inline mr-1" />Download PDF</button></div></div>)}</div></Card>}

    <Card className="border-brand-200 bg-brand-50/50 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">Torrent Gas · business value</p><h2 className="mt-1 font-bold text-ink-900">From complaint to confident resolution</h2><p className="mt-1 max-w-2xl text-xs text-ink-600">Appointment Booking connects self-service, GasGuard safety guidance, field visibility, and auditable reports in one customer journey.</p></div><Badge tone="brand">92% first-visit resolution</Badge></div><div className="mt-5 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-ink-100 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-ink-500">Before</p><ol className="mt-3 space-y-2 text-sm text-ink-700">{["Customer raises complaint", "Calls customer care repeatedly", "Engineer scheduling unclear", "No visit visibility"].map((item, index) => <li key={item} className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-100 text-[10px] font-bold text-ink-500">{index + 1}</span>{item}</li>)}</ol></div><div className="rounded-xl border border-brand-200 bg-brand-600 p-4 text-white"><p className="text-xs font-bold uppercase tracking-wider text-brand-100">After</p><ol className="mt-3 space-y-2 text-sm">{["Self-booking with smart recommendation", "Certified engineer assigned", "Transparent ETA and live tracking", "Digital report and cost clarity"].map((item, index) => <li key={item} className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/20 text-[10px] font-bold">{index + 1}</span>{item}</li>)}</ol></div></div></Card>

    {cancelTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4"><Card className="w-full max-w-md p-6"><div className="flex items-start justify-between"><div><h2 className="font-bold text-ink-900">Cancel appointment</h2><p className="text-xs text-ink-500 mt-1">Your reason helps us improve scheduling.</p></div><button onClick={() => setCancelTarget(null)}><X className="w-5 h-5 text-ink-500" /></button></div><label className="block text-xs font-semibold text-ink-600 mt-5 mb-2">Reason</label><select value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm"><option>Not required</option><option>Timing conflict</option><option>Issue resolved</option><option>Booked by mistake</option></select><div className="flex gap-3 mt-5"><button onClick={() => setCancelTarget(null)} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-600">Keep appointment</button><button onClick={cancelAppointment} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white">Confirm cancellation</button></div></Card></div>}
  </div>;
}
