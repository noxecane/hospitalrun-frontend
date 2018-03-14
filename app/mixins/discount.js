import Ember from 'ember';
import NumberFormat from 'hospitalrun/mixins/number-format';

export default Ember.Mixin.create(NumberFormat, {
  _purchaseCost(item, quantityName = 'quantity') {
    let costPerUnit = parseInt(Ember.get(item, 'costPerUnit'));
    let quantity = parseInt(Ember.get(item, quantityName));
    // Optimization: if x === undefined or x === null then !(x > 0) === true
    if (!(costPerUnit > 0) || !(quantity > 0)) {
      return 0;
    }
    return this._numberFormat(costPerUnit * quantity, true);
  }
});
