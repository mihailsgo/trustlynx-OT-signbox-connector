csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/utils/base'
], function (_, $, Backbone, base) {

  var RoleModel = Backbone.Model.extend({

    constructor: function RoleModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var RolesCollection = Backbone.Collection.extend({
    model: RoleModel,

    constructor: function RolesCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    comparator: function (left, right) {
      return base.localeCompareString(left.get('name'), right.get('name'));
    },

    // Filter method for the roles collection, used from the two roles lists in the role dialog
    // The method filters the roles for a given value, the filter is done case insensitive (toLowerCase)
    filterList: function (value) {
      if (!_.isUndefined(value) && value.length > 0) {
        var models = this.filter(function (model) {
          var name = model.get('name').toLowerCase();
          return name.indexOf(value.toLowerCase()) > -1;
        });

        return new Backbone.Collection(models);
      } else {
        return this;
      }
    }

  });

  return RolesCollection;
});
