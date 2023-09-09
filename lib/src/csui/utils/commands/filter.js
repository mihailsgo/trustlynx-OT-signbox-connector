/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/log',
  'csui/utils/base', 'csui/utils/commandhelper', 'csui/models/command',
  'i18n!csui/utils/commands/nls/lang',

], function (module, _, $, log, base, CommandHelper, CommandModel, lang) {
  'use strict';

  var FilterCommand = CommandModel.extend({
    defaults: {
      signature: 'Filter'
    },

      enabled: function (status) {
          var config = module.config();
          if (config.enabled === false) {
              return false;
          }

          var isFilterShown = status && status.originatingView && status.originatingView.showFilter;
          if (isFilterShown === true && status.toolItem) {
              status.toolItem.set({'title': lang.FilterCollapseTooltip, toolItemAriaExpand: true, 'stateIsOn': true});
          }
          var isContainer = status.container && !!status.container.get('container');
          return !!isContainer && this._isSupported(status);
      },

    _isSupported: function (status) {
      var container = status.container,
          notSupportedObjects = [136, 298];
          if (status.collection && status.collection.length === 0 && container.get('type') === 899) {
            notSupportedObjects.push(899);
          }
       var   support             = $.inArray(container.get('type'), notSupportedObjects) === -1;
      return support;
    }
  });

  return FilterCommand;
});
