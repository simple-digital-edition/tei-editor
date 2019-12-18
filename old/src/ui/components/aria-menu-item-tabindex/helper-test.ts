import ariaMenuItemTabindex from './helper';

const { module, test } = QUnit;

module('Helper: ariaMenuItemTabindex', function(hooks) {
  test('it computes', function(assert) {
    assert.equal(ariaMenuItemTabindex([]), undefined);
  });
});
