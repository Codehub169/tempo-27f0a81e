import os
from dotenv import load_dotenv

# Load environment variables from .env file
# This should be done before importing the app factory if the factory uses env vars at import time
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

from app import create_app

# Determine the configuration name from FLASK_ENV or default to 'development'
# create_app expects 'development', 'production', or 'testing'
config_name = os.getenv('FLASK_ENV', 'development').lower()
if config_name not in ['development', 'production', 'testing']:
    config_name = 'development' # Fallback to development for unknown FLASK_ENV values

app = create_app(config_name)

if __name__ == '__main__':
    # Ensure the port is 9000 as per requirements, or from FLASK_RUN_PORT env var.
    # The backend will serve the frontend from this port.
    try:
        port = int(os.getenv('FLASK_RUN_PORT', 9000))
    except ValueError:
        print("Warning: Invalid FLASK_RUN_PORT value. Defaulting to 9000.")
        port = 9000

    # Debug mode is controlled by the application's configuration (e.g., DevelopmentConfig.DEBUG)
    # Default to True if not set in config, which is typical for development.
    debug_mode = app.config.get('DEBUG', True)
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
