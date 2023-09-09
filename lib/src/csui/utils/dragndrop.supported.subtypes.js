/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui-ext!csui/utils/dragndrop.supported.subtypes'
], function (_, ExtraDragNDropSupportedSubTypes) {
  'use strict';
  var DragNDropSupportedSubTypes = [
    0, 136, 141, 142, 144, 202, 749, 751, 800, 801, 1307, 1308, 30205
  ];

  if (ExtraDragNDropSupportedSubTypes) {
    DragNDropSupportedSubTypes = DragNDropSupportedSubTypes.concat(
        _.flatten(ExtraDragNDropSupportedSubTypes, true));
  }

  return DragNDropSupportedSubTypes;

});