from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError
from datetime import datetime, timezone

from ..extensions import db
from ..models import User, OwnerProfile, Supplier
from ..services.google_auth import verify_google_token
from ..services.jwt_service import create_token
from ..decorators import require_auth
from ..schemas.auth import GoogleLoginRequest, OnboardRequest

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/google")
def google_login():
    """Verify a Google ID token, upsert the user, return an app JWT."""
    try:
        body = GoogleLoginRequest.model_validate(request.get_json(silent=True) or {})
    except ValidationError as exc:
        return jsonify({"error": exc.errors()}), 422

    try:
        claims = verify_google_token(body.credential)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 401

    user = User.query.filter_by(google_sub=claims["google_sub"]).first()
    if user is None:
        user = User(
            google_sub=claims["google_sub"],
            email=claims["email"],
            name=claims["name"],
            avatar_url=claims["avatar_url"],
        )
        db.session.add(user)
    else:
        # Keep name and avatar fresh
        user.name = claims["name"]
        user.avatar_url = claims["avatar_url"]
        user.updated_at = datetime.now(timezone.utc)

    db.session.commit()

    token = create_token(str(user.id), user.role)
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.get("/me")
@require_auth
def me():
    """Return the current authenticated user's profile."""
    user = g.current_user
    payload = user.to_dict()

    if user.role == "OWNER" and user.owner_profile:
        payload["profile"] = user.owner_profile.to_dict()
    elif user.role == "SUPPLIER" and user.supplier_profile:
        payload["profile"] = user.supplier_profile.to_dict()

    return jsonify(payload), 200


@auth_bp.post("/onboard")
@require_auth
def onboard():
    """Set the user's role once. Returns 409 if already onboarded."""
    user = g.current_user

    if user.role is not None:
        return jsonify({"error": "Already onboarded."}), 409

    try:
        body = OnboardRequest.model_validate(request.get_json(silent=True) or {})
    except ValidationError as exc:
        return jsonify({"error": exc.errors()}), 422

    user.role = body.role
    user.updated_at = datetime.now(timezone.utc)

    if body.role == "OWNER":
        profile = OwnerProfile(
            user_id=user.id,
            business_name=body.business_name,
        )
        db.session.add(profile)
    else:
        profile = Supplier(
            user_id=user.id,
            company_name=body.company_name,
            location=body.location,
            contact_email=body.contact_email,
            website=body.website,
        )
        db.session.add(profile)

    db.session.commit()

    # Issue a fresh token that now carries the role
    token = create_token(str(user.id), user.role)
    return jsonify({"token": token, "user": user.to_dict()}), 201
