"""
Pytest configuration and shared fixtures.
"""

import sys
import os
import pytest
import asyncio

# Ensure the backend directory is on sys.path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()
