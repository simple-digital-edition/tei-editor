import get from './helper';

const { module, test } = QUnit;

module('Helper: get', function(hooks) {
  test('it computes', function(assert) {
    assert.equal(get([]), undefined);
  });
});
