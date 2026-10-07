import json
import os
import sys

def main():
    eval_path = os.path.join(os.path.dirname(__file__), "../data/evaluation.json")
    if not os.path.exists(eval_path):
        print(f"Evaluation file not found at {eval_path}. Run train_model.py first.")
        sys.exit(1)
        
    with open(eval_path, "r") as f:
        report = json.load(f)
        
    print("=== MODEL EVALUATION REPORT ===")
    print("\nDataset Statistics:")
    print(f"  Total samples: {report['dataset_statistics']['total']}")
    print(f"  Legitimate:    {report['dataset_statistics']['legitimate']}")
    print(f"  Fraud:         {report['dataset_statistics']['fraud']}")
    
    print("\nMetrics:")
    for k, v in report["metrics"].items():
        print(f"  {k}: {v:.4f}")
        
    print(f"\nSelected Threshold: {report['selected_threshold']}")
    
    print("\nConfusion Matrix:")
    cm = report["confusion_matrix"]
    print(f"  TN: {cm[0][0]} | FP: {cm[0][1]}")
    print(f"  FN: {cm[1][0]} | TP: {cm[1][1]}")

if __name__ == "__main__":
    main()
