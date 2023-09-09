/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "nuc/lib/backbone", "nuc/utils/log", "nuc/models/addabletype"
], function (module, Backbone, log, AddableTypeModel) {

  var AddableTypeCollection = Backbone.Collection.extend({

    model: AddableTypeModel,

    constructor: function AddableTypeCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.options = options || {};
    }

  });
  AddableTypeCollection.version = '1.0';

  return AddableTypeCollection;

});
