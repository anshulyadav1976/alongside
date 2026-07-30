"use client";

import { BellOff, Clock3, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { productClient } from "@/lib/client/product-client";

export default function SettingsPage() {
  const [checkins, setCheckins] = useState(false);
  const [sensitive, setSensitive] = useState(true);
  const [saved, setSaved] = useState(false);
  useEffect(() => { productClient.getCheckInSettings().then((settings) => setCheckins(settings.enabled)); }, []);
  async function savePreferences() { await productClient.updateCheckInSettings({ enabled: checkins, maxPerWeek: checkins ? 1 : 0, cooldownHours: 24 }); setSaved(true); window.setTimeout(() => setSaved(false), 2200); }
  return <AppShell><div className="page-heading"><p className="eyebrow">Settings</p><h1>Your space, your rules.</h1><p className="lead">These controls decide what Alongside may remember, mention, and initiate.</p></div><div className="settings-layout"><section className="settings-section"><div className="settings-title"><ShieldCheck size={20} /><div><h2>Memory</h2><p>Choose how carefully Alongside should handle personal context.</p></div></div><SettingToggle label="Ask before sensitive references" detail="Alongside checks before raising memories marked as sensitive." enabled={sensitive} setEnabled={setSensitive} /><SettingToggle label="Suggest memories after calls" detail="Nothing becomes lasting unless you confirm it." enabled setEnabled={() => {}} /><button className="secondary-action">Review all memories</button></section><section className="settings-section"><div className="settings-title"><BellOff size={20} /><div><h2>Check-ins</h2><p>Silence is the default unless you choose otherwise.</p></div></div><SettingToggle label="Allow check-ins" detail="When on, you still control timing, frequency, and pauses." enabled={checkins} setEnabled={setCheckins} /><div className="settings-rule"><Clock3 size={17} /><div><strong>Quiet hours</strong><span>8:00 PM — 10:00 AM</span></div><button>Change</button></div><div className="settings-rule"><SlidersHorizontal size={17} /><div><strong>Maximum frequency</strong><span>Once each week</span></div><button>Change</button></div></section><section className="settings-section data-section"><h2>Your information</h2><p>Open, correct, export, or delete what this demo has saved. You are always able to see the source behind a remembered item.</p><div><button className="secondary-action">Export journal & map</button><button className="danger-quiet">Delete a session</button></div></section><button className="primary-action" onClick={savePreferences}>{saved ? "Preferences saved" : "Save preferences"}</button></div></AppShell>;
}

function SettingToggle({ label, detail, enabled, setEnabled }: { label: string; detail: string; enabled: boolean; setEnabled: (value: boolean) => void }) { return <div className="setting-toggle"><div><strong>{label}</strong><p>{detail}</p></div><button className={`switch ${enabled ? "on" : ""}`} role="switch" aria-checked={enabled} onClick={() => setEnabled(!enabled)}><span /></button></div>; }
