/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

const { readFileSync } = require('fs');
const { join } = require('path');
const listModuleDependencies = require('./utils/list.module.dependencies');

module.exports = function (grunt) {
  grunt.registerMultiTask('requirejsIndexCheck',
    'Check if modules from the bundle index module are bundled in the same bundle',
    function () {
      const options = this.options({
        appDir: '.',
        output: '../out-debug',
        bundles: [],
        force: false
      });
      const force = options.force;
      const sourceRoot = options.appDir;
      const output = options.output;
      const bundles = options.bundles.map(name =>
        typeof name !== 'string' ? { module: name.name } : { module: name });
      let failed;
      try {
        getBundleIndexes();
        getBundleContent();
        checkBundleContents();
        if (failed) {
          throw new Error('At least one module was declared in a bundle index, but it was not included in the output of that bundle. Probably modules from other bundle on a lower level depend on it too and pulled it to that bundle.');
        }
        grunt.log.ok('Checking declared modules in bundle indexes succeeded.');
      } catch (error) {
        grunt.verbose.error(error.stack);
        grunt.log.error(error);

        const warn = force ? grunt.log.warn : grunt.fail.warn;
        warn('Checking declared modules in bundle indexes failed.');
      }
      function getBundleIndexes() {
        grunt.verbose.writeln('Getting bundle indexes...');
        for (const bundle of bundles) {
          grunt.verbose.writeln(`Getting the index of ${bundle.module}...`);
          const bundleFileName = join(sourceRoot, `${bundle.module}.js`);
          bundle.index = listModuleDependencies(bundleFileName);
          grunt.verbose.writeln(
            `Bundle ${bundle.module} exposes ${bundle.index.length} modules.`);
        }
      }
      function getBundleContent() {
        for (const bundle of bundles) {
          grunt.verbose.writeln(`Loading ${bundle.module}...`);
          const bundleFilePath = join(output, `${bundle.module}.js`);
          bundle.content = readFileSync(bundleFilePath, 'utf-8');
        }
      }
      function checkBundleContents() {
        for (const bundle of bundles) {
          checkBundleContent(bundle);
        }
      }
      function checkBundleContent(bundle) {
        grunt.verbose.writeln(
          `Checking declared content of ${bundle.module}...`);
        for (const referenceName of bundle.index) {
          if (referenceName.endsWith('!')) {
            referenceName = referenceName.substr(0, referenceName.length - 1);
          }
          let moduleDeclaration = new RegExp(
            `csui\\.define\\(\\s*['"]${referenceName}['"]`, 'm');
          if (!moduleDeclaration.test(bundle.content)) {
            const moduleName = referenceName.replace(/^[^!]+!(.+)$/, '$1');
            moduleDeclaration = new RegExp(
              `csui\\.define\\(\\s*['"]${moduleName}['"]`, 'm');
            if (!moduleDeclaration.test(bundle.content)) {
              grunt.log.warn(`Module ${referenceName} is declared in the bundle index ${bundle.module}, but not found in the bundle content.`);
              failed = true;
            }
          }
        }
      }
    });
};
