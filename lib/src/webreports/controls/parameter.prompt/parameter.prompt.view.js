/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    'csui/lib/marionette3',
    'csui/controls/tile/behaviors/perfect.scrolling.behavior',
    'csui/controls/form/form.view',
    'webreports/controls/parameter.prompt/impl/parameter.prompt.footer.view',
    'hbs!webreports/controls/parameter.prompt/impl/parameter.prompt',
    'i18n!webreports/controls/parameter.prompt/impl/nls/parameter.prompt.lang',
    'css!webreports/controls/parameter.prompt/impl/parameter.prompt'
], function(_, Marionette, PerfectScrollingBehavior, FormView, FooterView, template, lang) {
    'use strict';

    var ParameterPromptView = Marionette.View.extend({

        className: 'webreports-parameter-prompt-content',

        template: template,

        wrapTemplate: false,

        regions: {
            promptForm: {
                el: '.webreports-parameter-prompt-form',
                replaceElement: false
            },
            footer: {
                el: '.webreports-parameter-prompt-footer',
                replaceElement: true
            }
        },

        behaviors: {
            PerfectScrolling: {
                behaviorClass: PerfectScrollingBehavior,
                contentParent: '.webreports-parameter-prompt-form-wrapper',
                suppressScrollX: true,
                scrollYMarginOffset: 15
            }
        },

        constructor: function ParameterPromptView(options) {

            Marionette.View.prototype.constructor.call(this, options);

        },

        onRender: function() {
            var options = this.options,
                errorWithForm = (options.promptRoute !== 'showSmartPrompts'),
                formView = new FormView({
                    context: options.context,
                    model: this.model
                }),
                footerView = new FooterView({
                    context: options.context,
                    parentView: this,
                    model: this.model
                }),
                errorView = new Marionette.View({
                    template: false,
                    el: '<div class="csui-no-result-message">' + lang.noFormFields + '</div>'
                }),
                contentView = (errorWithForm) ? errorView : formView;

            this.showChildView('promptForm', contentView);

            if (!errorWithForm){
                this.showChildView('footer', footerView);
            }

        }

    });

    return ParameterPromptView;

});