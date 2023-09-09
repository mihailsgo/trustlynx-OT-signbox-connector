/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/models/form',
  'csui/models/forms',
  'csui/controls/form/form.view',
  'csui/utils/contexts/page/page.context',
  'csui/utils/usersettings/impl/usersettings.model',
  'i18n!csui/utils/usersettings/impl/nls/lang',
  'css!csui/utils/usersettings/impl/usersettingstab'
], function ($, _, Marionette, FormModel, FormCollection, FormView, PageContext,
    UserSettingsModel, lang) {
  "use strict";

  var AccessibilityFieldView = Marionette.ItemView.extend({

    constructor: function (options) {
      this.model = new UserSettingsModel(options);
      Marionette.ItemView.prototype.constructor.apply(this);
      this.settingsModeChanged = this.model.get('settingsModeChanged') || false;
    },

    tagName: 'div',
    template: false,
    getRawFormsData: function (state) {
      return {
        "forms": [{
          "data": {
            "accessibleMode": state
          },
          "options": {
            "fields": {
              "accessibleMode": {
                "hidden": false,
                "label": lang.accModeLabel,
                "type": "checkbox",
                "helper": lang.accModeText
              }
            }
          },
          "schema": {
            "properties": {
              "accessibleMode": {
                "readonly": false,
                "required": false,
                "type": "boolean"
              }
            },
            "title": lang.accHeader,
            "type": "object"
          }
        }
        ]
      };
    },

    onRender: function () {
      this.model.fetch({
        prepare: false,
        async: false
      }); // TODO is sync the recommend way to do this?
      var accModeCheckedState = this.model.get('accessibleMode'),
          formModels = new FormCollection();
      formModels.reset(formModels.parse(this.getRawFormsData(accModeCheckedState)));
      var singleModel = new FormModel(formModels.models[0].attributes.forms[0]),
          contentRegion = new Marionette.Region({
            el: this.el
          }),
          formView = new FormView({
            context: new PageContext(),
            model: singleModel,
            mode: "create"
          });

      this.listenTo(formView, "change:field", function (event) {
        this.settingsModeChanged = !this.settingsModeChanged; //which helps to page reload
        this.model.set({
          'settingsModeChanged': this.settingsModeChanged,
          'accessibleMode': event.value
        });
        this.model.save();
      }, this);
      this.listenTo(formView, "render:form", function (event) {
        this.trigger("childview:rendered");
      }, this);

      contentRegion.show(formView);
    }
  });

  return AccessibilityFieldView;
});