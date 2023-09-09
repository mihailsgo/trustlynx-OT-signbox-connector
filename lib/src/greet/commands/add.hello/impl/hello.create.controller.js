/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
    'csui/utils/url'
], function (_, $, Backbone, Url) {

  function HelloCreateController() {}

  _.extend(HelloCreateController.prototype, Backbone.Events, {
    createItem: function (node, formvalues) {
      var formData = new FormData();
      formData.append('body', JSON.stringify(formvalues));

      var options = {
        type: 'POST',
        url: Url.combine(Url.combine(node.connector.connection.url, '/hellonodes')),
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
          node.set(response);
        }
      };

      node.connector.extendAjaxOptions(options);
      return $.ajax(options);
    }

  });

  return HelloCreateController;

});
