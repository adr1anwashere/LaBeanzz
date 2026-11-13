from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError
from datetime import datetime, timezone

from ..extensions import db
from ..models import CoffeeBean, Supplier
from ..decorators import require_auth, require_role
from ..schemas.beans import CreateBeanRequest, PatchBeanRequest, BeanFilterParams

beans_bp = Blueprint("beans", __name__)


# ─── Supplier: list own beans ─────────────────────────────────────────────────

@beans_bp.get("/supplier/beans")
@require_auth
@require_role("SUPPLIER")
def supplier_list_beans():
    supplier = g.current_user.supplier_profile
    if supplier is None:
        return jsonify({"error": "Supplier profile not found."}), 404

    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)

    pagination = (
        CoffeeBean.query
        .filter_by(supplier_id=supplier.id)
        .order_by(CoffeeBean.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return jsonify({
        "items": [b.to_dict() for b in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    }), 200


# ─── Supplier: create bean ────────────────────────────────────────────────────

@beans_bp.post("/supplier/beans")
@require_auth
@require_role("SUPPLIER")
def supplier_create_bean():
    supplier = g.current_user.supplier_profile
    if supplier is None:
        return jsonify({"error": "Supplier profile not found."}), 404

    try:
        body = CreateBeanRequest.model_validate(request.get_json(silent=True) or {})
    except ValidationError as exc:
        return jsonify({"error": exc.errors()}), 422

    bean = CoffeeBean(
        supplier_id=supplier.id,
        **body.model_dump(),
    )
    db.session.add(bean)
    db.session.commit()
    return jsonify(bean.to_dict()), 201


# ─── Supplier: get own bean ───────────────────────────────────────────────────

@beans_bp.get("/supplier/beans/<uuid:bean_id>")
@require_auth
@require_role("SUPPLIER")
def supplier_get_bean(bean_id):
    supplier = g.current_user.supplier_profile
    bean = CoffeeBean.query.filter_by(id=bean_id, supplier_id=supplier.id).first()
    if bean is None:
        return jsonify({"error": "Not found."}), 404
    return jsonify(bean.to_dict()), 200


# ─── Supplier: update own bean ────────────────────────────────────────────────

@beans_bp.patch("/supplier/beans/<uuid:bean_id>")
@require_auth
@require_role("SUPPLIER")
def supplier_update_bean(bean_id):
    supplier = g.current_user.supplier_profile
    bean = CoffeeBean.query.filter_by(id=bean_id, supplier_id=supplier.id).first()
    if bean is None:
        return jsonify({"error": "Not found."}), 404

    try:
        body = PatchBeanRequest.model_validate(request.get_json(silent=True) or {})
    except ValidationError as exc:
        return jsonify({"error": exc.errors()}), 422

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(bean, field, value)
    bean.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(bean.to_dict()), 200


# ─── Supplier: delete own bean ────────────────────────────────────────────────

@beans_bp.delete("/supplier/beans/<uuid:bean_id>")
@require_auth
@require_role("SUPPLIER")
def supplier_delete_bean(bean_id):
    supplier = g.current_user.supplier_profile
    bean = CoffeeBean.query.filter_by(id=bean_id, supplier_id=supplier.id).first()
    if bean is None:
        return jsonify({"error": "Not found."}), 404

    db.session.delete(bean)
    db.session.commit()
    return "", 204


# ─── Owner: browse all available beans ───────────────────────────────────────

@beans_bp.get("/coffee-beans")
@require_auth
@require_role("OWNER", "SUPPLIER")
def list_beans():
    try:
        params = BeanFilterParams.model_validate(request.args.to_dict())
    except ValidationError as exc:
        return jsonify({"error": exc.errors()}), 422

    query = CoffeeBean.query

    # Suppliers see only their own beans
    if g.current_user.role == "SUPPLIER":
        supplier = g.current_user.supplier_profile
        if supplier is None:
            return jsonify({"items": [], "total": 0, "page": 1, "pages": 0}), 200
        query = query.filter_by(supplier_id=supplier.id)

    # Filters
    if params.origin:
        query = query.filter(CoffeeBean.origin.ilike(f"%{params.origin}%"))
    if params.roast_level:
        query = query.filter_by(roast_level=params.roast_level)
    if params.status:
        query = query.filter_by(status=params.status)
    if params.max_price:
        query = query.filter(CoffeeBean.price_per_kg <= params.max_price)
    if params.supplier_id:
        query = query.filter_by(supplier_id=params.supplier_id)

    pagination = (
        query
        .order_by(CoffeeBean.created_at.desc())
        .paginate(page=params.page, per_page=params.per_page, error_out=False)
    )
    return jsonify({
        "items": [b.to_dict() for b in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    }), 200


# ─── Owner: single bean detail ────────────────────────────────────────────────

@beans_bp.get("/coffee-beans/<uuid:bean_id>")
@require_auth
@require_role("OWNER", "SUPPLIER")
def get_bean(bean_id):
    if g.current_user.role == "SUPPLIER":
        supplier = g.current_user.supplier_profile
        bean = CoffeeBean.query.filter_by(id=bean_id, supplier_id=supplier.id).first()
    else:
        bean = CoffeeBean.query.get(bean_id)

    if bean is None:
        return jsonify({"error": "Not found."}), 404
    return jsonify(bean.to_dict()), 200
