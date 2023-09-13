csui.define(['csui/lib/jquery', 'csui/lib/marionette',
  'i18n!dmss/commands/open.classic/impl/nls/lang',
  'hbs!dmss/commands/open.classic/impl/sign', 'csui/lib/backbone', 'csui/utils/contexts/factories/connector', 'json!dmss/config/info.config.json'
], function ($, Marionette, lang, template, Backbone, ConnectorFactory, config) {
  'use strict';

  var CreateContainerView = Marionette.ItemView.extend({

    initialize: function () {
    },

    onRender: function() {
      switch(this.options.mode){
        case 'Sign':
          this.ui.share.hide();
          this.ui.status.text(lang.createContainerInformationModeSign);
          break;
        case 'Share':
          this.ui.sign.hide();
          this.ui.status.text(lang.createContainerInformationModeShare);
          break;
        default: 
          this.ui.status.text(lang.createContainerInformationModeShareOrSin);
          break;
      }
    },

    /*
    fetchCollection: function() {
      if (this.collectionFetched) return;
      this.myCollection.fetch();
      this.collectionFetched = true;
    },
    */

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
      share: '.container-share',
	    sign: '.container-sign',
      status: '.status-placeholder',
      loader: '.load-container',
      verselection: '.otdoc_version',
      conselection: '.otdoc_container'
    },

    events: {
      'click @ui.share': function (event) {
        event.preventDefault();
        this._enableSign(false);
        this._showLoader(true);
        this.triggerMethod('share', this);
      },
      'click @ui.sign': function (event) {
        event.preventDefault();
        this._enableSign(true);
        this._showLoader(true);
        this.triggerMethod('sign', this);
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

    _showLoader: function(show){
        if (show) {
          this.ui.loader
                    .removeClass('binf-hidden');
        } else {
          this.ui.loader
                    .addClass('binf-hidden');          
        }
    },

    _enableSign: function (enable) {
      if (enable) {
        this.ui.sign
            .removeClass('binf-disabled')
            .removeAttr('disabled');
    		this.ui.share
            .addClass('binf-disabled')
            .attr('disabled', 'disabled');
      } else {
        this.ui.sign
            .addClass('binf-disabled')
            .attr('disabled', 'disabled');
        this.ui.share
            .removeClass('binf-disabled')
            .removeAttr('disabled');
      }
    }

  });
  return CreateContainerView;
});
