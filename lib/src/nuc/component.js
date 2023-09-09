/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


var _    = require('underscore'),
    fs   = require('fs'),
    os   = require('os'),
    path = require('path');

var
    bundlePrefix = 'nuc',
    bundleNames  = ['nuc-loader', 'nuc-libraries', 'nuc-models', 'nuc-log4javascript'],
    bundlePath   = path.join(__dirname, 'bundles');

function loadBundleIndex(bundlePath, bundlePrefix) {
  var bundleLines  = fs.readFileSync(bundlePath)
          .toString()
          .split(/\r?\n/),
      firstLine    = _.indexOf(bundleLines, 'define(['),
      lastLine     = _.indexOf(bundleLines, '], {});'),
      bundleSource = bundleLines
          .slice(firstLine + 1, lastLine)
          .filter(function (line) {
            return !(/^\s*$/.test(line) || /^\s*\/\//.test(line));
          })
          .join(os.EOL)
          .replace(/'/g, '"')
          .replace(/,\s*$/g, ''),
      bundleName   = path.basename(bundlePath).replace(/\.\w+$/, ''),
      bundleIndex  = {},
      bundleModules;
  try {
    bundleModules = JSON.parse('[' + bundleSource + ']');
  } catch (error) {
    console.error('Parsing "' + bundlePath + '" failed:', '[' + bundleSource + ']');
    throw error;
  }
  bundleIndex[bundlePrefix + '/bundles/' + bundleName] = bundleModules;
  return bundleIndex;
}

function getAllComponentModules(bundleNames, bundlePath, bundlePrefix) {
  var modules = _.chain(bundleNames)
      .reduce(function (result, bundleName) {
        var filePath = path.join(bundlePath, bundleName) + '.js',
            bundle   = loadBundleIndex(filePath, bundlePrefix);
        _.defaults(result, bundle);
        return result;
      }, {})
      .values()
      .flatten()
      .unique()
      .value();
  return modules;
}

module.exports = {
  getAllComponentModules: getAllComponentModules,
  loadBundleIndex: loadBundleIndex,
  getBundleNames: function () {
    return bundleNames.slice();
  },
  getAllModules: function () {
    return getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  },
  getAllRequireJsPlugins: function () {
    return ['css', 'csui-ext', 'hbs', 'i18n', 'json', 'less', 'txt'];
  },
  getRequireJsPluginPaths: function () {
    return {
      'css': 'lib/css',
      'csui-ext': 'utils/load-extensions/load-extensions',
      'hbs': 'lib/hbs',
      'i18n': 'lib/i18n',
      'json': 'lib/json',
      'less': 'lib/less',
      'txt': 'lib/text',
      'nuc/lib/css-builder': 'lib/css-builder',
      'nuc/lib/handlebars': 'lib/handlebars',
      'nuc/lib/handlebars3': 'lib/handlebars3',
      'nuc/lib/i18nprecompile': 'lib/i18nprecompile',
      'nuc/lib/normalize': 'lib/normalize',
      'nuc/lib/underscore': 'lib/underscore'
    }
  }
};
