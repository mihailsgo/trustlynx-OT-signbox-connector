/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
  'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/utils/messagehelper', 'smart/utils/accessibility',
  'smart/controls/globalmessage/impl/messagedialog.view',
  'smart/controls/globalmessage/impl/custom.wrapper.view',
  'smart/dialogs/modal.alert/modal.alert'
], function (module, _, $, Backbone, MessageHelper, Accessibility,
    MessageView, CustomWrapperView) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    enablePermanentHeaderMessages: false
  });

  if (Accessibility.isAccessibleMode()) {
    config.enablePermanentHeaderMessages = true;
  }

  var messageHelper = new MessageHelper(),
      globals = {},
      hasDefaultRegion;

  var GlobalMessage = {

    setMessageRegionView: function (messageRegionView, options) {
      this._cleanupPreviousMessageRegion();
      options = _.defaults({}, options, {
        useClass: true,
        sizeToParentContainer: true
      });
      options.classes && (globals.classNames = options.classes);
      globals.relatedView = options.useClass ? undefined : messageRegionView;
      globals.sizeToParentContainer = options.sizeToParentContainer;
      globals.messageRegionView = messageRegionView;
    },
    showMessage: function (info, text, details, options) {
      return this._showMessageView(MessageView,
          _.extend({
            info: info,
            message: text,
            details: details,
            messageHelper: messageHelper,
            sizeToParentContainer: globals.sizeToParentContainer,
            enablePermanentHeaderMessages: config.enablePermanentHeaderMessages
          }, options)
      );
    },

    showCustomView: function (customView) {
      return this._showMessageView(CustomWrapperView, {
        contentView: customView,
        messageHelper: messageHelper
      });
    },

    _showMessageView: function (View, options) {
      this._ensureMessageRegion();
      var messageView = messageHelper.activatePanel(
          messageHelper.createPanel(globals, View, options),
          globals.relatedView, globals.messageRegionView);
      this._addEventHandlers(messageView);
      return messageView;
    },

    _addEventHandlers: function (view) {
      var resizeHandler = function () {
        messageHelper.resizePanel(view, globals.relatedView);
      };
      $(window).on('resize', resizeHandler);
      view.listenTo(globals.messageRegionView, 'resize', resizeHandler);
      view.once('before:destroy', function () {
        $(window).off('resize', resizeHandler);
        view.stopListening(globals.messageRegionView, 'resize', resizeHandler);
      });
    },

    _ensureMessageRegion: function () {
      if (globals.messageRegionView) {
        return;
      }
      var modalContainer = $.fn.binf_modal.getDefaultContainer(),
          messageContainer = $('<div>', {'class': 'csui-message-container'}, {
            'style': 'position:absolute; top: 0; left: 0; width: 0; height: 100vh;'
          }).appendTo(modalContainer);
      globals.messageRegionView = new Backbone.View({el: messageContainer});
      hasDefaultRegion = true;
    },

    _cleanupPreviousMessageRegion: function () {
      if (hasDefaultRegion) {
        globals.messageRegionView.remove();
        hasDefaultRegion = false;
      }
      globals = {};
    }

  };

  return GlobalMessage;

});
