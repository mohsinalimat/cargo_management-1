function calculate_package_total(frm) {
    let content_amount = frm.get_sum('content', 'amount');  // Using some built-in function: get_sum()
    frm.doc.total = (frm.doc.has_shipping) ? content_amount + frm.doc.shipping_amount : content_amount;  // Calculate the 'total' field on Package Doctype(Parent)

    frm.refresh_fields();  // Refresh all fields. FIXME: Maybe is not the better way..
}

function calculate_package_content_amount_and_package_total(frm, cdt, cdn) {
    // Calculates the 'amount' field on Package Content Doctype(Child) and 'total' field on Package Doctype(Parent)
    let content_row = locals[cdt][cdn]; // Getting Child Row

    content_row.amount = content_row.qty * content_row.rate;  // Calculating amount in eddited row

    calculate_package_total(frm); // Calculate the parent 'total' field and trigger events.
}

// todo: MATCH the new and current fields!! import_price for example
// TODO: Tracking Validator from backend and Carrier Select helper.

frappe.ui.form.on('Package', {

    onload: function(frm) {
        // Setting custom queries
        frm.set_query('item_code', 'content', () => {
            return {
                filters: {
                    'is_sales_item': true,
                    'has_variants': false
                }
            }
        });

        // Setting Currency Labels
        frm.set_currency_labels(['total', 'shipping_amount'], 'USD');
        frm.set_currency_labels(['rate', 'amount'], 'USD', 'content');
    },

    refresh: function(frm) {
        if (frm.is_new()) {
            return;
        }

        // Better to add button here to use: 'window'. Rather than as Server Side Action Button on Doctype.
        frm.add_custom_button(__('Visit carrier detail page'), () => {
            frappe.call({
                method: 'cargo_management.package_management.doctype.package.actions.get_carrier_detail_page_url',
                args: {carrier: frm.doc.carrier},
                freeze: true,
                freeze_message: __('Opening detail page...'),
                callback: (r) => {
                    window.open(r.message + frm.doc.tracking_number, '_blank');
                }
            });
        });

        // Detailed Status Message
        frappe.call({
            method: 'cargo_management.package_management.doctype.package.actions.get_explained_status',
            args: {source_name: frm.doc.name},
            callback: (r) => {
                if (Array.isArray(r.message.message)) { // If there are multiple messages.
                    r.message.message = r.message.message.map(message => '<div>' + message + '</div>').join('');
                }

                // FIXME: Override default color layout set in core: layout.js -> show_message()
                frm.set_intro(r.message.message, ''); // Core only allows blue and yellow
                frm.layout.message.removeClass().addClass('form-message ' + r.message.color); // This allow to have same color on indicator, dot and alert..
            }
        });

        // TODO: Finish The Progress Bar -> frm.dashboard.add_progress("Status", []
    },

    has_shipping: function (frm) {
        if (!frm.doc.has_shipping) {
            frm.doc.shipping_amount = 0; // Empty the value of the field.
        }
        calculate_package_total(frm);
    },

    shipping_amount: function (frm) {
        calculate_package_total(frm);
    }
});

// Children Doctype of Package
frappe.ui.form.on('Package Content', {
    content_remove(frm) {
        calculate_package_total(frm);
    },

    rate: function(frm, cdt, cdn) {
        calculate_package_content_amount_and_package_total(frm, cdt, cdn);
    },

    qty: function(frm, cdt, cdn) {
        calculate_package_content_amount_and_package_total(frm, cdt, cdn);
    }
});
