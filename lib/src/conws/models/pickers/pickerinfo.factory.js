/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define(['csui/lib/underscore',
  'csui/utils/contexts/factories/factory',
  'csui/utils/contexts/factories/connector',
  'conws/models/pickers/pickerinfo.model'
], function (_,
  ModelFactory,
  ConnectorFactory,
  PickerInfoModel) {

  var PickerInfoFactory = ModelFactory.extend({

    propertyPrefix: 'pickerInfo',

    constructor: function PickerInfoFactory(context, options) {
      ModelFactory.prototype.constructor.apply(this, arguments);

      var connector = options.pickerInfo.connector || context.getObject(ConnectorFactory, options);

      if (options.model) {
        var forward = options.forward!==undefined ? options.forward : options.model.options.forward;
        this.property = new PickerInfoModel(options.model.attributes,{connector: connector, forward: forward});
        this.property.fetched = options.model.fetched;
      } else {
        this.property = new PickerInfoModel(options.attributes,{connector: connector, forward: options.forward});
        this.listenToOnce(this.property,"sync",function(){
          if (this.property.options.forward) {
            context.getModel(PickerInfoFactory,{
              forward: false,
              attributes: _.extend(
                _.omit( options.attributes, "object_id" ),
                {
                  config_id: this.property.get("config_id")
                }
              ),
              model: this.property});
          } else {
            context.getModel(PickerInfoFactory,{
              forward: true,
              attributes: _.extend(
                _.omit( options.attributes, "config_id" ),
                {
                  object_id: this.property.get("object_id")
                }
              ),
              model: this.property});
          }
        });
      }

    },

    fetch: function (options) {
      return this.property.fetch(options);
    }

  });

  return PickerInfoFactory;

});
