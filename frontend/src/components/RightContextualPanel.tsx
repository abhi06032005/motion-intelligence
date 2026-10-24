"use client";

import Link from "next/link";
import { ArrowUpRight, Camera, ChevronRight, Dumbbell, Sparkles, Video, Zap } from "lucide-react";

interface RightContextualPanelProps {
  totalSessions?: number;
  totalMovements?: number;
}

const MOVEMENTS = [
  { label: "Squat & strength", href: "/workout", Icon: Dumbbell, tint: "bg-[#D9F0EC]" },
  { label: "Live form assessment", href: "/workout", Icon: Camera, tint: "bg-[#EAF7F5]" },
  { label: "Video analysis", href: "/analyse", Icon: Video, tint: "bg-[#EDE2F2]" },
  { label: "Yoga postures", href: "/yoga", Icon: Sparkles, tint: "bg-[#F6E8F1]" },
];

export function RightContextualPanel({ totalSessions = 0, totalMovements = 0 }: RightContextualPanelProps) {
  return (
    <div className="flex flex-col gap-3.5 w-full">
      <section className="rounded-[26px] border border-[#E9EBED] bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#8E9399]">Motion capture</span>
          <Camera className="h-4 w-4 text-[#202226]" aria-hidden="true" />
        </div>
        <div className="my-5 flex justify-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#D9F0EC] bg-[#EAF7F5]">
            <svg viewBox="0 0 100 100" fill="none" className="h-20 w-20" aria-hidden="true">
              <circle cx="50" cy="27" r="12" stroke="#202226" strokeWidth="2.5" />
              <path d="M50 40v30m0-22L28 59m22-11 22 11M50 70 32 90m18-20 18 20" stroke="#202226" strokeWidth="3" strokeLinecap="round" />
              <circle cx="28" cy="59" r="4" fill="#D9F0EC" stroke="#202226" />
              <circle cx="72" cy="59" r="4" fill="#D9F0EC" stroke="#202226" />
            </svg>
          </div>
        </div>
        <Link href="/workout" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#202226] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black">
          Start live analysis <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <p className="mt-3 text-center text-[11px] text-[#8E9399]">Camera is off until you explicitly start it.</p>
      </section>

      <section className="rounded-[26px] border border-[#E9EBED] bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#202226]">Your recorded activity</h2>
          <Link href="/sessions" aria-label="Open session history" className="text-[#8E9399] hover:text-[#202226]"><ChevronRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#EAF7F5] p-3"><p className="text-2xl font-extrabold">{totalSessions}</p><p className="text-[11px] text-[#8E9399]">Sessions</p></div>
          <div className="rounded-2xl bg-[#EDE2F2] p-3"><p className="text-2xl font-extrabold">{totalMovements}</p><p className="text-[11px] text-[#8E9399]">Repetitions</p></div>
        </div>
        {totalSessions === 0 && <p className="mt-3 text-[11px] text-[#8E9399]">Your first completed session will appear here.</p>}
      </section>

      <section className="rounded-[26px] border border-[#E9EBED] bg-white p-4 shadow-2xs">
        <h2 className="mb-3 text-xs font-bold text-[#202226]">Explore movements</h2>
        <div className="space-y-1">
          {MOVEMENTS.map(({ label, href, Icon, tint }) => (
            <Link key={label} href={href} className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-[#F0F1F3] focus-visible:outline-2 focus-visible:outline-[#202226]">
              <span className="flex items-center gap-2.5 text-xs font-semibold"><span className={"flex h-8 w-8 items-center justify-center rounded-xl " + tint}><Icon className="h-4 w-4" /></span>{label}</span>
              <ChevronRight className="h-4 w-4 text-[#8E9399]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[26px] bg-[#202223] p-4 text-white shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold"><Zap className="h-4 w-4 text-[#D9F0EC]" /> Data & privacy</div>
        <p className="mt-2 text-[11px] leading-relaxed text-[#C6CBD0]">Raw webcam video is processed locally for pose detection. Extracted landmark coordinates are sent to the backend for movement feedback. Sessions are saved in this browser.</p>
        <Link href="/research" className="mt-3 inline-flex text-[11px] font-semibold text-[#D9F0EC] hover:underline">Research methodology →</Link>
      </section>
    </div>
  );
}
