/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/lib/marionette',
    'hbs!xecmpf/controls/table/cells/node.state/impl/external.document.icons',
    'i18n!xecmpf/controls/table/cells/node.state/impl/nls/lang',
    'csui/controls/icons.v2'
], function (module, Marionette, template, lang,  iconRegistry) {

    var ExternalDocument_NodeStateView = Marionette.ItemView.extend({
        tagName: 'li',
        className: 'csui-node-state-cmis',
        template: template,

        constructor: function ExternalDocument_NodeStateView() {
            Marionette.ItemView.prototype.constructor.apply(this, arguments);
        },

        templateHelpers: function () {
            var externalSource = false;

            if (this.model.attributes && this.model.attributes.data && this.model.attributes.data["external_source"]) {
                externalSource = this.model.attributes.data["external_source"];
            }

            var data = { icon: "", toolTip: "" };

            if (externalSource) {

                var tooltip = lang[externalSource];
                if(iconRegistry._icons[externalSource]) {
                    data = {
                        icon: externalSource,
                        tooltip: tooltip
                    };
                }
            }

            return data;
        }


    },
        {
            enabled: function (status) {
                var enabled = false;

                if (status && status.node && status.node.attributes &&
                            status.node.attributes.data && status.node.attributes.data["external_source"]) {
                    enabled = true;
                }

                return enabled;
            }
        });
        return ExternalDocument_NodeStateView;
});
