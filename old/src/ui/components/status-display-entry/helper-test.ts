import statusDisplayEntry from './helper';

const { module, test } = QUnit;

module('Helper: status-display-entry', function(hooks) {
  test('it computes', function(assert) {
    assert.equal(statusDisplayEntry([]), undefined);
  });
});
