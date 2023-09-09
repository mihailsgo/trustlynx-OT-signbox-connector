/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'smart/controls/dialog/dialog.view',
  'csui/lib/binf/js/binf'
], function (SmartDialogView) {

  var DialogView = SmartDialogView.extend({

    constructor: function DialogView(options) {
      SmartDialogView.prototype.constructor.call(this, options);
    }

  });
 
  return DialogView;

});
