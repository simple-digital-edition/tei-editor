import set from './helper';

const { module, test } = QUnit;

module('Helper: set', function(hooks) {
  test('it computes', function(assert) {
    assert.equal(set([]), undefined);
  });
});
