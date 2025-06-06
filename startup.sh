#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e
# Optional: Treat unset variables as an error and fail on pipeline errors.
# set -u
# set -o pipefail

echo "--- Frontend Setup ---"
cd frontend
if [ -f "yarn.lock" ]; then
  echo "yarn.lock found. Installing dependencies with Yarn..."
  yarn install --frozen-lockfile
  echo "Building frontend application with Yarn..."
  yarn build
elif [ -f "package-lock.json" ]; then
  echo "package-lock.json found. Installing dependencies with npm..."
  # Using npm install for flexibility in dev; for strict CI, npm ci would be better.
  npm install 
  echo "Building frontend application with npm..."
  npm run build
else
  echo "No lock file (yarn.lock or package-lock.json) found."
  echo "Attempting to install dependencies with npm install..."
  # This is a fallback, ideally a lock file should exist for reproducible builds.
  npm install
  echo "Building frontend application with npm..."
  npm run build
fi
cd ..
echo "--- Frontend Setup Complete ---"
echo ""

echo "--- Backend Setup ---"
cd backend

# Create a default .env file if it doesn't exist, configured for development
if [ ! -f ".env" ]; then
  echo "INFO: .env file not found. Creating a default .env file for development."
  cat << EOF > .env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY='your_super_secret_key_for_flask_sessions_and_csrf'
JWT_SECRET_KEY='your_super_secret_key_for_jwt_signing'
DATABASE_URL='sqlite:///instance/clinic.db'
CORS_ORIGINS='*'
EOF
fi

VENV_DIR=".venv"
# Ensure python3 is available
if ! command -v python3 &> /dev/null
then
    echo "ERROR: python3 could not be found. Please install python3."
    exit 1
fi

# Use python3 from PATH to create venv, then use venv's executables
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating Python virtual environment in $VENV_DIR..."
  python3 -m venv "$VENV_DIR"
fi

# Define paths to executables within the virtual environment
# These paths are relative to the 'backend' directory
PYTHON_EXEC="$VENV_DIR/bin/python"
PIP_EXEC="$VENV_DIR/bin/pip"
FLASK_EXEC="$VENV_DIR/bin/flask"

# Activate venv for current script's PATH resolution (optional but can be helpful for some tools)
# However, direct executable paths are more robust for scripting.
# source "$VENV_DIR/bin/activate"

echo "Upgrading pip..."
"$PIP_EXEC" install --upgrade pip
echo "Installing backend dependencies from requirements.txt..."
if [ -f "requirements.txt" ]; then
  "$PIP_EXEC" install -r requirements.txt
else
  echo "WARNING: requirements.txt not found. Skipping pip install -r."
fi

echo "Applying database migrations..."
# This logic runs inside the 'backend' directory

# Ensure instance directory exists for SQLite, as Flask-Migrate/SQLAlchemy might need it
# The instance folder is typically at the same level as the 'app' package, inside 'backend'
# Python code in config.py and app/__init__.py also handles instance folder creation,
# but this ensures it exists before flask db commands are run.
if [ ! -d "instance" ]; then
    echo "Creating instance directory for database..."
    mkdir -p instance
fi

# Check and manage database migrations
# FLASK_APP environment variable (e.g., FLASK_APP=run.py from .env) is used by 'flask db' commands.
# run.py loads .env, so Flask CLI should pick it up.
if [ ! -d "migrations" ]; then
    echo "Migrations directory not found. Initializing Flask-Migrate..."
    "$FLASK_EXEC" db init
    echo "Creating initial migration script (based on current models)..."
    "$FLASK_EXEC" db migrate -m "Initial database setup"
    echo "Applying migrations (creating database tables)..."
    "$FLASK_EXEC" db upgrade
elif [ -d "migrations" ] && [ ! -f "instance/clinic.db" ]; then
    # Migrations folder exists, but DB file doesn't (e.g., clean environment with existing migration scripts).
    echo "Database file instance/clinic.db not found, but migrations folder exists."
    echo "Applying all existing migrations..."
    "$FLASK_EXEC" db upgrade
else
    # Both migrations folder and DB file exist.
    echo "Database and migrations folder exist."
    echo "Checking for model changes and creating new migration if needed..."
    # This command will only create a new migration file if changes are detected.
    # It's safe to run even if there are no changes.
    "$FLASK_EXEC" db migrate -m "Automated startup migration check"
    echo "Applying any pending migrations..."
    "$FLASK_EXEC" db upgrade # Applies newly created or any existing unapplied revisions
fi
echo "Database migrations complete."

# Start the backend server
# The backend will serve the frontend and listen on specified port (default 9000 from run.py)
echo "Starting backend Flask server..."
# FLASK_RUN_PORT is used by run.py. Setting it here ensures it uses 9000 if not overridden elsewhere.
export FLASK_RUN_PORT=9000 
# FLASK_ENV is typically set in .env; ensure it's 'development' or 'production' as needed.
# Example: export FLASK_ENV=development (though run.py also handles default if .env is missing or FLASK_ENV is not in it)
echo "Backend will run on host 0.0.0.0, port $FLASK_RUN_PORT (check run.py output for actual effective settings)"
"$PYTHON_EXEC" run.py

# cd .. # Go back to project root if script were to continue; not needed as run.py is the last command.
echo "--- Backend Startup Complete ---"
