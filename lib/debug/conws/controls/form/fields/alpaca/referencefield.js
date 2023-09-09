csui.define(['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/lib/alpaca/js/alpaca.lite', 'csui/models/form',
  'conws/controls/form/fields/reference.view',
  'csui/utils/base'
], function (module, _, $, Backbone, Marionette, Alpaca, FormModel, ReferenceFieldView, base) {

  Alpaca.Fields.ReferenceField = Alpaca.Fields.TextField.extend({

    constructor: function ReferenceField(container, data, options, schema, view, connector,
        onError) {
      this.base(container, data, options, schema, view, connector, onError);
    },

    getFieldType: function () {
      return 'reference';
    },
    postRender: function (callback) {
      this.base(callback);
      this.showField();
    },
    showField: function () {
      var id = this.id;

	   this.options.id = "lbl" + _.uniqueId(id);
	  
	  // add an id to the <label> element like alpaca23Label
      var id4Label,
          labelElement = $(this.field[0]).find('label');

      if (labelElement && labelElement.length === 1) {
        id4Label = labelElement.attr('for') + "Label";
        labelElement.attr('id', id4Label);
      }

      // our field
      this.fieldView = new ReferenceFieldView({
        model: new Backbone.Model({
          data: this.data,
          options: this.options,
          schema: this.schema,
          id: id
        }),
         id: _.uniqueId(id),
        alpacaField: this,
		labelId: id4Label,
        value: this.data,
        readonly: true,
        mode: this.options.mode,
        dataId: this.name,
        path: this.path,
        alpaca: {
          data: this.data,
          options: this.options,
          schema: this.schema
        }
      });

      // replace alpaca control with empty div having same classes as control
      var $field = $('<div>').addClass('alpaca-control');
      this.getControlEl().replaceWith($field);

      // show our field in div
      this.region = new Marionette.Region({el: $field});
      this.region.show(this.fieldView);

      return;
    },
    focus: function () {
      this.fieldView.setFocus();
    },
    destroy: function () {
      this.base();
      if (this.region) {
        this.region.destroy();
      }
    },

    onShow: function () {
      $('.alpaca-field-reference label').click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    }
  });

  Alpaca.registerFieldClass('reference', Alpaca.Fields.ReferenceField, 'bootstrap-csui');

  return $.alpaca.Fields.ReferenceField;
});
