/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



var path = require('path');
var nucComponent = require('../lib/src/nuc/component'),
    bundlePrefix = 'greet',
    bundleNames = ['greet-all'],
    bundlePath = path.join(__dirname, 'bundles');

module.exports = {
  getAllModules: function () {
    return nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  },
  getBundleNames: function () {
    return bundleNames.slice();
  }
};
