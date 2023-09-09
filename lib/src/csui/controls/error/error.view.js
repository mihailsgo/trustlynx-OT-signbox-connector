/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'nuc/utils/log',
  'smart/controls/error/error.view'
], function (log, SmartErrorView) {
  'use strict';
  log.warn("Use error view from smart controls instead of depending on csui error view");
  return SmartErrorView;
});
