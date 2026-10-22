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
  Zap,
  Lock,
  ChevronRight,
  Play,
  RotateCcw,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full border-b border-slate-800/80 bg-gradient-to-b from-slate-900/40 via-slate-950 to-slate-950 px-4 pt-16 pb-20 sm:px-6 lg:pt-24 lg:pb-28">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[250px] bg-indigo-500/10 blur-[110px] pointer-events-none rounded-full" />

        <div className="container relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-medium text-emerald-300 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Biomechanical Computer Vision & Movement Intelligence</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.15]">
            Understand Human Movement <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Through Computer Vision.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg leading-relaxed">
            Real-time skeletal tracking, automated exercise recognition, and viewpoint-aware biomechanical assessment from commodity webcams—engineered with client-side privacy.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/workout"
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/30"
            >
              <Dumbbell className="h-4 w-4" />
              Start Live Analysis
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/analyse"
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Video className="h-4 w-4 text-emerald-400" />
              Analyse Video
            </Link>

            <Link
              href="/research"
              className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-950/30 px-6 py-3 text-sm font-semibold text-indigo-200 transition-colors hover:bg-indigo-900/40 hover:text-white"
            >
              <LineChart className="h-4 w-4 text-indigo-400" />
              Explore Research
            </Link>
          </div>

          {/* Biomechanical Wireframe Interactive Graphic */}
          <div className="mt-14 relative mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-slate-200">Interactive Kinematic Stream</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Viewpoint: <strong className="text-emerald-400">Sagittal (Lateral 90°)</strong></span>
                <span>Inference: <strong className="text-indigo-400">WebAssembly (30+ FPS)</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Pose Wireframe Graphic */}
              <div className="md:col-span-7 flex justify-center py-2">
                <svg
                  viewBox="0 0 320 280"
                  className="w-full max-w-[280px] h-auto drop-shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                >
                  {/* Grid Lines */}
                  <line x1="20" y1="260" x2="300" y2="260" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                  
                  {/* Torso & Head */}
                  <circle cx="160" cy="50" r="14" fill="#0f172a" stroke="#10b981" strokeWidth="2.5" />
                  {/* Spine & Torso */}
                  <line x1="160" y1="64" x2="155" y2="135" stroke="#10b981" strokeWidth="3" />
                  {/* Shoulders */}
                  <line x1="130" y1="85" x2="190" y2="85" stroke="#10b981" strokeWidth="2.5" />
                  {/* Left Arm */}
                  <line x1="130" y1="85" x2="110" y2="125" stroke="#34d399" strokeWidth="2" />
                  <line x1="110" y1="125" x2="100" y2="160" stroke="#34d399" strokeWidth="2" />
                  {/* Right Arm */}
                  <line x1="190" y1="85" x2="210" y2="125" stroke="#34d399" strokeWidth="2" />
                  <line x1="210" y1="125" x2="220" y2="160" stroke="#34d399" strokeWidth="2" />
                  {/* Hips */}
                  <line x1="135" y1="135" x2="175" y2="135" stroke="#10b981" strokeWidth="3" />
                  {/* Left Leg (Squat angle) */}
                  <line x1="140" y1="135" x2="115" y2="195" stroke="#10b981" strokeWidth="3.5" />
                  <line x1="115" y1="195" x2="130" y2="260" stroke="#10b981" strokeWidth="3.5" />
                  {/* Right Leg (Squat angle) */}
                  <line x1="170" y1="135" x2="195" y2="195" stroke="#10b981" strokeWidth="3.5" />
                  <line x1="195" y1="195" x2="180" y2="260" stroke="#10b981" strokeWidth="3.5" />
                  
                  {/* Keypoints */}
                  <circle cx="160" cy="50" r="4" fill="#a7f3d0" />
                  <circle cx="130" cy="85" r="4" fill="#6ee7b7" />
                  <circle cx="190" cy="85" r="4" fill="#6ee7b7" />
                  <circle cx="110" cy="125" r="3.5" fill="#6ee7b7" />
                  <circle cx="210" cy="125" r="3.5" fill="#6ee7b7" />
                  <circle cx="140" cy="135" r="4.5" fill="#38bdf8" />
                  <circle cx="170" cy="135" r="4.5" fill="#38bdf8" />
                  <circle cx="115" cy="195" r="5" fill="#10b981" />
                  <circle cx="195" cy="195" r="5" fill="#10b981" />
                  <circle cx="130" cy="260" r="4" fill="#a7f3d0" />
                  <circle cx="180" cy="260" r="4" fill="#a7f3d0" />

                  {/* Knee Flexion Angle Annotation */}
                  <path d="M 125 180 A 20 20 0 0 1 123 210" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="2 2" />
                  <text x="70" y="198" fill="#fbbf24" fontSize="11" fontWeight="600" fontFamily="sans-serif">96° Flexion</text>

                  {/* Hip Depth Level */}
                  <line x1="90" y1="135" x2="220" y2="135" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="225" y="139" fill="#38bdf8" fontSize="10" fontFamily="sans-serif">Hip Crease</text>
                </svg>
              </div>

              {/* Real-time Assessment Telemetry Card */}
              <div className="md:col-span-5 flex flex-col gap-3 text-left">
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Exercise State</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-white">Bodyweight Squat</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Phase: Inflection
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <span className="text-[11px] text-slate-400">Repetitions</span>
                    <div className="text-2xl font-black text-emerald-400">8 <span className="text-xs font-medium text-slate-400">completed</span></div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <span className="text-[11px] text-slate-400">Smoothness</span>
                    <div className="text-2xl font-black text-indigo-400">0.91 <span className="text-xs font-medium text-slate-400">index</span></div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Depth optimal (hip crease below knee joint)</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-400">
                    <Eye className="h-3.5 w-3.5" />
                    <span>Lateral view: Knee valgus rule safely suppressed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              100% Client-Side Video Inference
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-emerald-400" />
              Zero Video Sent or Recorded
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-indigo-400" />
              Low-Latency MediaPipe Engine
            </span>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section className="w-full border-b border-slate-800 bg-slate-950 px-4 py-20 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Engineered Capabilities</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Precision Motion Intelligence
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 leading-relaxed">
              Combining 33-landmark pose estimation with biomechanical kinematic modeling to deliver actionable, reliable movement insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 hover:border-slate-700 transition-colors">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Real-Time Skeletal Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extracts 33 high-fidelity anatomical keypoints at 30+ frames per second via client-side WebAssembly, tracking multi-joint spatial trajectories with zero video cloud upload.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 hover:border-slate-700 transition-colors">
              <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Viewpoint-Aware Assessment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically infers 3D body orientation (frontal vs. lateral) to suppress geometrically unassessable rules—such as disabling knee valgus detection in lateral camera profiles.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 hover:border-slate-700 transition-colors">
              <div className="h-11 w-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-5">
                <LineChart className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Biomechanical Movement Metrics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates genuine joint flexion kinematics, dimensionless jerk-based smoothness, and bilateral limb symmetry trajectories to assess qualitative movement control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Movement Library Preview */}
      <section className="w-full border-b border-slate-800 bg-slate-900/30 px-4 py-20 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Supported Movements</span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Biomechanical Exercise Suite
              </h2>
            </div>
            <Link
              href="/workout"
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              <span>Explore live interactive studio</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="text-xs font-semibold text-emerald-400">Dynamic Exercise</div>
              <h4 className="text-base font-bold text-white mt-1">Bodyweight Squat</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Monitors hip depth, knee valgus collapse, torso forward lean, and eccentric/concentric cadence.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="text-xs font-semibold text-indigo-400">Dynamic Exercise</div>
              <h4 className="text-base font-bold text-white mt-1">Push-up</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Evaluates elbow flexion depth, horizontal body alignment, and spinal hyperextension / hip sagging.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="text-xs font-semibold text-teal-400">Dynamic Exercise</div>
              <h4 className="text-base font-bold text-white mt-1">Bicep Curl</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Tracks bilateral and unilateral elbow flexion range of motion and restricts torso momentum sway.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="text-xs font-semibold text-purple-400">Static Posture</div>
              <h4 className="text-base font-bold text-white mt-1">Yoga Asanas</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                8 standardized postures including Warrior, Tree, Chair, and Downward Dog with monotonic hold timers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Research & Reproducibility Callout */}
      <section className="w-full bg-slate-950 px-4 py-16 sm:px-6">
        <div className="container mx-auto max-w-5xl rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 p-8 sm:p-12 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-2">
            <h3 className="text-2xl font-bold text-white">Scientific Evaluation & Open Research</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              MotionIQ has been evaluated via Leave-One-Subject-Out (LOSO) 10-fold cross-validation on 200 authentic UI-PRMD Vicon motion-capture trials and physical webcam latency benchmarks.
            </p>
          </div>
          <Link
            href="/research"
            className="flex-shrink-0 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            <LineChart className="h-4 w-4" />
            View Scientific Evidence
          </Link>
        </div>
      </section>
    </div>
  );
}
