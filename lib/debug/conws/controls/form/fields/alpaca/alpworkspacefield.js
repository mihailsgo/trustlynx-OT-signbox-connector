csui.define(['module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/log',
  'csui/lib/alpaca/js/alpaca.lite',
  'csui/controls/form/fields/alpaca/alptypeaheadfield.mixin',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector',
  'csui/utils/commands',
  'csui/utils/defaultactionitems',
  'conws/utils/workspaces/workspace.model',
  'conws/controls/form/fields/workspacefield.view'
 ], function ( module, _, $,
  Log,
  Alpaca,
  AlpTypeaheadFieldMixin,
  ModelFactory,
  ConnectorFactory,
  commands,
  defaultActionItems,
  WorkspaceModel,
  WorkspaceFieldView ) {

  'use strict';

  var log = new Log(module.id);

  var WkspFieldNodeModelFactory = ModelFactory.extend({
    propertyPrefix: 'wkspFieldNode',

    constructor: function WkspFieldNodeModelFactory(context,options){

      ModelFactory.prototype.constructor.apply(this,arguments);

      var wkspFieldNode = this.options.wkspFieldNode || {};
      var connector = this.context.getObject(ConnectorFactory, options);
      // create own node model to prevent local changes from affecting the contextual node
      var node = new WorkspaceModel(wkspFieldNode.attributes, _.extend({
        connector: connector,
        autofetch: true,
        // ensure at least permitted actions for default actions
        commands: defaultActionItems.getAllCommandSignatures(commands)
      }, wkspFieldNode.options ));

      this.property = node;
    }

  });

  var ConwsWorkspaceField = AlpTypeaheadFieldMixin.mixin({

    constructor: function ConwsWorkspaceField(container, data, options, schema, view, connector, onError) {

      options = $.extend(true,options||{},{
        alpacaFieldType: 'otconws_workspace_id',
      });

      options.ItemModelFactory = WkspFieldNodeModelFactory;
      options.TypeaheadFieldView = WorkspaceFieldView;

      this.base(container, data, options, schema, view, connector, onError);
      this.makeAlpTypeaheadField();
    }

  });

  Alpaca.Fields.ConwsWorkspaceField = Alpaca.Fields.TextField.extend(ConwsWorkspaceField);
  Alpaca.registerFieldClass('otconws_workspace_id', Alpaca.Fields.ConwsWorkspaceField, 'bootstrap-csui');
  Alpaca.registerFieldClass('otconws_workspace_id', Alpaca.Fields.ConwsWorkspaceField, 'bootstrap-edit-horizontal');

  return $.alpaca.Fields.ConwsWorkspaceField;
});
