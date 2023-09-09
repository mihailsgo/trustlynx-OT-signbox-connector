/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'csui/lib/underscore',
    "csui/lib/jquery",
    'csui/lib/marionette3',
    'i18n!csui/controls/about.box/nls/localized.strings',
    'i18n!csui/pages/start/nls/lang',
    'hbs!csui/controls/about.box/impl/about.box',
    'css!csui/controls/about.box/impl/about.box'
],
    function (_, $, Marionette, lang, publicLang, template) {

        var AboutBoxView = Marionette.View.extend({
            template: template,

            ui: {
                tablinks: ".tablinks",
                tabcontent: ".tabcontent"
            },

            events: {
            },

            constructor: function (options) {
                options || (options = {});
                this.options = options;
                this.infoTextId = _.uniqueId('msg');
                Marionette.View.prototype.constructor.apply(this, arguments);
            },


            templateContext: function () {
                return {
                    copyrights: lang.copyrights,
                    patents: lang.patents,
                    moreInfo:lang.moreInfo,
                    moreInfoLink: lang.moreInfoLink,
                    disclaimer: lang.disclaimer,
                    disclaimerText: lang.disclaimerText,
                    warning: lang.warning,
                    warningText: lang.warningText,
                    infoTextId:  this.infoTextId
                };
            },

            onRender: function () {
                var dialog = this._parent && this._parent._parent && this._parent._parent._parent && this._parent._parent._parent.$el.find('.binf-modal-dialog');
                dialog.attr({
                    'aria-describedby': this.infoTextId,
                    'aria-label': lang.brandTitle + publicLang.ProductName
                });
                dialog.find('.csui-logo-image').attr({
                    'role': 'img',
                    'aria-label': lang.brandTitle + publicLang.ProductName
                });
            },

            handleTabClick: function (event) {
                var target = this.$el.find("#" + event.target.dataset.tabId);
                this.ui.tabcontent.addClass("binf-hidden");
                this.ui.tablinks.removeClass("selected");
                target.removeClass("binf-hidden");
                event.currentTarget.classList.add("selected");
            },

        });
        return AboutBoxView;
    });
