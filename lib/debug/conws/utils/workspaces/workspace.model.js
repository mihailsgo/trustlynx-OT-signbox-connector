/**
 * The workspaces model for fetching the workspaces from the server.
 * Provides:
 *   - Endless scrolling
 *   - Fetch custom attributes (categories)
 *   - Provide Workspace type icon
 */
csui.define([
  'module',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/models/node/node.model'
], function (module, $, _, Backbone, NodeModel) {

  var WorkspaceModel = NodeModel.extend({

    constructor: function WorkspaceModel(attributes, options) {
      // The connector needs to be passed to teh NodeModel constructor
      // to be processed correctly
      options || (options = {});
      if (!options.connector) {
        options.connector = options.collection && options.collection.connector || undefined;
      }

      NodeModel.prototype.constructor.call(this, attributes, options);
    },

    // Set id attribute to support endless scrolling
    // Needed to support compare workspaces and add workspaces to a existing collection
    idAttribute: 'id',

    // Parse one workspace and add category properties
    parse: function (response, options) {
      var node = NodeModel.prototype.parse.call(this, response, options);

      // Add container attribute that core ui allow browse
      if (!node.container) {
        node.container = true;
      }

      // set display_name so it is usable in typeaheadfields.
      node.display_name = node.name;

      return node;
    }

  });

  return WorkspaceModel;
});
