import join from './helper';

const { module, test } = QUnit;

module('Helper: join', function(hooks) {
  test('it computes', function(assert) {
    assert.equal(join([]), undefined);
  });
});
