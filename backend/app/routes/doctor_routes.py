from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import IntegrityError
from http import HTTPStatus

from app.models import Doctor
from app.schemas import DoctorSchema
from app.database import db
from marshmallow import ValidationError
from app.utils import is_admin

doctor_bp = Blueprint('doctor_bp', __name__, url_prefix='/doctors')

doctor_schema = DoctorSchema()
doctors_schema = DoctorSchema(many=True)

@doctor_bp.route('', methods=['POST'])
@jwt_required()
def create_doctor():
    if not is_admin():
        return jsonify({"msg": "Admin access required"}), HTTPStatus.FORBIDDEN
        
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Request payload is missing or not JSON"}), HTTPStatus.BAD_REQUEST

    try:
        new_doctor_data = doctor_schema.load(data)
        
        validated_email = new_doctor_data.get('email')
        if validated_email:  # Checks if email is not None and not an empty string
            if Doctor.query.filter_by(email=validated_email).first():
                return jsonify({"msg": "Doctor with this email already exists"}), HTTPStatus.CONFLICT

        new_doctor = Doctor(**new_doctor_data)
        db.session.add(new_doctor)
        db.session.commit()
        return jsonify(doctor_schema.dump(new_doctor)), HTTPStatus.CREATED
    except ValidationError as err:
        return jsonify(err.messages), HTTPStatus.BAD_REQUEST
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating doctor: {str(e)}")
        return jsonify({"msg": "Error creating doctor", "error": str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR

@doctor_bp.route('', methods=['GET'])
@jwt_required() # All authenticated users can view doctors
def get_doctors():
    # Consider adding pagination for production environments if the list can grow large.
    # e.g., page = request.args.get('page', 1, type=int)
    # e.g., per_page = request.args.get('per_page', 10, type=int)
    # doctors_page = Doctor.query.paginate(page=page, per_page=per_page, error_out=False)
    # results = { 
    #    "data": doctors_schema.dump(doctors_page.items),
    #    "total": doctors_page.total,
    #    "pages": doctors_page.pages,
    #    "current_page": doctors_page.page
    # }
    # return jsonify(results), HTTPStatus.OK
    doctors = Doctor.query.all()
    return jsonify(doctors_schema.dump(doctors)), HTTPStatus.OK

@doctor_bp.route('/<int:doctor_id>', methods=['GET'])
@jwt_required() # All authenticated users can view a specific doctor
def get_doctor(doctor_id):
    doctor = Doctor.query.get_or_404(doctor_id)
    return jsonify(doctor_schema.dump(doctor)), HTTPStatus.OK

@doctor_bp.route('/<int:doctor_id>', methods=['PUT'])
@jwt_required()
def update_doctor(doctor_id):
    if not is_admin():
        return jsonify({"msg": "Admin access required"}), HTTPStatus.FORBIDDEN

    doctor = Doctor.query.get_or_404(doctor_id)
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Request payload is missing or not JSON"}), HTTPStatus.BAD_REQUEST
        
    try:
        updated_doctor_data = doctor_schema.load(data, partial=True)
        
        if 'email' in updated_doctor_data: 
            new_email = updated_doctor_data['email']
            if new_email is not None and new_email != doctor.email:
                if Doctor.query.filter_by(email=new_email).first():
                    return jsonify({"msg": "Another doctor with this email already exists"}), HTTPStatus.CONFLICT
            
        for key, value in updated_doctor_data.items():
            setattr(doctor, key, value)
        db.session.commit()
        return jsonify(doctor_schema.dump(doctor)), HTTPStatus.OK
    except ValidationError as err:
        return jsonify(err.messages), HTTPStatus.BAD_REQUEST
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating doctor {doctor_id}: {str(e)}")
        return jsonify({"msg": "Error updating doctor", "error": str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR

@doctor_bp.route('/<int:doctor_id>', methods=['DELETE'])
@jwt_required()
def delete_doctor(doctor_id):
    if not is_admin():
        return jsonify({"msg": "Admin access required"}), HTTPStatus.FORBIDDEN

    doctor = Doctor.query.get_or_404(doctor_id)
    try:
        db.session.delete(doctor)
        db.session.commit()
        return jsonify({"msg": "Doctor deleted"}), HTTPStatus.OK
    except IntegrityError as e:
        db.session.rollback()
        current_app.logger.warning(f"IntegrityError deleting doctor {doctor_id}: {str(e)}")
        error_info_str = str(e.orig).lower() if hasattr(e, 'orig') and e.orig is not None else str(e).lower()
        if "foreign key constraint" in error_info_str or \
           "violates foreign key constraint" in error_info_str:
             return jsonify({"msg": "Cannot delete doctor. They have associated records (e.g., appointments). Consider deactivating or reassigning instead."}), HTTPStatus.CONFLICT
        return jsonify({"msg": "Database integrity error deleting doctor.", "error_detail": str(e)}), HTTPStatus.CONFLICT
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting doctor {doctor_id}: {str(e)}")
        return jsonify({"msg": "Error deleting doctor", "error": str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR
