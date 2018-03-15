import Ember from 'ember';
import SelectValues from 'hospitalrun/utils/select-values';

export default Ember.Mixin.create({
  paymentMethods: SelectValues.selectValues([
    'Cash',
    'P.O.S',
    'Cheque',
    'Transfer'
  ]),

  needsPaymentInfo: Ember.computed('paymentMethod', function() {
    return !Ember.isEmpty(this.get('paymentMethod'))
           && this.get('paymentMethod') !== 'P.O.S';
  })
});
