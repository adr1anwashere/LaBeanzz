import uuid
from datetime import datetime, timezone
from ..extensions import db


class OwnerProfile(db.Model):
    __tablename__ = "owner_profiles"

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
    business_name = db.Column(db.String(200))
    # JSON blob for phase-5 taste adjustments
    taste_adjustments = db.Column(db.JSON, nullable=False, default=dict)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", back_populates="owner_profile")

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "business_name": self.business_name,
            "taste_adjustments": self.taste_adjustments,
            "created_at": self.created_at.isoformat(),
        }
