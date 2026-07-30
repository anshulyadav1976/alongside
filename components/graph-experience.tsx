"use client";

import cytoscape, { type Core, type ElementDefinition, type StylesheetStyle } from "cytoscape";
import { ChevronRight, CircleHelp, Clock3, Eye, Filter, History, Maximize2, MessageCircleQuestion, Network, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { productClient } from "@/lib/client/product-client";
import type { GraphEdge, GraphNode, GraphQueryResponse, GraphResponse } from "@/lib/client/types";

const graphPositions: Record<string, { x: number; y: number }> = {
  event_tomorrow: { x: 500, y: 248 },
  strategy_music: { x: 190, y: 115 },
  boundary_questions: { x: 185, y: 385 },
  preference_plan: { x: 805, y: 115 },
  outcome_reset: { x: 810, y: 390 },
  old_pref: { x: 1090, y: 250 },
};

function nodeLabel(type: GraphNode["type"]) {
  return ({ event: "Upcoming moment", strategy: "Helpful strategy", boundary: "Boundary", preference: "Possible pattern", outcome: "Outcome", person: "Person" })[type];
}

function iconFor(type: GraphNode["type"]) {
  return ({ event: "◷", strategy: "♫", boundary: "◈", preference: "◇", outcome: "◎", person: "●" })[type];
}

function relationshipLabel(predicate: string) {
  return ({ MAY_SUPPORT: "may help with", GUIDES: "keep in mind", RELATES_TO: "related to", CONTRIBUTED_TO: "contributed to" } as Record<string, string>)[predicate] ?? predicate.replaceAll("_", " ").toLowerCase();
}

function isRelated(edge: GraphEdge, nodeId: string | null) { return Boolean(nodeId && (edge.source === nodeId || edge.target === nodeId)); }

const cyStyle: StylesheetStyle[] = [
  { selector: "node", style: { "background-color": "#fffdf8", "border-width": 2, "border-color": "#94ad99", width: 166, height: 166, label: "data(label)", color: "#24312e", "font-family": "Georgia, serif", "font-size": 16, "font-weight": "normal", "text-wrap": "wrap", "text-max-width": "125px", "text-valign": "center", "text-halign": "center", "overlay-opacity": 0 } },
  { selector: "node[kind = 'event']", style: { "background-color": "#fff8e8", "border-color": "#c58a27", width: 185, height: 185, "font-size": 18 } },
  { selector: "node[kind = 'boundary']", style: { "background-color": "#fff8f4", "border-color": "#c67b59" } },
  { selector: "node[kind = 'preference']", style: { "background-color": "#fffaf2", "border-color": "#bb8941" } },
  { selector: "node[kind = 'outcome']", style: { "background-color": "#f8fbf6", "border-color": "#789a80" } },
  { selector: "node.selected", style: { "border-width": 4, "border-color": "#1b4b40" } },
  { selector: "node.dimmed", style: { opacity: 0.34 } },
  { selector: "edge", style: { width: 1.5, "line-color": "#b9c4bb", "target-arrow-color": "#b9c4bb", "target-arrow-shape": "triangle", "curve-style": "bezier", label: "data(label)", color: "#718078", "font-family": "Inter, Arial, sans-serif", "font-size": 10, "font-weight": "normal", "text-rotation": "autorotate", "text-background-color": "#f8f6f0", "text-background-opacity": 0.96, "text-background-padding": "3px", "overlay-opacity": 0 } },
  { selector: "edge.active", style: { width: 3, "line-color": "#2f6b5c", "target-arrow-color": "#2f6b5c", color: "#285c4f", "font-weight": "bold" } },
  { selector: "edge.picked", style: { width: 4, "line-color": "#bd694c", "target-arrow-color": "#bd694c", color: "#984c37" } },
  { selector: "edge.dimmed", style: { opacity: 0.25 } },
];

export function GraphExperience() {
  const [view, setView] = useState<"current" | "history">("current");
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [question, setQuestion] = useState("What tends to help before a difficult conversation?");
  const [answer, setAnswer] = useState<GraphQueryResponse | null>(null);
  const [asking, setAsking] = useState(false);
  const graphElement = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    productClient.getGraph(view).then((nextGraph) => {
      setGraph(nextGraph);
      setSelected(nextGraph.nodes.find((node) => node.type === "event") ?? nextGraph.nodes[0] ?? null);
      setSelectedRelation(null);
    });
  }, [view]);

  const filteredNodes = useMemo(() => graph?.nodes.filter((node) => typeFilter === "all" || node.type === typeFilter) ?? [], [graph, typeFilter]);
  const relevantEdges = useMemo(() => graph?.edges.filter((edge) => filteredNodes.some((node) => node.id === edge.source) && filteredNodes.some((node) => node.id === edge.target)) ?? [], [graph, filteredNodes]);
  const selectedId = selected?.id ?? null;

  useEffect(() => {
    if (!graphElement.current || filteredNodes.length === 0) return;
    const elements: ElementDefinition[] = [
      ...filteredNodes.map((node) => ({ data: { id: node.id, label: `${iconFor(node.type)}\n${node.label}\n${nodeLabel(node.type)}`, kind: node.type }, position: graphPositions[node.id] ?? { x: 160, y: 160 } })),
      ...relevantEdges.map((edge) => ({ data: { id: edge.id, source: edge.source, target: edge.target, label: relationshipLabel(edge.predicate) } })),
    ];
    const cy = cytoscape({ container: graphElement.current, elements, style: cyStyle, layout: { name: "preset", fit: true, padding: 48, animate: false }, minZoom: 0.5, maxZoom: 1.55, wheelSensitivity: 0.15, boxSelectionEnabled: false, selectionType: "single" });
    cyRef.current = cy;

    const highlight = (nodeId: string | null, edgeId: string | null = null) => {
      cy.elements().removeClass("selected active picked dimmed");
      if (!nodeId) return;
      const node = cy.$id(nodeId);
      node.addClass("selected");
      const neighbourhood = node.neighborhood();
      neighbourhood.edges().addClass("active");
      cy.elements().difference(node.union(neighbourhood)).addClass("dimmed");
      if (edgeId) cy.$id(edgeId).removeClass("active").addClass("picked");
    };
    highlight(selectedId, selectedRelation);
    cy.on("tap", "node", (event) => {
      const nodeId = event.target.id();
      setSelected(filteredNodes.find((node) => node.id === nodeId) ?? null);
      setSelectedRelation(null);
      highlight(nodeId);
    });
    cy.on("tap", "edge", (event) => {
      const edgeId = event.target.id();
      const edge = relevantEdges.find((item) => item.id === edgeId);
      setSelectedRelation(edgeId);
      highlight(edge?.source ?? selectedId, edgeId);
    });
    cy.on("tap", (event) => { if (event.target === cy) { setSelectedRelation(null); highlight(selectedId); } });
    return () => { cy.destroy(); if (cyRef.current === cy) cyRef.current = null; };
  }, [filteredNodes, relevantEdges, selectedId, selectedRelation]);

  async function ask() { setAsking(true); try { setAnswer(await productClient.queryGraph(question)); } finally { setAsking(false); } }

  return <div className="graph-page knowledge-graph-page">
    <header className="graph-head knowledge-head"><div><p className="eyebrow">Your memory map</p><h1>Your memories, clearly connected.</h1><p>A view of the events, preferences, and helpful things you chose to keep. Select any circle to see its source and connections.</p></div><div className="legend knowledge-legend"><span><i className="confirmed" /> Confirmed by you</span><span><i className="inferred" /> Possible pattern</span><span><i className="historical" /> Historical</span></div></header>
    <section className="graph-toolbar knowledge-toolbar"><div className="segmented" role="group" aria-label="Graph time view"><button className={view === "current" ? "active" : ""} onClick={() => setView("current")}><Eye size={15} /> What applies now</button><button className={view === "history" ? "active" : ""} onClick={() => setView("history")}><History size={15} /> How this has changed</button></div><div className="graph-actions"><label className="filter-select"><Filter size={15} /><span className="sr-only">Filter memory type</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All memory types</option><option value="event">Upcoming moments</option><option value="strategy">Helpful strategies</option><option value="boundary">Boundaries</option><option value="preference">Possible patterns</option><option value="outcome">Outcomes</option></select></label><button className="fit-map" onClick={() => cyRef.current?.fit(undefined, 48)}><Maximize2 size={15} /> Centre map</button></div></section>
    <div className="graph-layout knowledge-layout"><section className="flow-panel knowledge-flow" aria-label="Interactive memory knowledge graph"><div className="cytoscape-map" ref={graphElement} /><div className="graph-hint"><Network size={15} /> Click a memory to highlight what it connects to.</div>{selectedRelation && <div className="relation-hint">Selected connection: {relevantEdges.find((edge) => edge.id === selectedRelation) ? relationshipLabel(relevantEdges.find((edge) => edge.id === selectedRelation)?.predicate ?? "") : ""}</div>}</section><aside className="inspector-panel knowledge-inspector">{selected ? <><p className="eyebrow">Selected memory</p><div className={`status-pill ${selected.status}`}>{selected.status === "confirmed" ? "✓ Confirmed by you" : selected.status === "inferred" ? "◇ Possible pattern — not a fact" : "◷ Historical"}</div><h2>{selected.label}</h2><p className="node-type">{nodeLabel(selected.type)}</p><dl><div><dt>Valid from</dt><dd>{selected.validFrom ? new Date(selected.validFrom).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" }) : "Not set"}</dd></div><div><dt>Confidence</dt><dd>{selected.status === "inferred" ? "A cautious pattern" : "Confirmed"}</dd></div><div><dt>Connections</dt><dd>{relevantEdges.filter((edge) => isRelated(edge, selected.id)).length} shown</dd></div></dl><div className="source-card"><p className="eyebrow">Source evidence</p><blockquote>“{selected.sourceQuote}”</blockquote><small>From your saved session</small></div><button className="evidence-link" onClick={() => { window.location.assign(`/calls/${selected.sourceSessionId}#${selected.evidenceIds[0]}`); }}>See source transcript <ChevronRight size={16} /></button><div className="inspector-actions"><button className="secondary-action">Change</button><button className="danger-quiet">Forget</button></div></> : <p>Select a memory to see why it is here.</p>}</aside></div>
    <section className="graph-chat"><div className="graph-chat-intro"><div className="chat-icon"><MessageCircleQuestion size={20} /></div><div><p className="eyebrow">Ask about your map</p><h2>Get an answer you can inspect.</h2><p>Alongside distinguishes stored facts from possible patterns.</p></div></div><div className="query-row"><input value={question} onChange={(event) => setQuestion(event.target.value)} aria-label="Question about your memory map" /><button className="primary-action" onClick={ask} disabled={asking || !question.trim()}><Search size={16} /> {asking ? "Looking…" : "Ask"}</button></div>{answer && <div className="answer-grid"><article><p className="eyebrow">Answer</p><h3>{answer.answer}</h3></article><article><p className="eyebrow">Stored facts</p>{answer.facts.map((fact) => <p key={fact.text}><span className="fact-dot" />{fact.text}</p>)}</article><article><p className="eyebrow">Possible patterns</p>{answer.inferences.map((inference) => <p key={inference.text}><span className="inference-dot" />{inference.text}</p>)}</article><article><p className="eyebrow">Uncertainty</p><p>{answer.abstained ? "There is not enough saved information to answer reliably." : answer.uncertainty}</p></article><article className="evidence-list"><p className="eyebrow">Evidence</p><button onClick={() => window.location.assign("/calls/ses_demo_02#turn_1")}><Clock3 size={15} /> Session excerpt</button><button onClick={() => setSelected(graph?.nodes[1] ?? null)}><Network size={15} /> Memory source</button></article></div>}</section>
    <div className="graph-footnote"><CircleHelp size={15} /> Every circle links to evidence you can inspect, change, or remove.</div>
  </div>;
}
