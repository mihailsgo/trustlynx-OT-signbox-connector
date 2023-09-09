/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/jquery',
    'csui/lib/underscore',
    'webreports/utils/url.webreports'
], function ($, _, Url) {
    "use strict";

    var WebReportsViewMixin = {

        mixin: function (prototype) {
            return _.extend(prototype, {

                setCommonModelOptions: function(options){
                    var modelOptions = {};

                    if (options && options.data) {

                        this.setModelParameters(options, modelOptions);
                        if (options.data.id) {
                            _.extend(modelOptions,{id: options.data.id});
                        }
                        if (options.context) {
                            _.extend(modelOptions,{context: options.context});
                        }

                    }

                    return modelOptions;
                },

                setModelParameters: function(options, modelOptions){
                    var parameters;
                    if (_.has(options.data, 'parameters')) {
                        parameters = options.data.parameters;
                        if(!_.isUndefined(parameters) && typeof parameters === "object") {
                            _.extend(modelOptions,{parameters: parameters});
                            _.extend( modelOptions, Url.getWebReportParametersAsData(parameters));
                        }
                    }
                },

                getWidgetFactory: function(options, WidgetFactory, modelOptions) {
                    var factory;

                    if (options && options.context && WidgetFactory && modelOptions) {
                        factory = options.context.getFactory(WidgetFactory, { attributes: modelOptions } );
                    }

                    return factory;
                },

                getFactory: function(){
                    return this._factory;
                },

                setFactory: function(factory){
                    this._factory = factory;
                }
            });
        }
    };

    return WebReportsViewMixin;
});
