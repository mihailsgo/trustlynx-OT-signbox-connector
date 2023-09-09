csui.define([
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'hbs!conws/dialogs/regen.reference/impl/regen.reference',
  'i18n!conws/dialogs/regen.reference/impl/nls/lang',
  'css!conws/dialogs/regen.reference/impl/regen.reference'
], function ($, _, Backbone, Marionette, TabableRegionBehavior, template, lang) {
  'use strict';

  var RegenReferenceFormView = Marionette.ItemView.extend({
    template: template,

    templateHelpers: function () {
      return {
        title: lang.regenReferenceTitle,
        regenRefDlgMsg: lang.regenReferenceDlgMsg,
        regenRefDlgInutLabel: lang.regenReferenceDlgInutLabel
      };
    },

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function RegenReferenceFormView(options) {
      options = options || {};
      options.model = options.model || options.node;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.model = new Backbone.Model({ 'ref_regen': false });
    },

    currentlyFocusedElement: function (event) {
      if (this.regenSwitchView) {
        return this.regenSwitchView.$el.find(':input');
      } else {
        return undefined;
      }
    },

    onRender: function () {
      var self = this;

      require(['csui/controls/form/fields/booleanfield.view'], function (BooleanFieldView) {
        self.regenSwitchView = new BooleanFieldView({
          mode: 'writeonly',
          model: new Backbone.Model({ 'data': self.model.get('ref_regen') }),
          labelId: 'regenRefLabel'
        });
        self.regenSwitchView.render();
        self.regenSwitchView.on('field:changed', function (event) {
          self.model.set({ 'ref_regen': event.fieldvalue }, { 'silent': true });
        });
        self.$('.conws-regen-ref-dialog-boolean-input').append(self.regenSwitchView.$el);
      });

    }
  });

  return RegenReferenceFormView;
});
