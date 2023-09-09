/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette3',
  'csui/utils/base',
  'csui/controls/compound.document/reorganize/reorganize.item.view',
  'i18n!csui/controls/compound.document/nls/root/localized.strings',
  'css!csui/controls/compound.document/impl/reorganize'
], function (_, $, Marionette, base, ReorganizeItemView, lang) {
  'use strict';

  var ReorganizeListView = Marionette.CollectionView.extend({
    className: 'csui-reorder-list',
    tagName: 'ul',
    childView: ReorganizeItemView,
    attributes:{
      'role':'menu'
    },

    events: {
      'dragstart .csui-reorder-item': 'handleDragStart',
      'dragenter .csui-reorder-item': 'handleDragEnter',
      'dragover .csui-reorder-item': 'handleDragOver',
      'dragleave .csui-reorder-item': 'handleDragLeave',
      'drop .csui-reorder-item': 'handleDrop',
      'dragend .csui-reorder-item': 'handleDragEnd',
      'keydown .csui-reorder-item': "onKeyInView"
    },

    childViewOptions: function () {
      return {
        collection: this.options.collection,
        originatingView: this.options.originatingView,
        parentView: this,
      };
    },

    constructor: function ReorganizeListView(options) {
      options || (options = {});
      this.options = options;
      this.source = null;
      this.isdraggable = options.isdraggable;
      this.collection = this.options.collection;
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.focusIndex = 0;
    },

    onRender: function (e) {
      var slidesOrder = this.$el.find(".csui-reorder-item");
      this.reOrder(slidesOrder);
    },

    reorderCollection: function () {
      this.collection.models.sort(function (a, b) {
        return a.get("order") - b.get("order");
      });
      for (var i = 0; i < this.collection.length; i++) {
        if (this.collection.hasMaster) {
          this.collection.models[i].set('order', i, { silent: true });
        } else {
          this.collection.models[i].set('order', i + 1, { silent: true });
        }
      }
    },

    handleDragStart: function (event) {
      this.timer = null;
      this.edgeSize = 200;
      this.className += " dragStartClass";
      this.dragline = $('<div class="csui-dragline">');
      this.source = event.currentTarget;
      this.ghostElem = this.source.cloneNode(true);
      this.ghostElem.classList.add("ghostElem");
      $(this.ghostElem).css("position", "absolute");
      document.body.appendChild(this.ghostElem);
      if (base.isAppleMobile()) {
        this.ghostElem.css({"left": "-500px", "top": "-100%"});
      } else {
        this.dragEmptyEl = document.createElement('span');
        this.dragEmptyEl.classList.add("ghostElem");
        $(this.dragEmptyEl).css({"position": "absolute", "display": "block", "top": "0", "left": "0", "width": "0", "height": "0"});
        document.body.appendChild(this.dragEmptyEl);
      }
        event.originalEvent && event.originalEvent.dataTransfer &&
          event.originalEvent.dataTransfer.setData("text", event.currentTarget.innerHTML);
        if (event.originalEvent.dataTransfer) {
          event.originalEvent.dataTransfer.effectAllowed = "move";
        }
      if (event.originalEvent && event.originalEvent.dataTransfer) {
        if (base.isAppleMobile()) {
          event.originalEvent.dataTransfer.setDragImage(this.ghostElem, 10, 10);
        } else {
          if (!base.isIE11()) {
            event.originalEvent.dataTransfer.setDragImage(this.dragEmptyEl, 0, 0);
          }
        }
      }
    },

    handleDragEnter: function (event) {
      $(event.currentTarget).addClass("over");
      var currentOrderId = parseInt(event.currentTarget.getAttribute("data-order-id"));
      if (currentOrderId === 0 && $(this.source).hasClass('csui-non-master-item')) {
        this.isdraggable = false;
      }
      else {
        this.isdraggable = true;
      }
    },

    removeDragline : function () {
      this.$el.find('.csui-dragline').remove();
    },

    handleDragOver: function (event) {
      event.preventDefault();
      var target = event.currentTarget, elemHeight;
      if (event.currentTarget === this.source) {
        return false;
      }
      $(event.currentTarget).addClass("over");
      $(this.source).addClass('dragStartClass');
      event.originalEvent.dataTransfer.dropEffect = "move";
      var dragline = $('<div class="csui-dragline">');
      var currentOrderId = parseInt(event.currentTarget.getAttribute("data-order-id"));
      if ((currentOrderId === 0 && $(this.source).hasClass('csui-non-master-item')) &&
        $(event.currentTarget).prev(".csui-dragline").length != 0) {
        dragline.addClass("csui-restricted-location");
        $('.ghostElem .csui-mime-no-drop').show();
      } else {
        $('.ghostElem .csui-mime-no-drop').hide();
      }
      if (!base.isAppleMobile()) {
        var ghostElem = $("body .ghostElem"),
        left = window.innerWidth - (ghostElem.width() + 40) + "px",
        top = event.pageY + 20 + "px";
        ghostElem.css({"left": left, "top": top});
      }
      elemHeight = $(target).height();
      if (event.offsetY > (elemHeight / 2)) {
        this.removeDragline();
        $(target).after(dragline);
      } else {
        this.removeDragline();
        $(target).before(dragline);
      }
      this.viewportY = event.clientY;
      this.viewportHeight = this.options.options.sidePanel.$el.find('.csui-sidepanel-body')[0].clientHeight;
      this.edgeTop = this.edgeSize;
      this.edgeBottom = (this.viewportHeight - this.edgeSize);

      this.isInTopEdge = (this.viewportY < this.edgeTop);
      this.isInBottomEdge = (this.viewportY > this.edgeBottom);
      if (!(this.isInTopEdge || this.isInBottomEdge)) {
        clearTimeout(this.timer);
        return;
      }
      var sidePanel = this.options.options.sidePanel.$el.find('.csui-sidepanel-body .csui-compound-document-form')[0];
      this.sidePanelHeight = Math.max(
        sidePanel.scrollHeight,
        sidePanel.offsetHeight,
        sidePanel.clientHeight
      );
      this.maxScrollY = (this.sidePanelHeight - this.viewportHeight);
      this.checkForAutoScroll();
    return false;
    },

    checkForAutoScroll: function () {
      clearTimeout(this.timer);
      if (this.adjustAutoScroll()) {
        this.timer = setTimeout(this.checkForAutoScroll(), 30);
      }
    },

    adjustAutoScroll: function () {
      var currentScrollY = this.options.options.sidePanel.$el.find('.csui-sidepanel-body')[0].scrollTop,
      canScrollUp = (currentScrollY > 0),
      canScrollDown = (currentScrollY < this.maxScrollY),
      nextScrollY = currentScrollY,
      maxStep = 50,
      intensity;
      if (this.isInTopEdge && canScrollUp) {
        intensity = ((this.edgeTop - this.viewportY) / this.edgeSize);
        nextScrollY = (nextScrollY - (maxStep * intensity));
      } else if (this.isInBottomEdge && canScrollDown) {
        intensity = ((this.viewportY - this.edgeBottom) / this.edgeSize);
        nextScrollY = (nextScrollY + (maxStep * intensity));
      }
      nextScrollY = Math.max(0, Math.min(this.maxScrollY, nextScrollY));
      if (nextScrollY !== currentScrollY) {
        this.options.options.sidePanel.$el.find('.csui-sidepanel-body').scrollTop(nextScrollY);
      }
    },

    handleDragLeave: function (event) {
      $(event.currentTarget).removeClass("dragStartClass");
      $(event.currentTarget).removeClass("over");
    },

    handleDrop: function (event) {
      this.removeDragline();
      var slidesOrder = this.$el.find(".csui-reorder-item");
      event.preventDefault();
      event.stopPropagation();
      this.dragSrcOrderId = parseInt(this.source.getAttribute("data-order-id"));
      this.dragTargetOrderId = parseInt(event.currentTarget.getAttribute("data-order-id"));

      if (this.source != event.currentTarget && this.isdraggable) {
        this.makeNewOrderIds(event.currentTarget);
        $(this.source).removeClass('dragStartClass');
        $(event.currentTarget).removeClass("over");
        this.reOrder(slidesOrder);
      } else {
        $(event.currentTarget).removeClass("over");
        $(this.source).removeClass('dragStartClass');
        return false;
      }
    },

    makeNewOrderIds: function (target) {
      this.source.setAttribute("data-order-id", this.dragTargetOrderId);
      target.setAttribute("data-order-id", this.dragTargetOrderId);
      this.nodes = this.$el.find('.csui-reorder-item');
      if (this.dragSrcOrderId < this.dragTargetOrderId) {       
        var i = this.collection.hasMaster ? this.dragSrcOrderId + 1 : this.dragSrcOrderId;
        for (i; i <= this.dragTargetOrderId; i++) {
          if (!this.collection.hasMaster && i === this.dragTargetOrderId) {
            break;
          }
          if (this.dragSrcOrderId === 0 && i == 1) {
            $(this.nodes[i]).find('.csui-order')[0].innerHTML = lang.MasterCompoundDocumentLabel;
            this.nodes[i].setAttribute("data-order-id", 0);
          } else {
            if (this.collection.hasMaster) {
              this.nodes[i].setAttribute("data-order-id", i - 1);
              $(this.nodes[i]).find('.csui-order')[0].innerHTML = i - 1;
            } else {
              this.nodes[i].setAttribute("data-order-id", i);
              $(this.nodes[i]).find('.csui-order')[0].innerHTML = i;
            }
          }
          this.source.setAttribute("data-order-id", this.dragTargetOrderId);
          $(this.source).find('.csui-order')[0].innerHTML = this.dragTargetOrderId;
        }
      } else {
       var j = this.collection.hasMaster ? this.dragTargetOrderId : this.dragTargetOrderId - 1;
        for (j; j < this.dragSrcOrderId; j++) {
          if (this.collection.hasMaster) {
            this.nodes[j].setAttribute("data-order-id", j + 1, { silent: true });
            $(this.nodes[j]).find('.csui-order')[0].innerHTML = j + 1;
          } else {
            this.nodes[j].setAttribute("data-order-id", j + 2, { silent: true });
            $(this.nodes[j]).find('.csui-order')[0].innerHTML = j + 2;
          }
          this.source.setAttribute("data-order-id", this.dragTargetOrderId);
          $(this.source).find('.csui-order')[0].innerHTML =
            this.dragTargetOrderId === 0 ? lang.MasterCompoundDocumentLabel : 
                                                     this.dragTargetOrderId;
        }
      }
    },
    
    reOrder: function (listItems) {
      var tempListItems = listItems;
      tempListItems = Array.prototype.slice.call(tempListItems, 0);
      tempListItems.sort(function (a, b) {
        return a.getAttribute("data-order-id") - b.getAttribute("data-order-id");
      });

      var parent = this.$el;
      parent.innerHTML = "";

      for (var i = 0, l = tempListItems.length; i < l; i++) {
        if (this.collection.hasMaster) {
          tempListItems[i].dataset.orderId = i;
        } else {
          tempListItems[i].dataset.orderId = i + 1;
        }
        parent[0].appendChild(tempListItems[i]);
      }
      this.makeNewOrderList(tempListItems);
      this.handleError(tempListItems);
    },

    handleError: function (tempListItems) {
      if (tempListItems.length) {
        var sidepanel = this.options.originatingView.options.sidePanel;
        $(tempListItems).removeClass('csui-unsupported-type');
        if (this.collection.hasMaster && _.contains([1, 2, 136], parseInt(tempListItems[0].getAttribute("data-type")))) {
          $(tempListItems[0]).addClass('csui-unsupported-type');
          sidepanel.footerView.$el.find('.csui-submit').length &&
              sidepanel.footerView.$el.find('.csui-submit').prop('disabled', true);
          this.showErrorMessage(true);
        } else {
          sidepanel.footerView.$el.find('.csui-submit').length && 
              sidepanel.footerView.$el.find('.csui-submit').removeAttr('disabled');
          this.showErrorMessage(false);
        }
      }
    },

    showErrorMessage: function (errorMsg) {
       var masterSwitchView = this.options.originatingView.reorganizeMasterSwitchView;
       if (errorMsg) {
          masterSwitchView.$el.addClass('csui-inlineform-group-error');
          masterSwitchView.$el.find('.csui-masterbtn-info').addClass('binf-hidden');
          masterSwitchView.$el.find('.binf-text-danger').removeClass('binf-hidden');
       } else {
          masterSwitchView.$el.removeClass('csui-inlineform-group-error');
          masterSwitchView.$el.find('.binf-text-danger').addClass('binf-hidden');
          masterSwitchView.$el.find('.csui-masterbtn-info').removeClass('binf-hidden');
       }
    },

    makeNewOrderList: function (orderedList) {
      this.collection.orderedList = _.map(orderedList, function (item) {
      var newOrder = item.getAttribute("data-order-id") === "0" ? 
                      lang.MasterCompoundDocumentLabel :  item.getAttribute("data-order-id");
        $(item).find('.csui-order')[0].innerHTML = newOrder;
       return {
          id: parseInt(item.getAttribute("id")),
          order: parseInt(item.getAttribute("data-order-id"))
        };
      });
    },

    handleDragEnd: function (event) {
      event.preventDefault();
      $(event.currentTarget).removeClass("over");
      $(this.source).removeClass('dragStartClass');
      this.removeDragline();
      $(this.ghostElem).remove();
      $(this.dragEmptyEl).remove();
    },

    onKeyInView: function (event) {
      var focusables = this.$el.find('.csui-reorder-item');
      var isMac = base.isMacintosh(),
      keyCode = event.keyCode;
      if ((isMac && event.metaKey && !event.ctrlKey || !isMac && !event.metaKey &&
        event.ctrlKey) ) {

        event.preventDefault();
        event.stopPropagation();

        if (keyCode === 88) {
          this.handleDragStart(event);
        }
        else if (keyCode === 86 && !!this.source) {
          this.handleDrop(event);
          $(focusables).removeClass('active');
          $(this.source).addClass('active');
          $(this.source).trigger('focus');
        }
      } else if (focusables.length) {
        if (keyCode === 38) {
          this.focusIndex > 0 && --this.focusIndex;
          $(focusables).removeClass('active');
          $(focusables[this.focusIndex]).addClass('active');
          $(focusables[this.focusIndex]).trigger('focus');
          event.preventDefault();
          event.stopPropagation();
        } else if (keyCode === 40) {
          this.focusIndex < (focusables.length - 1) && ++this.focusIndex;
          $(focusables).removeClass('active');
          $(focusables[this.focusIndex]).addClass('active');
          $(focusables[this.focusIndex]).trigger('focus');
          event.preventDefault();
          event.stopPropagation();
        } else if (keyCode === 9) {
          $(focusables).removeClass('active');
          if (event.shiftKey) {
            $(this.options.originatingView.$el.find('input')).trigger('focus');
          } else {
            $(this.options.options.sidePanel.$el.find('.cs-footer-btn')[0]).trigger('focus');
          }
          event.preventDefault();
          event.stopPropagation();
        }
      }
    }

  });
  return ReorganizeListView;
});