"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CircleHelp, Network, Phone, Settings2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Home", icon: Sparkles },
  { href: "/call", label: "Call", icon: Phone },
  { href: "/calls", label: "Sessions", icon: BookOpen },
  { href: "/graph", label: "Memory map", icon: Network },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="Alongside home"><span className="brand-mark">a</span><span>alongside</span></Link>
        <p className="sidebar-note">A private place to think things through, at your pace.</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return <Link className={`nav-link ${active ? "active" : ""}`} href={href} key={href}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></Link>;
          })}
        </nav>
        <div className="sidebar-foot"><CircleHelp size={15} /><span>Demo space · your information stays visible to you.</span></div>
      </aside>
      <section className="content-shell">{children}</section>
    </main>
  );
}
