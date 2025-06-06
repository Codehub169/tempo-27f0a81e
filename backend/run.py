import os
from dotenv import load_dotenv

# Load environment variables from .env file
# This should be done before importing the app factory if the factory uses env vars at import time
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

from app import create_app

app = create_app(os.getenv('FLASK_ENV') or 'development')

if __name__ == '__main__':
    # The port 5000 is a common default for Flask development.
    # The startup.sh script will handle port mapping to ensure the frontend is accessible on port 9000.
    app.run(host='0.0.0.0', port=int(os.getenv('FLASK_RUN_PORT', 5000)), debug=app.config.get('DEBUG', True))
