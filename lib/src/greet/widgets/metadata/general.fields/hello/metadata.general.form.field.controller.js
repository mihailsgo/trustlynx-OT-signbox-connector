/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette',
  'greet/widgets/metadata/general.fields/hello/impl/metadata.hello.general.form.field.view'
], function (_, $, Backbone, Marionette, MetadataHelloGeneralFormFieldView) {

  var helloFieldForm = {
    data: {
      hello: 'Hello!'
    },
    schema: {
      properties: {
        hello: {
          title: 'Hello',
          type: 'string'
        }
      }
    },
    options: {
      fields: {
        hello: {
          type: 'text'
        }
      }
    },
    role_name: 'hello'
  };

  var MetadataHelloGeneralFormFieldController = Marionette.Controller.extend({

    constructor: function MetadataHelloGeneralFormFieldController(options) {
      Marionette.Controller.prototype.constructor.apply(this, arguments);
    },

    getGeneralFormFields: function (options) {
      var fieldModel = new Backbone.Model(helloFieldForm);
      return $
          .Deferred()
          .resolve([
            {
              formModel: fieldModel,
              formView: MetadataHelloGeneralFormFieldView
            }
          ])
          .promise();
    },

    getGeneralFormFieldsForCreate: function (options) {
      var fieldModel = new Backbone.Model(helloFieldForm);
      return $
          .Deferred()
          .resolve([
            {
              formModel: fieldModel,
              formView: MetadataHelloGeneralFormFieldView
            }
          ])
          .promise();
    },

    getGeneralFormFieldsForMove: function (options) {
    },

    getGeneralFormFieldsForCopy: function (options) {
    }

  });

  return MetadataHelloGeneralFormFieldController;

});
