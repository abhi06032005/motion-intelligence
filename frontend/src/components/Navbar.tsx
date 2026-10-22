"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Dumbbell,
  Sparkles,
  Video,
  History,
  LineChart,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/workout", label: "Live Workout", icon: Dumbbell },
  { href: "/yoga", label: "Yoga Assessment", icon: Sparkles },
  { href: "/analyse", label: "Video Analysis", icon: Video },
  { href: "/sessions", label: "Sessions", icon: History },
  { href: "/research", label: "Research Dashboard", icon: LineChart },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-500 shadow-md shadow-emerald-500/10">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white">MotionIQ</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
              Vision Biomechanics
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-slate-800/80 text-white shadow-sm ring-1 ring-slate-700/60"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-emerald-400" : "text-slate-500")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Privacy Pill & CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <div
            title="Client-Side Video: Raw video frames remain local. Anonymous 33-point pose landmark coordinates are streamed to the backend for real-time biomechanical analysis."
            className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-300"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Client-Side Video Privacy</span>
          </div>

          <Link
            href="/workout"
            className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-sm transition-all hover:bg-emerald-400"
          >
            Start Session
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 py-3 sm:px-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-emerald-400" : "text-slate-500")} />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span
              title="Client-Side Video: Raw video frames remain local. Anonymous 33-point pose landmark coordinates are streamed to the backend for real-time biomechanical analysis."
              className="flex items-center gap-1.5 text-emerald-400"
            >
              <ShieldCheck className="h-4 w-4" /> Client-Side Video Privacy
            </span>
            <Link
              href="/workout"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md bg-emerald-500 px-3 py-1 font-semibold text-slate-950"
            >
              Start Session
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
