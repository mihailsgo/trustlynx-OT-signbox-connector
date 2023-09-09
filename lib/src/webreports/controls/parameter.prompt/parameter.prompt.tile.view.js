/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/utils/base',
    'csui/controls/tile/tile.view',
    'webreports/controls/parameter.prompt/parameter.prompt.view',
    'hbs!webreports/controls/parameter.prompt/impl/parameter.prompt.tile.view',
    'i18n!webreports/controls/parameter.prompt/impl/nls/parameter.prompt.lang'
], function(_, $, base, TileView, ParameterPromptView, template, lang) {
    'use strict';

    var ParameterPromptTileView = TileView.extend({

        templateHelpers: function() {

            var options = this.options,
                originatingViewOptions = (options && _.has(options,'originatingView') && _.has(options.originatingView,'options')) ? options.originatingView.options : false,
                titleObj = (originatingViewOptions && _.has(originatingViewOptions,'data') && _.has(originatingViewOptions.data,'title') && _.isObject(originatingViewOptions.data.title)) ? originatingViewOptions.data.title : lang.defaultPromptTitle,
                iconClass = (originatingViewOptions && _.has(originatingViewOptions,'data') && _.has(originatingViewOptions.data,'titleBarIcon')) ? originatingViewOptions.data.titleBarIcon : 'title-webreports',
                helpers = {
                    title: base.getClosestLocalizedString(titleObj, lang.dialogTitle),
                    icon: iconClass || 'title-webreports'
                };

            return helpers;
        },

        template: template,

        contentView: ParameterPromptView,

        constructor: function ParameterPromptTileView(options) {

            this.contentViewOptions = options;

            TileView.prototype.constructor.call(this, options);

        }

    });

    return ParameterPromptTileView;

});