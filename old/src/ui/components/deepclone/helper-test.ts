import deepclone from './helper';

const { module, test } = QUnit;

module('Helper: deepclone', function(hooks) {
  test('it computes', function(assert) {
    assert.equal(deepclone([]), undefined);
  });
});
