import AbstractModel from 'hospitalrun/models/abstract';
import DS from 'ember-data';
import Ember from 'ember';

const { computed, get } = Ember;

export default AbstractModel.extend({
  // Attributes
  amount: DS.attr('number'),
  /* Is patient a charity case */
  charityPatient: DS.attr('boolean'),
  datePaid: DS.attr('date'),
  expenseAccount: DS.attr('string'),
  notes: DS.attr('string'),
  reasons: DS.attr(),
  paymentType: DS.attr('string'),
  paymentMethod: DS.attr('string', { defaultValue: 'Cash' }),
  paymentInfo: DS.attr('string'),

  // Associations
  invoice: DS.belongsTo('invoice', { async: false }),

  canRemovePayment: computed('paymentType', function() {
    return get(this, 'paymentType') === 'Deposit';
  }),

  needsPaymentInfo: computed('paymentMethod', function() {
    let paymentMethod = this.get('paymentMethod');
    return !Ember.isEmpty(paymentMethod) && paymentMethod !== 'P.O.S';
  }),

  formattedReasons: computed('reasons', function() {
    let reasons = this.get('reasons');
    if (!Ember.isEmpty(reasons)) {
      return reasons.join(', ');
    }
    return '';
  }),

  validations: {
    amount: {
      numericality: true
    },
    datePaid: {
      presence: true
    },
    paymentMethod: {
      presence: true
    }
  }
});
