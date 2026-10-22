import Link from "next/link";
import { ShieldAlert, BookOpen, Code2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base font-bold text-white">MotionIQ</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">v1.0-research</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              View-Aware & Uncertainty-Aware Human Movement Assessment and Real-Time Exercise Coaching.
              Developed for reproducible motion analysis research relevant to Erasmus Mundus IPCVAI and IMLEX programmes.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Open-Source Foundation</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>
                <span className="text-slate-300">Base Engine: </span>
                <a href="https://github.com/shahmir2004/exercise-form-correction" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">
                  exercise-form-correction (MIT)
                </a>
              </li>
              <li>
                <span className="text-slate-300">Kinematic Adapter: </span>
                <a href="https://github.com/davidpagnon/Sports2D" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">
                  Sports2D (BSD-3-Clause)
                </a>
              </li>
              <li>
                <span className="text-slate-300">Vision Model: </span>
                <a href="https://github.com/google-ai-edge/mediapipe" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">
                  Google MediaPipe BlazePose
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3.5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1.5">
                <ShieldAlert className="h-4 w-4" />
                <span>Non-Medical Safety Disclaimer</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/80">
                MotionIQ is an exercise technique and movement visualization research prototype. It does not provide medical diagnosis, treatment, or injury assessment. Please consult qualified sports healthcare professionals before initiating physical rehabilitation.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 MotionIQ Project. Licensed under MIT & open-source compliant licenses.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <Link href="/research" className="hover:text-slate-300 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" /> Benchmarks
            </Link>
            <a href="https://github.com/shahmir2004/exercise-form-correction" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 flex items-center gap-1">
              <Code2 className="h-3.5 w-3.5" /> Upstream Repo
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
