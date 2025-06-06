from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Appointment, Patient, Doctor
from app.schemas import AppointmentSchema
from app.database import db
from marshmallow import ValidationError
from datetime import datetime

appointment_bp = Blueprint('appointment_bp', __name__, url_prefix='/appointments')

appointment_schema = AppointmentSchema()
appointments_schema = AppointmentSchema(many=True)

@appointment_bp.route('', methods=['POST'])
@jwt_required()
def create_appointment():
    data = request.get_json()
    try:
        # Validate patient and doctor existence
        patient_exists = Patient.query.get(data.get('patient_id'))
        if not patient_exists:
            return jsonify({"msg": "Patient not found"}), 404
        
        doctor_exists = Doctor.query.get(data.get('doctor_id'))
        if not doctor_exists:
            return jsonify({"msg": "Doctor not found"}), 404

        new_appointment_data = appointment_schema.load(data)
        new_appointment = Appointment(**new_appointment_data)
        
        db.session.add(new_appointment)
        db.session.commit()
        return jsonify(appointment_schema.dump(new_appointment)), 201
    except ValidationError as err:
        return jsonify(err.messages), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error creating appointment", "error": str(e)}), 500

@appointment_bp.route('', methods=['GET'])
@jwt_required()
def get_appointments():
    # Add filtering capabilities as needed, e.g., by date, patient_id, doctor_id
    appointments = Appointment.query.all()
    return jsonify(appointments_schema.dump(appointments)), 200

@appointment_bp.route('/<int:appointment_id>', methods=['GET'])
@jwt_required()
def get_appointment(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    return jsonify(appointment_schema.dump(appointment)), 200

@appointment_bp.route('/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    data = request.get_json()
    try:
        # Validate patient and doctor existence if they are being updated
        if 'patient_id' in data and not Patient.query.get(data['patient_id']):
            return jsonify({"msg": "Patient not found"}), 404
        if 'doctor_id' in data and not Doctor.query.get(data['doctor_id']):
            return jsonify({"msg": "Doctor not found"}), 404

        # Marshmallow load with partial=True allows for partial updates
        updated_appointment_data = appointment_schema.load(data, partial=True)
        
        for key, value in updated_appointment_data.items():
            setattr(appointment, key, value)
        
        db.session.commit()
        return jsonify(appointment_schema.dump(appointment)), 200
    except ValidationError as err:
        return jsonify(err.messages), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error updating appointment", "error": str(e)}), 500

@appointment_bp.route('/<int:appointment_id>', methods=['DELETE'])
@jwt_required()
def delete_appointment(appointment_id):
    appointment = Appointment.query.get_or_404(appointment_id)
    try:
        # Instead of deleting, consider changing status to 'Cancelled'
        # appointment.status = 'Cancelled'
        # db.session.commit()
        # return jsonify({"msg": "Appointment cancelled"}), 200
        
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({"msg": "Appointment deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error deleting appointment", "error": str(e)}), 500
