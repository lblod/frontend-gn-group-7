import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | documents/show/publish/notulen', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:documents/show/publish/notulen');
    assert.ok(route);
  });
});
