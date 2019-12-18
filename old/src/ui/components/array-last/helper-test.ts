import arrayLast from './helper';

const { module, test } = QUnit;

module('Helper: array-last', function(hooks) {
  test('it computes', function(assert) {
    assert.equal(arrayLast([]), undefined);
  });
});
