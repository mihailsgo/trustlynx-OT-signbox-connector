/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    "csui/lib/jquery",
    'csui/lib/underscore',
    'csui/lib/marionette',
    'conws/utils/commands/addbwsfromsidepanel',
    'csui/behaviors/keyboard.navigation/tabable.region.behavior',
    'i18n!conws/widgets/navigation.header/controls/create.workspace/impl/nls/localized.strings',
    'hbs!conws/widgets/navigation.header/controls/create.workspace/impl/create.workspace',
    'css!conws/widgets/navigation.header/controls/create.workspace/impl/create.workspace'
],
function($, _, Marionette, AddBWSFromSidePanelCommand, TabableRegionBehavior, localizedStrings, template){
    'use strict';

    var CreateWorkspaceView = Marionette.LayoutView.extend({

        className: 'conws-create-workspace-view',

        template: template,

        templateHelpers: function () {
          return {
            title: localizedStrings.CreateWorkspaceIconTitle,
            createWorkspaceTitleAria: localizedStrings.createWorkspaceTitleAria
          };
        },

        regions: {
          CreateWorkspaceViewContainerRegion: '.conws-create-workspace-view-container'
        },

        ui: {
          createBWSIcon: '.create-workspace_header_icon',
          createBWSIconContainer: '.conws-create-workspace-icon-container',
          createWorkspaceViewContainer: '.conws-create-workspace-view-container'
        },

        events: {
          'click @ui.createBWSIcon': 'CreateBWSHeaderIconClicked',
          'keydown': 'onKeyInView',
        },

        behaviors: {
          TabableRegionBehavior: {
            behaviorClass: TabableRegionBehavior
          }
        },

        currentlyFocusedElement: '.conws-create-workspace-icon-container',

        constructor: function CreateWorkspaceView(options) {
          Marionette.LayoutView.call(this, options);
          this.buttonEnabled = true;
          this.context = options.context;
          this.addworkspaceCommand = new AddBWSFromSidePanelCommand();
          this.config = this.addworkspaceCommand.enabled();
        },

        onRender: function(){
          if(this.config.enabled) {
            this.$el.removeClass("binf-hidden");
          }else{
            $(".conws-create-workspace").addClass("binf-hidden");
          }
        },

        _showQuickWSCreationSidePanel: function () {
          this.buttonEnabled = false;
          this.options && this.options.parentView &&
          this.options.parentView.trigger("header:control:clicked");
          this.addworkspaceCommand.execute({context: this.context,
            originatingView: this,
            data: {
              size: "medium",
              resize: false
            }
          })
          .always(_.bind(function () {
            this.buttonEnabled = true;
          }, this));
        },

        CreateBWSHeaderIconClicked: function () {
          if(this.buttonEnabled === true){
            this._showQuickWSCreationSidePanel();
          }
        },

        onKeyInView: function (event) {
          switch (event.keyCode) {
            case 13:
            case 32:
              var flag = this.addworkspaceCommand.visible();
              if(!flag && this.ui.createBWSIconContainer.is(':focus') && this.buttonEnabled === true) {
                  this._showQuickWSCreationSidePanel();
              }
              break;
          }
        },

    });

    return CreateWorkspaceView;
});