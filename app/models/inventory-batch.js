import AbstractModel from 'hospitalrun/models/abstract';
import Ember from 'ember';
import DS from 'ember-data';
import Discount from 'hospitalrun/mixins/discount';
import NumberFormat from 'hospitalrun/mixins/number-format';

/**
 * Model to represent a request for inventory items.
 */
export default AbstractModel.extend(Discount, NumberFormat, {

  paymentMethod: DS.attr('string', { defaultValue: 'Cash' }),

  haveInvoiceItems() {
    let invoiceItems = this.get('invoiceItems');
    return !Ember.isEmpty(invoiceItems);
  },

  purchaseCost: Ember.computed('costPerUnit', 'quantity', function() {
    return this._numberFormat(this._purchaseCost(this), true);
  }),

  needsPaymentInfo: Ember.computed('paymentMethod', function() {
    let paymentMethod = this.get('paymentMethod');
    return !Ember.isEmpty(paymentMethod) && paymentMethod !== 'P.O.S';
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
    }
  }
});
