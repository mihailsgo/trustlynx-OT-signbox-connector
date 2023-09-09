/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone",
  "csui/utils/log", "csui/utils/base", "csui/models/nodeforms",
  'csui/models/node.createform/server.adaptor.mixin'
], function (module, $, _, Backbone, log, base, NodeFormCollection, ServerAdaptorMixin) {
  "use strict";

  var NodeCreateFormCollection = NodeFormCollection.extend({

      constructor: function NodeCreateFormCollection(models, options) {
        NodeFormCollection.prototype.constructor.apply(this, arguments);
        this.type = options.type;
        this.docParentId = options.docParentId;
        if (this.type === undefined) {
          throw new Error(this.ERR_CONSTRUCTOR_NO_TYPE_GIVEN);
        }
      },

      clone: function () {
        return new this.constructor(this.models, {
          node: this.node,
          type: this.type
        });
      }
    },
    {
      ERR_CONSTRUCTOR_NO_TYPE_GIVEN: "No creation type given in constructor"
    });

  _.extend(NodeCreateFormCollection, {
    version: '1.0'
  });

  ServerAdaptorMixin.mixin(NodeCreateFormCollection.prototype);
  return NodeCreateFormCollection;

});