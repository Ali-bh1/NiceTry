"""
Passenger WSGI entry point for WebHostMost shared hosting.

Bridges FastAPI (ASGI) → Passenger (WSGI) via a2wsgi middleware.
Passenger looks for the 'application' variable by convention.
"""
import os
import sys

# Ensure the app directory is in Python's module search path
app_dir = os.path.dirname(os.path.abspath(__file__))
if app_dir not in sys.path:
    sys.path.insert(0, app_dir)

from a2wsgi import ASGIMiddleware
from main import app

# Passenger requires this exact variable name
application = ASGIMiddleware(app)
