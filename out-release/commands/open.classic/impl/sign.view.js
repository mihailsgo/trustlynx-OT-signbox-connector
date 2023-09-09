csui.define(['csui/lib/jquery', 'csui/lib/marionette',
  'i18n!dmss/commands/open.classic/impl/nls/lang',
  'hbs!dmss/commands/open.classic/impl/sign', 'csui/lib/backbone', 'csui/utils/contexts/factories/connector', 'json!dmss/config/info.config.json'
], function ($, Marionette, lang, template, Backbone, ConnectorFactory, config) {
  'use strict';

  var CreateContainerView = Marionette.ItemView.extend({

    initialize: function () {
    },

    fetchCollection: function() {
      if (this.collectionFetched) return;
      this.myCollection.fetch();
      this.collectionFetched = true;
    },
    constructor: function CreateContainerView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.model.set({
        uniqueId: this.cid,
        newName: this.model.get('oldName'),
        lang: lang,
        docs: this.options.docs
      });
    },

    className: 'container-create',

    template: template,

    ui: {
      error: '.container-error',
      submit: '.container-submit',
	  sign: '.container-sign',
      category: '.categories-list',
      versionSelectorRadio: 'version-selector'
    },

    events: {
      'click @ui.submit': function (event) {
        event.preventDefault();
        this._enableSubmit(false);
        this.triggerMethod('submit', this, {sign: false});
      },
      'click @ui.sign': function (event) {
        event.preventDefault();
        this._enableSubmit(false);
        this.triggerMethod('submit', this , {sign: true});
      }
    },

    modelEvents: {
      'change:errorMessage': function () {
        var errorMessage = this.model.get('errorMessage') || '',
            classMethod = errorMessage ? 'removeClass' : 'addClass';
        this.ui.error
            [classMethod]('binf-hidden')
            .text(errorMessage);
      }
    },

    onDomRefresh: function () {
      //this.ui.name.focus();
    },

    _shareFormFilled: function(){
       return true;
    },

    _enableSubmit: function (enable) {
      if (enable) {
        this.ui.submit
            .removeClass('binf-disabled')
            .removeAttr('disabled');
		this.ui.sign
            .removeClass('binf-disabled')
            .removeAttr('disabled');
      } else {
        this.ui.submit
            .addClass('binf-disabled')
            .attr('disabled', 'disabled');
        this.ui.sign
            .addClass('binf-disabled')
            .attr('disabled', 'disabled');
      }
    }

  });
  return CreateContainerView;
});
