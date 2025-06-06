import os
from flask import Flask, jsonify, send_from_directory
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .database import db 
from .config import config_by_name # Import config dictionary

migrate = Migrate()
jwt = JWTManager()
# BLOCKLIST will be imported after auth_routes to avoid premature import issues if any
# It's defined in auth_routes.py

def create_app(config_name='development'):
    """Application factory function."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    frontend_build_path = os.path.join(project_root, 'frontend', 'build')
    
    app = Flask(__name__, 
                instance_relative_config=True, 
                static_folder=os.path.join(frontend_build_path, 'static'))

    # Load configuration from config.py based on config_name
    # Fallback to 'default' config (DevelopmentConfig) if config_name is invalid
    actual_config = config_by_name.get(config_name, config_by_name['default'])
    app.config.from_object(actual_config)

    try:
        # Ensure instance folder exists (for SQLite DB, logs, etc.)
        # app.instance_path is determined by Flask based on instance_relative_config=True
        # and the application root path.
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError as e:
        app.logger.error(f"CRITICAL OS ERROR creating instance path {app.instance_path}: {e}. SQLite database operations will likely fail.")
        raise OSError(f"Failed to create critical instance path {app.instance_path}: {e}") from e
        
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Configure CORS
    # The CORS_ORIGINS value is validated in ProductionConfig for security.
    allowed_origins_config = app.config.get('CORS_ORIGINS') # This will be a string or list from config
    final_origins_setting = [] 

    if isinstance(allowed_origins_config, str):
        if allowed_origins_config == '*':
            # In production, ProductionConfig should prevent '*' unless explicitly intended and configured.
            # For development, '*' is common.
            final_origins_setting = '*' 
        else:
            # Parse comma-separated string into a list
            origins_list = [origin.strip() for origin in allowed_origins_config.split(',') if origin.strip()]
            if origins_list:
                final_origins_setting = origins_list
    elif isinstance(allowed_origins_config, list):
        # If config already provides a list (less common for env var based config but possible)
        final_origins_setting = allowed_origins_config
    
    # This fallback to '*' for debug mode if final_origins_setting is empty 
    # is generally safe IF ProductionConfig ensures CORS_ORIGINS is always set appropriately.
    # If CORS_ORIGINS was an empty string/list from config (and not debug mode), final_origins_setting remains [], restricting CORS.
    if not final_origins_setting and app.debug:
        final_origins_setting = '*'
    
    CORS(app, resources={r"/api/*": {"origins": final_origins_setting}}, supports_credentials=True)
    
    jwt.init_app(app)

    from .routes.auth_routes import BLOCKLIST 

    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_payload):
        jti = jwt_payload['jti']
        return jti in BLOCKLIST

    # Register Blueprints for API
    from .routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    from .routes.patient_routes import patient_bp
    app.register_blueprint(patient_bp, url_prefix='/api/patients')

    from .routes.doctor_routes import doctor_bp
    app.register_blueprint(doctor_bp, url_prefix='/api/doctors')

    from .routes.appointment_routes import appointment_bp
    app.register_blueprint(appointment_bp, url_prefix='/api/appointments')

    from .routes.inventory_routes import inventory_bp
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')

    from .routes.billing_routes import billing_bp
    app.register_blueprint(billing_bp, url_prefix='/api/bills')

    from .routes.report_routes import report_bp
    app.register_blueprint(report_bp, url_prefix='/api/reports')

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "message": "Eye Clinic API is running!"}), 200

    # Serve React App (SPA)
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        # Check if path is for a file in the static assets directory (e.g., /static/js/main.chunk.js)
        # app.static_folder is frontend/build/static
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        # Check if path is for a file in the build root (e.g., /manifest.json, /favicon.ico)
        # frontend_build_path is frontend/build
        elif path != "" and os.path.exists(os.path.join(frontend_build_path, path)):
            return send_from_directory(frontend_build_path, path)
        # Otherwise, serve the main index.html for SPA routing
        else:
            index_html_path = os.path.join(frontend_build_path, 'index.html')
            if os.path.exists(index_html_path):
                return send_from_directory(frontend_build_path, 'index.html')
            else:
                app.logger.error(f"Frontend index.html not found at {index_html_path}")
                return jsonify({"error": "Frontend not found. Ensure the frontend application is built correctly."}), 404

    return app
