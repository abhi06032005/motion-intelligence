"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, Sparkles, Video, History, LineChart, ShieldCheck } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-500 shadow-md shadow-indigo-500/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white">MotionIQ</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">View-Aware AI</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-emerald-400" : "text-slate-500")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Zero-Retention Camera</span>
          </div>

          <Link
            href="/workout"
            className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow-emerald-500/25"
          >
            Start Session
          </Link>
        </div>
      </div>
    </header>
  );
}
