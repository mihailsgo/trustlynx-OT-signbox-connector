csui.define([
  'module',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/utils/url',
  'csui/models/node/node.model'
], function (module, $, _, Backbone, Url, NodeModel) {

  var config = module.config();

  var PreviewAttributesModel = Backbone.Model.extend({

    // constructor gives an explicit name to the object in the debugger
    constructor: function PreviewAttributesModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      options || (options={});

      // enable the model for communication with the CS REST API
      if (options && options.connector) {
        options.connector.assignTo(this);
      }

      this.categoryId = options.categoryId;
    },

    isFetchable: function () {
      return true;
    },

    // computes the REST API URL used to access the metadata.
    url: function () {
      return Url.combine(
        this.connector.connection.url,
        '/forms/nodes/categories/update?id=' + this.get('id') + '&category_id=' + this.categoryId);
    },

    // parses the REST call response and stores the data
    parse: function (response) {
      return response.forms[0];
    }
  });

  // return the model
  return PreviewAttributesModel;
});
