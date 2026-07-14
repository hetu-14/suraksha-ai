"use client";

import { useState } from "react";
import { Card, Kpi, SectionTitle } from "@/components/ui";
import CountUp from "@/components/CountUp";
import Typewriter from "@/components/Typewriter";
import { Route, ClipboardCheck, Calendar, Activity, CheckCircle, FileText } from "lucide-react";

export default function ConnectionJourney() {
  const [activeStep, setActiveStep] = useState(2); // Site Survey
  const [docUploaded, setDocUploaded] = useState(false);

  const steps = [
    { name: "Application Submitted", date: "Jul 02, 2026", desc: "Digital application form verified", team: "Registrar Portal" },
    { name: "Document Verification", date: "Jul 05, 2026", desc: "KYC, Address proof, Property papers", team: "Compliance Team" },
    { name: "Site Survey & Planning", date: "Jul 12, 2026", desc: "Safety checks and layout validation", team: "Survey Unit 3" },
    { name: "Meter Installation", date: "Expected Jul 18", desc: "Physical meter setup and piping", team: "Tech Ops Team" },
    { name: "Gas Safety Testing", date: "Expected Jul 20", desc: "Pressure tests and leakage checks", team: "QA Inspectors" },
    { name: "Final Commissioning", date: "Expected Jul 21", desc: "Gas supply activation and hand-over", team: "Field Engineer" }
  ];

  return (
    <div className="space-y-6 reveal">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-ink-900 via-ink-900 to-brand-900 text-white p-6 relative overflow-hidden shadow-soft">
        <div className="floaty absolute -right-10 -top-10 w-56 h-56 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-brand-300 text-xs font-semibold uppercase tracking-widest">Customer Experience Suite</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            <Typewriter speed={40} segments={[{ text: "Connection Journey" }]} />
          </h1>
          <p className="text-ink-300 mt-2 text-sm max-w-2xl">
            Track your new domestic/commercial gas connection in real-time. Follow the steps below as we inspect, fit, and secure your PNG installation.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 anim-fade-up">
        <Kpi label="Days elapsed" value={<CountUp to={12} />} icon={<Calendar className="w-4 h-4" />} />
        <Kpi label="Est. completion time" value={<CountUp to={18} suffix=" Days" />} icon={<Route className="w-4 h-4" />} />
        <Kpi label="Documents verified" value="4 / 5" accent="text-brand-600" icon={<ClipboardCheck className="w-4 h-4" />} />
        <Kpi label="Site survey score" value="92%" icon={<Activity className="w-4 h-4 text-brand-500" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 anim-fade-up">
        {/* Timeline tracker */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-bold text-ink-900 mb-6">Live Installation Pipeline</h3>
          <div className="relative border-l border-ink-150 ml-4 pl-6 space-y-8">
            {steps.map((s, idx) => {
              const completed = idx < activeStep;
              const current = idx === activeStep;
              return (
                <div key={idx} className="relative">
                  {/* Indicator Dot */}
                  <span className={`absolute -left-[31px] top-1 h-6.5 w-6.5 rounded-full border-2 grid place-items-center bg-white ${
                    completed ? "border-brand-500 text-brand-500" :
                    current ? "border-brand-600 text-brand-600 animate-pulse" :
                    "border-ink-200 text-ink-400"
                  }`}>
                    {completed ? <CheckCircle className="w-3.5 h-3.5 fill-brand-50" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                  </span>
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className={`font-bold text-sm ${current ? "text-brand-600 text-base" : "text-ink-800"}`}>
                        {s.name}
                      </span>
                      <span className="text-xs font-semibold text-ink-400">{s.date}</span>
                    </div>
                    <p className="text-xs text-ink-500 mt-1">{s.desc}</p>
                    <span className="inline-block mt-2 text-[10px] font-semibold text-ink-600 bg-ink-50 px-2 py-0.5 rounded border border-ink-100">
                      Team: {s.team}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upload card */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-bold text-ink-900 mb-3">Pending Documents</h3>
            <p className="text-xs text-ink-500 mb-4 leading-relaxed">
              We require a signed copy of the final site plan layout approval. Please upload a clear scan.
            </p>
            {docUploaded ? (
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-center">
                <CheckCircle className="w-8 h-8 text-brand-600 mx-auto" />
                <span className="block text-xs font-bold text-brand-800 mt-2">Document uploaded successfully</span>
                <span className="block text-[10px] text-brand-600 mt-0.5">Verification in progress</span>
              </div>
            ) : (
              <button onClick={() => setDocUploaded(true)}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> Upload signed layout sheet
              </button>
            )}
          </Card>

          <Card className="p-5 bg-gradient-to-br from-brand-500/5 to-transparent border-brand-500/10">
            <h4 className="font-bold text-xs text-brand-700 uppercase tracking-wide">Installation Safety Note</h4>
            <p className="text-xs text-brand-800/80 mt-1 leading-relaxed">
              Every Suraksha gas line installation complies with PNGRB Safety Regulations 2025. Final commissioning is dependent on complete survey approval.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
