/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/utils/commands/add',  
  'i18n!xecmpf/utils/commands/nls/localized.strings'
], function (module, require, _, $, Marionette, AddCommand, lang) {

    var config = _.extend({
        enabled: true
      }, module.config());
  var AddEvents = AddCommand.extend({

    defaults: {
      signature: 'addEvents',
      name: lang.addEvents,
      scope: 'single'
    },
    enabled: function (status, options) {
      return config.enabled;
    },

    execute: function (status, options) {
      status.forwardToTable = true;
      var newNode, 
          deferred = $.Deferred(),
          addableTypeName = this._getAddableTypeName(status, options);
      require(['xecmpf/utils/table/inlineforms/eventactioncenter/factories/eventfeedmodel','csui/models/node/node.model'
      ], function (EventFeedCollection ,NodeModel) {

        var collection =  new  EventFeedCollection(undefined,{connector : status.container.connector});
        collection.fetch();
        newNode = new NodeModel({        
          "type": options.addableType,
          "type_name": addableTypeName,
          "collection":collection,
          "container": true,
        },{connector: status.container.connector,
        collection:collection});
            $.Deferred().resolve(newNode).promise()
            .done(function(){
              deferred.resolve.apply(deferred, arguments);
            }).fail(function(){
          deferred.reject.apply(deferred, arguments);
        });
      }, function (error) {
        deferred.reject(error);
      });
      return deferred.promise();
    }
  });

  return AddEvents;
});