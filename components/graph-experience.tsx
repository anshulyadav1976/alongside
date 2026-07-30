"use client";

import { Controls, Handle, MarkerType, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CalendarDays, ChevronRight, CircleHelp, Clock3, Ear, Eye, Filter, Flag, History, Lightbulb, MessageCircleQuestion, Network, Search, ShieldCheck, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { productClient } from "@/lib/client/product-client";
import type { GraphEdge, GraphNode, GraphQueryResponse, GraphResponse } from "@/lib/client/types";

type FlowData = {
  item: GraphNode;
  isSelected: boolean;
  isConnected: boolean;
  isDimmed: boolean;
  onSelect: (item: GraphNode) => void;
};

const nodeIcons = {
  event: CalendarDays,
  strategy: Ear,
  boundary: ShieldCheck,
  preference: Lightbulb,
  outcome: Target,
  person: Flag,
};

function GraphMemoryNode({ data }: NodeProps<Node<FlowData>>) {
  const { item, isSelected, isConnected, isDimmed, onSelect } = data;
  const Icon = nodeIcons[item.type];
  const stateLabel = item.status === "confirmed" ? "Confirmed by you" : item.status === "inferred" ? "Possible pattern" : "Historical";
  return <button className={`knowledge-node ${item.type} ${item.status} ${isSelected ? "selected" : ""} ${isConnected ? "connected" : ""} ${isDimmed ? "dimmed" : ""}`} onClick={() => onSelect(item)} aria-pressed={isSelected}>
    <Handle type="target" position={Position.Left} className="knowledge-handle" />
    <span className="knowledge-icon"><Icon size={19} strokeWidth={1.7} /></span>
    <strong>{item.label}</strong>
    <small>{nodeLabel(item.type)}</small>
    <span className="node-state">{item.status === "confirmed" ? "✓" : item.status === "inferred" ? "◇" : "◷"} {stateLabel}</span>
    <Handle type="source" position={Position.Right} className="knowledge-handle" />
  </button>;
}

const nodeTypes = { memory: GraphMemoryNode };
const graphPositions: Record<string, { x: number; y: number }> = {
  event_tomorrow: { x: 390, y: 190 },
  strategy_music: { x: 70, y: 54 },
  boundary_questions: { x: 68, y: 354 },
  preference_plan: { x: 728, y: 52 },
  outcome_reset: { x: 760, y: 352 },
  old_pref: { x: 1070, y: 195 },
};

function nodeLabel(type: GraphNode["type"]) {
  return ({ event: "Upcoming moment", strategy: "Helpful strategy", boundary: "Boundary", preference: "Possible pattern", outcome: "Outcome", person: "Person" })[type];
}

function relationshipLabel(predicate: string) {
  return ({ MAY_SUPPORT: "may help with", GUIDES: "keep in mind", RELATES_TO: "related to", CONTRIBUTED_TO: "contributed to" } as Record<string, string>)[predicate] ?? predicate.replaceAll("_", " ").toLowerCase();
}

function isRelated(edge: GraphEdge, nodeId: string | null) { return Boolean(nodeId && (edge.source === nodeId || edge.target === nodeId)); }

export function GraphExperience() {
  const [view, setView] = useState<"current" | "history">("current");
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [question, setQuestion] = useState("What tends to help before a difficult conversation?");
  const [answer, setAnswer] = useState<GraphQueryResponse | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    productClient.getGraph(view).then((nextGraph) => {
      setGraph(nextGraph);
      setSelected(nextGraph.nodes.find((node) => node.type === "event") ?? nextGraph.nodes[0] ?? null);
      setSelectedEdgeId(null);
    });
  }, [view]);

  const filteredNodes = useMemo(() => graph?.nodes.filter((node) => typeFilter === "all" || node.type === typeFilter) ?? [], [graph, typeFilter]);
  const relevantEdges = useMemo(() => graph?.edges.filter((edge) => filteredNodes.some((node) => node.id === edge.source) && filteredNodes.some((node) => node.id === edge.target)) ?? [], [graph, filteredNodes]);
  const selectedId = selected?.id ?? null;
  const nodes = useMemo<Node<FlowData>[]>(() => filteredNodes.map((item, index) => {
    const connected = relevantEdges.some((edge) => isRelated(edge, item.id) && isRelated(edge, selectedId));
    return {
      id: item.id,
      type: "memory",
      position: graphPositions[item.id] ?? { x: 100 + index * 200, y: 160 },
      data: { item, isSelected: item.id === selectedId, isConnected: connected, isDimmed: Boolean(selectedId && item.id !== selectedId && !connected), onSelect: (next) => { setSelected(next); setSelectedEdgeId(null); } },
    };
  }), [filteredNodes, relevantEdges, selectedId]);
  const edges = useMemo<Edge[]>(() => relevantEdges.map((edge) => {
    const active = isRelated(edge, selectedId);
    const picked = edge.id === selectedEdgeId;
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: relationshipLabel(edge.predicate),
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: picked ? "#bd694c" : active ? "#2f6b5c" : "#aebbb1" },
      className: `${active ? "edge-active" : "edge-muted"} ${picked ? "edge-picked" : ""}`,
      style: { stroke: picked ? "#bd694c" : active ? "#2f6b5c" : "#b9c4bb", strokeWidth: picked || active ? 2.8 : 1.3, opacity: selectedId && !active ? 0.38 : 1 },
      labelStyle: { fill: picked ? "#9b4e36" : active ? "#285c4f" : "#718078", fontWeight: active ? 700 : 500, fontSize: 10 },
      labelBgStyle: { fill: "#f8f6f0", fillOpacity: 0.94 },
      labelBgPadding: [4, 3] as [number, number],
      labelBgBorderRadius: 4,
    };
  }), [relevantEdges, selectedEdgeId, selectedId]);

  async function ask() { setAsking(true); try { setAnswer(await productClient.queryGraph(question)); } finally { setAsking(false); } }

  return <div className="graph-page knowledge-graph-page">
    <header className="graph-head knowledge-head"><div><p className="eyebrow">Your memory map</p><h1>Your memories, clearly connected.</h1><p>A view of the events, preferences, and helpful things you chose to keep. Select any circle to see its source and connections.</p></div><div className="legend knowledge-legend"><span><i className="confirmed" /> Confirmed by you</span><span><i className="inferred" /> Possible pattern</span><span><i className="historical" /> Historical</span></div></header>
    <section className="graph-toolbar knowledge-toolbar"><div className="segmented" role="group" aria-label="Graph time view"><button className={view === "current" ? "active" : ""} onClick={() => setView("current")}><Eye size={15} /> What applies now</button><button className={view === "history" ? "active" : ""} onClick={() => setView("history")}><History size={15} /> How this has changed</button></div><label className="filter-select"><Filter size={15} /><span className="sr-only">Filter memory type</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All memory types</option><option value="event">Upcoming moments</option><option value="strategy">Helpful strategies</option><option value="boundary">Boundaries</option><option value="preference">Possible patterns</option><option value="outcome">Outcomes</option></select></label></section>
    <div className="graph-layout knowledge-layout"><section className="flow-panel knowledge-flow" aria-label="Interactive memory knowledge graph"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)} onPaneClick={() => setSelectedEdgeId(null)} fitView fitViewOptions={{ padding: 0.16 }} proOptions={{ hideAttribution: true }}><Controls showInteractive={false} /></ReactFlow><div className="graph-hint"><Network size={15} /> Click a memory to highlight what it connects to.</div></section><aside className="inspector-panel knowledge-inspector">{selected ? <><p className="eyebrow">Selected memory</p><div className={`status-pill ${selected.status}`}>{selected.status === "confirmed" ? "✓ Confirmed by you" : selected.status === "inferred" ? "◇ Possible pattern — not a fact" : "◷ Historical"}</div><h2>{selected.label}</h2><p className="node-type">{nodeLabel(selected.type)}</p><dl><div><dt>Valid from</dt><dd>{selected.validFrom ? new Date(selected.validFrom).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" }) : "Not set"}</dd></div><div><dt>Confidence</dt><dd>{selected.status === "inferred" ? "A cautious pattern" : "Confirmed"}</dd></div><div><dt>Connections</dt><dd>{relevantEdges.filter((edge) => isRelated(edge, selected.id)).length} shown</dd></div></dl><div className="source-card"><p className="eyebrow">Source evidence</p><blockquote>“{selected.sourceQuote}”</blockquote><small>From your saved session</small></div><button className="evidence-link" onClick={() => { window.location.assign(`/calls/${selected.sourceSessionId}#${selected.evidenceIds[0]}`); }}>See source transcript <ChevronRight size={16} /></button><div className="inspector-actions"><button className="secondary-action">Change</button><button className="danger-quiet">Forget</button></div></> : <p>Select a memory to see why it is here.</p>}</aside></div>
    <section className="graph-chat"><div className="graph-chat-intro"><div className="chat-icon"><MessageCircleQuestion size={20} /></div><div><p className="eyebrow">Ask about your map</p><h2>Get an answer you can inspect.</h2><p>Alongside distinguishes stored facts from possible patterns.</p></div></div><div className="query-row"><input value={question} onChange={(event) => setQuestion(event.target.value)} aria-label="Question about your memory map" /><button className="primary-action" onClick={ask} disabled={asking || !question.trim()}><Search size={16} /> {asking ? "Looking…" : "Ask"}</button></div>{answer && <div className="answer-grid"><article><p className="eyebrow">Answer</p><h3>{answer.answer}</h3></article><article><p className="eyebrow">Stored facts</p>{answer.facts.map((fact) => <p key={fact.text}><span className="fact-dot" />{fact.text}</p>)}</article><article><p className="eyebrow">Possible patterns</p>{answer.inferences.map((inference) => <p key={inference.text}><span className="inference-dot" />{inference.text}</p>)}</article><article><p className="eyebrow">Uncertainty</p><p>{answer.abstained ? "There is not enough saved information to answer reliably." : answer.uncertainty}</p></article><article className="evidence-list"><p className="eyebrow">Evidence</p><button onClick={() => window.location.assign("/calls/ses_demo_02#turn_1")}><Clock3 size={15} /> Session excerpt</button><button onClick={() => setSelected(graph?.nodes[1] ?? null)}><Network size={15} /> Memory source</button></article></div>}</section>
    <div className="graph-footnote"><CircleHelp size={15} /> Every circle links to evidence you can inspect, change, or remove.</div>
  </div>;
}
