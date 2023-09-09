/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



var fs = require('fs'),
    path = require('path');
var nucPath = path.join(__dirname, '../lib/src/nuc');
if (!fs.existsSync(nucPath)) {
    nucPath = path.join(__dirname, '../nuc');
    if (!fs.existsSync(nucPath)) {
        throw new Error('Neither ../lib/src/nuc nor ../nuc found.');
    }
}

var smartPath = path.join(__dirname, '../lib/src/smart');
if (!fs.existsSync(smartPath)) {
    smartPath = path.join(__dirname, '../smart');
    if (!fs.existsSync(smartPath)) {
        throw new Error('Neither ../lib/src/smart nor ../smart found.');
    }
}
var nucComponent = require(path.join(nucPath, '/component')),
    smartComponent = require(path.join(smartPath, '/component')),
    bundlePrefix = 'xecmpf',
    bundleNames = ['xecmpf-core', 'xecmpf-app'],
    bundlePath = path.join(__dirname, 'bundles'),
    allComponentModules = nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
allComponentModules.concat(smartComponent.getAllModules());

module.exports = {

    getAllModules: function() {
        return allComponentModules;
    }

};