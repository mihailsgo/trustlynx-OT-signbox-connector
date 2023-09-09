/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/utils/url', 'csui/models/form',
  'csui/models/mixins/resource/resource.mixin'
], function (_, Url, FormModel, ResourceMixin) {
  'use strict';

  var ReminderFormModel = FormModel.extend({

    constructor: function ReminderFormModel(attributes, options) {
      FormModel.prototype.constructor.apply(this, arguments);

      this.makeResource(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    },

    url: function () {

      var url = Url.combine(this.connector.connection.url, 'forms', 'nodes', 'followup',
          'getClientTypes'),
      urlparms;
      urlparms = this.get("client_id") ? {client_id: this.get('client_id')} : {};
      urlparms = this.get("id") ? _.extend(urlparms, {id: this.get('id')}) : urlparms;
      urlparms =  _.extend(urlparms, {exclude_personal: 'true'});
      url = !!urlparms ? Url.appendQuery(url, Url.combineQueryString(urlparms)) : url;
      return url;

    },

    parse: function (response) {
      var form = !!response.forms && response.forms[0];
      return form;
    }

  });

  ResourceMixin.mixin(ReminderFormModel.prototype);

  return ReminderFormModel;

});



