/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/jquery', 'csui/lib/underscore',
    'csui/utils/contexts/factories/factory',
    'csui/utils/contexts/factories/connector',
    'csui/models/node/node.model',
    'csui/controls/form/fields/nodepickerfield.view',
    'conws/models/pickers/pickerinfo.factory',
    'css!conws/controls/customcolumnpicker/impl/customcolumnpicker'
  ], function ($, _,
    ModelFactory, ConnectorFactory, NodeModel,
    NodePickerFieldView,
    PickerInfoFactory
    ) {
    'use strict';

    var LastCustomColumnNodeFactory = ModelFactory.extend({

      propertyPrefix: 'lastColumnNode',

      constructor: function LastCustomColumnNodeFactory(context, options) {
        ModelFactory.prototype.constructor.apply(this, arguments);

        var connector = context.getObject(ConnectorFactory, options);
        this.property = new NodeModel(undefined,{ connector: connector });
      }

    });

    var CustomColumnPickerFieldView = NodePickerFieldView.extend({

      constructor: function CustomColumnPickerFieldView(options) {
        $.extend(true, options.model.get('options'), { type_control: { parameters: {
          select_types: [902],
          globalSearch: false
        } } });
        NodePickerFieldView.apply(this, arguments);
        this.lastColumnNode = this.options.context.getModel(LastCustomColumnNodeFactory, {
          permanent: true,
          detached: true
        });
      },

      mapFieldValueToNodeId: function(data) {
        if (data) {
          var parameterPlaceholder = /{([^:}]+)(:([^}]+))?}/g;
          var match = parameterPlaceholder.exec(data);
          var columnId = match && match[1];
          var customColumnModel = this.options.context.getModel(PickerInfoFactory,{
              attributes: {
                config_id: columnId,
                picker_type: "otconws_customcolumn"
              }
            });
          return customColumnModel.ensureFetched().then(function(){
            return $.Deferred().resolve(customColumnModel.get('object_id')).promise();
          },function(){
            return $.Deferred().resolve().promise();
          });
        } else {
          return $.Deferred().resolve().promise();
        }
      },

      mapNodeIdToFieldValue: function(nodeId) {
        var self = this;
        if (nodeId) {
          var customColumnModel = this.options.context.getModel(PickerInfoFactory,{
              attributes: {
                object_id: nodeId,
                picker_type: "otconws_customcolumn"
              }
            });
          var deferred = $.Deferred();
          customColumnModel.ensureFetched().then(function() {
              deferred.resolve('{'+customColumnModel.get('config_id')+'}').then(function(){
                if (self.node && self.node.get("parent_id")) {
                  self.lastColumnNode.clear({silent: true});
                  self.lastColumnNode.set(self.node.attributes, {silent: true});
                }
              });
            },function(){
              deferred.resolve();
            });
          return deferred.promise();
        } else {
          return $.Deferred().resolve().promise();
        }
      },

      _getNodePicker: function() {
        var hasNode = !!this.model.get('data');
        var lastParent = (!hasNode && this.lastColumnNode) ? this.lastColumnNode.get("parent_id") : undefined;
        $.extend(true, this.model.get('options'), { type_control: { parameters: {
          parent: lastParent,
          startLocation: (hasNode || lastParent)
                          ? 'csui/dialogs/node.picker/start.locations/current.location'
                          : 'conws/dialogs/node.picker/start.locations/facets.volume',
          startLocations: [
            'csui/dialogs/node.picker/start.locations/current.location',
            'conws/dialogs/node.picker/start.locations/facets.volume'
          ]
        } } });
        return NodePickerFieldView.prototype._getNodePicker.apply(this,arguments);
      }
    });

    return CustomColumnPickerFieldView;
  });
