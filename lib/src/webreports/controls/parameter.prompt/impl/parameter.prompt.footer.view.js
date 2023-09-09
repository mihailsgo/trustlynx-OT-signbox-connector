/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/marionette3',
    'hbs!webreports/controls/parameter.prompt/impl/parameter.prompt.footer',
    'i18n!webreports/controls/parameter.prompt/impl/nls/parameter.prompt.lang',
    'css!webreports/controls/parameter.prompt/impl/parameter.prompt'
], function(_, $, Marionette, template, lang){
    'use strict';

    var ParameterPromptFooterView = Marionette.View.extend({

        className: 'webreports-parameter-prompt-footer',

        template: template,

        templateContext: function () {
            var options = this.options || {};
            return {
                showCancelButton: options.showCancelButton,
                cancel: lang.cancel,
                runReport: lang.runReport
            };
        },

        ui: {
            submitPrompt: '.binf-btn.binf-btn-primary.submitPrompt',
            cancelPrompt: '.binf-btn.binf-btn-primary.cancelPrompt'
        },

        events: {
            'click @ui.submitPrompt': 'submitPrompt',
            'click @ui.cancelPrompt': 'cancelPrompt'
        },

        constructor: function ParameterPromptFooterView(options) {

            Marionette.View.prototype.constructor.call(this, options);

        },

        submitPrompt: function() {

            var options = this.options,
                originatingView = options.parentView.options.originatingView,
                formView = options.parentView.getChildView('promptForm'),
                formValues = (formView) ? formView.getValues() : {},
                eventArgs = {
                    view: options.parentView,
                    formValues: formValues
                };

            if (formView && formView.validate()){
                if (originatingView) {
                    originatingView.trigger('prompt:form:submitted', eventArgs);
                }
                else {
                    this.trigger('prompt:form:submitted', eventArgs);
                }
            }
        },

        cancelPrompt: function() {
            var options = this.options;

            if (options && options.originatingView) {
                options.originatingView.trigger('prompt:form:cancelled');
            }
            else {
                this.trigger('prompt:form:cancelled');
            }
        }
    });

    return ParameterPromptFooterView;

});