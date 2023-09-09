/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

const { join } = require('path');
const parseBuildConfig = require('./utils/parse.build.config');
const listModuleDependencies = require('./utils/list.module.dependencies');
const listBundleContents = require('./utils/list.bundle.contents');

module.exports = function (grunt) {
  grunt.registerMultiTask('requirejsDependencyCheck',
    'Check if your modules depend only on public modules from other components',
    function () {
      const options = this.options({
        appDir: '.',
        bundleDir: '../out-debug',
        bundles: [],
        dependencies: [],
        config: 'config-build.js',
        allowIndexedPrivateModules: false,
        force: false
      });
      const force = options.force;
      const appDir = options.appDir;
      const bundleDir = options.bundleDir;
      const bundles = options.bundles.map(name => ({ module: name.name }));
      const dependencies = options.dependencies;
      const prefix = options.prefix || /^bundles\/(\w+)-/.exec(bundles[0].module)[1];
      let config = options.config;
      let failed, warned, csuiMap;
      if (typeof config === 'string') {
        config = parseBuildConfig(config);
      }
      csuiMap = config.map && config.map['*'] || {};
      config.dir || (config.dir = appDir);
      try {
        getBundleIndexes();
        getBundleContent();
        checkModuleDependencies();
        if (failed) {
          throw new Error('At least one module depends on a private module from other component.');
        }
        if (warned) {
          grunt.log.warn('Checking module dependencies ended with warnings.');
        } else {
          grunt.log.ok('Checking module dependencies succeeded.');
        }
      } catch (error) {
        grunt.verbose.error(error.stack);
        grunt.log.error(error);
        const warn = force ? grunt.log.warn : grunt.fail.warn;
        warn('Checking module dependencies failed.');
      }
      function getBundleIndexes() {
        for (const bundle of bundles) {
          grunt.verbose.writeln(`Getting the index of ${bundle.module}...`);
          const bundleFileName = join(appDir, `${bundle.module}.js`);
          bundle.index = listModuleDependencies(bundleFileName);
          grunt.verbose.writeln(`Bundle ${bundle.module} exposes ${bundle.index.length} modules.`);
        }
      }
      function getBundleContent() {
        for (const bundle of bundles) {
          grunt.verbose.writeln(`Loading ${bundle.module}...`);
          try {
            bundle.content = listBundleContents(`${bundleDir}/${bundle.module}.js`);
            for (const module of bundle.content) {
              module.exposed = bundle.index.includes(module.id);
            }
            grunt.verbose.writeln(`Bundle ${bundle.module} depends on ${bundle.content.length} modules.`);
          } catch (error) {
            grunt.verbose.error(error.stack);
            throw new Error(`When traversing dependencies of ${bundle.module}: ${error.message}`);
          }
        }
        return bundles;
      }
      function checkModuleDependencies() {
        var currentPrefix = prefix + '/';
        for (const bundle of bundles) {
          for (const module of bundle.content
              .filter(({ id, deps }) =>
                deps && id.includes('/') &&
                  !id.includes('!') && id.startsWith(currentPrefix))) {
            for (const dependency of module.deps
                .filter(dependency =>
                  dependency.includes('/') &&
                    !dependency.includes('!') &&
                    !dependency.startsWith(currentPrefix))) {
              if (!dependencies.includes(dependency) &&
                  dependency.startsWith('csui/') && !csuiMap[dependency]) {
                grunt.log.warn(`Module ${module.id} depends on ${dependency}, which is not public; it does not occur in any foreign bundle index.`);
                failed = true;
              } else if (dependency.includes('/impl/')) {
                let logMethod;
                if (options.allowIndexedPrivateModules) {
                  logMethod = 'ok';
                  warned = true;
                } else {
                  logMethod = 'warn';
                  failed = true;
                }
                grunt.log[logMethod](`Module ${module.id} depends on ${dependency}, which is private; it does occur in a foreign bundle index, but it is not guaranteed and can be removed anytime.`);
              }
            }
          }
        }
      }
    });
};
