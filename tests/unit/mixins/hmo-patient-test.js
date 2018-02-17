import Ember from 'ember';
import HmoPatientMixin from 'hospitalrun/mixins/hmo-patient';
import { module, test } from 'qunit';

module('Unit | Mixin | hmo patient');

// Replace this with your real tests.
test('it works', function(assert) {
  let HmoPatientObject = Ember.Object.extend(HmoPatientMixin);
  let subject = HmoPatientObject.create();
  assert.ok(subject);
});
