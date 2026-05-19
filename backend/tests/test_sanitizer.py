"""
Test Suite — URL Sanitizer

Validates SSRF prevention, scheme validation, length limits,
and URL normalization.
"""

import pytest
from app.utils.sanitizer import sanitize_url, URLValidationError


class TestSanitizeUrlScheme:
    """URL scheme validation tests."""

    def test_https_url_passes(self):
        result = sanitize_url("https://example.com")
        assert result == "https://example.com"

    def test_http_url_passes(self):
        result = sanitize_url("http://example.com")
        assert result == "http://example.com"

    def test_missing_scheme_auto_prefixed(self):
        result = sanitize_url("example.com")
        assert result == "https://example.com"

    def test_ftp_scheme_rejected(self):
        with pytest.raises(URLValidationError) as exc_info:
            sanitize_url("ftp://evil.com/file")
        assert exc_info.value.code == "invalid_scheme"

    def test_javascript_scheme_rejected(self):
        with pytest.raises(URLValidationError) as exc_info:
            sanitize_url("javascript:alert(1)")
        assert exc_info.value.code == "invalid_scheme"


class TestSanitizeUrlSSRF:
    """SSRF prevention tests."""

    def test_localhost_blocked(self):
        with pytest.raises(URLValidationError) as exc_info:
            sanitize_url("http://127.0.0.1/admin")
        assert exc_info.value.code == "private_ip"

    def test_private_10_range_blocked(self):
        with pytest.raises(URLValidationError) as exc_info:
            sanitize_url("http://10.0.0.1/internal")
        assert exc_info.value.code == "private_ip"

    def test_private_192_range_blocked(self):
        with pytest.raises(URLValidationError) as exc_info:
            sanitize_url("http://192.168.1.1/router")
        assert exc_info.value.code == "private_ip"

    def test_public_ip_allowed(self):
        result = sanitize_url("http://8.8.8.8")
        assert "8.8.8.8" in result


class TestSanitizeUrlLength:
    """URL length validation tests."""

    def test_normal_length_passes(self):
        url = "https://example.com/path"
        assert sanitize_url(url) == url

    def test_exceeds_max_length_rejected(self):
        url = "https://example.com/" + "a" * 2100
        with pytest.raises(URLValidationError) as exc_info:
            sanitize_url(url)
        assert exc_info.value.code == "url_too_long"


class TestSanitizeUrlEdgeCases:
    """Edge case validation tests."""

    def test_empty_url_rejected(self):
        with pytest.raises(URLValidationError) as exc_info:
            sanitize_url("")
        assert exc_info.value.code == "missing_url"

    def test_none_url_rejected(self):
        with pytest.raises(URLValidationError) as exc_info:
            sanitize_url(None)
        assert exc_info.value.code == "missing_url"

    def test_whitespace_stripped(self):
        result = sanitize_url("  https://example.com  ")
        assert result == "https://example.com"

    def test_double_encoded_url_decoded(self):
        # %2568ttp → %68ttp → http (double encoding evasion)
        result = sanitize_url("https://example.com/%2568ello")
        assert "%25" not in result  # Should be decoded
