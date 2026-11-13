from flask import Flask
from .config import config_map
from .extensions import db, migrate, cors


def create_app(env: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_map[env])

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    # Blueprints
    from .routes.health import health_bp
    from .routes.auth import auth_bp
    from .routes.coffee_beans import beans_bp
    from .routes.suppliers import suppliers_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(beans_bp, url_prefix="/api")
    app.register_blueprint(suppliers_bp, url_prefix="/api")

    return app
