"""
Seed script: creates 3 supplier users + profiles and ~20 coffee beans.

Usage (from backend/):
    python -m scripts.seed

The script is idempotent: re-running skips rows that already exist.
"""

import sys
import os

# Allow running from the backend/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models import User, Supplier, CoffeeBean
import uuid

app = create_app(os.getenv("FLASK_ENV", "development"))

SUPPLIERS = [
    {
        "google_sub": "seed_supplier_01",
        "email": "nusantara@labeans.dev",
        "name": "Nusantara Coffee Co.",
        "profile": {
            "company_name": "Nusantara Coffee Co.",
            "description": "Single-origin coffees from the volcanic highlands of Indonesia.",
            "location": "Bandung, West Java, Indonesia",
        },
    },
    {
        "google_sub": "seed_supplier_02",
        "email": "altura@labeans.dev",
        "name": "Altura Coffee Importers",
        "profile": {
            "company_name": "Altura Coffee Importers",
            "description": "Specialty micro-lots sourced directly from Central and South America.",
            "location": "Bogotá, Colombia",
        },
    },
    {
        "google_sub": "seed_supplier_03",
        "email": "riftvalley@labeans.dev",
        "name": "Rift Valley Traders",
        "profile": {
            "company_name": "Rift Valley Traders",
            "description": "Award-winning African origins — Ethiopia, Kenya, and Rwanda.",
            "location": "Addis Ababa, Ethiopia",
        },
    },
]

# Each bean tuple: (supplier_index, name, origin, region, varietal, processing, roast,
#                   flavor_notes, acidity, body, sweetness, price_usd, stock_kg, story)
BEANS = [
    # ── Nusantara (index 0) ───────────────────────────────────────────────────
    (
        0, "Gayo Aceh Natural", "Indonesia", "Aceh", "Ateng", "Natural",
        "MEDIUM_DARK",
        ["dark chocolate", "brown sugar", "cedar", "tobacco"],
        4.5, 8.5, 6.0, 18.50, 120.0,
        "Grown at 1,400 m in the Gayo highlands, this lot is wet-hulled then sun-dried "
        "for 20 days on raised beds. The result is a heavy-bodied cup that anchors "
        "any espresso blend."
    ),
    (
        0, "Flores Bajawa Washed", "Indonesia", "Flores", "Flores Typica", "Washed",
        "MEDIUM",
        ["milk chocolate", "hazelnut", "mild citrus"],
        5.5, 7.0, 5.5, 16.00, 80.0,
        "From the volcanic plateau of Bajawa, this fully washed lot dries on tiled patios "
        "in the high-altitude breeze, producing a cleaner cup than most Indonesian origins."
    ),
    (
        0, "Toraja Sapan Honey", "Indonesia", "Sulawesi", "Toraja", "Honey",
        "MEDIUM",
        ["stone fruit", "caramel", "mild spice"],
        5.0, 7.5, 6.5, 17.20, 60.0,
        "A honey-processed lot from the Sapan cooperative in the Toraja highlands. "
        "Some mucilage left on the bean gives a stone-fruit sweetness rarely found "
        "in Indonesian coffees."
    ),
    (
        0, "Java Blawan Estate", "Indonesia", "East Java", "Typica", "Wet-hulled",
        "DARK",
        ["dark chocolate", "smoky", "earthy", "low acid"],
        3.0, 9.0, 4.5, 15.00, 200.0,
        "One of the oldest estate coffees in the world, grown at 900 m on the flanks "
        "of Mount Ijen. Its smoky, full-bodied character is a classic base for dark roasts."
    ),
    (
        0, "Sumatra Mandheling", "Indonesia", "North Sumatra", "Typica/Ateng", "Wet-hulled",
        "MEDIUM_DARK",
        ["earthy", "herbs", "dark cocoa", "syrupy"],
        3.5, 9.0, 5.0, 14.80, 150.0,
        "The benchmark Indonesian origin. Wet-hulling gives an unusually low moisture "
        "parchment, allowing a longer, slower dry that develops the herbal earthiness "
        "this region is famous for."
    ),
    (
        0, "Bali Kintamani Natural", "Indonesia", "Bali", "Kintamani", "Natural",
        "MEDIUM",
        ["tropical fruit", "brown sugar", "light citrus"],
        6.0, 6.5, 7.0, 19.00, 40.0,
        "Grown by smallholders around the Kintamani crater lake at 1,500 m. "
        "The cool nights concentrate sugars in the cherry, producing a naturally "
        "fruit-forward cup that works well in filter brewing."
    ),

    # ── Altura (index 1) ──────────────────────────────────────────────────────
    (
        1, "Colombia Huila Washed", "Colombia", "Huila", "Castillo/Caturra", "Washed",
        "MEDIUM_LIGHT",
        ["red apple", "panela", "caramel", "clean finish"],
        7.0, 6.0, 7.0, 21.00, 90.0,
        "A lot from the Acevedo municipality in Huila, grown at 1,750 m by members "
        "of the Asocafe cooperative. High acidity and clean sweetness make it a crowd "
        "favourite in espresso and filter alike."
    ),
    (
        1, "Guatemala Antigua SHB", "Guatemala", "Antigua", "Bourbon/Caturra", "Washed",
        "MEDIUM",
        ["milk chocolate", "brown sugar", "dried citrus peel"],
        6.0, 7.0, 6.0, 17.50, 110.0,
        "Strictly Hard Bean from the volcanic soils of Antigua. The mineral-rich soil "
        "and cool nights develop a balanced chocolate and mild citrus profile that "
        "is forgiving in a wide range of recipes."
    ),
    (
        1, "Brazil Santos Natural", "Brazil", "São Paulo", "Mundo Novo/Catuaí", "Natural",
        "MEDIUM_DARK",
        ["milk chocolate", "peanut brittle", "low acid", "smooth"],
        3.0, 8.0, 7.0, 13.00, 300.0,
        "The workhorse of the espresso blending world. Grown at modest altitude on "
        "flat mechanized farms, this natural lot dries for 30 days in the sun, "
        "concentrating sugar and muting acidity."
    ),
    (
        1, "Peru San Ignacio Washed", "Peru", "Cajamarca", "Caturra/Bourbon", "Washed",
        "LIGHT",
        ["jasmine", "peach", "lime", "honey finish"],
        8.0, 5.0, 7.5, 22.00, 35.0,
        "A micro-lot from the San Ignacio district, grown above 2,000 m. "
        "The high elevation produces an unusually bright acidity and a delicate "
        "floral note rarely seen outside of African origins."
    ),
    (
        1, "Honduras Santa Bárbara Honey", "Honduras", "Santa Bárbara", "Lempira", "Honey",
        "MEDIUM",
        ["peach", "caramel apple", "brown sugar"],
        6.5, 6.5, 7.5, 16.80, 70.0,
        "Grown at 1,600 m on family farms in the Santa Bárbara mountains. "
        "Honey processing leaves a thin layer of sticky mucilage that dries "
        "over 30 days, lending a rounded sweetness to this otherwise bright origin."
    ),
    (
        1, "Mexico Chiapas Washed", "Mexico", "Chiapas", "Typica/Bourbon", "Washed",
        "MEDIUM",
        ["almond", "mild citrus", "gentle sweetness"],
        5.5, 6.0, 5.5, 14.50, 85.0,
        "Grown by smallholders in the Soconusco region of Chiapas, one of Mexico's "
        "highest-elevation coffee areas. A mild, balanced bean that pairs well with "
        "bolder origins in espresso blends."
    ),

    # ── Rift Valley (index 2) ─────────────────────────────────────────────────
    (
        2, "Ethiopia Yirgacheffe G1 Washed", "Ethiopia", "Yirgacheffe", "Ethiopian Heirloom", "Washed",
        "LIGHT",
        ["bergamot", "jasmine", "lemon curd", "peach"],
        9.0, 4.5, 7.5, 24.00, 55.0,
        "The archetype of Ethiopian washed coffee. Grade 1 sorting means every bean "
        "is hand-picked and triple-sorted. The resulting clarity of flavor — bergamot, "
        "jasmine, lemon — is unmatched among African origins."
    ),
    (
        2, "Ethiopia Sidama Natural G1", "Ethiopia", "Sidama", "Ethiopian Heirloom", "Natural",
        "LIGHT",
        ["blueberry", "raspberry", "dark cherry", "wine-like"],
        8.0, 5.5, 8.5, 23.50, 45.0,
        "Natural-processed heirlooms from Bensa, Sidama. Cherries are dried whole "
        "on raised beds for up to 30 days. The wine-like fermentation notes and "
        "intense berry aromatics make this a crowd-stopper in a pourover flight."
    ),
    (
        2, "Kenya Nyeri AA Washed", "Kenya", "Nyeri", "SL28/SL34/Ruiru 11", "Washed",
        "MEDIUM_LIGHT",
        ["blackcurrant", "tomato", "black tea", "bright citrus"],
        9.0, 6.0, 7.0, 26.00, 40.0,
        "Double-washed AA beans from the Othaya Farmers Cooperative in Nyeri. "
        "SL28 varietal imparts the signature blackcurrant and vivid citric brightness "
        "that Kenyan coffee is prized for worldwide."
    ),
    (
        2, "Rwanda Huye Mountain Washed", "Rwanda", "Huye District", "Red Bourbon", "Washed",
        "MEDIUM_LIGHT",
        ["red plum", "hibiscus", "dark chocolate", "clean finish"],
        7.5, 6.0, 7.0, 21.50, 50.0,
        "From the Huye Mountain washing station in Rwanda's south, run by a "
        "women's cooperative. Red Bourbon grown at 1,800 m has a fruit-forward "
        "top note over a dark-chocolate base — complex but balanced."
    ),
    (
        2, "Burundi Kayanza Natural", "Burundi", "Kayanza", "Red Bourbon", "Natural",
        "LIGHT",
        ["strawberry jam", "hibiscus", "vanilla", "creamy"],
        7.0, 5.5, 8.0, 22.00, 30.0,
        "A natural lot from Kayanza province, one of Burundi's highest-growing regions "
        "at 1,900 m. The strawberry and vanilla notes earned this lot a Cup of Excellence "
        "nomination in 2025."
    ),
    (
        2, "Tanzania Peaberry Kilimanjaro", "Tanzania", "Kilimanjaro Region", "Kent", "Washed",
        "MEDIUM",
        ["bright citrus", "milk chocolate", "medium body", "winey finish"],
        7.5, 6.5, 6.5, 19.00, 60.0,
        "Peaberry beans (the single seed that develops when only one ovule is fertilized) "
        "are hand-sorted from the harvest on the southern slopes of Kilimanjaro. "
        "They tend to roast more evenly than flat beans, giving a brighter cup."
    ),
    (
        2, "Ethiopia Guji Natural G1", "Ethiopia", "Guji", "Ethiopian Heirloom", "Natural",
        "MEDIUM_LIGHT",
        ["tropical fruit", "dark berry", "cocoa nib", "honey"],
        7.5, 6.0, 8.5, 25.00, 25.0,
        "A micro-lot from Shakiso woreda in the Guji zone, shade-grown at 2,100 m. "
        "Long cherry drying (35 days) on African beds builds a layered tropical fruit "
        "profile that bridges the gap between bright Ethiopian washed and natural styles."
    ),
]


def seed():
    with app.app_context():
        # Create supplier users and profiles
        created_suppliers: list[Supplier] = []
        for s_data in SUPPLIERS:
            user = User.query.filter_by(google_sub=s_data["google_sub"]).first()
            if user is None:
                user = User(
                    id=uuid.uuid4(),
                    google_sub=s_data["google_sub"],
                    email=s_data["email"],
                    name=s_data["name"],
                    role="SUPPLIER",
                )
                db.session.add(user)
                db.session.flush()  # get user.id before creating profile

            supplier = Supplier.query.filter_by(user_id=user.id).first()
            if supplier is None:
                supplier = Supplier(
                    user_id=user.id,
                    **s_data["profile"],
                )
                db.session.add(supplier)
                db.session.flush()

            created_suppliers.append(supplier)

        db.session.commit()
        print(f"  Seeded {len(created_suppliers)} suppliers.")

        # Create beans
        bean_count = 0
        for entry in BEANS:
            (
                sup_idx, name, origin, region, varietal, processing, roast,
                notes, acidity, body, sweetness, price, stock, story
            ) = entry

            supplier = created_suppliers[sup_idx]
            exists = CoffeeBean.query.filter_by(
                supplier_id=supplier.id, name=name
            ).first()
            if exists:
                continue

            bean = CoffeeBean(
                supplier_id=supplier.id,
                name=name,
                origin=origin,
                region=region,
                varietal=varietal,
                processing_method=processing,
                roast_level=roast,
                flavor_notes=notes,
                acidity=acidity,
                body=body,
                sweetness=sweetness,
                price_per_kg=price,
                stock_kg=stock,
                status="AVAILABLE",
                producer_story=story,
            )
            db.session.add(bean)
            bean_count += 1

        db.session.commit()
        print(f"  Seeded {bean_count} beans.")
        print("Done.")


if __name__ == "__main__":
    seed()
