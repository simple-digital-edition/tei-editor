import booleanStr from './helper';

const { module, test } = QUnit;

module('Helper: boolean-str', function(hooks) {
  test('it computes', function(assert) {
    assert.equal(booleanStr([]), undefined);
  });
});
