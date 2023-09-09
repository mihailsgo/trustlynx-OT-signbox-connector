/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui-ext!csui/controls/facet.bar/savefilter.unsupported.list.ids',
], function (_, unsupportedList) {
  'use strict';

  return _.flatten(unsupportedList);

});