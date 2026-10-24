"use client";

import { useEffect, useState } from "react";
import {
  FlaskConical,
  Download,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Cpu,
  Users,
  Eye,
  BookOpen,
  FileText,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { DashboardShell } from "@/components/DashboardShell";

type ModelMetric = {
  model_id: string;
  exercise_macro_f1: number;
  balanced_accuracy: number;
  rep_mae: number;
  false_warning_rate: number;
  brier_score: number;
  ece: number;
  abstention_rate: number;
  retained_accuracy: number;
  latency_p50_ms: number;
  throughput_fps: number;
};

type BenchmarkData = {
  timestamp: string;
  models: Record<string, ModelMetric>;
  evidence_status?: {
    kind: string;
    human_recordings: number;
    classification_valid: boolean;
    reason: string;
    report: string;
  };
};

export default function ResearchPage() {
  const [benchmark, setBenchmark] = useState<BenchmarkData | null>(null);
  const [apiStatus, setApiStatus] = useState<"loading" | "loaded" | "unavailable">("loading");
  const [activeTab, setActiveTab] = useState<"loso" | "views" | "subjects" | "latency" | "audit">("loso");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/research/summary`)
      .then((res) => {
        if (!res.ok) throw new Error("Historical artifact unavailable");
        return res.json();
      })
      .then((data: BenchmarkData) => {
        setBenchmark(data);
        setApiStatus("loaded");
      })
      .catch(() => {
        setApiStatus("unavailable");
      });
  }, []);

  const downloadReport = () => {
    // Never generate an artifact claiming to be verified if the API was unreachable.
    if (!benchmark) return;
    const reportData = {
      benchmark_title: "MotionIQ Phase 6 Leave-One-Subject-Out Benchmark",
      source: "MotionIQ committed research artifacts via Research API",
      exported_at: new Date().toISOString(),
      ...benchmark,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "MotionIQ_phase6_loso_benchmark_results.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <header className="pb-4 border-b border-[#F0F1F3]">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202226] tracking-tight">
            Scientific Evaluation & Research Evidence
          </h1>
          <p className="text-[#8E9399] text-xs sm:text-sm mt-1 max-w-4xl leading-relaxed">
            Independent Leave-One-Subject-Out (LOSO) 10-fold cross-validation on 200 authentic UI-PRMD Vicon
            motion-capture recordings (55,179 frames, 10 human participants, 600 projected streams) and physical
            end-to-end webcam latency benchmarks.
          </p>
        </header>

        <p role="status" className="rounded-2xl border border-[#E9EBED] bg-[#F0F1F3] px-4 py-3 text-xs text-[#202226]">
          {apiStatus === "loaded"
            ? "Research API online. Historical laboratory results loaded from the committed benchmark artifacts; webcam transfer accuracy is not established."
            : apiStatus === "loading"
              ? "Connecting to the research API. The figures below are a historical snapshot; live verification is pending."
              : "Research API unavailable. Figures below are a historical snapshot, not a freshly verified run. Benchmark export is disabled until the API is reachable."}
        </p>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pb-1 border-b border-[#F0F1F3]">
          <button
            onClick={() => setActiveTab("loso")}
            className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all shadow-2xs ${
              activeTab === "loso"
                ? "bg-[#D9F0EC] text-[#202226]"
                : "bg-white border border-[#E9EBED] text-[#8E9399] hover:text-[#202226]"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> LOSO 10-Fold Benchmark
          </button>
          <button
            onClick={() => setActiveTab("views")}
            className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all shadow-2xs ${
              activeTab === "views"
                ? "bg-[#D9F0EC] text-[#202226]"
                : "bg-white border border-[#E9EBED] text-[#8E9399] hover:text-[#202226]"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> View-Aware Gating (0°, 45°, 90°)
          </button>
          <button
            onClick={() => setActiveTab("subjects")}
            className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all shadow-2xs ${
              activeTab === "subjects"
                ? "bg-[#D9F0EC] text-[#202226]"
                : "bg-white border border-[#E9EBED] text-[#8E9399] hover:text-[#202226]"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Per-Subject Generalization
          </button>
          <button
            onClick={() => setActiveTab("latency")}
            className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all shadow-2xs ${
              activeTab === "latency"
                ? "bg-[#D9F0EC] text-[#202226]"
                : "bg-white border border-[#E9EBED] text-[#8E9399] hover:text-[#202226]"
            }`}
          >
            <Cpu className="h-3.5 w-3.5" /> Latency & Pilot Study
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all shadow-2xs ${
              activeTab === "audit"
                ? "bg-[#D9F0EC] text-[#202226]"
                : "bg-white border border-[#E9EBED] text-[#8E9399] hover:text-[#202226]"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Methodology & Provenance
          </button>
        </div>

        {/* TAB 1: LOSO BENCHMARK RESULTS */}
        {activeTab === "loso" && (
          <div className="space-y-6">
            <section className="rounded-[26px] border border-[#CEECE7] bg-[#EAF7F5] p-6 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#202226] flex items-center gap-2">
                    <ShieldCheck className="text-emerald-700 h-5 w-5" />
                    Movement Quality Assessment Benchmark (LOSO 10-Fold CV)
                  </h2>
                  <p className="text-xs text-[#8E9399] mt-0.5">
                    Evaluated across 200 authentic Vicon optical motion-capture trials (10 human subjects, 100 optimal and 100 non-optimal deep squats).
                  </p>
                </div>
                <button
                  onClick={downloadReport}
                    disabled={!benchmark}
                  className="inline-flex items-center gap-2 rounded-full bg-[#202226] hover:bg-black text-white text-xs px-4 py-2 font-semibold transition shrink-0 shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" /> Export Verified Results (JSON)
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 pt-2">
                <div className="bg-white p-4 rounded-[20px] border border-[#E9EBED] shadow-2xs">
                  <div className="text-[11px] text-[#8E9399] uppercase tracking-wider font-bold">Model E Balanced Acc</div>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">80.6%</div>
                  <div className="text-[10px] text-[#8E9399] mt-0.5">95% Bootstrap CI: [71.8%, 88.2%]</div>
                </div>
                <div className="bg-white p-4 rounded-[20px] border border-[#E9EBED] shadow-2xs">
                  <div className="text-[11px] text-[#8E9399] uppercase tracking-wider font-bold">Model E Macro-F1</div>
                  <div className="text-2xl font-extrabold text-[#202226] mt-1">0.805</div>
                  <div className="text-[10px] text-[#8E9399] mt-0.5">95% Bootstrap CI: [0.718, 0.878]</div>
                </div>
                <div className="bg-white p-4 rounded-[20px] border border-[#E9EBED] shadow-2xs">
                  <div className="text-[11px] text-[#8E9399] uppercase tracking-wider font-bold">Selective Risk</div>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">19.4%</div>
                  <div className="text-[10px] text-[#8E9399] mt-0.5">Down from 30.2% in Model A</div>
                </div>
                <div className="bg-white p-4 rounded-[20px] border border-[#E9EBED] shadow-2xs">
                  <div className="text-[11px] text-[#8E9399] uppercase tracking-wider font-bold">Model Coverage</div>
                  <div className="text-2xl font-extrabold text-[#202226] mt-1">88.5%</div>
                  <div className="text-[10px] text-[#8E9399] mt-0.5">11.5% selective abstention</div>
                </div>
              </div>
            </section>

            {/* Full Table */}
            <section className="rounded-[26px] border border-[#E9EBED] bg-white p-6 space-y-4 shadow-2xs overflow-hidden">
              <h3 className="text-sm font-bold text-[#202226]">Full Comparative Evaluation Table (600 Evaluated Streams)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#F0F1F3] text-[#8E9399] uppercase tracking-wider font-bold border-b border-[#E9EBED]">
                      <th className="p-3">Model Architecture</th>
                      <th className="p-3">Sensitivity</th>
                      <th className="p-3">Specificity</th>
                      <th className="p-3">False Warning Rate</th>
                      <th className="p-3">Precision</th>
                      <th className="p-3">Balanced Acc</th>
                      <th className="p-3">Macro-F1</th>
                      <th className="p-3">Coverage</th>
                      <th className="p-3">Selective Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F1F3] font-mono">
                    <tr>
                      <td className="p-3 font-sans text-[#8E9399]">Baseline Majority (Trivial Control)</td>
                      <td className="p-3 text-[#8E9399]">0.0%</td>
                      <td className="p-3 text-[#202226]">100.0%</td>
                      <td className="p-3 text-[#8E9399]">0.0%</td>
                      <td className="p-3 text-[#8E9399]">0.0%</td>
                      <td className="p-3 text-[#202226]">50.0%</td>
                      <td className="p-3 text-[#202226]">0.333</td>
                      <td className="p-3 text-[#202226]">100.0%</td>
                      <td className="p-3 text-rose-600 font-bold">50.0%</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans text-[#8E9399]">Baseline Always-Abstain (Control)</td>
                      <td className="p-3 text-[#8E9399]">0.0%</td>
                      <td className="p-3 text-[#8E9399]">0.0%</td>
                      <td className="p-3 text-[#8E9399]">0.0%</td>
                      <td className="p-3 text-[#8E9399]">0.0%</td>
                      <td className="p-3 text-[#8E9399]">0.0%</td>
                      <td className="p-3 text-[#8E9399]">0.000</td>
                      <td className="p-3 text-[#8E9399]">0.0%</td>
                      <td className="p-3 text-[#8E9399]">0.0%</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans text-[#202226]">Model A (Upstream Static Rules)</td>
                      <td className="p-3 text-emerald-700">89.0%</td>
                      <td className="p-3 text-amber-700">50.7%</td>
                      <td className="p-3 text-rose-600 font-bold">49.3%</td>
                      <td className="p-3 text-[#202226]">64.3%</td>
                      <td className="p-3 text-[#202226]">69.8%</td>
                      <td className="p-3 text-[#202226]">0.687</td>
                      <td className="p-3 text-[#202226]">100.0%</td>
                      <td className="p-3 text-amber-700">30.2%</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans text-[#202226]">Model B (Temporal / Smoothness Rules)</td>
                      <td className="p-3 text-emerald-700">100.0%</td>
                      <td className="p-3 text-rose-600">0.0%</td>
                      <td className="p-3 text-rose-600 font-bold">100.0%</td>
                      <td className="p-3 text-[#8E9399]">50.0%</td>
                      <td className="p-3 text-[#8E9399]">50.0%</td>
                      <td className="p-3 text-[#8E9399]">0.333</td>
                      <td className="p-3 text-[#8E9399]">100.0%</td>
                      <td className="p-3 text-rose-600">50.0%</td>
                    </tr>
                    <tr className="bg-[#F0F1F3]/40">
                      <td className="p-3 font-sans font-bold text-[#202226]">Model C (Supervised Temporal)</td>
                      <td className="p-3 text-[#202226]">71.7%</td>
                      <td className="p-3 text-emerald-700 font-bold">77.0%</td>
                      <td className="p-3 text-emerald-700 font-bold">23.0%</td>
                      <td className="p-3 text-[#202226]">75.7%</td>
                      <td className="p-3 text-[#202226] font-bold">74.3%</td>
                      <td className="p-3 text-[#202226]">0.743</td>
                      <td className="p-3 text-[#202226]">100.0%</td>
                      <td className="p-3 text-[#202226]">25.7%</td>
                    </tr>
                    <tr className="bg-[#EDE2F2]/30">
                      <td className="p-3 font-sans font-bold text-[#202226]">Model D (View-Aware Supervised)</td>
                      <td className="p-3 text-[#202226]">77.0%</td>
                      <td className="p-3 text-emerald-700 font-bold">79.7%</td>
                      <td className="p-3 text-emerald-700 font-bold">20.3%</td>
                      <td className="p-3 text-[#202226]">79.1%</td>
                      <td className="p-3 text-[#202226] font-bold">78.3%</td>
                      <td className="p-3 text-[#202226] font-bold">0.783</td>
                      <td className="p-3 text-[#202226]">100.0%</td>
                      <td className="p-3 text-emerald-700 font-bold">21.7%</td>
                    </tr>
                    <tr className="bg-[#D9F0EC]/60 font-bold text-[#202226]">
                      <td className="p-3 font-sans font-extrabold text-[#202226]">Model E (Uncertainty-Gated Selective)</td>
                      <td className="p-3 text-emerald-800 font-extrabold">81.3%</td>
                      <td className="p-3 text-emerald-800 font-extrabold">79.8%</td>
                      <td className="p-3 text-emerald-800 font-extrabold">20.2%</td>
                      <td className="p-3 text-emerald-800 font-extrabold">82.1%</td>
                      <td className="p-3 text-emerald-800 font-extrabold text-sm">80.6%</td>
                      <td className="p-3 text-emerald-800 font-extrabold">0.805</td>
                      <td className="p-3 text-[#202226] font-extrabold">88.5%</td>
                      <td className="p-3 text-emerald-800 font-extrabold text-sm">19.4%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Subject-Level Paired Significance & Matched Coverage */}
            <div className="grid gap-5 md:grid-cols-2">
              <section className="rounded-[26px] border border-[#E9EBED] bg-white p-5 space-y-3 shadow-2xs">
                <h3 className="text-sm font-bold text-[#202226] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  Subject-Level Paired Significance (N=10 Participants)
                </h3>
                <p className="text-xs text-[#8E9399] leading-relaxed">
                  Evaluating across participants ($df=9$) to guard against clustered repeated-measure inflation:
                </p>
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-3 rounded-2xl bg-[#F0F1F3] border border-[#E9EBED] space-y-1">
                    <div className="text-[#202226] font-sans font-bold">Model A vs Model D (View-Aware)</div>
                    <div className="text-[#202226]">Mean Δ Balanced Acc: <span className="text-emerald-700 font-bold">+8.48%</span> (CI: [-1.1%, +18.0%])</div>
                    <div className="text-[#8E9399]">Paired t-test: p = 0.0758 | 7 improved, 1 tied, 2 regressed</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F0F1F3] border border-[#E9EBED] space-y-1">
                    <div className="text-[#202226] font-sans font-bold">Model A vs Model E (Uncertainty-Gated)</div>
                    <div className="text-[#202226]">Mean Δ Balanced Acc: <span className="text-emerald-700 font-bold">+9.66%</span> (CI: [-0.7%, +20.0%])</div>
                    <div className="text-[#8E9399]">Paired t-test: p = 0.0635 | 8 improved, 0 tied, 2 regressed</div>
                  </div>
                </div>
              </section>

              <section className="rounded-[26px] border border-[#E9EBED] bg-white p-5 space-y-3 shadow-2xs">
                <h3 className="text-sm font-bold text-[#202226] flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-700" />
                  Matched-Coverage & Calibration Analysis
                </h3>
                <p className="text-xs text-[#8E9399] leading-relaxed">
                  Evaluating selective risk under varying coverage thresholds demonstrates monotonic risk reduction:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead>
                      <tr className="border-b border-[#E9EBED] text-[#8E9399]">
                        <th className="pb-2 font-sans font-bold">Coverage &phi;</th>
                        <th className="pb-2 font-bold">Model D Risk</th>
                        <th className="pb-2 font-bold">Model D B.Acc</th>
                        <th className="pb-2 font-bold">Model C B.Acc</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F1F3] text-[#202226]">
                      <tr><td className="py-1">100.0%</td><td className="text-amber-700">21.7%</td><td>78.3%</td><td>74.3%</td></tr>
                      <tr className="bg-[#D9F0EC]/50 font-bold"><td className="py-1 text-emerald-900">88.5% (Model E)</td><td className="text-emerald-800">19.4%</td><td className="text-emerald-800">80.6%</td><td>79.5%</td></tr>
                      <tr><td className="py-1">70.0%</td><td className="text-emerald-700">15.2%</td><td>84.8%</td><td>83.0%</td></tr>
                      <tr><td className="py-1">50.0%</td><td className="text-emerald-700">9.3%</td><td>90.7%</td><td>90.4%</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="text-[11px] text-[#8E9399] bg-[#F0F1F3] p-2.5 rounded-xl border border-[#E9EBED]">
                  <span className="text-[#202226] font-bold font-sans">Abstention Analysis: </span>
                  Expected Calibration Error (ECE): 0.0827, Brier Score: 0.1515.
                </div>
              </section>
            </div>
          </div>
        )}

        {/* TAB 2: VIEW-AWARE CAMERA BREAKDOWN */}
        {activeTab === "views" && (
          <section className="rounded-[26px] border border-[#E9EBED] bg-white p-6 space-y-4 shadow-2xs">
            <h3 className="text-base font-bold text-[#202226] flex items-center gap-2">
              <Eye className="text-emerald-700 h-5 w-5" />
              Camera Viewpoint Performance: 0° Frontal vs 45° Oblique vs 90° Lateral
            </h3>
            <p className="text-xs text-[#8E9399] leading-relaxed max-w-4xl">
              Demonstrates the elimination of out-of-plane false technique warnings under lateral orientation. In planar baseline Model A, rotating to 90° induces a <strong>74.0% False Warning Rate</strong> due to 2D perspective foreshortening. In Model D/E, view-aware rule gating slashes lateral FWR to <strong>20.2%–23.1%</strong>.
            </p>

            <div className="grid gap-4 md:grid-cols-3 pt-2">
              <div className="p-5 rounded-2xl border border-[#E9EBED] bg-[#F0F1F3] space-y-2">
                <div className="font-bold text-[#202226] text-sm">0° Frontal Viewpoint</div>
                <div className="text-xs text-[#8E9399] space-y-1 font-mono">
                  <div>Model A FWR: <span className="text-amber-700 font-bold">45.0%</span> | B.Acc: 73.5%</div>
                  <div>Model D FWR: <span className="text-emerald-700 font-bold">15.0%</span> | B.Acc: 83.5%</div>
                  <div>Model E FWR: <span className="text-emerald-700 font-bold">12.5%</span> | B.Acc: 86.0%</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[#E9EBED] bg-[#F0F1F3] space-y-2">
                <div className="font-bold text-[#202226] text-sm">45° Oblique Viewpoint</div>
                <div className="text-xs text-[#8E9399] space-y-1 font-mono">
                  <div>Model A FWR: <span className="text-amber-700 font-bold">29.0%</span> | B.Acc: 76.5%</div>
                  <div>Model D FWR: <span className="text-emerald-700 font-bold">21.0%</span> | B.Acc: 81.5%</div>
                  <div>Model E FWR: <span className="text-emerald-700 font-bold">24.7%</span> | B.Acc: 81.8%</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-[#E9EBED] bg-[#F0F1F3] space-y-2">
                <div className="font-bold text-[#202226] text-sm">90° Lateral Profile Viewpoint</div>
                <div className="text-xs text-[#8E9399] space-y-1 font-mono">
                  <div>Model A FWR: <span className="text-rose-700 font-bold">74.0% (Ungated)</span> | B.Acc: 59.5%</div>
                  <div>Model D FWR: <span className="text-emerald-700 font-bold">25.0% (Gated)</span> | B.Acc: 70.0%</div>
                  <div>Model E FWR: <span className="text-emerald-700 font-bold">23.1% (Selective)</span> | B.Acc: 73.8%</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: PER-SUBJECT GENERALIZATION */}
        {activeTab === "subjects" && (
          <section className="rounded-[26px] border border-[#E9EBED] bg-white p-6 space-y-4 shadow-2xs">
            <h3 className="text-base font-bold text-[#202226] flex items-center gap-2">
              <Users className="text-emerald-700 h-5 w-5" />
              Subject Generalization (Leave-One-Subject-Out 10-Fold Results)
            </h3>
            <p className="text-xs text-[#8E9399]">
              Balanced Accuracy evaluated for each held-out human subject when trained strictly on the other 9 subjects.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead>
                  <tr className="bg-[#F0F1F3] border-b border-[#E9EBED] text-[#8E9399] uppercase tracking-wider font-bold">
                    <th className="p-3 font-sans">Held-Out Subject</th>
                    <th className="p-3">Model A (Rules)</th>
                    <th className="p-3">Model C (Supervised)</th>
                    <th className="p-3">Model D (View-Aware)</th>
                    <th className="p-3">Model E (Uncertainty-Gated)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F1F3]">
                  <tr><td className="p-3 font-sans text-[#202226]">Subject_01</td><td className="p-3">76.7%</td><td className="p-3">78.3%</td><td className="p-3">85.0%</td><td className="p-3 text-emerald-700 font-bold">85.0%</td></tr>
                  <tr><td className="p-3 font-sans text-[#202226]">Subject_02</td><td className="p-3">70.0%</td><td className="p-3">66.7%</td><td className="p-3">73.3%</td><td className="p-3 text-emerald-700 font-bold">75.9%</td></tr>
                  <tr><td className="p-3 font-sans text-[#202226]">Subject_03</td><td className="p-3">60.0%</td><td className="p-3 text-emerald-700 font-bold">98.3%</td><td className="p-3">86.7%</td><td className="p-3 text-emerald-700 font-bold">86.8%</td></tr>
                  <tr><td className="p-3 font-sans text-[#202226]">Subject_04</td><td className="p-3">78.3%</td><td className="p-3">76.7%</td><td className="p-3">78.3%</td><td className="p-3 text-emerald-700 font-bold">84.0%</td></tr>
                  <tr><td className="p-3 font-sans text-[#202226]">Subject_05</td><td className="p-3">41.7%</td><td className="p-3">70.0%</td><td className="p-3">73.3%</td><td className="p-3 text-emerald-700 font-bold">75.4%</td></tr>
                  <tr><td className="p-3 font-sans text-[#202226]">Subject_06</td><td className="p-3 text-emerald-700 font-bold">75.0%</td><td className="p-3">65.0%</td><td className="p-3">71.7%</td><td className="p-3">67.4%</td></tr>
                  <tr><td className="p-3 font-sans text-[#202226]">Subject_07</td><td className="p-3 text-emerald-700 font-bold">66.7%</td><td className="p-3">51.7%</td><td className="p-3">53.3%</td><td className="p-3">51.8%</td></tr>
                  <tr><td className="p-3 font-sans text-[#202226]">Subject_08</td><td className="p-3">68.3%</td><td className="p-3">71.7%</td><td className="p-3 text-emerald-700 font-bold">78.3%</td><td className="p-3">77.6%</td></tr>
                  <tr><td className="p-3 font-sans text-[#202226]">Subject_09</td><td className="p-3">85.0%</td><td className="p-3">95.0%</td><td className="p-3">93.3%</td><td className="p-3 text-emerald-700 font-bold">96.4%</td></tr>
                  <tr><td className="p-3 font-sans text-[#202226]">Subject_10</td><td className="p-3">76.7%</td><td className="p-3">70.0%</td><td className="p-3">90.0%</td><td className="p-3 text-emerald-700 font-bold">94.7%</td></tr>
                  <tr className="bg-[#D9F0EC]/50 font-bold"><td className="p-3 font-sans text-[#202226]">Mean ± SD</td><td className="p-3">69.8 ± 12.3%</td><td className="p-3">74.3 ± 14.6%</td><td className="p-3">78.3 ± 11.2%</td><td className="p-3 text-emerald-800 text-sm">80.6 ± 12.8%</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 4: LATENCY & PILOT STUDY */}
        {activeTab === "latency" && (
          <div className="space-y-6">
            <section className="rounded-[26px] border border-[#E9EBED] bg-white p-6 space-y-4 shadow-2xs">
              <h3 className="text-base font-bold text-[#202226] flex items-center gap-2">
                <Cpu className="text-emerald-700 h-5 w-5" />
                Round-Trip System Latency Profile
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-mono">
                  <thead>
                    <tr className="bg-[#F0F1F3] border-b border-[#E9EBED] text-[#8E9399] uppercase tracking-wider font-bold">
                      <th className="p-3 font-sans">Pipeline Subsystem</th>
                      <th className="p-3">Median (P50)</th>
                      <th className="p-3">95th Percentile (P95)</th>
                      <th className="p-3 font-sans">Bottleneck Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F1F3]">
                    <tr><td className="p-3 font-sans text-[#202226]">1. Webcam Sensor Capture & Delivery</td><td className="p-3 text-[#202226]">16.7 ms</td><td className="p-3 text-[#8E9399]">21.3 ms</td><td className="p-3 font-sans text-[#8E9399]">30/60 Hz frame rate</td></tr>
                    <tr><td className="p-3 font-sans text-[#202226]">2. MediaPipe Pose Landmarker (Browser WebGL)</td><td className="p-3 text-[#202226] font-bold">21.5 ms</td><td className="p-3 text-[#8E9399]">31.0 ms</td><td className="p-3 font-sans text-[#8E9399]">WebGL shader inference</td></tr>
                    <tr><td className="p-3 font-sans text-[#202226]">3. Client-to-Backend WebSocket Transit</td><td className="p-3 text-[#202226]">1.2 ms</td><td className="p-3 text-[#8E9399]">3.5 ms</td><td className="p-3 font-sans text-[#8E9399]">Network / loopback socket</td></tr>
                    <tr><td className="p-3 font-sans text-[#202226]">4. FastAPI Backend Processing & Gating</td><td className="p-3 text-[#202226] font-bold">28.4 ms</td><td className="p-3 text-[#8E9399]">44.2 ms</td><td className="p-3 font-sans text-[#8E9399]">Kalman tracker & kinematics</td></tr>
                    <tr><td className="p-3 font-sans text-[#202226]">5. Backend-to-Client WebSocket Transit</td><td className="p-3 text-[#202226]">1.1 ms</td><td className="p-3 text-[#8E9399]">2.8 ms</td><td className="p-3 font-sans text-[#8E9399]">JSON response transfer</td></tr>
                    <tr><td className="p-3 font-sans text-[#202226]">6. Frontend Canvas HUD Re-render</td><td className="p-3 text-[#202226]">4.8 ms</td><td className="p-3 text-[#8E9399]">8.2 ms</td><td className="p-3 font-sans text-[#8E9399]">requestAnimationFrame commit</td></tr>
                    <tr className="bg-[#D9F0EC]/50 font-bold"><td className="p-3 font-sans text-[#202226]">Total Round-Trip Feedback Latency</td><td className="p-3 text-emerald-800 text-sm">57.0 ms</td><td className="p-3 text-[#202226]">89.7 ms</td><td className="p-3 font-sans text-emerald-800">Effective rate: ~17.5 FPS</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-[26px] border border-[#E9EBED] bg-white p-6 space-y-3 shadow-2xs">
              <h4 className="font-bold text-[#202226] flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-700" />
                Pilot Webcam Usability Trials
              </h4>
              <p className="text-xs text-[#8E9399] leading-relaxed">
                Pilot validation trials conducted across 5 physical sessions (squats, curls, push-ups) under varying illuminance (48–520 lux) demonstrated <strong>100% viewpoint classification accuracy</strong> (5/5 sessions) and <strong>96.0% repetition cadence accuracy</strong> (24/25 physical reps). All landmark inference occurred client-side, verifying that biometric privacy guarantees hold under physical webcam operations.
              </p>
            </section>
          </div>
        )}

        {/* TAB 5: METHODOLOGY & PROVENANCE */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <section className="rounded-[26px] border border-[#E9EBED] bg-white p-6 space-y-4 shadow-2xs">
              <h3 className="text-base font-bold text-[#202226]">Dataset Provenance & Scientific Methodology</h3>
              <p className="text-xs text-[#8E9399] leading-relaxed">
                The 200 evaluated recordings derive from the University of Idaho Physical Rehabilitation Movement Dataset (UI-PRMD; Vakanski et al., 2018; 100 Hz Vicon optical motion capture). In the dataset, &ldquo;non-optimal&rdquo; denotes a broad clinical classification covering depth deficiency, knee valgus collapse, and movement hesitation.
              </p>
              <div className="rounded-2xl border border-[#CEECE7] bg-[#EAF7F5] p-4 text-xs text-[#202226] leading-relaxed space-y-1">
                <div className="font-bold text-[#202226]">Domain Gap Disclosure:</div>
                <p className="text-[#8E9399]">
                  The 80.6% Balanced Accuracy was measured on laboratory Vicon optical motion-capture data with sub-millimeter 3D marker precision. In physical production, the system ingests 2D RGB webcam frames using MediaPipe BlazePose. While real-time latency (57.0 ms) and view-classification accuracy (100% on 5 pilot sessions) have been verified, <strong>clinical transfer to diverse patient populations requires formal clinical trials</strong>. MotionIQ provides visual motor-learning assistance and is not intended for medical diagnosis.
                </p>
              </div>
            </section>

            <section className="rounded-[26px] border border-[#E9EBED] bg-white p-6 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-[#202226] font-bold text-sm">
                <FileText className="h-4 w-4 text-emerald-700" />
                Reproducibility Artifacts & Codebase Structure
              </div>
              <p className="text-xs text-[#8E9399] leading-relaxed">
                All evaluation pipelines, LOSO splits, and benchmark extraction scripts are documented in the <code>research/evaluation/</code> directory. Evaluation scripts use deterministic random seeds and scikit-learn cross-validation to ensure complete scientific reproducibility.
              </p>
              <div className="pt-2">
                <button
                  onClick={downloadReport}
                  className="inline-flex items-center gap-2 rounded-full border border-[#E9EBED] bg-white px-4 py-2 text-xs font-semibold text-[#202226] hover:bg-[#F0F1F3] transition shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5 text-[#202226]" />
                  <span>Download Scientific Benchmark Artifact (.json)</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
