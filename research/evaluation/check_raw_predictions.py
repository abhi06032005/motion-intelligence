"""
Check raw predictions and statistical calculations directly from held-out predictions dictionary.
"""
import json
import numpy as np
from scipy import stats

def main():
    with open(r'D:\motioniq\research\results\phase6\phase6_held_out_trial_predictions.json', 'r') as f:
        data = json.load(f)
    
    models = ['model_a_rules', 'model_c_supervised_temporal', 'model_d_view_aware_supervised', 'model_e_uncertainty_calibrated']
    
    subjects = sorted(list(set(p['subject_id'] for p in data['model_a_rules'])))
    print(f"Unique Subjects ({len(subjects)}): {subjects}")
    
    subject_bacc = {m: [] for m in models}
    
    for s in subjects:
        for m in models:
            s_preds = [p for p in data[m] if p['subject_id'] == s]
            
            # For Model E, filter out abstained if evaluating on retained coverage
            retained = [p for p in s_preds if not p.get('is_abstained', False)]
            
            targets = np.array([p['y_true'] for p in retained])
            preds = np.array([p['y_pred'] for p in retained])
            
            tp = np.sum((preds == 1) & (targets == 1))
            fn = np.sum((preds == 0) & (targets == 1))
            tn = np.sum((preds == 0) & (targets == 0))
            fp = np.sum((preds == 1) & (targets == 0))
            sens = tp / (tp + fn) if (tp + fn) > 0 else 0
            spec = tn / (tn + fp) if (tn + fp) > 0 else 0
            bacc = (sens + spec) / 2.0
            subject_bacc[m].append(bacc * 100.0)
            
    print("\n--- Per-Subject Balanced Accuracy (%) ---")
    for m in models:
        print(f"{m:35s}: {[round(x, 1) for x in subject_bacc[m]]} | Mean: {np.mean(subject_bacc[m]):.2f}%")
        
    diff_d_a = np.array(subject_bacc['model_d_view_aware_supervised']) - np.array(subject_bacc['model_a_rules'])
    diff_e_a = np.array(subject_bacc['model_e_uncertainty_calibrated']) - np.array(subject_bacc['model_a_rules'])
    
    t_d, p_d = stats.ttest_rel(subject_bacc['model_d_view_aware_supervised'], subject_bacc['model_a_rules'])
    t_e, p_e = stats.ttest_rel(subject_bacc['model_e_uncertainty_calibrated'], subject_bacc['model_a_rules'])
    
    w_d, pw_d = stats.wilcoxon(diff_d_a)
    w_e, pw_e = stats.wilcoxon(diff_e_a)
    
    se_d = np.std(diff_d_a, ddof=1) / np.sqrt(len(diff_d_a))
    ci_d = [np.mean(diff_d_a) - 2.262 * se_d, np.mean(diff_d_a) + 2.262 * se_d]
    
    se_e = np.std(diff_e_a, ddof=1) / np.sqrt(len(diff_e_a))
    ci_e = [np.mean(diff_e_a) - 2.262 * se_e, np.mean(diff_e_a) + 2.262 * se_e]
    
    print("\n--- Paired Statistical Verification ---")
    print(f"Model D vs Model A: Mean Delta = +{np.mean(diff_d_a):.2f}%, 95% CI: [{ci_d[0]:.2f}%, {ci_d[1]:.2f}%], t = {t_d:.3f}, p = {p_d:.4f}, Wilcoxon p = {pw_d:.4f}")
    print(f"Model E vs Model A: Mean Delta = +{np.mean(diff_e_a):.2f}%, 95% CI: [{ci_e[0]:.2f}%, {ci_e[1]:.2f}%], t = {t_e:.3f}, p = {p_e:.4f}, Wilcoxon p = {pw_e:.4f}")
    
    # Check subjects improved/regressed
    for name, diff in [('D - A', diff_d_a), ('E - A', diff_e_a)]:
        improved = int(np.sum(diff > 0.01))
        regressed = int(np.sum(diff < -0.01))
        tied = int(np.sum(np.abs(diff) <= 0.01))
        print(f"{name}: Improved={improved}, Regressed={regressed}, Tied={tied}")

if __name__ == '__main__':
    main()
