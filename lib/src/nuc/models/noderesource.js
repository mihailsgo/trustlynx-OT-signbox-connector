/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'nuc/lib/underscore', 'nuc/utils/log',
  'nuc/models/nodeconnectable', 'nuc/models/fetchable',
  'nuc/models/nodeautofetchable'
], function (module, _, log, NodeConnectableModel, FetchableModel,
    NodeAutoFetchableModel) {
  'use strict';

  log = log(module.id);

  function NodeResourceModel(ParentModel) {
    var prototype = {

      makeNodeResource: function (options) {
        return this.makeNodeConnectable(options)
            .makeFetchable(options)
            .makeNodeAutoFetchable(options);
      }

    };
    prototype.NodeResource = _.clone(prototype);

    return _.extend({},
        NodeConnectableModel(ParentModel),
        FetchableModel(ParentModel),
        NodeAutoFetchableModel(ParentModel),
        prototype);
  }

  return NodeResourceModel;

});
