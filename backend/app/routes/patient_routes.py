from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models import Patient
from app.schemas import PatientSchema
from app.database import db
from marshmallow import ValidationError

patient_bp = Blueprint('patient_bp', __name__, url_prefix='/patients')

patient_schema = PatientSchema()
patients_schema = PatientSchema(many=True)

@patient_bp.route('', methods=['POST'])
@jwt_required()
def create_patient():
    data = request.get_json()
    try:
        # Check if patient with email or phone already exists
        if Patient.query.filter((Patient.email == data.get('email')) | (Patient.phone == data.get('phone'))).first():
            return jsonify({"msg": "Patient with this email or phone already exists"}), 409
            
        new_patient_data = patient_schema.load(data)
        new_patient = Patient(**new_patient_data)
        db.session.add(new_patient)
        db.session.commit()
        return jsonify(patient_schema.dump(new_patient)), 201
    except ValidationError as err:
        return jsonify(err.messages), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error creating patient", "error": str(e)}), 500

@patient_bp.route('', methods=['GET'])
@jwt_required()
def get_patients():
    # Add search/filtering capabilities, e.g., by name, email
    search_term = request.args.get('search', None)
    if search_term:
        patients = Patient.query.filter(
            Patient.full_name.ilike(f'%{search_term}%') |
            Patient.email.ilike(f'%{search_term}%') |
            Patient.phone.ilike(f'%{search_term}%')
        ).all()
    else:
        patients = Patient.query.all()
    return jsonify(patients_schema.dump(patients)), 200

@patient_bp.route('/<int:patient_id>', methods=['GET'])
@jwt_required()
def get_patient(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    return jsonify(patient_schema.dump(patient)), 200

@patient_bp.route('/<int:patient_id>', methods=['PUT'])
@jwt_required()
def update_patient(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    data = request.get_json()
    try:
        # Check for uniqueness if email/phone are being changed
        if 'email' in data and data['email'] != patient.email and Patient.query.filter_by(email=data['email']).first():
            return jsonify({"msg": "Another patient with this email already exists"}), 409
        if 'phone' in data and data['phone'] != patient.phone and Patient.query.filter_by(phone=data['phone']).first():
            return jsonify({"msg": "Another patient with this phone already exists"}), 409

        updated_patient_data = patient_schema.load(data, partial=True)
        for key, value in updated_patient_data.items():
            setattr(patient, key, value)
        db.session.commit()
        return jsonify(patient_schema.dump(patient)), 200
    except ValidationError as err:
        return jsonify(err.messages), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error updating patient", "error": str(e)}), 500

@patient_bp.route('/<int:patient_id>', methods=['DELETE'])
@jwt_required()
def delete_patient(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    try:
        # Consider implications of deleting a patient (e.g., linked appointments, bills)
        # Cascading deletes in models.py should handle related records if configured.
        db.session.delete(patient)
        db.session.commit()
        return jsonify({"msg": "Patient deleted"}), 200
    except Exception as e:
        db.session.rollback()
        # If deletion fails due to foreign key constraints not handled by cascade:
        if "FOREIGN KEY constraint failed" in str(e).lower():
             return jsonify({"msg": "Cannot delete patient. They have associated records (e.g., appointments, bills). Consider archiving instead."}), 409
        return jsonify({"msg": "Error deleting patient", "error": str(e)}), 500
