from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Doctor, User # Assuming only admins can manage doctors
from app.schemas import DoctorSchema
from app.database import db
from marshmallow import ValidationError

doctor_bp = Blueprint('doctor_bp', __name__, url_prefix='/doctors')

doctor_schema = DoctorSchema()
doctors_schema = DoctorSchema(many=True)

# Helper for admin check (can be moved to a common utility or decorator)
def is_admin():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return user and user.role == 'admin'

@doctor_bp.route('', methods=['POST'])
@jwt_required()
def create_doctor():
    if not is_admin():
        return jsonify({"msg": "Admin access required"}), 403
        
    data = request.get_json()
    try:
        if Doctor.query.filter_by(email=data.get('email')).first():
            return jsonify({"msg": "Doctor with this email already exists"}), 409

        new_doctor_data = doctor_schema.load(data)
        new_doctor = Doctor(**new_doctor_data)
        db.session.add(new_doctor)
        db.session.commit()
        return jsonify(doctor_schema.dump(new_doctor)), 201
    except ValidationError as err:
        return jsonify(err.messages), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error creating doctor", "error": str(e)}), 500

@doctor_bp.route('', methods=['GET'])
@jwt_required() # All authenticated users can view doctors
def get_doctors():
    doctors = Doctor.query.all()
    return jsonify(doctors_schema.dump(doctors)), 200

@doctor_bp.route('/<int:doctor_id>', methods=['GET'])
@jwt_required() # All authenticated users can view a specific doctor
def get_doctor(doctor_id):
    doctor = Doctor.query.get_or_404(doctor_id)
    return jsonify(doctor_schema.dump(doctor)), 200

@doctor_bp.route('/<int:doctor_id>', methods=['PUT'])
@jwt_required()
def update_doctor(doctor_id):
    if not is_admin():
        return jsonify({"msg": "Admin access required"}), 403

    doctor = Doctor.query.get_or_404(doctor_id)
    data = request.get_json()
    try:
        if 'email' in data and data['email'] != doctor.email and Doctor.query.filter_by(email=data['email']).first():
            return jsonify({"msg": "Another doctor with this email already exists"}), 409
            
        updated_doctor_data = doctor_schema.load(data, partial=True)
        for key, value in updated_doctor_data.items():
            setattr(doctor, key, value)
        db.session.commit()
        return jsonify(doctor_schema.dump(doctor)), 200
    except ValidationError as err:
        return jsonify(err.messages), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error updating doctor", "error": str(e)}), 500

@doctor_bp.route('/<int:doctor_id>', methods=['DELETE'])
@jwt_required()
def delete_doctor(doctor_id):
    if not is_admin():
        return jsonify({"msg": "Admin access required"}), 403

    doctor = Doctor.query.get_or_404(doctor_id)
    try:
        # Consider implications of deleting a doctor (e.g., linked appointments)
        # Cascading deletes in models.py should handle related records if configured.
        db.session.delete(doctor)
        db.session.commit()
        return jsonify({"msg": "Doctor deleted"}), 200
    except Exception as e:
        db.session.rollback()
        if "FOREIGN KEY constraint failed" in str(e).lower():
             return jsonify({"msg": "Cannot delete doctor. They have associated records (e.g., appointments). Consider deactivating or reassigning instead."}), 409
        return jsonify({"msg": "Error deleting doctor", "error": str(e)}), 500
