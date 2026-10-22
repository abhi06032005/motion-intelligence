"""
Generates publication-quality IEEE-style PDF for MotionIQ research manuscript using Playwright.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MotionIQ Research Manuscript</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<style>
  @page {
    size: letter;
    margin: 18mm 14mm 20mm 14mm;
    @bottom-center {
      content: "Unpublished Research Manuscript - Erasmus Mundus Portfolio (IPCVAI / IMLEX)";
      font-size: 8pt;
      font-family: 'Times New Roman', Times, serif;
      color: #666;
    }
  }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    line-height: 1.35;
    color: #111;
    margin: 0;
    padding: 0;
  }
  .title-container {
    text-align: center;
    margin-bottom: 18px;
  }
  h1 {
    font-size: 18pt;
    font-weight: bold;
    margin-bottom: 6px;
    line-height: 1.2;
  }
  .subtitle {
    font-size: 10pt;
    font-style: italic;
    color: #444;
    margin-bottom: 8px;
  }
  .author {
    font-size: 11pt;
    font-weight: bold;
    margin-bottom: 2px;
  }
  .affiliation {
    font-size: 9pt;
    color: #333;
    margin-bottom: 14px;
  }
  .abstract-box {
    margin: 0 auto 16px auto;
    width: 92%;
    font-size: 9pt;
    text-align: justify;
    line-height: 1.35;
    padding: 6px 12px;
    border-top: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
  }
  .abstract-title {
    font-weight: bold;
    font-style: italic;
  }
  .keywords {
    margin-top: 5px;
    font-size: 8.5pt;
  }
  .columns {
    column-count: 2;
    column-gap: 18px;
    text-align: justify;
  }
  h2 {
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 12px;
    margin-bottom: 4px;
    border-bottom: 0.5px solid #aaa;
    padding-bottom: 2px;
    break-after: avoid;
  }
  h3 {
    font-size: 10pt;
    font-weight: bold;
    font-style: italic;
    margin-top: 8px;
    margin-bottom: 3px;
    break-after: avoid;
  }
  p {
    margin-top: 0;
    margin-bottom: 6px;
    text-indent: 1em;
  }
  p.no-indent {
    text-indent: 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 7.5pt;
    line-height: 1.2;
  }
  th, td {
    border-top: 0.5px solid #bbb;
    border-bottom: 0.5px solid #bbb;
    padding: 3px 4px;
    text-align: center;
  }
  th {
    font-weight: bold;
    border-top: 1px solid #333;
    border-bottom: 1px solid #333;
  }
  caption {
    caption-side: top;
    font-size: 8pt;
    font-weight: bold;
    margin-bottom: 4px;
    text-align: left;
  }
  .table-box {
    break-inside: avoid;
    margin: 10px 0;
  }
  .citation {
    font-size: 8pt;
    margin-bottom: 4px;
    padding-left: 1.5em;
    text-indent: -1.5em;
  }
  .math-block {
    text-align: center;
    margin: 6px 0;
    font-size: 9pt;
  }
  .alert-callout {
    background: #f8f9fa;
    border-left: 3px solid #4a5568;
    padding: 4px 8px;
    font-size: 8pt;
    margin: 6px 0;
    text-indent: 0;
  }
</style>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"
    onload="renderMathInElement(document.body);"></script>
</head>
<body>

<div class="title-container">
  <h1>MotionIQ: View-Aware and Uncertainty-Aware Real-Time Human Movement Assessment via Monocular Edge Computer Vision</h1>
  <div class="subtitle">Unpublished Research Manuscript — Prepared as a Reproducible Scientific Research Artifact for the Erasmus Mundus Joint Master Degrees in Image Processing and Computer Vision (IPCVAI / IMLEX)</div>
  <div class="author">Devdatta Patil</div>
  <div class="affiliation">Department of Computer Science & Engineering &bull; Repository: https://github.com/motioniq/motioniq &bull; October 2026</div>
</div>

<div class="abstract-box">
  <span class="abstract-title">Abstract</span>—Automated movement quality assessment and real-time exercise coaching systems typically rely on single monocular RGB webcams. However, existing rule-based and deep learning pipelines implicitly assume an orthogonal, canonical frontal camera orientation. When users rotate relative to the camera optical axis, perspective projection and monocular foreshortening cause planar angle rules to collapse, inducing catastrophic false-alarm rates (e.g., mistaking lateral leg overlap for severe knee valgus). Furthermore, uncalibrated systems exhibit extreme overconfidence under limb self-occlusion and motion blur.
  <br><br>
  In this work, we introduce <b>MotionIQ</b>, a view-aware, uncertainty-aware exercise assessment and coaching platform designed for edge browser deployment. MotionIQ couples lightweight monocular pose estimation (MediaPipe BlazePose) with: (1) a 3D Torso-Normal Viewpoint Classifier dynamically estimating camera azimuth relative to the anatomical body frame; (2) a View-Aware Biomechanical Gating Engine suppressing out-of-plane rules under oblique and lateral views; (3) a Temporal Kinematic Modeling Pipeline quantifying continuous dynamics, range of motion, and Spectral Arc Length (SPARC) smoothness; and (4) an Uncertainty Gate implementing selective classification (abstention) when prediction margin or tracking visibility falls below reliability thresholds.
  <br><br>
  We evaluate MotionIQ on 200 authentic optoelectronic motion-capture recordings from UI-PRMD (10 human participants, 100 optimal and 100 non-optimal deep squats at 100 Hz) projected across virtual camera viewpoints ($0^\circ$ frontal, $45^\circ$ oblique, and $90^\circ$ lateral = 600 streams total). Crucially, the 600 streams represent repeated projections of 200 physical human trials. Under strict Leave-One-Subject-Out (LOSO) 10-fold cross-validation, upstream planar rules (Model A) suffer a catastrophic 74.0% False Warning Rate (FWR) on lateral squats due to perspective foreshortening. In contrast, MotionIQ's view-aware supervised temporal model with selective abstention (Model E) achieves <b>80.6% Balanced Accuracy</b> [95% CI: 71.8–88.2%], 81.3% Sensitivity, 79.8% Specificity, and 0.805 Macro-F1 at 88.5% coverage, slashing selective risk to <b>19.4%</b> (compared to 30.2% in Model A). At matched coverage ($\phi=0.885$), the underlying view-aware temporal model (Model D) achieves identical performance, confirming that selective risk decreases monotonically with coverage. Subject-level paired statistical tests ($N=10, df=9$) demonstrate a mean improvement of <b>$+8.48\%$ to $+9.66\%$ Balanced Accuracy</b> over planar rules ($p=0.0758$ for Model D, $p=0.0635$ for Model E), representing a strong positive trend across 8 of 10 participants while honestly acknowledging that sample size bounds prevent conventional $\alpha=0.05$ statistical proof. End-to-end latency benchmarks confirm a median feedback loop of <b>57.0 ms (~17.5 FPS)</b>, while protecting biometric privacy by executing landmark detection entirely in client-side volatile memory.
  <div class="keywords"><b>Keywords</b>—Biomechanics, Computer Vision, Edge Computing, Human Pose Estimation, Movement Quality Assessment, Selective Classification, Uncertainty Calibration.</div>
</div>

<div class="columns">

<h2>I. Introduction</h2>
<p>Musculoskeletal rehabilitation, athletic conditioning, and physical therapy depend fundamentally on exercise execution fidelity. Performing multi-joint movements with faulty kinematics—such as dynamic knee valgus (inward collapse) or inadequate depth during deep squats—greatly elevates the risk of acute anterior cruciate ligament (ACL) tears, patellofemoral pain syndrome, and chronic lumbar disc degeneration [1]. In-person guidance by certified physical therapists remains the gold standard, but geographic disparity, high healthcare costs, and scheduling bottlenecks severely limit clinical contact hours.</p>

<p>Recent advancements in markerless 3D human pose estimation (e.g., MediaPipe BlazePose [2], RTMPose [3]) enable digital health applications on standard webcams. However, existing consumer and academic systems suffer from severe geometric and statistical vulnerabilities:</p>

<p class="no-indent"><b>1. Planar Perspective Collapse:</b> Standard coaching engines evaluate joint angles using 2D image-plane dot products:
$$\cos \theta_{2D} = \frac{\mathbf{u}_{2D} \cdot \mathbf{v}_{2D}}{\|\mathbf{u}_{2D}\| \|\mathbf{v}_{2D}\|}$$
Because perspective projection compresses out-of-plane distances along the optical axis, camera rotation induces nonlinear foreshortening. When viewed from a $90^\circ$ profile, the projected medial-lateral distance between left and right knees approaches zero, triggering false knee valgus alarms on over 74% of perfect human squats.</p>

<p class="no-indent"><b>2. Forced Predictions Under Limb Occlusion:</b> Profile views inevitably cause limb self-occlusion. Uncalibrated heuristics force arbitrary predictions on occluded joints rather than gracefully abstaining.</p>

<p class="no-indent"><b>3. Neglect of Continuous Dynamics:</b> Evaluating isolated static frames ignores velocity reversals, acceleration jitter, and movement smoothness, which are primary clinical markers of motor recovery [4].</p>

<p class="no-indent"><b>4. Domain Gap & Evaluation Integrity:</b> Prior literature frequently evaluates algorithms on synthetic trigonometric fixtures or treats aggregate clinical rehabilitation labels as specific localized orthopedic defect detections.</p>

<h2>II. Methodology</h2>

<h3>A. 3D Torso-Normal Anatomical Reference Frame</h3>
<p>To achieve viewpoint invariance without stereoscopic hardware, MotionIQ dynamically establishes an intrinsic anatomical coordinate frame centered at the mid-pelvis. Given 3D landmark coordinates for left/right shoulders ($\mathbf{p}_{ls}, \mathbf{p}_{rs}$) and hips ($\mathbf{p}_{lh}, \mathbf{p}_{rh}$):</p>
<div class="math-block">
$$\mathbf{v}_{\text{torso}} = \mathbf{p}_{ls} - \mathbf{p}_{rs}, \quad \mathbf{v}_{\text{spine}} = \frac{\mathbf{p}_{ls} + \mathbf{p}_{rs}}{2} - \frac{\mathbf{p}_{lh} + \mathbf{p}_{rh}}{2}$$
$$\mathbf{n}_{\text{torso}} = \frac{\mathbf{v}_{\text{torso}} \times \mathbf{v}_{\text{spine}}}{\|\mathbf{v}_{\text{torso}} \times \mathbf{v}_{\text{spine}}\|}$$
</div>
<p>The camera azimuth angle $\psi$ relative to the chest normal vector $\mathbf{n}_{\text{torso}}$ is computed as:</p>
<div class="math-block">
$$\psi = \arctan2\left(n_{\text{torso}, x}, n_{\text{torso}, z}\right)$$
</div>
<p>When $|\psi| \ge 65^\circ$ (lateral regime), the system automatically suppresses coronal plane rules (e.g., knee valgus evaluation) and re-weights sagittal indicators (e.g., trunk lean and squat depth).</p>

<h3>B. Temporal Kinematic Trajectory Modeling & SPARC</h3>
<p>Rather than evaluating instantaneous frame angles, MotionIQ tracks continuous multi-frame trajectories over each repetition cycle:</p>
<ul style="font-size: 8.5pt; padding-left: 14px; margin-top: 2px; margin-bottom: 4px;">
  <li>Minimum, range, and mean knee flexion angles ($\min \theta_k, \Delta \theta_k, \bar{\theta}_k$).</li>
  <li>Coronal knee-to-ankle ratio: $R = \min \frac{\|\mathbf{p}_{lk} - \mathbf{p}_{rk}\|}{\|\mathbf{p}_{la} - \mathbf{p}_{ra}\|}$.</li>
  <li>Pelvis vertical descent displacement $\Delta y_p$ normalized by body height.</li>
  <li>Spectral Arc Length (SPARC) movement smoothness [4] computed on the speed profile $v(t)$:
  $$\operatorname{SPARC} \triangleq -\int_0^{\omega_c} \sqrt{\left(\frac{1}{\omega_c}\right)^2 + \left(\frac{d\hat{V}(\omega)}{d\omega}\right)^2} d\omega$$
  where $\hat{V}(\omega)$ is the normalized Fourier velocity spectrum and $\omega_c = 10\text{ Hz}$.</li>
</ul>

<h3>C. Selective Classification and Uncertainty Gating</h3>
<p>Grounded in selective classification theory [5], MotionIQ incorporates an Uncertainty Gate with an abstention option:</p>
<div class="math-block">
$$f(x) = \begin{cases}
\text{ABSTAIN}, & \text{if } |p - 0.5| < \gamma \text{ or } \bar{v} < \tau_v \\
\text{NON-OPTIMAL}, & \text{if } p \ge \tau^* \\
\text{OPTIMAL}, & \text{if } p < \tau^*
\end{cases}$$
</div>
<p>where $\gamma = 0.12, \tau_v = 0.45$, and $\tau^*$ is calibrated on inner validation folds without test leakage.</p>

<h2>III. Experimental Results</h2>

<h3>A. Dataset Provenance and Cross-Validation Protocol</h3>
<p>We evaluate on 200 authentic Vicon optical motion-capture recordings from UI-PRMD [6] (55,179 frames across 10 human participants, 100 optimal and 100 non-optimal deep squats at 100 Hz). Each trial is projected across three calibrated virtual viewpoints ($0^\circ, 45^\circ, 90^\circ = 600$ streams total). All evaluations follow strict <b>Leave-One-Subject-Out (LOSO) 10-fold cross-validation</b>.</p>

<div class="table-box">
  <table>
    <caption>TABLE I: Leave-One-Subject-Out (LOSO) 10-Fold Benchmark on 200 Authentic UI-PRMD Deep Squats (600 Streams Total). Brackets denote 95% bootstrap confidence intervals (B=1,000).</caption>
    <thead>
      <tr>
        <th>Model Architecture</th>
        <th>Sens. (%)</th>
        <th>Spec. (%)</th>
        <th>FWR (%)</th>
        <th>Balanced Acc. (%)</th>
        <th>Coverage</th>
        <th>Risk (%)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align:left;">Baseline Majority (Control)</td>
        <td>0.0</td><td>100.0</td><td>0.0</td><td>50.0 [50.0, 50.0]</td><td>100.0%</td><td>50.0</td>
      </tr>
      <tr>
        <td style="text-align:left;">Baseline Always-Abstain</td>
        <td>0.0</td><td>0.0</td><td>0.0</td><td>0.0 [0.0, 0.0]</td><td>0.0%</td><td>0.0</td>
      </tr>
      <tr>
        <td style="text-align:left;">Model A (Upstream Static Rules)</td>
        <td><b>89.0</b></td><td>50.7</td><td>49.3</td><td>69.8 [61.8, 76.3]</td><td>100.0%</td><td>30.2</td>
      </tr>
      <tr>
        <td style="text-align:left;">Model B (Temporal / SPARC Rules)</td>
        <td>100.0</td><td>0.0</td><td>100.0</td><td>50.0 [50.0, 50.0]</td><td>100.0%</td><td>50.0</td>
      </tr>
      <tr>
        <td style="text-align:left;">Model C (Supervised Temporal)</td>
        <td>71.7</td><td>77.0</td><td>23.0</td><td>74.3 [66.5, 82.7]</td><td>100.0%</td><td>25.7</td>
      </tr>
      <tr>
        <td style="text-align:left;">Model D (View-Aware Supervised)</td>
        <td>77.0</td><td>79.7</td><td>20.3</td><td><b>78.3</b> [70.7, 84.2]</td><td>100.0%</td><td>21.7</td>
      </tr>
      <tr style="font-weight:bold; background:#f0f4f8;">
        <td style="text-align:left;">Model E (Uncertainty-Gated)</td>
        <td>81.3</td><td>79.8</td><td><b>20.2</b></td><td><b>80.6</b> [71.8, 88.2]</td><td><b>88.5%</b></td><td><b>19.4</b></td>
      </tr>
    </tbody>
  </table>
</div>

<h3>B. Viewpoint Breakdown: Profile False Warnings</h3>
<p>As demonstrated in Table II, Model A suffers a catastrophic 74.0% False Warning Rate on lateral views. In Model D and Model E, view-aware gating slashes lateral FWR to 23.1–25.0% while preserving >84% sensitivity on frontal views.</p>

<div class="table-box">
  <table>
    <caption>TABLE II: False Warning Rate (FWR) and Balanced Accuracy Across Viewpoints.</caption>
    <thead>
      <tr>
        <th>Model</th>
        <th>Viewpoint</th>
        <th>FWR (%)</th>
        <th>Balanced Acc. (%)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td rowspan="3" style="text-align:left;">Model A (Rules)</td>
        <td>Frontal (0°)</td><td>45.0</td><td>73.5</td>
      </tr>
      <tr><td>Oblique (45°)</td><td>29.0</td><td>76.5</td></tr>
      <tr><td>Lateral (90°)</td><td><b>74.0 (Collapse)</b></td><td><b>59.5</b></td></tr>
      <tr>
        <td rowspan="3" style="text-align:left;">Model D (View-Aware)</td>
        <td>Frontal (0°)</td><td>15.0</td><td>83.5</td>
      </tr>
      <tr><td>Oblique (45°)</td><td>21.0</td><td>81.5</td></tr>
      <tr><td>Lateral (90°)</td><td><b>25.0 (Gated)</b></td><td><b>70.0</b></td></tr>
      <tr style="font-weight:bold; background:#f0f4f8;">
        <td rowspan="3" style="text-align:left;">Model E (Selective)</td>
        <td>Frontal (0°)</td><td><b>12.5</b></td><td><b>86.0</b></td>
      </tr>
      <tr style="font-weight:bold; background:#f0f4f8;"><td>Oblique (45°)</td><td>24.7</td><td>81.8</td></tr>
      <tr style="font-weight:bold; background:#f0f4f8;"><td>Lateral (90°)</td><td><b>23.1</b></td><td><b>73.8</b></td></tr>
    </tbody>
  </table>
</div>

<h3>C. Subject-Level Paired Significance Analysis ($N=10$)</h3>
<p>Because 600 streams represent 200 trials from 10 participants, statistical significance must be evaluated at the subject level ($df=9$):</p>
<ul style="font-size: 8.5pt; padding-left: 14px; margin-top: 2px; margin-bottom: 4px;">
  <li><b>Model A vs Model D:</b> Mean $\Delta$ Balanced Accuracy = <b>$+8.48\%$</b> [95% CI: $-1.1\%$ to $+18.0\%$], paired $t$-test $p = 0.0758$, Wilcoxon $p = 0.0742$. Exactly <b>7 improved, 1 tied, 2 regressed</b> across the 10 participants.</li>
  <li><b>Model A vs Model E:</b> Mean $\Delta$ Balanced Accuracy = <b>$+9.66\%$</b> [95% CI: $-0.7\%$ to $+20.0\%$], paired $t$-test $p = 0.0635$, Wilcoxon $p = 0.0840$. Exactly <b>8 improved, 0 tied, 2 regressed</b> across the 10 participants.</li>
</ul>
<p>These p-values represent a strong positive trend on the margin of $\alpha=0.05$, honestly reflecting the sample size limits of a 10-person cohort without claiming unproven significance.</p>

<h3>D. Matched-Coverage & Selective Risk Analysis</h3>
<p>Sweeping coverage $\phi \in [0.50, 1.00]$ shows that selective error risk decreases monotonically from 21.7% at full coverage down to 19.4% at $\phi=0.885$ (80.6% accuracy), reaching 9.3% at $\phi=0.50$ (90.7% accuracy). Forced evaluation on Model E's 69 abstained samples yielded only 75.4% accuracy, proving that abstention successfully isolates difficult boundary trials.</p>

<h3>E. Latency Decomposition</h3>
<p>Measured across 1,800 frames on an Intel Core i7-13700H and RTX 4060 GPU:
camera buffer (16.7 ms) + browser MediaPipe WebGL (21.5 ms) + loopback WebSocket (1.2 ms) + FastAPI kinematics (28.4 ms) + Canvas render (4.8 ms) = <b>57.0 ms median round-trip feedback ($\approx 17.5$ FPS)</b>.</p>

<h2>IV. Discussion & Domain Gap Disclosure</h2>
<p class="no-indent"><b>Domain Gap Disclosure:</b> The academic benchmark results (80.6% Balanced Accuracy, 19.4% selective risk) were obtained using 200 authentic UI-PRMD recordings captured by a 100 Hz Vicon optical mocap system with sub-millimeter precision. In physical deployment, the client browser estimates 3D skeletal landmarks from a single 2D RGB webcam at 30 FPS using MediaPipe BlazePose. While latency (57.0 ms) and view-classification accuracy (100% on 5 pilot sessions) have been verified, <b>the zero-shot transfer of the 80.6% movement-quality classification accuracy from Vicon data to live monocular webcams has not been clinically validated across a large patient population</b>. Live webcam outputs serve as assistive visual motor-learning aids, not gold-standard clinical measures.</p>

<h2>V. Conclusion</h2>
<p>MotionIQ demonstrates that combining 3D torso-normal camera viewpoint awareness with selective uncertainty abstention substantially mitigates false technique alarms in monocular exercise assessment. The entire platform operates in real time at 57.0 ms latency on consumer edge hardware while strictly preserving user biometric privacy.</p>

<h2>References</h2>
<div class="citation">[1] T. E. Hewett <i>et al.</i>, "Biomechanical measures of neuromuscular control and valgus loading of the knee predict anterior cruciate ligament injury risk," <i>Am. J. Sports Med.</i>, 33(4):492–501, 2005.</div>
<div class="citation">[2] V. Bazrev <i>et al.</i>, "BlazePose: On-device real-time body pose tracking," <i>arXiv:2006.10204</i>, 2020.</div>
<div class="citation">[3] T. Jiang <i>et al.</i>, "RTMPose: Real-time multi-person pose estimation based on MMPose," <i>arXiv:2303.07399</i>, 2023.</div>
<div class="citation">[4] S. Balasubramanian <i>et al.</i>, "Quantifying movement smoothness in physical therapy: A review and evaluation of spectral arc length," <i>IEEE TNSRE</i>, 23(5):913–922, 2015.</div>
<div class="citation">[5] Y. Geifman and R. El-Yaniv, "Selective classification for deep neural networks," in <i>NeurIPS</i>, 2017.</div>
<div class="citation">[6] A. Vakanski <i>et al.</i>, "A data set of human body movements for physical rehabilitation exercises," <i>Data</i>, 3(1):2, 2018.</div>

</div>
</body>
</html>
"""

def generate_pdf():
    docs_dir = Path(r"D:\motioniq\docs")
    html_path = docs_dir / "research_paper_render.html"
    pdf_path = docs_dir / "research_paper.pdf"
    
    html_path.write_text(HTML_CONTENT, encoding="utf-8")
    print(f"Wrote temporary HTML to {html_path}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(html_path.as_uri(), wait_until="networkidle")
        # Give KaTeX auto-render time to render math formulas
        page.wait_for_timeout(1000)
        page.pdf(
            path=str(pdf_path),
            format="Letter",
            print_background=True,
            margin={"top": "16mm", "bottom": "18mm", "left": "14mm", "right": "14mm"}
        )
        browser.close()
        
    print(f"Successfully compiled research manuscript into PDF: {pdf_path}")
    print(f"PDF File Size: {pdf_path.stat().st_size} bytes")

if __name__ == "__main__":
    generate_pdf()
