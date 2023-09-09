/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
	'require', 'csui/lib/underscore', 'csui/lib/jquery',
	'i18n!csui/utils/commands/nls/localized.strings', 'csui/utils/url',
	'csui/models/command', 'csui/models/node/node.model'
], function (require, _, $, lang, Url, CommandModel, NodeModel) {
	'use strict';
	var GlobalMessage, ConnectorFactory, NextNodeModelFactory, nodeLinks;

	var UpdateQueryCommand = CommandModel.extend({
		defaults: {
			signature: "UpdateQuery",
			command_key: ['updatequery', 'UpdateQuery'],
			name: lang.CommandNameUpdateQuery,
			verb: lang.CommandVerbUpdateQuery
		},

		execute: function (status, options) {
			var deferred = $.Deferred();
			var context = status.context || options && options.context;
			status.suppressSuccessMessage = true;
			require([
				'csui/controls/globalmessage/globalmessage',
				'csui/utils/contexts/factories/connector',
				'csui/utils/contexts/factories/next.node',
				'csui/utils/node.links/node.links'
			], function () {
				GlobalMessage = arguments[0];
				ConnectorFactory = arguments[1];
				NextNodeModelFactory = arguments[2];
				nodeLinks = arguments[3];

				var url = status.connector.getConnectionUrl().getApiBase('v2');
				var ajaxFormData = {
					'search_cache_id': options.cache_id
				};
				var updateQueryOptions = {
					url: Url.combine(url, '/nodes/', options.queryId),
					type: 'PUT',
					data: ajaxFormData,
					contentType: 'application/x-www-form-urlencoded'
				};

				status.connector.makeAjaxCall(updateQueryOptions)
					.done(function (resp) {
						deferred.resolve(resp.results);
						var updatedQueryParentNode = new NodeModel({ id: resp.results.data.properties.parent_id },
							{ connector: context.getObject(ConnectorFactory) }),
							name = resp.results.data.properties.name,
							msg = _.str.sformat(lang.UpdateQueryCommandSuccessfully, name),
							options = {
								context: context,
								nextNodeModelFactory: NextNodeModelFactory,
								link_url: nodeLinks.getUrl(updatedQueryParentNode),
								targetFolder: updatedQueryParentNode
							},
							dets;
						GlobalMessage.showMessage('success_with_link', msg, dets, options);
					})
					.fail(function (error) {
						deferred.reject(error);
						if (error && error.responseText) {
							var errorObj = JSON.parse(error.responseText);
							GlobalMessage.showMessage('error', errorObj.error);
						}
					});
			}, function (error) {
				deferred.reject(error);
			});
			return deferred.promise();
		}
	});

	return UpdateQueryCommand;
});