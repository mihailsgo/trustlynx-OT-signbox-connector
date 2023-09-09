/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

var { readFileSync } = require('fs');

module.exports = function (grunt) {
  grunt.registerMultiTask('requirejsContentCheck',
    'Check that output bundles contain only modules with the specified prefix',
    function () {
      const options = this.options({
        bundleDir: '../out-debug',
        exceptions: [],
        force: false
      });
      const force = options.force;
      const bundleDir = options.bundleDir;
      const bundles = options.bundles.map(name =>
        typeof name !== 'string' ? `${bundleDir}/${name.name}.js` : name);
      const prefix = options.prefix ||
        /^bundles\/(\w+)-/.exec(bundles[0].substr(bundleDir.length + 1))[1];
      const exceptions = new Set(options.exceptions);

      try {
        const contents = getBundleContents();
        const result = checkBundleContents(contents);
        const all = Object.keys(bundles);
        const problems = Object.keys(result);
        if (problems.length) {
          throw new Error(`${all.length} bundles checked, ${problems.length} included foreign modules.`);
        }
        grunt.log.ok(`${all.length} bundles checked, all are correct.`);
      } catch (error) {
        grunt.verbose.error(error.stack);
        grunt.log.error(error);
        const warn = force ? grunt.log.warn : grunt.fail.warn;
        warn('Checking the bundle contants failed.');
      }
      function getBundleContents() {
        return bundles.reduce(function (result, bundle) {
          grunt.verbose.writeln(`Loading the bundle ${bundle}...`);
          result[bundle] = readFileSync(bundle, 'utf-8');
          return result;
        }, {});
      }
      function checkBundleContents(contents) {
        const moduleDeclaration = /csui\.define\(['"](?:[^\/'"]+!)?([^\/'"]+)(\/[^'"]+)?['"]/g;
        return Object
          .keys(contents)
          .reduce(function (result, bundle) {
            checkBundleContent(result, bundle);
            return result;
          }, {});

        function checkBundleContent (result, bundle) {
          grunt.verbose.writeln(`Checking content of the bundle ${bundle}...`);
          const content = contents[bundle];
          let match;
          while ((match = moduleDeclaration.exec(content))) {
            let [, module, suffix] = match; // module contains prefix only at first
            if (module !== prefix) {
              if (suffix) {
                module += suffix; // module contains the full name eventually
              }
              if (module.indexOf('bundles/') !== 0 && !exceptions.has(module)) {
                const resultBundle = result[bundle] || (result[bundle] = []);
                grunt.log.warn(`The bundle ${bundle} contains a foreign module ${module}.`);
                resultBundle.push(module);
              }
            }
          }
        }
      }
    });
};
