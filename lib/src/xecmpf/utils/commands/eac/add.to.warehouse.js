/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'require', 'csui/lib/underscore', 'csui/lib/jquery',
  'i18n!xecmpf/widgets/eac/impl/nls/lang',
  'csui/utils/commands/node',
  'csui/models/nodechildren',
  'csui/utils/commands/open.classic.page',
  'csui/utils/url'
], function (module, require, _, $, lang, NodeCommand, NodeChildrenCollection, OpenClassicPageCommand, Url) {
  'use strict';

  var ConnectorFactory, NodeModelFactory;

  var config = _.extend({
    enabled: true,
    openInNewTab: null
  }, module.config());
  if (config.openInNewTab == null) {
    config.openInNewTab = OpenClassicPageCommand.openInNewTab;
  }
  var AddToWarehouseCommand = NodeCommand.extend({
    defaultPagesList: [],
    defaults: {
      signature: 'addToWarehouse',
      command_key: ['addToWarehouse', 'addToWarehouse'],
      name: lang.addToWareHouse,
      successMessages: {
        formatForNone: lang.addToWareHouse,
        formatForOne: lang.addToWareHouse,
        formatForTwo: lang.addToWareHouse,
        formatForFive: lang.addToWareHouse
      },
      errorMessages: {
        formatForNone: lang.addToWareHouseFailure,
        formatForOne: lang.addToWareHouseFailure,
        formatForTwo: lang.addToWareHouseFailure,
        formatForFive: lang.addToWareHouseFailure
      }
    },
    enabled: function (status) {
      var enabled = false;
      if (!!status && !!status.nodes.models) {
        status.nodes.models.forEach(function (model) {
          if ( ( model.get('type') === 806 ) && !!model.actions.get({signature: 'addToWarehouse'}) ) {
            if ( model.get('action_plan_count') > 0 ) {
              model.isEvent = true;
              enabled = true;
            }
          }
          if ( ( model.get('type') === 875 ) && !!model.actions.get({signature: 'addToWarehouse'}) ) {
            enabled = true;
          }
        });
      } else {
        enabled = false;
      }
      return enabled;
    },
    execute: function (status, options) {
      var deferred = $.Deferred(),
        context = status.context || options && options.context,
        target = config.openInNewTab && window.open('', '_blank') || window,
        self = this;
      target.focus();
      require(['csui/utils/contexts/factories/connector',
        'csui/utils/contexts/factories/node'
      ], function () {
        ConnectorFactory = arguments[0];
        NodeModelFactory = arguments[1];
        var children, promises, rawWhen = $.when, deferred = $.Deferred();
        $.whenAll = function (promise) {
          if ($.isArray(promise)) {
            var dfd = $.Deferred();
            rawWhen.apply($, promise).done(function () {
              dfd.resolve(Array.prototype.slice.call(arguments));
            }).fail(function () {
              dfd.reject(Array.prototype.slice.call(arguments));
            });
            return dfd.promise();
          }
          else {
            return rawWhen.apply($, arguments);
          }
        };
        promises = status.nodes.models.map(function (model) {
          if (model.isEvent) {
            children = new NodeChildrenCollection(undefined, {
              node: model
            });
            model.nodeCollection = children;
            return children.fetch();
          } else {
            target.location.href = self._getUrl(context, status);
            deferred.resolve();
          }
        });
        $.whenAll(promises)
          .then(function () {
            target.location.href = self._getUrl(context, status);
            deferred.resolve();
          });
      }, deferred.reject);
    },

    _getUrl: function (context, status) {
      var connector = context.getObject(ConnectorFactory),
        cgiUrl = new Url(connector.connection.url).getCgiScript(),
        urlQueryParameters = this._getUrlQueryParameters(context, status, cgiUrl),
        urlQuery = Url.combineQueryString(urlQueryParameters);
      return Url.appendQuery(cgiUrl, urlQuery);
    },

    _getUrlQueryParameters: function (context, status, cgiUrl) {
      var parameters, nodeID_list = [];
      if (!!status.nodes.models) {
        status.nodes.models.forEach(function (model) {
          if (model.isEvent) {
            model.nodeCollection.models.forEach(function (apmodel) {
              nodeID_list.push(apmodel.get('id'));
            });
          } else {
            nodeID_list.push(model.get('id'));
          }
        });
      }
      else {
        return parameters;
      }
      if (nodeID_list.length > 1) {
        parameters = {
          func: 'transport.ProcessMultiAddToWarehouse',
          nodeID: nodeID_list,
          nextUrl: cgiUrl
        };
      } else {
        parameters = {
          func: 'll',
          objId: nodeID_list[0],
          objAction: 'addToWarehouse',
          nextUrl: cgiUrl
        };
      }
      return parameters;
    }
  });
  return AddToWarehouseCommand;
});