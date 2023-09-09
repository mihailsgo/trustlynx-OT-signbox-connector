/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/utils/contexts/factories/node'
], function (_, NodeModelFactory) {

    var generalUtils = _.extend({

        getCaseInsensitiveProperty: function(obj, name) {
            if (obj && name){
                return obj[name] || obj[_.find(_.keys(obj), function(key){
                    return key.toLowerCase() === name.toLowerCase();
                })];
            } else {
                return undefined;
            }
        },

        getCurrentNode: function(context){
            return context.getModel(NodeModelFactory);
        },

        isWebReportNodeContext: function(context){
            var currentNode = this.getCurrentNode(context);
            return currentNode && ( currentNode.get("type") === 30303 );
        }

    });

    return generalUtils;
});
