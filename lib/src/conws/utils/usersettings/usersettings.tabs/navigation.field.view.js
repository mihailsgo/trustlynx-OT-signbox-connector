/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/models/form',
  'csui/models/forms',
  'csui/controls/form/form.view',
  'csui/utils/contexts/page/page.context',
  'csui/controls/progressblocker/blocker',
  'csui/utils/base',
  'csui/dialogs/modal.alert/modal.alert',
  'conws/utils/usersettings/impl/usersettings.model',
  'i18n!conws/utils/usersettings/impl/nls/lang'
], function ($, _, Marionette, FormModel, FormCollection, FormView, PageContext, BlockingView, base, ModalAlert,
    UserSettingsModel, lang) {
  "use strict";

  var NavigationFieldView = Marionette.ItemView.extend({

    constructor: function (options) {
      this.model = new UserSettingsModel(options);
      Marionette.ItemView.prototype.constructor.apply(this);
      this.settingsModeChanged = this.model.get('settingsModeChanged') || false;
      BlockingView.imbue(this);
      this.model.fetch();
      this.listenTo(this.model, "sync", this.onRender)
          .listenTo(this.model, "error", function (model,request,options) {
            this.unblockActions.apply(this, arguments);
            if (request) {
              ModalAlert.showError((new base.Error(request)).message);
            }
          });
    },

    tagName: 'div',
    template: false,

    getRawFormsData: function (state) {
      return {
        "forms": [{
          "data": {
            "conwsNavigationTreeView": state
          },
          "options": {
            "fields": {
              "conwsNavigationTreeView": {
                "hidden": false,
                "label": lang.navModeLabel,
                "type": "checkbox",
                "helper": lang.navModeText
              }
            }
          },
          "schema": {
            "properties": {
              "conwsNavigationTreeView": {
                "readonly": false,
                "required": false,
                "type": "boolean"
              }
            },
            "title": lang.navHeader,
            "type": "object"
          }
        }
        ]
      };
    },

    onRender: function () {
      var navModeCheckedState = this.model.get('conwsNavigationTreeView'),
          formModels = new FormCollection();
      formModels.reset(formModels.parse(this.getRawFormsData(navModeCheckedState)));
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
        this.settingsModeChanged = !this.settingsModeChanged;
        this.model.set({
          'settingsModeChanged': this.settingsModeChanged,
          'conwsNavigationTreeView': event.value
        });
        this.model.save();
      }, this);
      this.listenTo(formView, "render:form", function (event) {
        this.trigger("childview:rendered");
      }, this);

      contentRegion.show(formView);
    }
  });

  return NavigationFieldView;
});