/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/jquery", "csui/lib/underscore"], function ($, _) {

  function ToolbarExtension() {}

  _.extend(ToolbarExtension.prototype, {

    OnUpdateToolbar: function (args) {
      var done         = args.async(),
          container    = args.container,
          toolbarItems = args.toolbarItems,
          deferred     = $.Deferred(),
          EventItem    = _.find(toolbarItems, function (toolItem) {
            if (toolItem.attributes.type === 806) {
              return toolItem;
            }
          });

      if (!!EventItem) {
        EventItem.set("signature", "addEvents");
      }

      deferred.resolve.apply(deferred, arguments);
      done();
    }
  });

  return function (tableToolbarView) {
    var extension = new ToolbarExtension();
    tableToolbarView.on('before:updateAddToolbar',
        function () { extension.OnUpdateToolbar.apply(extension, arguments);});

  };

});