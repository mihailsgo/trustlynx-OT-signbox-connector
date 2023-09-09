/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette', // Third party libraries
    'csui/controls/tile/behaviors/expanding.behavior'
], function (require, $, _, Backbone, Marionette, TileExpandingBehavior) {
    "use strict";

    var VisualDataExpandingBehavior = TileExpandingBehavior.extend({

        triggers: {
            'click .cs-more': 'expand'
        },

        _expand: function () {
            if (this.view && this.view.chartCollection && !this.view.chartCollection.isEmpty()) {
                var expandedViewValue = this.getOption('expandedView'),
                    expandedViewClass = expandedViewValue.prototype instanceof Backbone.View ?
                        expandedViewValue : expandedViewValue.call(this.view),
                    requiredModules = ['csui/controls/dialog/dialog.view'],
                    self = this;
                if (_.isString(expandedViewClass)) {
                    requiredModules.push(expandedViewClass);
                }
                require(requiredModules, function (DialogView) {
                    if (_.isString(expandedViewClass)) {
                        expandedViewClass = arguments[1];
                    }
                    var expandedViewOptions = getOption.call(self, 'expandedViewOptions'),
                        expandedView = new expandedViewClass(expandedViewOptions);

                    self._dialog = new DialogView({
                        iconLeft: getOption.call(self, 'titleBarIcon'),
                        imageLeftUrl: getOption.call(self, 'titleBarImageUrl'),
                        imageLeftClass: getOption.call(self, 'titleBarImageClass'),
                        title: getOption.call(self, 'dialogTitle'),
                        iconRight: getOption.call(self, 'dialogTitleIconRight'),
                        className: 'cs-expanded ' + (getOption.call(self, 'dialogClassName') || ''),
                        buttons: expandedViewOptions.buttons,
                        largeSize: true,
                        view: expandedView
                    });
                    self.listenTo(self._dialog, 'hide', function () {
                        self.view.trigger("collapse");
                        self.triggerMethod('collapse');
                    });
                    if (self.view.overlayVisible) {
                        self.view.ui.toggleSettings.trigger('click');
                    }
                    self._dialog.show();
                    $('.webreports-visual-count-facetpanelview .cs-content .csui-facet-item-checkbox button', '.webreports-visual-data.binf-modal .binf-modal-content')
                    .attr('tabindex', '-1');
                });
            }
        }

    });

    function getOption(property) {
        var options = this.options || {};
        var value = options[property];
        return _.isFunction(value) ? options[property].call(this.view) : value;
    }

    return VisualDataExpandingBehavior;

});
