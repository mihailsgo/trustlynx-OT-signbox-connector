/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



var path = require('path');
var nucComponent;
try {
  nucComponent = require(`${__dirname}/../nuc/component`);
} catch (error) {
  nucComponent = require(`${__dirname}/../lib/src/nuc/component`);
}
var bundlePrefix = 'csui';
var bundleNames  = ['csui-libraries', 'csui-server-adaptors',
  'csui-models', 'csui-commands', 'csui-data', 'csui-view-support',
  'csui-app', 'csui-browse', 'csui-forms', 'csui-metadata', 'csui-search',
  'csui-visualisation', 'csui-perspective', 'csui-alpaca-legacy'];
var bundlePath   = path.join(__dirname, 'bundles');

module.exports = {
  getAllModules: function () {
    return nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  },
  getRequireJsPluginPaths: function () {
    return {
      'csui/utils/high.contrast/detector': 'utils/high.contrast/detector'
    }
  }
};
