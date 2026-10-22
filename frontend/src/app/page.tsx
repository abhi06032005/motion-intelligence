import Link from "next/link";
import {
  Activity,
  Dumbbell,
  ShieldCheck,
  Eye,
  LineChart,
  Sparkles,
  Video,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Award,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950 px-4 py-20 sm:px-6 lg:py-28">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1.5 text-xs font-medium text-indigo-300 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Erasmus Mundus IPCVAI & IMLEX Scientific Portfolio Project</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-tight">
            View-Aware & Uncertainty-Aware <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Human Movement Assessment
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg leading-relaxed">
            MotionIQ bridges real-time biomechanical computer vision with statistical reliability gating. 
            Evaluate exercise form, count repetitions, and detect technique deviations from commodity webcams—with zero raw video uploaded.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/workout"
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/30"
            >
              <Dumbbell className="h-4 w-4" />
              Start Live Workout
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/research"
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <LineChart className="h-4 w-4 text-emerald-400" />
              Explore Research Benchmarks
            </Link>
          </div>

          {/* Privacy Badge */}
          <div className="mt-12 flex items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              100% Client-Side Video Processing
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-indigo-400" />
              End-to-end latency not yet established
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-teal-400" />
              HMM + View-Gated Probabilities
            </span>
          </div>
        </div>
      </section>

      {/* Core Contributions Section */}
      <section className="w-full border-b border-slate-800 bg-slate-950 px-4 py-16 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Research Contribution</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Research hypotheses under evaluation
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
              MotionIQ explores view-aware rule suppression and uncertainty handling. The current benchmark contains synthetic fixtures and label leakage; human validation is outstanding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">3D View-Aware Normalization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Research wrappers estimate body orientation and attempt to suppress rules for unsuitable views. Suppression correctness and viewpoint robustness have not been established on human recordings.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Heuristic Uncertainty & Abstention</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Research Model D combines visibility, covariance and body scale into a heuristic score. Calibration is unvalidated and its historical Brier score is worse than baseline. The live workout uses the baseline pipeline.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Temporal Trajectory Dynamics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Research wrappers compute angular velocity, a finite-difference smoothness heuristic and angular symmetry. They do not implement SPARC; the phase pacing result is currently unset.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Exercises */}
      <section className="w-full border-b border-slate-800 bg-slate-900/30 px-4 py-16 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Supported Movements</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Implemented Movement Heuristics
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
              <span className="text-xs font-medium text-emerald-400">Dynamic Exercise</span>
              <h4 className="text-base font-bold text-white mt-1">Bodyweight Squat</h4>
              <p className="text-xs text-slate-400 mt-2">
                Monitors hip depth, knee valgus collapse, torso forward lean, and repetition tempo.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
              <span className="text-xs font-medium text-emerald-400">Dynamic Exercise</span>
              <h4 className="text-base font-bold text-white mt-1">Standard Push-Up</h4>
              <p className="text-xs text-slate-400 mt-2">
                Evaluates plank spinal curvature (hip sag/pike), chest depth, and elbow extension lockout.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
              <span className="text-xs font-medium text-emerald-400">Dynamic Exercise</span>
              <h4 className="text-base font-bold text-white mt-1">Bicep Curls</h4>
              <p className="text-xs text-slate-400 mt-2">
                Supports standard bilateral and alternating curls with elbow drift and swing detection.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
              <span className="text-xs font-medium text-indigo-400">Static Held Poses</span>
              <h4 className="text-base font-bold text-white mt-1">8 Guided Yoga Poses</h4>
              <p className="text-xs text-slate-400 mt-2">
                Mountain, Tree, Warrior I/II, Chair, Triangle, Downward Dog, Cobra with hold timer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action & navigation */}
      <section className="w-full px-4 py-16 sm:px-6 text-center">
        <div className="container mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 p-8 sm:p-12">
          <Award className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white sm:text-3xl">Ready to Test Real-Time Coaching?</h3>
          <p className="mt-3 text-sm text-slate-400">
            Open the live coaching studio with your laptop webcam, or review the audit of synthetic fixture experiments; real-dataset validation remains outstanding.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/workout"
              className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
            >
              Launch Live Camera
            </Link>
            <Link
              href="/yoga"
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Yoga Mode
            </Link>
            <Link
              href="/analyse"
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Video Upload
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
