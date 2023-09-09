/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/lib/jquery',
  'csui/utils/log',
  'csui/utils/url',
  'csui/utils/types/date',
  'csui/utils/nodesprites',
  'csui/utils/contexts/factories/node',
  'csui/utils/thumbnail/thumbnail.object',
  'csui/controls/toolbar/toolbar.command.controller',
  'csui/models/nodes',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/utils/commands',
  'csui/utils/commandhelper',
  'csui/controls/progressblocker/blocker',
  'i18n!csui/widgets/document.overview/impl/nls/lang',
  'csui/utils/contexts/factories/largefilesettings.factory',
  'csui/utils/contexts/factories/next.node',
  'hbs!csui/widgets/document.overview/impl/document.overview',
  'css!csui/widgets/document.overview/impl/document.overview'
], function (module, _, Marionette, $, log,
    Url,
    DateType,
    NodeSpriteCollection,
    NodeModelFactory, Thumbnail,
    ToolbarCommandController,
    NodeCollection,
    PerfectScrollingBehavior,
    commands, CommandHelper,
    BlockingView, lang, LargeFileSettingsFactory,
    NextNodeModelFactory, documentOverviewTemplate) {
  'use strict';

  log = log(module.id);

  var DocumentOverviewView = Marionette.ItemView.extend({
    className: 'cs-form csui-general-form cs-document-overview-wrapper',
    template: documentOverviewTemplate,
    templateHelpers: function () {
      var back_button    = true,
          mimeType       = NodeSpriteCollection.findTypeByNode(this.options.node),
          sizeValue      = this.options.node.get("size_formatted"),
          sizeFullValue  = this.options.node.get("size"),
          modifyDate     = DateType.formatExactDateTime(
              DateType.deserializeDate(this.options.node.get("modify_date"))),
          descValue      = this.options.node.get("description"),
          hasDescription = !!descValue,
          messages       = {
            unique: _.uniqueId('_doc'),
            lang: lang,
            back_button: back_button,
            mime_type: mimeType,
            has_description: hasDescription,
            size_value: sizeValue,
            size_full_value: sizeFullValue,
            modify_date: modifyDate,
            desc_value: descValue,
            type_label: lang.type,
            size_label: lang.size,
            modify_label: lang.modified,
            desc_label: lang.description,
            imgSrc: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
            imgAlt: lang.docPreviewImgAlt,
            goBackTitle: lang.goBackTitle,
            goBackAria: lang.goBackAria
          };
      return messages;
    },

    ui: {
      location: '.location-view',
      back: '.cs-go-back',
      titleContainer: '.title-container',
      commentButtonRegion: '.commentRegion',
      favoriteStarRegion: '.favoriteRegion',
      thumbnailContainer: '.thumbnail-container',
      modifySectionBtn: '.modified_section button',
      mimeTypeBtn: '.type_section button',
      sizeSectionBtn: '.size_section button',
      thumbnailImg: '.img-doc-preview',
      reserveInfo: '.reserve_info',
      reserveUser: '.csui-doc-overview-reserve-user',
      reserverBtn: '.csui-doc-overview-reserve-btn',
      createdBy: '.created_by_section .binf-col-sm-9',
      creadyByUser: '.csui-doc-overview-created-by-user',
      createdByPic: '.csui-doc-overview-created-by-pic',
      openBtn: '.open-btn',
      editBtn: '.edit-btn',
      downloadBtn: '.csui-doc-overview-download-btn'
    },

    events: {
      "click .command-btn": "_handleClickButton",
      "click .thumbnail_section": "_handleClickThumbnail",
      'click @ui.back': 'onBackButton',
      'keydown': 'onKeyInView'
    },

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: ".cs-content-container",
        suppressScrollX: true
      }
    },

    constructor: function DocumentOverviewView(options) {
      options || (options = {});
      BlockingView.imbue(this);
      options.data || (options.data = {});
      if (!options.node) {
        options.node = options.context.getModel(NodeModelFactory, {
          attributes: options.data.id && {id: options.data.id},
          temporary: true
        });
      }
      this.options = options;
      var viewStateModel = options.context && options.context.viewStateModel;
      this.back_button = viewStateModel && viewStateModel.hasRouted();
      this.largeFileSettingsFactory = this.options.context.getFactory(LargeFileSettingsFactory);
      this.largeFileSettingsModel = this.largeFileSettingsFactory && this.largeFileSettingsFactory.property;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.commandController = new ToolbarCommandController({
        commands: options.commands || commands
      });

      this.commands = this.commandController.commands;
      this.reloadWidget = false;
      this.parentNode = undefined;
      this.supportOriginatingView = true;

      this.listenTo(this.options.node, 'change', _.bind(this._handleNodeChange, this));
      this.listenTo(this, 'new:version:added', _.bind(this._handleVersionChange, this));
      this.listenTo(this.options.node, 'delete',  _.bind(this._navigateToParent, this));

      viewStateModel && this.listenTo(viewStateModel, "navigate", function (historyEntry) {
        if (historyEntry && !this.back_button) {
          this.ui.back.show();
        }
      });

      this.blockActions();
    },

    onRender: function () {
      this._showMetadataItemName();
      this._addCommentView();
      this._addFavoriteView();
      this._showThumbnail();
      this._addLocationView();
      this._showCreatedByUserName();
      this._showReserveRow();
      this._checkPermissions();
      if (!this.back_button) {
        this.ui.back.hide();
      }
    },

    _unblockActions: function () {
      this.unblockActions();
      this.$el.find('.cs-content-wrapper').removeClass('cs-content-overlay-wrapper');
    },

    onShow: function () {
      this.$el.addClass("adjust-scroll");
    },

    onDomRefresh: function () {
      this.metadataItemNameView && this.metadataItemNameView.triggerMethod('dom:refresh');
    },

    _isReserved: function () {
      return this.options.node.get('reserved') === true;
    },

    _showMetadataItemName: function () {

      require(['csui/widgets/metadata/impl/header/item.name/metadata.item.name.view'],
          _.bind(function (MetadataItemNameView) {

            if (this.metadataItemNameView) {
              this.metadataItemNameView.destroy();
            }

            this.metadataItemNameView = new MetadataItemNameView({
              model: this.options.node,
              container: this.options.node.parent,
              containerCollection: this.options.containerCollection,
              collection: this.options.collection,
              context: this.options.context,
              nameSchema: {},
              commands: this.commands,
              originatingView: this,
              showDropdownMenu: true,
              showPropertiesCommand: true,
              noMetadataNavigation: true
            });

            this.listenTo(this.metadataItemNameView, "metadata:item:name:save", this._saveItemName);
            var inv = this.metadataItemNameView.render();
            Marionette.triggerMethodOn(inv, "before:show", inv, this);
            this.ui.titleContainer.append(inv.el);
            Marionette.triggerMethodOn(inv, "show", inv, this);

          }, this));

    },

    _saveItemName: function (args) {
      var self = this,
          itemName = args.sender.getValue(),
          name = {name: itemName},
          model = args.sender && args.sender.model,
          node = this.options.model || this.options.node;

      model && model.changed.name_multilingual && _.extend(name, {
        name_multilingual: model.changed.name_multilingual,
      });

      node.setFields("versions.element(0)", "owner_id");
      var data = _.clone(node.attributes);
      return node
          .save(data, {
            data: name,
            wait: true,
            silent: true
          })
          .then(function () {
            node.fetch({silent: true}).done(function () {
              self._updateModifyDateAndTimeStamp();
              args.success();
              node.set(name, {silent: true});
            });
          })
          .fail(function (error) {
            args.error(error);
          });
    },

    _addCommentView: function () {
      require(['csui/controls/tableheader/comment/comment.button.view',
            'esoc/widgets/utils/commentdialog/commentdialog.view'],
          _.bind(function (CommentView) {
            var commentOptions = this.options;
            commentOptions.originatingView = this;
            commentOptions.model = this.options.node || this.options.model;
            var commentView = new CommentView(commentOptions);

            var commentRegion = new Marionette.Region({
              el: this.ui.commentButtonRegion
            });
            commentRegion.show(commentView);
            this._unblockActions();
          }, this));
    },

    _addFavoriteView: function () {
      require(['csui/widgets/favorites/favorite.star.view'],
          _.bind(function (FavoriteStarView) {
            var favoriteOptions = this.options;
            favoriteOptions.model = this.options.node || this.options.model;
            favoriteOptions.popoverAtBodyElement = true;
            var favoriteView = new FavoriteStarView(favoriteOptions);

            var favoriteRegion = new Marionette.Region({
              el: this.ui.favoriteStarRegion
            });
            favoriteRegion.show(favoriteView);
          }, this));
    },

    _updateFieldsToRefresh: function () {
      this._updateModifyDateAndTimeStamp();
      this._updateMimeType();
      this._updateSize();
      this._updateReserveField();
    },

    _handleNodeChange: function () {
      if (!!this.options.node.isReservedClicked || this.options.node.isUnreservedClicked) {
        this._updateReserveField();
        this._updateModifyDateAndTimeStamp();
        this.options.node.isReservedClicked = false;
        this.options.node.isUnreservedClicked = false;
      } else if (this.options.node.changed.csuiDelayedActionsRetrieved) {
        this.isReserved = false;
        this._updateReserveField();
        this._checkPermissions();
      }
      else {
        this._updateFieldsToRefresh();
      }
    },

    _handleVersionChange: function () {
      this.ui.thumbnailContainer.addClass("binf-hidden");
      this.$el.removeClass("cs-document-overview-wrapper-with-thumbnail");
    },

    _updateModifyDateAndTimeStamp: function () {
      var modifyBtnEle  = this.ui.modifySectionBtn,
          modifySpanEle = modifyBtnEle.find('span'),
          modifyDate    = DateType.formatExactDateTime(
              DateType.deserializeDate(this.options.node.get("modify_date")));

      if (modifySpanEle.text() != modifyDate) {
        modifyBtnEle.attr('aria-label', lang.modified + ':' + modifyDate);
        modifySpanEle.attr('title', modifyDate).text(modifyDate);
      }
    },

    _updateMimeType: function () {
      var mimeTypeBtnEle  = this.ui.mimeTypeBtn,
          mimeTypeSpanEle = mimeTypeBtnEle.find('span'),
          mimeType        = NodeSpriteCollection.findTypeByNode(this.options.node);

      if (mimeTypeSpanEle.text() != mimeType) {
        mimeTypeBtnEle.attr({
          'aria-label': lang.type + ':' + mimeType,
          'title': mimeType
        });
        mimeTypeSpanEle.text(mimeType);
      }
    },

    _updateSize: function () {
      var sizeBtnEle  = this.ui.sizeSectionBtn,
          sizeSpanEle = sizeBtnEle.find('span'),
          sizeFullVal = this.options.node.get('size'),
          sizeVal     = this.options.node.get('size_formatted');

      if (sizeSpanEle.text() != sizeVal) {
        sizeBtnEle.attr({
          'aria-label': lang.size + ':' + sizeVal,
          'title': sizeFullVal
        });
        sizeSpanEle.text(sizeVal);
      }
    },

    _showThumbnail: function () {
      this.thumbnail =
          this.options.thumbnail ||
          new Thumbnail({
            node: this.options.node
          });
      this.listenTo(this.thumbnail, "loadUrl", this._showImage);
      this.listenTo(this.thumbnail, "error", this._showDefaultImage);
      this.listenTo(this, "destroy", _.bind(this._destroyThumbnail, this));

      if (!this.thumbnailSet) {
        var self = this;
        this.thumbnailSet = true;
        if (this.thumbnail.hasOwnProperty("imgUrl") && !!this.thumbnail.imgUrl) {
          this._showImage();
        } else {
          this.thumbnail.loadUrl();
        }
      }
    },

    _showImage: function () {
      this.$el.addClass("cs-document-overview-wrapper-with-thumbnail");
      this.ui.thumbnailContainer.removeClass("binf-hidden");
      this.trigger("thumbnail:show:image");
      var self = this,
          img  = this.ui.thumbnailImg;
      img.attr("src", this.thumbnail.imgUrl);
      img.prop("tabindex", "0");
      img.one("load", function (evt) {
        if (evt.target.clientHeight >= evt.target.clientWidth) {
          img.addClass("cs-form-img-vertical");
        } else {
          img.addClass("cs-form-img-horizontal");
        }
        img.addClass("cs-form-img-border");
        img.removeClass("binf-hidden");
        var event = $.Event("tab:content:render");
        self.$el.trigger(event);
      });
    },

    _showDefaultImage: function (thumbnail, error) {
      log.warn(error.message);
    },

    _destroyThumbnail: function () {
      if (this.thumbnail) {
        this.thumbnail.destroy();
        this.thumbnail = undefined;
      }
      this.thumbnailSet = false;
    },

    _addLocationView: function () {
      var self           = this,
          renderLocation = function () {
            require(['csui/controls/table/cells/parent/parent.view'],
                _.bind(function (ParentCellView) {
                  var field = new ParentCellView({
                    model: self.options.node,
                    context: self.options.context,
                    nameEdit: false,
                    iconSize: 'contain',
                    el: self.$el.find(self.ui.location)
                  });
                  field.render();
                }, this));
          };

      if (!this.options.node.get("parent_id_expand")) {
        var node        = this.options.node,
            parent_id   = node.get('parent_id'),
            connector   = node.connector,
            fullUrl     = Url.combine(connector.getConnectionUrl().getApiBase('v2'),
                '/nodes/' + parent_id +
                '/properties'),
            ajaxOptions = {
              type: 'GET',
              url: fullUrl
            };

        connector
            .makeAjaxCall(ajaxOptions)
            .done(_.bind(function (resp) {
              node.set('parent_id_expand', resp.results.data.properties, {silent: true});
              renderLocation();
            }, this));
      } else {
        renderLocation();
      }
    },

    _showReserveRow: function () {
      this._updateReserveField();
    },

    _cleanAndInitReserveRow: function () {
      this.ui.reserveInfo.addClass('binf-hidden');
      this.reserveFieldView.$el.html();
      this.ui.reserveUser.html();
    },

    _updateReserveField: function () {
      var isNodeReserved = this._isReserved();
      if (isNodeReserved && !this.isReserved) {
        this.ui.reserveInfo.removeClass('binf-hidden');
        var opts = {
              context: this.options.context,
              tableView: this,
              model: this.options.node || this.options.model,
              reservedByLabel: lang.reservedByUnreserve
            },
            self = this;

        require(['csui/controls/node.state/impl/reservation/reservation.view'],
            function (ReserveFieldView) {
              self.reserveFieldView = new ReserveFieldView(opts);
              var reserveFieldRegion = new Marionette.Region({
                el: self.ui.reserverBtn
              });

              self.reserveFieldView.tagName = 'span';

              reserveFieldRegion.show(self.reserveFieldView);
              self.$el.find('li.csui-node-state-reservation').attr('role','none').find('button').removeAttr('tabindex');

              self._getUserField({
                userid: self.options.node.get('reserved_user_id'),
                placeholder: self.ui.reserveUser,
                showUserProfileLink: true
              });
              self.isReserved = true;
            });
      } else if (!isNodeReserved && !!this.isReserved) {
        this.reserveFieldView && this.reserveFieldView.destroy();
        this._cleanAndInitReserveRow();
        this.isReserved = false;
      }
    },

    _showCreatedByUserName: function () {
      var userOptions = {
        baseElement: this.ui.createdBy,
        userId: this.options.node.get("create_user_id")
      };
      this._showUserName(userOptions);
    },

    _showUserName: function (userOptions) {

      this._getUserField({
        userid: userOptions.userId,
        placeholder: this.ui.creadyByUser,
        showUserProfileLink: true
      });

      this._getUserField({
        userid: userOptions.userId,
        placeholder: this.ui.createdByPic,
        userWidgetWrapperClass: "",
        showUserWidgetFor: 'profilepic'
      });
    },

    _getUserField: function (userOptions) {
      require(['esoc/controls/userwidget/userwidget.view'],
          _.bind(function (UserWidgetView) {

            var userWidgetOptions = _.extend({
              context: this.options.context,
              showMiniProfile: true,
              connector: this.options.node.connector,
              imgSrc: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
            }, userOptions);

            var userwidgetview = new UserWidgetView(userWidgetOptions),
                contentRegion  = new Marionette.Region({
                  el: $(userOptions.placeholder)
                });
            contentRegion.show(userwidgetview);
          }, this));
    },
    _checkPermissions: function () {
      var editCmdOptions     = {
            'signature': 'Edit',
            'actionBtnEle': this.ui.editBtn
          },
          downloadCmdOptions = {
            'signature': 'Download',
            'actionBtnEle': this.ui.downloadBtn
          },
          openCmdOptions = {
            'signature': 'Open',
            'actionBtnEle': this.ui.openBtn
          };

      this._checkPermForOpenAction(openCmdOptions);
      this._checkPermForSpecificAction(editCmdOptions);
      this._checkPermForSpecificAction(downloadCmdOptions);
    },

    _checkPermForOpenAction: function (cmdOptions) {
      var command = this.commands.findWhere({signature: cmdOptions.signature});
      command.checkPermission(this.options.node).then(function (permitted) {
        if(!permitted) {
          cmdOptions.actionBtnEle.addClass('binf-hidden');
        } else {
          cmdOptions.actionBtnEle.removeClass('binf-hidden');
        }
      });
    },
    _checkPermForSpecificAction: function (cmdOptions) {
      var command = this.commands.findWhere({signature: cmdOptions.signature}),
          status  = {
            nodes: new NodeCollection([this.options.node]),
            container: this.options.node.parent
          },
          options = {
            context: this.options.context
          };

      if (!(command && command.enabled(status, options))) {
        cmdOptions.actionBtnEle.addClass("binf-hidden");
      } else {
        cmdOptions.actionBtnEle.removeClass("binf-hidden");
      }
    },

    onKeyInView: function (e) {
      var event = e || window.event;
      var target = event.target || event.srcElement;
      if (event.keyCode === 13 || event.keyCode === 32) {
        if (!(this.$el.find('.title-input').is(event.target))) {
          event.preventDefault();
          event.stopPropagation();
          $(target).trigger('click');
        }
      }
    },

    onBackButton: function () {
      if (!this.backButtonClicked) {
        var options = this.options,
            context = options && options.context,
            viewStateModel = context && context.viewStateModel;
        viewStateModel && viewStateModel.restoreLastFragment();
        this.backButtonClicked = true;
      }
    },

    _handleClickThumbnail: function (event) {
      event.stopImmediatePropagation();
      this._executeCommand("Open");
    },

    _handleClickButton: function (event) {
      event.stopImmediatePropagation();
      var signature = $(event.target).data("signature");
      this._executeCommand(signature);
    },

    _executeCommand: function (signature) {
      var command = this.commands.get(signature);
      var originatingView = this;
      originatingView.collection = new NodeCollection([this.options.node]);

      var status = {
        nodes: new NodeCollection([this.options.node]),
        container: this.options.node,
        originatingView: originatingView
      };
      var options = {
        context: this.options.context
      };

      try {
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        }

        var promise = command.execute(status, options);
        CommandHelper.handleExecutionResults(
            promise, {
              command: command,
              suppressSuccessMessage: status.suppressSuccessMessage,
              suppressFailMessage: status.suppressFailMessage
            });
      } catch (error) {
        log.warn(
            'Executing the command "{0}" failed.\n{1}',
            command.get("signature"),
            error.message
        ) && console.warn(log.last);
      }
    },

    _navigateToParent: function () {
      var parentId = this.options.model.get('parent_id');
      if (parentId) {
        this._setNextNodeModelFactory(parentId);
      } 
    },

    _setNextNodeModelFactory: function (id) {
      if (this.options.context && id !== undefined) {
        var nextNode = this.options.context.getModel(NextNodeModelFactory);
        if (nextNode) {
          if (nextNode.get('id') === id) {
            nextNode.unset('id', {silent: true});
          }
          nextNode.set('id', id);
        }
      }
    }

  });

  return DocumentOverviewView;

});
