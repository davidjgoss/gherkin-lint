var assert = require('chai').assert;
var linter = require('../../dist/linter.js');

describe('Linter', function() {
  it('detects up-to-one-background-per-file violations', function(done) {
    var expected = [{
      'line': '9',
      'message': 'Multiple "Background" definitions in the same file are disallowed',
      'rule': 'up-to-one-background-per-file'
    }];
    linter.lint(['test/linter/MultipleBackgrounds.feature']).then(actual => {
      assert.lengthOf(actual, 1);
      assert.deepEqual(actual[0].errors, expected);
      done();
    });
  });

  it('detects no-tags-on-backgrounds violations', function(done) {
    var expected = [{
      'line': '4',
      'message': 'Tags on Backgrounds are dissallowed',
      'rule': 'no-tags-on-backgrounds'
    }];
    linter.lint(['test/linter/TagOnBackground.feature']).then(actual => {
      assert.lengthOf(actual, 1);
      assert.deepEqual(actual[0].errors, expected);
      done();
    });
  });

  it('detects one-feature-per-file violations', function() {
    var expected = [{
      'line': '7',
      'message': 'Multiple "Feature" definitions in the same file are disallowed',
      'rule': 'one-feature-per-file'
    }];
    linter.lint(['test/linter/MultipleFeatures.feature']).then(actual => {
      assert.lengthOf(actual, 1);
      assert.deepEqual(actual[0].errors, expected);
    });
  });

  it('detects no-multiline-steps violations', function() {
    var expected = [{
      'line': '9',
      'message': 'Steps should begin with "Given", "When", "Then", "And" or "But". Multiline steps are dissallowed',
      'rule': 'no-multiline-steps'
    }];
    linter.lint(['test/linter/MultilineStep.feature']).then(actual => {
      assert.lengthOf(actual, 1);
      assert.deepEqual(actual[0].errors, expected);
    });
  });

  it('detects no-multiline-steps violations in backgrounds', function() {
    var expected = [{
      'line': '5',
      'message': 'Steps should begin with "Given", "When", "Then", "And" or "But". Multiline steps are dissallowed',
      'rule': 'no-multiline-steps'
    }];
    linter.lint(['test/linter/MultilineBackgroundStep.feature']).then(actual => {
      assert.lengthOf(actual, 1);
      assert.deepEqual(actual[0].errors, expected);
    });
  });

  it('detects no-multiline-steps violations in scenario outlines', function() {
    var expected = [{
      'line': '9',
      'message': 'Steps should begin with "Given", "When", "Then", "And" or "But". Multiline steps are dissallowed',
      'rule': 'no-multiline-steps'
    }];
    linter.lint(['test/linter/MultilineScenarioOutlineStep.feature']).then(actual => {
      assert.lengthOf(actual, 1);
      assert.deepEqual(actual[0].errors, expected);
    });
  });

  it('detects no-examples-in-scenarios violations', function() {
    var expected = [{
      'line': '6',
      'message': 'Cannot use "Examples" in a "Scenario", use a "Scenario Outline" instead',
      'rule': 'no-examples-in-scenarios'
    }];
    linter.lint(['test/linter/ExampleInScenario.feature']).then(actual => {
      assert.lengthOf(actual, 1);
      assert.deepEqual(actual[0].errors, expected);
    });
  });

  it('detects additional violations that happen after the \'no-tags-on-backgrounds\' rule', function() {
    var expected = [
      {
        message: 'Steps should begin with "Given", "When", "Then", "And" or "But". Multiline steps are dissallowed',
        rule: 'no-multiline-steps',
        line: '13' },
      {
        message: 'Tags on Backgrounds are dissallowed',
        rule: 'no-tags-on-backgrounds',
        line: '4'
      }
    ];
    linter.lint(['test/linter/MultipleViolations.feature'], {}).then(actual => {
      assert.deepEqual(actual[0].errors, expected);
    });
  });

  it('correctly parses files that have the correct Gherkin format', function(done) {
    linter.lint(['test/linter/NoViolations.feature'], {}).then(result => {
      assert.lengthOf(result, 1);
      assert.isEmpty(result[0].errors);
      done();
    });
  });
});
