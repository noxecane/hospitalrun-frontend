import Ember from 'ember';
import SelectValues from 'hospitalrun/utils/select-values';

export default Ember.Mixin.create({
  paymentMethods: SelectValues.selectValues([
    'Cash',
    'P.O.S',
    'Cheque',
    'Transfer'
  ])
});
