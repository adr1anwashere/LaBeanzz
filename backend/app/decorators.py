import functools
import jwt
from flask import request, jsonify, g, current_app
from .models import User
from .services.jwt_service import decode_token


def require_auth(f):
    """Verify the Bearer JWT and attach the User to flask.g.current_user."""

    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed Authorization header."}), 401

        token = auth_header.removeprefix("Bearer ").strip()
        try:
            claims = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired."}), 401
        except jwt.PyJWTError:
            return jsonify({"error": "Invalid token."}), 401

        user = User.query.get(claims["sub"])
        if user is None:
            return jsonify({"error": "User not found."}), 401

        g.current_user = user
        return f(*args, **kwargs)

    return wrapper


def require_role(*roles: str):
    """Check that the authenticated user has one of the given roles.

    Must be used after @require_auth so g.current_user is set.
    """

    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if user is None or user.role not in roles:
                return jsonify({"error": "Forbidden."}), 403
            return f(*args, **kwargs)

        return wrapper

    return decorator
