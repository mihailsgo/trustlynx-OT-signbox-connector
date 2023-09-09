// The model for fetching the workspace templates from the server
csui.define(['csui/lib/jquery', 'csui/lib/underscore', 'csui/utils/url',
  'csui/models/nodes',

], function ( $, _, Url, NodeCollection) {


  var AddbwsfromsidepanelCollection = NodeCollection.extend({

      constructor: function AddbwsfromsidepanelCollection(options) {

        options || (options = {});

        NodeCollection.prototype.constructor.apply(this, arguments);

        if (options && options.connector) {
          options.connector.assignTo(this);
        }

      }
  });

  _.extend(AddbwsfromsidepanelCollection.prototype, {

      url: function () {

        var url =  this.connector.getConnectionUrl().getApiBase('v2'),
            params = {
                where_manual_creation: true,
                where_fixed_creation_location: true,
                expand_templates: true,
                expand_wksp_info: true
            },
            resource = 'businessworkspacetypes' + '?' + $.param(_.omit(params,function (value) {
                return value === null || value === undefined || value === '';
            })),
            getWsTypesUrl = Url.combine(url, resource);

        return getWsTypesUrl;
      }
    }
  );

  return AddbwsfromsidepanelCollection;

});