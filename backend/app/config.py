import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# INSTANCE_FOLDER_PATH is relative to this file's directory (app), going up one level (to backend) and then into 'instance'
INSTANCE_FOLDER_PATH = os.path.join(BASE_DIR, '..', 'instance') # Resolves to backend/instance

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a_very_secret_key_that_should_be_changed'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'another_super_secret_jwt_key'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*') # Default to all origins for development convenience

    # Ensure the instance folder exists. This code runs when the Config class is defined (module import time).
    # Flask's app.instance_path will also point to backend/instance if the app root is 'backend'
    # and instance_relative_config=True is used.
    if not os.path.exists(INSTANCE_FOLDER_PATH):
        try:
            os.makedirs(INSTANCE_FOLDER_PATH, exist_ok=True)
            print(f"INFO: Config: Created instance folder at {INSTANCE_FOLDER_PATH}")
        except OSError as e:
            print(f"CRITICAL: Config: Could not create instance folder at {INSTANCE_FOLDER_PATH}: {e}. Default SQLite database operations will likely fail.")
            # Raising error here to fail fast, consistent with app/__init__.py's instance_path creation check.
            raise OSError(f"Failed to create critical instance folder {INSTANCE_FOLDER_PATH}: {e}") from e

    # Simplified SQLALCHEMY_DATABASE_URI determination.
    # If DATABASE_URL is provided, use it. Otherwise, use a relative SQLite path (e.g., 'sqlite:///clinic.db'),
    # which Flask-SQLAlchemy will resolve relative to the Flask application's instance folder 
    # (app.instance_path, typically 'backend/instance/' if app created with instance_relative_config=True).
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///clinic.db')
    if not os.environ.get('DATABASE_URL'): # Log if default is being used
        print(f"INFO: Config: DATABASE_URL not set, defaulting SQLALCHEMY_DATABASE_URI to: {SQLALCHEMY_DATABASE_URI} (will be relative to instance folder)")

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'
    # SQLALCHEMY_DATABASE_URI is inherited from Config.
    # If DATABASE_URL was set in .env, DevelopmentConfig will use it.
    # Otherwise, it uses the 'sqlite:///clinic.db' default from Config, relative to instance folder.

class TestingConfig(Config):
    TESTING = True
    FLASK_ENV = 'testing'
    
    # For testing, often :memory: or a specific test DB file is used.
    # If TEST_DATABASE_URL is 'sqlite:///test_file.db', it becomes instance relative.
    # If TEST_DATABASE_URL is 'sqlite:///:memory:', it's used as is.
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL', 'sqlite:///test_clinic.db')

    JWT_SECRET_KEY = 'test_jwt_secret_key_for_testing_do_not_use_in_prod'
    SECRET_KEY = 'test_secret_key_for_testing_do_not_use_in_prod'

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'
    # SQLALCHEMY_DATABASE_URI is inherited from Config.
    # It will be 'sqlite:///clinic.db' (relative to instance folder) if DATABASE_URL is not set in the environment.

    # Critical security checks for production:
    # These checks are performed when this class is defined (at module import time).
    # They verify if the *currently effective* SECRET_KEY and JWT_SECRET_KEY (from env var or default) are the weak defaults.
    if Config.SECRET_KEY == 'a_very_secret_key_that_should_be_changed':
        print("CRITICAL: Production SECRET_KEY is not set or is using the weak default. Ensure it's set via env var.", flush=True)
        raise ValueError("CRITICAL SECURITY RISK: Production SECRET_KEY is not set or is using the weak default. Set a strong, random SECRET_KEY environment variable.")
    
    if Config.JWT_SECRET_KEY == 'another_super_secret_jwt_key':
        print("CRITICAL: Production JWT_SECRET_KEY is not set or is using the weak default. Ensure it's set via env var.", flush=True)
        raise ValueError("CRITICAL SECURITY RISK: Production JWT_SECRET_KEY is not set or is using the weak default. Set a strong, random JWT_SECRET_KEY environment variable.")
    
    # Override and validate CORS_ORIGINS for production
    _prod_cors_origins_env = os.environ.get('CORS_ORIGINS')
    if not _prod_cors_origins_env or _prod_cors_origins_env == '*':
        print(
            "WARNING: Production CORS_ORIGINS environment variable is not set, is empty, or is set to '*'. "
            "This is insecure for production environments. Defaulting CORS_ORIGINS to an empty list (`[]`), "
            "which will disallow all cross-origin requests. "
            "Please set the CORS_ORIGINS environment variable to a comma-separated list of your specific frontend domain(s).",
            flush=True
        )
        CORS_ORIGINS = []  # Default to empty list, effectively disallowing all CORS requests
    else:
        CORS_ORIGINS = _prod_cors_origins_env # String value, parsed in app/__init__.py by CORS extension

    # Check if using default SQLite in production when DATABASE_URL is not explicitly set.
    if not os.environ.get('DATABASE_URL'): # If DATABASE_URL is not set, Config.SQLALCHEMY_DATABASE_URI defaults to 'sqlite:///clinic.db'
        print("WARNING: Production environment is using the default instance-relative SQLite database ('clinic.db') "
              "because DATABASE_URL is not set. Ensure DATABASE_URL environment variable is set for a production-grade database service (e.g., PostgreSQL, MySQL).", flush=True)

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig # Default to Development if FLASK_ENV is not set or invalid
}
