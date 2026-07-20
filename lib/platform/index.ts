"use client";

// ---- SuRaksha platform layer ----
// Single import surface for the cross-module intelligence engine:
//   events          — typed event bus every action emits into
//   effects         — business-impact propagation (fan-out per event)
//   facts           — canonical cross-module facts
//   kpis            — live KPI deltas over the ops baselines
//   recommendations — cross-module recommendation engine
//   context         — shared platform/AI context snapshot
//   timeline        — unified cross-suite timeline
//   graph           — platform knowledge graph

export { emitPlatformEvent, readEventLog, usePlatformEvents } from "./events";
export type { PlatformEvent, PlatformEventType, PlatformEventInput, EntityRef, EntityType } from "./events";
export { readFacts, updateFacts } from "./facts";
export type { PlatformFacts, BillAnalysisFact } from "./facts";
export { usePlatformKpis, computePlatformKpis, readKpiDeltas } from "./kpis";
export type { PlatformKpis, KpiDeltas } from "./kpis";
export { useRecommendations, getRecommendations, addDynamicRecommendation, resolveRecommendation } from "./recommendations";
export type { Recommendation, RecommendationPriority } from "./recommendations";
export { readPlatformContext, usePlatformContext, describePlatformContext } from "./context";
export type { PlatformContext } from "./context";
export { usePlatformTimeline, readPlatformTimeline } from "./timeline";
export type { TimelineItem, TimelineCategory } from "./timeline";
export { buildKnowledgeGraph, relatedEntities } from "./graph";
export type { GraphNode, GraphEdge, KnowledgeGraph } from "./graph";
export { PLATFORM_SIGNAL } from "./store";
