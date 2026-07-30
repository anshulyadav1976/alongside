"use client";

import { Background, Controls, Handle, MiniMap, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChevronRight, CircleHelp, Clock3, Eye, Filter, History, MessageCircleQuestion, Network, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { productClient } from "@/lib/client/product-client";
import type { GraphNode, GraphQueryResponse, GraphResponse } from "@/lib/client/types";

type FlowData = { item: GraphNode; onSelect: (item: GraphNode) => void };
function MemoryNode({ data }: NodeProps<Node<FlowData>>) {
  const { item, onSelect } = data;
  return <button className={`flow-node ${item.status}`} onClick={() => onSelect(item)}><Handle type="target" position={Position.Left} /><span className="node-symbol">{item.status === "confirmed" ? "●" : item.status === "historical" ? "◌" : "◇"}</span><strong>{item.label}</strong><small>{item.type}</small><Handle type="source" position={Position.Right} /></button>;
}
const nodeTypes = { memory: MemoryNode };

const positionFor = (index: number) => ({ x: 45 + (index % 3) * 300, y: 45 + Math.floor(index / 3) * 150 });

export function GraphExperience() {
  const [view, setView] = useState<"current" | "history">("current");
  const [graph, setGraph] = useState<GraphResponse | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [question, setQuestion] = useState("What tends to help before a difficult conversation?");
  const [answer, setAnswer] = useState<GraphQueryResponse | null>(null);
  const [asking, setAsking] = useState(false);
  useEffect(() => { productClient.getGraph(view).then((nextGraph) => { setGraph(nextGraph); setSelected(nextGraph.nodes[0] ?? null); }); }, [view]);
  const filteredNodes = useMemo(() => graph?.nodes.filter((node) => typeFilter === "all" || node.type === typeFilter) ?? [], [graph, typeFilter]);
  const nodes = useMemo<Node<FlowData>[]>(() => filteredNodes.map((item, index) => ({ id: item.id, type: "memory", position: positionFor(index), data: { item, onSelect: setSelected } })), [filteredNodes]);
  const edges = useMemo<Edge[]>(() => (graph?.edges.filter((edge) => filteredNodes.some((node) => node.id === edge.source) && filteredNodes.some((node) => node.id === edge.target)).map((edge) => ({ id: edge.id, source: edge.source, target: edge.target, label: edge.predicate.replaceAll("_", " ").toLowerCase(), type: "smoothstep", animated: false })) ?? []), [graph, filteredNodes]);
  async function ask() { setAsking(true); try { setAnswer(await productClient.queryGraph(question)); } finally { setAsking(false); } }
  return <div className="graph-page"><header className="graph-head"><div><p className="eyebrow">Your memory map</p><h1>What you chose to keep, in context.</h1><p>The current view shows what applies now. History keeps changes visible without treating the past as the present.</p></div><div className="legend"><span><i className="confirmed" /> Confirmed</span><span><i className="inferred" /> Inference</span><span><i className="historical" /> Historical</span></div></header>
    <section className="graph-toolbar"><div className="segmented" role="group" aria-label="Graph time view"><button className={view === "current" ? "active" : ""} onClick={() => setView("current")}><Eye size={15} /> Current</button><button className={view === "history" ? "active" : ""} onClick={() => setView("history")}><History size={15} /> History</button></div><label className="filter-select"><Filter size={15} /><span className="sr-only">Filter node type</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All types</option><option value="person">People</option><option value="event">Events</option><option value="strategy">Strategies</option><option value="coping_strategy">Coping strategies</option><option value="boundary">Boundaries</option><option value="preference">Preferences</option></select></label></section>
    <div className="graph-layout"><section className="flow-panel"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView proOptions={{ hideAttribution: true }}><Background gap={18} size={1} /><Controls showInteractive={false} /><MiniMap zoomable pannable /></ReactFlow></section><aside className="inspector-panel">{selected ? <><p className="eyebrow">Selected detail</p><div className={`status-pill ${selected.status}`}>{selected.status === "confirmed" ? "● Confirmed by you" : selected.status === "inferred" ? "◇ Inference" : "◌ Historical"}</div><h2>{selected.label}</h2><p className="node-type">{selected.type}</p><dl><div><dt>Valid from</dt><dd>{selected.validFrom ? new Date(selected.validFrom).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" }) : "Not set"}</dd></div><div><dt>Confidence</dt><dd>{selected.status === "inferred" ? "76%" : "Confirmed"}</dd></div><div><dt>Evidence</dt><dd>Session source available</dd></div></dl><blockquote>“{selected.sourceQuote}”</blockquote><button className="evidence-link" onClick={() => { window.location.assign(`/calls/${selected.sourceSessionId}#${selected.evidenceIds[0]}`); }}>Open source transcript <ChevronRight size={16} /></button><button className="secondary-action wide">Edit or forget</button></> : <p>Select an item in the graph to see why it is here.</p>}</aside></div>
    <section className="graph-chat"><div className="graph-chat-intro"><div className="chat-icon"><MessageCircleQuestion size={20} /></div><div><p className="eyebrow">Ask about your map</p><h2>Get an answer you can inspect.</h2><p>Alongside separates what is stored from what it is only inferring.</p></div></div><div className="query-row"><input value={question} onChange={(event) => setQuestion(event.target.value)} aria-label="Question about your memory map" /><button className="primary-action" onClick={ask} disabled={asking || !question.trim()}><Search size={16} /> {asking ? "Looking…" : "Ask"}</button></div>{answer && <div className="answer-grid"><article><p className="eyebrow">Answer</p><h3>{answer.answer}</h3></article><article><p className="eyebrow">Stored facts</p>{answer.facts.map((fact) => <p key={fact.text}><span className="fact-dot" />{fact.text}</p>)}</article><article><p className="eyebrow">Inferences</p>{answer.inferences.map((inference) => <p key={inference.text}><span className="inference-dot" />{inference.text}</p>)}</article><article><p className="eyebrow">Uncertainty</p><p>{answer.abstained ? "There is not enough saved information to answer reliably." : answer.uncertainty}</p></article><article className="evidence-list"><p className="eyebrow">Evidence</p><button onClick={() => window.location.assign("/calls/ses_demo_02#turn_1")}><Clock3 size={15} /> Session excerpt</button><button onClick={() => setSelected(graph?.nodes[1] ?? null)}><Network size={15} /> Memory source</button></article></div>}</section>
    <div className="graph-footnote"><CircleHelp size={15} /> The map is built from approved memories and journal evidence. You can change or remove any part of it.</div>
  </div>;
}
