/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

const { join } = require('path');
const listModuleDependencies = require('./utils/list.module.dependencies');
const listBundleContents = require('./utils/list.bundle.contents');
const parseObjectModule = require('./utils/parse.object.module');

module.exports = function (grunt) {
  grunt.registerMultiTask('languagepack', function () {
    const options = this.options({
      locale: 'en',
      bundles: [],
      bundleIndexes: {},
      inputDir: '../out-debug',
      outputDir: '../out-languagepack_en'
    });
    const linefeed = grunt.util.linefeed;
    const force = options.force;
    const locale = options.locale;
    const inputDir = options.inputDir;
    const outputDir = options.outputDir;
    const bundles = prepareBundles(options.bundles);
    const bundleIndexes = prepareBundleIndexes(options.bundleIndexes);
    const prefix = options.prefix || /^bundles\/(\w+)-/.exec(bundles[0].module)[1];

    try {
      getBundleIndexes()
      getBundleContent()
      filterBundleContent()
      writeAllBundles()
      writeAllBundleIndexes()
    } catch (error) {
      grunt.verbose.error(error.stack);
      grunt.log.error(error);
      const warn = force ? grunt.log.warn : grunt.fail.warn;
      warn('Processing bundles failed.');
    }
    function prepareBundles(bundles) {
      return bundles.map(({ name }) => ({ module: name }));
    }
    function prepareBundleIndexes(bundleIndexes) {
      return Object
        .keys(bundleIndexes)
        .map(name => ({
          index: name,
          content: bundleIndexes[name]
        }));
    }
    function filterBundleContent() {
      for (const bundle of bundles) {
        const localizables = new Set;
        for (const module of bundle.content) {
          for (const dep of module.deps) {
            if (dep.startsWith('i18n!')) {
              localizables.add(dep.substr(5));
            }
          }
        }
        bundle.content = bundle.content.filter(module => localizables.has(module.id));
        grunt.log.writeln(`Bundle ${bundle.module} contains ${bundle.content.length} localization modules.`);
      }
    }
    function writeAllBundles() {
      for (const bundle of bundles) {
        if (bundle.content.length) {
          writeBundle(bundle);
        }
      }
    }
    function writeBundle(bundle) {
      const lines = bundle.content.map(module => {
        const fileName = moduleID2FileName(module.id);
        const result = parseObjectModule(fileName);
        return `csui.define("${getLocalizedModuleName(module)}", ${JSON.stringify(result, undefined, 2)});${linefeed}`;
      });
      const fileName = bundle.module.replace('bundles/', `bundles/nls/${locale}/`);
      grunt.file.write(join(outputDir, `${fileName}.js`), lines.join(linefeed));
    }
    function writeAllBundleIndexes() {
      for (const bundleIndex of bundleIndexes) {
        writeBundleIndex(bundleIndex);
      }
    }
    function writeBundleIndex(bundleIndex) {
      let lines = [];
      for (const contentBundleName of bundleIndex.content) {
        const contentBundle = bundles.find(bundleName => bundleName.module === contentBundleName);
        if (lines.length) {
          lines[lines.length - 1] += ',';
        }
        lines = lines.concat(singleBundleAsIndex(contentBundle));
      }
      lines = ['{'].concat(lines).concat(['}']);

      const fileName = bundleIndex.index.replace('bundles/', `bundles/nls/${locale}/`);
      const jsonContents = lines.join(linefeed);
      grunt.file.write(join(outputDir, `${fileName}.json`), jsonContents);
      const jsContent = `csui.require.config({${linefeed}bundles: ${jsonContents}${linefeed}});`;
      grunt.file.write(join(outputDir, `${fileName}.js`), jsContent);
    }
    function singleBundleAsIndex(bundle) {
      const lines = [];
      const fileName = bundle.module.replace('bundles/', `bundles/nls/${locale}/`);

      lines.push(`  "${prefix}/${fileName}": [`);
      for (let i = 0, l = bundle.content.length; i < l; ++i) {
        const module = bundle.content[i];
        if (i > 0) {
          lines[lines.length - 1] += ',';
        }
        lines.push(`    "${getLocalizedModuleName(module)}"`);
      }
      lines.push('  ]');

      return lines;
    }
    function moduleID2FileName(moduleId) {
      const nameParts = moduleId.split('/');
      nameParts.shift();
      const fileName = nameParts.pop();
      if (nameParts[nameParts.length - 1] !== 'root') {
        nameParts.push('root');
      }
      nameParts.push(fileName + '.js');
      return nameParts.join('/');
    }
    function getLocalizedModuleName(module) {
      return module.id.replace('/nls/', `/nls/${locale}/`);
    }
    function getBundleContent() {
      for (const bundle of bundles) {
        grunt.verbose.writeln(`Loading ${bundle.module}...`);
        try {
          const result = listBundleContents(`${inputDir}/${bundle.module}.js`);
          bundle.content = result;
          grunt.verbose.writeln(`Bundle ${bundle.module} depends on ${bundle.content.length} modules.`);
        } catch (error) {
          grunt.verbose.error(error.stack);
          throw new Error(`When traversing dependencies of ${bundle.module}: ${error.message}`);
        }
      }
    }
    function getBundleIndexes() {
      for (const bundle of bundles) {
        const bundleFileName = `${bundle.module}.js`;
        bundle.index = listModuleDependencies(bundleFileName);
        grunt.verbose.writeln(
          `Bundle ${bundle.module} exposes ${bundle.index.length} modules.`);
      }
    }
  });
};
