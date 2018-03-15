import Ember from 'ember';
import PaymentMethodMixin from 'hospitalrun/mixins/payment-method';
import { module, test } from 'qunit';

module('Unit | Mixin | payment method');

// Replace this with your real tests.
test('it works', function(assert) {
  let PaymentMethodObject = Ember.Object.extend(PaymentMethodMixin);
  let subject = PaymentMethodObject.create();
  assert.ok(subject);
});
