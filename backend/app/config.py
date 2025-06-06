import os
from datetime import timedelta

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
            # It's assumed db_name will be a valid filename part if this pattern matches.
            # e.g., for 'sqlite:///clinic.db', db_name is 'clinic.db'.
            # An empty db_name (from 'sqlite:///') would be problematic but is an invalid URI for a file DB.
            if not db_name: # Handle 'sqlite:///' case specifically if it could occur and be invalid
                 raise ValueError(f"Invalid relative SQLite URI: {env_uri}. Database name cannot be empty.")
            return f'sqlite:///{os.path.join(instance_path, db_name)}'
        
        # Handles absolute SQLite paths (e.g., sqlite:////path/to/db) 
        # or other database types (e.g., postgresql://user:pass@host/db)
        return env_uri
    
    # Default to a SQLite file in the instance folder if the environment variable is not set
    return f'sqlite:///{os.path.join(instance_path, default_db_filename)}'

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
            print(f"INFO: Created instance folder at {INSTANCE_FOLDER_PATH}")
        except OSError as e:
            print(f"CRITICAL OS ERROR: Could not create instance folder at {INSTANCE_FOLDER_PATH}: {e}. SQLite database operations will likely fail.")
            raise OSError(f"Failed to create critical instance folder {INSTANCE_FOLDER_PATH}: {e}") from e

    SQLALCHEMY_DATABASE_URI = _calculate_database_uri(
        'DATABASE_URL', 
        'clinic.db', 
        INSTANCE_FOLDER_PATH
    )

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'
    # SQLALCHEMY_ECHO = True # Uncomment for debugging SQL queries

class TestingConfig(Config):
    TESTING = True
    FLASK_ENV = 'testing'
    
    SQLALCHEMY_DATABASE_URI = _calculate_database_uri(
        'TEST_DATABASE_URL', 
        'test_clinic.db', 
        INSTANCE_FOLDER_PATH, 
        is_testing_config=True
    )

    JWT_SECRET_KEY = 'test_jwt_secret_key_for_testing_do_not_use_in_prod'
    SECRET_KEY = 'test_secret_key_for_testing_do_not_use_in_prod'
    # WTF_CSRF_ENABLED = False # Disable CSRF protection in forms for testing, if applicable

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'

    if Config.SECRET_KEY == 'a_very_secret_key_that_should_be_changed':
        raise ValueError("CRITICAL SECURITY RISK: Production SECRET_KEY is not set or is using the weak default. Set a strong, random SECRET_KEY environment variable.")
    
    if Config.JWT_SECRET_KEY == 'another_super_secret_jwt_key':
        raise ValueError("CRITICAL SECURITY RISK: Production JWT_SECRET_KEY is not set or is using the weak default. Set a strong, random JWT_SECRET_KEY environment variable.")
    
    # Override and validate CORS_ORIGINS for production
    _prod_cors_origins_env = os.environ.get('CORS_ORIGINS')
    if not _prod_cors_origins_env or _prod_cors_origins_env == '*':
        # Production should have specific origins defined. Allowing '*' is a high risk.
        # If this service is truly public and needs to allow '*', this check should be reconsidered or made configurable.
        # For most web applications, specific frontend domains should be listed.
        raise ValueError(
            "CRITICAL SECURITY RISK: Production CORS_ORIGINS environment variable is not set to specific domains, or is set to '*'. "
            "Set CORS_ORIGINS to a comma-separated list of your frontend domain(s)."
        )
    CORS_ORIGINS = _prod_cors_origins_env # Use the validated environment variable value

    # Check if using default SQLite in production if DATABASE_URL is not explicitly set
    # This check relies on how _calculate_database_uri constructs the default URI.
    default_sqlite_uri_in_prod = f'sqlite:///{os.path.join(INSTANCE_FOLDER_PATH, "clinic.db")}'
    current_db_uri = Config.SQLALCHEMY_DATABASE_URI # Inherited and potentially from DATABASE_URL env var
    if current_db_uri == default_sqlite_uri_in_prod and not os.environ.get('DATABASE_URL'):
        # This means SQLALCHEMY_DATABASE_URI fell back to the default SQLite path, 
        # and DATABASE_URL was not set to override it.
        print("CRITICAL WARNING: Production environment is using the default SQLite database. "
              "Ensure DATABASE_URL environment variable is set to a robust, production-grade database service (e.g., PostgreSQL, MySQL).", flush=True)
        # Depending on policy, you might want to raise an error here to prevent startup with SQLite in prod.
        # raise ValueError("Production environment must use a configured DATABASE_URL for a production-grade database.")

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
