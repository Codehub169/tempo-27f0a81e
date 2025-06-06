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
raw_flask_env = os.getenv('FLASK_ENV')
# Default to 'development' if FLASK_ENV is None or an empty string
config_name_candidate = raw_flask_env.lower() if raw_flask_env else 'development'

if config_name_candidate not in ['development', 'production', 'testing']:
    actual_env_val_for_msg = f"'{raw_flask_env}'" if raw_flask_env else "not set/empty"
    print(f"Warning: Invalid or unsupported FLASK_ENV value ({actual_env_val_for_msg}). Defaulting to 'development'.")
    config_name = 'development' 
else:
    config_name = config_name_candidate

app = create_app(config_name)

if __name__ == '__main__':
    # Ensure the port is 9000 as per startup.sh and project requirements,
    # or from FLASK_RUN_PORT env var.
    default_port = 9000
    try:
        # Get FLASK_RUN_PORT from env, defaulting to default_port (as a string) if not set or empty
        port_str_from_env = os.getenv('FLASK_RUN_PORT')
        if port_str_from_env: # If FLASK_RUN_PORT is set and not empty
            port = int(port_str_from_env)
        else: # If FLASK_RUN_PORT is not set or is empty string
            port = default_port
    except ValueError:
        # This catches if port_str_from_env was not a valid integer
        env_port_val = os.getenv('FLASK_RUN_PORT') # Get original problematic value for message
        print(f"Warning: Invalid FLASK_RUN_PORT value: '{env_port_val}'. Must be an integer. Defaulting to {default_port}.")
        port = default_port

    # Debug mode is controlled by the application's configuration (e.g., DevelopmentConfig.DEBUG).
    # app.config['DEBUG'] should be reliably set by the loaded configuration object.
    # The fallback in get() is a safety measure, ensuring debug is True for 'development' if not explicitly set.
    debug_mode = app.config.get('DEBUG', True if config_name == 'development' else False)
    
    print(f"--- Starting Flask Development Server ---")
    print(f"Configuration: {config_name}")
    print(f"Listening on: http://0.0.0.0:{port}")
    print(f"Debug mode: {'on' if debug_mode else 'off'}")

    if config_name == 'production' and debug_mode:
         print(f"CRITICAL WARNING: Running with 'production' config but debug mode is ON. THIS IS INSECURE. Check FLASK_ENV and config.py.")
    elif config_name == 'development' and not debug_mode and os.getenv('FLASK_ENV') == 'development':
        # Only warn if FLASK_ENV was explicitly 'development' but debug is still off
        print(f"Warning: Running with 'development' config but debug mode is OFF. Check config.py.")

    app.run(host='0.0.0.0', port=port, debug=debug_mode)
