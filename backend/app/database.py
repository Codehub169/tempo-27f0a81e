from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy extension
# This instance will be further configured and registered with the Flask app
# in the app factory (app/__init__.py).
db = SQLAlchemy()
