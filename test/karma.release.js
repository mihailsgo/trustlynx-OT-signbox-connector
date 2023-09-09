'use strict';

const getCommonSettings = require('./karma.common');

module.exports = function (config) {
  var environment = process.env,
      settings = getCommonSettings(config);

  var reporters = environment.KARMA_REPORTERS || 'mocha,html';
  reporters = reporters.split(',');

  Object.assign(settings, {
    // list of files / patterns to load in the browser
    files: [
      'lib/release/nuc/bundles/nuc-loader.js',
      'lib/release/nuc/bundles/nuc-index.js',
      'lib/release/smart/bundles/smart-index.js',
      'lib/release/smart/bundles/smart-all.js',
      'lib/release/csui/bundles/csui-app-index.js',
      'out-release/bundles/dmss-index.js',
      // The RequireJS configuration for the tests
      'test/test-release.js',
      // Force Karma to wait for a call to __karma__.start after all specs
      // were defined by letting the adapter patch RequireJS from Nucleus.
      'node_modules/karma-requirejs/lib/adapter.js',
      'test/test-no-global-require.js',
      'test/test-common.js',
      // Karma's internal web server needs to know every file which
      // will be loaded by the tests or by AJAX; including the CS UI
      // dependencies
      {pattern: 'out-release/**/*.js', included: false, nocache: true},
      {pattern: 'out-release/**/*.map', included: false, nocache: true},
      {pattern: 'out-release/**/*.json', included: false, nocache: true},
      {pattern: 'out-release/**/*.css', included: false, nocache: true},
      {pattern: 'src/**/test/*.js', included: false, nocache: true},
      //{pattern: 'src/**/test/*.json', included: false, nocache: true},
      {pattern: 'lib/release/nuc/**/*.js', included: false, nocache: true},
      {pattern: 'lib/release/nuc/**/*.map', included: false, nocache: true},
      {pattern: 'lib/release/nuc/**/*.json', included: false, nocache: true},
      {pattern: 'lib/release/smart/**/!(*.spec).js', included: false, nocache: true},
      {pattern: 'lib/release/smart/**/*.json', included: false, nocache: true},
      {pattern: 'lib/release/smart/bundles/smart-all.css', included: false, nocache: true},
      {pattern: 'lib/release/smart/**/*.css', included: false, nocache: true},
      {pattern: 'lib/src/smart/**/!(*.spec).js', included: false, nocache: true},
      {pattern: 'lib/src/smart/**/*.json', included: false, nocache: true},
      {pattern: 'lib/src/smart/**/*.hbs', included: false, nocache: true},
      {pattern: 'lib/src/smart/**/*.css', included: false, nocache: true},
      {pattern: 'lib/release/csui/**/*.js', included: false, nocache: true},
      {pattern: 'lib/release/csui/**/*.map', included: false, nocache: true},
      {pattern: 'lib/release/csui/**/*.css', included: false, nocache: true},
      {pattern: 'lib/release/csui/**/*.json', included: false, nocache: true},
      {pattern: 'lib/release/csui/**/*.svg', included: false, nocache: true},
      {pattern: 'lib/release/csui/**/*.woff', included: false, nocache: true},
      {pattern: 'lib/release/csui/**/*.woff2', included: false, nocache: true}
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'spec', 'junit', 'growl', 'coverage'
    reporters: reporters,

    // configure the reporters
    htmlReporter: {
      outputDir : 'release/results'
    }
  });

  config.set(settings);
};
