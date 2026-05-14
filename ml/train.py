"""
XGBoost defect prediction model trainer.

Dataset columns (train_filtered.csv / software_defect_prediction_dataset.csv):
  lines_of_code, cyclomatic_complexity, num_functions, num_classes,
  comment_density, code_churn, num_developers, commit_frequency,
  avg_function_length, bug_fix_commits, past_defects, defect (0/1 label)

Usage:
  python ml/train.py                          # uses default dataset path
  python ml/train.py --data path/to/data.csv  # custom dataset
  python ml/train.py --eval                   # print evaluation metrics only
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

# ── Constants ────────────────────────────────────────────────────────────────

FEATURE_COLS = [
    "lines_of_code",
    "cyclomatic_complexity",
    "num_functions",
    "num_classes",
    "comment_density",
    "code_churn",
    "num_developers",
    "commit_frequency",
    "avg_function_length",
    "bug_fix_commits",
    "past_defects",
]

LABEL_COL = "defect"

DEFAULT_DATA = Path(__file__).parent.parent / "ml" / "train_filtered.csv"
OUTPUT_MODEL = Path(__file__).parent.parent / "backend" / "app" / "services" / "defect_model_xgboost.pkl"


# ── Data loading ─────────────────────────────────────────────────────────────

def load_data(csv_path: Path) -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_csv(csv_path)
    # Drop file_name column if present (not a feature)
    df = df.drop(columns=[c for c in ["file_name"] if c in df.columns])
    missing = [c for c in FEATURE_COLS + [LABEL_COL] if c not in df.columns]
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")
    X = df[FEATURE_COLS].fillna(0)
    y = df[LABEL_COL].astype(int)
    return X, y


# ── Training ──────────────────────────────────────────────────────────────────

def train(csv_path: Path = DEFAULT_DATA, output: Path = OUTPUT_MODEL) -> XGBClassifier:
    print(f"Loading dataset: {csv_path}")
    X, y = load_data(csv_path)

    print(f"  Samples : {len(X)}")
    print(f"  Features: {list(X.columns)}")
    print(f"  Label distribution: {y.value_counts().to_dict()}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Class imbalance: compute scale_pos_weight
    neg, pos = (y_train == 0).sum(), (y_train == 1).sum()
    scale_pos = neg / max(pos, 1)

    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )

    print("\nTraining XGBoost model…")
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    # ── Evaluation ────────────────────────────────────────────────────────
    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    print("\n── Test Set Results ──────────────────────────────────────")
    print(classification_report(y_test, y_pred, target_names=["Clean", "Defective"]))
    print(f"ROC-AUC : {roc_auc_score(y_test, y_proba):.4f}")
    print(f"Confusion Matrix:\n{confusion_matrix(y_test, y_pred)}")

    # 5-fold cross-validation AUC
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring="roc_auc", n_jobs=-1)
    print(f"\n5-Fold CV ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Feature importance
    print("\n── Feature Importance ────────────────────────────────────")
    importance = sorted(
        zip(FEATURE_COLS, model.feature_importances_),
        key=lambda x: x[1], reverse=True,
    )
    for feat, imp in importance:
        bar = "█" * int(imp * 40)
        print(f"  {feat:<26} {imp:.4f}  {bar}")

    # Save model
    output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output)
    print(f"\nModel saved → {output}")
    return model


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train XGBoost defect prediction model")
    parser.add_argument("--data",   default=str(DEFAULT_DATA), help="Path to training CSV")
    parser.add_argument("--output", default=str(OUTPUT_MODEL), help="Output .pkl path")
    parser.add_argument("--eval",   action="store_true",       help="Evaluate existing model only")
    args = parser.parse_args()

    if args.eval:
        print("Loading saved model for evaluation…")
        saved = Path(args.output)
        if not saved.exists():
            print(f"Model not found at {saved}"); raise SystemExit(1)
        model = joblib.load(saved)
        X, y = load_data(Path(args.data))
        y_proba = model.predict_proba(X)[:, 1]
        print(f"ROC-AUC on full dataset: {roc_auc_score(y, y_proba):.4f}")
    else:
        train(Path(args.data), Path(args.output))
