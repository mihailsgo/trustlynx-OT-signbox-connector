/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['smart/controls/dialog/header.view'
], function (SmartDialogHeaderView) {

  var DialogHeaderView = SmartDialogHeaderView.extend({

    constructor: function DialogView(options) {
      SmartDialogHeaderView.prototype.constructor.call(this, options);
    }

  });
  return DialogHeaderView;
});
