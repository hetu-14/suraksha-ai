"use client";

import { useState } from "react";
import { Card, Kpi, Badge } from "@/components/ui";
import Typewriter from "@/components/Typewriter";
import {
  Calendar, Clock, User, Wrench, CheckCircle, ChevronRight,
  Phone, MapPin, Star, AlertCircle, Plus, X,
} from "lucide-react";

type SlotStatus = "available" | "booked" | "selected";

const TIME_SLOTS = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

const SERVICE_TYPES = [
  { id: "inspection", label: "Annual Safety Inspection", duration: "60 min", icon: "🔍" },
  { id: "repair", label: "Gas Appliance Repair", duration: "90 min", icon: "🔧" },
  { id: "connection", label: "New Connection Setup", duration: "120 min", icon: "🔗" },
  { id: "meter", label: "Meter Check / Replacement", duration: "45 min", icon: "📊" },
  { id: "regulator", label: "Regulator Servicing", duration: "30 min", icon: "⚙️" },
];

const UPCOMING = [
  {
    id: "APT-2847",
    service: "Annual Safety Inspection",
    engineer: "Ramesh Kumar",
    date: "Jul 20, 2026",
    time: "10:00 AM",
    status: "Confirmed",
    rating: null,
  },
];

const PAST = [
  {
    id: "APT-2631",
    service: "Meter Check",
    engineer: "Sunil Sharma",
    date: "Jun 12, 2026",
    time: "11:00 AM",
    status: "Completed",
    rating: 5,
  },
  {
    id: "APT-2502",
    service: "Gas Appliance Repair",
    engineer: "Manoj Patel",
    date: "May 05, 2026",
    time: "03:00 PM",
    status: "Completed",
    rating: 4,
  },
];

const ENGINEERS = [
  { name: "Ramesh Kumar", specialization: "Safety & Inspection", rating: 4.9, available: true },
  { name: "Sunil Sharma", specialization: "Meter & Telemetry", rating: 4.7, available: true },
  { name: "Manoj Patel", specialization: "Appliance & Repair", rating: 4.8, available: false },
];

const DAYS = ["Mon Jul 14", "Tue Jul 15", "Wed Jul 16", "Thu Jul 17", "Fri Jul 18", "Sat Jul 19", "Sun Jul 20"];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3 h-3 ${i < rating ? "fill-amber-400 text-amber-400" : "text-ink-200"}`} />
      ))}
    </div>
  );
}

export default function AppointmentBooking() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>("Wed Jul 16");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookedSlots] = useState<Set<string>>(new Set(["09:00 AM", "02:00 PM"]));
  const [showSuccess, setShowSuccess] = useState(false);

  const getSlotStatus = (slot: string): SlotStatus => {
    if (slot === selectedSlot) return "selected";
    if (bookedSlots.has(slot)) return "booked";
    return "available";
  };

  const handleBook = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setStep(1);
    setSelectedService(null);
    setSelectedSlot(null);
  };

  return (
    <div className="space-y-6 reveal">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-brand-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 anim-fade-up">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Appointment booked successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-sky-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-sky-300 text-xs font-semibold uppercase tracking-widest">Customer & Engineer Scheduling</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Appointment Booking " }, { text: "📅", cls: "" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Book certified gas engineers for inspections, repairs, and installations. Real-time availability with instant confirmation.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Upcoming" value="1" sub="Confirmed appointment" icon={<Calendar className="w-4 h-4" />} />
        <Kpi label="Available Engineers" value="2 / 3" sub="Ready in your area" icon={<User className="w-4 h-4" />} />
        <Kpi label="Avg Response Time" value="2 hrs" sub="From booking to confirm" icon={<Clock className="w-4 h-4" />} />
        <Kpi label="Service Rating" value="4.8 ★" sub="Based on your last 3 visits" accent="text-amber-600" icon={<Star className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Booking Wizard */}
        <Card className="lg:col-span-2 p-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { n: 1, label: "Service" },
              { n: 2, label: "Schedule" },
              { n: 3, label: "Confirm" },
            ].map(({ n, label }, i) => (
              <div key={n} className="flex items-center gap-2">
                <button
                  onClick={() => setStep(n as 1 | 2 | 3)}
                  className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition ${
                    step === n
                      ? "bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                      : step > n
                      ? "bg-brand-500 text-white"
                      : "bg-ink-100 text-ink-400"
                  }`}
                >
                  {step > n ? <CheckCircle className="w-4 h-4" /> : n}
                </button>
                <span className={`text-xs font-medium ${step === n ? "text-ink-900" : "text-ink-400"}`}>{label}</span>
                {i < 2 && <ChevronRight className="w-3 h-3 text-ink-300" />}
              </div>
            ))}
          </div>

          {/* Step 1 — Service Selection */}
          {step === 1 && (
            <div>
              <h3 className="font-bold text-ink-900 mb-4">Select Service Type</h3>
              <div className="space-y-2">
                {SERVICE_TYPES.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => { setSelectedService(svc.id); setStep(2); }}
                    className={`w-full text-left rounded-xl p-4 border flex items-center justify-between transition ${
                      selectedService === svc.id
                        ? "border-sky-400 bg-sky-50"
                        : "border-ink-100 hover:border-sky-300 hover:bg-sky-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{svc.icon}</span>
                      <div>
                        <p className="font-semibold text-sm text-ink-800">{svc.label}</p>
                        <p className="text-[11px] text-ink-500">Duration: {svc.duration}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-300" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Date & Time */}
          {step === 2 && (
            <div>
              <h3 className="font-bold text-ink-900 mb-4">Choose Date & Time</h3>

              {/* Day picker */}
              <p className="text-xs text-ink-500 font-medium mb-2 uppercase tracking-wider">Select Date</p>
              <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setSelectedDay(d); setSelectedSlot(null); }}
                    className={`shrink-0 text-center rounded-xl px-3 py-2 border text-xs font-medium transition ${
                      selectedDay === d
                        ? "bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/25"
                        : "bg-white border-ink-100 text-ink-600 hover:border-sky-300"
                    }`}
                  >
                    {d.split(" ").map((part, i) => (
                      <span key={i} className={`block ${i === 0 ? "text-[10px] font-normal" : "text-sm font-bold"}`}>
                        {i === 0 ? part : part.replace(/\D/g, "")}
                      </span>
                    ))}
                  </button>
                ))}
              </div>

              {/* Time slots */}
              <p className="text-xs text-ink-500 font-medium mb-2 uppercase tracking-wider">Select Time Slot</p>
              <div className="grid grid-cols-4 gap-2 mb-6">
                {TIME_SLOTS.map((slot) => {
                  const status = getSlotStatus(slot);
                  return (
                    <button
                      key={slot}
                      disabled={status === "booked"}
                      onClick={() => setSelectedSlot(slot)}
                      className={`text-xs font-semibold py-2.5 rounded-xl border transition ${
                        status === "selected"
                          ? "bg-sky-500 text-white border-sky-500 shadow shadow-sky-500/30"
                          : status === "booked"
                          ? "bg-ink-50 text-ink-300 border-ink-100 cursor-not-allowed line-through"
                          : "border-ink-100 hover:border-sky-300 hover:bg-sky-50 text-ink-700"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-ink-200 text-ink-600 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-ink-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => selectedSlot && setStep(3)}
                  disabled={!selectedSlot}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div>
              <h3 className="font-bold text-ink-900 mb-4">Review & Confirm</h3>
              <div className="rounded-xl bg-sky-50 border border-sky-100 p-4 space-y-3 mb-5">
                {[
                  { label: "Service", value: SERVICE_TYPES.find((s) => s.id === selectedService)?.label },
                  { label: "Date", value: selectedDay },
                  { label: "Time", value: selectedSlot },
                  { label: "Engineer", value: "Ramesh Kumar (nearest available)" },
                  { label: "Location", value: "B-204, Shivalay Apartments, Andheri" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between text-sm">
                    <span className="text-ink-500 font-medium w-24 shrink-0">{label}</span>
                    <span className="text-ink-800 font-semibold text-right">{value ?? "—"}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-ink-500 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2 mb-5">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                Please ensure someone is present at the address during the appointment window (±30 min flexibility).
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border border-ink-200 text-ink-600 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-ink-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleBook}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition"
                >
                  ✓ Confirm Booking
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Available Engineers */}
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-500" /> Available Engineers
            </h3>
            <div className="space-y-3">
              {ENGINEERS.map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full grid place-items-center text-white text-sm font-bold shrink-0 ${
                    e.available ? "bg-gradient-to-br from-sky-400 to-sky-600" : "bg-ink-200"
                  }`}>
                    {e.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-800 truncate">{e.name}</p>
                    <p className="text-[10px] text-ink-500">{e.specialization}</p>
                    <StarRating rating={Math.round(e.rating)} />
                  </div>
                  <Badge tone={e.available ? "brand" : "ink"}>{e.available ? "Ready" : "Busy"}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Emergency booking */}
          <Card className="p-5 border-orange-100 bg-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <p className="font-bold text-orange-800 text-sm">Emergency Booking</p>
            </div>
            <p className="text-xs text-orange-700/80 mb-3">Gas leak or urgent repair? Skip the queue.</p>
            <a
              href="tel:1800-XXX-XXXX"
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 transition"
            >
              <Phone className="w-3.5 h-3.5" /> Priority Helpline
            </a>
          </Card>
        </div>
      </div>

      {/* Appointment History */}
      <Card className="p-6 anim-fade-up">
        <h3 className="font-bold text-ink-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-ink-500" /> Your Appointments
        </h3>

        {/* Upcoming */}
        <p className="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-3">Upcoming</p>
        {UPCOMING.map((a) => (
          <div key={a.id} className="rounded-xl border border-sky-200 bg-sky-50 p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sky-100 grid place-items-center">
                <Calendar className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="font-semibold text-ink-800 text-sm">{a.service}</p>
                <p className="text-[11px] text-ink-500">{a.date} · {a.time} · {a.engineer} · #{a.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="sky">{a.status}</Badge>
              <button className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ))}

        {/* Past */}
        <p className="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-3">Past</p>
        <div className="divide-y divide-ink-100">
          {PAST.map((a) => (
            <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
              <div>
                <p className="text-sm font-semibold text-ink-800">{a.service}</p>
                <p className="text-[11px] text-ink-400">{a.date} · {a.time} · {a.engineer} · #{a.id}</p>
              </div>
              <div className="flex items-center gap-3">
                {a.rating && <StarRating rating={a.rating} />}
                <Badge tone="brand">{a.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
