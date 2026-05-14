"""
ML risk prediction using the trained XGBoost defect model.

Model: defect_model_xgboost.pkl  (XGBClassifier, binary: 0=clean, 1=defective)
Input: 11 features per module (extracted by features.py)
Output: defect probability (class-1 probability) = risk score in [0, 1]

Falls back to a lightweight heuristic scorer if the model file is missing
so the app never crashes in environments without the .pkl file.
"""
from __future__ import annotations

import logging
import math
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Feature column order expected by the model ──────────────────────────────
MODEL_FEATURES = [
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

MODEL_PATH = Path(__file__).parent / "defect_model_xgboost.pkl"

# ── Load model once at import time ───────────────────────────────────────────
_model = None
_model_loaded = False


def _load_model():
    global _model, _model_loaded
    if _model_loaded:
        return _model
    _model_loaded = True
    if not MODEL_PATH.exists():
        logger.warning(
            "XGBoost model not found at %s — using heuristic fallback.", MODEL_PATH
        )
        return None
    try:
        import joblib  # noqa: PLC0415
        _model = joblib.load(MODEL_PATH)
        logger.info("XGBoost defect model loaded: %s", MODEL_PATH.name)
        return _model
    except Exception as exc:
        logger.error("Failed to load XGBoost model: %s — using heuristic fallback.", exc)
        return None


# ── Heuristic fallback (no external deps) ────────────────────────────────────

def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def _heuristic_risk(feat: dict) -> float:
    score = (
        0.08  * feat.get("in_degree", 0)
        + 0.09  * feat.get("out_degree", 0)
        + 1.7   * feat.get("betweenness", 0)
        + 0.25  * feat.get("cycle_count", 0)
        + 0.0035 * feat.get("loc_proxy", 20)
        - 1.5
    )
    return round(_sigmoid(score), 4)


# ── Public API ────────────────────────────────────────────────────────────────

def predict_module_risks(features: list[dict]) -> dict[str, float]:
    """
    Returns {module_name: risk_score} where risk_score ∈ [0, 1].

    Uses XGBoost (class-1 probability) when the model is available,
    otherwise falls back to the deterministic heuristic scorer.
    """
    if not features:
        return {}

    model = _load_model()

    if model is not None:
        return _predict_xgboost(model, features)
    else:
        return _predict_heuristic(features)


def _predict_xgboost(model, features: list[dict]) -> dict[str, float]:
    """Use the loaded XGBClassifier to predict defect probability."""
    try:
        import numpy as np  # noqa: PLC0415

        # Build matrix in the exact column order the model was trained on
        rows = []
        for feat in features:
            row = [feat.get(col, 0) for col in MODEL_FEATURES]
            rows.append(row)

        X = np.array(rows, dtype=float)
        probas = model.predict_proba(X)   # shape (n, 2)
        risk_scores = probas[:, 1]        # class-1 = defective probability

        return {
            feat["module"]: round(float(score), 4)
            for feat, score in zip(features, risk_scores)
        }

    except Exception as exc:
        logger.error("XGBoost prediction failed: %s — falling back to heuristic.", exc)
        return _predict_heuristic(features)


def _predict_heuristic(features: list[dict]) -> dict[str, float]:
    return {feat["module"]: _heuristic_risk(feat) for feat in features}


# ── Model metadata helper (used by /scans/{id}/model-info endpoint) ──────────

def get_model_info() -> dict:
    """Return info about the active model for display in the UI."""
    model = _load_model()
    if model is None:
        return {
            "name": "Heuristic Scorer",
            "type": "rule-based",
            "features": ["in_degree", "out_degree", "betweenness", "cycle_count", "loc_proxy"],
            "n_features": 5,
            "active": False,
        }
    return {
        "name": "XGBoost Defect Classifier",
        "type": "XGBClassifier",
        "features": MODEL_FEATURES,
        "n_features": len(MODEL_FEATURES),
        "active": True,
        "model_file": MODEL_PATH.name,
        "classes": [int(c) for c in model.classes_],
    }
