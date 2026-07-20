"use client";

// ---- Platform knowledge graph ----
// The relationship model behind the platform: every entity knows what it is
// connected to. Static edges cover the operational world (zones, tickets,
// revenue cases, engineers); dynamic nodes are folded in from the live stores
// (appointments, incidents, complaints) on every read. Consumers: the AI
// context, the unified timeline, and any "related entities" surface.

import { slaTickets, revCases } from "@/lib/ops";
import type { EntityRef, EntityType } from "./events";
import { readPlatformContext } from "./context";

export type GraphNode = EntityRef & { href: string; status?: string };
export type GraphEdge = { from: string; to: string; rel: string };
export type KnowledgeGraph = { nodes: GraphNode[]; edges: GraphEdge[] };

const CUSTOMER_ID = "GJ-559210";

const staticNodes: GraphNode[] = [
  { type: "customer", id: CUSTOMER_ID, label: "Riddhi Mehta · Maninagar", href: "/customer" },
  { type: "connection", id: "CONN-GJ-559210", label: "PNG connection · Maninagar", href: "/customer/connection" },
  { type: "engineer", id: "ENG-RK", label: "Ramesh Kumar · Safety Specialist", href: "/customer/appointment" },
  { type: "engineer", id: "ENG-SS", label: "Sunil Sharma · Meter Specialist", href: "/customer/appointment" },
  { type: "engineer", id: "ENG-MP", label: "Manoj Patel · Appliance Technician", href: "/customer/appointment" },
  { type: "zone", id: "Z-01", label: "Bopal Distribution Hub", href: "/safety/dashboard-gas-guard" },
  { type: "zone", id: "Z-04", label: "Naranpura Inlet Line", href: "/safety/dashboard-gas-guard" },
  { type: "zone", id: "Z-MANINAGAR", label: "Ward 7 — Maninagar", href: "/safety/smartnotify" },
];

const staticEdges: GraphEdge[] = [
  { from: CUSTOMER_ID, to: "CONN-GJ-559210", rel: "holds connection" },
  { from: CUSTOMER_ID, to: "Z-MANINAGAR", rel: "supplied by" },
  { from: "ENG-RK", to: "Z-MANINAGAR", rel: "serves" },
  ...slaTickets.map((ticket) => ({ from: ticket.id, to: ticket.area, rel: "raised in" })),
  ...revCases.map((item) => ({ from: item.id, to: item.area, rel: "detected in" })),
];

export function buildKnowledgeGraph(): KnowledgeGraph {
  const context = readPlatformContext();
  const nodes: GraphNode[] = [
    ...staticNodes,
    ...slaTickets.map((ticket): GraphNode => ({ type: "slaTicket", id: ticket.id, label: `${ticket.type} · ${ticket.area}`, href: "/safety/sla-sentinel", status: ticket.status })),
    ...revCases.map((item): GraphNode => ({ type: "revenueCase", id: item.id, label: `${item.type} · ${item.area}`, href: "/safety/rev-guard", status: item.stage })),
    ...context.appointments.map((appointment): GraphNode => ({ type: "appointment", id: appointment.id, label: `${appointment.service} · ${appointment.date}`, href: "/customer/appointment", status: appointment.status })),
    ...currentBills(),
  ];
  const edges: GraphEdge[] = [
    ...staticEdges,
    ...context.appointments.map((appointment) => ({ from: CUSTOMER_ID, to: appointment.id, rel: "booked" })),
    ...context.appointments.map((appointment) => ({ from: appointment.id, to: engineerId(appointment.engineer), rel: "assigned to" })),
  ];
  if (context.liveIncident) {
    nodes.push({ type: "incident", id: context.liveIncident.id, label: `${context.liveIncident.type} · ${context.liveIncident.area}`, href: "/safety/emergency", status: context.liveIncident.status });
    edges.push({ from: CUSTOMER_ID, to: context.liveIncident.id, rel: "reported" }, { from: context.liveIncident.id, to: "Z-MANINAGAR", rel: "located in" });
  }
  return { nodes, edges };
}

function engineerId(name: string): string {
  if (name.includes("Sunil")) return "ENG-SS";
  if (name.includes("Manoj")) return "ENG-MP";
  return "ENG-RK";
}

function currentBills(): GraphNode[] {
  return [{ type: "bill" as EntityType, id: "BILL-JanFeb-2026", label: "Jan–Feb 2026 · ₹1,980", href: "/customer/explainbill" }];
}

/** Every entity directly connected to the given id, with the relationship label. */
export function relatedEntities(id: string): { node: GraphNode; rel: string }[] {
  const graph = buildKnowledgeGraph();
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const related: { node: GraphNode; rel: string }[] = [];
  for (const edge of graph.edges) {
    if (edge.from === id && byId.has(edge.to)) related.push({ node: byId.get(edge.to)!, rel: edge.rel });
    if (edge.to === id && byId.has(edge.from)) related.push({ node: byId.get(edge.from)!, rel: edge.rel });
  }
  return related;
}
