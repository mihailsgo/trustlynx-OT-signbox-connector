/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



var path = require('path');
var nucComponent = require('../lib/src/nuc/component'),
    bundlePrefix = 'webreports',
    bundleNames = ['webreports-app', 'webreports-visdata'],
    bundlePath = path.join(__dirname, 'bundles');

    var smartPath = path.join(__dirname, '../lib/src/smart');
if (!fs.existsSync(smartPath)) {
  smartPath = path.join(__dirname, '../smart');
    if (!fs.existsSync(smartPath)) {
      throw new Error('Neither ../lib/src/smart nor ../smart found.');
    }
}
 
var smartComponent = require(path.join(smartPath, '/component')),
    allComponentModules = nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
 
allComponentModules.concat(smartPath.getAllModules());


module.exports = {
    getAllModules: function () {
        return nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
    },
    getBundleNames: function () {
        return bundleNames.slice();
    }
};
