from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from flask import current_app


def verify_google_token(credential: str) -> dict:
    """Verify a Google ID token and return its claims.

    Raises ValueError with a user-safe message on any failure.
    """
    try:
        claims = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            current_app.config["GOOGLE_CLIENT_ID"],
        )
    except Exception as exc:
        raise ValueError(f"Invalid Google token: {exc}") from exc

    if not claims.get("email_verified"):
        raise ValueError("Google account email is not verified.")

    return {
        "google_sub": claims["sub"],
        "email": claims["email"],
        "name": claims.get("name", ""),
        "avatar_url": claims.get("picture"),
    }
