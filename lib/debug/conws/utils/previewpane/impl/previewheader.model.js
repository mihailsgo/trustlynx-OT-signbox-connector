csui.define([
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/utils/url',
  'csui/utils/base',
  'i18n!conws/utils/previewpane/impl/nls/previewpane.lang'
], function (_, Backbone, Url, base, lang) {

  var PreviewHeaderModel = Backbone.Model.extend({

    // constructor gives an explicit name to the object in the debugger
    constructor: function PreviewHeaderModel(options) {
      Backbone.Model.prototype.constructor.call(this, {
            id: options.node.get('id'),
            typeName: base.getClosestLocalizedString(options.config.typeName, ""),
            name: options.node.get('name'),
            quickLinkTooltip: lang.quickLinkTooltipText
          },
          options
      );

      options || (options = {});

      // enable the model for communication with the CS REST API
      if (options && options.node && options.node.connector) {
        options.node.connector.assignTo(this);
      }
    },

    isFetchable: function () {
      return true;
    },

    // computes the REST API URL used to access the metadata.
    url: function () {
      return Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), 'businessworkspaces/' + this.get('id'));
    },

    // parses the REST call response and stores the data
    parse: function (response) {
      var ret = response.results && response.results.data && response.results.data.business_properties;
      this.display_url = ret && ret.display_url;
      return ret;
    }
  });

  // return the model
  return PreviewHeaderModel;
});
