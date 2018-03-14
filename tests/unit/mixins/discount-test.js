import Ember from 'ember';
import DiscountMixin from 'hospitalrun/mixins/discount';
import { module, test } from 'qunit';

module('Unit | Mixin | discount');

// Replace this with your real tests.
test('it works', function(assert) {
  let DiscountObject = Ember.Object.extend(DiscountMixin);
  let subject = DiscountObject.create();
  assert.ok(subject);
});
