"use client";

import Link from "next/link";
import { ArrowUpRight, Clock3, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { productClient } from "@/lib/client/product-client";
import type { Session } from "@/lib/client/types";

export default function CallsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => { productClient.listSessions().then(setSessions); }, []);
  return <AppShell><div className="page-heading split-heading"><div><p className="eyebrow">Your sessions</p><h1>A record you can revisit.</h1><p className="lead">Each conversation is available to inspect, revise, or remove.</p></div><Link href="/call" className="primary-action"><Plus size={17} /> Start a call</Link></div><section className="sessions-list">{sessions.map((session, index) => <Link href={`/calls/${session.id}`} key={session.id} className="session-row"><div className="session-index">0{index + 1}</div><div><p className="eyebrow">{session.requestedSupportMode} · {new Date(session.startedAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}</p><h2>{index === 0 ? "Preparing for tomorrow" : "Making room to talk"}</h2><p>{session.state === "ready_for_review" ? "Journal ready for your review" : "Session available"}</p></div><span><Clock3 size={15} /> {session.durationLabel}</span><ArrowUpRight size={18} /></Link>)}</section></AppShell>;
}
