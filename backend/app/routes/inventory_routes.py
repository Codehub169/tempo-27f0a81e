from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from http import HTTPStatus

from app.database import db # Corrected: Use db from app.database
from app.models import InventoryItem
from app.schemas import InventoryItemSchema
from app.utils import is_admin # Import is_admin from utils

inventory_bp = Blueprint('inventory_bp', __name__, url_prefix='/inventory')

inventory_item_schema = InventoryItemSchema()
inventory_items_schema = InventoryItemSchema(many=True)

@inventory_bp.route('', methods=['POST'])
@jwt_required()
def create_inventory_item():
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), HTTPStatus.FORBIDDEN

    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided'}), HTTPStatus.BAD_REQUEST
    
    # Validate with schema first to catch structural issues
    validation_errors = inventory_item_schema.validate(data)
    if validation_errors:
        return jsonify(validation_errors), HTTPStatus.BAD_REQUEST

    try:
        # Load data using schema, which returns a dictionary
        loaded_data = inventory_item_schema.load(data)
        # Create SQLAlchemy model instance from the dictionary
        new_item_model = InventoryItem(**loaded_data)
        
        db.session.add(new_item_model)
        db.session.commit()
        return jsonify(inventory_item_schema.dump(new_item_model)), HTTPStatus.CREATED
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error creating inventory item', 'error': str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR

@inventory_bp.route('', methods=['GET'])
@jwt_required()
def get_inventory_items():
    category_filter = request.args.get('category')
    low_stock_filter = request.args.get('low_stock', type=lambda v: v.lower() == 'true')

    query = InventoryItem.query

    if category_filter:
        query = query.filter(InventoryItem.category.ilike(f'%{category_filter}%'))
    
    if low_stock_filter is True:
        query = query.filter(InventoryItem.quantity_on_hand <= InventoryItem.reorder_level)
    
    all_items = query.order_by(InventoryItem.name).all()
    return jsonify(inventory_items_schema.dump(all_items)), HTTPStatus.OK

@inventory_bp.route('/<int:item_id>', methods=['GET'])
@jwt_required()
def get_inventory_item(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    return jsonify(inventory_item_schema.dump(item)), HTTPStatus.OK

@inventory_bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_inventory_item(item_id):
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), HTTPStatus.FORBIDDEN

    item_model = InventoryItem.query.get_or_404(item_id)
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No input data provided'}), HTTPStatus.BAD_REQUEST
    
    # Validate with schema first, partial=True for updates
    validation_errors = inventory_item_schema.validate(data, partial=True)
    if validation_errors:
        return jsonify(validation_errors), HTTPStatus.BAD_REQUEST

    try:
        # Load data using schema (partial=True), returns a dictionary of fields to update
        # Marshmallow's load method can update an existing model instance directly if `instance` argument is provided
        # However, the current approach of setattr is also fine and explicit.
        data_to_update = inventory_item_schema.load(data, partial=True)
        
        # Apply updated fields to the SQLAlchemy model instance
        for key, value in data_to_update.items():
            setattr(item_model, key, value)
        
        db.session.add(item_model) # Add to session in case it was detached or for safety
        db.session.commit()
        return jsonify(inventory_item_schema.dump(item_model)), HTTPStatus.OK
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error updating inventory item', 'error': str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR

@inventory_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_inventory_item(item_id):
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), HTTPStatus.FORBIDDEN

    item = InventoryItem.query.get_or_404(item_id)
    try:
        db.session.delete(item)
        db.session.commit()
        return '', HTTPStatus.NO_CONTENT
    except Exception as e: # Catch potential integrity errors if item is in use
        db.session.rollback()
        # Check if the error is due to foreign key constraint (SQLite and PostgreSQL syntax)
        error_str = str(e).lower()
        if 'foreign key constraint failed' in error_str or \
           'violates foreign key constraint' in error_str or \
           'constraint failed' in error_str: # More generic for SQLite
             return jsonify({'message': 'Error deleting inventory item. It might be associated with existing bills or other records.', 'error': str(e)}), HTTPStatus.CONFLICT
        return jsonify({'message': 'Error deleting inventory item', 'error': str(e)}), HTTPStatus.INTERNAL_SERVER_ERROR
