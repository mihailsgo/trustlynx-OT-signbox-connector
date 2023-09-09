/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/base', 'csui/utils/commands',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/behaviors/default.action/impl/defaultaction',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/thumbnail/impl/metadata/thumbnail.metadata.view',
  'csui/controls/thumbnail/impl/sort/sort.view',
  'csui/controls/thumbnail/content/content.factory',
  'csui/controls/thumbnail/thumbnail.content',
  'csui/controls/thumbnail/content/thumbnail.icon/thumbnail.icon.view',
  'csui/controls/thumbnail/content/select/select.view',
  'csui/controls/table/cells/searchbox/searchbox.view',
  'csui/controls/checkbox/checkbox.view',
  'csui/utils/dragndrop.supported.subtypes',
  'csui/controls/tableactionbar/tableactionbar.view',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/controls/progressblocker/blocker',
  'csui/controls/mixins/view.state/node.view.state.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'hbs!csui/controls/thumbnail/impl/thumbnail.header',
  'hbs!csui/controls/thumbnail/impl/thumbnail.item',
  'hbs!csui/controls/thumbnail/impl/thumbnail',
  'hbs!csui/controls/thumbnail/impl/empty.thumbnail',
  'i18n!csui/controls/thumbnail/impl/nls/lang',
  'css!csui/controls/thumbnail/thumbnail',
  'csui/lib/jquery.mousehover'
], function (module, _, $, Backbone, Marionette, base, commands, DefaultActionBehavior,
    DefaultActionController, PerfectScrollingBehavior, TabableRegionBehavior, ThumbnailMetadataView,
    SortView, ContentFactory, ThumbnailContent, ThumbnailIconView, SelectContentView, SearchBoxView, CheckboxView,
    DragndropSupportedSubtypes, TableActionBarView, LayoutViewEventsPropagationMixin,
    ViewEventsPropagationMixin, BlockingView,
    NodeViewStateMixin, FieldsV2Mixin, thumbnailHeaderTemplate,
    thumbnailItemTemplate, thumbnailTemplate, emptyThumbnailTemplate, lang) {
  'use strict';
  var config = _.extend({}, module.config());

  var EmptyThumbnailView = Marionette.ItemView.extend({

    className: 'csui-thumbnail-empty',
    template: emptyThumbnailTemplate,

    templateHelpers: function () {
      return {
        noResults:this.emptyThumbnailText 
      };
    },

    constructor: function EmptyThumbnailView(options) {
      this.options = options && options.parentOptions;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    initialize: function(){
      this.canAddItems = !!this.options.originatingView.canAddItems();
      this.addItemsPermissions = !!this.options.originatingView.addItemsPermissions();
      if(this.collection.fetched){
        this._setEmptyViewText();
      }
    },

    onRender: function () {
      if(this.collection.fetched){
        this.options.$parentEl.addClass('csui-thumbnail-empty');
      }
      if( !!this.canAddItems && !!this.addItemsPermissions){
        this.$el.addClass('csui-can-add-items');
      }
      
    },

    onShow: function () {
      this.$el.addClass('icon-thumbnail-empty-page');
    },

    onDestroy: function () {
      this.options.$parentEl.removeClass('csui-thumbnail-empty');
    },

    _setEmptyViewText: function () {
      this.emptyThumbnailText = "";
      this.emptyThumbnailText = !!this.addItemsPermissions ?
        lang.dragAndDropMessage : lang.noPermissions;
      this.emptyThumbnailText = !!this.canAddItems ? this.emptyThumbnailText : lang.noResults;
      this.emptyThumbnailText = (!!this.collection.filters && this.collection.filters.name ?
        lang.noSearchResults : this.emptyThumbnailText);
    }
  });

  var ThumbnailItemView = Marionette.LayoutView.extend({

    className: function () {
      var className = 'csui-thumbnail-item' + ' csui-thumbnail-item-' + this.model.cid;
      if (this.model.inlineFormView) {
        className = className + ' csui-thumbnail-item-form';
      }
      return className;
    },
    template: thumbnailItemTemplate,

    templateHelpers: function () {
      return {

        columns: this.options.thumbnailContent.models,
        isChecked: this.options.thumbnailView.collection.itemchecked,
        selectThumbnails: this.options.thumbnailView.options.selectThumbnails === 'none'
      };
    },

    ui: {
      itemContainer: '.csui-thumbnail-item-container'
    },
    attributes: {
      tabindex: '0'
    },

    events: {
      'click @ui.itemContainer': 'onItemClick',
      'keydown': 'onItemKeyDown'
    },

    regions: {
      selectContentRegion: ".csui-thumbnail-select",
      thumbnailIconRegion: ".csui-thumbnail-thumbnailIcon"
    },

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".csui-thumbnail-item-container",
        suppressScrollX: true,
        scrollYMarginOffset: 15
      }
    },

    
    initialize: function () {
      var self = this;
      if (this.options.thumbnailContent && this.options.thumbnailContent.models) {
        _.each(this.options.thumbnailContent.models, function (model, index) {
          var content = ContentFactory.getContentView(model);
          if (content) {
            var region = model.get("key");
            self.addRegion(region, ".csui-thumbnail-" + region);
          }
        }, this);
      }
      if (!base.isHybrid() && this.options.showInlineToolbar) {
        this._subscribeEventHandlers();
      }
      this.model.set('inactive', !this.options.thumbnailView.checkModelHasAction(this.model),
          {silent: true});
      self.ContentFactory = ContentFactory;

      this.listenTo(this.model, 'change:csuiIsSelected', function (model) {
        if (model.get(SelectContentView.isSelectedModelAttributeName)) {
          this.options.thumbnailView.$el.find(".csui-thumbnail-select").addClass(
            'csui-checkbox');
          this.$el.addClass('csui-thumbnail-item-selected');
        } else {
          this.$el.removeClass('csui-thumbnail-item-selected');
          if (!this.options.thumbnailView._allSelectedNodes.length) {
            this.options.thumbnailView.$el.find(".csui-thumbnail-select").removeClass(
              'csui-checkbox');
            this.$el.removeClass('csui-thumbnail-item-selected');
          }
        }
        this.options.thumbnailView.$el.find(".selectAction").attr('tabindex',-1);
      });

      if (this.options.thumbnailView._allSelectedNodes.findWhere({id: this.model.get('id')})) {
        this.options.model.set('csuiIsSelected', true);
      }
    },

    constructor: function ThumbnailItemView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.listenTo(this.model, 'sync', this.render);
      this.model.set('itemselected', false, { silent: true });
      this.listenTo(this.options.thumbnailView, "cancelInlineForm", function (options) {
        if (this.activeInlineForm) {
          this.activeInlineForm.cancel(options);
        }
      });
    },


    onItemClick: function () {
      this.options.thumbnailView.currentItemView = this;
    },
    onItemKeyDown: function (event) {
      if ($(event.target).is('input[type="text"]')) {
        event.stopPropagation();
      }
      else if (base.isFirefox() && event.keyCode === 13 &&  $(event.target).is('input[type="checkbox"]') ) {
        event.preventDefault();
        event.stopPropagation();
        var chkBoxValue = this.model.get(SelectContentView.isSelectedModelAttributeName);
        event.checked = !chkBoxValue;
        this.selectContentView.trigger('clicked:checkbox',event);
      }
      else if ((event.keyCode === 13 || event.keyCode === 32) && $(event.target).hasClass('csui-thumbnail-item')) {
        event.preventDefault();
        event.stopPropagation();
        this.model.set('itemselected', true, { silent: true });
        this.$el.addClass('csui-thumbnail-item-keyActive');
        this.showInlineActions.bind(this);
        this.focusableChildren = this.$el.find("*[tabindex]:visible").filter(function () {
          if (!($(this).parents().hasClass('csui-thumbnail-nodestate') || $(this).parent().hasClass('csui-thumbnail-name-container'))) {
            return this;
          }
        });
        $(this).parent().hasClass('csui-thumbnail-name-container');
        $(this.focusableChildren[0]).trigger('focus');
        this.focusedThumbnailCardIndex = 0;
      }
      else if (event.keyCode === 27) {
        this.model.set('itemselected', false, { silent: true });
        this.$el.removeClass('csui-thumbnail-item-keyActive');
        this.focusableChildren = '';
        this.$el.trigger('focus');
      }
      else if (event.keyCode === 9) {
        this.focusableChildren = this.$el.find("*[tabindex]:visible").filter(function () {
          if (!($(this).parents().hasClass('csui-thumbnail-nodestate') || $(this).parent().hasClass('csui-thumbnail-name-container'))) {
            return this;
          }
        });
        var focusablesSelector = 'a[href], area[href], input,.csui-thumbnail-select input[type=checkbox], select, textarea, button,' +
        ' iframe, object, embed, *[tabindex], *[contenteditable]';
        var focusables = this.options.thumbnailView.resultsView.$el.find(focusablesSelector);
             
        if (this.$el.hasClass('csui-thumbnail-item-keyActive')) {
          event.preventDefault();
          event.stopPropagation();
          if (event.shiftKey) {
            if (this.focusedThumbnailCardIndex > 0) {
              this.focusedThumbnailCardIndex--;
            }
            $(this.focusableChildren[this.focusedThumbnailCardIndex]).trigger('focus');
          } else {
            if ($(event.target).hasClass('csui-thumbnail-item')) {
              this.focusedThumbnailCardIndex = -1;
            }
            if (this.focusedThumbnailCardIndex < this.focusableChildren.length - 1) {
              this.focusedThumbnailCardIndex++;
            }
            $(this.focusableChildren[this.focusedThumbnailCardIndex]).trigger('focus');
          }
        }
        else{
          if (focusables.length) {
            focusables.prop('tabindex', -1);
          }
         $( this.options.thumbnailView.resultsView.$el.find('.csui-thumbnail-item')
          [this.options.thumbnailView.resultsView.currentIndexFocussed]).attr('tabindex',0);
        }
      }
    },
    _subscribeEventHandlers: function () {
      this.$el && this.$el.mousehover(
          this.showInlineActions.bind(this),
          this.hideInlineActions.bind(this),
          {namespace: this.cid});
      this.$el && this.$el.on( "focus", this.showInlineActions.bind(this));
      this.$el && this.$el.on( "blur", this.hideInlineActions.bind(this));
    },

    _unsubscribeEventHandlers: function () {
      if (this._isRendered) {
        this.$el.mousehover('off', {namespace: this.cid});
        this.$el && this.$el.off("focus");
        this.$el && this.$el.off( "blur");
      }
    },

    showInlineActions: function (e) {
      if (this.$el.find(".csui-inlineform-group").length === 0) {
        var inlineToolbarContainer = this.$el.find('.csui-thumbnail-actionbar');
        if (inlineToolbarContainer.length > 0 &&
            !this.options.originatingView.lockedForOtherContols) {
          var self = this,
              args = {
                sender: self,
                target: inlineToolbarContainer,
                model: self.model
              };
          self.trigger("mouseenter:row", args);
        }
      } else {
        this.$el.find(".csui-thumbnail-select").css({"display": "none"});
      }
    },

    hideInlineActions: function (e) {
      var inlineToolbarContainer = this.$el.find('.csui-thumbnail-actionbar');
      if (inlineToolbarContainer.length > 0) {
        var self = this,
            args = {
              sender: self,
              target: inlineToolbarContainer,
              model: self.model
            };
        if(!this.model.get('itemselected')) {
          self.trigger("mouseleave:row", args);
        }   
      }
    },

    onRender: function (e) {
      var self = this;
      if (self.model.isLocallyCreated && !self.model.inlineFormView) {
        this.$el.find('.csui-thumbnail-content-container').addClass('csui-new-item');
      }
      if (self.model.isLocallyCreated) {
        self.listenTo(this.options.thumbnailView, "inlineFormCreation", function (models) {
          var nodeModel = models[models.length - 1],
            className = '.csui-thumbnail-name-' + nodeModel.cid,
            divForInlineForm = this.options.thumbnailView.$el.find(className),
            inlineFormRegion = new Marionette.Region({ el: divForInlineForm });
          if (nodeModel.inlineFormView) {
            self.activeInlineForm && self.activeInlineForm.destroy();
            self.activeInlineForm = new nodeModel.inlineFormView({
              model: nodeModel,
              originatingView: self.options.originatingView,
              context: self.options.thumbnailView.context
            });
            if (self.$el.hasClass("csui-thumbnail-item-form")) {
              self.$el.addClass('csui-new-thumbnail-item');
            }
            inlineFormRegion.show(self.activeInlineForm);
            self.activeInlineForm.listenTo(self.activeInlineForm, 'destroy', function () {
              self.options.thumbnailView.lockedForOtherContols = false;
              delete self.activeInlineForm;
            });
          }
        });
        self.listenTo(this.options.thumbnailView, "updateItem", function (collectionormodel) {
          if (self.activeInlineForm && self.activeInlineForm.model.cid === collectionormodel.cid) {
            self.activeInlineForm.model.trigger('sync');
            self.activeInlineForm.cancel({ silent: true });
            collectionormodel.renamed = true;
          }
        });
      }
      this.selectContentView = new SelectContentView({
        tagName: 'div',
        model: this.options.model,
        thumbnailView: this.options.thumbnailView,
        events: function () {
          if (base.isFirefox()) {
            return _.extend({}, SelectContentView.prototype.events, {
              'keydown': self.onKeyInView
            });
          }
          return SelectContentView.prototype.events;
        }
      });
      this.selectContentRegion.show(this.selectContentView);
      if (this.options.model.get('csuiIsSelected')) {
        this.selectContentRegion.$el.addClass('csui-checkbox');
        this.$el.addClass('csui-thumbnail-item-selected');
      } else {
        if (this.options.thumbnailView.getSelectedChildren().length === 0 &&
            this.options.thumbnailView.resultsView.$el.find('.csui-checkbox')) {
          this.selectContentRegion.$el.removeClass('csui-checkbox');
          this.$el.removeClass('csui-thumbnail-item-selected');
        }
      }
      if (this.options.model.get(SelectContentView.isSelectedModelAttributeName)) {
        this.$el.addClass('csui-thumbnail-item-selected');
      }
      if (this.getSelectedChildren().length > 0 && self.model.isLocallyCreated &&
          !self.model.inlineFormView || this.options.thumbnailView._allSelectedNodes.length) {
        this.$el.find('.csui-new-item').parent().find('.csui-thumbnail-select').addClass(
            'csui-checkbox');
        this.selectContentRegion.$el.addClass('csui-checkbox');
      }
      self.listenTo(this.selectContentView, 'clicked:checkbox', function (event) {
        if (event.checked) {
          this.options.thumbnailView.cancelAnyExistingInlineForm();
        }
        this.options.thumbnailView.stopListening(this.options.thumbnailView, 'thumbnailItem:toggled');
        this.options.thumbnailView.listenTo(this.options.thumbnailView, 'thumbnailItem:toggled',
          _.bind(function (event) {
            var self = this;
            setTimeout(function () {
              self.$el.find('.selectAction').trigger('focus');
              var focusablesSelector = 'a[href], area[href], input,.csui-thumbnail-select input[type=checkbox], select, textarea, button,' +
        ' iframe, object, embed, *[tabindex], *[contenteditable]';
              var focusables = self.$el.find(focusablesSelector);
              if (focusables.length) {
                focusables.prop('tabindex', -1);
              }
            }, 0);
            if (event.checked) {
              if ((this.options.thumbnailView.options.selectThumbnails === 'single' &&
                this.options.thumbnailView._allSelectedNodes.length === 0) ||
                this.options.thumbnailView.options.selectThumbnails === 'multiple') {
                this.options.thumbnailView._allSelectedNodes.add(event.view.model,
                  { silent: true });
              } else if (this.options.thumbnailView.options.selectThumbnails === 'single' &&
                this.options.thumbnailView._allSelectedNodes.length > 0) {
                this.options.thumbnailView._allSelectedNodes.reset([]);
                this.options.thumbnailView._allSelectedNodes.add(event.view.model,
                  { silent: true });
              }
            } else {
              this.options.thumbnailView._allSelectedNodes.remove(event.view.model,
                { silent: true });
            }
            this.options.thumbnailView._allSelectedNodes.reset(
              this.options.thumbnailView._allSelectedNodes.models);
          }, this));

        this.options.thumbnailView.trigger('thumbnailItem:toggled', event);
        self.showToolBarActions(event);
        if (event.checked) {
          if (this.options.thumbnailView.resultsView.inlineToolbarView) {
            this.options.thumbnailView.resultsView.inlineToolbarView.destroy();
          }
          self.model.set(SelectContentView.isSelectedModelAttributeName, true);
          self.model.attributes.isSelected = true;
          self.options.thumbnailView.trigger("thumbnailSelected",
              {sender: self, targets: self.options.thumbnailView, nodes: self.getNodes.call(self)});
        } else {
          self.model.set(SelectContentView.isSelectedModelAttributeName, false);
          self.model.attributes.isSelected = false;
          self.options.thumbnailView.trigger("thumbnailUnSelected",
              {sender: self, targets: self.options.thumbnailView, nodes: self.getNodes.call(self)});
        }
        this.options.thumbnailHeaderView.trigger('selectOrUnselect.mixed');
      });

      this.thumbnailIconView = new ThumbnailIconView({
        model: this.options.model,
        context: this.options.context,
        column: {defaultAction: true},
        originatingView: this.options.originatingView
      });
      this.thumbnailIconRegion.show(this.thumbnailIconView);
      this.listenTo(this.thumbnailIconView, 'execute:defaultAction', function (event) {
        if (base.isControlClick(event)) {
        } else {
          event.preventDefault();
          event.stopPropagation();
          self.options.thumbnailView.trigger("execute:defaultAction", self.model);
        }
      });
      this.contents = this.options.columns;
      var contentModelsByKey = [];
      this.contents.each(function (nodeContentModel) {
        var key = nodeContentModel.get("column_key");
        contentModelsByKey.push(key);
      }, this);
      contentModelsByKey.push("overview");

      if (this.options.thumbnailContent && this.options.thumbnailContent.models) {
        _.each(this.options.thumbnailContent.models, function (model, index) {
          if (this.options.model && this.options.model.isReservedClicked ||
              this.options.model.isUnreservedClicked) {
            this.options.model.set('inactive', this.options.model.attributes.inactive,
                {silent: true});
          } else {
            this.options.model.set('inactive',
                !this.options.thumbnailView.checkModelHasAction(this.model), {silent: true});
          }
          var content = ContentFactory.getContentView(model);
          var key = model.get("key");
          if (content && contentModelsByKey.indexOf(key) > -1) {
            var region     = model.get("key"),
                conFactory = model.get("showoverview") ? ContentFactory : undefined,
                column     = model.toJSON();
            column.name = column.key;
            var contentView = new content({
              tagName: 'DIV',
              model: self.model,
              context: self.options.context,
              column: column,
              ContentFactory: conFactory,
              displayLabel: model.get("displayLabel"),
              displayTitle: model.get("displayTitle"),
              displayIcon: true,
              originatingView: self.options.originatingView,
              selectedChildren: this.options.thumbnailView.options.selectedChildren,
              collection: this.options.thumbnailView.options.collection,
              columns: this.options.columns
            });
            self[region].show(contentView);
            self.listenTo(contentView, 'clicked:content', function (event) {
              self.trigger('clicked:content', {
                contentView: contentView,
                rowIndex: self._index,
                colIndex: index,
                model: self.model
              });
            });
            self.listenTo(contentView, 'execute:defaultAction', function (event) {
              event.preventDefault();
              event.stopPropagation();
              self.options.thumbnailView.trigger("execute:defaultAction", self.model);
            });
            self.listenTo(contentView, 'show:add:favorite:form', function () {
              self.hideInlineActions();
              self.favoritePopoverOpened = true;
              self.options.originatingView.lockedForOtherContols = true;
            });
            self.listenTo(contentView, 'close:add:favorite:form', function () {
              self.favoritePopoverOpened = false;
              self.options.originatingView.lockedForOtherContols = false;
            });
            self.listenTo(contentView, 'shown:overview:flyout', function () {
              self.hideInlineActions();
              self.overviewPopoverOpened = true;
              self.options.originatingView.lockedForOtherContols = true;
            });
            self.listenTo(contentView, 'hide:overview:flyout', function () {
              self.overviewPopoverOpened = false;
              self.options.originatingView.lockedForOtherContols = false;
            });
          }
        }, this);
      }
    },

    getNodes: function () {
      var nodes = [];
      nodes.push(this.model);
      return nodes;
    },

    showToolBarActions: function (event) {
      if (!event.checked) {
        this._subscribeEventHandlers();
        this.options.thumbnailView.resultsView.options.showInlineActionBar = false;
      }
      this.triggerMethod("show:toolbar");
    },

    getSelectedChildren: function () {
      return this.model.collection.where({csuiIsSelected: true});
    }
  });

  var ThumbnailListView = Marionette.CollectionView.extend({

    className: 'csui-thumbnail-collection',

    childView: ThumbnailItemView,

    childViewOptions: function () {
      return {
        context: this.options.context,
        showInlineToolbar: this.showInlineToolbar,
        toolbarItems: this.options.inlineBar.options.collection,
        toolbarItemsMasks: this.options.inlineBar.options.toolItemsMask,
        originatingView: this.options.originatingView,
        thumbnailView: this.options.thumbnailView,
        thumbnailHeaderView: this.options.thumbnailHeaderView,
        tableColumns: this.options.tableColumns,
        columns: this.options.columns,
        thumbnailContent: this.options.thumbnailContent
      };
    },

    childEvents: {
      'mouseenter:row': 'onChildShowInlineActionBarWithDelay',
      'mouseleave:row': 'onChildActionBarShouldDestroy',
      'render': '_onChildRender'
    },
    events: {
      'keydown': 'onItemKeyDownOnThumbnailCollection'
    },

    emptyView: EmptyThumbnailView,
    emptyViewOptions: function () {
      return {
        $parentEl: this.$el,
        parentOptions: this.options
      };
    },

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function ThumbnailListView(options) {
      options || (options = {});
      this.context = options.context;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.showInlineToolbar = (this.options.inlineBar.options.collection &&
                                this.options.inlineBar.options.toolItemsMask);
      this.currentIndexFocussed = 0;
      if (this.showInlineToolbar) {
        this.setInlineActionBarEvents();
      }
      _.defaults(this.options, {
        showInlineActionBar: true
      });
      $(window).on('resize', _.bind(this._adjustThumbnailWidth, this));
    },

    onItemKeyDownOnThumbnailCollection: function (event) {
      var currentCollection = this.$el.children();
      var collectionLength = this.$el.children().length;
      if (!this.$el.children().hasClass('csui-thumbnail-item-keyActive')) {
        if (event.keyCode === 39) {
          if (this.currentIndexFocussed < collectionLength) {
            $(currentCollection[this.currentIndexFocussed]).attr('tabindex', -1);
            $(currentCollection[++this.currentIndexFocussed]).trigger('focus').attr('tabindex', 0);
          }
          else {
            event.preventDefault();
            event.stopPropagation();
          }
        }
        else if (event.keyCode === 37) {
          if (this.currentIndexFocussed > 0) {
            $(currentCollection[this.currentIndexFocussed]).attr('tabindex', -1);
            $(currentCollection[--this.currentIndexFocussed]).trigger('focus').attr('tabindex', 0);
          }
          else {
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    },
    currentlyFocusedElement: function (event) {
      return this.$el.children()[this.currentIndexFocussed];
    },
    setInlineActionBarEvents: function () {
      this.listenTo(this, 'closeOther', this._destroyInlineActionBar);
      this.listenTo(this.collection, "reset", this._destroyInlineActionBar);
    },

    _destroyInlineActionBar: function () {
      if (this.inlineToolbarView) {
        this.inlineToolbarView.destroy();
        this.inlineToolbarView = undefined;
      }
    },

    _onChildRender: function (childView) {
      childView.options.thumbnailView &&
      childView.options.thumbnailView.trigger("thumbnailRowRendered", {
        sender: this, target: childView.el, node: childView.model
      });
      
    },
    _showInlineActionBar: function (args) {
      if (this.inlineToolbarView) {
        this._savedHoverEnterArgs = args;
      } else if (!!args) {
        this._savedHoverEnterArgs = null;

        this.inlineToolbarView = new TableActionBarView(_.extend({
              context: this.options.context,
              commands: commands,
              collection: this.options.inlineBar.options.collection,
              toolItemsMask: this.options.inlineBar.options.toolItemsMask,
              originatingView: this.options.originatingView,
              model: args.model,
              status: {
                originatingView: this.options.originatingView,
                connector: this.options.collection.connector
              }
            }, this.options.inlineBar.options)
        );

        this.listenTo(this.inlineToolbarView, 'before:execute:command', function (eventArgs) {
          this.lockedForOtherContols = true;
          if (eventArgs && eventArgs.status && eventArgs.status.targetView &&
              eventArgs.status.targetView.$el) {
            eventArgs.status.targetView.$el.addClass("active-row");
          }
          this._destroyInlineActionBar();
        });
        this.listenTo(this.inlineToolbarView, 'after:execute:command', function (eventArgs) {
          this.lockedForOtherContols = false;
          if (eventArgs && eventArgs.status && eventArgs.status.targetView &&
              eventArgs.status.targetView.$el) {
            eventArgs.status.targetView.$el.removeClass("active-row");
          }
        });

        if (this.options.originatingView) {
          this.listenTo(this.options.originatingView, "block:view:actions", function () {
            this.lockedForOtherContols = true;
            this._destroyInlineActionBar();
          });
          this.listenTo(this.options.originatingView, "unblock:view:actions", function () {
            this.lockedForOtherContols = false;
          });
        }

        this.inlineToolbarView.render();
        this.listenTo(this.inlineToolbarView, 'destroy', function () {
          this.inlineToolbarView = undefined;
          if (this._savedHoverEnterArgs) {
            this.onChildShowInlineActionBarWithDelay(this._savedHoverEnterArgs);
          }
        }, this);
        $(args.target).append(this.inlineToolbarView.$el);
        this.inlineToolbarView.triggerMethod("show");
      }
    },

    onChildShowInlineActionBarWithDelay: function (childView, args) {
      if (this._showInlineActionbarTimeout) {
        clearTimeout(this._showInlineActionbarTimeout);
      }
      this.isSelected = this.collection.where({csuiIsSelected: true}).length > 0;
      var showInlineActionBar = !this.isSelected &&
                                this.options.thumbnailView.options.allSelectedNodes.length === 0;
      showInlineActionBar = showInlineActionBar && !this.lockedForOtherContols &&
                            this.options.showInlineActionBar;

      if (showInlineActionBar) {
        this._showInlineActionbarTimeout = setTimeout(_.bind(function () {
          this._showInlineActionbarTimeout = undefined;
          this._showInlineActionBar.call(this, args);
        }, this), 200);
      }
    },

    onChildActionBarShouldDestroy: function (childView, args) {
      this.options.showInlineActionBar = true;
      if (this._showInlineActionbarTimeout) {
        clearTimeout(this._showInlineActionbarTimeout);
        this._showInlineActionbarTimeout = undefined;
      }
      if (this.inlineToolbarView) {
        this.inlineToolbarView.destroy();
      }
    },
    showOrHideZeroRecordsMessage: function () {
      if (this.collection.length === 0) {
        if (this.options.thumbnailHeaderView && this.options.thumbnailView.collection.filters) {
          this.options.thumbnailHeaderView.searchBoxes.setFocus();
        }
        if (this._showingEmptyView && !!this.options.thumbnailView.collection &&
            !!this.options.thumbnailView.collection.filters) {
          this.options.thumbnailHeaderView.render();
          this.options.thumbnailHeaderView.searchBoxes.setFocus();
        }
      } else {
        this.$el.removeClass("csui-thumbnail-empty");
        this.$el.removeClass("icon-thumbnail-empty-page");
        if (this.$el.is(':visible')) {
          this.trigger('dom:refresh');
        }
      }
    },

    onRender: function () {
      this.showOrHideZeroRecordsMessage();
      this._adjustThumbnailWidth();
      this.options.thumbnailView.updateSelectAllCheckbox.call(this);
    },

    onMetadataClose: function () {
      this._adjustThumbnailWidth();
    },

    _adjustThumbnailWidth: function () {
      var thumbnailViewItem             = this.$el.find('.csui-thumbnail-item'),
          thumbnailViewItemWidth        = 190, //min, max width
          parentWidth                   = $('.csui-table-facetview .csui-facet-panel').length > 0 ?
                                          $('.csui-facet-table-container').width() -
                                          $('.csui-table-facetview').width() :
                                          $('.cs-thumbnail-wrapper').width(),
          spaceBetweenItems             = 2,
          thumbnailViewItemWidthPercent = thumbnailViewItemWidth / parentWidth * 100;
      for (var i = 1; i <= thumbnailViewItem.length; i++) {
        var thumbnailViewItemTotalWidth = i * thumbnailViewItemWidthPercent;
        if (thumbnailViewItemTotalWidth > 100) {
          i = i - 1;
          thumbnailViewItemWidthPercent = 100 / i;
          break;
        }
      }
      thumbnailViewItem.css({
        'maxWidth': "calc(" + thumbnailViewItemWidthPercent + '% - ' + spaceBetweenItems * 2 +
                    "px)",
        'minWidth': "calc(" + thumbnailViewItemWidthPercent + '% - ' + spaceBetweenItems * 2 +
                    "px)"
      });
    }
  });

  var ThumbnailHeaderView = Marionette.LayoutView.extend({

    className: 'csui-thumbnail-header',

    tagName: 'div',

    regions: {
      sortRegion: '#csui-sorting-container',
      searchRegion: '#csui-thumbnail-column-search',
      selectAllRegion: '.csui-checkbox-selectAll'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior,
        initialActivationWeight: 100
      }
    },

    ui: {
      selectAll: '.csui-selectAll-input',
      sortContainer: '#csui-sorting-container'
    },

    events: {
      "keydown": "onKeyInView",
      'click @ui.sortContainer': 'onSortClick'
    },

    template: thumbnailHeaderTemplate,
    
    templateHelpers: function () {
      return {
        columns: this.options.thumbnailColumns,
        addTitle: lang.addTitle,
        selectAll: lang.selectAll,
        selectAllTitle: lang.selectAllTitle,
        isEmptyNode: this.collection.models.length === 0,
        items: base.formatMessage(this.collection.length, lang),
        selectThumbnails: this.options.thumbnailView.options.selectThumbnails === "none" ||
                          this.options.thumbnailView.options.selectThumbnails === "single"
      };
    },

    constructor: function ThumbnailHeaderView(options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.columnsWithSearch = options.columnsWithSearch || [];
      this.listenTo(this, 'selectOrUnselect.mixed', this.thumbnailItemClicked);
      this.listenTo(this, 'selectOrUnselect.all', function (isSelectAll) {
        
        if (isSelectAll) {
          this.options.thumbnailView.cancelAnyExistingInlineForm.call(this.options.thumbnailView);
          if (this.collection.models.length > 0) {
            _.each(this.collection.models, function (model) {
              model.set(SelectContentView.isSelectedModelAttributeName, true);
            });
          }
          this.options.thumbnailView.trigger("thumbnailSelected",
            { sender: this, targets: this.options.thumbnailView, nodes: this.collection.models });
        } else {
          if (this.collection.models.length > 0) {
            _.each(this.collection.models, function (model) {
              model.set(SelectContentView.isSelectedModelAttributeName, false);
            });
          }
          this.options.thumbnailView.trigger("thumbnailUnSelected",
            { sender: this, targets: this.options.thumbnailView, nodes: this.collection.models });
        }
        this.options.thumbnailView.showToolBarActions();
      });
    },

    onSortClick: function () {
      if (this.options.thumbnailView.currentItemView &&
          this.options.thumbnailView.currentItemView.overviewPopoverOpened) {
        this.options.thumbnailView.currentItemView.overview.currentView._closePopover();
      } else if (this.options.thumbnailView.currentItemView &&
                 this.options.thumbnailView.currentItemView.favoritePopoverOpened) {
        this.options.thumbnailView.currentItemView.favorite.currentView.favStarView.closePopover();
      }
    },

    sortmenurender: function (name) {
      this.options.thumbnailView.resultsView.render();
      if (!this.isSortOrderClicked) {
        this.sortRegion.$el.find('button.binf-dropdown-toggle').trigger('focus');
        this.isSortOrderClicked = true;
      }
      if (this._isRendered && this.options.thumbnailView.options.allSelectedNodes.length === 0 &&
          this.options.thumbnailView.resultsView.$el.find('.csui-checkbox')) {
        this.options.thumbnailView.resultsView.$el.find('.csui-checkbox').removeClass(
            'csui-checkbox');
      }
    },

    thumbnailItemClicked: function () {
      var selection = this.collection.filter(function (model) {
        return model.get(SelectContentView.isSelectedModelAttributeName);
      });
      var all = (selection.length>0 ) && selection.length === this.collection.length;     
      if (selection.length > 0 && !all) {
        this.$el.find('.csui-selected-checkbox').addClass('csui-checkbox-atleastone');
      } else {
        this.$el.find('.csui-selected-checkbox').removeClass('csui-checkbox-atleastone');
      }
      var selected = this.collection.where({csuiIsSelected: true}).length;
      this.options.thumbnailView.updateSelectAllCheckbox.call(this);
    },

  
   
    onRender: function (e) {
      var event = e || window.event,
      thumbnailView = this.options.thumbnailView;
      this.focusIndex = 0;
      var length = thumbnailView.$el.find('.csui-thumbnail-item-selected').length;
      var checkboxView = new CheckboxView({
        checked: false,
        disabled: false,
        ariaLabel: lang.selectAll,
        title: lang.selectAll,
        label: lang.selectAll
      });

      this.listenTo(checkboxView, 'clicked', function (event) {
        this.trigger('selectOrUnselect.all', event.model.attributes.checked !== "true");
      });
      this.selectAllRegion.show(checkboxView);
      var sortView = new SortView({
        collection: this.collection,
        resultView: this
      });
      this.sortRegion.show(sortView);
      if (this.isSortOrderClicked) {
        sortView.ui.sortOrderBtn.trigger('focus');
      }
      this.listenTo(sortView, 'render:sortmenu', this.sortmenurender);
      this.ensureAllSearchBox();
      this.currentlyFocusedElement();
    },
    
    updateTotalCount: function () {
      var itemCount = base.formatMessage(this.collection.length, lang);
      this.$el.find('.csui-thumbnail-itemcount').html(itemCount);
    },

    currentlyFocusedElement: function (event) {
      var focusables = this.$el.find('*[tabindex=-1]');
      if (focusables.length) {
        focusables.prop('tabindex', 0);
      }
      if (this.isSortOrderClicked) { 
        return $(this.sortRegion.$el.find('.csui-sort-arrow'));
      }
    },
    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {  // space or
        if ($(event.target).hasClass('csui-selectAll-input')) {
          event.preventDefault();
          event.stopPropagation();
          if (base.isFirefox()) {
            if (event.keyCode === 32) {
              return false;
            }
          }
          $(event.target).trigger('click');
        }
        if ($(event.target).hasClass('csui-thumbnail-column-search')) {
          event.preventDefault();
          event.stopPropagation();
          this.searchBoxes.showSearchInput(event);
        }
      }
    },
    getName: function () {
      var columnname = this.options.thumbnailView && this.options.thumbnailView.options &&
        this.options.thumbnailView.options.allColumns.length &&
        this.options.thumbnailView.options.allColumns.find(function (column) {
          return column.name === 'name';
        });
      return columnname && columnname.name;
    },

    ensureAllSearchBox: function () {
      var self          = this,
          thumbnailView = this.options.thumbnailView,
          searchWrapper = this.$el.find('.csui-thumbnail-column-search'),
          sortWrapper   = this.$el.find('.csui-sorting-container'),
          searchColumn  = thumbnailView.options.columns.where({isNaming: true}),         
           columnName    = searchColumn[0] ? searchColumn[0].get("key") : this.getName();          
      if ($(this).find('.csui-thumbnail-column-search').length === 0) {
        var searchbox = new SearchBoxView(self.collection.filters[columnName], {
          column: columnName,
          columnTitle: lang.name
        });
        self.searchBoxes = searchbox;
        searchbox.on('change:filterValue', function (data) {
          self.applyFilter(data);
        });
        searchbox.on('opened', function () {
          sortWrapper.find('.csui-search-sort-options').removeClass('binf-open');
          sortWrapper.addClass('binf-hidden');
          self.searchColumn = columnName;
        });
        searchbox.on('closed', function () {
          sortWrapper.removeClass('binf-hidden');
          self.collection.filters[columnName] = undefined;
        });
        this.searchRegion.show(self.searchBoxes);
        if (columnName === self.searchColumn && !self.options.thumbnailView.activeInlineForm) {
          searchbox.setFocus();
        }
        searchWrapper = $(this).find('.csui-table-column-search');
        if (searchWrapper) {
          searchWrapper.attr('aria-label',
              _.str.sformat(lang.searchIconTooltip, lang.name));
        }
      }
    },
    applyFilter: function (data) {
      var filterObj = {};
      filterObj[data.column] = data.keywords;
      if (this.collection.fetching) {
        this.filterValuePending = filterObj;
      } else {
        this.collection.resetLimit(false);
        this.collection.setFilter(filterObj);
        this.options.thumbnailView &&
        this.options.enableViewState &&
        this.options.thumbnailView.setViewStateFilter(this.collection.getFilterAsObject());
      }
    }
  });
  
  var ThumbnailView = Marionette.LayoutView.extend({

    className: 'csui-thumbnail-container',
    template: thumbnailTemplate,
    regions: {
      headerRegion: '#csui-thumbnail-header',
      resultsRegion: '#csui-thumbnail-results'
    },

    childEvents: {
      'show:toolbar' : 'showToolBarActions'
    },

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.csui-thumbnail-results',
        suppressScrollX: true,
        scrollYMarginOffset: 15
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },

    constructor: function ThumbnailView(options) {
      options || (options = {});
      this._allSelectedNodes = options.allSelectedNodes ||
                               (this._allSelectedNodes = new Backbone.Collection());
      this.options = options;
      var defaultOptions = {
        selectThumbnails: "multiple"
      };
      _.defaults(this.options, defaultOptions);
      if (options.actionItems && options.commands) {
        this.defaultActionController = new DefaultActionController({
          actionItems: options.actionItems,
          commands: options.commands
        });
        this.checkModelHasAction = this.defaultActionController.hasAction.bind(
            this.defaultActionController);
      } else {
        this.checkModelHasAction = function () {
          return true;
        };
      }
      this.context = options.context;
      Marionette.LayoutView.prototype.constructor.call(this, options);
      this.collection = options.collection;
      var checkSelection = this.collection.where({csuiIsSelected: true});
      this.collection.itemchecked = false;
      if (checkSelection.length > 0) {
        this.collection.itemchecked = true;
      }
      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }
      this.listenTo(this.collection, "update", this._handleModelsUpdate);
      this.listenTo(this.collection, "change", this.updateRow);

      if (this.context) {
        this.listenTo(this.context, 'request', this._handleContextRequest)
            .listenTo(this.context, 'sync error', this._handleContextFinish)
            .listenTo(this.context, 'sync', this._handleContextSync)
            .listenTo(this.context, "request", this.blockActions)
            .listenTo(this.context, "sync", this.unblockActions);
      }

      this.listenTo(this.collection, "request", this.blockActions)
          .listenTo(this.collection, "sync", _.bind(function() {
            this.triggerMethod('update:scrollbar');
            this.unblockActions();
          },this))
          .listenTo(this.collection, "destroy", this.unblockActions)
          .listenTo(this.collection, "error", this.unblockActions);
      if (this.options.enableViewState) {
        this.listenTo(this.context.viewStateModel, 'change:state', this.onViewStateChanged);
      }

      this._ViewCollection = Backbone.Collection.extend({
        model: this.collection.model
    
      });
      this.selectedChildren = new this._ViewCollection();
      var self = this;
      this.el.addEventListener('scroll', function () {
        self.trigger('scroll');
      }, true);
      this.listenTo(this.collection, "reset", this._updateSelectedChildren);
      this.listenTo(this.collection, "remove", this._updateSelectedChildren);
      this.listenTo(this.collection, "new:page", this.resetScrollToTop);
      this.listenTo(this.collection, "reset", function () {
        if (!this._isRendered) {
          return;
        }
        this.resetScrollToTop();  // reset scroll when navigating from breadcrumb
        if (this.thumbnailHeaderView && this.collection.filters && this.collection.filters.name) {
          this.thumbnailHeaderView.updateTotalCount();
          if (this.collection.length > 0) {
            this.thumbnailHeaderView.ui.selectAll.removeAttr("disabled");
          } else {
            this.thumbnailHeaderView.ui.selectAll.attr("disabled", "true");
          }
        } else {
          this.thumbnailHeaderView.render();
          if (this.thumbnailHeaderView && this.thumbnailHeaderView.isSortOrderClicked) {
            self.thumbnailHeaderView.sortRegion.$el.find('.csui-sort-arrow').trigger('focus');
          }
        }
      });
       this.listenTo(this, 'dom:refresh', this._adjustThumbnailWidth)
           .listenTo(this.collection, 'filter:change', this._collectionFilterChanged);
      this.listenTo(this, 'scroll', this._destroyInlineActionBar );       
    },

    initialize : function(){
      
      this.thumbnailHeaderView = new ThumbnailHeaderView({
        columns: this.options.displayedColumns,
        context: this.context,
        columnsWithSearch: this.options.columnsWithSearch,
        filterBy: this.options.filterBy,
        collection: this.options.collection,
        thumbnailView: this,
        allColumns: this.options.allColumns,
        enableViewState: this.options.enableViewState
      });
      this.updateCollectionParameters();

      var thumbnailContentColumns = [];
      if (this.options.tableColumns) {
        thumbnailContentColumns = this.options.tableColumns.deepClone();
        var namingKey,
            namingKeyModel = _.filter(this.options.columns.models,
                function (model) { return model.get("isNaming");});
        namingKey = namingKeyModel.length ? namingKeyModel[0].get("column_key") : 'name';

        var thumbnailContentColumnsHasNamingKey = _.filter(thumbnailContentColumns.models,
            function (model) {
              return model.get("key") === namingKey;
            });
        if (thumbnailContentColumnsHasNamingKey.length > 0 &&
            thumbnailContentColumnsHasNamingKey[0].get("key") !== "name") {
          thumbnailContentColumnsHasNamingKey[0].attributes.isNaming = true;
          thumbnailContentColumns.remove(
              thumbnailContentColumns.findWhere({key: 'name'}));
        } else if (!thumbnailContentColumnsHasNamingKey.length) {
          thumbnailContentColumns.remove(
              thumbnailContentColumns.findWhere({key: 'name'}));
          thumbnailContentColumns.add({
            key: namingKey,
            sequence: 4
          });
        }
      }

      this.resultsView = new ThumbnailListView({
        context: this.options.context,
        collection: this.options.collection,
        thumbnailView: this,
        originatingView: this.options.originatingView,
        inlineBar: this.options.inlineBar,
        thumbnailHeaderView: this.thumbnailHeaderView,
        tableColumns: this.options.tableColumns,
        columns: this.options.columns,
        thumbnailContent: this.options.thumbnailContent || thumbnailContentColumns
      });
    },

    _destroyInlineActionBar: function () {
      var inlineToolbarContainer = this.$el.find('.csui-table-actionbar .binf-dropdown.binf-open');
      if (this.resultsView.inlineToolbarView && inlineToolbarContainer.length > 0) {
        inlineToolbarContainer.removeClass('binf-open');
      }
    },

    closeInlineForm: function () {
      var thumbnailView             = this.thumbnail ? this.thumbnail : this,
          isLocallyCreated          = thumbnailView.activeInlineForm &&
                                      thumbnailView.activeInlineForm.model.isLocallyCreated,
          inlineFormParentContanier = thumbnailView.activeInlineForm &&
                                      thumbnailView.activeInlineForm.$el.parents(
                                          ".csui-thumbnail-item");
      if (thumbnailView.activeInlineForm && (!isLocallyCreated ||
                                             (isLocallyCreated &&
                                              thumbnailView.activeInlineForm.model.fetched))) {
        if (thumbnailView.activeInlineForm.model.get('type') === 140) {
          thumbnailView.$el.find('.csui-new-thumbnail-item').removeClass('csui-new-thumbnail-item');
        }
        thumbnailView.lockedForOtherContols = false;
        delete thumbnailView.activeInlineForm.model.inlineFormView;
        thumbnailView.activeInlineForm.model.trigger('sync');
        delete thumbnailView.activeInlineForm;
        thumbnailView.$el.find('.csui-thumbnail-item-form').removeClass('csui-thumbnail-item-form');
        thumbnailView.cancelAnyExistingInlineForm({silent: true}, inlineFormParentContanier);
      }
    },

    _collectionFilterChanged: function () {
      this.options.enableViewState && this.setViewStateFilter(this.collection.getFilterAsObject());
    },

    _updateSelectedChildren: function () {
      if (!this._isRendered) {
        return;
      }
      if (this.options.selectedChildren &&
          this.options.selectedChildren.enableNonPromotedCommands) {
        this.showToolBarActions();
      }
    },

    _handleContextRequest: function () {
      this._fetchingContext = true;
      this._columnsReset = false;
      this._collectionReset = false;
    },

    _handleContextSync: function () {
      if (!this._isRendered) {
        return;
      }
      if (this._columnsReset) {
        this.rebuild();
      } else if (this._collectionReset) {
        this.render();
      }
    },

    _handleContextFinish: function () {
      this._fetchingContext = false;
      this.unblockActions();
    },

    resetScrollToTop: function () {
      if (this._isRendered && this.resultsRegion) {
        this.resultsRegion.$el.scrollTop(0);
      }
    },

    onDestroy: function () {
      if (this._originalScope) {
        this.options.collection.setResourceScope(this._originalScope);
      }
    },

    _handleModelsUpdate: function (collection, options) {
      if (!this._isRendered) {
        return;
      }
      var models = options.changes.added,
        self = this;
      if (models.length > 0) {
        _.each(models, function (model) {
          model.unset(SelectContentView.isSelectedModelAttributeName);
        });
        this.triggerMethod('before:render', this);
        this.trigger("inlineFormCreation", models);
        this.resultsView.showOrHideZeroRecordsMessage();
        this._adjustThumbnailWidth();
        this.trigger('dom:refresh');  // fix for perfect scrollbar on updating collection (adding or removing node)
        _.each(models, function (model) {
          if (model.isLocallyCreated && !model.inlineFormView) {
            self.$el.find(".csui-thumbnail-item-" + model.cid).find(
              ".csui-thumbnail-content-container").addClass("csui-new-item");
          }
        });
      }
      if (this.thumbnailHeaderView) {
        this.thumbnailHeaderView.ui.selectAll.prop('disabled', this.collection.length === 0);
        this.thumbnailHeaderView.updateTotalCount();
        this.thumbnailHeaderView.trigger('selectOrUnselect.mixed');
      }
    },

    onViewStateChanged: function () {
      var viewStateModel = this.context.viewStateModel,
        filterAsString = viewStateModel.getViewState('filter', true);
      if (filterAsString) {
        if (JSON.stringify(this.collection.getFilterAsObject()) !== filterAsString) {
          this.applyFilter(this.getViewStateFilterAsObject(filterAsString));
        }
      } else if (this.collection.filters) {
        this.collection.clearFilter();
      }
    },
   
    updateSelectAllCheckbox: function () {
      var selectAllRegion = (this.thumbnail && this.thumbnail.headerRegion.currentView.selectAllRegion) ||
        (this.options && this.options.thumbnailView.headerRegion &&
          this.options.thumbnailView.headerRegion.currentView &&
          this.options.thumbnailView.headerRegion.currentView.selectAllRegion),
        checkboxView = selectAllRegion && selectAllRegion.currentView;
      if (checkboxView) {
        var selected = this.collection.where({ csuiIsSelected: true }).length;
        var checkboxValue = selected === 0 ? false : selected === this.collection.length ? true : 'mixed';
        checkboxView.setChecked(checkboxValue);
      }
    },
  
    _maintainNodeState: function (model) {
      var nodeModel = model,
          self      = this;
      if (model && !!model.inlineFormView) {
        self.activeInlineForm = new nodeModel.inlineFormView({
          model: nodeModel,
          originatingView: self.options.originatingView,
          context: self.context
        });
        self.$el.find('.csui-thumbnail-item-' + nodeModel.cid).addClass('csui-thumbnail-item-form');
        if ((nodeModel.isLocallyCreated && !nodeModel.fetched) || nodeModel.get('type') === 140) {
          self.$el.find('.csui-thumbnail-item-' + nodeModel.cid).addClass(
              'csui-new-thumbnail-item');
        }

        var className = '.csui-thumbnail-name-' + nodeModel.cid;
        var divForInlineForm = this.$el.find(className);
        var inlineFormRegion = new Marionette.Region({el: divForInlineForm});
        inlineFormRegion.show(self.activeInlineForm);
        return true;
      }
      else {
        return false;
      }
    },

    updateRow: function (collectionOrModel) {
      if (collectionOrModel.isLocallyCreated) {
        this.$el.find(".csui-thumbnail-item-form") &&
        this.$el.find(".csui-thumbnail-item-form").find(
            ".csui-thumbnail-content-container").addClass("csui-new-item");
      }
      this.isSelected = this.collection.where({csuiIsSelected: true}).length > 0;
      if (collectionOrModel.inlineFormView) {
        this.options.originatingView.updateRowIndex = this.collection.indexOf(collectionOrModel);
        var self = this;

        if (self.activeInlineForm && self.activeInlineForm.model !== collectionOrModel) {
          var id = self.activeInlineForm.model.cid,
            isLocallyCreated = self.activeInlineForm.model.isLocallyCreated,
            inlineFormParentContanier = self.activeInlineForm.$el.parents(".csui-thumbnail-item");
          this.$el.find(".csui-thumbnail-item-form").removeClass('csui-thumbnail-item-form');
          this.$el.find(".csui-thumbnail-item-form").removeClass('csui-thumbnail-item-rename-form');
          this.$el.find(".csui-new-thumbnail-item").removeClass('csui-new-thumbnail-item');
          this.activeInlineForm.model.trigger('sync');
          this.cancelAnyExistingInlineForm({ silent: true });
          if (isLocallyCreated) {
            this.$el.find('.csui-thumbnail-item-' + id).find(
              '.csui-thumbnail-content-container').addClass('csui-new-item');
          }
        }
        if (!(collectionOrModel.changed.csuiInlineFormErrorMessage) && !(collectionOrModel.isLocallyCreated)) {
          this.trigger("cancelInlineForm", { silent: true });
        }
        self.activeInlineForm = new collectionOrModel.inlineFormView({
          model: collectionOrModel,
          originatingView: self.options.originatingView,
          context: self.context
        });
        this.listenTo(this.activeInlineForm, 'dom:refresh', function () {
          self.currentItemView && self.currentItemView.trigger('update:scrollbar');
        });

        this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).addClass(
            "csui-thumbnail-item-rename-form");
        if (collectionOrModel.get('type') === 140) {
          this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).addClass(
              'csui-new-thumbnail-item');
        }
        var className = '.csui-thumbnail-name-' + collectionOrModel.cid;
        var divForInlineForm = this.$el.find(className);
        self.activeInlineForm.listenTo(self.activeInlineForm, 'destroy', function () {
          self.lockedForOtherContols = false;
          self.activeInlineForm.model.trigger('sync');
          delete self.activeInlineForm;
          collectionOrModel.renamed = true;
        });
        this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).removeClass(
            'csui-thumbnail-item-apply-transition');
        self.$el.find(".csui-thumbnail-item-" + self.activeInlineForm.model.cid).addClass(
            'csui-thumbnail-item-form');
        if (divForInlineForm.length > 0) {
          var inlineFormRegion = new Marionette.Region({el: divForInlineForm});
          inlineFormRegion.show(self.activeInlineForm);
        }

        self.$el.find(".csui-thumbnail-item-" + self.activeInlineForm.model.cid).removeClass(
            'csui-thumbnail-item-rename-form');
        self.$el.find(".csui-thumbnail-item-" + self.activeInlineForm.model.cid).find(
            "div.csui-thumbnail-overview-icon").addClass("binf-hidden");
        if (this.$el.find(".csui-thumbnail-item-form") &&
            this.$el.find(".csui-thumbnail-item-form").find(
                ".csui-thumbnail-content-container .csui-inlineform-error").length > 0) {
          this.$el.find(".csui-thumbnail-item-form").find(
              ".csui-thumbnail-content-container.csui-new-item").addClass("csui-new-item-error");
        }
        if (self.activeInlineForm && divForInlineForm.length > 0) {
          self.activeInlineForm.triggerMethod('dom:refresh', self.activeInlineForm);
        }
      } else {
        this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).removeClass(
            'csui-thumbnail-item-form');
        this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).addClass(
            'csui-thumbnail-item-apply-transition');

        this.$el.find(".csui-thumbnail-item-" + collectionOrModel.cid).removeClass(
            'csui-new-thumbnail-item');
        if (this.activeInlineForm && this.activeInlineForm.model.cid === collectionOrModel.cid) {
          this.activeInlineForm.model.trigger('sync');
          this.cancelAnyExistingInlineForm({silent: true});
          collectionOrModel.renamed = true;
        }
        this.trigger("updateItem", collectionOrModel);
        if (this.collection && this.collection.filters.name &&
            this.thumbnailHeaderView.searchBoxes) {
          this.thumbnailHeaderView.searchBoxes.setFocus();
        }
        if (this.$el.find(
                ".csui-thumbnail-content-container.csui-new-item.csui-new-item-error").length > 0) {
          this.$el.find(
              ".csui-thumbnail-content-container.csui-new-item.csui-new-item-error").removeClass(
              "csui-new-item-error");
        }
      }
    },

    onAfterShow: function () {
      this.thumbnailHeaderView.searchBoxes.setFocus();
    },

    onShow: function () {
      this.isShown = true;
    },

    _adjustThumbnailWidth: function () {
      var thumbnailViewItem             = this.$el.find('.csui-thumbnail-item'),
          thumbnailViewItemWidth        = 190, //min, max width
          parentWidth                   = $('.csui-table-facetview .csui-facet-panel').length > 0 ?
                                          $('.csui-facet-table-container').width() -
                                          $('.csui-table-facetview').width() :
                                          $('.cs-thumbnail-wrapper').width(),
          spaceBetweenItems             = 2,
          thumbnailViewItemWidthPercent = thumbnailViewItemWidth / parentWidth * 100;
      for (var i = 1; i <= thumbnailViewItem.length; i++) {
        var thumbnailViewItemTotalWidth = i * thumbnailViewItemWidthPercent;
        if (thumbnailViewItemTotalWidth > 100) {
          i = i - 1;
          thumbnailViewItemWidthPercent = 100 / i;
          break;
        }
      }
      thumbnailViewItem.css({
        'maxWidth': "calc(" + thumbnailViewItemWidthPercent + '% - ' + spaceBetweenItems * 2 +
                    "px)",
        'minWidth': "calc(" + thumbnailViewItemWidthPercent + '% - ' + spaceBetweenItems * 2 +
                    "px)"
      });
    },

    cancelAnyExistingInlineForm: function (options, parentContanier) {
      this.trigger("cancelInlineForm", options);
      if (this.activeInlineForm) {
        this.activeInlineForm.cancel(options);
      }
    },

    startCreateNewModel: function (newNode, inlineFormView) {
      this.cancelAnyExistingInlineForm();
      if (this.collection && this.collection.node) {
        newNode.set("parent_id", this.collection.node.get('id'));
        newNode.isLocallyCreated = true;
        newNode.inlineFormView = inlineFormView;
        this.collection.add(newNode, {at: 0});
        this._adjustThumbnailWidth();
      }
    },

    onRender: function () {

      this.headerRegion.show(this.thumbnailHeaderView);
      var self = this;
      self.listenTo(self, "thumbnailRowRendered", function (itemView) {
        self.trigger("thumbnailItemRendered", {
          sender: self, target: itemView.target, node: itemView.node
        });
      });
     
      this.showToolBarActions();
      this.resultsRegion.show(this.resultsView);
      this.listenTo(this.context, "maximize:widget", this._adjustThumbnailWidth);
      this.listenTo(this.context, "restore:widget:size", this._adjustThumbnailWidth);
      if (this.options.selectThumbnails === "single") {
        this.$el.addClass("single-select-ThumbnailView");
      }
      else {
        this.$el.removeClass("single-select-ThumbnailView");
      }
    },
    updateCollectionParameters: function () {
      var collection = this.options.collection,
          context = this.options.context,
          supportsFields = collection.makeFieldsV2,
          supportsExpand = collection.makeExpandableV2,
          fields = {},
          expands = {};

      if (!this.options.collection.setFields) {
        return;
      }
      if ((supportsFields || supportsExpand) &&
          collection.getResourceScope && collection.setResourceScope) {
        if (this._originalCollectionScope) {
          collection.setResourceScope(this._originalCollectionScope);
        } else {
          this._originalCollectionScope = collection.getResourceScope();
        }
      }
      _.each(this.options.allColumns, function (column) {
        var ColumnView = column.CellView;
        if (ColumnView) {
          if (supportsFields && ColumnView.getModelFields) {
            var field = ColumnView.getModelFields({
              collection: collection,
              context: context,
              column: column
            });
            if (field) {
              FieldsV2Mixin.mergePropertyParameters(fields, field);
            }
          }
          if (supportsExpand && ColumnView.getModelExpand) {
            var expand = ColumnView.getModelExpand({
              collection: collection,
              context: context,
              column: column
            });
            if (expand) {
              FieldsV2Mixin.mergePropertyParameters(expands, expand);
            }
          }
          if (ColumnView.updateCollectionParameters) {
            ColumnView.updateCollectionParameters({
              collection: collection,
              context: context,
              column: column
            });
          }
        }
      }, this);
      if (!_.isEmpty(fields)) {
        collection.setFields(fields);
      }
      if (!_.isEmpty(expands)) {
        collection.setExpand(expands);
      }
    },

    clearChildrenSelection: function () {
      this.thumbnailHeaderView && this.thumbnailHeaderView.trigger('selectOrUnselect.all', false);
    },

    showToolBarActions: function (e) {
      var selectedNodes = this.getSelectedChildren();
      selectedNodes = this.options.allSelectedNodes && this.options.allSelectedNodes.models ||
                      selectedNodes;
      this.thumbnailHeaderView.$el.find('.csui-thumbnail-select .csui-control').length && this.thumbnailHeaderView.$el.find('.csui-thumbnail-select .csui-control').trigger('focus');
    },
    getSelectedChildren: function () {
      var selectedNodes = [];
      this.options.collection.each(function (model) {
        if (!!model.get('csuiIsSelected')) {
          selectedNodes.push(model);
        }
      });
      return selectedNodes;
    }
  });
  _.extend(ThumbnailItemView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(ThumbnailListView.prototype, ViewEventsPropagationMixin);
  _.extend(ThumbnailView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(ThumbnailView.prototype, NodeViewStateMixin);

  return ThumbnailView;
});
