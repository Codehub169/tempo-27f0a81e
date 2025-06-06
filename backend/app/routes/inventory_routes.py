from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from http import HTTPStatus

from app import db
from app.models import InventoryItem, User
from app.schemas import InventoryItemSchema

inventory_bp = Blueprint('inventory_bp', __name__, url_prefix='/inventory')

inventory_item_schema = InventoryItemSchema()
inventory_items_schema = InventoryItemSchema(many=True)

def is_admin():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user and user.role == 'admin'

@inventory_bp.route('', methods=['POST'])
@jwt_required()
def create_inventory_item():
    if not is_admin():
        return jsonify({'message': 'Admin access required'}), HTTPStatus.FORBIDDEN

    data = request.get_json()
    errors = inventory_item_schema.validate(data)
    if errors:
        return jsonify(errors), HTTPStatus.BAD_REQUEST

    try:
        new_item = inventory_item_schema.load(data)
        db.session.add(new_item)
        db.session.commit()
        return jsonify(inventory_item_schema.dump(new_item)), HTTPStatus.CREATED
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

    item = InventoryItem.query.get_or_404(item_id)
    data = request.get_json()
    errors = inventory_item_schema.validate(data, partial=True)
    if errors:
        return jsonify(errors), HTTPStatus.BAD_REQUEST

    try:
        updated_item = inventory_item_schema.load(data, instance=item, partial=True)
        db.session.commit()
        return jsonify(inventory_item_schema.dump(updated_item)), HTTPStatus.OK
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
        return jsonify({'message': 'Error deleting inventory item. It might be associated with existing bills.', 'error': str(e)}), HTTPStatus.CONFLICT
