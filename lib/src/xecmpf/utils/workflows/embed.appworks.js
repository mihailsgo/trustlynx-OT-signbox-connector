/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/url',
  'csui/controls/globalmessage/globalmessage',
  'csui/controls/progressblocker/blocker',
  'hbs!xecmpf/utils/workflows/impl/embed.appworks',
  'i18n!xecmpf/utils/workflows/impl/nls/lang',
  'css!xecmpf/utils/workflows/impl/embed.appworks'

], function (require, _, $, Backbone, Marionette, Url, GlobalMessage, BlockingView, EmbedAppworksTemplate, lang) {
  var EmbedAppWorksView = Marionette.ItemView.extend({

    template: EmbedAppworksTemplate,

    tagName: 'div',

    className: 'xecm4gov-embed-appworks-view',


    constructor: function EmbedAppWorksView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.call(this, options);
      BlockingView.imbue(this);
    },
    generateIframeElement: function () {
      var embedAppWorksIframe,
          that = this,
          embedAppWorksDocEle;
      this.$el.find(".embed-appWorks-iframe").remove();
      embedAppWorksIframe = document.createElement("iframe");
      embedAppWorksIframe.setAttribute("id", "embedAppWorks");
      embedAppWorksIframe.setAttribute("name", "embedAppWorks");
      embedAppWorksIframe.setAttribute("class", "embed-appWorks-iframe");
      embedAppWorksIframe.setAttribute("aria-label", lang.workflow);

      this.$el.find(".xecm4gov-embed-appworks").append(embedAppWorksIframe);
      if (embedAppWorksIframe) {
        embedAppWorksIframe.addEventListener("load", function () {
          that.unblockActions();
          var bundesWindow = embedAppWorksIframe.contentWindow;
          if (bundesWindow && that.validHost) {
            window.clientIntervalID = window.setInterval(function () {
              bundesWindow.postMessage({ name: "subscribe" }, that.validHost);
            }, 200);
          }
         
        }, that);
      }
    },
    loadUrlInIframe: function (urlToLoad) {
      this.validHost = this.options.validHost || "";
      this.blockActions();
      this.generateIframeElement();
      this.$el.find("#embedAppWorks").attr("src", urlToLoad);
      this.addMethodToGlobalContext();
    },

    addMethodToGlobalContext: function () {
      var self = this;
      var currentOptions = this.options;
      var bwsId = currentOptions.bwsId;
      var workflowInstanceid = currentOptions.wfinstanceid;
      var isActionLevel = currentOptions.action || "workflow";
      var callbackFunction = currentOptions.callback;
      isActionLevel = isActionLevel.toLowerCase();

      if (self.validHost) {

        var listener = function(event) {

          if (event.origin !== self.validHost){
            return;
          }

          if (event.data.name === 'subscribed'){
            window.clearInterval(window.clientIntervalID);
          }

          if (event.data.name === 'unsubscribed'){
            window.console.log('unsubscribed to client message');
          }

          if (event.data.name === 'workflow-started'){
            self.options.dialogView.trigger('close:appworks:dialog');
            GlobalMessage.showMessage("success", lang.startWorkflow);
            window.removeEventListener('message',listener, false);
          }

          if (event.data.name === 'workflow-cancelled'){
            self.options.dialogView.trigger('cancel:appworks:workflow');
            GlobalMessage.showMessage("success", lang.cancelWorkflow);
            window.removeEventListener('message', listener, false);
          }

        }

        window.addEventListener('message', listener, false);

      }

    }

  });

  return EmbedAppWorksView;

});