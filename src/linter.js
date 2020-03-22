var fs = require('fs');
var _ = require('lodash');
var Gherkin = require('gherkin').default;
var messages = require('cucumber-messages').messages;
var streamPromise = require('stream-promise');
var rules = require('./rules.js');

function readAndParseFile(fileName) {
  var fileContent = fs.readFileSync(fileName, 'utf-8');
  var file = {
    name: fileName,
    lines: fileContent.split(/\r\n|\r|\n/)
  };
  var gherkinMessageStream = Gherkin.fromSources([
    messages.Envelope.create({
      source: {
        data: fileContent,
        media: {
          contentType: 'text/x.cucumber.gherkin+plain',
          encoding: messages.Media.Encoding.UTF8,
        },
        uri: fileName,
      },
    })
  ], {
    includeSource: false,
    includeGherkinDocument: true,
    includePickles: false
  });
  return streamPromise(gherkinMessageStream).then(response => {
    var feature = response[0].gherkinDocument.feature || {};
    return {feature, file};
  });
}

function lint(files, configuration, additionalRulesDirs) {
  var completion = files.map(function (fileName) {
    return readAndParseFile(fileName)
      .then(({feature, file}) => {
        return rules.runAllEnabledRules(feature, file, configuration, additionalRulesDirs);
      }, e => {
        if (e.errors) {
          return processFatalErrors(e.errors);
        } else {
          throw e;
        }
      })
      .then(errors => {
        var fileBlob = {filePath: fs.realpathSync(fileName), errors: _.sortBy(errors, 'line')};
        return fileBlob;
      });
  });
  return Promise.all(completion);
}

function processFatalErrors(errors) {
  var errorMsgs = [];
  if (errors.length > 1) {
    var result = getFormatedTaggedBackgroundError(errors);
    errors = result.errors;
    errorMsgs = result.errorMsgs;
  }
  errors.forEach(function (error) {
    errorMsgs.push(getFormattedFatalError(error));
  });
  return errorMsgs;
}

function getFormatedTaggedBackgroundError(errors) {
  var errorMsgs = [];
  var index = 0;
  if (errors[0].message.indexOf('got \'Background') > -1 &&
    errors[1].message.indexOf('expected: #TagLine, #ScenarioLine, #ScenarioOutlineLine, #Comment, #Empty') > -1) {

    errorMsgs.push({
      message: 'Tags on Backgrounds are dissallowed',
      rule: 'no-tags-on-backgrounds',
      line: errors[0].message.match(/\((\d+):.*/)[1]
    });

    index = 2;
    for (var i = 2; i < errors.length; i++) {
      if (errors[i].message.indexOf('expected: #TagLine, #ScenarioLine, #ScenarioOutlineLine, #Comment, #Empty') > -1) {
        index = i + 1;
      } else {
        break;
      }
    }
  }
  return {errors: errors.slice(index), errorMsgs: errorMsgs};
}

function getFormattedFatalError(error) {
  var errorLine = error.message.match(/\((\d+):.*/)[1];
  var errorMsg;
  var rule;
  if (error.message.indexOf('got \'Background') > -1) {
    errorMsg = 'Multiple "Background" definitions in the same file are disallowed';
    rule = 'up-to-one-background-per-file';
  } else if (error.message.indexOf('got \'Feature') > -1) {
    errorMsg = 'Multiple "Feature" definitions in the same file are disallowed';
    rule = 'one-feature-per-file';
  } else if (error.message.indexOf('expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #ScenarioOutlineLine, #Comment, #Empty, got \'Examples:\'') > -1) {
    errorMsg = 'Cannot use "Examples" in a "Scenario", use a "Scenario Outline" instead';
    rule = 'no-examples-in-scenarios';
  } else if (error.message.indexOf('expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ScenarioLine, #ScenarioOutlineLine, #Comment, #Empty, got') > -1 ||
    error.message.indexOf('expected: #EOF, #TableRow, #DocStringSeparator, #StepLine, #TagLine, #ExamplesLine, #ScenarioLine, #ScenarioOutlineLine, #Comment, #Empty, got') > -1) {
    errorMsg = 'Steps should begin with "Given", "When", "Then", "And" or "But". Multiline steps are dissallowed';
    rule = 'no-multiline-steps';

  } else {
    errorMsg = error.message;
    rule = 'unexpected-error';
  }
  return {
    message: errorMsg,
    rule: rule,
    line: errorLine
  };
}

module.exports = {
  lint: lint,
  readAndParseFile: readAndParseFile
};
