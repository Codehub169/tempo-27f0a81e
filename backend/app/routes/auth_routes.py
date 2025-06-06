from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import check_password_hash
from app.models import User
from app.schemas import UserSchema
from app.database import db
from datetime import timedelta

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/auth')

user_schema = UserSchema()
users_schema = UserSchema(many=True)

# In-memory token blocklist (for simplicity, use Redis or DB in production)
# This is illustrative; a proper blocklist is needed for production logout.
BLOCKLIST = set()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    # Basic validation, can be expanded
    if not data or not data.get('email') or not data.get('password') or not data.get('username'):
        return jsonify({"msg": "Missing username, email, or password"}), 400

    if User.query.filter_by(email=data['email']).first() or User.query.filter_by(username=data['username']).first():
        return jsonify({"msg": "User with this email or username already exists"}), 409

    try:
        # Use schema to load and validate, including password hashing in model
        new_user = User(
            username=data['username'],
            email=data['email'],
            role=data.get('role', 'staff') # Default role
        )
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()

        access_token = create_access_token(identity=new_user.id, expires_delta=timedelta(hours=1))
        refresh_token = create_refresh_token(identity=new_user.id)
        return jsonify(access_token=access_token, refresh_token=refresh_token, user=user_schema.dump(new_user)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error creating user", "error": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Missing email or password"}), 400

    user = User.query.filter_by(email=data['email']).first()

    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=user.id, expires_delta=timedelta(hours=1))
        refresh_token = create_refresh_token(identity=user.id)
        return jsonify(access_token=access_token, refresh_token=refresh_token, user=user_schema.dump(user)), 200
    else:
        return jsonify({"msg": "Bad email or password"}), 401

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt()['jti']
    BLOCKLIST.add(jti) # Add token JTI to blocklist
    return jsonify({"msg": "Successfully logged out"}), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id, expires_delta=timedelta(hours=1))
    return jsonify(access_token=new_access_token), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
    return jsonify(user_schema.dump(user)), 200

# This function is called by Flask-JWT-Extended to check if a token is blocklisted
# It needs to be registered with the JWTManager instance in app/__init__.py
# @jwt.token_in_blocklist_loader
# def check_if_token_in_blocklist(jwt_header, jwt_payload):
#     jti = jwt_payload['jti']
#     return jti in BLOCKLIST
