/**
 * Created by stefang on 06. Dec. 2019.
 */
// Fetches the workspace id of the effective businessworkspace for a given node.
csui.define(['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/url',
  'csui/models/mixins/resource/resource.mixin'
], function ($, _, Backbone,
    Url,
    ResourceMixin) {

    var PickerInfoModel = Backbone.Model.extend({

    constructor: function PickerInfoModel(attributes, options) {
      options || (options = {});

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.options = options;

      this.makeResource(options);

    }

  });

  ResourceMixin.mixin(PickerInfoModel.prototype);

  _.extend(PickerInfoModel.prototype, {

    url: function () {
      var columnId = this.get('config_id');
      var nodeId = this.get('object_id');
      var pickerType = this.get('picker_type');
      var baseUrl = this.connector.getConnectionUrl().getApiBase('v2');
      var getUrl = Url.combine(baseUrl, 'pickers', pickerType);
      var queryObj = {};
      if (this.options.forward===undefined) {
        this.options.forward = nodeId!==undefined || columnId===undefined;
      }
      if (this.options.forward) {
        queryObj.object_id = nodeId;
      } else {
        queryObj.config_id = columnId;
      }
      var query = Url.combineQueryString(queryObj);
      var url = Url.appendQuery(getUrl,query);
      return url;
    },

    parse: function (response) {

      return response&&response.results&&response.results.data;
    },

    toString: function () {
      // Format a string for logging purposes
      return "pickerinfo:" + this.get('picker_type') + this.get('config_id') + "," + this.get('object_id');
    }

  });

  return PickerInfoModel;

});
