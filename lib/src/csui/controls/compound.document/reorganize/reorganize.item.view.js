/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
    'csui/controls/node-type.icon/node-type.icon.view',
    'hbs!csui/controls/compound.document/impl/reorganize.item',
    'i18n!csui/controls/compound.document/nls/root/localized.strings',
    'css!csui/controls/compound.document/impl/reorganize'
], function (_, $, Marionette, NodeTypeIconView, ReorganizeTemplate, lang) {
    'use strict';
    
    var ReorganizeItemView = Marionette.View.extend({
        className: function () {
            var className = 'csui-reorder-item';
            if (_.contains([1, 2, 136], this.model.get("type"))) { // shortcut, generation and compound document cannot be made master
                className = className + ' csui-non-master-item';
            }
            return className;
        },
        tagName: 'li',
        template: ReorganizeTemplate,

        attributes: function () {
            return {
                draggable: 'true',
                'data-order-id': this.model.get('order'),
                'data-type': this.model.get('type'),
                'id': this.model.get('id'),
                'tabindex': 0,
                'role':'menuitem'
            };
        },

        templateContext: function () {
            return {
                name: this.model.get('name'),
                order: this.model.get('order') === 0 ? lang.MasterCompoundDocumentLabel : this.model.get('order'),
                type_name: this.model.get('type_name')
            };
        },

        constructor: function ReorganizeItemView(options) {
            options || (options = {});
            this.options = options;
            Marionette.View.prototype.constructor.call(this, options);
        },

        onRender: function (e) {
            this._nodeIconView = new NodeTypeIconView({
                el: this.$('.csui-type-icon').get(0),
                node: this.model
            });
            this._nodeIconView.render();
        }
    });

    return ReorganizeItemView;
});