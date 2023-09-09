csui.define(['require', 'csui/lib/jquery', 'csui/utils/base', 'csui/lib/underscore',
  'csui/utils/commandhelper', 'csui/models/command'
], function (require, $, base, _, CommandHelper, CommandModel) {
  'use strict';

  /**
   * Dummy command to make a close button visible and executable in toolbar view.
   * But do not register command in the global command list.
   * Execution is done by the view itself listening to the toolbar events
   * 'before:execute:command' and 'after:execute:command'.
   */
  var CloseExpandedViewCommand = CommandModel.extend({

    defaults: {
      signature: "CloseExpandedView",
      scope: "single"
    },

    enabled: function (status, options) {
      return true;
    },

    execute: function (status, options) {
    }

  });

  return CloseExpandedViewCommand;

});
