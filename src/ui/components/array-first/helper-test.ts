import arrayFirst from './helper';

const { module, test } = QUnit;

module('Helper: array-first', function(hooks) {
  test('it computes', function(assert) {
    assert.equal(arrayFirst([]), undefined);
  });
});
