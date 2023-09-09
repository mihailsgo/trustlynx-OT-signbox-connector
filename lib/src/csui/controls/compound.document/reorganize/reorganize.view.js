/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
'csui/utils/contexts/factories/compound.document.reorganize.factory',
'csui/controls/compound.document/reorganize/reorganize.list.view',
'csui/controls/compound.document/reorganize/reorganize.master.switch.view',
'hbs!csui/controls/compound.document/impl/reorganize',
'css!csui/controls/compound.document/impl/reorganize'
], function (_, $, Marionette, ReorganizeFactory, ReorganizeListView, ReorganizeMasterSwitchView, Template) {
  'use strict';

  var ReorganizeView = Marionette.View.extend({
    className: 'csui-compound-document-form',
    template: Template,

    regions: function () {
      var regions = {
      'compoundDocumentReorderSection': '.csui-compound-document-reorder-section',
      'masterButtonSection': '.csui-master-button-section'
      };
      return regions;
    },

    constructor: function ReorganizeView(options) {
      options || (options = {});
      this.options = options;
      this.collection = this.options.collection ||
        this.options.context.getCollection(ReorganizeFactory, this.options);
      this.collection.options.nodeId = this.options.node.get('id');
      this.collection.fetch();
      Marionette.View.prototype.constructor.call(this, options);
      this.listenToOnce(this.collection, 'sync', this._handleCollectionSync);
    },

    _handleCollectionSync: function () {
      var hasMasterNode = _.filter(this.collection.models, function (model) {
        return model.get('order') === 0;
      });
      this.collection.hasMaster = hasMasterNode.length > 0;
    },

    onRender: function () {
      this.reorganizeListView = new ReorganizeListView({ 
              options: this.options,
              collection: this.collection,
              isdraggable: this.collection.hasMaster,
              originatingView: this});
      this.reorganizeMasterSwitchView = new ReorganizeMasterSwitchView({
        applyFlag: this.reorganizeListView.collection.hasMaster,
        originatingView: this,
        disabled: this.collection.length === 0 ? true : false
      });
      this.reorganizeListView.reorderCollection();
      this.showChildView("compoundDocumentReorderSection", this.reorganizeListView);
      this.showChildView("masterButtonSection", this.reorganizeMasterSwitchView);
      this.listenTo(this.reorganizeMasterSwitchView, 'reorganize:master:enabled', this._reorganizeMasterEnabled);
    },

    _reorganizeMasterEnabled: function (options) {
      this.MasterSwitchEnabled = options.fieldvalue ? true : false;
      var listItems = this.$el.find('.csui-reorder-list li');
      this.reorganizeListView.collection.hasMaster = this.MasterSwitchEnabled;
      this.reorganizeListView.reOrder(listItems);
    }
  });
  return ReorganizeView;
});
