import os
from datetime import timedelta

# print("DEBUG: Loading config.py") # Optional: for very basic module load tracing

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
# INSTANCE_FOLDER_PATH is the absolute path to the 'backend/instance' directory
INSTANCE_FOLDER_PATH = os.path.join(BASE_DIR, '..', 'instance')

# Helper function to determine the database URI
def _calculate_database_uri(env_var_key, default_db_filename, instance_path, is_testing_config=False):
    """Calculates the SQLAlchemy database URI based on environment variables and defaults."""
    env_uri = os.environ.get(env_var_key)
    if env_uri:
        if is_testing_config and env_uri == 'sqlite:///:memory:':
            # Use in-memory SQLite database for testing if specified
            return env_uri
        
        # Check for relative SQLite paths (e.g., sqlite:///mydb.db)
        # These need to be resolved relative to the instance folder.
        if env_uri.startswith('sqlite:///') and not env_uri.startswith('sqlite:////'):
            db_name = env_uri[len('sqlite:///'):]
            if not db_name: # Handle 'sqlite:///' case (empty database name)
                 print(f"ERROR: Invalid relative SQLite URI: {env_uri}. Database name cannot be empty.")
                 raise ValueError(f"Invalid relative SQLite URI: {env_uri}. Database name cannot be empty.")
            abs_db_path = os.path.join(instance_path, db_name)
            return f'sqlite:///{abs_db_path}' # Forms sqlite:////<absolute_path_to_db>
        
        # Handles absolute SQLite paths (e.g., sqlite:////path/to/db) 
        # or other database types (e.g., postgresql://user:pass@host/db)
        return env_uri
    
    # Default to a SQLite file in the instance folder if the environment variable is not set
    abs_db_path = os.path.join(instance_path, default_db_filename)
    return f'sqlite:///{abs_db_path}'

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
    # else:
        # print(f"INFO: Config: Instance folder at {INSTANCE_FOLDER_PATH} already exists.") # Optional: for verbosity

    SQLALCHEMY_DATABASE_URI = _calculate_database_uri(
        'DATABASE_URL', 
        'clinic.db', 
        INSTANCE_FOLDER_PATH
    )
    # print(f"DEBUG: Config.SQLALCHEMY_DATABASE_URI set to: {SQLALCHEMY_DATABASE_URI}")

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development' # FLASK_ENV is a convention; DEBUG is what Flask uses internally.
    # print(f"DEBUG: DevelopmentConfig: SQLALCHEMY_DATABASE_URI is {Config.SQLALCHEMY_DATABASE_URI}")
    # SQLALCHEMY_ECHO = True # Uncomment for debugging SQL queries

class TestingConfig(Config):
    TESTING = True
    FLASK_ENV = 'testing'
    
    SQLALCHEMY_DATABASE_URI = _calculate_database_uri(
        'TEST_DATABASE_URL', 
        'test_clinic.db', # Default test DB filename if TEST_DATABASE_URL not set
        INSTANCE_FOLDER_PATH, 
        is_testing_config=True
    )
    # print(f"DEBUG: TestingConfig.SQLALCHEMY_DATABASE_URI set to: {SQLALCHEMY_DATABASE_URI}")

    JWT_SECRET_KEY = 'test_jwt_secret_key_for_testing_do_not_use_in_prod'
    SECRET_KEY = 'test_secret_key_for_testing_do_not_use_in_prod'
    # WTF_CSRF_ENABLED = False # Disable CSRF protection in forms for testing, if applicable

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'
    # print(f"DEBUG: ProductionConfig: SQLALCHEMY_DATABASE_URI is {Config.SQLALCHEMY_DATABASE_URI}")

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
        CORS_ORIGINS = _prod_cors_origins_env # Expected to be a comma-separated string or a valid single origin
    # print(f"DEBUG: ProductionConfig.CORS_ORIGINS set to: {CORS_ORIGINS}")

    # Check if using default SQLite in production when DATABASE_URL is not explicitly set
    default_sqlite_uri_in_prod = f'sqlite:///{os.path.join(INSTANCE_FOLDER_PATH, "clinic.db")}'
    if Config.SQLALCHEMY_DATABASE_URI == default_sqlite_uri_in_prod and not os.environ.get('DATABASE_URL'):
        print("WARNING: Production environment is using the default SQLite database 'clinic.db' because DATABASE_URL is not set. "
              "Ensure DATABASE_URL environment variable is set to a robust, production-grade database service (e.g., PostgreSQL, MySQL).", flush=True)
        # Consider raising ValueError for stricter policy:
        # raise ValueError("Production environment must use a configured DATABASE_URL for a production-grade database.")

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig # Default to Development if FLASK_ENV is not set or invalid
}

# print(f"DEBUG: config.py loaded. Available configurations: {list(config_by_name.keys())}")