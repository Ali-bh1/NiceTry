"""
Layer 4 — Visual Clone Detection (Stub)

Placeholder for visual clone detection using CLIP + pHash + OCR.
Full implementation requires heavy dependencies (Playwright, CLIP, Tesseract).
This stub returns neutral scores and provides extension points.
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


def analyze_visual_clone(
    url: str,
    screenshot_b64: str | None = None,
) -> dict[str, Any]:
    """
    Analyze a website screenshot for visual similarity to known brands.

    Currently a stub — returns neutral results.
    Full implementation will use:
    - Playwright for screenshot capture
    - CLIP embeddings for multimodal comparison
    - pHash (perceptual hash) for near-duplicate detection
    - Tesseract OCR for text extraction

    Args:
        url: The URL being analyzed
        screenshot_b64: Optional base64-encoded screenshot

    Returns:
        Visual clone analysis result dict
    """
    if screenshot_b64:
        logger.info(f"Visual clone analysis requested for {url} (screenshot provided)")
    else:
        logger.debug(f"Visual clone analysis skipped for {url} (no screenshot)")

    return {
        "visual_similarity_score": 0.0,
        "matched_brand": None,
        "matched_brand_url": None,
        "clone_confidence_tier": "none",
        "ocr_text_extracted": False,
        "logo_detected": False,
        "analysis_available": screenshot_b64 is not None,
        "stub": True,
        "message": "Visual clone detection requires CLIP + Playwright (not installed)",
    }
