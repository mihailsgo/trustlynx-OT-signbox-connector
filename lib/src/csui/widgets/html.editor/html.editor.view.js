/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/handlebars',
  'csui/lib/marionette',
  'csui/models/node/node.model',
  'csui/models/node.children2/node.children2',
  'csui/utils/contexts/factories/node',
  'csui/utils/commands',
  'csui/controls/tile/tile.view',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/widgets/html.editor/impl/html.editor.content.view',
  'hbs!csui/widgets/html.editor/impl/html.editor.wrapper.template',
  'i18n!csui/widgets/html.editor/impl/nls/lang'
], function (_, $, Handlebars, Marionette, NodeModel, NodeChildren2Collection, NodeModelFactory, commands, TileView, PerfectScrollingBehavior,
    TabableRegionBehavior, DefaultActionBehavior, HtmlEditorContentView, template, lang) {

  var HtmlEditorTileView = TileView.extend({

    constructor: function HtmlEditorTileView(options) {
      options || (options = {});
      options.icon = 'cs-wiki-icon-wiki';
      this.context = options.context;
      options.id = 'csui-html-tile-wrapper-' + options.wikiPageId;

      TileView.prototype.constructor.call(this, options);

      options = options.data ? _.extend(options, options.data) : options;
      this.options = options;
      this.options.parentView = this;
      this.contentViewOptions = this.options;
    },

    contentView: HtmlEditorContentView,
    contentViewOptions: function () {
      _.extend(this.options, {parentView: this});
    },

    onShow: function () {
      this.$el.addClass(
          'cui-rich-editor-widget-wrapper cui-rich-editor-widget-wrapper-' +
          this.options.wikiPageId);
    }

  });

  var HtmlEditorWidgetView = Marionette.CompositeView.extend({
    tagName: 'div',

    className: 'csui-html-editor-grand-parent',

    templateHelpers: function () {
      return {};
    },

    template: template,

    ui: {
      editIcon: '.tile-controls',
      contentAreaLinks: '.csui-html-editor-wrapper a'
    },

    events: {
      'keydown': 'onKeyInView',
      'click @ui.contentAreaLinks': 'onClickLink'
    },

    constructor: function HtmlEditorWidgetView(options) {
      options = options || {};
      options.data || (options.data = {});
      _.extend(options, options.data);
      options.wikiPageId = options.wikipageid || options.id;
      options.id = "csui-html-editor-grand-parent-" + options.wikiPageId;
      options.title = options.titlefield || options.title;
      options.header = !!options.title;
      options.scrollableParent = !!options.header ? '.tile-content' :
                                 '.csui-html-editor-wrapper-parent';
      this.context = options.context;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
    },

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: function () {
          return this.options.scrollableParent;
        },
        suppressScrollX: true
      },
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      },
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      },
    },
    onClickLink: function(event){
      var target = !!$(event.target).attr('href') ? $(event.target) : $(event.target).parents('a');
      if (!!target[0] && !!target.attr('href')) {
        this._handleClickLink({
          event: event,
          connector: this.options.model.connector,
          callingViewInstance: this
        });
      }
    },
    _handleClickLink: function (args) {
      var node;
      var target = !!$(args.event.target).attr("href") ? $(args.event.target) :
                   $(args.event.target).parents('a'),
          that = args.callingViewInstance,
          self = this,
          hrefValue = target.attr("href") ? target.attr("href") : "";
        if(this.htmlEditorContentView && this.htmlEditorContentView.mode === 'read'){
           if (!!hrefValue.match(/^.*\/open|Open\/(.+)$/)) {
            args.event.stopPropagation();
            args.event.preventDefault();
            if (hrefValue.indexOf("open/") !== -1 || hrefValue.indexOf("Open/") !== -1) {
              var nodeId = hrefValue.substring(
                  hrefValue.lastIndexOf("/") + 1,
                  hrefValue.length);
              if(nodeId.match(/^[0-9]+$/)) {
                node = this.getNewNodeModel({
                  attributes: {
                    id: parseInt(hrefValue.substring(
                        hrefValue.lastIndexOf("/") + 1,
                        hrefValue.length), 10)
                  },
                  connector: args.connector
                });
                node.fetch()
                    .done(function () {
                      that.triggerMethod("execute:defaultAction", node);
                    }).fail(function (xhr, status, text) {
                  window.location.href = hrefValue;
                });
              } else {
                this.updateAjaxCall({
                  url: args.connector.getConnectionUrl().getApiBase("v2")+"/wiki/nickname/"+nodeId+"?actions=open&fields=properties",
                  connector: args.connector,
                  view: args.callingViewInstance,
                  type: "GET"
                }).done(function(response){
                  node = self.getNewNodeModel({},{connector: args.connector});
                  node.attributes = node.parse(response);
                  node = self.getNewNodeModel({attributes: node.attributes},{connector: args.connector});
                  that.triggerMethod("execute:defaultAction", node);
                }).fail(function(){
                  window.location.href = hrefValue;
                });
              }
            }
          } else if (!!hrefValue.match(/^.*\/wiki\/[0-9]+\/(.+)$/) ||
                    !!hrefValue.match(/^.*\/wiki\/[0-9]+$/)) {
            var wikipage;
            args.event.stopPropagation();
            args.event.preventDefault();
          if (!!hrefValue.match(/^.*\/wiki\/[0-9]+\/(.+)$/)) {
              wikipage = decodeURIComponent(hrefValue.substring(
                  hrefValue.lastIndexOf("/") + 1,
                  hrefValue.length));
            } else if (!!hrefValue.match(/^.*\/wiki\/[0-9]+$/)) {
              var url = decodeURIComponent(hrefValue.substring(0,
                  hrefValue.lastIndexOf("/") - 5));
              wikipage = decodeURIComponent(url.substring(
                  url.lastIndexOf("/") + 1,
                  url.length));
            }
            this.updateAjaxCall({
              url:  args.connector.getConnectionUrl().getApiBase("v2")+"/wiki/"+this.options.wikiid+"/wikipages",
              connector: args.connector,
              view: args.callingViewInstance,
              type: "GET"
            }).done(function(response){
              node = response.results.find(function (element) {
                if (element.name === wikipage) {
                  return element;
                }
              });
              if (!!node) {
                node = self.getNewNodeModel({
                  attributes: node,
                  connector: args.connector
                });
                node.fetch()
                    .done(function () {
                      args.callingViewInstance.triggerMethod("execute:defaultAction", node);
                    }).fail(function (xhr, status, text) {
                      window.location.href = hrefValue;
                });
              } else {
                window.location.href = hrefValue;
              }
            }).fail(function(){
              window.location.href = hrefValue;
            });

          } else if (!!hrefValue.match(/^.*objId\=(.+)$/)) {
            args.event.stopPropagation();
            args.event.preventDefault();
            var objIdIndex = hrefValue.indexOf("objId=");
            if (objIdIndex !== -1) {
              node = this.getNewNodeModel({
                attributes: {
                  id: parseInt(hrefValue.substring(objIdIndex + 6,
                      (hrefValue.substring(objIdIndex + 1,
                          hrefValue.length).indexOf('&') + objIdIndex + 1)), 10)
                },
                connector: args.connector
              });
              node.fetch()
                  .done(function () {
                    args.callingViewInstance.triggerMethod("execute:defaultAction", node);
                  }).fail(function (xhr, status, text) {
                window.location.href = hrefValue;
              });
            }
          } else if (!!hrefValue.match(/^.*\/app\/nodes\/(.+)$/)) {
            args.event.stopPropagation();
            args.event.preventDefault();
            if (hrefValue.indexOf("nodes/") !== -1) {
              node = this.getNewNodeModel({
                attributes: {
                  id: parseInt(hrefValue.substring(
                      hrefValue.lastIndexOf("/") + 1,
                      hrefValue.length), 10)
                },
                connector: args.connector
              });
              node.fetch().done(function () {
                that.triggerMethod("execute:defaultAction", node);
              }).fail(function (xhr, status, text) {
                window.location.href = hrefValue;
              });
            }
          }
        }
    },
    updateAjaxCall: function (args) {
      var deferred    = $.Deferred(),
          url         = args.url,
          data        = args.data,
          type        = args.type,
          connector   = args.connector;
      this.ajaxRequest = $.ajax(connector.extendAjaxOptions({
        url: url,
        type: type,
        data: data,
        contentType: false,
        crossDomain: true,
        processData: false,
        success: function (response, status, jXHR) {
          deferred.resolve(response);
        },
        error: function (xhr, status, text) {
          deferred.reject();
        }
      }));
      return deferred.promise();
    },
    currentlyFocusedElement: function () {
      if (!!this.htmlEditorContentView.dropdownMenu &&
          !this.htmlEditorContentView.dropdownMenu.haveEditPermissions) {
        return this.htmlEditorContentView.$el.find('a:first');
      } else {
        return this.$el.find('.csui-html-editor-dropdown .csui-html-editor-control');
      }
    },
    getNewNodeModel: function (options) {
      return new NodeModel(options.attributes, {
        connector: options.connector,
        commands: commands.getAllSignatures(),
        fields: options.fields || {},
        expand: options.expand || {}
      });
    },

    onKeyInView: function (event) {
      if (this.htmlEditorContentView.mode === 'read') {
        this.htmlEditorContentView.moveTab(event);
      }
    },

    onRender: function (e) {
      var that = this;
      this.getWikiDetails().done(function() {
        var _htmlView;
        that.options.autosaveInterval = 60000;
        if (that.options.header === undefined || that.options.header) { // with header
          _htmlView = new HtmlEditorTileView(that.options);
          that.listenToOnce(_htmlView, 'show', _.bind(function () {
            that.htmlEditorContentView = _htmlView.getChildView('content');
          }, that));
        } else { // without header
          that.options.parentView = that;
          _htmlView = new HtmlEditorContentView(that.options);
          that.htmlEditorContentView = _htmlView;
        }
  
        new Marionette.Region({
          el: that.$el.find(".csui-html-editor-wrapper-parent")
        }).show(_htmlView);
        that._triggerView = that;
  
        that
            .listenTo(that.htmlEditorContentView, 'refresh:tabindexes', _.bind(function () {
              that.trigger('refresh:tabindexes');
            }, that))
            .listenTo(that.htmlEditorContentView, 'updateScrollbar', _.bind(function () {
              that.trigger('dom:refresh');
            }, that));
      });
    },

    getWikiDetails: function() {    
      var model = this.options.context.getModel(NodeModelFactory),
      isInBws = !!model.get('data') && !!model.get('data').bwsinfo && !!model.get('data').bwsinfo.id, 
      that = this,
      deferred = $.Deferred(),
      wiki, wikiPage, mainPageId; 
      if ( !isInBws || !!this.options.data.wikicontainerid || !!this.options.data.wikitemplateid ) { 
        deferred.resolve();
      }
      else {
        model = model.get('type') === 848 ? model : new NodeModel({id: model.get('data').bwsinfo.id}, {connector: model.connector});
        var children = this.getChildren( model, 5573, ['id', 'main_page_id'] );
        children.fetch().done(function () {  
          wiki = children.length > 0 ? children.models[0] : undefined;
          if( !!wiki ) {
            mainPageId = wiki.get('main_page_id');
            if( !!mainPageId ) {
              that.options.wikiid = wiki.get('id');
              that.options.wikiPageid = mainPageId;
              that.options.wikiPageId = mainPageId;
              deferred.resolve();
            }
            else {
              var wikiChildren = that.getChildren( wiki, 5574, ['id'] );
              wikiChildren.fetch().done(function () {
                wikiPage = wikiChildren.length > 0 ? wikiChildren.models[0] : undefined;
                if( !!wikiPage ) {
                  that.options.wikiid = wiki.get('id');
                  that.options.wikiPageid = wikiPage.get('id');
                  that.options.wikiPageId = wikiPage.get('id');
                }
                deferred.resolve();
              });
            }  
          }
          else {
            deferred.resolve(); 
          }
        });           
      }
      return deferred.promise();
    },

    getChildren: function( parentNode, childType, properties ) {
      var children = new NodeChildren2Collection({}, _.defaults({
        top: 1,
        autoreset: true,
        fields: {
          properties: properties
        },
        delayRestCommands: false,
        orderBy: "create_date",
        filter: {type: childType}
      },
      {node: parentNode}
      ));

      return children;
    }

  });
  return HtmlEditorWidgetView;
});
