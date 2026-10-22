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
  Bell,
  Settings,
  ShieldCheck,
  Menu,
  X,
  Activity,
  Layers,
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
              placeholder="Search..."
              className="w-full bg-white rounded-full border border-[#E9EBED] pl-9 pr-4 py-2 text-xs sm:text-sm text-[#202226] placeholder-[#8E9399] shadow-2xs focus:outline-none focus:border-[#202226] focus:ring-1 focus:ring-[#202226] transition-all"
            />
          </div>
        </div>

        {/* Right: Status Pill, Notification, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mint Status Pill */}
          <div
            title="Raw webcam frames are processed client-side via WebAssembly; 33 landmark points streamed via WebSockets."
            className="hidden sm:flex items-center gap-2 bg-[#D9F0EC] text-[#202226] px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online support</span>
          </div>

          {/* Notification Icon Button */}
          <button
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white border border-[#E9EBED] flex items-center justify-center text-[#202226] hover:bg-slate-50 transition-colors shadow-2xs relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-[#202226]" />
            <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 bg-white border border-[#E9EBED] pl-3 pr-1.5 py-1 rounded-full shadow-2xs">
            <span className="hidden md:inline text-xs font-semibold text-[#202226]">
              Nika Meyer
            </span>
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-tr from-[#EDE2F2] to-[#D9F0EC] border border-[#E9EBED] flex items-center justify-center text-[#202226] font-bold text-xs overflow-hidden">
              <span className="text-[11px] font-bold text-[#202226]">NM</span>
            </div>
          </div>

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

          {/* Bottom Controls: Switch pill & Avatar */}
          <div className="flex flex-col items-center gap-3.5 w-full pt-4">
            {/* Vertical Switch Toggle Pill matching screenshot */}
            <div
              title="Camera WebAssembly Acceleration"
              className="h-12 w-6 rounded-full bg-[#202226] p-0.5 flex flex-col justify-end items-center cursor-pointer shadow-xs"
            >
              <div className="h-5 w-5 rounded-full bg-[#D9F0EC] flex items-center justify-center shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#202226]" />
              </div>
            </div>

            {/* Bottom mini avatar pill matching screenshot */}
            <div className="flex flex-col items-center gap-1.5 p-1 rounded-2xl bg-[#F0F1F3] border border-[#E9EBED]">
              <div className="h-7 w-7 rounded-full bg-[#EDE2F2] border border-[#E9EBED] flex items-center justify-center text-[10px] font-bold text-[#202226]">
                NM
              </div>
            </div>
          </div>
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
