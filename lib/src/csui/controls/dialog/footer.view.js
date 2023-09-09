/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['smart/controls/dialog/footer.view'
], function (SmartDialogFooterView) {

  var DialogFooterView = SmartDialogFooterView.extend({

    constructor: function DialogHeaderView(options) {
      SmartDialogFooterView.prototype.constructor.call(this, options);
    }
    
  });

  return DialogFooterView;
});
