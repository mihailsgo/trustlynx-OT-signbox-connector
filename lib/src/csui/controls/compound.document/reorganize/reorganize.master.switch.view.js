/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
  'csui/lib/backbone', 'csui/lib/marionette3',
  "i18n!csui/controls/compound.document/nls/localized.strings",
  'csui/controls/form/fields/booleanfield.view',
  'hbs!csui/controls/compound.document/impl/reorganize.master.switch',
  'css!csui/controls/compound.document/impl/reorganize'
], function (_, $, Backbone, Marionette, lang, BooleanFieldView, Template) {
  'use strict';

  var ReorganizeMasterSwitchView = Marionette.View.extend({
    className: 'csui-master-button',
    template: Template,

    ui: {
      applyToFolderAndSubFoldersParentEle: '.csui-version-folder-permissions',
      folderPermissionSelector: '.csui-folder-permissions-item'
    },
    templateContext: function () {
      return {
        enable_switch_text: lang.enableSwitchText,
        instructional_text: lang.instructionalText,
        masterSwitchLabelId: this.masterSwitchLabelId,
        errorMessage: lang.errorMessage
      };
  },

    constructor: function ReorganizeMasterSwitchView(options) {
      options || (options = {});
      this.options = options;
      this.masterSwitchLabelId = _.uniqueId("masterSwitch");
      Marionette.View.prototype.constructor.call(this, options);
    },

    onRender: function () {
      var self = this;
      this._reorganizeMasterSwitchEnabled = this.options.applyFlag;
      this.masterFieldSwitchModel = new Backbone.Model({
        data: this._reorganizeMasterSwitchEnabled,
        options: {},
        schema: { "disabled": this.options.disabled }
      });
      this.masterFieldSwitchView = new BooleanFieldView({
        mode: 'writeonly',
        model: this.masterFieldSwitchModel,
        labelId: self.masterSwitchLabelId
      });
      this.$el.find('.required-fields-switch').append(this.masterFieldSwitchView.$el);
      this.masterFieldSwitchView.render();
      this.masterFieldSwitchView.on('field:changed', function (event) {
        self.trigger('reorganize:master:enabled', event);
      });
      this.masterFieldSwitchView.$el.find('input').on('keydown', function (event) {
         if (event.keyCode === 9 && !event.shiftKey) {
           event.preventDefault();
           event.stopPropagation();
           self.options.originatingView.reorganizeListView.focusIndex = 0;
           $(self.options.originatingView.$el.find('.csui-reorder-item')).removeClass('active');
           var firstItem = $(self.options.originatingView.$el.find('.csui-reorder-item')[0]);
           firstItem.trigger('focus');
           firstItem.addClass('active');
         }
      });
    }
  });
  return ReorganizeMasterSwitchView;
});
