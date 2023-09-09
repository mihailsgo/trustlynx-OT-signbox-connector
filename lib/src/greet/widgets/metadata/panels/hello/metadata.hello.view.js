/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/marionette',
  'hbs!greet/widgets/metadata/panels/hello/metadata.hello',
  'css!greet/widgets/metadata/panels/hello/metadata.hello'
], function (Marionette, template) {

  var MetadataHelloView = Marionette.ItemView.extend({

    className: 'greet-metadata-hello',

    template: template,

    constructor: function MetadataHelloView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }

  });

  return MetadataHelloView;

});
