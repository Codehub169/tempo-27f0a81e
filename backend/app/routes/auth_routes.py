from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from app.models import User
from app.schemas import UserSchema
from app.database import db
from marshmallow import ValidationError
from http import HTTPStatus

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')

user_schema = UserSchema()
# users_schema = UserSchema(many=True) # Not used in this file, can be removed if not planned for future use

# In-memory token blocklist. For production, consider a persistent store like Redis.
BLOCKLIST = set()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Request payload is missing or not JSON"}), HTTPStatus.BAD_REQUEST

    try:
        # Use schema to load and validate data
        # Password is load_only, so it will be in loaded_data after schema.load()
        # Role will use schema's default ('receptionist') if not provided in the payload
        loaded_data = user_schema.load(data)
    except ValidationError as err:
        return jsonify(err.messages), HTTPStatus.BAD_REQUEST

    # Check for existing user using validated data
    if User.query.filter_by(email=loaded_data['email']).first():
        return jsonify({"msg": "User with this email already exists"}), HTTPStatus.CONFLICT
    if User.query.filter_by(username=loaded_data['username']).first():
        return jsonify({"msg": "User with this username already exists"}), HTTPStatus.CONFLICT

    try:
        new_user = User(
            username=loaded_data['username'],
            email=loaded_data['email'],
            role=loaded_data['role']  # Role from schema (includes default 'receptionist')
        )
        new_user.set_password(loaded_data['password']) # Password from schema (load_only field)
        
        db.session.add(new_user)
        db.session.commit()

        # Tokens will use global expiration settings from app.config
        access_token = create_access_token(identity=new_user.id)
        refresh_token = create_refresh_token(identity=new_user.id)
        
        # User schema dump excludes password by default
        user_details = user_schema.dump(new_user)
        
        return jsonify(
            access_token=access_token, 
            refresh_token=refresh_token, 
            user=user_details
        ), HTTPStatus.CREATED
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error during user registration (db persistence or token generation): {str(e)}")
        # Generic error message for client, specific error logged on server
        return jsonify({"msg": "Error processing registration", "error": "An internal error occurred during registration."}), HTTPStatus.INTERNAL_SERVER_ERROR

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Missing email or password"}), HTTPStatus.BAD_REQUEST

    user = User.query.filter_by(email=data['email']).first()

    if user and user.check_password(data['password']):
        # Tokens will use global expiration settings from app.config
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        user_details = user_schema.dump(user)
        return jsonify(access_token=access_token, refresh_token=refresh_token, user=user_details), HTTPStatus.OK
    else:
        return jsonify({"msg": "Bad email or password"}), HTTPStatus.UNAUTHORIZED

@auth_bp.route('/logout', methods=['POST'])
@jwt_required() # Requires a valid access token
def logout():
    jti = get_jwt()['jti'] # jti is "JWT ID", a unique identifier for a JWT.
    BLOCKLIST.add(jti)
    return jsonify({"msg": "Successfully logged out"}), HTTPStatus.OK

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True) # Requires a valid refresh token
def refresh():
    current_user_id = get_jwt_identity()
    # New access token will use global expiration settings from app.config
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify(access_token=new_access_token), HTTPStatus.OK

@auth_bp.route('/me', methods=['GET'])
@jwt_required() # Requires a valid access token
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        # This case should ideally not happen if token identity is valid and refers to an existing user
        current_app.logger.warning(f"User with ID {current_user_id} from token not found in database.")
        return jsonify({"msg": "User not found"}), HTTPStatus.NOT_FOUND
    return jsonify(user_schema.dump(user)), HTTPStatus.OK
