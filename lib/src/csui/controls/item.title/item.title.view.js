/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/log',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/controls/item.title/impl/name/name.view',
  'csui/controls/item.title/impl/dropdown.menu/dropdown.menu.view',
  'csui/controls/item.title/impl/node.state/node.state.view',
  'hbs!csui/controls/item.title/impl/item.title',
  'csui/utils/contexts/factories/ancestors',
  'css!csui/controls/item.title/impl/item.title'
], function ($, _, Backbone, Marionette, log,
    NodeTypeIconView,
    ItemTitleNameView,
    DropdownMenuView,
    NodeStateView,
    template,
    AncestorCollectionFactory) {
  'use strict';

  var TITLEVERSIONSTYLE = 'csui-item-title-version-style';
  var ItemTitleView = Marionette.LayoutView.extend({
    className: 'csui-item-title',
    template: template,

    ui: {
      icon: '.csui-item-title-icon',
      name: '.csui-item-title-name',
      menu: '.csui-item-title-menu',
      nodeState: '.csui-item-title-node-state',
      versionNumberState: '.csui-item-title-version'
    },

    regions: {
      iconRegion: '@ui.icon',
      nameRegion: '@ui.name',
      menuRegion: '@ui.menu',
      nodeStateRegion: '@ui.nodeState'
    },

    constructor: function ItemTitleView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
    },

    initialize: function () {
      this.iconView = new NodeTypeIconView({
        node: this.options.model
      });

      this.nameView = new ItemTitleNameView({
        context: this.options.context,
        model: this.options.model,
        originatingView: this.options.originatingView,
        nameSchema: this.options.nameSchema
      });
      this.listenTo(this.nameView, 'changed:editmode', function (modeIsEditing) {
        if (modeIsEditing) {
          this.ui.menu.addClass('binf-hidden');
        } else {
          this.ui.menu.removeClass('binf-hidden');
        }
      });

      this.menuView = new DropdownMenuView({
        context: this.options.context,
        model: this.options.model,
        originatingView: this.options.originatingView,
        toolItems: this.options.toolItems,
        toolItemsMask: this.options.toolItemsMask,
        commands: this.options.commands
      });
      this.listenTo(this.menuView, 'rename', function () {
        this.nameView._toggleEditMode.call(this.nameView, true);
      });

      this.nodeStateView = new NodeStateView({
        context: this.options.context,
        model: this.options.model,
        tableView: this.options.originatingView
      });
    },
    getSourceOfCompoundDocuments: function(models){
      if(!models || models.length === 0){
        return false;
      }
      var len = models.length;

      var lastElm = models[len-1];

      if(lastElm && lastElm.type === 136){
          var previuosElm = models[len-2];
          if(previuosElm && (previuosElm.type === 138 || previuosElm.type === 139)){
            return previuosElm;
          }

          return false;
      }
      return false;
    },
    getAncestorModels: function(id){
      var deferred = $.Deferred();      
      this.options.originatingView.connector.makeAjaxCall({url: this.getURL(id)})
      .then(function (response) {
        return  deferred.resolve(response);
      }).catch(function(error){
        return  deferred.reject(error);
      });

      return deferred.promise();
    },

    getURL: function(id){
      var url = "";
      if(!id){
        return url;
      }
      url =  this.options.originatingView.connector.getConnectionUrl().getApiBase('v2');
      if(url){
        url+='nodes/' + Math.abs(id) + '/releases';
      }
      return url;

    },
    getVesionNoNType: function(id, arr){
      if(!id || !arr || arr.length === 0){
        return false;
      }
      var versionNo, len = arr.length;
      for(var i=0; i<len; i++){
        if(arr[i].data && arr[i].data.properties 
          && arr[i].data.properties.id && arr[i].data.properties.id === id){

            versionNo = arr[i].data.properties.release + '.' + 
            arr[i].data.properties.revision;
            break;
          }
      }

      return versionNo;
    },
    onRender: function () { 
      this.nodeStateRegion.show(this.nodeStateView);
      var ancestorCollection = this.options.context.getModel(AncestorCollectionFactory);
      if(ancestorCollection.node.attributes.type === 136){
        this.checkForRelUnderCompDoc(ancestorCollection);
      }else{
        this.iconRegion.show(this.iconView);
        this.nameRegion.show(this.nameView);
        this.menuRegion.show(this.menuView);
      }
    },
    checkForRelUnderCompDoc: function(ancestorCollection){
      this.listenTo(ancestorCollection, 'sync', function(){
        var ancestorModel = ancestorCollection.toJSON();
        var parentElm = this.getSourceOfCompoundDocuments(ancestorModel);

        if(parentElm && (parentElm.type === 138 || parentElm.type === 139) ){
         this.removeHeaderIcons4CompoundDoc(this);
          var self = this; 
          this.getAncestorModels(parentElm.parent_id)
          .done(function(res){
            var versionNo = self.getVesionNoNType(parentElm.id, res.results);
            self.showVersionNo(self, versionNo, parentElm);
          }).catch(function(err){
            console.warn(err);
            self.showVersionNo(self);
          });
        }else{
          this.showVersionNo(this);
        }
       
      });
    },
    showVersionNo: function(context, versionNo, elm){
      var versionNumberView =  context.$(context.ui.versionNumberState);
      if(!context || !(elm instanceof Object) || !versionNo){
        versionNumberView.html('');
        versionNumberView.removeClass(TITLEVERSIONSTYLE);
        context.showHeaderIcons4CompoundDoc(context);
        return;
      }
      versionNumberView.html(versionNo);
      versionNumberView.addClass(TITLEVERSIONSTYLE);
      context.options.model.attributes.type = elm.type;
      context.options.model.attributes.type_name = elm.type_name;
      context.iconView = new NodeTypeIconView({
        node: context.options.model
      });
     context.showHeaderIcons4CompoundDoc(context);
    },
    showHeaderIcons4CompoundDoc: function(context){
      context.nameView = new ItemTitleNameView({
        context: context.options.context,
        model: context.options.model,
        originatingView: context.options.originatingView,
        nameSchema: context.options.nameSchema
      });
      context.menuView = new DropdownMenuView({
        context: context.options.context,
        model: context.options.model,
        originatingView: context.options.originatingView,
        toolItems: context.options.toolItems,
        toolItemsMask: context.options.toolItemsMask,
        commands: context.options.commands
      });
      context.iconRegion.show(context.iconView);
      context.nameRegion.show(context.nameView);
      context.menuRegion.show(context.menuView);
    },
    removeHeaderIcons4CompoundDoc: function(context){
      context.iconRegion.empty();
      context.nameRegion.empty();
      context.menuRegion.empty();
    },
    onDomRefresh: function () {
      _.each(this.regionManager._regions, function (region) {
        if (region.currentView) {
          region.currentView.triggerMethod('dom:refresh');
        }
      });
    },

    onShow: function () {
      _.each(this.regionManager._regions, function (region) {
        if (region.currentView) {
          region.currentView.triggerMethod('show');
        }
      });
    },

    onAfterShow: function () {
      _.each(this.regionManager._regions, function (region) {
        if (region.currentView) {
          region.currentView.triggerMethod('after:show');
        }
      });
    },

    closeMenu: function () {
      this.menuView && this.menuView.trigger('close:menu');
    }

  });

  return ItemTitleView;
});
