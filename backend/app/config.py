import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
INSTANCE_FOLDER_PATH = os.path.join(BASE_DIR, '..', 'instance') # Path to the instance folder

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a_very_secret_key_that_should_be_changed'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'another_super_secret_jwt_key'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*') # Default to all origins for development
    # Ensure the instance folder exists for SQLite database
    if not os.path.exists(INSTANCE_FOLDER_PATH):
        os.makedirs(INSTANCE_FOLDER_PATH)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(INSTANCE_FOLDER_PATH, 'clinic.db')

class DevelopmentConfig(Config):
    DEBUG = True
    FLASK_ENV = 'development'
    # SQLALCHEMY_ECHO = True # Useful for debugging SQL queries

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'sqlite:///' + os.path.join(INSTANCE_FOLDER_PATH, 'test_clinic.db')
    # In-memory SQLite for faster tests, if preferred:
    # SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_SECRET_KEY = 'test_jwt_secret_key'
    SECRET_KEY = 'test_secret_key'
    # Disable CSRF protection in forms for testing, if applicable
    # WTF_CSRF_ENABLED = False 

class ProductionConfig(Config):
    DEBUG = False
    FLASK_ENV = 'production'
    # Ensure SECRET_KEY and JWT_SECRET_KEY are strong and set via environment variables
    if Config.SECRET_KEY == 'a_very_secret_key_that_should_be_changed':
        raise ValueError("Production SECRET_KEY must be set via environment variable and be strong.")
    if Config.JWT_SECRET_KEY == 'another_super_secret_jwt_key':
        raise ValueError("Production JWT_SECRET_KEY must be set via environment variable and be strong.")

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
