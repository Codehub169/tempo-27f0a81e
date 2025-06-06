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
    if not os.path.exists(INSTANCE_FOLDER_PATH):
        try:
            os.makedirs(INSTANCE_FOLDER_PATH, exist_ok=True)
            print(f"INFO: Config: Created instance folder at {INSTANCE_FOLDER_PATH}")
        except OSError as e:
            print(f"CRITICAL: Config: Could not create instance folder at {INSTANCE_FOLDER_PATH}: {e}. Default SQLite database operations will likely fail.")
            raise OSError(f"Failed to create critical instance folder {INSTANCE_FOLDER_PATH}: {e}") from e

    # Determine SQLALCHEMY_DATABASE_URI at class definition time
    _raw_db_url = os.environ.get('DATABASE_URL')
    _db_uri_to_set = "" # Temporary variable to hold the URI before assigning to class attribute
    if _raw_db_url:
        if _raw_db_url.startswith('sqlite:///'):
            filename_part = _raw_db_url[len('sqlite:///'):]
            if filename_part == ':memory:':
                _db_uri_to_set = _raw_db_url
                print(f"INFO: Config: Using in-memory SQLite DATABASE_URL from env: {_db_uri_to_set}")
            # os.path.isabs checks for platform-specific absolute paths (e.g., /foo/bar or C:\\foo\\bar)
            elif os.path.isabs(filename_part):
                _db_uri_to_set = _raw_db_url
                print(f"INFO: Config: Using absolute SQLite DATABASE_URL from env: {_db_uri_to_set}")
            else: # It's a relative filename; make it absolute to the instance folder.
                absolute_db_path = os.path.join(INSTANCE_FOLDER_PATH, filename_part)
                _db_uri_to_set = f"sqlite:///{absolute_db_path}"
                print(f"INFO: Config: Relative SQLite DATABASE_URL '{_raw_db_url}' from env converted to absolute: {_db_uri_to_set}")
        else: # Not a SQLite URL, use as-is (e.g., PostgreSQL, MySQL)
            _db_uri_to_set = _raw_db_url
            print(f"INFO: Config: Using non-SQLite DATABASE_URL from env: {_db_uri_to_set}")
    else: # DATABASE_URL not set, default to an absolute path for SQLite in the instance folder
        default_db_filename = 'clinic.db'
        absolute_db_path = os.path.join(INSTANCE_FOLDER_PATH, default_db_filename)
        _db_uri_to_set = f"sqlite:///{absolute_db_path}"
        print(f"INFO: Config: DATABASE_URL not set, defaulting to absolute SQLite path: {_db_uri_to_set}")
    SQLALCHEMY_DATABASE_URI = _db_uri_to_set


class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'
    # SQLALCHEMY_DATABASE_URI is inherited from Config.
    # DevelopmentConfig will use DATABASE_URL from .env if set, or the default 'sqlite:///clinic.db' in instance folder.

class TestingConfig(Config):
    TESTING = True
    FLASK_ENV = 'testing'
    
    _raw_test_db_url = os.environ.get('TEST_DATABASE_URL', 'sqlite:///test_clinic.db') # Default to relative path
    _testing_db_uri_to_set = "" # Temporary variable for the URI

    if _raw_test_db_url.startswith('sqlite:///'):
        filename_part = _raw_test_db_url[len('sqlite:///'):]
        if filename_part == ':memory:':
            _testing_db_uri_to_set = _raw_test_db_url
            print(f"INFO: TestingConfig: Using in-memory SQLite from TEST_DATABASE_URL: {_testing_db_uri_to_set}")
        elif os.path.isabs(filename_part):
            _testing_db_uri_to_set = _raw_test_db_url
            print(f"INFO: TestingConfig: Using absolute SQLite from TEST_DATABASE_URL: {_testing_db_uri_to_set}")
        else: # Relative filename
            # INSTANCE_FOLDER_PATH is a module-level variable defined above Config class
            absolute_test_db_path = os.path.join(INSTANCE_FOLDER_PATH, filename_part)
            _testing_db_uri_to_set = f"sqlite:///{absolute_test_db_path}"
            print(f"INFO: TestingConfig: Relative SQLite TEST_DATABASE_URL '{_raw_test_db_url}' converted to absolute: {_testing_db_uri_to_set}")
    else: # Non-SQLite URL
         _testing_db_uri_to_set = _raw_test_db_url
         print(f"INFO: TestingConfig: Using non-SQLite TEST_DATABASE_URL from env: {_testing_db_uri_to_set}")
    SQLALCHEMY_DATABASE_URI = _testing_db_uri_to_set

    JWT_SECRET_KEY = 'test_jwt_secret_key_for_testing_do_not_use_in_prod'
    SECRET_KEY = 'test_secret_key_for_testing_do_not_use_in_prod'

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'
    # SQLALCHEMY_DATABASE_URI is inherited from Config.
    # It will be the default 'sqlite:///clinic.db' (in instance folder) if DATABASE_URL is not set in the environment.

    # Critical security checks for production (run at class definition time)
    # These checks refer to the values resolved in the base Config class.
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
        CORS_ORIGINS = []  # Secure default: disallow all CORS requests. App init will parse this.
    else:
        # Pass the string as is; app/__init__.py will parse it into a list if it's comma-separated.
        CORS_ORIGINS = _prod_cors_origins_env

    # Check if using default SQLite in production because DATABASE_URL is not explicitly set.
    if not os.environ.get('DATABASE_URL'): # This implies Config.SQLALCHEMY_DATABASE_URI is the default SQLite path.
        print("WARNING: Production environment is using the default instance-relative SQLite database ('clinic.db') "
              "because DATABASE_URL environment variable is not set. This is not recommended for production. "
              "Ensure DATABASE_URL is set to a production-grade database service (e.g., PostgreSQL, MySQL).", flush=True)

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig # Default to Development if FLASK_ENV is not set or invalid
}
