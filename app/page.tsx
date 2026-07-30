"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Ear, Lightbulb, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { productClient, supportModes } from "@/lib/client/product-client";
import type { DashboardData, SupportMode } from "@/lib/client/types";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mode, setMode] = useState<SupportMode>("open");

  useEffect(() => { productClient.getDashboard().then(setData); }, []);
  return <AppShell>
    <div className="page-heading dashboard-heading"><div><p className="eyebrow">A quieter kind of support</p><h1>Good evening.</h1><p className="lead">There is no right way to arrive here. You can talk, make a plan, or take some space.</p></div><div className="privacy-pill"><ShieldCheck size={16} /> You decide what is remembered</div></div>
    <section className="start-card">
      <div><p className="eyebrow gold">Start with what feels useful</p><h2>What would help right now?</h2><p>Choose a direction, or begin without one. You can change your mind at any point.</p></div>
      <div className="mode-list" role="radiogroup" aria-label="Support mode">
        {supportModes.map((item) => <button className={`mode-button ${mode === item.id ? "selected" : ""}`} onClick={() => setMode(item.id)} role="radio" aria-checked={mode === item.id} key={item.id}><span>{item.label}</span><small>{item.detail}</small></button>)}
      </div>
      <Link href={`/call?mode=${mode}`} className="primary-action">Start a call <ArrowRight size={18} /></Link>
    </section>
    {!data ? <div className="loading-card">Getting your space ready…</div> : <div className="dashboard-grid">
      <article className="overview-card upcoming-card"><div className="card-icon"><CalendarDays size={18} /></div><p className="eyebrow">Upcoming moment</p><h3>{data.upcomingMoment.title}</h3><p>{data.upcomingMoment.note}</p><span className="meta"><Clock3 size={14} /> {data.upcomingMoment.occursAt}</span></article>
      <article className="overview-card memory-card"><div className="card-icon"><Lightbulb size={18} /></div><p className="eyebrow">Something you chose to keep</p><h3>{data.memoryInsight.statement}</h3><p className="source-line">“{data.memoryInsight.sourceQuote}”</p><Link href="/graph" className="text-link">See where this came from <ArrowRight size={14} /></Link></article>
      <article className="overview-card journal-card"><div className="card-icon"><Ear size={18} /></div><p className="eyebrow">Latest reflection</p><h3>{data.latestJournal.title}</h3><p>{data.latestJournal.summary}</p><Link href={`/calls/${data.latestJournal.sessionId}`} className="text-link">Open session <ArrowRight size={14} /></Link></article>
      <article className="silence-card"><div><p className="eyebrow">Check-in decision</p><h3>No check-in scheduled</h3><p>{data.checkIn.reason} Alongside will not contact you before the allowed window.</p></div><div className="silence-meta"><span>EARLIEST POSSIBLE</span><strong>{data.checkIn.earliestAllowedAt}</strong><Link href="/settings">Change preferences</Link></div></article>
    </div>}
  </AppShell>;
}
