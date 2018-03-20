import { moduleFor, test } from 'ember-qunit';

moduleFor('service:delog', 'Unit | Service | delog', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});

test('it clears correctly', function(assert) {
  let service = this.subject();

  service.write(1);
  service.write(1);

  service.clear();
  assert.equal(service.logs(), []);
});

test('it receives logs', function(assert) {
  let service = this.subject();

  service.write(1);
  service.write(1);
  service.write(1);

  assert.equal(service.logs(), [1, 1, 1]);

  service.clear();
});