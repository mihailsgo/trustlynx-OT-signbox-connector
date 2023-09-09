/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
    'module', 'csui/lib/underscore',
    'csui/lib/marionette',
    'csui/lib/jquery',
    'csui/utils/log',
    'csui/utils/contexts/factories/version',
    'csui/utils/commands/versions',
    'csui/utils/base',
    'csui/utils/thumbnail/thumbnail.object',
    'csui/widgets/document.overview/document.overview.view',
    'csui/controls/progressblocker/blocker',
    'i18n!csui/widgets/version.overview/impl/nls/lang',
    'hbs!csui/widgets/version.overview/impl/version.overview',
    'css!csui/widgets/version.overview/impl/version.overview'
  ], function (module, _, Marionette, $, log,
      VersionModelFactory,
      VersionCommands,
      base,
      Thumbnail,
      DocumentOverviewView,
      BlockingView, lang,
      VersionOverviewTemplate) {
    'use strict';

    log = log(module.id);

    var VersionOverviewView = DocumentOverviewView.extend({
      className: 'cs-form csui-general-form cs-version-overview-wrapper',
      template: VersionOverviewTemplate,
      templateHelpers: function () {

        var sizeFullValue  = this.options.node.get("file_size"),
            sizeValue      = this.getFormattedSizeValue(sizeFullValue),
            versionName    = this.options.node.get('version_number_name');

        var messages = DocumentOverviewView.prototype.templateHelpers.call(this);
        _.extend(messages, {
          size_value: sizeValue,
          size_full_value: sizeFullValue,
          versionText: _.str.sformat(lang.versionText, versionName),
          versionAria: _.str.sformat(lang.versionAria, versionName)
        });

        return messages;
      },

      ui: function () {
        return _.extend({}, DocumentOverviewView.prototype.ui, {
          creadyByUser: '.csui-version-overview-created-by-user',
          createdByPic: '.csui-version-overview-created-by-pic',
          downloadBtn: '.csui-version-overview-download-btn',
          locationContainer: '.location-container',
          descriptionSection: '.description_section',
          descriptionSectionBtn: '.description_section button',
          descriptionField: '.description_section span.cs-field-textarea-data'
        });
      },

      constructor: function VersionOverviewView(options) {
        options || (options = {});
        BlockingView.imbue(this);
        options.data || (options.data = {});

        if (!options.node) {
          options.node = options.context.getModel(VersionModelFactory);
        }

        this.options = options;

        var viewStateModel = options.context && options.context.viewStateModel;
        this.back_button = viewStateModel && viewStateModel.hasRouted();

        Marionette.ItemView.prototype.constructor.apply(this, arguments);

        this.commands = VersionCommands;
        this.isReloading = false;
        this.parentNode = undefined;
        this.supportOriginatingView = true;

        this.listenTo(this.options.node, 'change:id change:version_number',  _.bind(this.handleFetch, this));
        this.listenTo(this.options.node.actions, 'reset', _.bind(this._checkPermissions, this));
        this.listenTo(this.options.node, 'change:modify_date', _.bind(this._updateModifyDateAndTimeStamp, this));
        this.listenTo(this.options.node, 'change:description', _.bind(this._updateDescription, this));

        this.listenTo(this.options.node, 'delete',  _.bind(this._navigateToParent, this));
        this.blockActions();
      },

      onRender: function () {
        if(!this.options.node.fetched) {
          return;
        }
        this._showMetadataItemName();
        this._showThumbnail();
        this._addLocationView();
        this._showCreatedByUserName();
        this._checkPermissions();
      },

      handleFetch: function () {
        if(this.isReloading) {
          return;
        }
        this.isReloading = true;
        this.thumbnailSet = false;
        this.backButtonClicked = false;
        this.render();
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

              var inv = this.metadataItemNameView.render();
              Marionette.triggerMethodOn(inv, "before:show", inv, this);
              this.ui.titleContainer.append(inv.el);
              Marionette.triggerMethodOn(inv, "show", inv, this);

              this._unblockActions();
              if(this.isReloading) {
                this.isReloading = false;
              }

            }, this));

      },

      _updateDescription: function () {
        var newDescription = this.options.node.get('description');

        if(!newDescription) {
          this.ui.descriptionSectionBtn.removeAttr('aria-label');
          this.ui.descriptionField.text(null);
          this.ui.descriptionSection.addClass('binf-hidden');
        }
        else {
          this.ui.descriptionSectionBtn.attr('aria-label', lang.description + ':' + newDescription);
          this.ui.descriptionField.text(newDescription);
          this.ui.descriptionSection.removeClass('binf-hidden');
        }

      },

      _showThumbnail: function () {
        if(!this.isReloading) {
          this.thumbnail =
            this.options.thumbnail ||
            new Thumbnail({
              node: this.options.node
            });
          this.listenTo(this.thumbnail, "loadUrl", this._showImage);
          this.listenTo(this.thumbnail, "error", this._showDefaultImage);
          this.listenTo(this, "destroy", _.bind(this._destroyThumbnail, this));
        }

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
        this.$el.addClass("cs-version-overview-wrapper-with-thumbnail");
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

      _addLocationView: function () {
        var self           = this,
            renderLocation = function () {
              require(['csui/controls/table/cells/parent/parent.view'],
                  _.bind(function (ParentCellView) {
                    self.parentContainer = self.ancestors.at(self.ancestors.length - 2);
                    if(self.parentContainer && self.parentContainer.attributes) {
                      var field = new ParentCellView({
                        parent: self.parentContainer.attributes,
                        context: self.options.context,
                        nameEdit: false,
                        iconSize: 'contain',
                        el: self.$el.find(self.ui.location),
                        connector: self.options.node.connector
                      });
                      field.render();
                    }
                  }, this));
            };
        this.ancestors = this.options.context.getCollection('ancestors');
        if(!this.ancestors) {
          this._hideLocationField();
          return;
        }

        this.listenTo(this.ancestors, 'sync', function () {
          renderLocation();
        });
        this.listenTo(this.ancestors, 'error', this._hideLocationField);
        renderLocation();
      },

      _hideLocationField: function () {
        this.ui.locationContainer.addClass('binf-hidden');
      },

      _showCreatedByUserName: function () {
        var userOptions = {
          baseElement: this.ui.createdBy,
          userId: this.options.node.get("owner_id")
        };
        this._showUserName(userOptions);
      },
      _checkPermissions: function () {
        var downloadCmdOptions = {
              'signature': 'VersionDownload',
              'actionBtnEle': this.ui.downloadBtn
            },
            openCmdOptions = {
              'signature': 'VersionOpen',
              'actionBtnEle': this.ui.openBtn
            };

        this._checkPermForSpecificAction(openCmdOptions);
        this._checkPermForSpecificAction(downloadCmdOptions);
      },

      getFormattedSizeValue: function (value) {
        return base.formatFriendlyFileSize(value);
      },

      _handleClickThumbnail: function (event) {
        event.stopImmediatePropagation();
        this._executeCommand("VersionOpen");
      },

      _navigateToParent: function () {
        var parentId = this.parentContainer.get('id') || (this.options.node.get('id_expand') && this.options.node.get('id_expand').parent_id);
        if (parentId) {
          this._setNextNodeModelFactory(parentId);
        }
      }

    });

    return VersionOverviewView;

  });
