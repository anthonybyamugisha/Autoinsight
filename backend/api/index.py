"""
Vercel serverless entry point for the Django backend.

When you deploy the ``backend/`` directory as a Vercel project, this
handler receives all HTTP requests routed by ``vercel.json`` and
forwards them to the Django WSGI application via the
``serverless_wsgi`` bridge.
"""
import os
import sys

# ── Bootstrap ──────────────────────────────────────────────────────────
# Add this directory's parent (the backend/ project root) to sys.path so
# that 'backend.settings' etc. is importable.
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

# MUST be set before any Django imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# ── Load Django WSGI application ───────────────────────────────────────
from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()

# ── Serverless adapter ─────────────────────────────────────────────────
try:
    from serverless_wsgi import handle as serverless_handle
except ImportError:
    # Fallback: simple WSGI wrapper (won't be fully Vercel-compatible
    # but allows basic local testing).
    def serverless_handle(app, event, context):
        """Minimal Vercel → WSGI adapter (used when serverless-wsgi is not installed)."""
        from io import BytesIO

        environ = {
            "REQUEST_METHOD": event.get("httpMethod", "GET"),
            "PATH_INFO": event.get("path", "/"),
            "QUERY_STRING": "&".join(
                f"{k}={v}" for k, v in (event.get("queryStringParameters") or {}).items()
            ),
            "SERVER_NAME": "vercel",
            "SERVER_PORT": "443",
            "wsgi.version": (1, 0),
            "wsgi.url_scheme": "https",
            "wsgi.input": BytesIO((event.get("body") or "").encode("utf-8")),
            "wsgi.errors": sys.stderr,
            "wsgi.multithread": False,
            "wsgi.multiprocess": False,
            "wsgi.run_once": False,
        }
        for key, value in (event.get("headers") or {}).items():
            wsgi_key = f"HTTP_{key.upper().replace('-', '_')}"
            environ[wsgi_key] = value
        if "content-type" in (hdr.lower() for hdr in (event.get("headers") or {})):
            environ["CONTENT_TYPE"] = event["headers"]["Content-Type"]
        if "content-length" in (hdr.lower() for hdr in (event.get("headers") or {})):
            environ["CONTENT_LENGTH"] = event["headers"]["Content-Length"]

        response_data = {}

        def start_response(status, headers):
            response_data["status"] = int(status.split()[0])
            response_data["headers"] = dict(headers)

        body = app(environ, start_response)
        body_content = b"".join(body) if isinstance(body, list) else body

        return {
            "statusCode": response_data.get("status", 200),
            "headers": response_data.get("headers", {}),
            "body": body_content.decode("utf-8"),
        }


# ── Vercel handler (called by the runtime per request) ─────────────────
def handler(event: dict, context: object) -> dict:
    """
    Vercel Python Runtime entry point.

    Parameters
    ----------
    event : dict
        The HTTP event payload from Vercel.
    context : object
        The Lambda-like context object (not used).

    Returns
    -------
    dict
        Vercel-compatible response with ``statusCode``, ``headers``, ``body``.
    """
    return serverless_handle(application, event, context)
