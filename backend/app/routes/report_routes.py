from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from http import HTTPStatus
from sqlalchemy import func, case
import datetime
from decimal import Decimal

from app import db
from app.models import Bill, Appointment, InventoryItem, Patient, User # User for admin check
from app.schemas import AppointmentSchema, InventoryItemSchema # For potential detailed lists in reports

report_bp = Blueprint('report_bp', __name__, url_prefix='/reports')

appointment_schema_many = AppointmentSchema(many=True)
inventory_item_schema_many = InventoryItemSchema(many=True)

def parse_date(date_str):
    if not date_str: return None
    try:
        return datetime.datetime.fromisoformat(date_str).date()
    except ValueError:
        return None

@report_bp.route('/generate', methods=['GET'])
@jwt_required()
def generate_report():
    report_type = request.args.get('report_type')
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    start_date = parse_date(start_date_str)
    end_date = parse_date(end_date_str)

    if not report_type:
        return jsonify({'message': 'report_type parameter is required'}), HTTPStatus.BAD_REQUEST

    report_data = {'report_type': report_type, 'filters': {'start_date': start_date_str, 'end_date': end_date_str}, 'data': {}}

    try:
        if report_type == 'revenue':
            query = db.session.query(func.sum(Bill.total_amount)).filter(Bill.payment_status == 'Paid')
            if start_date:
                query = query.filter(Bill.bill_date >= start_date)
            if end_date:
                query = query.filter(Bill.bill_date <= end_date)
            total_revenue = query.scalar() or Decimal('0.00')
            report_data['data'] = {'total_revenue': str(total_revenue)}

        elif report_type == 'appointments_summary':
            query = db.session.query(
                Appointment.status,
                func.count(Appointment.id).label('count')
            ).group_by(Appointment.status)
            
            date_query_part = Appointment.appointment_datetime
            if start_date:
                start_datetime = datetime.datetime.combine(start_date, datetime.time.min)
                query = query.filter(date_query_part >= start_datetime)
            if end_date:
                end_datetime = datetime.datetime.combine(end_date, datetime.time.max)
                query = query.filter(date_query_part <= end_datetime)
            
            summary = query.all()
            report_data['data'] = {status: count for status, count in summary}
            
            # Example: Get top 5 upcoming appointments if no date filter or future end_date
            if not start_date or (end_date and end_date >= datetime.date.today()):
                upcoming_appts_query = Appointment.query.filter(Appointment.appointment_datetime >= datetime.datetime.now())\
                                           .order_by(Appointment.appointment_datetime.asc()).limit(5)
                report_data['data']['upcoming_appointments_sample'] = appointment_schema_many.dump(upcoming_appts_query.all())

        elif report_type == 'low_stock_inventory':
            low_stock_items = InventoryItem.query.filter(
                InventoryItem.quantity_on_hand <= InventoryItem.reorder_level
            ).order_by(InventoryItem.name).all()
            report_data['data'] = {'low_stock_items': inventory_item_schema_many.dump(low_stock_items)}
        
        elif report_type == 'patient_demographics':
            # This is a placeholder for more complex demographic reporting
            # Example: Count of new patients in a period
            query = db.session.query(func.count(Patient.id))
            if start_date:
                query = query.filter(Patient.created_at >= datetime.datetime.combine(start_date, datetime.time.min))
            if end_date:
                query = query.filter(Patient.created_at <= datetime.datetime.combine(end_date, datetime.time.max))
            new_patients_count = query.scalar() or 0
            report_data['data'] = {'new_patients_count': new_patients_count}

        else:
            return jsonify({'message': 'Invalid report_type specified'}), HTTPStatus.BAD_REQUEST

        return jsonify(report_data), HTTPStatus.OK

    except Exception as e:
        return jsonify({'message': 'Error generating report', 'error': str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR
