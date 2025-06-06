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
    # Correct path for frontend build directory, assuming 'backend' and 'frontend' are siblings
    # __file__ is backend/app/__init__.py
    # os.path.dirname(__file__) is backend/app
    # '..' -> backend
    # '..' -> project_root
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    frontend_build_path = os.path.join(project_root, 'frontend', 'build')
    
    app = Flask(__name__, 
                instance_relative_config=True, 
                static_folder=os.path.join(frontend_build_path, 'static'))

    # Load configuration from config.py based on config_name
    app.config.from_object(config_by_name.get(config_name, config_by_name['default']))

    try:
        # Ensure instance folder exists (for SQLite DB, logs, etc.)
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError as e:
        # Log this instead of just passing if it's a real issue
        app.logger.error(f"Error creating instance path {app.instance_path}: {e}")
        pass 
        
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Configure CORS
    allowed_origins_str = app.config.get('CORS_ORIGINS')
    final_origins_setting = [] 

    if isinstance(allowed_origins_str, str):
        if allowed_origins_str == '*':
            final_origins_setting = '*' 
        else:
            origins_list = [origin.strip() for origin in allowed_origins_str.split(',') if origin.strip()]
            if origins_list:
                final_origins_setting = origins_list
    elif isinstance(allowed_origins_str, list):
        final_origins_setting = allowed_origins_str
    
    # If CORS_ORIGINS is not set and in debug mode, default to '*' for convenience.
    # Otherwise, if not set, it defaults to an empty list (no CORS access unless specified).
    if not final_origins_setting and app.debug:
        final_origins_setting = '*'
    
    # Flask-CORS handles the case where origins='*' and supports_credentials=True
    # by reflecting the request's Origin header.
    CORS(app, resources={r"/api/*": {"origins": final_origins_setting}}, supports_credentials=True)
    
    jwt.init_app(app)

    # Import BLOCKLIST here after jwt is initialized and other core app setup is done.
    # This helps avoid circular dependencies if auth_routes needs app context or other extensions.
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
    # This should be registered after all API blueprints to act as a catch-all for frontend routes.
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        # Check if path is for a file in the static assets directory (e.g., /static/js/main.chunk.js)
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        # Check if path is for a file in the build root (e.g., /manifest.json, /favicon.ico)
        elif path != "" and os.path.exists(os.path.join(frontend_build_path, path)):
            return send_from_directory(frontend_build_path, path)
        # Otherwise, serve the main index.html for SPA routing
        else:
            index_html_path = os.path.join(frontend_build_path, 'index.html')
            if os.path.exists(index_html_path):
                return send_from_directory(frontend_build_path, 'index.html')
            else:
                # Fallback if index.html is somehow missing
                return jsonify({"error": "Frontend not found. Build the frontend application."}), 404

    return app
