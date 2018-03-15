import AbstractModel from 'hospitalrun/models/abstract';
import Ember from 'ember';
import DS from 'ember-data';
import Discount from 'hospitalrun/mixins/discount';
import NumberFormat from 'hospitalrun/mixins/number-format';
import PaymentMethod from 'hospitalrun/mixins/payment-method';

/**
 * Model to represent a request for inventory items.
 */
export default AbstractModel.extend(Discount, PaymentMethod, NumberFormat, {
  paymentMethod: DS.attr('string', { defaultValue: 'Cash' }),

  haveInvoiceItems() {
    let invoiceItems = this.get('invoiceItems');
    return !Ember.isEmpty(invoiceItems);
  },

  purchaseCost: Ember.computed('costPerUnit', 'quantity', function() {
    return this._numberFormat(this._purchaseCost(this), true);
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
    },
    paymentMethod: {
      presence: true
    },
    paymentInfo: {
      presence: {
        unless(object) {
          return !Ember.get(object, 'needsPaymentInfo');
        }
      }
    }
  }
});
