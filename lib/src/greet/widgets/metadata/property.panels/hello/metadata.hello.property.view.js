/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/marionette',
  'hbs!greet/widgets/metadata/property.panels/hello/metadata.hello.property',
  'css!greet/widgets/metadata/property.panels/hello/metadata.hello.property'
], function (Marionette, template) {

  var MetadataHelloPropertyView = Marionette.ItemView.extend({

    className: 'greet-metadata-property-hello',

    template: template,

    templateHelpers: function () {
      return {
        action: this.options.action || 'update'
      };
    },

    constructor: function MetadataHelloPropertyView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    validate: function () {
      return true;
    },

    getValues: function () {
      return {};
    }

  });

  return MetadataHelloPropertyView;

});
