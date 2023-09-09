csui.define(['module', 'csui/lib/underscore',
  'csui/controls/toolbar/toolitems.mask',
  'csui/utils/toolitem.masks/global.toolitems.mask'
], function (module, _, ToolItemMask, GlobalMenuItemsMask) {
  'use strict';

  // Keep the keys in sync with conws/widgets/header/impl/headertoolbaritems
  var toolbars = ['rightToolbar','delayedActionsToolbar'];

  function ToolbarItemsMasks(options) {
    var globalMask;    
    
    // Create and populate masks for every toolbar
    this.toolbars = _.reduce(toolbars, function (toolbars, toolbar) {
      globalMask = toolbars[toolbar];

      if (!globalMask) {
        globalMask = new GlobalMenuItemsMask();			
      }

      var mask = new ToolItemMask(globalMask, { normalize: false }),
        source = options[toolbar];
      if (source) {
        mask.extendMask(source);
      }
      // Enable restoring the mask to its initial state
      mask.storeMask();
      toolbars[toolbar] = mask;
      return toolbars;
    }, {});
  }

  ToolbarItemsMasks.toolbars = toolbars;

  return ToolbarItemsMasks;

});
