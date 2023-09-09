/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/log',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/nodesprites',
  'csui/utils/url',
  'i18n!csui/controls/node-type.icon/impl/nls/lang',
  'hbs!csui/controls/node-type.icon/node-type.icon',
  'csui/controls/icons.v2',
  'css!csui/controls/node-type.icon/impl/node-type.icon.view',
  'csui/lib/jquery.binary.ajax',
  'csui/lib/handlebars.helpers.xif'
], function (module, _, $, Log, Backbone, Marionette,
    nodeSpriteCollection,
    Url,
    lang,
    template,
    iconRegistry
) {
  'use strict';

  var log = new Log(module.id);

  var config = module.config() || {};
  var excludedShortcutTypes = config.excludedShortcutTypes || [];
  if (!_.isArray(excludedShortcutTypes)) {
    excludedShortcutTypes = Array.prototype.concat.apply([], _.values(excludedShortcutTypes));
  }

  var NodeTypeIconModel = Backbone.Model.extend({
    constructor: function NodeTypeIconModel(attributes, options) {
      options || (options = {});
      this.node = options.node;
      this.options = options;

      this._useIconwithColorSchema = !!options.colorTheme;

      attributes || (attributes = {});
      _.extend(attributes, this._getAttributes());

      NodeTypeIconModel.__super__.constructor.call(this, attributes, options);

      this.listenTo(this.node, 'change:id', this._updateModelFromNode)
          .listenTo(this.node, 'change:type', this._updateModelFromNode)
          .listenTo(this.node, 'change:image_url', this._updateModelFromNode);
    },

    _getAttributes: function () {
      var node = this.node,
          original = node.original,
          exactNodeSprite = this.options.nodeSprite || nodeSpriteCollection.findByNode(node) || {},
          exactClassName = exactNodeSprite.get('className'),
          withColorSchemaIconName = exactNodeSprite.get('withColorSchemaIconName'),
          exactIconName = this._useIconwithColorSchema ?
                          (withColorSchemaIconName ? withColorSchemaIconName :
                           exactNodeSprite.get('iconName')) :
                          exactNodeSprite.get('iconName'),
          mainClassName = exactClassName,
          mainIconName = exactIconName,
          displayThumbnail = this.options.displayThumbnailIcon !== false,
          overlayClassNames = [],
          overlayIconNames = [];
      var mimeTypeFromNodeSprite;
      if (exactNodeSprite.attributes) {
        mimeTypeFromNodeSprite = exactNodeSprite.get('mimeType');
      }
      var title = mimeTypeFromNodeSprite || node.get("type_name") || node.get("type");

      if (original && original.get('id') && _.indexOf(excludedShortcutTypes, node.get("type")) ===
          -1) {
        var originalNodeSprite = nodeSpriteCollection.findByNode(original) || {};
        mainClassName = originalNodeSprite.get('className');
        withColorSchemaIconName = originalNodeSprite.get('withColorSchemaIconName');
        mainIconName = this._useIconwithColorSchema ?
                       (withColorSchemaIconName ? withColorSchemaIconName :
                        originalNodeSprite.get('iconName')) :
                       originalNodeSprite.get('iconName');

        overlayClassNames.push('csui-icon csui-icon-shortcut-overlay');
        if (this._useIconwithColorSchema) {
          overlayIconNames.push('csui_colorschema_shortcut-overlay');
        } else {
          overlayIconNames.push('csui_shortcut-overlay');
        }
        title = _.str.sformat(lang.shortcutTypeLabel,
            originalNodeSprite.get('mimeType') || original.get("type_name") ||
            lang.nodeTypeUnknown);
      }

      var attributes = {
        imageUrl:  displayThumbnail && node.get(node.imageAttribute||"image_url"),
        title: title
      };
      _.extend(attributes, _.pick(this.options, 'size'));
      if (this._useIconwithColorSchema) {
        _.extend(attributes, _.pick(this.options, 'colorTheme'));
      } else {
        _.extend(attributes, _.pick(this.options, 'filter'));
      }
      if (this.options.selectable === false) {
        overlayIconNames.push('csui_nonselectable-overlay');
      }
      if (exactIconName) {
        attributes.iconName = exactIconName;
        if (mainIconName) {
          attributes.mainIconName = mainIconName;
        } else {
          attributes.mainClassName = mainClassName;
        }
        if (overlayIconNames.length > 0) {
          attributes.overlayIconNames = overlayIconNames;
        } else {
          attributes.overlayClassNames = overlayClassNames;
        }
      } else {
        attributes.className = exactClassName;
        attributes.mainClassName = mainClassName;
        attributes.overlayClassNames = overlayClassNames;
      }

      attributes.dummySrc = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

      return attributes;
    },

    _updateModelFromNode: function () {
      this.clear({silent: true});
      this.set(this._getAttributes());
    }
  });

  var NodeTypeIconView = Marionette.ItemView.extend({
    tagName: 'span',

    attributes: function () {
      var title = this.model.get('title');
      var cssClass = 'csui-icon-group';
      var size = this.model.get('size');
      if (size) {
        var sizeClass = iconRegistry.getClassForSize({size: size});
        cssClass += ' ' + sizeClass;
      }
      return {
        'class': cssClass,
        'title': title,
        'aria-label': title
      };
    },

    template: template,

    ui: {
      imageElement: '.csui-node-type-image',
      iconElement: '.csui-node-type-icon'
    },

    constructor: function NodeTypeIconView(options) {
      options || (options = {});
      if (!options.model) {
        this.ownModel = true;
        options.model = new NodeTypeIconModel(undefined, options);
      }

      NodeTypeIconView.__super__.constructor.call(this, options);
      if (options.el) {
        $(options.el).attr(_.result(this, 'attributes'));
      }

      this.listenTo(this.model, 'change', this.render);
    },

    attachElContent: function() {
      var result = Marionette.ItemView.prototype.attachElContent.apply(this,arguments);
      if (this.model.attributes.mainIconName) {
        this.$(".csui-icon-v2__"+this.model.attributes.mainIconName).addClass("csui-node-type-icon");
      }
      return result;
    },

    onRender: function () {
      this._updateTitle();
      if (this.ui.imageElement.length>0) {
        setImgUrl(this.ui.imageElement,this.model.attributes.imageUrl,this.model.node.connector).done(function(result){
          this.ui.imageElement.removeClass('binf-hidden');
          this.ui.iconElement.remove();
          this.ui.iconElement = $();
          if (result.objUrl) {
            if (this.objUrl) {
              URL.revokeObjectURL(this.objUrl);
            }
            this.objUrl = result.objUrl;
          }
        }.bind(this)).fail(function(){
          if (this.ui.iconElement.length>0) {
            this.ui.imageElement.remove();
            this.ui.imageElement = $();
          }
        }.bind(this));
      }
    },

    onDestroy: function () {
      if (this.ownModel) {
        this.model.stopListening();
      }
      if (this.objUrl) {
        URL.revokeObjectURL(this.objUrl);
      }
    },

    _updateTitle: function () {
      var title = this.model.get('title');
      this.$el
          .attr('title', title)
          .attr('aria-label', title);
    }
  });
  function setImgUrl(imageElement,imageUrl,connector) {

    function setSrc(deferred,result) {
      imageElement.on('load',function(){
        deferred.resolve(result);
      }).on('error',function(){
        deferred.reject({imgUrl:result.imgUrl});
      }).attr("src",result.objUrl||result.imgUrl);
      return deferred.promise();
    }
    var deferred = $.Deferred();
    deferred.fail(function(result){
      if (result.imgUrl) {
        var logurl = result.imgUrl.length>200 ? result.imgUrl.substring(0,200)+"..." : result.imgUrl;
        log.error("error loading image: {0}",logurl) && console.log(log.last);
      }
    });
    if (imageUrl) {
      if (imageUrl.lastIndexOf('data:',0)!==0 && connector) {
        var connectionUrl = connector.getConnectionUrl();
        var useAjax;
        if (new Url(imageUrl).isAbsolute()) {
          useAjax = imageUrl.lastIndexOf(connectionUrl.getCgiScript(),0)===0;
        } else if (imageUrl.lastIndexOf('/',0)===0) {
          imageUrl = Url.combine(connectionUrl.getOrigin(), imageUrl);
        } else {
          useAjax = true;
          imageUrl = Url.combine(connectionUrl.getCgiScript(), imageUrl);
        }
        if (useAjax) {
          var getImageOptions = {
            url: imageUrl,
            dataType: 'binary',
            connection: connector.connection
          };
          connector.makeAjaxCall(getImageOptions)
            .always(function (response, statusText, jqxhr) {
              if (jqxhr.status === 200) {
                setSrc(deferred,{imgUrl:imageUrl,objUrl:URL.createObjectURL(response)});
              } else {
                deferred.reject({imgUrl:imageUrl});
              }
            });
          return deferred.promise();
        }
      }
      return setSrc(deferred,{imgUrl:imageUrl});
    }
    return deferred.reject({imgUrl:imageUrl}).promise();

  }

  return NodeTypeIconView;
});
