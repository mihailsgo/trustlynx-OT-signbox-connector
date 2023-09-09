/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette', 'csui/utils/url',
  'csui/utils/contexts/factories/connector',
  'csui/utils/nodesprites', 'csui/controls/node-type.icon/node-type.icon.view',
  'csui/behaviors/default.action/default.action.behavior',
  'hbs!xecmpf/utils/document.thumbnail/impl/document.thumbnail',
  'i18n!xecmpf/utils/document.thumbnail/impl/nls/lang',
  'css!xecmpf/utils/document.thumbnail/impl/document.thumbnail'
], function (_, $, Marionette, Url,
    ConnectorFactory, NodeSpriteCollection, NodeTypeIconView, DefaultActionBehavior,
    template, lang) {

  var DocumentThumbnailView = Marionette.ItemView.extend({

    className: function () {
      var className = 'xecmpf-document-thumbnail';
      if (this.noAccessToItem) {
        className += ' no-contents-permission';
      }
      return className;
    },

    constructor: function DocumentThumbnailView(options) {
      options || (options = {});
      options.model || (options.model = options.node);
      if ( options.model.get('actions').length === 0 ) {
        this.noAccessToItem = true;
      }
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      if (!this.model) {
        throw new Error('node is missing in the constructor options.');
      }
    },

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },

    template: template,

    templateHelpers: function () {
      return {
        title: this.options.title || lang.open,
        document_name:lang.toOpen + this.options.model.get('name'),
        enableCaption: this.options.enableCaption
      };
    },

    ui: {
      thumbnailNotLoadedEl: '.thumbnail_not_loaded',
      imgEl: '.img-doc-preview',
      iconEl: '.csui-type-icon',
      buttonToHide:'.document-thumbnail-wrapper > button'
    },
    
    events:{
        'keydown .thumbnail_not_loaded': function(event){
            if (event.keyCode === 13 || event.keyCode === 32){
            var activeEl = this.$el.find(document.activeElement);
			$(activeEl).trigger("click");
            }
        },
        'keydown button.wrapper': function(event){
            if (event.keyCode === 13 || event.keyCode === 32){
            var activeEl = this.$el.find(document.activeElement);
			$(activeEl).trigger("click");
            }
        }
        
    },

    _showThumbnail: function () {
      var loadUrl = Url.combine(this.model.connector.connection.url, '/nodes',
                      this.model.get('id'), 'thumbnails/medium/content'),
          that = this, url;

      this.ui.thumbnailNotLoadedEl
          .addClass('thumbnail_empty')
          .removeClass('binf-hidden thumbnail_missing');
      this.ui.imgEl.addClass('binf-hidden');

      if (!that.noAccessToItem) {
        this.model.connector
          .makeAjaxCall({ url: loadUrl, dataType: 'binary' })
          .then(function (response) {
            if(!that.isDestroyed){
              that.url = url = URL.createObjectURL(response);
              that.ui.imgEl.one('error', function () {
                that.addMissingThumbnailClass();
              });
  
              that.ui.imgEl
                .attr('src', url)
                .one('load', function (evt) {
                  if (evt.target.clientHeight >= evt.target.clientWidth) {
                    that.ui.imgEl.addClass('cs-form-img-vertical');
                  } else {
                    that.ui.imgEl.addClass('cs-form-img-horizontal');
                  }
                  that.ui.thumbnailNotLoadedEl.addClass('binf-hidden');
                  that.ui.imgEl
                      .removeClass('binf-hidden')
                      .addClass('cs-form-img-border');
                });

              that._attachDefaultAction();
            }
          },function () {
            if(!that.isDestroyed){
              that._attachDefaultAction();
              that.addMissingThumbnailClass();
            }
          });
      } else {
        that.addMissingThumbnailClass();
      }      
    },
    _attachDefaultAction: function(){
      var that = this;
      this.ui.imgEl.parent().parent().on('click', function () {
        var args = {
          model: that.model,
          abortDefaultAction: false
        };
        that.triggerMethod('before:defaultAction', args);
        if (args.abortDefaultAction === false) {
          that.triggerMethod('execute:DefaultAction', that.model);
        }
        that.triggerMethod('after:defaultAction', args);
      });
    },
    addMissingThumbnailClass: function () {
      var className = NodeSpriteCollection.findClassByNode(this.model) || 'thumbnail_missing';
      this.ui.thumbnailNotLoadedEl.removeClass('binf-hidden thumbnail_empty').addClass(className);
      this.ui.imgEl.addClass('binf-hidden');
      this.ui.buttonToHide.addClass('binf-hidden');
    },
    _renderNodeTypeIconView: function () {
      this._nodeIconView = new NodeTypeIconView({
        el: this.ui.iconEl,
        node: this.model
      });
      this._nodeIconView.render();
    },

    onRender: function () {
      this._renderNodeTypeIconView();
      this._showThumbnail();
    },

    onBeforeDestroy: function () {
      if (this._nodeIconView) {this._nodeIconView.destroy();}
      if (this.url) {URL.revokeObjectURL(this.url);}
    }
  });

  return DocumentThumbnailView;
});
