"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Camera,
  Video,
  Sparkles,
  History,
  LineChart,
  Search,
  Menu,
  X,
  Activity,
} from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/workout", label: "Live Analysis", icon: Camera },
  { href: "/analyse", label: "Video Analysis", icon: Video },
  { href: "/yoga", label: "Yoga Assessment", icon: Sparkles },
  { href: "/sessions", label: "Sessions", icon: History },
  { href: "/research", label: "Research", icon: LineChart },
];

export function DashboardShell({ children, rightPanel }: DashboardShellProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F1F3] p-2.5 sm:p-4 md:p-5 text-[#202226] flex flex-col font-sans selection:bg-[#D9F0EC] selection:text-[#202226]">
      {/* TOP GLOBAL BAR */}
      <header className="mb-3.5 sm:mb-4 flex items-center justify-between gap-3 px-1.5 sm:px-2">
        {/* Left: Brand Logo & Search Pill */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform active:scale-95"
            aria-label="MotionIQ Home"
          >
            {/* Minimal Geometric Logo matching the screenshot's top-left icon */}
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-[#202226] flex items-center justify-center shadow-xs text-white transition-all group-hover:bg-black">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#D9F0EC]"
              >
                <path
                  d="M12 3L4 9L12 15L20 9L12 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 14L12 20L20 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Link>

          {/* Search Pill Input */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E9399]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a page..."
              aria-label="Search MotionIQ pages"
              className="w-full bg-white rounded-full border border-[#E9EBED] pl-9 pr-4 py-2 text-xs sm:text-sm text-[#202226] placeholder-[#8E9399] shadow-2xs focus:outline-none focus:border-[#202226] focus:ring-1 focus:ring-[#202226] transition-all"
            />
            {searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-[#E9EBED] bg-white p-2 shadow-lg">
                {NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(searchQuery.trim().toLowerCase())).length === 0 ? (
                  <p className="px-3 py-2 text-xs text-[#8E9399]">No matching pages</p>
                ) : NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(searchQuery.trim().toLowerCase())).map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setSearchQuery("")} className="block rounded-xl px-3 py-2 text-xs font-semibold hover:bg-[#F0F1F3]">{item.label}</Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: App navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mint Status Pill */}
          <div
            title="Raw webcam frames are processed client-side via WebAssembly; 33 landmark points streamed via WebSockets."
            className="hidden sm:flex items-center gap-2 bg-[#D9F0EC] text-[#202226] px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs"
          >
            <span className="h-2 w-2 rounded-full bg-[#202226]" />
            <span>Browser pose tracking</span>
          </div>

          <Link href="/sessions" className="hidden sm:flex items-center gap-2 rounded-full border border-[#E9EBED] bg-white px-3.5 py-2 text-xs font-semibold text-[#202226] hover:bg-[#EAF7F5]">
            <Activity className="h-4 w-4" /> My sessions
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden h-9 w-9 rounded-2xl bg-white border border-[#E9EBED] flex items-center justify-center text-[#202226]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* MOBILE FLYOUT NAVIGATION */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white rounded-3xl border border-[#E9EBED] p-3 mb-4 shadow-sm space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-[#D9F0EC] text-[#202226]"
                    : "text-[#8E9399] hover:bg-[#F0F1F3] hover:text-[#202226]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* THREE-COLUMN BODY LAYOUT */}
      <div className="flex-1 flex gap-3 sm:gap-4 md:gap-5 items-stretch min-h-0">
        {/* LEFT ICON SIDEBAR (Narrow vertical icon bar) */}
        <aside className="hidden md:flex flex-col items-center justify-between w-16 sm:w-18 bg-white/80 backdrop-blur-md rounded-[28px] border border-[#E9EBED] py-5 px-2 shadow-2xs shrink-0">
          {/* Top navigation icons */}
          <div className="flex flex-col items-center gap-3 w-full">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl transition-all ${
                    isActive
                      ? "bg-[#D9F0EC] text-[#202226] shadow-xs"
                      : "text-[#8E9399] hover:text-[#202226] hover:bg-[#F0F1F3]"
                  }`}
                >
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                  {isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-3 rounded-r-full bg-[#202226]" />
                  )}
                </Link>
              );
            })}
          </div>

          <Link href="/research" title="Explore research methodology" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF7F5] text-[#202226] hover:bg-[#D9F0EC]">
            <LineChart className="h-4 w-4" />
          </Link>
        </aside>

        {/* CENTER PRIMARY WHITE WORKSPACE */}
        <main className="flex-1 bg-white rounded-[28px] sm:rounded-[32px] border border-[#E9EBED] p-5 sm:p-7 md:p-8 shadow-2xs min-w-0 overflow-y-auto">
          {children}
        </main>

        {/* RIGHT CONTEXTUAL RAIL */}
        {rightPanel && (
          <aside className="hidden xl:flex flex-col w-[265px] 2xl:w-[285px] shrink-0 gap-3.5">
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
