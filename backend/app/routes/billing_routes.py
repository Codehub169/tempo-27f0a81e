from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from http import HTTPStatus
from decimal import Decimal, InvalidOperation
import datetime

from app.database import db # Corrected: Use db from app.database
from app.models import Bill, BillItem, Patient, InventoryItem
from app.schemas import BillSchema, BillItemSchema
from marshmallow import ValidationError

billing_bp = Blueprint('billing_bp', __name__, url_prefix='/bills')

bill_schema = BillSchema()
bills_schema = BillSchema(many=True)
bill_item_schema = BillItemSchema() # Used for validating individual items

@billing_bp.route('', methods=['POST'])
@jwt_required()
def create_bill():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided'}), HTTPStatus.BAD_REQUEST
    
    patient_id = data.get('patient_id')
    if not patient_id or not Patient.query.get(patient_id):
        return jsonify({'message': 'Patient not found'}), HTTPStatus.NOT_FOUND

    if 'bill_items' not in data or not isinstance(data['bill_items'], list) or not data['bill_items']:
        return jsonify({'message': 'bill_items must be a non-empty list'}), HTTPStatus.BAD_REQUEST

    # Validate the overall bill structure (excluding items initially for separate processing)
    bill_payload_for_schema = {k: v for k, v in data.items() if k != 'bill_items'}
    try:
        # Marshmallow validates and deserializes. load() returns dict for model creation.
        loaded_bill_data = bill_schema.load(bill_payload_for_schema) 
    except ValidationError as err:
        return jsonify(err.messages), HTTPStatus.BAD_REQUEST

    new_bill_model = Bill(**loaded_bill_data) # Create Bill model instance
    
    total_amount = Decimal('0.00')
    processed_bill_item_models = []

    try:
        for item_data_from_payload in data['bill_items']:
            try:
                loaded_item_data = bill_item_schema.load(item_data_from_payload)
            except ValidationError as item_err:
                db.session.rollback() # Rollback any DB changes from this attempt (e.g. previous inventory adjustments)
                return jsonify({'message': f'Invalid bill item data for item {data["bill_items"].index(item_data_from_payload) + 1}: {item_err.messages}'}), HTTPStatus.BAD_REQUEST

            quantity = loaded_item_data.get('quantity', 1) # Schema ensures int, default 1
            # unit_price comes from schema load as Decimal if as_string=False, or string if as_string=True
            # Assuming schema's Decimal field (as_string=True) loads as string, convert to Decimal here.
            # Or better, ensure schema loads it as Decimal.
            # For now, let's assume loaded_item_data['unit_price'] is a string due to schema's as_string=True.
            try:
                unit_price = Decimal(str(loaded_item_data.get('unit_price', '0.00')))
            except InvalidOperation:
                 db.session.rollback()
                 return jsonify({'message': f'Invalid unit_price format for item.'}), HTTPStatus.BAD_REQUEST

            inventory_item_model = None
            if loaded_item_data.get('inventory_item_id'):
                inventory_item_model = InventoryItem.query.get(loaded_item_data['inventory_item_id'])
                if not inventory_item_model:
                    raise ValueError(f"Inventory item with ID {loaded_item_data['inventory_item_id']} not found.")
                if inventory_item_model.quantity_on_hand < quantity:
                    raise ValueError(f"Not enough stock for item '{inventory_item_model.name}'. Available: {inventory_item_model.quantity_on_hand}")
                
                inventory_item_model.quantity_on_hand -= quantity # Decrease stock
                unit_price = inventory_item_model.unit_price # Use inventory item's current price (already Decimal)
                loaded_item_data['unit_price'] = unit_price # Update for model creation
            
            # Create BillItem model instance using the validated and processed data
            # Ensure loaded_item_data keys match BillItem model fields or schema fields for **kwargs
            # Explicitly create BillItem to avoid issues with extra keys from schema load if any
            bill_item_model_instance = BillItem(
                inventory_item_id=loaded_item_data.get('inventory_item_id'),
                service_description=loaded_item_data.get('service_description'),
                quantity=quantity,
                unit_price=unit_price # unit_price is now Decimal
            )
            bill_item_model_instance.sub_total = bill_item_model_instance.quantity * bill_item_model_instance.unit_price
            total_amount += bill_item_model_instance.sub_total
            processed_bill_item_models.append(bill_item_model_instance)

        new_bill_model.total_amount = total_amount
        new_bill_model.bill_items = processed_bill_item_models # Assign child objects to parent for relationship

        db.session.add(new_bill_model)
        # All inventory items that were modified are already part of the session 
        # and their quantity_on_hand changes will be committed.
        db.session.commit()
        return jsonify(bill_schema.dump(new_bill_model)), HTTPStatus.CREATED

    except ValueError as ve: # Catch custom ValueErrors for stock, item not found etc.
        db.session.rollback() 
        return jsonify({'message': str(ve)}), HTTPStatus.BAD_REQUEST
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error processing bill creation', 'error': str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR


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
    bill_model = Bill.query.get_or_404(bill_id)
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided'}), HTTPStatus.BAD_REQUEST

    allowed_update_fields_payload = {}
    if 'payment_status' in data:
        allowed_update_fields_payload['payment_status'] = data['payment_status']
    if 'notes' in data:
        allowed_update_fields_payload['notes'] = data['notes']
    
    if not allowed_update_fields_payload:
        return jsonify({'message': 'No updatable fields provided (only payment_status, notes allowed for now)'}), HTTPStatus.BAD_REQUEST

    try:
        # Validate and load only the allowed fields
        # partial=True ensures other fields are not required
        loaded_data = bill_schema.load(allowed_update_fields_payload, partial=True)
        
        # Apply updated fields to the SQLAlchemy model instance
        for key, value in loaded_data.items():
            setattr(bill_model, key, value)
        
        db.session.add(bill_model) # Add to session for safety
        db.session.commit()
        return jsonify(bill_schema.dump(bill_model)), HTTPStatus.OK
    except ValidationError as err:
        return jsonify(err.messages), HTTPStatus.BAD_REQUEST
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error updating bill', 'error': str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR

@billing_bp.route('/<int:bill_id>', methods=['DELETE'])
@jwt_required()
def delete_bill(bill_id):
    bill = Bill.query.get_or_404(bill_id)
    try:
        # Atomically update inventory and delete bill
        for item_model in bill.bill_items:
            if item_model.inventory_item_id and item_model.inventory_item:
                # Ensure inventory_item is loaded if it's a lazy relationship and session might be tricky
                # db.session.add(item_model.inventory_item) # Not strictly needed if already in session
                item_model.inventory_item.quantity_on_hand += item_model.quantity
        
        db.session.delete(bill)
        db.session.commit()
        return '', HTTPStatus.NO_CONTENT
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error deleting bill', 'error': str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR
