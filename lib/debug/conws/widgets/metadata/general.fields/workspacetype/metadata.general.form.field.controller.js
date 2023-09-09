csui.define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette','csui/utils/url',
  'csui/controls/form/form.view',
  'i18n!conws/widgets/metadata/general.fields/workspacetype/impl/nls/lang'
], function (_, $, Backbone, Marionette, Url, FormView, lang) {

  var MetadataWorkspacetypeGeneralFormFieldController = Marionette.Controller.extend({

    constructor: function MetadataWorkspacetypeGeneralFormFieldController(options) {
      Marionette.Controller.prototype.constructor.apply(this, arguments);
    },

    getGeneralFormFields: function () {

      var node = this.options.model || this.options.node;

      if (node.get("type") !== 848) {
        return null;
      }

      var deferred = $.Deferred();

      var formModel = new Backbone.Model({
        data: {
					  wksp_type_name: node.get("wksp_type_name")
        },
        schema: {
          properties: {
            wksp_type_name: {
              "readonly": true,
              "required": false,
              "title": "",
              "type": "string",
              "hidden": false
            }
          }
        },
        options: {
          fields: {
            wksp_type_name:{
              "label": lang.WorkspacetypeName,
              "hidden": false,
              "readonly": true,
              "hideInitValidationError": false,
              "type": "text"
            }
          }
        }
      });

      deferred.resolve([{
        formModel: formModel,
        formView: FormView,
      }]);

      return deferred.promise();
    }

  });

  return MetadataWorkspacetypeGeneralFormFieldController;

});