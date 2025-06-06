import os
import pathlib
from datetime import timedelta

# Base directory of the 'app' package
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# Path to the 'instance' folder, relative to this file's directory (app),
# going up one level (to backend) and then into 'instance'.
# Resolves to backend/instance
INSTANCE_FOLDER_PATH = os.path.join(BASE_DIR, '..', 'instance')
INSTANCE_FOLDER_NAME = os.path.basename(INSTANCE_FOLDER_PATH)


def _resolve_sqlite_uri(raw_uri: str, instance_path: str, instance_name: str, log_prefix: str) -> str:
    """
    Resolves a raw SQLite URI to an absolute, POSIX-style URI.
    Handles :memory:, absolute paths, and relative paths.
    Relative paths can be:
    1. Relative to instance_path (e.g., "sqlite:///mydb.db")
    2. Specifying instance_name (e.g., "sqlite:///instance/mydb.db"),
       making it relative to parent of instance_path.
    """
    if not raw_uri.startswith('sqlite:///'):
        print(f"INFO: {log_prefix}: Using non-SQLite URI from env: {raw_uri}")
        return raw_uri

    filename_part = raw_uri[len('sqlite:///'):]

    if filename_part == ':memory:':
        print(f"INFO: {log_prefix}: Using in-memory SQLite URI: {raw_uri}")
        return raw_uri

    # Normalize the path part (e.g. remove '.', handle '..')
    normalized_filename_part = os.path.normpath(filename_part)

    if os.path.isabs(normalized_filename_part):
        # Path is already absolute. Resolve and ensure POSIX format.
        absolute_posix_path = pathlib.Path(normalized_filename_part).resolve().as_posix()
        resolved_uri = f"sqlite:///{absolute_posix_path}"
        print(f"INFO: {log_prefix}: Using absolute SQLite URI '{raw_uri}' resolved to: {resolved_uri}")
        return resolved_uri
    else:  # Path is relative
        log_msg_detail = ""
        if normalized_filename_part.startswith(instance_name + os.sep):
            # Path like 'instance/mydb.db'. Base is parent of instance_path.
            # e.g. instance_path = /app/backend/instance, normalized_filename_part = instance/foo.db
            #      base_path = /app/backend
            #      path_to_join = instance/foo.db
            #      Result: /app/backend/instance/foo.db
            base_path = os.path.dirname(instance_path)
            path_to_join = normalized_filename_part
            log_msg_detail = " (specifies instance folder)"
        else:
            # Path like 'mydb.db'. Base is instance_path itself.
            # e.g. instance_path = /app/backend/instance, normalized_filename_part = foo.db
            #      base_path = /app/backend/instance
            #      path_to_join = foo.db
            #      Result: /app/backend/instance/foo.db
            base_path = instance_path
            path_to_join = normalized_filename_part
            log_msg_detail = " (inside instance folder)"

        absolute_db_path = os.path.join(base_path, path_to_join)
        absolute_posix_path = pathlib.Path(absolute_db_path).resolve().as_posix()
        resolved_uri = f"sqlite:///{absolute_posix_path}"
        print(f"INFO: {log_prefix}: Relative SQLite URI '{raw_uri}' converted to absolute{log_msg_detail}: {resolved_uri}")
        return resolved_uri


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
            print(f"CRITICAL: Config: Could not create instance folder at {INSTANCE_FOLDER_PATH}: {e}. "
                  f"Default SQLite database operations will likely fail.", flush=True)
            raise # Re-raise the original exception to halt startup if critical folder creation fails

    # Determine SQLALCHEMY_DATABASE_URI
    _raw_db_url_env = os.environ.get('DATABASE_URL')
    if _raw_db_url_env:
        SQLALCHEMY_DATABASE_URI = _resolve_sqlite_uri(
            _raw_db_url_env, INSTANCE_FOLDER_PATH, INSTANCE_FOLDER_NAME, "Config"
        )
    else: # DATABASE_URL not set, default to 'sqlite:///clinic.db' (relative to instance folder)
        _default_raw_uri = 'sqlite:///clinic.db'
        SQLALCHEMY_DATABASE_URI = _resolve_sqlite_uri(
            _default_raw_uri, INSTANCE_FOLDER_PATH, INSTANCE_FOLDER_NAME, "Config (default)"
        )


class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'
    # SQLALCHEMY_DATABASE_URI is inherited from Config and resolved there.


class TestingConfig(Config):
    TESTING = True
    FLASK_ENV = 'testing'
    
    _raw_test_db_url_env = os.environ.get('TEST_DATABASE_URL')
    if _raw_test_db_url_env:
        SQLALCHEMY_DATABASE_URI = _resolve_sqlite_uri(
            _raw_test_db_url_env, INSTANCE_FOLDER_PATH, INSTANCE_FOLDER_NAME, "TestingConfig"
        )
    else: # TEST_DATABASE_URL not set, default to 'sqlite:///test_clinic.db'
        _default_raw_uri_testing = 'sqlite:///test_clinic.db'
        SQLALCHEMY_DATABASE_URI = _resolve_sqlite_uri(
            _default_raw_uri_testing, INSTANCE_FOLDER_PATH, INSTANCE_FOLDER_NAME, "TestingConfig (default)"
        )

    JWT_SECRET_KEY = 'test_jwt_secret_key_for_testing_do_not_use_in_prod'
    SECRET_KEY = 'test_secret_key_for_testing_do_not_use_in_prod'


class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'

    # Critical security checks for production (run at class definition time)
    if Config.SECRET_KEY == 'a_very_secret_key_that_should_be_changed':
        print("CRITICAL: Production SECRET_KEY is not set or is using the weak default. "
              "Ensure it's set via env var.", flush=True)
        raise ValueError("CRITICAL SECURITY RISK: Production SECRET_KEY is not set or is using the weak default. "
                         "Set a strong, random SECRET_KEY environment variable.")
    
    if Config.JWT_SECRET_KEY == 'another_super_secret_jwt_key':
        print("CRITICAL: Production JWT_SECRET_KEY is not set or is using the weak default. "
              "Ensure it's set via env var.", flush=True)
        raise ValueError("CRITICAL SECURITY RISK: Production JWT_SECRET_KEY is not set or is using the weak default. "
                         "Set a strong, random JWT_SECRET_KEY environment variable.")
    
    _prod_cors_origins_env = os.environ.get('CORS_ORIGINS')
    if not _prod_cors_origins_env or _prod_cors_origins_env == '*':
        print(
            "WARNING: Production CORS_ORIGINS environment variable is not set, is empty, or is set to '*'. "
            "This is insecure for production environments. Defaulting CORS_ORIGINS to an empty list (`[]`), "
            "which will disallow all cross-origin requests. "
            "Please set the CORS_ORIGINS environment variable to a comma-separated list of "
            "your specific frontend domain(s).",
            flush=True
        )
        CORS_ORIGINS = []  # Override Config.CORS_ORIGINS for production if insecure
    else:
        # If CORS_ORIGINS is set (and not '*'), use it. It might be a list or comma-separated string.
        # The app factory (__init__.py) handles parsing this into a list for Flask-CORS.
        CORS_ORIGINS = _prod_cors_origins_env 

    # Check if DATABASE_URL is set for production. If not, it uses the default SQLite from Config.
    if not os.environ.get('DATABASE_URL'):
        print("WARNING: Production environment is using the default instance-relative SQLite database ('clinic.db') "
              "because DATABASE_URL environment variable is not set. This is not recommended for production. "
              "Ensure DATABASE_URL is set to a production-grade database service (e.g., PostgreSQL, MySQL).", flush=True)
    # SQLALCHEMY_DATABASE_URI for production will be resolved based on DATABASE_URL (or default) by Config's logic.


config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig # Default config if FLASK_ENV is not set or invalid
}
