import uuid
from datetime import datetime, timezone
from ..extensions import db


class CoffeeBean(db.Model):
    __tablename__ = "coffee_beans"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(200), nullable=False)
    origin = db.Column(db.String(100), nullable=False)   # country
    region = db.Column(db.String(100))
    farm = db.Column(db.String(200))
    producer = db.Column(db.String(200))
    varietal = db.Column(db.String(100))
    altitude_m = db.Column(db.Integer)
    processing_method = db.Column(db.String(100))
    roast_level = db.Column(db.String(20), nullable=False)  # LIGHT … DARK
    flavor_notes = db.Column(db.ARRAY(db.Text), nullable=False, server_default="{}")
    # 0.0 – 10.0 numeric ratings
    acidity = db.Column(db.Numeric(3, 1), nullable=False)
    body = db.Column(db.Numeric(3, 1), nullable=False)
    sweetness = db.Column(db.Numeric(3, 1), nullable=False)
    price_per_kg = db.Column(db.Numeric(12, 2), nullable=False)
    stock_kg = db.Column(db.Numeric(10, 2), nullable=False, server_default="0")
    # AVAILABLE | LOW_STOCK | RESERVED | OUT_OF_STOCK
    status = db.Column(db.String(20), nullable=False, server_default="AVAILABLE")
    producer_story = db.Column(db.Text)
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    supplier = db.relationship("Supplier", back_populates="coffee_beans")

    def to_dict(self, public: bool = True):
        return {
            "id": str(self.id),
            "supplier_id": str(self.supplier_id),
            "name": self.name,
            "origin": self.origin,
            "region": self.region,
            "farm": self.farm,
            "producer": self.producer,
            "varietal": self.varietal,
            "altitude_m": self.altitude_m,
            "processing_method": self.processing_method,
            "roast_level": self.roast_level,
            "flavor_notes": self.flavor_notes or [],
            "acidity": float(self.acidity),
            "body": float(self.body),
            "sweetness": float(self.sweetness),
            "price_per_kg": float(self.price_per_kg),
            "stock_kg": float(self.stock_kg),
            "status": self.status,
            "producer_story": self.producer_story,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
