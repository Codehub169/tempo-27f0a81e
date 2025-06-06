from marshmallow import Schema, fields, validate, post_load
from datetime import datetime, timezone

# Helper for common fields
class BaseSchema(Schema):
    id = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class UserSchema(BaseSchema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True, validate=validate.Length(max=120))
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=6))
    role = fields.Str(validate=validate.OneOf(['admin', 'doctor', 'receptionist']), default='receptionist')

    # @post_load
    # def make_user(self, data, **kwargs):
    #     # Password will be handled by model's set_password method in the route
    #     return data # Return data dictionary as is, or instantiate model if preferred for some workflows

class PatientSchema(BaseSchema):
    full_name = fields.Str(required=True, validate=validate.Length(max=150))
    email = fields.Email(validate=validate.Length(max=120), allow_none=True)
    phone = fields.Str(required=True, validate=validate.Length(max=20))
    date_of_birth = fields.Date(allow_none=True)
    address = fields.Str(allow_none=True)
    medical_history_summary = fields.Str(allow_none=True)

class DoctorSchema(BaseSchema):
    full_name = fields.Str(required=True, validate=validate.Length(max=150))
    specialty = fields.Str(validate=validate.Length(max=100), allow_none=True)
    email = fields.Email(validate=validate.Length(max=120), allow_none=True)
    phone = fields.Str(validate=validate.Length(max=20), allow_none=True)
    availability_notes = fields.Str(allow_none=True)

class AppointmentSchema(BaseSchema):
    patient_id = fields.Int(required=True)
    doctor_id = fields.Int(required=True)
    appointment_datetime = fields.DateTime(required=True)
    status = fields.Str(validate=validate.OneOf(['Scheduled', 'Confirmed', 'Cancelled', 'Completed']), default='Scheduled')
    notes = fields.Str(allow_none=True)
    # For dumping related data (optional)
    patient = fields.Nested('PatientSchema', dump_only=True, only=("id", "full_name"))
    doctor = fields.Nested('DoctorSchema', dump_only=True, only=("id", "full_name"))

class InventoryItemSchema(BaseSchema):
    name = fields.Str(required=True, validate=validate.Length(max=150))
    category = fields.Str(validate=validate.Length(max=100), allow_none=True)
    description = fields.Str(allow_none=True)
    quantity_on_hand = fields.Int(required=True, validate=validate.Range(min=0))
    reorder_level = fields.Int(validate=validate.Range(min=0), allow_none=True, default=0)
    unit_price = fields.Decimal(required=True, places=2, as_string=True) # as_string for precision
    supplier_info = fields.Str(validate=validate.Length(max=255), allow_none=True)

class BillItemSchema(BaseSchema):
    # id field is part of BaseSchema, useful for updates
    inventory_item_id = fields.Int(allow_none=True) # For linking to an existing inventory item
    service_description = fields.Str(validate=validate.Length(max=255), allow_none=True) # For custom services/items
    quantity = fields.Int(required=True, validate=validate.Range(min=1))
    unit_price = fields.Decimal(required=True, places=2, as_string=True) # Price at the time of billing
    sub_total = fields.Decimal(dump_only=True, places=2, as_string=True) # Calculated: quantity * unit_price
    
    # For dumping related data (optional, when fetching a bill)
    inventory_item = fields.Nested(InventoryItemSchema, dump_only=True, only=("id", "name"))

    @post_load
    def validate_item_type(self, data, **kwargs):
        if data.get('inventory_item_id') is None and not data.get('service_description'):
            raise validate.ValidationError(
                "Each bill item must have either an 'inventory_item_id' or a 'service_description'.",
                field_names=['inventory_item_id', 'service_description']
            )
        if data.get('inventory_item_id') and data.get('service_description'):
            raise validate.ValidationError(
                "A bill item cannot have both 'inventory_item_id' and 'service_description'. Choose one.",
                field_names=['inventory_item_id', 'service_description']
            )
        return data

class BillSchema(BaseSchema):
    patient_id = fields.Int(required=True)
    bill_date = fields.Date(missing=lambda: datetime.now(timezone.utc).date()) # Use 'missing' for load default
    total_amount = fields.Decimal(dump_only=True, places=2, as_string=True) # Typically calculated on the server
    payment_status = fields.Str(validate=validate.OneOf(['Unpaid', 'Paid', 'Partially Paid']), missing='Unpaid')
    notes = fields.Str(allow_none=True)
    bill_items = fields.List(fields.Nested(BillItemSchema), required=True, validate=validate.Length(min=1))
    
    # For dumping related data (optional)
    patient = fields.Nested(PatientSchema, dump_only=True, only=("id", "full_name"))
