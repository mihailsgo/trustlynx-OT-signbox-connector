/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/lib/handlebars',
  'csui/utils/base',
  'csui/utils/url',
  'csui/utils/log',
  'csui/controls/tile/behaviors/infinite.scrolling.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/typeaheadpicker/impl/typeaheaditem.view',
  'i18n!csui/controls/typeaheadpicker/nls/typeaheadpicker.lang',
  'hbs!csui/controls/typeaheadpicker/impl/typeaheadpicker',
  'css!csui/controls/typeaheadpicker/impl/typeaheadpicker',
  'css!csui/controls/form/impl/fields/typeaheadfield/typeaheadfield',
  'csui/lib/bootstrap3-typeahead',
  'csui/lib/jquery.when.all'
], function (module, _, $, Backbone, Marionette, Handlebars,
    Base, Url, Log,
    InfiniteScrollingBehavior,
    TabableRegionBehavior, TypeaheadItemView,
    lang, template) {

  var log = new Log(module.id);

  function logargs() {
    var obj = {
      args: arguments,
      toString:function(){
        var args = Array.prototype.slice.apply(this.args);
        args[2] = args[2]&&args[2][0]||"undefined";
        return args.join(" ");
      }
    };
    log.debug(obj) && console.log(log.last);
  }
  function setupInfiniteScrollingSupport() {
    this.$el.on('keydown', $.proxy(function(e){
      function handleKey() {
        if (e.shiftKey) {
          return;
        }
        if (this.context && this.context.shown) {
          if (this.scrollByKey && this.scrollByKey.fetching) {
            return;
          }
          var scrollByKey = this.scrollByKey = { keyEvent: e };
          var mmhandler = $.proxy(function(e){
            if (this.scrollByKey && this.scrollByKey===scrollByKey) {
              delete this.scrollByKey;
            }
          }, this );
          this.$el.one("mousemove",mmhandler);
          setTimeout(function(){
            this.$el.off("mousemove",mmhandler);
            if (this.scrollByKey && this.scrollByKey===scrollByKey) {
              delete this.scrollByKey;
            }
          }.bind(this),30);
          return true;
        }
      }
      switch (e.keyCode) {
        case 34: // page down
          handleKey.call(this);
          break;

        case 35: // last pos
          handleKey.call(this);
          break;

        case 40: // down arrow
          handleKey.call(this);
          break;
      }
    }, this ));
    this.listenTo(this,'before:collection:scroll:fetch',function(){
      if (this.scrollByKey) {
        this.scrollByKey = _.extend( { fetching: true }, _.pick( this.scrollByKey, "keyEvent" ) );
      }
    });
    this.listenTo(this,'collection:scroll:fetch',function(){
      var typeahead = this.context;
      if (typeahead) {
        var scrollTop = typeahead.$scrollContainer.scrollTop();
        var active = typeahead.$menu.find('.binf-active');
        var index = typeahead.$menu.find('li').index(active);
        var keyEvent = this.scrollByKey && this.scrollByKey.keyEvent;
        delete this.scrollByKey;
        typeahead.process(this.collection.models);
        if (index>=0) {
          typeahead.$menu.find('.binf-active').removeClass('binf-active');
          active = $(typeahead.$menu.find('li')[index]).addClass('binf-active');
        }
        if (active.length) {
          typeahead.scrollIntoView(active,keyEvent);
        }
        if (scrollTop>typeahead.$scrollContainer.scrollTop()) {
          typeahead.$scrollContainer.scrollTop(scrollTop);
        }
      }
    });
    this.listenTo(this,'collection:scroll:fetch:error',function(){
      delete this.scrollByKey;
    });
  }

  function getForm() {
    var scrollSelector = this.ui.searchbox.closest('.csui-perfect-scrolling').length > 0 ?
        '.csui-perfect-scrolling' : '.csui-normal-scrolling'; //.csui-normal-scrolling for touch devices
    var form = this.ui.searchbox.closest(scrollSelector);
    if (form.length<=0) {
      form = this.ui.searchbox.closest('.alpaca-field');
    }
    return form;
  }

  function adjustUndelayed(form) {
    var adjust = form.length > 0 ? this.options.enableInfiniteScrolling : this.options.scrollContainerHeight==="auto";
    return adjust;
  }
  var TypeaheadPickerView = Marionette.LayoutView.extend({

    template: template,

    templateHelpers: function () {
      var id2Use = this.options.id_input && this.options.id_input.length > 0 ?
                   this.options.id_input : _.uniqueId('csui-typeaheadpicker-input');
      return {
        placeholder: this.options.placeholder,
        id_input: id2Use,
        ariaLabel: this.options.ariaLabel || this.options.placeholder,
        idBtnDescription: this.options.descriptionId,
        titleClearIcon: this.options.titleClearIcon || lang.titleClearIcon,
        titleSearchIcon: this.options.titleSearchIcon || lang.titleSearchIcon,
        isRequired: this.options.isRequired,
        classItemPicker: this.options.css && this.options.css.itemPicker || 'csui-control-typeaheadpicker'
      };
    },

    ui: {
      itempicker: 'div.cs-item-picker',
      searchbox: 'input.typeahead',
      searchicon: '.typeahead.cs-search-icon',
      searchclear: '.typeahead.cs-search-clear'
    },

    behaviors: function () {
      return {
        InfiniteScrolling: {
          behaviorClass: InfiniteScrollingBehavior,
          contentParent: function(){
            var typeahead = this.context;
            if (typeahead) {
              return typeahead.$scrollContainer;
            }
          },
          content: function(){
            var typeahead = this.context;
            if (typeahead) {
              if (typeahead.$scrollContainer[0]===typeahead.$menu[0]) {
                return typeahead.$menu.find("li");
              } else {
                return typeahead.$menu;
              }
            }
          },
          bindEvent: function(){
            return this.options.enableInfiniteScrolling ? 'typeahead:picker:open' : 'none';
          },
          unbindEvent: function(){
            return this.options.enableInfiniteScrolling ? 'typeahead:picker:before:open before:destroy' : 'none';
          },
          fetchMoreItemsThreshold: function() { return this.options.fetchMoreItemsThreshold; }
        },
        TabableRegionBehavior: {
          behaviorClass: TabableRegionBehavior
        }
      };
    },

    currentlyFocusedElement: function (options) {
      if (!!this.ui.searchclear && $(this.ui.searchclear).is(':visible') && options &&
          options.shiftKey) {
        return this.ui.searchclear;
      } else {
        return this.ui.searchbox;
      }
    },

    triggers: {
      'click @ui.searchbox': 'click',
      'click @ui.searchicon': 'click'
    },

    events: {
      'keyup @ui.searchbox': 'onKeyUp',
      'keydown @ui.searchbox': 'onKeyDown',
      'click @ui.searchclear': 'onClickClear',
      'keydown @ui.searchclear': 'onClickClear',
      'dragstart .typeahead.binf-dropdown-menu li > a': 'onDragItem'
    },

    constructor: function TypeaheadPickerView(options) {
      options || (options = {});

      if (options.css && options.css.root) {
        this.className = options.css.root;
      }

      this.pickerListId = _.uniqueId('pickerList');
      if (!options.collection) {
        throw new Error('Collection is missing in the constructor options.');
      }
      (options.placeholder !== undefined) || (options.placeholder = lang.placeholderDefault);
      options.clearOnSelect || (options.clearOnSelect = false);
      options.items || (options.items = 'all');
      options.delay || (options.delay = 200);
      options.disabledMessage || (options.disabledMessage = '');
      options.prettyScrolling || (options.prettyScrolling = false);
      options.fetchMoreItemsThreshold || (options.fetchMoreItemsThreshold = 95);
      if (!options.model) {
        options.model = new options.collection.model(undefined, {connector: options.collection.connector});
      }
      Marionette.LayoutView.prototype.constructor.call(this, options);

      if (this.options.enableInfiniteScrolling) {
        setupInfiniteScrollingSupport.call(this);
      }
    },

    onRender: function () {
      $(this.ui.searchicon).on("click", _.bind(this.onClickIcon, this));
      var emptyTemplate = Handlebars.compile(
        '<li role="option" id="noResults" title="{{langNoResults}}" class="csui-typeahead-picker-no-results{{#if classNoResults}} {{classNoResults}}{{/if}}">{{langNoResults}}</li>'
          )({
        classNoResults: this.options.css && this.options.css.noResults,
        langNoResults: lang.noResults
      });
      var self = this;
      var source = sequencing(function(query,callback,options){
          log.debug('typeaheadPickerView._retrieveItems "{0}"',query) && console.log(log.last);
          if (self.context && options && options.more) {
            var deferred = $.Deferred();
            var collection = self.collection;
            collection.setSkip(collection.length, false);
            collection.fetch({
              reset: false,
              remove: false,
              merge: false,
            }).then(function () {
              deferred.resolve(self.collection.models);
            },
            function(error) {
              deferred.reject(error);
            });
            return deferred.promise();
          }
          return self._retrieveItems.apply(self,arguments);
        },function(pending,ok,results) {
          if (pending.length<=1) {
            logargs("sqcb true:",pending.length,pending[0]);
            return true;
          } else if (ok===undefined) {
            logargs("sqcb undefined:",pending.length,pending[pending.length-1]);
            return undefined;
          } else {
            logargs("sqcb reject:",pending.length,pending[0]);
            return $.Deferred().reject().promise();
          }
        }
      );
      var typeaheadOptions = {
        items: this.options.items,
        delay: this.options.delay,
        collection: this.collection,
        autoSelect: false,
        matcher: this._matchItems,
        sorter: this._sortItems,
        source: source,
        displayText: _.bind(this._retrieveDisplayText, this),
        highlighter: _.bind(this._renderHighlighter, this),
        afterSelect: _.bind(this._afterSelect, this),
        nextHighlighter: _.bind(this._nextHighlighter, this),
        accessibility: _.bind(this._accessibility, this),
        pickerListId: this.pickerListId,
        currentHighlighter: _.bind(this._currentHighlighter, this),
        prettyScrolling: this.options.prettyScrolling,
        appendTo: this.ui.itempicker,
        handleNoResults: true,
        emptyTemplate: emptyTemplate,
        beforeShow: _.bind(this._beforePositioning, this),
        afterShow: _.bind(this._positionContainer, this),
        blur: this._blur
      };
      if (this.options.scrollContainerHeight) {
        typeaheadOptions.scrollContainerHeight = this.options.scrollContainerHeight;
      }
      if (this.options.typeaheadOptions) {
        typeaheadOptions = $.extend(typeaheadOptions,this.options.typeaheadOptions);
      }
      if (!this.options.useScrollContainer) {
        if (!$.isFunction($.fn.perfectScrollbar) || !this.options.prettyScrolling) {
          typeaheadOptions.scrollContainer = null;
        }
      }
      if (this.options.enableInfiniteScrolling) {
        typeaheadOptions.showMore = function() {
          function isComplete() {
            var collection = self.collection;
            var collectionComplete = collection.totalCount!=null && collection.length>=collection.totalCount;
            if (collection.totalCount==null) {
              collectionComplete = collection.length===0 ? collection.fetched : collection.length<collection.topCount;
            }
            return collectionComplete;
          }
          return !isComplete();
        };
      }
      this.typeaheadOptions = typeaheadOptions;
      this.ui.searchbox.typeahead(typeaheadOptions);
      var typeahead = this.context = this.ui.searchbox.data('typeahead');
      if (typeahead.prettyScrolling) {
        typeahead.$scrollContainer.addClass("csui-perfect-scrolling csui-no-scroll-x");
      } else {
        typeahead.$scrollContainer.addClass("csui-normal-scrolling csui-no-scroll-x");
      }
      if (this.model.get(this.model.idAttribute||'id')) {
        this.ui.searchbox.val(Base.formatMemberName(this.model));
      }
      this.updateStyles();
    },

    onKeyUp: function (e) {
      this.updateStyles();
      if (this.ui.searchbox.val() === "") {
        if (e.keyCode !== 9 && e.keyCode !== 13 && e.keyCode !== 16 && e.keyCode !== 38 && e.keyCode !== 40) {
          log.debug('typeaheadPickerView.onKeyUp empty') && console.log(log.last);
          this.trigger('item:clear');
          this.ui.searchbox.removeAttr('aria-activedescendant');
        } else {
          log.debug('typeaheadPickerView.onKeyUp key skipped') && console.log(log.last);
        }
      } else {
        log.debug('typeaheadPickerView.onKeyUp value') && console.log(log.last);
      }
    },

    onClickIcon: function () {
      if (!this.options || !this.options.showAllOnClickIcon) {
        if (!this.context || !this.context.$scrollContainer.is(":visible")) {
          log.debug('typeaheadPickerView.onClickIcon lookup matching') && console.log(log.last);
          this.ui.searchbox[0].focus();
          this.ui.searchbox.select();
          this.ui.searchbox.typeahead('lookup');
        } else {
          log.debug('typeaheadPickerView.onClickIcon lookup skipped') && console.log(log.last);
        }
      } else {
        if (!this.context || !this.context.$scrollContainer.is(":visible") || this.query!=='') {
          log.debug('typeaheadPickerView.onClickIcon lookup all') && console.log(log.last);
          this.ui.searchbox[0].focus();
          this.ui.searchbox.select();
          this.ui.searchbox.typeahead('lookup','');
        } else {
          log.debug('typeaheadPickerView.onClickIcon lookup all skipped') && console.log(log.last);
        }
      }
    },

    onKeyDown: function (e) {
      if (e.keyCode === 9 && $(this.ui.searchclear).is(":visible")) {
        if (e.shiftKey) {
          this.updateStyles();
          this.ui.searchbox.typeahead('hide');
        } else {
          e.preventDefault();
          e.stopPropagation();
          this.ui.searchclear[0].focus();
        }
      }
    },

    onClickClear: function (event) {
      if (event.type === "click" || event.keyCode === 13) {
        log.debug('typeaheadPickerView.onClickClear clicked') && console.log(log.last);
        this.ui.searchbox.val('');
        this.updateStyles();
        this.trigger('item:clear');
        this.ui.searchbox.removeAttr('aria-activedescendant');
        this.ui.searchbox.typeahead('hide');
        this.ui.searchbox[0].focus();
      } else if (event.keyCode === 9 && $(this.ui.searchclear).is(":visible")) {
        log.debug('typeaheadPickerView.onClickClear tabbed') && console.log(log.last);
        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          this.ui.searchbox[0].focus();
        } else {
          this.updateStyles();
          this.ui.searchbox.typeahead('hide');
        }
      } else {
        log.debug('typeaheadPickerView.onClickClear skipped') && console.log(log.last);
      }
    },

    onDragItem: function (e) {
      return false;
    },
    updateStyles: function () {
      var clear = this.ui.searchbox.val() && this.ui.searchbox.val().length > 0;
      this.ui.searchclear.css({
        'display': clear ? '' : 'none'
      });
    },
    _retrieveItems: function (query) {
      this.query = query;
      if (this.options.onRetrieveItems) {
        return this.options.onRetrieveItems(this.collection,query);
      } else {
        var collection = this.collection;
        var deferred = $.Deferred();
        var fetch = false;
        if (collection.setFilter(_.object([this.model.nameAttribute||'name'],[query]),{fetch:false})) {
          fetch = true;
        } else if (this.options && this.options.typeaheadOptions && this.options.typeaheadOptions.minLength===0) {
          fetch = !this.filled;
        }
        if (fetch) {
          this.options.enableInfiniteScrolling && collection.setSkip(0,false);
          collection.fetch({reset:true}).then(_.bind(function(){
            this.filled = true;
            deferred.resolve(collection.models);
          },this),function() {
            deferred.reject();
          });
        } else {
          deferred.resolve(collection.models);
        }
        return deferred.promise();
      }
    },

    _retrieveDisplayText: function (item) {
      return item.get(this.model.nameAttribute||'name');
    },

    _renderHighlighter: function (item) {
      var model      = this.collection.findWhere(_.object([this.model.nameAttribute||'name'],[item]));
      var PickerItemView = this.options.TypeaheadItemView ? this.options.TypeaheadItemView(model) : TypeaheadItemView;
      var view = new PickerItemView(_.extend({
        model: model,
        connector: this.collection.connector,
        disabledMessage: this.options.disabledMessage,
        lightWeight: this.options.lightWeight
      },this.options.itemOptions||{}));
      return view.render().el;
    },

    _matchItems: function (item) {

      if (this.options.onMatchItems) {
        return this.options.matchItems(this.collection,item);
      } else {
        return true;
      }
    },

    _sortItems: function (items) {
      return items;
    },

    _afterSelect: function (item) {
      var val = this.options.clearOnSelect ? '' : Base.formatMemberName(item);
      log.debug('typeaheadPickerView._afterSelect {0}',val) && console.log(log.last);
      this.ui.searchbox.val(val);
      this.updateStyles();
      this.trigger('item:change', {item: item});
    },
    _currentHighlighter: function (item) {
      return;
    },
    _nextHighlighter: function (item) {
      return;
    },

    _accessibility: function (item) {
      this.ui.searchbox.attr('aria-activedescendant', item.attr(this.model.idAttribute||'id'));
      return;
    },

    _blur: function () {
      if (!this.$element.is(':focus')) {
        this.focused = false;
      }
      if (!this.mousedover && this.shown) {
        this.hide();
      }
    },

    _beforePositioning: function (context) {  //prevent the visibility of position adjustment
      var form  = getForm.call(this);
      if (form.length > 0) {
        if (context.$appendTo) {
          context.$appendTo.addClass('csui-transparent');
        }
      }
      this.context = context;
      this.trigger("typeahead:picker:before:open");
      var adjustImmediately = adjustUndelayed.call(this,form);
      if (adjustImmediately) {
        context.$scrollContainer.css({
          "max-height": "",
          "display": "",
          "position": "",
          "right": "",
          "top": "",
          "bottom": "",
          "left": ""
        });
      }
    },

    _positionContainer: function (context) {
      log.debug('typeaheadPickerView._positionContainer "{0}"',context.query) && console.log(log.last);
      if (context.query.length<context.options.minLength) {
        context.hide();
        return;
      }
      var controlTop = 0, formTop = 0, formHeight = 0;
      var form  = getForm.call(this);
      var contextHeight = context.$scrollContainer.children(
          'ul.typeahead.binf-dropdown-menu').height();

      this.ui.searchbox.attr('aria-controls', this.pickerListId);
      this.ui.itempicker.attr('aria-expanded', true);

      this.context = context;
      context.$element.addClass('cs-typeaheadfield-height');
      if (form.length > 0) {
        formTop = form.offset().top;
        formHeight = form.height();
        controlTop = context.$element.offset().top;
        if (formTop < 0) {
          formTop = -1 * formTop;
        }

        if (context.prettyScrolling) {
          if ((controlTop - formTop) > (formHeight + formTop - controlTop)) {
            if (controlTop > 0 && context.$scrollContainer.height() >
                                  controlTop - form.offset().top) {
              context.$element.css("overflow", "hidden");
              context.$element.perfectScrollbar({suppressScrollX: true});
            }
          }
        }
      }

      var adjustImmediately = adjustUndelayed.call(this,form);
      if (adjustImmediately) {

        if (!(this.options.enableInfiniteScrolling && this.options.items>0)) {
          context.$scrollContainer.css("height", "auto");
        }

        Base.adjustDropDownField(context.$element, context.$scrollContainer, form.length>0, this,
            this.hideItemPicker, context.$scrollContainer);

        if (form.length<=0) {
          context.$scrollContainer.css({
            "display": "",
            "position": "",
            "right": "",
            "top": "",
            "bottom": "",
            "left": ""
          });
        }

        context.prettyScrolling && context.$scrollContainer.perfectScrollbar("update");
        context.$appendTo && context.$appendTo.removeClass('csui-transparent');

      } else if (form.length > 0) {

        if (contextHeight < 450) {
          context.$scrollContainer.children('ul.typeahead.binf-dropdown-menu')
              .append($("<li role='none' aria-hidden='true' class='picker-spacer'>spacer</li>"));
        }
        context.$scrollContainer.css("height", "auto");
        setTimeout(function () {
          context.$scrollContainer.scrollTop(0);
          context.$scrollContainer.children('ul.typeahead.binf-dropdown-menu').find(
              ".picker-spacer").remove();

          var inputEle = context.$element;
          Base.adjustDropDownField(inputEle, context.$scrollContainer, true, this,
              this.hideItemPicker, context.$scrollContainer);

          context.prettyScrolling && context.$scrollContainer.perfectScrollbar("update");
          if (context.$appendTo) {
            context.$appendTo.removeClass('csui-transparent');
          }
          this.trigger("typeahead:picker:open");
        }.bind(this), 0);

        return;
      }
      setTimeout(function(){
        this.trigger("typeahead:picker:open");
      }.bind(this), 0);
    },

    hideItemPicker: function (view) {
      view.context.hide();
      view.trigger("typeahead:picker:close");
      view.ui.searchbox.removeAttr('aria-controls');
      view.ui.itempicker.attr('aria-expanded', false);
    }

  });
  function sequencing(method,callback){

    var pending = [], last;

    function sequenced() {

      var self = this;

      function call() {
        var called;
        try {
          logargs("call:",pending.length,pending[0],args[0]);
          method.apply(self,args).then(resolve,reject);
          called = true;
        } finally {
          if (!called) {
            reject();
          }
        }
      }
      function check(){
        var called, checked = true;
        if (callback) {
          try {
            checked = callback(pending,this.ok,arguments);
            called = true;
          } finally {
            if (!called) {
              checked = $.Deferred().reject().promise();
            }
          }
        }
        if (checked===true || _.isArray(checked) || _.isArguments(checked)) {
          args = checked===true ? args : checked;
          if (this.ok===undefined && pending.length>1) {
            logargs("previous then call:",pending.length,pending[pending.length-1]);
            previous.then(call,call);
          } else {
            logargs("checked now call:",pending.length,pending[0]);
            call();
          }
        } else if (checked===false) {
          if (this.ok===undefined) {
            if (pending.length<=1) {
              resolve();
            } else {
              pending.pop();
              previous.then(deferred.resolve,deferred.reject);
            }
          } else {
            (this.ok?resolve:reject).apply(deferred,arguments);
          }
        } else if (checked && checked.then) {
          if (this.ok===undefined && pending.length>1) {
            pending.pop();
            previous.then(function(){
              checked.then(deferred.resolve,deferred.reject);
            },function(){
              checked.then(deferred.resolve,deferred.reject);
            });
          } else {
            checked.then(resolve,reject);
          }
        } else if (this.ok===undefined && checked===undefined && pending.length>1) {
          previous.then(check.bind({ok:true}),check.bind({ok:false}));
        } else {
          throw new Error("Invalid callback result!");
        }
      }

      function clean() {
        logargs("clean:",pending.length,pending[0],this.ok,arguments[0]&&arguments[0].length);
        pending.shift();
        if (pending.length===0) {
          last = undefined;
        }
        (this.ok?deferred.resolve:deferred.reject).apply(deferred,arguments);
      }

      var args = arguments;
      var deferred = $.Deferred();
      var promise = deferred.promise();
      var resolve = clean.bind({ok:true});
      var reject = clean.bind({ok:false});
      var previous = last;
      last = promise;
      pending.push(args);
      check.call({});
      return promise;
    }

    return sequenced;
  }

  return TypeaheadPickerView;

});
