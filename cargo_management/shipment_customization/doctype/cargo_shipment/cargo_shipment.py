import frappe
from cargo_management.utils import get_list_from_child_table
from frappe.model.document import Document


class CargoShipment(Document):

    def on_update(self):
        """ Add Departure Date to all Warehouse Receipt Linked """
        # TODO: What if cargo shipment is deleted?

        frappe.db.sql("UPDATE `tabWarehouse Receipt` SET departure_date = %(date)s WHERE name IN %(wrs)s", {
            'date': self.departure_date,
            'wrs': get_list_from_child_table(self.cargo_shipment_lines, 'warehouse_receipt')
        })

    def change_status(self, new_status):
        """ Validates the current status of the cargo shipment and change it if it's possible. """
        # TODO: Validate this when status is changed on Form-View or List-View

        # TODO: Finish
        if self.status != new_status and \
                (self.status == 'Awaiting Departure' and new_status == 'In Transit') or \
                (self.status in ['Awaiting Departure', 'In Transit'] and new_status == 'Sorting'):
            self.status = new_status
            return True

        return False
