/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/url',
  'csui/controls/progressblocker/blocker',
  'hbs!xecmpf/utils/createdocument/impl/embed.powerdocs',
  'i18n!xecmpf/utils/createdocument/nls/createdocument.lang',
  'css!xecmpf/utils/createdocument/impl/embed.powerdocs'

], function (require, _, $, Backbone, Marionette, Url, BlockingView, EmbedPowerdocsTemplate, lang) {
  var EmbedPowerDocsView = Marionette.ItemView.extend({

    template: EmbedPowerdocsTemplate,

    tagName: 'div',

    className: 'xecmpf-embed-powerdocs-view',

    constructor: function DocumentTypeView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.call(this, options);
      BlockingView.imbue(this);
    },
    generateIframeElement: function () {
      var embedPowerDocsIframe,
        self = this,
        embedPowerDocsDocEle,
        embedPowerDocsHeaderEle;
      this.$el.find(".embed-powerDocs-iframe").remove();
      embedPowerDocsIframe = document.createElement("iframe");
      embedPowerDocsIframe.setAttribute("id", "embedPowerDocs");
      embedPowerDocsIframe.setAttribute("name", "embedPowerDocs");
      embedPowerDocsIframe.setAttribute("class", "embed-powerDocs-iframe");
      this.$el.find(".xecmpf-embed-powerdocs").append(embedPowerDocsIframe);
      if (embedPowerDocsIframe) {
        embedPowerDocsIframe.addEventListener("load", function () {
          self.unblockActions();
          var styleEle;
          if (embedPowerDocsIframe.contentWindow && embedPowerDocsIframe.contentWindow.document) {
            embedPowerDocsDocEle = embedPowerDocsIframe.contentWindow.document;
            styleEle = embedPowerDocsDocEle.createElement("style");
            styleEle.innerHTML = "html{ overflow: auto } body{ height: auto }";
            embedPowerDocsDocEle.head.appendChild(styleEle);
          }
        });
      }
    },
    loadUrlInIframe: function ( urlToLoad ) {
      this.blockActions();
      this.generateIframeElement();
      this.$el.find("#embedPowerDocs").attr( "src", urlToLoad );
    },
     loadPFPowerDocsUrl: function (cgiUrl, wsId, submitRequest ) {
      var documentGenerationForm = document.createElement('form'),
        formElement = document.createElement('input');
      this.blockActions();
      this.generateIframeElement();
      $(documentGenerationForm).attr({
        name: 'DocumentGeneration',
        id: 'DocumentGeneration',
        method: 'post',
        target: 'embedPowerDocs',
        action: cgiUrl
      });
      $(formElement).attr({
        type: 'hidden',
        value: submitRequest,
        name: 'func'
      });
      documentGenerationForm.appendChild(formElement);
    
      formElement = document.createElement('input');
      $(formElement).attr({
        type: 'hidden',
        value: wsId,
        name: 'wsId'
      });
      documentGenerationForm.appendChild(formElement);

      formElement = document.createElement('input');
      $(formElement).attr({
        type: 'hidden',
        value: true,
        name: 'hideHeader'
      });
      documentGenerationForm.appendChild(formElement);
      document.body.appendChild(documentGenerationForm);
      documentGenerationForm.submit();
      document.body.removeChild(documentGenerationForm);
    },
    loadPowerDocsUrl: function (cgiUrl, wsId, effectiveDate, documentContext, source ) {
      var documentGenerationForm = document.createElement('form'),
        formElement = document.createElement('input');
      this.blockActions();
      this.generateIframeElement();
      $(documentGenerationForm).attr({
        name: 'DocumentGeneration',
        id: 'DocumentGeneration',
        method: 'post',
        target: 'embedPowerDocs',
        action: cgiUrl
      });
      $(formElement).attr({
        type: 'hidden',
        value: 'xecmpfdocgen.PowerDocsPayload',
        name: 'func'
      });
      documentGenerationForm.appendChild(formElement);
      if (effectiveDate) {
        formElement = document.createElement('input');
        $(formElement).attr({
          type: 'hidden',
          value: effectiveDate,
          name: 'featureDate'
        });
        documentGenerationForm.appendChild(formElement);
      }

      if (documentContext) {
        formElement = document.createElement('input');
        $(formElement).attr({
          type: 'hidden',
          value: documentContext,
          name: 'context'
        });
        documentGenerationForm.appendChild(formElement);
      }

      if (source) {
        formElement = document.createElement('input');
        $(formElement).attr({
          type: 'hidden',
          value: source,
          name: 'source'
        });
        documentGenerationForm.appendChild(formElement);
      }
      formElement = document.createElement('input');
      $(formElement).attr({
        type: 'hidden',
        value: wsId,
        name: 'wsId'
      });
      documentGenerationForm.appendChild(formElement);

      formElement = document.createElement('input');
      $(formElement).attr({
        type: 'hidden',
        value: true,
        name: 'hideHeader'
      });
      documentGenerationForm.appendChild(formElement);
      document.body.appendChild(documentGenerationForm);
      documentGenerationForm.submit();
      document.body.removeChild(documentGenerationForm);
    }

  });

  return EmbedPowerDocsView;

});