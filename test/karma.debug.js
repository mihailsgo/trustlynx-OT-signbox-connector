'use strict';

const getCommonSettings = require('./karma.common');

module.exports = function (config) {
  var environment = process.env,
      settings = getCommonSettings(config);

  var reporters = environment.KARMA_REPORTERS || 'mocha,html,coverage';
  reporters = reporters.split(',');

  var preprocessors = reporters.indexOf('coverage') < 0 ? undefined : {
    // source files, that you wanna generate coverage for
    // do not include tests or libraries
    // (these files will be instrumented by Istanbul)
    'src/**/!(test)/*.js': ['coverage']
  };

  Object.assign(settings, {
    // list of files / patterns to load in the browser
    files: [
      'lib/src/nuc/lib/require.js',
      'lib/src/nuc/config.js',
      'lib/src/smart/config.js',
      'lib/src/csui/helpers.js',
      // The RequireJS configuration for the tests
      'test/test-debug.js',
      // Force Karma to wait for a call to __karma__.start after all specs
      // were defined by letting the adapter patch RequireJS from Nucleus.
      'node_modules/karma-requirejs/lib/adapter.js',
      'test/test-common.js',
      // Karma's internal web server needs to know every file which
      // will be loaded by the tests or by AJAX; including the CS UI
      // dependencies
      {pattern: 'src/**/*.js', included: false, nocache: true},
      {pattern: 'src/**/*.json', included: false, nocache: true},
      {pattern: 'src/**/*.hbs', included: false, nocache: true},
      {pattern: 'src/**/*.css', included: false, nocache: true},
      {pattern: 'lib/src/nuc/**/!(*.spec.js)', included: false, nocache: true},
      {pattern: 'lib/src/smart/**/!(*.spec).js', included: false, nocache: true},
      {pattern: 'lib/src/smart/**/*.json', included: false, nocache: true},
      {pattern: 'lib/src/smart/**/*.hbs', included: false, nocache: true},
      {pattern: 'lib/src/smart/**/*.css', included: false, nocache: true},
      {pattern: 'lib/src/csui/**/!(*.spec.js)', included: false, nocache: true}
    ],

    // let non-testing sources be pre-processed for the code coverage check
    preprocessors: preprocessors,

    // test results reporter to use
    // possible values: 'dots', 'progress', 'spec', 'junit', 'growl', 'coverage'
    reporters: reporters,

    // configure the reporters
    coverageReporter: {
      type: 'html',
      dir : 'test/debug/coverage'
    },
    htmlReporter: {
      outputDir : 'debug/results'
    }
  });

  config.set(settings);
};
