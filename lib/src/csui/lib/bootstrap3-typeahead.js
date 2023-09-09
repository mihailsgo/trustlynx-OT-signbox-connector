/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

/* =============================================================
 * bootstrap3-typeahead.js v3.1.0
 * https://github.com/bassjobsen/Bootstrap-3-Typeahead
 * =============================================================
 * Original written by @mdo and @fat
 * =============================================================
 * Copyright 2014 Bass Jobsen @bassjobsen
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */

/* =============================================================
 * Changes:
 *  - changed 'jquery' constant to 'csui/lib/jquery'.
 *  - changed 'worker' to handle 'source' functions returning a promise.
 *  - changed 'show' to support perfect-scrollbar in case the plugin is
 *    available and it is configured to use. Therefore additional library
 *    options are introduced
 *     - prettyScrolling: Flag whether to render a perfect-scrollbar or not.
 *     - scrollContainer: The perfect-scrollbar container element.
 *     - scrollContainerHeight: The maximum height of the scroll container.
 *     - currentHighlighter : to handle actions on current active element.
 *     - nextHighlighter : to handle actions on next active element.
 */

define(['csui/lib/jquery'], function ($) {
  'use strict';
  // jshint laxcomma: true

  /* TYPEAHEAD PUBLIC CLASS DEFINITION
   * ================================= */

  var Typeahead = function (element, options) {
    this.$element = $(element);
    this.scrollContainerHeight = !!options.scrollContainerHeight;
    this.options = $.extend({}, $.fn.typeahead.defaults, options);
    this.matcher = this.options.matcher || this.matcher;
    this.sorter = this.options.sorter || this.sorter;
    this.select = this.options.select || this.select;
    this.autoSelect = typeof this.options.autoSelect == 'boolean' ? this.options.autoSelect : true;
    this.highlighter = this.options.highlighter || this.highlighter;
    this.render = this.options.render || this.render;
    this.updater = this.options.updater || this.updater;
    this.displayText = this.options.displayText || this.displayText;
    this.source = this.options.source;
    this.delay = this.options.delay;
    this.$menu = $(this.options.menu);
    this.options.pickerListId && this.$menu.attr('id', options.pickerListId);
    this.options.pickerListClass && this.$menu.addClass(this.options.pickerListClass);
    this.$appendTo = this.options.appendTo ? $(this.options.appendTo) : null;
    this.shown = false;
    this.blur = this.options.blur || this.blur;
    this.focus = this.options.focus || this.focus;
    this.listen();
    this.showHintOnFocus = typeof this.options.showHintOnFocus == 'boolean' || this.options.showHintOnFocus === 'all' ? this.options.showHintOnFocus : false;
    this.afterSelect = this.options.afterSelect;
    this.currentHighlighter = this.options.currentHighlighter;
    this.nextHighlighter = this.options.nextHighlighter;
    this.accessibility = this.options.accessibility;
    this.addItem = false;
    // perfect-scrollbar support
    this.prettyScrolling = ($.isFunction($.fn.perfectScrollbar) && this.options.prettyScrolling);
    this.$scrollContainer = this.options.scrollContainer ? $(this.options.scrollContainer) : this.$menu;
    this.handleNoResults = !!this.options.handleNoResults;
    this.emptyTemplate = (!!this.handleNoResults && !!this.options.emptyTemplate) ?
                         this.options.emptyTemplate : "";
    if (this.handleNoResults) {
      this.dataFound = false;
    }
    if (this.options.showMore) {
      this.options.rollOver = false;
    }
  };

  Typeahead.prototype = {

    constructor: Typeahead,

    select: function () {
      var val = this.$menu.find('.binf-active').data('value');
      this.$element.data('active', val);
      if (this.autoSelect || val) {
        var newVal = this.updater(val);
        this.$element
            .val(this.displayText(newVal) || newVal)
            .trigger('change');
        this.afterSelect(newVal);
      }
      return this.hide();
    },

    updater: function (item) {
      return item;
    },

    setSource: function (source) {
      this.source = source;
    },

    show: function () {
      var pos = $.extend({}, this.$element.position(), {
        height: this.$element.outerHeight()
      }), scrollHeight;

      scrollHeight = typeof this.options.scrollHeight == 'function' ?
                     this.options.scrollHeight.call() :
                     this.options.scrollHeight;

        this.$appendTo = this.$appendTo
            ? this.$scrollContainer.appendTo(this.$appendTo)
            : this.$scrollContainer.insertAfter(this.$element);

      if (this.options.beforeShow) {
        this.options.beforeShow(this);
      }

      (this.$appendTo ? this.$menu.appendTo(this.$appendTo) : this.$menu.insertAfter(this.$element))
          .css({
            top: pos.top + pos.height + scrollHeight
            , left: pos.left
          })
          .show();

      if (this.$scrollContainer[0]!==this.$menu[0]) {
        this.$scrollContainer.show();
      }

      var scrollContainerHeight, scrollBorderPadding, scrollContentHeight;
      var heights = [], height;
      if (this.options.showMore && this.allItems) {
        // menu contains items for first page, use this as scroll container height.
        this.$scrollContainer.css("height","auto");
        this.scrollItemsHeight = this.$scrollContainer.outerHeight();
        this.$menu.html(this.allItems);
        delete this.allItems;
      }
      this.scrollItemsHeight && heights.push(this.scrollItemsHeight);

      if (this.scrollContainerHeight || !(this.options.showMore && this.options.items>0)) {
        scrollContainerHeight = isNaN(this.options.scrollContainerHeight) ? undefined : this.options.scrollContainerHeight-0;
        if (scrollContainerHeight) {
          heights.push(scrollContainerHeight);
        } else if (this.options.scrollContainerHeight!=="auto") {
          this.$scrollContainer.css("height", this.options.scrollContainerHeight);
          height = this.$scrollContainer.outerHeight();
        }
      }

      if (heights.length>0 || height) {
        scrollBorderPadding = this.$scrollContainer.outerHeight() - this.$scrollContainer.height();
        scrollContentHeight = contentHeight.call(this);
        heights.push(scrollContentHeight+scrollBorderPadding);
        scrollContainerHeight = heights.length===1 ? heights[0] : Math.min.apply(Math,heights);
        if (!height || scrollContainerHeight<height) {
          this.$scrollContainer.css("height", scrollContainerHeight);
        }
      }

      // perfect-scrollbar support
      var scrollYMarginOffset = this.prettyScrolling ? 15 : 0;
      if (this.prettyScrolling) {
        this.$scrollContainer.perfectScrollbar({
          suppressScrollX: true,
          scrollYMarginOffset: scrollYMarginOffset
        });
      }

      if (this.prettyScrolling || this.options.showMore) {
        !this.processMore && this.$scrollContainer.scrollTop(0);
      }

      this.shown = true;

      if (this.options.afterShow) {
        this.options.afterShow(this);
      }

      if (this.options.showMore) {
        scrollContentHeight = contentHeight.call(this);
        scrollContainerHeight = this.$scrollContainer.outerHeight();
        scrollBorderPadding = scrollContainerHeight - this.$scrollContainer.height();
        if (scrollContainerHeight-scrollBorderPadding+scrollYMarginOffset>=scrollContentHeight) {
          if (this.options.showMore && this.options.showMore()) {
            // force a scrollbar
            $('<li class="typeahead-force-scrollbar"></li>').appendTo(this.$menu).css({
              'background-color': 'transparent',
              'height': scrollYMarginOffset + 1
            });
            this.prettyScrolling && this.$scrollContainer.perfectScrollbar("update");
          }
        }
      }

      return this;
    },

    hide: function () {

      this.$scrollContainer.hide();
      if (this.$scrollContainer[0]!==this.$menu[0]) {
        this.$menu.hide();
      }
      this.shown = false;
      return this;
    },

    lookup: function (query) {
      if (typeof(query) != 'undefined' && query !== null) {
        this.query = query;
      } else {
        this.query = this.$element.val() || '';
      }

      if (this.query.length < this.options.minLength) {
        return this.shown ? this.hide() : this;
      }

      var worker = $.proxy(function () {
        var that = this;

        // don't call source callback with too short query, when user types fast.
        if (this.query.length < this.options.minLength) {
          return;
        }
        if ($.isFunction(this.source)) {
          $.when(this.source(this.query, $.proxy(this.process, this))).done(function (items) {
            that.process(items);
          });
        } else if (this.source) {
          this.process(this.source);
        }
      }, this);

      clearTimeout(this.lookupWorker);
      this.lookupWorker = setTimeout(worker, this.delay);
    },

    process: function (items) {
      this.dataFound = true;
      var that = this;

      items = $.grep(items, function (item) {
        return that.matcher(item);
      });
      if (items.length === 0 && this.handleNoResults) {
        this.dataFound = false;
        return this.renderNoResults().show();
      }

      items = this.sorter(items);

      if (!items.length && !this.options.addItem) {
        return this.shown ? this.hide() : this;
      }

      if (items.length > 0) {
        this.$element.data('active', items[0]);
      } else {
        this.$element.data('active', null);
      }

      // Add item
      if (this.options.addItem) {
        items.push(this.options.addItem);
      }

      if (this.options.items == 'all' || this.options.showMore) {
        return this.render(items).show();
      } else {
        return this.render(items.slice(0, this.options.items)).show();
      }
    },

    matcher: function (item) {
      var it = this.displayText(item);
      return ~it.toLowerCase().indexOf(this.query.toLowerCase());
    },

    sorter: function (items) {
      var beginswith        = []
          , caseSensitive   = []
          , caseInsensitive = []
          , item;

      while ((item = items.shift())) {
        var it = this.displayText(item);
        if (!it.toLowerCase().indexOf(this.query.toLowerCase())) {
          beginswith.push(item);
        } else if (~it.indexOf(this.query)) {
          caseSensitive.push(item);
        } else {
          caseInsensitive.push(item);
        }
      }

      return beginswith.concat(caseSensitive, caseInsensitive);
    },

    highlighter: function (item) {
      var html = $('<div></div>');
      var query = this.query;
      var i = item.toLowerCase().indexOf(query.toLowerCase());
      var len, leftPart, middlePart, rightPart, strong;
      len = query.length;
      if (len === 0) {
        return html.text(item).html();
      }
      while (i > -1) {
        leftPart = item.substr(0, i);
        middlePart = item.substr(i, len);
        rightPart = item.substr(i + len);
        strong = $('<strong></strong>').text(middlePart);
        html
            .append(document.createTextNode(leftPart))
            .append(strong);
        item = rightPart;
        i = item.toLowerCase().indexOf(query.toLowerCase());
      }
      return html.append(document.createTextNode(item)).html();
    },

    render: function (items) {
      var that = this;
      var self = this;
      var activeFound = false;
      var limited = [];
      items = $(items).map(function (i, item) {
        function create_item(){
          i = $(that.options.item).data('value', item);
          i.find('a').html(that.highlighter(text));
          i.attr("id", "user-item" + item.cid);
          if (text == self.$element.val()) {
            i.addClass('binf-active');
            self.$element.data('active', item);
            activeFound = true;
          }
        }
        var text = self.displayText(item);
        create_item();
        if (self.options.showMore && !self.scrollItemsHeight && self.options.items>0) {
          if (limited.length<self.options.items) {
            limited.push(i[0]);
            create_item();
          }
        }
        return i[0];
      });

      if (this.autoSelect && !activeFound) {
        items.first().addClass('binf-active');
        this.$element.data('active', items.first().data('value'));
      }
      if (this.options.items>0 && limited.length===this.options.items) {
        this.allItems = items;
        this.$menu.html(limited);
      } else {
        delete this.allItems;
        this.$menu.html(items);
      }
      this.nextHighlighter(items.first());
      return this;
    },

    renderNoResults: function () {
      this.$menu.html(this.emptyTemplate).addClass("csui-no-results-wrapper");
      return this;
    },

    displayText: function (item) {
      return item.name || item;
    },

    next: function (event) {
      var active = this.$menu.find('.binf-active')
          , next = active.next();

      if (!next.length) {
        if (active.length && !this.options.rollOver && this.shown) {
          return;
        }
        next = $(this.$menu.find('li')[0]);
      }

      active.removeClass('binf-active');
      this.currentHighlighter(active);
      this.accessibility && this.accessibility(next);
      next.addClass('binf-active');
      this.scrollIntoView(next[0],event);
      this.nextHighlighter(next);
    },

    prev: function (event) {
      var active = this.$menu.find('.binf-active')
          , prev = active.prev();

      if (!prev.length) {
        if (!this.options.rollOver) {
          return;
        }
        prev = this.$menu.find('li').last();
      }

      active.removeClass('binf-active');
      this.currentHighlighter(active);
      this.accessibility && this.accessibility(prev);
      prev.addClass('binf-active');
      this.scrollIntoView(prev[0],event);
      this.nextHighlighter(prev);
    },

    forward: function (event) {

      function nextPageIndex(menuItems,index) {
        if (index>=menuItems.length-1) {
          return undefined;
        }
        var top = topPos(menuItems,index);
        var scrollContainerHeight = this.$scrollContainer.height();
        for (var ii = index+1; ii<menuItems.length; ii++) {
          var bottom = bottomPos(menuItems,ii);
          if (bottom-scrollContainerHeight>top) {
            ii--;
            break;
          } else if (ii+1>=menuItems.length) {
            return undefined;
          } else if (bottom-scrollContainerHeight===top) {
            break;
          }
        }
        if (ii<=index) {
          ii = index + 1;
        }
        if (ii<menuItems.length) {
          return ii;
        }
        return undefined;
      }

      function checkForward(active,index) {
        var menuItems = this.$menu.find("li:not(.typeahead-force-scrollbar)");
        var newIndex = nextPageIndex.call(this,menuItems,index);
        if (newIndex==null) {
          if (this.options.showMore && this.options.showMore()) {
            if ($.isFunction(this.source)) {
              this.source(this.query,$.proxy(processForward, this, index),{more:true}).then(function (items) {
                processForward.call(this,index,items);
              }.bind(this));
              return;
            } else if (this.source) {
              processForward.call(this,index,this.source);
            }
            return;
          }
          newIndex = menuItems.length - 1;
        }
        jumpForward.call(this,active,$(menuItems[newIndex]));
      }

      function processForward(index,items) {
        this.processMore = true;
        this.process(items);
        delete this.processMore;
        checkForward.call(this,this.$menu.find('.binf-active'),index);
      }

      function jumpForward(active,forward) {
        active.removeClass('binf-active');
        this.currentHighlighter(active);
        this.accessibility && this.accessibility(forward);
        forward.addClass('binf-active');
        this.scrollIntoView(forward[0],event);
        this.nextHighlighter(forward);
      }

      var active = this.$menu.find('.binf-active');
      if (!active.length) {
        jumpForward.call(this,active,$(this.$menu.find('li')[0]));
      } else {
        checkForward.call(this,active,this.$menu.find('li').index(active));
      }
    },

    backward: function (event) {

      function prevPageIndex(menuItems,index) {
        if (index<=0) {
          return undefined;
        }
        var bottom = bottomPos(menuItems,index);
        var scrollContainerHeight = this.$scrollContainer.height();
        for (var ii = index-1; ii>=0; ii--) {
          var top = topPos(menuItems,ii);
          if (bottom-scrollContainerHeight>top) {
            ii++;
            break;
          } else if (bottom-scrollContainerHeight===top) {
            break;
          }
        }
        if (ii>=index) {
          ii = index - 1;
        }
        if (ii>=0) {
          return ii;
        }
        return undefined;
      }

      var active = this.$menu.find('.binf-active');
      var backward;

      if (!active.length) {
        return;
      } else {
        var menuItems = this.$menu.find("li:not(.typeahead-force-scrollbar)");
        var index = menuItems.index(active);
        var newIndex = prevPageIndex.call(this,menuItems,index);
        if (newIndex==null) {
          newIndex = 0;
        }
        backward = $(menuItems[newIndex]);
      }

      active.removeClass('binf-active');
      this.currentHighlighter(active);
      this.accessibility && this.accessibility(backward);
      backward.addClass('binf-active');
      this.scrollIntoView(backward[0],event);
      this.nextHighlighter(backward);
    },

    first: function (event) {
      var active = this.$menu.find('.binf-active');
      var first = this.$menu.find('li').first();
      active.removeClass('binf-active');
      this.currentHighlighter(active);
      this.accessibility && this.accessibility(first);
      first.addClass('binf-active');
      this.scrollIntoView(first,event);
      this.nextHighlighter(first);
    },

    last: function (event) {
      var active = this.$menu.find('.binf-active');
      var last = this.$menu.find('li').last();
      active.removeClass('binf-active');
      this.currentHighlighter(active);
      this.accessibility && this.accessibility(last);
      last.addClass('binf-active');
      this.scrollIntoView(last,event);
      this.nextHighlighter(last);
    },

    listen: function () {
      this.$element
          .on('focus', $.proxy(this.focus, this))
          .on('blur', $.proxy(this.blur, this))
          .on('keypress', $.proxy(this.keypress, this))
          .on('keyup', $.proxy(this.keyup, this));

      if (this.eventSupported('keydown')) {
        this.$element.on('keydown', $.proxy(this.keydown, this));
      }

      this.$menu
          .on('click', $.proxy(this.click, this))
          .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
          .on('mouseleave', 'li', $.proxy(this.mouseleave, this));
    },

    destroy: function () {
      this.$element.data('typeahead', null);
      this.$element.data('active', null);
      this.$element
          .off('focus')
          .off('blur')
          .off('keypress')
          .off('keyup');

      if (this.eventSupported('keydown')) {
        this.$element.off('keydown');
      }

      this.$menu.remove();
    },

    eventSupported: function (eventName) {
      var isSupported = eventName in this.$element;
      if (!isSupported) {
        this.$element.setAttribute(eventName, 'return;');
        isSupported = typeof this.$element[eventName] === 'function';
      }
      return isSupported;
    },

    move: function (e) {
      function handleKey() {
        if (!this.shown) {
          return;
        }
        
        // up arrow with the shiftKey (this is actually the left parenthesis)
        // down arrow with the shiftKey (this is actually the right parenthesis)
        if (e.shiftKey) {
          return;
        }
        e.preventDefault();
        return true;
      }

      switch (e.keyCode) {
      case 9: // tab
      case 13: // enter
      case 27: // escape
        this.shown && e.preventDefault();
        break;

      case 33: // page up
        handleKey.call(this) && this.backward(e);
        break;

      case 34: // page down
        handleKey.call(this) && this.forward(e);
        break;

      case 35: // last pos
        if (e.ctrlKey) {
          !this.shown && e.preventDefault();
          handleKey.call(this) && this.last(e);
        }
        break;

      case 36: // first pos
        if (e.ctrlKey) {
          !this.shown && e.preventDefault();
          handleKey.call(this) && this.first(e);
        }
        break;

      case 38: // up arrow
        handleKey.call(this) && this.prev(e);
        break;

      case 40: // down arrow
        handleKey.call(this) && this.next(e);
        break;
      }
    },

    keydown: function (e) {
      this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40, 38, 33, 34, 35, 36, 9, 13, 27]);
      if (!this.shown && e.keyCode == 40) {
        this.lookup();
      } else {
        this.move(e);
      }
    },

    keypress: function (e) {
      if (this.suppressKeyPressRepeat) {
        return;
      }
      this.move(e);
    },

    keyup: function (e) {
      switch (e.keyCode) {
      case 40: // down arrow
      case 39: // arrow right : Fix LPAD-95055 : with each ARROW RIGHT the user list flickers and the query is executed again
      case 38: // up arrow
      case 37: // arrow left : Fix LPAD-95055 : with each ARROW LEFT the user list flickers and the query is executed again
      case 36: // first pos
      case 35: // last pos
      case 34: // page down
      case 33: // page up
      case 16: // shift
      case 17: // ctrl
      case 18: // alt
        break;

      case 9: // tab
      case 13: // enter
        if (!this.shown) {
          return;
        }
        if (this.handleNoResults && !this.dataFound) {
          return;
        }
        this.select();
        break;

      case 27: // escape
        if (!this.shown) {
          return;
        }
        this.hide();
        break;
      case 116: // Refresh/F5. suppress menu being displayed in oversize.
      case 113: // F2 restricts to open dropdown
        return;
      default:
        this.lookup();
      }

      e.preventDefault();
    },

    focus: function (e) {    
      if (!this.focused) {
        this.focused = true;
        if (this.options.showHintOnFocus && this.skipShowHintOnFocus !== true) {
            if (this.options.showHintOnFocus === 'all') {
                this.lookup('');
            } else {
                this.lookup();
            }
        }
    }
    if (this.skipShowHintOnFocus) {
        this.skipShowHintOnFocus = false;
    }
    },

    blur: function (e) {
      this.focused = false;
      if (!this.mousedover && this.shown) {
        this.hide();
      }
    },

    click: function (e) {
      e.preventDefault();
      if(!!this.dataFound) {
        var clicked = (e.target && e.target.nodeName==="LI") ? e.target : $(e.target).parentsUntil(this.$menu,"li")[0];
        if (clicked) {
          this.currentHighlighter(this.$menu.find('.binf-active'));
          this.$menu.find('.binf-active').removeClass('binf-active');
          $(clicked).addClass('binf-active');
          this.nextHighlighter(this.$menu.find('.binf-active'));
        }
        this.skipShowHintOnFocus = true;
        this.select();
       this.$element[0].focus();
      } else {
        this.hide();
      }
    },

    mouseenter: function (e) {
      this.mousedover = true;
      if (this.scrollByKey) {
        // skip, if mouseenter is generated by a keyboard scroll.
        delete this.scrollByKey;
      } else {
        this.currentHighlighter(this.$menu.find('.binf-active'));
        this.$menu.find('.binf-active').removeClass('binf-active');
        $(e.currentTarget).addClass('binf-active');
        this.nextHighlighter(this.$menu.find('.binf-active'));
      }
    },

    mouseleave: function (e) {
      this.mousedover = false;
      if (!this.focused && this.shown) {
        this.hide();
      }
    },

    /**
     * scroll item into viewable area. if event is passed scroll is handled as triggered by keyboard.
     *
     * @param {*} item (mandatory) item to scroll into view
     * @param {*} keyEvent (optional) event used as marker to handle this scroll as tribbered by keyboard
     */
    scrollIntoView: function (item,keyEvent) {
      var currentItem         = this.$menu.find(item),
          parentScrollElement = this.$scrollContainer,
          currentItemHeight   = currentItem.outerHeight(),
          parentBorderTop     = parentScrollElement[0].clientTop,
          parentPaddingTop    = parseFloat(parentScrollElement.css("padding-top").replace('px',''))||0,
          parentSpaceTop      = parentBorderTop + parentPaddingTop,
          offSetVariation     = currentItem.offset().top - parentScrollElement.offset().top - parentSpaceTop,
          menuScrollTop       = parentScrollElement.scrollTop(),
          menuScrollHeight    = parentScrollElement.height();

      if (keyEvent) {
        var scrollByKey = this.scrollByKey = { keyEvent: keyEvent };
        setTimeout(function(){
          if (this.scrollByKey && this.scrollByKey===scrollByKey) {
            // autodelete keyEvent after timeout, to ensure clean-up, if mouseenter event is not triggered.
            delete this.scrollByKey;
          }
        }.bind(this),30);
      }

      // scroll more than needed to get some space between last item and bottom
      var offset = scrollMore(currentItem);
      if (offSetVariation < 0) {
        parentScrollElement.scrollTop(menuScrollTop + offSetVariation);
      } else if (offSetVariation + currentItemHeight + offset > menuScrollHeight) {
        parentScrollElement.scrollTop(
            menuScrollTop + offSetVariation + offset + currentItemHeight - menuScrollHeight
        );
      }
    }

  };

  function topPos(menuItems,index) {
    var top = $(menuItems[index]).offset().top + $(menuItems[index]).outerHeight() - scrollMore(menuItems[index]);
    return top;
  }

  function bottomPos(menuItems,index) {
    var bottom = $(menuItems[index]).offset().top + $(menuItems[index]).outerHeight();
    if (index+1<menuItems.length) {
      bottom += scrollMore(menuItems[index+1]);
    }
    return bottom;
  }
  function scrollMore(menuItem) {
    var outerHeight = $(menuItem).outerHeight();
    return Math.min(Math.max(2*$(menuItem).height()-outerHeight,0.4*outerHeight),32);
  }

  function contentHeight() {
    var sum;
    if (this.$scrollContainer[0]===this.$menu[0]) {
      sum = 0;
      this.$menu.find("li:not(.typeahead-force-scrollbar)").each(function (ix,el) {
        sum += $(el).outerHeight();
      });
    } else {
      sum = this.$menu.outerHeight() - (this.$menu.find("li.typeahead-force-scrollbar").outerHeight()||0);
    }
    return sum;
  }


  /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

  var old = $.fn.typeahead;

  $.fn.typeahead = function (option) {
    var arg = arguments;
    if (typeof option == 'string' && option == 'getActive') {
      return this.data('active');
    }
    return this.each(function () {
      var $this     = $(this)
          , data    = $this.data('typeahead')
          , options = typeof option == 'object' && option;
      if (!data) {
        $this.data('typeahead', (data = new Typeahead(this, options)));
      }
      if (typeof option == 'string') {
        if (arg.length > 1) {
          data[option].apply(data, Array.prototype.slice.call(arg, 1));
        } else {
          data[option]();
        }
      }
    });
  };

  $.fn.typeahead.defaults = {
    source: []
    , items: 8
    , menu: '<ul class="typeahead binf-dropdown-menu" role="listbox" id="user-picker-ul"></ul>'
    , item: '<li role="option"><a href="#"></a></li>'
    , minLength: 1
    , scrollHeight: 0
    , autoSelect: true
    , afterSelect: $.noop
    , currentHighlighter: $.noop
    , nextHighlighter: $.noop
    , addItem: false
    , delay: 0
    // implement perfect-scrollbar support
    , prettyScrolling: false
    , scrollContainer: '<div class="typeahead scroll-container"></div>'
    , scrollContainerHeight: 320
    , rollOver: true
  };

  $.fn.typeahead.Constructor = Typeahead;

  /* TYPEAHEAD NO CONFLICT
   * =================== */

  $.fn.typeahead.noConflict = function () {
    $.fn.typeahead = old;
    return this;
  };

  /* TYPEAHEAD DATA-API
   * ================== */

  $(document).on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
    var $this = $(this);
    if ($this.data('typeahead')) {
      return;
    }
    $this.typeahead($this.data());
  });

});
