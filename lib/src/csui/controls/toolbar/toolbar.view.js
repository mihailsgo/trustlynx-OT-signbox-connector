/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/controls/toolbar/toolitem.view',
  'csui/controls/toolbar/flyout.toolitem.view',
  'csui/controls/toolbar/toolitem.custom.view',
  'csui/controls/toolbar/toolitems.view',
  'csui/models/nodes',
  'csui/controls/toolbar/toolitems.filtered.model',
  'hbs!csui/controls/toolbar/impl/lazy.loading.template',
  "csui/controls/tile/behaviors/perfect.scrolling.behavior",
  'csui/utils/base',
  'csui/utils/high.contrast/detector!',
  'csui/controls/globalmessage/globalmessage',
  'csui/controls/icons.v2',
  'css!csui/controls/toolbar/impl/toolbar'
], function (_, $, Backbone, Marionette, ToolItemView, FlyoutToolItemView,
    ToolItemCustomView, ToolItemsView, NodeCollection, FilteredToolItemsCollection,
    lazyloadingTemplate,
    PerfectScrollingBehavior, base, highContrast,
    GlobalMessage, iconRegistry) {
  'use strict';

  var ToolBarView = ToolItemsView.extend({
    parentScrollElement: '.csui-metadata-myattachments',
    className: function () {
      var cssClassForNavigationBar = "binf-nav binf-nav-pills ";
      var cssClassForAlignment = "csui-align-left";
      if (this.options.hAlign) {
        if (this.options.hAlign === "right") {
          cssClassForAlignment = "csui-align-right";
        } else if (this.options.hAlign === "none") {
          cssClassForAlignment = '';
        }
      }
      return "csui-toolbar " + cssClassForNavigationBar + cssClassForAlignment;
    },

    events: {"keydown": "onKeyInView"},

    childViewOptions: function (model) {
      return _.extend(ToolItemsView.prototype.childViewOptions.call(this, model), {
        collection: model.toolItems,
        command: this.collection.commands &&
                 this.collection.commands.findWhere({signature: model.get('signature')}),
        useIconsForDarkBackground: this._useIconsForDarkBackground
      });
    },

    constructor: function ToolBarView(options) {
      options || (options = {});
      this.parentScrollElement = options.parentScrollElement || this.parentScrollElement;

      ToolBarView.__super__.constructor.apply(this, arguments);
      if (options.el) {
        $(options.el).addClass(_.result(this, "className"));
      }
      this._useIconsForDarkBackground = (options.useIconsForDarkBackground && highContrast !== 2) || highContrast === 1;

      this.listenTo(this, 'dom:refresh', this._onDomRefresh)
          .listenTo(this, 'before:execute:command', this._setBlocked)
          .listenTo(this, 'after:execute:command', this._setUnblocked);

      if (options.keyboardNavigationEnabled) {
        this._keyboardNavigationEnabled = true;

        this.listenTo(this.collection, 'remove', function () {
          if (this._accFocusedToolbarItemIndex > this.collection.length - 1) {
            this._accFocusedToolbarItemIndex = this.collection.length - 1;
          }
        });
        this.listenTo(this.collection, 'reset', function () {
          this._accFocusedToolbarItemIndex = this.collection.length > 0 ? 0 : -1;
        });

        this._accFocusedToolbarItemIndex = this.collection.length > 0 ? 0 : -1;
      }
      this.fetchingNonPromotedActions = false;

      $(window).on('resize.' + this.cid, this._handleWindowResize.bind(this));
    },

    filter: function (model) {
      return model;
    },

    _onDomRefresh: function () {
      if (!this._adjusting) {
        this._adjustToFit();
      }
    },

    onBeforeRender: function () {
      this._unwrapDropDown();
    },

    onRender: function () {
      if (this._toolbarBlocked && !this._isSingleCommandBlocked) {
        this.$el.addClass('binf-disabled');
      }
    },

    onDestroy: function () {
      $(window).off('resize.' + this.cid);
    },

    _getFocusedElementByIndex: function (index) {
      var nth = index + 1;
      var el = this.$el.find('>li:nth-child(' + nth + ')>a.csui-acc-focusable');
      return el;
    },

    getVisibleToolitemsCount: function () {
      var el = this.$el.find('>li>a.csui-acc-focusable');
      return el.length;
    },

    currentlyFocusedElement: function () {
      if (this._keyboardNavigationEnabled && this._accFocusedToolbarItemIndex >= 0) {
        return this._getFocusedElementByIndex(this._accFocusedToolbarItemIndex);
      } else {
        return $();
      }
    },
    setFocusByIndex: function (index) {
      this._getFocusedElementByIndex(index).trigger('focus');
    },

    letRightmostItemGetFocus: function () {
      this._accFocusedToolbarItemIndex = this.collection.length - 1;
    },

    closeDropdown: function () {
      this.children.call('closeDropdown');
    },

    onKeyInView: function (event) {
      if (!this._keyboardNavigationEnabled) {
        return; // skip keyboard navigation (to prevent interference with tabletoolbar
      }
      if (this.collection.length === 0) {
        return; // skip keyboard if no toolbar items are here
      }
      switch (event.keyCode) {
      case 37:

        event.stopPropagation();

        if (this._accFocusedToolbarItemIndex > 0) {
          this._accFocusedToolbarItemIndex = this._accFocusedToolbarItemIndex - 1;
          this.triggerMethod('changed:focus');
        } else {
          this._accFocusedToolbarItemIndex = 0; // stay at first item
          this.triggerMethod('focusout', {direction: 'left'});
        }
        break;
      case 39:

        event.stopPropagation();

        if (this._accFocusedToolbarItemIndex < this.collection.length - 1) {
          this._accFocusedToolbarItemIndex = this._accFocusedToolbarItemIndex + 1;
          this.triggerMethod('changed:focus');
        } else {
          this._accFocusedToolbarItemIndex = this.collection.length - 1; // stay at last item
          this.triggerMethod('focusout', {direction: 'right'});
        }
        break;
      }
    },

    _handleWindowResize: function () {
      if (this._handleWindowResizeTimeout) {
        clearTimeout(this._handleWindowResizeTimeout);
      }
      if (!this.isDestroyed) {
        var self = this;
        this._handleWindowResizeTimeout = setTimeout(function () {
          self._handleWindowResizeTimeout = undefined;
          var checkNodesTableVisibility = self.options.originatingView === undefined ? true :
                                          self.options.originatingView.isDisplayed;
          if (!self.isDestroyed && checkNodesTableVisibility) {
            self.render(); // note: _adjustToFit is called from onDomRefresh
          }
        }, 100);
        this._adjustToFit();
      }
    },

    _setBlocked: function (eventArgs) {
      var self = this,
          command = eventArgs.command,
          toolItemView = eventArgs.status && eventArgs.status.toolItemView,
          $el = command && command.get('selfBlockOnly') && toolItemView ?
                toolItemView.$el.find('a') : this.$el;
      if (!command.get('allowMultipleInstances')) {
        this._blockedTimer = setTimeout(function () {
          if (self._toolbarBlocked === false) {
            $el.removeClass('binf-disabled');
          }
          self._blockedTimer = undefined;
        }, 500);

        this._toolbarBlocked = true;
        this._isSingleCommandBlocked = !$el.is(this.$el);
        $el.addClass('binf-disabled');
      }
    },

    _setUnblocked: function (eventArgs) {
      this._toolbarBlocked = false;
      var command = eventArgs.command,
          toolItemView = eventArgs.status && eventArgs.status.toolItemView,
          $el = command && command.get('selfBlockOnly') && toolItemView ?
                toolItemView.$el.find('a') : this.$el;
      if (!this._blockedTimer) {
        $el.removeClass('binf-disabled');
        if (eventArgs && eventArgs.cancelled) {
          var targetToolItem = this.$el.find('[data-csui-command=' +
                                             eventArgs.commandSignature.toLowerCase() + '] a'),
              isUnderDropDown = targetToolItem.length ?
                                targetToolItem.closest('ul.csui-more-dropdown-menu') : {};
          if (isUnderDropDown.length) {
            isUnderDropDown.siblings('a.binf-dropdown-toggle').trigger('focus');
          } else {
            targetToolItem.trigger('focus');
          }
        }
      }
    },

    _adjustToFit: function () {
      if (this._isActive === false) {
        return;
      }

      this.trigger('before:adjust');
      var itemViews = _.filter(this.children.toArray(), function (view) {
        return view instanceof ToolItemView || view instanceof FlyoutToolItemView;
      });
      itemViews = _.sortBy(itemViews, 'cid');
      if (!_.isUndefined(this.options.maxItemsShown)) {
        this._unwrapDropDown(); // revert already wrapped toolbar items
        this._adjusting = true;
        this.el.classList.add('csui-measuring');  // makes ul to overflow:hidden
        if (this.children.length > 0) {
          this._doAdjustToFit(itemViews);
          this.options.lazyActions && this._loadLazyActions();
        }
        this.el.classList.remove('csui-measuring'); // use overflow style only during measuring
        this._adjusting = false;
      } else {
        this._makeItemsFocusable(itemViews);
      }
      this.trigger('after:adjust');
    },

    _makeItemsFocusable: function (items) {
      _.each(items, function (toolItemView, index) {
        toolItemView.makeFocusable();
      }, this);
    },
    _doAdjustToFit: function (itemViews) {
      var firstOffsetY = Math.round(this.$el.offset().top),
          rightMost = Math.round(this.el.getBoundingClientRect() ?
                                 this.el.getBoundingClientRect().width : this.$el.width()),
          condensedIconWidth = this.$el.parents('.csui-table-rowselection-toolbar-view') ? this.$el.parents('.csui-table-rowselection-toolbar-view').find('.csui-condensed-header-toggle-container').width() : 0;
          rightMost = base.isIE11() ? rightMost - condensedIconWidth : rightMost;
      this.options.toolbarItemViewOptions = {
        toolItemCounter: 0,
        pEl: undefined,
        pIsSeparator: undefined,
        ppEl: undefined,
        dropDownMenuEl: undefined,
        currentRight: 0,
        rightMost: rightMost,
        firstOffsetY: firstOffsetY,
        index: 0,
        separatorView:undefined
      };

      if (itemViews.length > 1 || this.options.maxItemsShown === 0) {
        _.each(itemViews, function (toolItemView, index) {
          this.options.toolbarItemViewOptions.index = index;
          this._wrapToolItemView(toolItemView);
        }, this);
      } else {
        this._makeItemsFocusable(itemViews);
      }

    },

    _loadLazyActions: function () {
      var lazyActionsRetrieved = true;
      var isLocallyCreatedNode = true;
      var nonPromotedActionCommands = [];

      var selectedNodes;
      if (this.collection.status.nodes instanceof NodeCollection) {
        selectedNodes = this.collection.status.nodes;
      } else {
        if (this.collection.status.nodes instanceof Backbone.Collection) {
          selectedNodes = new NodeCollection(this.collection.status.nodes.models);
        } else {
          if (_.isArray(this.collection.status.nodes)) {
            selectedNodes = new NodeCollection(this.collection.status.nodes);
          } else {
            selectedNodes = new NodeCollection();
          }
        }
      }
      if (!selectedNodes.connector) {
        selectedNodes.connector = this.collection.status.collection.connector;
      }

      selectedNodes.each(function (selectedNode) {
        lazyActionsRetrieved = lazyActionsRetrieved &&
                               selectedNode.get('csuiLazyActionsRetrieved');
        isLocallyCreatedNode = isLocallyCreatedNode && selectedNode.isLocallyCreated;
        nonPromotedActionCommands = nonPromotedActionCommands.length ?
                                    nonPromotedActionCommands :
                                    selectedNode.nonPromotedActionCommands;
      });

      selectedNodes.nonPromotedActionCommands = nonPromotedActionCommands;
      selectedNodes.lazyActionsRetrieved = lazyActionsRetrieved;

      if (!lazyActionsRetrieved && !isLocallyCreatedNode &&
          nonPromotedActionCommands.length) { //Lazy actions are not
        if (!this.fetchingNonPromotedActions) { //fetching nonpromoted actions not yet started
          this._renderLazyActions(selectedNodes);
        }
        if (!this.$el.find('.csui-loading-parent-wrapper').length &&
            this.fetchingNonPromotedActions) {
          if (this.$el.find('.csui-more-dropdown-menu').length) {//hide dropdown with loading
            this.$el.find('.binf-dropdown.csui-more-dropdown-wrapper').addClass(
                'csui-toolbar-hide-child');
          } else { //no 3 dots dropdown
            if (this.options.toolbarItemViewOptions) {
              var loadingAnimationWidth = 46,
                  loadingAnimationRight = this.options.toolbarItemViewOptions.currentRight +
                                          10 + loadingAnimationWidth;
              if (this.options.toolbarItemViewOptions.toolItemCounter ===
                  this.options.maxItemsShown || loadingAnimationRight >
                  this.options.toolbarItemViewOptions.rightMost) {
                this.$el.find('li:last').addClass('csui-toolbar-hide-child');
              }
            }
          }
          this.$el.append(lazyloadingTemplate);
        }
      }
    },

    _wrapToolItemView: function (toolItemView) {
      var isSeparator = toolItemView.model.isSeparator();
      if (!isSeparator) {
        this.options.toolbarItemViewOptions.toolItemCounter++;
      }
      if (this.options.toolbarItemViewOptions.dropDownMenuEl) {
        if (!(isSeparator &&
              this.options.toolbarItemViewOptions.index + 1 === this.children.length)) {
          toolItemView.$el.attr('role', 'none');
          toolItemView.$el.find(
              '.csui-flyout-arrow .csui-button-icon.icon-expandArrowDown').addClass('binf-hidden');
          toolItemView.$el.find('.csui-toolitem.csui-flyout-arrow').removeClass(
              'csui-flyout-arrow');
          _.isFunction(toolItemView.renderTextOnly) && toolItemView.renderTextOnly(true);
          this.options.toolbarItemViewOptions.dropDownMenuEl.append(toolItemView.$el);
          toolItemView.triggerMethod('dom:refresh');
          if (this.usePerfectScrollbar()) {
            this.options.toolbarItemViewOptions.dropDownMenuEl.perfectScrollbar('update');
          }
        }
      } else {
        if (isSeparator) {
          this.options.toolbarItemViewOptions.separatorView = toolItemView;
        }
        else {
          var currentOffsetY = Math.round(base.getOffset(toolItemView.$el).top),
              currElementWidth = Math.round(toolItemView.$el[0].getBoundingClientRect() ?
                                            toolItemView.$el[0].getBoundingClientRect().width :
                                            toolItemView.$el.width());
          this.options.toolbarItemViewOptions.currentRight = this.options.toolbarItemViewOptions.currentRight +
                                                             parseInt(currElementWidth, 10);
          if (currentOffsetY !== this.options.toolbarItemViewOptions.firstOffsetY ||
              this.options.toolbarItemViewOptions.currentRight >
              this.options.toolbarItemViewOptions.rightMost ||
              (this.options.toolbarItemViewOptions.toolItemCounter > this.options.maxItemsShown)) {
            if (this.options.toolbarItemViewOptions.pIsSeparator) {
              if (this.options.toolbarItemViewOptions.ppEl) {
                this.options.toolbarItemViewOptions.ppEl.$el.attr('role', 'none');
                this.options.toolbarItemViewOptions.dropDownMenuEl = this._wrapWithDropDown(
                    this.options.toolbarItemViewOptions.ppEl, toolItemView);
                this.options.toolbarItemViewOptions.dropDownMenuEl.children().first().after(
                    this.options.toolbarItemViewOptions.pEl.$el);
              }
            } else {
              if (this.options.toolbarItemViewOptions.pEl) {
                this.options.toolbarItemViewOptions.pEl.$el.attr('role', 'none');
                this.options.toolbarItemViewOptions.dropDownMenuEl = this._wrapWithDropDown(
                    this.options.toolbarItemViewOptions.pEl, toolItemView);
              } else {
                this.options.toolbarItemViewOptions.dropDownMenuEl = this._wrapWithDropDown(
                    toolItemView, toolItemView);
              }
            }
          } else {
            toolItemView.makeFocusable();
          }
        }
        this.options.toolbarItemViewOptions.ppEl = this.options.toolbarItemViewOptions.pEl;
        this.options.toolbarItemViewOptions.pEl = toolItemView;
        this.options.toolbarItemViewOptions.pIsSeparator = isSeparator;
      }
    },

    _wrapWithDropDown: function (pItem, toolItemView) {
      _.isFunction(pItem.renderTextOnly) && pItem.renderTextOnly(true);
      var pEl = pItem.$el;
      pEl.wrap(
          '<li role="none" class="binf-dropdown csui-wrapper csui-more-dropdown-wrapper"><ul class="binf-dropdown-menu csui-more-dropdown-menu" role="menu"></ul></li>');
      var e = this._makeDropDown();
      var dropDownEl = this.$('li.csui-wrapper');

      dropDownEl.prepend(e);
      var dropDownMenuEl = dropDownEl.find('> ul.binf-dropdown-menu');
      pEl.find('.csui-flyout-arrow .csui-button-icon.icon-expandArrowDown').addClass('binf-hidden');
      pEl.find('.csui-toolitem.csui-flyout-arrow.csui-acc-focusable').removeClass(
          'csui-flyout-arrow');
      _.isFunction(toolItemView.renderTextOnly) && toolItemView.renderTextOnly(true);
      toolItemView.$el.find('.csui-flyout-arrow .csui-button-icon.icon-expandArrowDown').addClass(
          'binf-hidden');
      toolItemView.$el.find('.csui-toolitem.csui-flyout-arrow').removeClass('csui-flyout-arrow');
      dropDownMenuEl.append(toolItemView.$el); // move current toolitem into dropdown
      toolItemView.triggerMethod('dom:refresh');
      pEl.trigger('dom:refresh');
      var that = this;
      this.$el.off("show.binf.dropdown." + this.cid).on("show.binf.dropdown." + this.cid,
          _.bind(function () {

            var scrollableParent = dropDownMenuEl.closest(that.parentScrollElement);
            if (!!scrollableParent && scrollableParent.length > 0) {
              var scrollableParentHeight = scrollableParent.height(),
                  elementSetBacks = parseInt(scrollableParent.css("margin-top")) +
                                    parseInt(scrollableParent.css("margin-bottom"));
              if (dropDownMenuEl.height() + elementSetBacks > scrollableParentHeight) {
                var heightOfDD = scrollableParentHeight - elementSetBacks;
                dropDownMenuEl.css({
                  "overflow": "hidden",
                  "padding": "0",
                  "max-height": heightOfDD + "px"
                });
                setTimeout(function () {
                  dropDownMenuEl.perfectScrollbar({suppressScrollX: true});
                  dropDownMenuEl.perfectScrollbar("update");
                }, 1);
              }
            }
          }, that));
      this.$el.off('binf.dropdown.after.show.' + this.cid).on(
          'binf.dropdown.after.show.' + this.cid, function (event) {
            if (that.usePerfectScrollbar()) {
              dropDownMenuEl.addClass('csui-perfect-scrolling');
              dropDownMenuEl.perfectScrollbar({
                suppressScrollX: true,
                includePadding: true
              });
            } else {
              dropDownMenuEl.addClass('csui-normal-scrolling csui-no-scroll-x');//normal-scrolling for touch devices
            }
            base.alignDropDownMenu({targetEl: $(event.target)});
            that.trigger('toolbar.show');

           if (base.isAppleMobile() && dropDownMenuEl.hasClass('csui-submenu-active')) {
            dropDownMenuEl.removeClass('csui-submenu-active');
            }            
          });          
      return dropDownMenuEl;
    },

    _unwrapDropDown: function () {
      var dropDownEl = this.$('li.csui-wrapper'),
          dropDownMenuEl = dropDownEl.find('> ul.binf-dropdown-menu'),
          loadDotsElem = this.$el.find('.csui-loading-parent-wrapper');
      loadDotsElem && loadDotsElem.remove();
      if (dropDownMenuEl.length > 0) {
        var menuItems = dropDownMenuEl.children('li');
        menuItems.each(function (index, menuitem) {
          dropDownEl.before(menuitem);
          $(menuitem).trigger('dom:refresh');
        });
        dropDownEl.remove();
      }
      var flyouts = this.$el.find('.csui-flyout.binf-dropdown');
      if (flyouts.length) {
        _.each(flyouts, function (flyout) {
          var flyoutDdItems = $(flyout).find('ul li');
          if (flyoutDdItems.length >= 1) {
            $(flyout).find('> .csui-toolitem').addClass('csui-flyout-arrow');
            $(flyout).find('.csui-flyout-arrow .csui-button-icon.icon-expandArrowDown').removeClass(
                'binf-hidden');
          }
        });
      }

      this.children.forEach(function (item) {
        _.isFunction(item.restoreRenderState) && item.restoreRenderState();
      });
    },
    _makeDropDown: function () {
      var cssClass = "binf-dropdown-toggle csui-acc-focusable";
      var e = '<a href="#" role=' +(this.options.noMenuRoles ? '"button"' : '"menuitem"') + ' class="' + cssClass +
              ' " data-binf-toggle="dropdown" aria-expanded="false" aria-haspopup="true"';
      if (this.options.dropDownText) {
        e += ' title="' + this.options.dropDownText + '" aria-label="' + this.options.dropDownText +
             '">';
      } else {
        e += '>';
      }
      if (this.options.dropDownIconName) {
        e += iconRegistry.getIconByNameWithOptions(
            {
              iconName: this.options.dropDownIconName,
              theme: this._useIconsForDarkBackground ? 'dark' : '',
              states: true
            });
      } else {
        if (this.options.dropDownIcon) {
          e += '<span class="' + this.options.dropDownIcon + '"></span>';
        } else {
          if (this.options.dropDownText) {
            e += this.options.dropDownText;
          }
        }
      }
      e += "</a>";
      return e;
    },

    appendLazyActions: function () {
      var self = this,
          existingchildViews = _.sortBy(self.children.toArray(), 'cid'),
          index = 0,
          actionItems = _.filter(self.collection.models,
              function (model) { return model});
      _.each(actionItems, function (model) {
        var existingChildView = existingchildViews[index],
            itemName = model.get('name');
        if (existingChildView && existingChildView.model.get('name') === itemName) { //re-render flyout toolitem view,
          if (model.get('flyout') && model.toolItems.length !==
              existingChildView.model.toolItems.length) {
            existingChildView.collection.reset(model.toolItems.models);
          }
          index++;
        } else {
          if (self.options.toolbarItemViewOptions) {
            self.options.toolbarItemViewOptions.index++;
            var childViewClass = model.get('flyout') ? FlyoutToolItemView : ToolItemView,
                lazyToolItemView = self.addChild(model, childViewClass,
                    self.options.toolbarItemViewOptions.index);
            self._wrapToolItemView(lazyToolItemView);
            existingChildView && self.removeChildView(existingChildView);
            index++;
          }
        }
      });
    },

    startLazyLoading: function () {
      this.options.toolbarItemViewOptions.dropDownMenuEl.append(lazyloadingTemplate);
    },

    stopLazyLoading: function () {
      var blockingEle = this.$el.find('.csui-loading-parent-wrapper');
      blockingEle.remove();
    },

    _renderLazyActions: function (selectedNodes) {
      if (!selectedNodes.lazyActionsRetrieved) {
        var self = this;
        this.fetchingNonPromotedActions = true;

        selectedNodes.setEnabledLazyActionCommands(
            true).done(_.bind(function () {
          self.fetchingNonPromotedActions = false;
          var blockingEle = self.$el.find('.csui-loading-parent-wrapper');
          blockingEle.animate("width: 0", 300, function () {
            blockingEle.remove();
            self.$el.find('.csui-toolbar-hide-child').removeClass('csui-toolbar-hide-child');
            self.collection.silentFetch = true; //to stop re-rendering tableheader-toolbar
            self.collection.refilter();
            self.appendLazyActions();
            self.triggerMethod('dom:refresh');
            self.trigger('render:lazy:actions');
          });

        }), this).fail(function (request) {
          self.fetchingNonPromotedActions = false;
          var blockingEle = self.$el.find('.csui-loading-parent-wrapper'),
              error = new base.Error(request);
          blockingEle.length && blockingEle.remove();
          GlobalMessage.showMessage('error', error.message);
        });
      }
    },

    usePerfectScrollbar: function () {
      return PerfectScrollingBehavior.usePerfectScrollbar();
    },

    setActive: function (isActive) {
      this._isActive = isActive;
    }

  });

  return ToolBarView;
});
