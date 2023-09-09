/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery',
    'csui/dialogs/node.picker/start.locations/location.base.factory',
    'csui/models/node.children2/node.children2', 'csui/utils/commands',
    'i18n!workflow/dialogs/node.picker/start.locations/workitem.attachments/impl/nls/lang'
], function (_, $, LocationBaseFactory, NodeChildren2Collection, commands, lang) {
    "use strict";

    var WorkitemAttachmentsFactory = LocationBaseFactory.extend({

        updateLocationModel: function (model) {
            var container = this.options.container.get("attachmentContainer");
            model.set({
                name: lang.labelAttachments,
                icon: 'icon mime_workflow_map',
                invalid: !(container && container.isFetchable())
            });
            return ensureNodeID(container, model);
        },

        getLocationParameters: function () {
            var container = this.options.container.get("attachmentContainer");
            var children = new NodeChildren2Collection(undefined, {
                node: container,
                autoreset: true,
                expand: {
                    properties: ['original_id', 'parent_id']
                },
                fields: {
                    properties: []
                },
                commands: 'default,open'
            });
            container.set('unselectable', false);
            return {
                container: container,
                collection: children,
                locationName: lang.labelAttachments
            };
        }
    });

    function ensureNodeID(node, startLocation) {
        var deferred = $.Deferred();
        if (node && node.isFetchable() && !node.isFetchableDirectly()) {
            node.fetch()
                .then(function () {
                    deferred.resolve();
                }, function () {
                    startLocation.set({ invalid: true });
                    startLocation.collection.remove(startLocation);
                    deferred.reject();
                });
        } else {
            deferred.resolve();
        }
        return deferred.promise();
    }

    return WorkitemAttachmentsFactory;
});
