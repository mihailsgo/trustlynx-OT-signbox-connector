/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/utils/url', 'csui/models/form',
    'csui/models/mixins/resource/resource.mixin'
], function (_, Url, FormModel, ResourceMixin) {
    'use strict';

    var WorkflowAttrModel = FormModel.extend({

        constructor: function WorkflowAttrModel(attributes, options) {
            FormModel.prototype.constructor.apply(this, arguments);

            this.makeResource(options);
        },

        clone: function () {
            return new this.constructor(this.attributes, {
                connector: this.connector
            });
        },

        url: function () {
            var url, urlparms;
            url = new Url(this.connector.connection.url).getApiBase('v2');
            url = Url.combine(url, 'eventactioncenter', 'workflowattributes');
            urlparms = this.get("workflow_id") ? { workflow_id: this.get('workflow_id') } : {};
            urlparms = this.get("id") ? _.extend(urlparms, { id: this.get('id') }) : urlparms;
            url = !!urlparms ? Url.appendQuery(url, Url.combineQueryString(urlparms)) : url;
            return url;
        },

        parse: function (response) {
            var form = !!response.forms && response.forms[0];
            return form;
        }

    });

    ResourceMixin.mixin(WorkflowAttrModel.prototype);

    return WorkflowAttrModel;

});



