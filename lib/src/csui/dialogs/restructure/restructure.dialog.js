/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/dialogs/restructure/impl/restructureform/restructureform.view',
  'csui/dialogs/restructure/impl/restructureform/impl/restructureform.model',
  'csui/controls/progressblocker/blocker',
  'hbs!csui/dialogs/restructure/impl/restructure',
  'css!csui/dialogs/restructure/impl/restructure.dialog'
], function (_require, _, $, Marionette,
  LayoutViewEventsPropagationMixin,
  RestructureFormView, RestructureFormModel, BlockingView, template) {

    var RestructureView = Marionette.LayoutView.extend({

      className: 'csui-restructure-wrapper',
      template: template,
  
      regions: {
        formRegion: '#formviewwrapper'
      },
  
      constructor: function RestructureView(options) {
        options || (options = {});
        this.context = options.context;
        this.selectedNodes = options.nodes;
        BlockingView.imbue(this);
  
        Marionette.LayoutView.prototype.constructor.apply(this, arguments);
  
        this.propagateEventsToRegions();
        this.formModel = new RestructureFormModel(undefined, {
          connector: this.options.connector,
          updateFormData: this.options.updateFormData,
          models: this.options.nodes.models,
          container: this.options.container
          });
  
        this.listenTo(this.formModel, 'sync', this.render);
      
  
      },
  
      setFormView: function () {
  
        this.restructureFormView = new RestructureFormView({
          context: this.options.context,
          connector: this.options.connector,
          model: this.formModel
        });
  
        this.listenTo(this.restructureFormView, {
          'valid:form': function () {
            this.options.restructureCommand.restructureDialog.updateButton('restructure', { disabled: false });
            var focusables = this.options.restructureCommand.restructureDialog.footerView.$el.find('#restructure');
            if (focusables.length) {
              $(focusables[0]).prop('tabindex', 0);
            }
          },
          'invalid:form': function () {
            this.options.restructureCommand.restructureDialog.updateButton('restructure', { disabled: true });
          }
        });
      },
  
      onRender: function () {
  
        if (this.formModel.attributes && this.formModel.attributes.data) {
  
          this.setFormView();
          this.formRegion.show(this.restructureFormView);
  
        }
      }
    });
  
    _.extend(RestructureView.prototype, LayoutViewEventsPropagationMixin);
  
    return RestructureView;

});
