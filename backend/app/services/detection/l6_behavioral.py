"""
Layer 6 — Behavioral Analysis

Static analysis of HTML content to detect malicious behaviors:
hidden forms, iframe abuse, suspicious JavaScript, redirect chains,
clipboard hijacking, fake login overlays, and permission requests.
"""

import re
import logging
from html.parser import HTMLParser
from typing import Any

logger = logging.getLogger(__name__)

SUSPICIOUS_JS_PATTERNS = [
    (r"document\.cookie", "cookie_access"),
    (r"localStorage\.(get|set)Item", "storage_access"),
    (r"navigator\.clipboard", "clipboard_access"),
    (r"navigator\.(mediaDevices|getUserMedia)", "media_access"),
    (r"Notification\.requestPermission", "notification_permission"),
    (r"window\.(location|open)\s*[=(]", "forced_navigation"),
    (r"location\.(href|replace|assign)", "redirect_attempt"),
    (r"eval\s*\(", "eval_usage"),
    (r"atob\s*\(", "base64_decode"),
    (r"String\.fromCharCode", "char_code_obfuscation"),
    (r"\\x[0-9a-fA-F]{2}", "hex_encoding"),
    (r"addEventListener\s*\(\s*[\"'](keydown|keypress|keyup)", "keylogger_suspected"),
    (r"debugger\s*;", "anti_debug"),
]

PHISHING_ACTION_PATTERNS = [
    r"\.php$", r"formsubmit\.co", r"docs\.google\.com/forms",
    r"submit.*\.aspx", r"data:text/html",
]


class HTMLAnalyzer(HTMLParser):
    """Custom HTML parser extracting security-relevant features."""

    def __init__(self):
        super().__init__()
        self.forms: list[dict] = []
        self.iframes: list[dict] = []
        self.scripts: list[str] = []
        self.hidden_inputs = 0
        self.password_fields = 0
        self.input_fields = 0
        self.external_resources = 0
        self._current_form: dict | None = None
        self._in_script = False
        self._script_buf = ""

    def handle_starttag(self, tag, attrs):
        a = {k: (v or "") for k, v in attrs}
        if tag == "form":
            self._current_form = {
                "action": a.get("action", ""), "method": a.get("method", "get").lower(),
                "inputs": 0, "password_fields": 0, "hidden_fields": 0,
            }
        elif tag == "input":
            t = a.get("type", "text").lower()
            if self._current_form:
                self._current_form["inputs"] += 1
            if t == "hidden":
                self.hidden_inputs += 1
                if self._current_form:
                    self._current_form["hidden_fields"] += 1
            elif t == "password":
                self.password_fields += 1
                if self._current_form:
                    self._current_form["password_fields"] += 1
            self.input_fields += 1
        elif tag == "iframe":
            src = a.get("src", "")
            style = a.get("style", "").lower()
            hidden = "hidden" in a or "display:none" in style or "visibility:hidden" in style
            self.iframes.append({"src": src, "hidden": hidden, "external": src.startswith(("http", "//"))})
        elif tag == "script":
            self._in_script = True
            self._script_buf = ""
            src = a.get("src", "")
            if src and src.startswith(("http", "//")):
                self.external_resources += 1

    def handle_endtag(self, tag):
        if tag == "form" and self._current_form:
            self.forms.append(self._current_form)
            self._current_form = None
        elif tag == "script":
            if self._script_buf:
                self.scripts.append(self._script_buf)
            self._in_script = False

    def handle_data(self, data):
        if self._in_script:
            self._script_buf += data


def _analyze_forms(forms: list[dict]) -> dict:
    suspicious = 0
    hidden_cred = 0
    for f in forms:
        is_sus = f["password_fields"] > 0
        action = f.get("action", "")
        if any(re.search(p, action, re.I) for p in PHISHING_ACTION_PATTERNS):
            is_sus = True
        if f["method"] == "post" and action.startswith("http"):
            is_sus = True
        if f["hidden_fields"] > f["inputs"] * 0.5 and f["inputs"] > 0:
            hidden_cred += 1
        if is_sus:
            suspicious += 1
    return {"total_forms": len(forms), "suspicious_forms": suspicious, "hidden_credential_forms": hidden_cred}


def _analyze_scripts(scripts: list[str]) -> dict:
    detected = []
    all_js = "\n".join(scripts)
    for pattern, name in SUSPICIOUS_JS_PATTERNS:
        if re.search(pattern, all_js, re.IGNORECASE):
            detected.append(name)
    detected = list(set(detected))
    obfuscated = any(b in detected for b in ["eval_usage", "base64_decode", "char_code_obfuscation", "hex_encoding"])
    return {"total_inline_scripts": len(scripts), "detected_behaviors": detected, "obfuscation_detected": obfuscated}


def _compute_behavioral_risk(form_a, script_a, hidden_iframes, ext_iframes, pw_fields) -> int:
    score = 0
    if form_a["suspicious_forms"] > 0: score += 20
    if form_a["hidden_credential_forms"] > 0: score += 25
    behaviors = script_a["detected_behaviors"]
    if "cookie_access" in behaviors: score += 10
    if "clipboard_access" in behaviors: score += 12
    if "keylogger_suspected" in behaviors: score += 20
    if "forced_navigation" in behaviors: score += 8
    if script_a["obfuscation_detected"]: score += 15
    if hidden_iframes > 0: score += 15
    if ext_iframes > 2: score += 10
    if pw_fields > 0 and form_a["suspicious_forms"] > 0: score += 10
    return min(score, 100)


def analyze_behavior(html_content: str | None, url: str = "") -> dict[str, Any]:
    """
    Analyze HTML content for malicious behavioral patterns.

    Returns behavioral flags and risk score (0-100).
    """
    empty = {
        "hidden_forms": False, "redirect_chain_length": 0, "iframe_abuse": False,
        "popup_loops": False, "clipboard_hijack": False, "fake_login_overlay": False,
        "excessive_permissions": False, "behavioral_risk": 0, "detected_behaviors": [],
        "form_analysis": {}, "script_analysis": {}, "html_available": False,
    }
    if not html_content:
        return empty

    analyzer = HTMLAnalyzer()
    try:
        analyzer.feed(html_content)
    except Exception as e:
        logger.warning(f"HTML parsing failed: {e}")
        empty["html_available"] = True
        return empty

    form_a = _analyze_forms(analyzer.forms)
    script_a = _analyze_scripts(analyzer.scripts)
    hidden_if = sum(1 for f in analyzer.iframes if f["hidden"])
    ext_if = sum(1 for f in analyzer.iframes if f["external"])
    behaviors = script_a["detected_behaviors"]
    risk = _compute_behavioral_risk(form_a, script_a, hidden_if, ext_if, analyzer.password_fields)
    redir = len(re.findall(r"(redirect|url|next|goto|return|redir)=", url, re.I))

    return {
        "hidden_forms": form_a["hidden_credential_forms"] > 0,
        "redirect_chain_length": redir,
        "iframe_abuse": hidden_if > 0 or ext_if > 2,
        "popup_loops": "forced_navigation" in behaviors,
        "clipboard_hijack": "clipboard_access" in behaviors,
        "fake_login_overlay": analyzer.password_fields > 0 and form_a["hidden_credential_forms"] > 0,
        "excessive_permissions": any(b in behaviors for b in ["media_access", "notification_permission"]),
        "behavioral_risk": risk,
        "detected_behaviors": behaviors,
        "form_analysis": form_a,
        "script_analysis": script_a,
        "html_available": True,
    }
