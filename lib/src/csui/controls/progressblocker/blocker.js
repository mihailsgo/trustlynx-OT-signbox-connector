/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



define([
  'module', 'csui/lib/underscore',
  'smart/controls/progressblocker/blocker'
], function (module, _, SmartBlocker) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    delay: 10,
    disableDelay: 10,
    globalOnly: false
  });

  SmartBlocker.setModuleConfigs(config);

  return SmartBlocker;
});