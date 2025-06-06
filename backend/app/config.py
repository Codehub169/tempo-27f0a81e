import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
INSTANCE_FOLDER_PATH = os.path.join(BASE_DIR, '..', 'instance')

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a_very_secret_key_that_should_be_changed'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'another_super_secret_jwt_key'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*') # Default to all origins for development convenience

    # Ensure the instance folder exists. This code runs when the Config class is defined (module import time).
    if not os.path.exists(INSTANCE_FOLDER_PATH):
        try:
            os.makedirs(INSTANCE_FOLDER_PATH, exist_ok=True)
            print(f"INFO: Config: Created instance folder at {INSTANCE_FOLDER_PATH}")
        except OSError as e:
            print(f"CRITICAL: Config: Could not create instance folder at {INSTANCE_FOLDER_PATH}: {e}. SQLite database operations will likely fail.")
            raise OSError(f"Failed to create critical instance folder {INSTANCE_FOLDER_PATH}: {e}") from e

    # Simplified URI determination
    # If DATABASE_URL is provided, use it. Otherwise, use a relative SQLite path
    # which Flask-SQLAlchemy will resolve relative to the instance folder.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///clinic.db')

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'
    # SQLALCHEMY_DATABASE_URI is inherited. If DATABASE_URL is not set, it defaults to 'sqlite:///clinic.db'.
    # For a different development database, set DATABASE_URL or override here:
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL', 'sqlite:///dev_clinic.db')

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
    # It will be 'sqlite:///clinic.db' if DATABASE_URL is not set in the environment.

    # Critical security checks for production:
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
        CORS_ORIGINS = _prod_cors_origins_env

    # Check if using default SQLite in production when DATABASE_URL is not explicitly set
    if not os.environ.get('DATABASE_URL'): # If DATABASE_URL is not set, it's using 'sqlite:///clinic.db' from Config default
        print("WARNING: Production environment is using the default instance-relative SQLite database 'clinic.db' "
              "because DATABASE_URL is not set. Ensure DATABASE_URL environment variable is set for a production-grade database service (e.g., PostgreSQL, MySQL).", flush=True)

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig # Default to Development if FLASK_ENV is not set or invalid
}
