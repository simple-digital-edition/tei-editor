import or from './helper';

const { module, test } = QUnit;

module('Helper: or', function(hooks) {
  test('it computes', function(assert) {
    assert.equal(or([]), undefined);
  });
});
