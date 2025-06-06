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
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*') # Default to all origins for development

    # Ensure the instance folder exists. This code runs when the Config class is defined (module import time).
    if not os.path.exists(INSTANCE_FOLDER_PATH):
        try:
            os.makedirs(INSTANCE_FOLDER_PATH)
            print(f"INFO: Created instance folder at {INSTANCE_FOLDER_PATH}")
        except OSError as e:
            # Log this error or print for critical failure during startup.
            print(f"CRITICAL: Could not create instance folder at {INSTANCE_FOLDER_PATH}: {e}")
            # Depending on the application's reliance on the instance folder (e.g., for SQLite),
            # this could be a fatal error. For now, it prints and continues.

    SQLALCHEMY_DATABASE_URI = _calculate_database_uri(
        'DATABASE_URL', 
        'clinic.db', 
        INSTANCE_FOLDER_PATH
    )

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development' # Used for selecting config, DEBUG controls Flask's debug mode.
    # SQLALCHEMY_ECHO = True # Uncomment for debugging SQL queries

class TestingConfig(Config):
    TESTING = True
    FLASK_ENV = 'testing' # Explicitly set for clarity
    
    SQLALCHEMY_DATABASE_URI = _calculate_database_uri(
        'TEST_DATABASE_URL', 
        'test_clinic.db', 
        INSTANCE_FOLDER_PATH, 
        is_testing_config=True # Allows 'sqlite:///:memory:'
    )

    JWT_SECRET_KEY = 'test_jwt_secret_key_for_testing_do_not_use_in_prod'
    SECRET_KEY = 'test_secret_key_for_testing_do_not_use_in_prod'
    # WTF_CSRF_ENABLED = False # Disable CSRF protection in forms for testing, if applicable

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'

    # Critical security checks: Ensure default weak keys are not used in production.
    # These checks run when the ProductionConfig class is defined.
    # Config.SECRET_KEY would hold the default if the corresponding env var was not set.
    if Config.SECRET_KEY == 'a_very_secret_key_that_should_be_changed':
        raise ValueError("CRITICAL SECURITY RISK: Production SECRET_KEY is not set or is using the weak default. Set a strong, random SECRET_KEY environment variable.")
    
    if Config.JWT_SECRET_KEY == 'another_super_secret_jwt_key':
        raise ValueError("CRITICAL SECURITY RISK: Production JWT_SECRET_KEY is not set or is using the weak default. Set a strong, random JWT_SECRET_KEY environment variable.")
    
    # Note: ProductionConfig inherits SQLALCHEMY_DATABASE_URI from Config.
    # It is crucial that the DATABASE_URL environment variable is set to a robust, 
    # production-grade database URI (e.g., PostgreSQL, MySQL) for a production deployment.
    # An additional check could be added here to warn if still using default SQLite in production:
    # default_prod_db_uri = f'sqlite:///{os.path.join(INSTANCE_FOLDER_PATH, "clinic.db")}'
    # if Config.SQLALCHEMY_DATABASE_URI == default_prod_db_uri and not os.environ.get('DATABASE_URL'):
    #     print("WARNING: Production environment is configured to use the default SQLite database. "
    #           "Ensure DATABASE_URL is set to a production-grade database service.")

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig  # Default to development if FLASK_ENV is not set or invalid
}
