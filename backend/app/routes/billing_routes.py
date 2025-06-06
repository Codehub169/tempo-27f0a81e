from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from http import HTTPStatus
from decimal import Decimal
import datetime

from app import db
from app.models import Bill, BillItem, Patient, InventoryItem
from app.schemas import BillSchema, BillItemSchema

billing_bp = Blueprint('billing_bp', __name__, url_prefix='/bills')

bill_schema = BillSchema()
bills_schema = BillSchema(many=True)
bill_item_schema = BillItemSchema()

@billing_bp.route('', methods=['POST'])
@jwt_required()
def create_bill():
    data = request.get_json()
    
    # Validate patient exists
    patient_id = data.get('patient_id')
    if not patient_id or not Patient.query.get(patient_id):
        return jsonify({'message': 'Patient not found'}), HTTPStatus.NOT_FOUND

    # Basic validation for bill items structure
    if 'bill_items' not in data or not isinstance(data['bill_items'], list):
        return jsonify({'message': 'bill_items must be a list'}), HTTPStatus.BAD_REQUEST

    errors = bill_schema.validate(data)
    if errors:
        return jsonify(errors), HTTPStatus.BAD_REQUEST

    total_amount = Decimal('0.00')
    bill_items_data = data.pop('bill_items', []) # Remove items for separate processing
    
    new_bill = bill_schema.load(data) # Load main bill data (patient_id, bill_date, etc.)
    
    processed_bill_items = []

    try:
        for item_data in bill_items_data:
            item_errors = bill_item_schema.validate(item_data)
            if item_errors:
                raise ValueError(f"Invalid bill item data: {item_errors}")

            # Check inventory and update quantity if inventory_item_id is present
            inventory_item_id = item_data.get('inventory_item_id')
            quantity = Decimal(str(item_data.get('quantity', 1)))
            
            if inventory_item_id:
                inventory_item = InventoryItem.query.get(inventory_item_id)
                if not inventory_item:
                    raise ValueError(f"Inventory item with ID {inventory_item_id} not found.")
                if inventory_item.quantity_on_hand < quantity:
                    raise ValueError(f"Not enough stock for item '{inventory_item.name}'. Available: {inventory_item.quantity_on_hand}")
                inventory_item.quantity_on_hand -= quantity
                item_data['unit_price'] = str(inventory_item.unit_price) # Use inventory item's price
            
            # Ensure unit_price is a string for Decimal conversion in schema
            item_data['unit_price'] = str(item_data.get('unit_price', '0.00'))
            
            # Create BillItem instance
            bill_item_instance = bill_item_schema.load(item_data)
            bill_item_instance.sub_total = bill_item_instance.quantity * bill_item_instance.unit_price
            total_amount += bill_item_instance.sub_total
            processed_bill_items.append(bill_item_instance)

        new_bill.total_amount = total_amount
        new_bill.bill_items = processed_bill_items # Associate items with the bill

        db.session.add(new_bill)
        db.session.commit()
        return jsonify(bill_schema.dump(new_bill)), HTTPStatus.CREATED

    except ValueError as ve:
        db.session.rollback()
        return jsonify({'message': str(ve)}), HTTPStatus.BAD_REQUEST
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error creating bill', 'error': str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR

@billing_bp.route('', methods=['GET'])
@jwt_required()
def get_bills():
    patient_id_filter = request.args.get('patient_id', type=int)
    payment_status_filter = request.args.get('payment_status')
    start_date_filter = request.args.get('start_date')
    end_date_filter = request.args.get('end_date')

    query = Bill.query

    if patient_id_filter:
        query = query.filter(Bill.patient_id == patient_id_filter)
    if payment_status_filter:
        query = query.filter(Bill.payment_status.ilike(f'%{payment_status_filter}%'))
    if start_date_filter:
        try:
            start_dt = datetime.datetime.fromisoformat(start_date_filter).date()
            query = query.filter(Bill.bill_date >= start_dt)
        except ValueError:
            return jsonify({'message': 'Invalid start_date format. Use YYYY-MM-DD.'}), HTTPStatus.BAD_REQUEST
    if end_date_filter:
        try:
            end_dt = datetime.datetime.fromisoformat(end_date_filter).date()
            query = query.filter(Bill.bill_date <= end_dt)
        except ValueError:
            return jsonify({'message': 'Invalid end_date format. Use YYYY-MM-DD.'}), HTTPStatus.BAD_REQUEST

    all_bills = query.order_by(Bill.bill_date.desc()).all()
    return jsonify(bills_schema.dump(all_bills)), HTTPStatus.OK

@billing_bp.route('/<int:bill_id>', methods=['GET'])
@jwt_required()
def get_bill(bill_id):
    bill = Bill.query.get_or_404(bill_id)
    return jsonify(bill_schema.dump(bill)), HTTPStatus.OK

@billing_bp.route('/<int:bill_id>', methods=['PUT'])
@jwt_required()
def update_bill(bill_id):
    bill = Bill.query.get_or_404(bill_id)
    data = request.get_json()

    # For MVP, only allow updating payment_status and notes. Item modification is complex.
    allowed_updates = {}
    if 'payment_status' in data:
        allowed_updates['payment_status'] = data['payment_status']
    if 'notes' in data: # Assuming Bill model might have notes, or schema supports it
        allowed_updates['notes'] = data['notes']
    
    if not allowed_updates:
        return jsonify({'message': 'No updatable fields provided (payment_status, notes)'}), HTTPStatus.BAD_REQUEST

    errors = bill_schema.validate(allowed_updates, partial=True)
    if errors:
        return jsonify(errors), HTTPStatus.BAD_REQUEST

    try:
        updated_bill = bill_schema.load(allowed_updates, instance=bill, partial=True)
        db.session.commit()
        return jsonify(bill_schema.dump(updated_bill)), HTTPStatus.OK
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error updating bill', 'error': str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR

@billing_bp.route('/<int:bill_id>', methods=['DELETE'])
@jwt_required()
def delete_bill(bill_id):
    # In a real system, bills are usually voided or cancelled, not hard deleted.
    # For MVP, we can implement a soft delete (e.g., change status to 'Voided') or hard delete with caution.
    bill = Bill.query.get_or_404(bill_id)
    try:
        # Before deleting, revert inventory stock for associated bill items
        for item in bill.bill_items:
            if item.inventory_item_id and item.inventory_item:
                item.inventory_item.quantity_on_hand += item.quantity
        
        db.session.delete(bill)
        db.session.commit()
        return '', HTTPStatus.NO_CONTENT
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error deleting bill', 'error': str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR
