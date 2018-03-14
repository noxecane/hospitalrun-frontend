import AbstractModel from 'hospitalrun/models/abstract';
import Ember from 'ember';
import Discount from 'hospitalrun/mixins/discount';

/**
 * Model to represent a request for inventory items.
 */
export default AbstractModel.extend(Discount, {
  haveInvoiceItems() {
    let invoiceItems = this.get('invoiceItems');
    return !Ember.isEmpty(invoiceItems);
  },

  purchaseCost: Ember.computed('costPerUnit', 'quantity', function() {
    return this._purchaseCost(this);
  }),

  validations: {
    dateReceived: {
      presence: true
    },
    inventoryItemTypeAhead: {
      presence: {
        unless(object) {
          return object.haveInvoiceItems();
        }
      }
    },
    costPerUnit: {
      numericality: {
        greaterThan: 0,
        messages: {
          greaterThan: 'must be greater than 0'
        },
        unless(object) {
          return object.haveInvoiceItems();
        }
      }
    },
    quantity: {
      numericality: {
        greaterThan: 0,
        messages: {
          greaterThan: 'must be greater than 0'
        },
        unless(object) {
          return object.haveInvoiceItems();
        }
      }
    },
    vendor: {
      presence: true
    }
  }
});
