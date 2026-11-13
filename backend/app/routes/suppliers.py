from flask import Blueprint, jsonify
from ..models import Supplier
from ..decorators import require_auth, require_role

suppliers_bp = Blueprint("suppliers", __name__)

PUBLIC_FIELDS = ("id", "business_name", "description", "location", "region", "country", "story", "photo_url", "created_at")


def _public(supplier: Supplier) -> dict:
    """Return only the public-facing fields of a supplier."""
    return {
        "id": str(supplier.id),
        "business_name": supplier.company_name,
        "description": supplier.description,
        "location": supplier.location,
        "created_at": supplier.created_at.isoformat(),
    }


@suppliers_bp.get("/suppliers")
@require_auth
@require_role("OWNER")
def list_suppliers():
    suppliers = Supplier.query.order_by(Supplier.company_name).all()
    return jsonify({"items": [_public(s) for s in suppliers]}), 200


@suppliers_bp.get("/suppliers/<uuid:supplier_id>")
@require_auth
@require_role("OWNER")
def get_supplier(supplier_id):
    supplier = Supplier.query.get(supplier_id)
    if supplier is None:
        return jsonify({"error": "Not found."}), 404
    return jsonify(_public(supplier)), 200
