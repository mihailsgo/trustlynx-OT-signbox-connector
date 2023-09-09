// Exposes getAllModules method (based on nuc.getAllComponentModules) which
// returns all public modules from this component.  Components depending on
// this one can use it to exclude dependant modules from their bundles.

const path = require('path');

// Support both symlinks and folders with source dependencies
var nucComponent;
try {
  // The nucleus component exposes the index loading method
  nucComponent = require('../lib/src/nuc/component');
} catch (error) {
  nucComponent = require('../nuc/component');
}

// Describe local bundles
const bundlePrefix = 'dmss';
const bundleNames = ['dmss-all'];
const bundlePath = path.join(__dirname, 'bundles');

module.exports = {
  getAllModules: function () {
    return nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  }
};
