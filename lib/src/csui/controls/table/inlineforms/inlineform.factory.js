/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui/lib/backbone',
  'csui/controls/table/inlineforms/inlineform.registry',
  'csui/controls/table/inlineforms/generic/generic.view',
  'csui/controls/table/inlineforms/base/inline.edit.view',
  'csui/controls/table/inlineforms/inlineform/inlineform.schemas',
  'csui-ext!csui/controls/table/inlineforms/inlineform.factory'
], function (_, Backbone, InlineFormViewRegistry,
    InlineFormGenericView,
    InlineFormEditView,
    InlineFormSchemas) {

  function InlineFormViewFactory() {}

  _.extend(InlineFormViewFactory.prototype, {

    getInlineFormView: function (addableType) {
      var inlineFormView = InlineFormViewRegistry.getInlineFormView(addableType);
      if (!inlineFormView) {
        var addableModel = {
          node: new Backbone.Model({
            type: addableType
          })
        };
        var schemaModel = InlineFormSchemas.getFormFieldsSchema(addableModel);
        if (schemaModel) {
          inlineFormView = InlineFormEditView;
          Object.getPrototypeOf(
              inlineFormView).addableCommandInfo = schemaModel.attributes.addableCommandInfo;
        }
      }

      return inlineFormView;
    }

  });

  return new InlineFormViewFactory();

});
