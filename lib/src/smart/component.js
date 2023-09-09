/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


var fs   = require('fs'),
    path = require('path');
var possibleLocations = ["../lib/src/nuc", "../../nucleus/src", "../nuc"],
    nucPath           = '';

possibleLocations.forEach(function (loc) {
  var fullLoc = path.join(`${__dirname}`, loc);
  nucPath = fs.existsSync(fullLoc) ? fullLoc : nucPath;
});

if (nucPath === '') {
  throw new Error('None of ' + possibleLocations.toLocaleString() + ' found.');
}

var nucComponent = require(path.join(nucPath, '/component')),
    bundlePrefix = 'smart',
    bundleNames  = ['smart-all'],
    bundlePath   = path.join(__dirname, 'bundles');

module.exports = {
  getBundleNames: function () {
    return bundleNames.slice();
  },
  getAllModules: function () {
    return nucComponent.getAllComponentModules(bundleNames, bundlePath, bundlePrefix);
  },
  getAllRequireJsPlugins: function () {
    return []; // for now empty, it may have values in future, so keep this blank array until then.
  },
  getAllAvailableRequireJsPlugins: function () {
    return [
      'smart/controls/breadcrumbs/test/breadcrumbs.mock.data',
      'smart/controls/pagination/test/pagination.mock.data',
      'smart/controls/tab.panel/tab.panel.view',
      'smart/controls/tab.panel/tab.links.ext.view',
      'smart/controls/tab.panel/tab.links.ext.scroll.mixin',
      'smart/controls/user/user.profile.view',
      'smart/controls/user/miniprofile.view',
      'json!smart/controls/user/test/user.profile.data.json',
      'smart/controls/user/test/user.profile.mock',
      'smart/controls/globalmessage/globalmessage',
      'smart/controls/globalmessage/impl/messagedialog.view',
      'smart/controls/globalmessage/impl/custom.wrapper.view',
      'smart/controls/progresspanel/progresspanel',
      'smart/controls/progresspanel/impl/progresspanel/test/progresspanel.mock'
    ];
  }

};
