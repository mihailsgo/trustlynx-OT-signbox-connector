/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/controls/table/inlineforms/inlineform.registry',
  'csui/controls/table/inlineforms/generic/generic.view'
], function (inlineFormViewRegistry, InlineFormGenericView) {

  inlineFormViewRegistry.registerByAddableType(12345, InlineFormGenericView);
  InlineFormGenericView.prototype.getAddableCommandInfo = function () {
    return {
      signature: "greet-add-hello",
      group: "greet"
    };
  };
  return InlineFormGenericView;

});
