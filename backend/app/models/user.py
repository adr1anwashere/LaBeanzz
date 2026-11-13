import uuid
from datetime import datetime, timezone
from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    google_sub = db.Column(db.String(128), unique=True, nullable=False, index=True)
    email = db.Column(db.String(254), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    avatar_url = db.Column(db.Text)
    # "OWNER" | "SUPPLIER" | None (not yet onboarded)
    role = db.Column(db.String(16), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    owner_profile = db.relationship(
        "OwnerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    supplier_profile = db.relationship(
        "Supplier", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "name": self.name,
            "avatar_url": self.avatar_url,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }
