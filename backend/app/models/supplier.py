import uuid
from datetime import datetime, timezone
from ..extensions import db


class Supplier(db.Model):
    __tablename__ = "suppliers"

    id = db.Column(
        db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    company_name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.String(200))
    contact_email = db.Column(db.String(254))
    website = db.Column(db.Text)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", back_populates="supplier_profile")
    coffee_beans = db.relationship(
        "CoffeeBean", back_populates="supplier", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "company_name": self.company_name,
            "description": self.description,
            "location": self.location,
            "contact_email": self.contact_email,
            "website": self.website,
            "created_at": self.created_at.isoformat(),
        }
