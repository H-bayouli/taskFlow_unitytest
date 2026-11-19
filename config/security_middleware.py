
class SecurityHeadersMiddleware:
    """
    Adds security headers to HTTP responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Prevent clickjacking
        response["X-Frame-Options"] = "DENY"

        # Cross-origin security headers
        response["Cross-Origin-Resource-Policy"] = "same-origin"
        response["Cross-Origin-Opener-Policy"] = "same-origin"

        # Content Security Policy
        response["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'none'"
        )

        # Restrict browser permissions
        response["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )

        # Prevent caching of potentially sensitive responses
        response["Cache-Control"] = "no-store, private"

        return response
