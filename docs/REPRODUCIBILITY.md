# MotionIQ: Reproducibility & Independent Verification Guide (Phase 7)

## 1. Environment Setup

### Prerequisites
- Python 3.11 or 3.12 (64-bit).
- Node.js 18+ and `pnpm`.
- Windows 11 / 10, Linux, or macOS.

### Backend Virtual Environment
```powershell
cd D:\motioniq
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Frontend Dependencies
```powershell
cd D:\motioniq\frontend
pnpm install
```

---

## 2. Re-Executing the Independent Verification & Benchmarks

### Step 1: Verify Dataset Provenance & SHA-256 Hashes
To independently verify that all 200 raw Vicon optical mocap files match their cryptographic signatures:
```powershell
cd D:\motioniq
.\.venv\Scripts\python -c "from research.evaluation.verify_phase7_statistics import audit_dataset_provenance; print(audit_dataset_provenance())"
```
*Expected Output: `{'total_files': 200, 'total_megabytes': 70.58, 'total_frames_100hz': 55179, 'checksums_verified': True}`.*

### Step 2: Execute Leave-One-Subject-Out (LOSO) 10-Fold Cross-Validation
To re-run the complete Leave-One-Subject-Out cross-validation across all 10 participants and 600 projected streams:
```powershell
cd D:\motioniq
.\.venv\Scripts\python research\evaluation\run_phase6_evaluation.py
```
*Outputs: `research/results/phase6/phase6_loso_benchmark_summary.json` and `phase6_held_out_trial_predictions.json`.*

### Step 3: Execute Statistical Significance & Matched-Coverage Verification
To re-run the subject-level paired statistical tests ($N=10$), Risk-Coverage curves, and ECE probability calibration:
```powershell
cd D:\motioniq
.\.venv\Scripts\python research\evaluation\verify_phase7_statistics.py
```
*Outputs: `research/results/phase7/phase7_statistical_verification.json` and `phase7_matched_coverage_analysis.json`.*

### Step 4: Run the Backend Automated Test Suite
```powershell
cd D:\motioniq
.\.venv\Scripts\pytest backend -q
```
*Expected Output: `115 passed`.*

### Step 5: Build and Run the Next.js Production Website
```powershell
cd D:\motioniq\frontend
pnpm build
```
*Expected Output: `✓ Generating static pages (10/10) ... Finalizing page optimization`.*

---

## 3. Launching the Live Application for Demo & Testing

### Start Backend API Server
```powershell
cd D:\motioniq
.\.venv\Scripts\uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### Start Frontend Application
```powershell
cd D:\motioniq\frontend
pnpm dev --port 3000
```
Open your browser to:
- Real-Time Live Webcam Coaching: `http://localhost:3000/workout`
- Pre-Recorded Video Analysis: `http://localhost:3000/analyse`
- Research Evidence Dashboard: `http://localhost:3000/research`
- Static Yoga Posture Mode: `http://localhost:3000/yoga`
