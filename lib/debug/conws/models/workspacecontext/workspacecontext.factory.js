/**
 * Created by stefang on 24.11.2015.
 */
csui.define(['csui/lib/underscore',
  'csui/utils/contexts/factories/factory',
  'conws/models/workspacecontext/workspacecontext.model'
], function (_,
    ModelFactory,
    WorkspaceContextModel) {

  var WorkspaceContextFactory = ModelFactory.extend({

    propertyPrefix: 'workspaceContext',

    constructor: function WorkspaceContextFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      this.property = new WorkspaceContextModel({}, {context: context});

    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  return WorkspaceContextFactory;

});
