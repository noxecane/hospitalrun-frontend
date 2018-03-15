import Ember from 'ember';

export default Ember.Mixin.create({
  _purchaseCost(item, quantityName = 'quantity') {
    let costPerUnit = parseFloat(Ember.get(item, 'costPerUnit'));
    let quantity = parseInt(Ember.get(item, quantityName));
    let discount = parseFloat(Ember.get(item, 'discount'));
    // Optimization: if x === undefined or x === null then !(x > 0) === true
    if (!(costPerUnit > 0) || !(quantity > 0)) {
      return 0;
    }
    if (discount > 0) {
      let total = costPerUnit * quantity;
      return total - (total * (discount / 100));
    } else {
      return costPerUnit * quantity;
    }
  }
});
