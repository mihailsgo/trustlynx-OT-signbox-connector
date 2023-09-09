/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



var fs = require('fs'),
    path = require('path');
var nucPath = path.join(__dirname, '../lib/src/nuc');
if (!fs.existsSync(nucPath)) {
    nucPath = path.join(__dirname, '../nuc');
    if (!fs.existsSync(nucPath)) {
      throw new Error('Neither ../lib/src/nuc nor ../nuc found.')
    }
}
var nucComponent = require(path.join(nucPath, '/component')),
    bundlePrefix = 'esoc',
    bundleNames = ['esoc-all'],
    bundlePath = path.join(__dirname, 'bundles');

module.exports = {

  getAllModules: function () {
    return nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  }

};
