/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/utils/nodesprites',
  'csui/controls/icons.v2',
  'csui/controls/icon/icon.view',
  'conws/widgets/header/impl/header.icon.model',
  'conws/widgets/header/impl/editicon.view',
  'i18n!conws/widgets/header/impl/nls/header.lang',
  'hbs!conws/widgets/header/impl/icon',
], function (_, $, Marionette, base, ModalAlert, NodeSpriteCollection, iconRegistry, IconViewHeader,
    HeaderIconModel, EditIconView, lang, template) {

  var IconView = Marionette.ItemView.extend({

    className: 'conws-workspace-icon-view',

    template: template,
    triggers: {
      'change .conws-header-icon-file': 'set:icon'
    },
    blankImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII=',
    defaultIconFileTypes: 'image/gif, image/x-png, image/jpeg, image/pjpeg, image/png, image/svg+xml',
    defaultIconFileSize: 1048576,

    templateHelpers: function () {
      var obj = {
        canChange: this.model.hasAction('upload-icon') ||
                   this.model.hasAction('update-icon') ||
                   this.model.hasAction('delete-icon'),
        iconData: this.getImageInfo().iconContent,
        iconCustomized: this.getImageInfo().iconLocation !== 'none',
        iconFileTypes: this.options.data.iconFileTypes,
        chooseInpFileTitle: this.options.data.chooseInpFileTitle,
        iconMsg: lang.iconMessage,
        type: this.options.type
      };
      return obj;
    },

    constructor: function IconView(options) {
      this.options = options || {};
      if (!options.data.iconFileTypes) {
        options.data.iconFileTypes = this.defaultIconFileTypes;
      }
      if (!options.data.iconFileSize) {
        options.data.iconFileSize = this.defaultIconFileSize;
      }
      if (!options.data.chooseInpFileTitle) {
        options.data.chooseInpFileTitle = lang.chooseInpFileTitle;
      }
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      this.iconModel = new HeaderIconModel({
        id: this.model.get('id')
      }, {
        connector: this.model.connector,
        icon: this.model.icon
      });
      this.listenTo(this.model,'change:id',function(){
        this.iconModel.set({
          'id': this.model.get('id'),
          'icon': undefined
        });
      })
      this.listenTo(this.iconModel, 'icon:change', _.bind(function () {
        this.model.icon = this.iconModel.icon;
        this.render();
      }, this));

    },

    isTabable: function () {
      return $('.cs-tabbed-perspective.cs-collapse').length === 0;
    },

    onRender: function () {
      var edit = this.$('.conws-header-edit'),
        self = this;
      edit.binf_popover({
        container: '.conws-header-wrapper',
        animation: true,
        html: true,
        content: _.bind(this.renderPopover, this)
      });
      this.options.parentView.$el.on('mouseleave', function () {
        self.$('.conws-header-edit').binf_popover('hide');
      });
    },
    renderPopover: function () {
      var imageInfo = this.getImageInfo();
      var self = this;
      var view = new EditIconView({
        message: lang.changeIconDialogMessage.replace('%1',
            base.getReadableFileSizeString(self.options.data.iconFileSize)),
        resetButton: function () {
          return imageInfo.iconLocation === 'node' && self.model.hasAction('delete-icon')
        },
        uploadButton: function () {
          return imageInfo.iconLocation !== 'type' && self.model.hasAction('upload-icon')
                 || imageInfo.iconLocation !== 'node' && self.model.hasAction('update-icon');

        },
        callback: _.bind(this.onClickPopover, this)
      });
      return view.render().el;
    },
    onSetIcon: function (e) {
      var files = $('.conws-header-icon-file')[0].files
      if (this.getImageInfo().iconLocation === 'node') {
        this.iconModel.update(files).fail(function (resp) {
          var message = new base.RequestErrorMessage(resp).message ||
                        lang.changeIconDialogDefaultError;
          ModalAlert.showError(message);
        });
      } else {
        this.iconModel.add(files).fail(function (resp) {
          var message = new base.RequestErrorMessage(resp).message ||
                        lang.changeIconDialogDefaultError;
          ModalAlert.showError(message);
        });
      }
    },

    onClickPopover: function (e) {
      $('.conws-header-edit').binf_popover('hide');
      if (e === 'reset') {
        this.iconModel.remove().fail(function (resp) {
          var message = new base.RequestErrorMessage(resp).message ||
                        lang.changeIconDialogDefaultError;
          ModalAlert.showError(message);
        });
      } else if (e === 'upload') {
        this.$('.conws-header-icon-file').trigger('click');
      }
      this.$el.find('.conws-header-edit').trigger('focus');
    },
    getImageInfo: function () {
      var ret;
      var icon = this.iconModel.icon;
      if (icon && icon.location !== 'none') {
        ret = {
          iconContent: icon.content,
          iconLocation: icon.location
        };
      } else {
        ret = {
          iconContent: this.blankImage,
          iconLocation: 'none'
        }
      }

      return ret;
    }
  });

  return IconView;
});