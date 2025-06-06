from flask_jwt_extended import get_jwt_identity
from .models import User

def is_admin():
    """Checks if the current JWT identity corresponds to an admin user."""
    current_user_id = get_jwt_identity()
    if current_user_id is None:
        # This case implies that @jwt_required was used, but get_jwt_identity() returned None.
        # This could happen if the token is valid but somehow the identity claim is missing or null.
        # For a route protected by @jwt_required(), get_jwt_identity() should normally return a non-None value.
        return False
    
    user = User.query.get(current_user_id)
    # Ensure user exists and has a 'role' attribute matching 'admin'
    return user is not None and user.role == 'admin'
