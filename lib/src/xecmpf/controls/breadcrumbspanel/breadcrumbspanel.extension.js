/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([], function () {
  'use strict';

  var BreadcrumbsPanelExtension = {

    hideBreadcrumbs: function (options) {
      var contextOptions = options && options.context && options.context.options;
      return !!(contextOptions && contextOptions.hideBreadcrumbsPanel);
    }

  };

  return BreadcrumbsPanelExtension;
});