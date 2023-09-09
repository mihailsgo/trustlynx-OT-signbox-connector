// Exposes getAllModules method (based on csui.getAllComponentModules) which
// returns all public modules from this component.  Components depending on
// this one can use it to exclude dependant modules from their bundles.

var fs = require('fs'),
    path = require('path');

// Path to the csui sources. As we are called in the dependant component,
// we must check in all possible locations :-(
var nucPath = path.join(__dirname, '../lib/src/nuc');
if (!fs.existsSync(nucPath)) {
  nucPath = path.join(__dirname, '../nuc');
    if (!fs.existsSync(nucPath)) {
      throw new Error('Neither ../lib/src/nuc nor ../nuc found.');
    }
}

var nucComponent = require(path.join(nucPath, '/component')),
    // Describe local bundles
    bundlePrefix = 'conws',
    bundleNames = ['conws-models','conws-app'],
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

allComponentModules.concat(smartComponent.getAllModules());

module.exports = {

  getAllModules: function () {
    return allComponentModules;
  }

};
