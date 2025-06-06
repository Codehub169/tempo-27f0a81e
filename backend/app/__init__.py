import os
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
jwt = JWTManager()


def create_app(config_name='development'):
    """Application factory function."""
    app = Flask(__name__, instance_relative_config=True)

    # Load configuration
    # Configuration will be loaded from app.config module and instance/config.py if it exists
    # For now, we'll use a basic config class and enhance with app.config module later
    if config_name == 'production':
        app.config.from_object('app.config.ProductionConfig')
    elif config_name == 'testing':
        app.config.from_object('app.config.TestingConfig')
    else:
        app.config.from_object('app.config.DevelopmentConfig') # Default

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass # Already exists
        
    # Initialize Flask extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # CORS configuration
    # Origins can be a list or a string. '*' for all, or specify frontend URL.
    # Example: CORS(app, resources={r"/api/*": {"origins": app.config.get('CORS_ORIGINS', '*')}})
    # For simplicity, initializing with basic CORS, can be refined with specific origins from config
    allowed_origins = app.config.get('CORS_ORIGINS')
    if isinstance(allowed_origins, str):
        allowed_origins = [origin.strip() for origin in allowed_origins.split(',')]
    elif allowed_origins is None:
        allowed_origins = [] # Default to no origins if not set, or '*' for open dev

    CORS(app, resources={r"/api/*": {"origins": allowed_origins if allowed_origins else '*'}}, supports_credentials=True)
    
    jwt.init_app(app)

    # Register Blueprints (example - will be added in subsequent steps)
    # from .routes.auth_routes import auth_bp
    # app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # from .routes.patient_routes import patient_bp
    # app.register_blueprint(patient_bp, url_prefix='/api/patients')

    # A simple route for testing if the app is up
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "message": "Eye Clinic API is running!"}), 200

    with app.app_context():
        # Create database tables if they don't exist
        # This is suitable for development. For production, migrations are preferred.
        # db.create_all() # This will be handled by Flask-Migrate commands typically
        pass 

    return app
