/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



define(['module', 'csui/controls/listitem/impl/inline.menu/inline.menu.view',
'css!csui/controls/listitem/impl/inline.menu/inline.menu'
], function (module, InlineMenuViewImpl) {
  var InlineMenuView = InlineMenuViewImpl.extend({
    constructor: function InlineMenuView(options) {
        InlineMenuViewImpl.prototype.constructor.apply(this, arguments);
    }
  });

  return InlineMenuView;

});
