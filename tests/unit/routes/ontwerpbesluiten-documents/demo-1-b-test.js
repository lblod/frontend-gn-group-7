import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | ontwerpbesluiten-documents/demo-1-b', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:ontwerpbesluiten-documents/demo-1-b');
    assert.ok(route);
  });
});
