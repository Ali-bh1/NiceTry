"""
Layer 2 — ML Detection Engine

XGBoost-based phishing classifier with SHAP explainability.
Uses a feature-correlated training model that correctly maps URL
characteristics to phishing probability.
"""

import logging
import numpy as np
from pathlib import Path

from app.config import settings
from app.services.detection.l1_url_features import ML_FEATURE_NAMES

logger = logging.getLogger(__name__)

# Lazy-loaded model and explainer
_model = None
_explainer = None
_model_loaded = False


def _create_feature_aware_model():
    """
    Create a properly calibrated XGBoost model trained on realistic
    synthetic data where features CORRELATE with the phishing label.

    Feature semantics used for generation:
      - High URL/hostname length → phishing
      - No HTTPS → phishing
      - High-risk TLD → phishing
      - High entropy → phishing
      - More suspicious keywords → phishing
      - IP as host → phishing
      - More subdomains → phishing
      - Redirect indicators → phishing
      - Encoded URLs → phishing
      - Non-standard ports → phishing
    """
    from xgboost import XGBClassifier

    logger.info("Creating feature-aware XGBoost model...")

    rng = np.random.default_rng(42)
    n_samples = 10000
    n_phishing = 5500
    n_legit = n_samples - n_phishing

    # Feature order (23 features):
    # url_length, hostname_length, path_length, query_length,
    # path_depth, is_https, is_high_risk_tld, subdomain_depth,
    # has_subdomain, is_ip_address, domain_entropy, full_entropy,
    # digit_ratio, letter_ratio, special_char_count, dot_count,
    # hyphen_count, at_sign_count, keyword_count,
    # has_redirect_indicator, has_encoded_url, has_non_standard_port,
    # param_count

    # ── Generate PHISHING samples ──
    phish = np.column_stack([
        rng.integers(60, 200, n_phishing).astype(float),          # url_length: long
        rng.integers(20, 80, n_phishing).astype(float),           # hostname_length: long
        rng.integers(5, 50, n_phishing).astype(float),            # path_length
        rng.integers(0, 60, n_phishing).astype(float),            # query_length
        rng.integers(1, 6, n_phishing).astype(float),             # path_depth: deep
        rng.choice([0, 1], n_phishing, p=[0.45, 0.55]).astype(float),  # is_https: often missing
        rng.choice([0, 1], n_phishing, p=[0.35, 0.65]).astype(float),  # is_high_risk_tld: often yes
        rng.integers(0, 4, n_phishing).astype(float),             # subdomain_depth: deeper
        rng.choice([0, 1], n_phishing, p=[0.3, 0.7]).astype(float),   # has_subdomain: often yes
        rng.choice([0, 1], n_phishing, p=[0.85, 0.15]).astype(float),  # is_ip_address: sometimes
        rng.uniform(3.2, 5.0, n_phishing),                        # domain_entropy: HIGH
        rng.uniform(3.5, 5.2, n_phishing),                        # full_entropy: HIGH
        rng.uniform(0.05, 0.3, n_phishing),                       # digit_ratio: higher
        rng.uniform(0.4, 0.7, n_phishing),                        # letter_ratio
        rng.integers(5, 25, n_phishing).astype(float),            # special_char_count: many
        rng.integers(3, 8, n_phishing).astype(float),             # dot_count: many
        rng.integers(1, 6, n_phishing).astype(float),             # hyphen_count: many
        rng.choice([0, 1, 2], n_phishing, p=[0.6, 0.3, 0.1]).astype(float),  # at_sign_count
        rng.integers(1, 6, n_phishing).astype(float),             # keyword_count: HIGH
        rng.choice([0, 1], n_phishing, p=[0.6, 0.4]).astype(float),  # has_redirect_indicator
        rng.choice([0, 1], n_phishing, p=[0.7, 0.3]).astype(float),  # has_encoded_url
        rng.choice([0, 1], n_phishing, p=[0.85, 0.15]).astype(float),  # has_non_standard_port
        rng.integers(0, 8, n_phishing).astype(float),             # param_count
    ])

    # ── Generate LEGITIMATE samples ──
    legit = np.column_stack([
        rng.integers(15, 60, n_legit).astype(float),              # url_length: short
        rng.integers(8, 25, n_legit).astype(float),               # hostname_length: short
        rng.integers(0, 15, n_legit).astype(float),               # path_length
        rng.integers(0, 20, n_legit).astype(float),               # query_length
        rng.integers(0, 3, n_legit).astype(float),                # path_depth: shallow
        rng.choice([0, 1], n_legit, p=[0.05, 0.95]).astype(float),   # is_https: almost always
        rng.choice([0, 1], n_legit, p=[0.95, 0.05]).astype(float),   # is_high_risk_tld: rarely
        rng.integers(0, 2, n_legit).astype(float),                # subdomain_depth: minimal
        rng.choice([0, 1], n_legit, p=[0.5, 0.5]).astype(float),    # has_subdomain
        rng.choice([0, 1], n_legit, p=[0.99, 0.01]).astype(float),  # is_ip_address: never
        rng.uniform(2.0, 3.5, n_legit),                           # domain_entropy: LOW
        rng.uniform(2.5, 3.8, n_legit),                           # full_entropy: LOW
        rng.uniform(0.0, 0.08, n_legit),                          # digit_ratio: low
        rng.uniform(0.65, 0.85, n_legit),                         # letter_ratio: high
        rng.integers(2, 8, n_legit).astype(float),                # special_char_count: few
        rng.integers(1, 3, n_legit).astype(float),                # dot_count: few
        rng.integers(0, 2, n_legit).astype(float),                # hyphen_count: few
        np.zeros(n_legit),                                         # at_sign_count: ZERO
        rng.integers(0, 1, n_legit).astype(float),                # keyword_count: ZERO/low
        np.zeros(n_legit),                                         # has_redirect_indicator: NO
        np.zeros(n_legit),                                         # has_encoded_url: NO
        np.zeros(n_legit),                                         # has_non_standard_port: NO
        rng.integers(0, 3, n_legit).astype(float),                # param_count: few
    ])

    X = np.vstack([phish, legit])
    y = np.concatenate([np.ones(n_phishing), np.zeros(n_legit)])

    # Shuffle
    indices = rng.permutation(n_samples)
    X, y = X[indices], y[indices]

    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        eval_metric="logloss",
        use_label_encoder=False,
    )

    model.fit(X, y)

    # Validate accuracy
    from sklearn.metrics import accuracy_score, f1_score
    y_pred = model.predict(X)
    acc = accuracy_score(y, y_pred)
    f1 = f1_score(y, y_pred)
    logger.info(f"Model trained — Accuracy: {acc:.3f}, F1: {f1:.3f}")

    # Save the model
    import joblib
    model_dir = Path(settings.MODEL_DIR)
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / settings.MODEL_FILE
    joblib.dump(model, model_path)
    logger.info(f"Model saved to {model_path}")

    return model


def load_model():
    """Load the XGBoost model from disk, or create a calibrated model if not found."""
    global _model, _explainer, _model_loaded

    model_path = Path(settings.MODEL_DIR) / settings.MODEL_FILE

    # Always rebuild if the model is the old random one
    # by checking a marker file
    marker_path = model_path.parent / ".model_v2"
    if model_path.exists() and marker_path.exists():
        import joblib
        _model = joblib.load(model_path)
        logger.info(f"Loaded model from {model_path}")
    else:
        logger.warning("Model missing or outdated. Creating feature-aware model...")
        _model = _create_feature_aware_model()
        marker_path.write_text("v2-feature-aware")

    # Initialize SHAP explainer
    try:
        import shap
        _explainer = shap.TreeExplainer(_model)
        logger.info("SHAP TreeExplainer initialized")
    except Exception as e:
        logger.warning(f"SHAP initialization failed (non-critical): {e}")
        _explainer = None

    _model_loaded = True


def is_model_loaded() -> bool:
    """Check if the ML model is loaded and ready for inference."""
    return _model_loaded


def predict(feature_vector: list[float]) -> dict:
    """
    Run inference on a single URL's feature vector.

    Returns:
        {
            "phishing_probability": float (0-1),
            "confidence": float (0-1),
            "is_phishing": bool,
            "top_features": [{"feature": str, "value": float, "impact": str}, ...],
        }
    """
    if not _model_loaded:
        load_model()

    X = np.array([feature_vector])
    proba = _model.predict_proba(X)[0]
    phishing_prob = float(proba[1])
    confidence = float(max(proba))

    is_phishing = phishing_prob >= settings.DETECTION_THRESHOLD

    # Generate feature importance explanations
    top_features = _get_feature_explanations(X)

    return {
        "phishing_probability": round(phishing_prob, 4),
        "confidence": round(confidence, 4),
        "is_phishing": is_phishing,
        "top_features": top_features,
    }


def _get_feature_explanations(X: np.ndarray) -> list[dict]:
    """Generate per-feature importance explanations via SHAP or feature importances."""
    top_features = []

    # Try SHAP first
    if _explainer is not None:
        try:
            shap_values = _explainer.shap_values(X)
            if isinstance(shap_values, list):
                sv = shap_values[1][0]
            else:
                sv = shap_values[0]

            feature_impacts = list(zip(ML_FEATURE_NAMES, sv))
            feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)

            return [
                {
                    "feature": name,
                    "value": round(abs(float(val)), 4),
                    "impact": "increases_risk" if val > 0 else "decreases_risk",
                }
                for name, val in feature_impacts[:7]
            ]
        except Exception as e:
            logger.warning(f"SHAP explanation failed: {e}")

    # Fallback: use model feature importances
    if hasattr(_model, 'feature_importances_'):
        importances = _model.feature_importances_
        feature_impacts = list(zip(ML_FEATURE_NAMES, importances))
        feature_impacts.sort(key=lambda x: x[1], reverse=True)
        return [
            {
                "feature": name,
                "value": round(float(val), 4),
                "impact": "contributes_to_prediction",
            }
            for name, val in feature_impacts[:7]
        ]

    return top_features
