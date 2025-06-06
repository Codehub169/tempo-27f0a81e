#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e
# Optional: Treat unset variables as an error and fail on pipeline errors.
# set -u
# set -o pipefail

# Frontend setup
echo "Setting up frontend..."
cd frontend
if [ -f "yarn.lock" ]; then
  echo "yarn.lock found. Installing dependencies with Yarn..."
  yarn install --frozen-lockfile
  echo "Building frontend application with Yarn..."
  yarn build
elif [ -f "package-lock.json" ]; then
  echo "package-lock.json found. Installing dependencies with npm ci..."
  npm ci
  echo "Building frontend application with npm..."
  npm run build
else
  echo "No lock file (yarn.lock or package-lock.json) found. Attempting to install with npm install..."
  # This is a fallback, ideally a lock file should exist for reproducible builds.
  npm install
  echo "Building frontend application with npm..."
  npm run build
fi
cd ..

# Backend setup
echo "Setting up backend..."
cd backend

VENV_DIR=".venv"
# Ensure python3 is available
if ! command -v python3 &> /dev/null
then
    echo "python3 could not be found, please install it."
    exit 1
fi

# Use python3 from PATH to create venv, then use venv's executables
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment in $VENV_DIR..."
  python3 -m venv $VENV_DIR
fi

# Define paths to executables within the virtual environment
PYTHON_EXEC="$VENV_DIR/bin/python"
PIP_EXEC="$VENV_DIR/bin/pip"
FLASK_EXEC="$VENV_DIR/bin/flask"

# Activate venv for current script's PATH resolution (optional but can be helpful for some tools)
# However, direct executable paths are more robust for scripting.
# source "$VENV_DIR/bin/activate"

echo "Installing/updating backend dependencies..."
$PIP_EXEC install --upgrade pip
if [ -f "requirements.txt" ]; then
  $PIP_EXEC install -r requirements.txt
else
  echo "Warning: requirements.txt not found. Skipping pip install -r."
fi

# Apply database migrations
# This logic runs inside the 'backend' directory

# Ensure instance directory exists for SQLite, as Flask-Migrate/SQLAlchemy might need it
if [ ! -d "instance" ]; then
    echo "Creating instance directory..."
    mkdir -p instance
fi

if [ ! -d "migrations" ]; then
    echo "Migrations directory not found. Initializing..."
    $FLASK_EXEC db init
    echo "Creating initial migration script..."
    $FLASK_EXEC db migrate -m "Initial migration"
    echo "Applying migrations (creating database tables)..."
    $FLASK_EXEC db upgrade
elif [ ! -f "instance/clinic.db" ]; then
    # Migrations folder exists, but DB file doesn't.
    echo "Database file instance/clinic.db not found, but migrations folder exists. Applying all migrations..."
    $FLASK_EXEC db upgrade
else
    # Both migrations folder and DB file exist.
    echo "Database and migrations folder exist. Checking for model changes and applying any pending migrations..."
    # flask db migrate will create a new revision if models changed since last revision.
    # If no changes, it will report "No changes detected". This is safe.
    $FLASK_EXEC db migrate -m "Automated startup migration check"
    $FLASK_EXEC db upgrade # Applies any pending revisions (newly created or existing unapplied)
fi

# Start the backend server
# The backend will serve the frontend and listen on specified port (default 9000 from run.py)
echo "Starting backend server..."
# FLASK_RUN_PORT is used by run.py. Setting it here ensures it uses 9000 if not overridden elsewhere.
export FLASK_RUN_PORT=9000
$PYTHON_EXEC run.py

# cd .. # Go back to project root if script were to continue; not needed as run.py is the last command.
