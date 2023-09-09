/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/marionette3',
        'csui/lib/underscore',
        'csui/behaviors/keyboard.navigation/tabable.region.behavior'
], function (Marionette, _, TabableRegion) {

    var VisualCountButtonView = Marionette.View.extend({

        tagName: 'button',

        className: 'binf-btn',

        template: _.noop,

        triggers: {
            'click': 'click:button'
        },

        behaviors: {
            TabableRegion: {
                behaviorClass: TabableRegion
            }
        },

        constructor: function VisualCountButtonView(options) {
            Marionette.View.prototype.constructor.apply(this, arguments);
        },

        isTabable: function () {
            if (this.$el.attr('tabindex') === '-1') {
                this.$el.attr('tabindex', '0')
            }
            return this.$el.is(':not(:disabled)') && this.$el.is(':not(:hidden)');
        },
        currentlyFocusedElement: function () {
            if (this.$el.prop('tabindex') === -1) {
                this.$el.prop('tabindex', 0);
            }
            return this.$el;
        },

        onRender: function () {
            var button     = this.$el,
                attributes = this.model.attributes;
            button.text(attributes.name);
            button.addClass(
                attributes['default'] ? 'binf-btn-primary cs-add-button' : 'binf-btn-default');
            if (attributes.toolTip) {
                button.attr('title', attributes.toolTip);
            }
            if (attributes.id) {
                button.attr('id', attributes.id);
            }
            if (attributes.separate) {
                button.addClass('cs-separate');
            }
            this.updateButton(attributes);
        },

        updateButton: function (attributes) {

            var $button = this.$el;
            attributes || (attributes = {});
            if (attributes.hidden !== undefined) {
                if (attributes.hidden) {
                    $button.addClass('binf-hidden');
                } else {
                    $button.removeClass('binf-hidden');
                }
            }
            if (attributes.disabled !== undefined) {
                $button.prop('disabled', attributes.disabled);
            }
        }

    });

    return VisualCountButtonView;
});
