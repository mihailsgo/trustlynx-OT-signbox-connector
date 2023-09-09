/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/utils/nodesprites',
  'csui/models/namequery',
  'i18n!csui/controls/conflict.resolver/impl/conflict.dialog/impl/nls/lang',
  'csui/controls/progressblocker/blocker',
  "csui/utils/base",
  "csui/utils/log",
  'hbs!csui/controls/conflict.resolver/impl/conflict.dialog/impl/conflict.item/conflict.item',
  'csui/utils/mime.types',
  'css!csui/controls/conflict.resolver/impl/conflict.dialog/impl/conflict.item/conflict.item',
  'css!csui/controls/conflict.resolver/impl/conflict.dialog/impl/conflict.item/progress.wheel',
  'css!csui/controls/globalmessage/globalmessage_icons'
], function (_, $, Marionette, NodeSpriteCollection, NameQuery, lang,
  BlockingView, base, log, itemTemplate, mimeTypes) {

  var ConflictListItem = Marionette.ItemView.extend({

    constructor: function ConflictListItem(options) {
      Marionette.ItemView.call(this, options);
      this._onDynamicPlacment = _.bind(this._setDynamicPlacement, this);
      $(window).on("resize.app", this._onDynamicPlacment);
      if(!this.model.get('newName')){
        var name = this.model.get('name');
        this.model.set('newName', name);
      }
      this.blockKeyUp = false;
      BlockingView.imbue(this);
      var self = this;
      this.metadataLanguages = base.getMetadataLanguageInfo();
      this.saveMldata = '';
      this.listenTo(this, "ml:value:updated", function (obj) {
        self.saveMldata = obj;
        self.enableAddButton = true;
        self.ui.saveEdit.prop('disabled', !self.enableAddButton);
        this.refreshTabableElements();
        if (self.model.get("id") === undefined) {
          self.model.set("name", obj.value, {
            silent: true,
          });
          this.inputBoxNameChange = true;
          this.ui.nameInput.removeClass('csui-empty-with-placeholder');
          this.trigger("update:button", {disabled: false});
        }
        var attribute = {
          name_multilingual: obj.value_multilingual,
          multilingual_provided: true
        };
        self.model.set(attribute, {
          silent: true,
        });
        self.targetElement.val(obj.value);
      });
    },

    ui: {
      'inputField': 'input',
      'fileDescription': '.csui-description',
      'versionBtn': '.btn-version',
      'renameBtn': '.btn-rename',
      'cancelIcon': '.circle_delete',
      'progressWheel': '.csui-progress-container',
      'errorMessage': '.csui-msg',
      'statusText': '.csui-status',
      'cancelEdit': '.csui-btn-cancel',
      'errorMsgElem': '.csui-msg',
      'saveEdit': '.csui-btn-save',
      'conflictFields': '.conflict-field',
      'renameFields': '.rename-field',
      'globeIcon' : '.csui-multilingual-icon', // for multiligual
      'globeIconLabel': '.csui-multilingual-icon-label'
    },

    triggers: {
      'click @ui.versionBtn': 'click:version',
      'mouseleave': 'hide:cancel',
      'click @ui.cancelEdit': 'cancel:input'
    },

    events: {
      'click @ui.renameBtn': 'onRename',
      'click @ui.saveEdit': '_queryName',
      'click @ui.cancelIcon': 'onCancelUpload',
      "click @ui.globeIcon": "onClickGlobeIcon", // for multiligual
      "keydown @ui.globeIcon": "onKeyDownGlobeIcon",
      'keydown @ui.cancelIcon': 'onCancelUpload',
      'click .btn-undo': 'undo',
      'mouseenter': 'onHover',
      'focus *[tabindex]': 'onFocus',
      'keydown': 'onKeyInView',
      'keyup':'onKeyUp',
      'input @ui.inputField': 'onChangeName',
      'mousedown @ui.cancelEdit': 'onMouseDownCancel'
    },

    tagName: 'div',
    className: 'binf-list-group-item',
    template: itemTemplate,

    templateHelpers: function () {
      var multiRowClass = this.options.multiConflicts && (this.model.status !== 'skip') ? '' :
                          'no-cancel-icon',
          newName       = this.model.get('newName');

      return {
        'file-icon': this.getMimeTypeIcon(),
        'name': newName,
        'conflict-error-msg': lang.nameConflict,
        'conflict': !this.model.status,
        'status': this.getStatus(),
        'excludeAddVersion': this.model.excludeAddVersion || this.model.get('versioned') === false,
        'version': lang.addVersion,
        'versionAria': _.str.sformat(lang.nameConflictVersionAria, newName),
        'rename': lang.rename,
        'renameAria': _.str.sformat(lang.nameConflictRenameAria, newName),
        'skip': lang.skip,
        'skipAria': _.str.sformat(lang.nameConflictSkipAria, newName),
        'notSingleUpload': this.options.notSingleUpload,
        'multiRowClass': multiRowClass,
        'undo': lang.undo,
        'undoAria': _.str.sformat(lang.undoAria, newName, this.getStatus()),
        'status-ok': this.getResolveStatus(),
        'status-icon': this.getStatusIcon(),
        'cancel': lang.cancel,
        'save': lang.save,
        'inputPlaceHolder': lang.inputPlaceHolder,
        'statusNotSkip': this.model.status !== 'skip',
        'noServerError': this.model.status !== 'serverError',
        'resolvedStyle': this.resolvedStyle,
        'mlDataEnabled': this.metadataLanguages.enabled
      };
    },
    onKeyInView: function (event) {
      var keyCode = event.keyCode,
          target  = $(event.target),
          retVal  = true;
      switch (keyCode) {
        case 9:
          break;
        case 27:
          if (target.hasClass('cs-input')) {
            this.escapePressed = true;
            this.blockKeyUp = true;
            this.onCancelInput();
            this.setFocusInView();
            retVal = false;
          }
          break;
        case 32:
        case 13:
          if (target.hasClass('cs-input') && keyCode === 13) {
            this._queryName();
            retVal = false;
          }
      }
      return retVal;
    },

    onChangeName: function (event) {
      if (this.ui.saveEdit.length) {
        var currentInputElementVal = this.ui.inputField.val().trim(),
            enableAddButton        = false;
        enableAddButton = this.isSaveEnabled(event.target.value);
        _.isFunction(this.updateMLdata) && this.updateMLdata(event);
        this.ui.saveEdit.prop('disabled', !enableAddButton);
      }
    },

    isSaveEnabled: function (newName) {
      newName = newName.trim();
      if (!newName.length || newName===this.model.get('name')) {
        return false;
      } else {
        return true;
      }
    },

    onKeyUp: function(event) {

      if(event.keyCode === 27 && this.blockKeyUp) {
        event.stopPropagation();
        this.blockKeyUp = false;
      }
      if(event.keyCode === 27 && this._isReadyToSave){
        event.preventDefault();
      }
    },

    onFocus: function (event) {
      this.trigger('item:focus', event.target);
    },

    setFocusInView: function() {
      this.$el.find('input:not([disabled]),  button:not([disabled])').filter(
        ':visible').first().trigger('focus');
    },

    refreshTabableElements: function () {
      this.tabableElements = this.$el.find('input:not([disabled]),  button:not([disabled])').filter(
          ':visible').toArray();
    },

    getStatus: function () {
      switch (this.model.status) {
        case 'renamed':
          return lang.renamed;
        case 'skip':
          return lang.skip;
        case 'version':
          return lang.addVersion;
        case 'serverError':
          return lang.serverError;
      }
      return lang.conflict;
    },

    getStatusIcon: function () {
      var icon = 'csui-icon-notification-warning';
      switch (this.model.status) {
        case 'version':
        case 'renamed':
        case 'skip':
          icon = 'csui-icon-notification-success';
          break;
        case 'serverError':
          icon = 'category_delete';
          break;
      }
      return icon;
    },

    getMimeTypeIcon: function () {
      var mimeType;
      if ((this.model.get('mime_type') === undefined) && (this.model.get('file') !== undefined)) {
        mimeType = (this.model.get('file').type) || mimeTypes.getMimeType(this.model.get('name'));
      } else if (this.model.get('mime_type') !== null) {
        mimeType = this.model.get('mime_type');
      } else {
        mimeType = this.model.get('type');
      }
      this.model.set('mime_type', mimeType);
      return NodeSpriteCollection.findClassByNode(this.model);
    },


    getResolveStatus: function () {
      var status = '';
      switch (this.model.status) {
        case 'version':
        case 'renamed':
        case 'skip':
          status = 'ok';
          break;
        case 'serverError':
          status = 'error';
          break;
      }
      return status;
    },

    onDestroy: function () {
      $(window).off("resize.app", this._onDynamicPlacment);
    },

    onClickVersion: function (model) {
      this.model.status = 'version';
      this.model.set('newVersion', true);
      this.setResolveStatus(true);
      this.render();
    },

    onRename: function (event) {
      event.preventDefault();
      event.stopPropagation();
      this.model.set( 'multilingual_provided' , false, {
        silent: true,
      });
      var name_multilingual = this.model.get("name_multilingual");
      name_multilingual && (this.prevMultilingualVal = _.clone(name_multilingual));
      var name = this.model.get('newName');
      this.ui.inputField.val(name);
      this.ui.conflictFields.addClass('binf-hidden');
      this.ui.renameFields.removeClass('binf-hidden');
      this.ui.globeIconLabel.removeClass('binf-hidden');
      this.ui.inputField.trigger('focus');

      this.ui.fileDescription.addClass('edit-mode');
      this.$el.addClass('edit-mode');
      this.$el.find('.csui-status-icon').addClass('edit-mode');
      if(this.metadataLanguages && this.metadataLanguages.enabled){
        this._openMLFlyoutInEditMode();
      }
    },

    onCancelInput: function () {
      this.render();
    },

    onCancelUpload: function (event) {
      if (event.keyCode === undefined || event.keyCode === 32 || event.keyCode === 13) {
        event.stopPropagation();
        event.preventDefault();
      this.view && this.view.enableAddButton && this.view.ui.saveButtonInEditMode.prop('disabled', true);
      this.options.removeItemList[this.model.get('id')] = this.model;
      this.previousState = this.model.status;
      this.model.status = 'skip';
      this.setResolveStatus(true);
      this.render();
      }
    },

    onKeyDownGlobeIcon: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
        this.multiLingualForm && this.keyDownOnGlobeIcon(event);
       }
    },

    onClickGlobeIcon: function (event) {
      event.stopPropagation();
      this._showLanguagePopover();
    },

    setResolveStatus: function(resolved){
      if (this._resolved && !resolved){
        this.trigger('resolved', false);
      }
      if (!this._resolved && resolved){
        this.trigger('resolved', true);
      }

      this._resolved = resolved;
    },

    onHover: function () {
      if (!this.resolvedStyle){
        this.resolvedStyle = "width:" + $('.csui-button-container').width() + 'px;';
      }
      this.ui.cancelIcon.addClass('binf-show');
    },

    onHideCancel: function () {
      this.ui.cancelIcon.removeClass('binf-show');
    },

    onRender: function () {
      var self = this;
      var node = this.model;

      if (node.get('first')) {
        this.$el.addClass('no-border');
      }

      this._setDynamicPlacement();
      this.mouseDownCancel = false;
      this.escapePressed = false;

      if (this.metadataLanguages.enabled) {
        this.ui.inputField.addClass('csui-multilingual-input');
        var inputField = self.ui.inputField, globeIcon = self.ui.globeIcon;
        require(["csui/controls/multilingual.text.picker/multilingual.popover.mixin"], function (
            MultiLingualPopoverMixin
        ) {
          MultiLingualPopoverMixin.mixin(ConflictListItem.prototype);
          self.blockActions();
          self.requiredInfoAvilable('name_multilingual').then(function () {
            self.multiLingualForm &&
            self.targetElement.binf_popover("destroy");
            var mlOptions = {
              parentView: self,
              targetElement: inputField,
              mlGlobeIcon: globeIcon,
              validationRequired: true,
              multilingualData: self.model.get("name_multilingual")
            };
            self._loadMultiLingualPopover(mlOptions);
            self.unblockActions();
          });
        });
      }
    },

    undo: function (event) {
      event.preventDefault();
      event.stopPropagation();

      var id = this.model.get('id');
      this.model.status = this.previousState;

      if (this.previousState) {
        delete this.options.removeItemList[id];
        this.previousState = undefined;
      }
      else {
        this.oldName && this.model.set('newName', this.oldName);
        this.oldId && this.model.set('id', this.oldId);
        this.oldName = this.Id = undefined;
        this.model.set('newVersion', undefined);
        this.model.set("name_multilingual", this.prevMultilingualVal, {
          silent: true
        });
        delete this.options.removeItemList[id];
        this.model.status = undefined;
        this.setResolveStatus(false);
      }
      this.render();
    },

    validateName: function (name) {
      if(name.indexOf(':') !== -1) {
        this.showInlineError(lang.nameErrorContainSemiColon);
        return false;
      }
      return true;
    },

    showInlineError: function (error) {
      this.ui.errorMsgElem.attr('title', error);
      this.ui.errorMsgElem.text(error);
    },

    _queryName: function (event) {
      var newName       = this.ui.inputField.val(),
          oldName       = this.model.get('newName'),
          oldType       = this.model.get('type'),
          cancelClicked = event && event.relatedTarget && event.relatedTarget.id === "cancel";
      newName = newName && newName.trim();
      var isValidName = this.validateName(newName);
      if(!isValidName) {
        return;
      }
      else if (newName && newName !== oldName && !this.mouseDownCancel && !this.escapePressed &&
          !cancelClicked) {
        this.oldName = oldName;
        this.oldId = this.model.get('id');
        this.model.set('id', undefined);
        this.model.set('newName', newName);
        this.ui.progressWheel.removeClass('binf-hidden');
        this._runNameQuery([{name: newName, type: oldType}]);
      }
      else if(this.escapePressed) {
        this.escapePressed = false;
      }
      else if(!cancelClicked) {
        this.onCancelInput();
        this.mouseDownCancel = false;
      }
    },

    onMouseDownCancel: function (event) {
      this.mouseDownCancel = true;
      this.prevMultilingualVal && this.model.set({name_multilingual: this.prevMultilingualVal});
      event.stopPropagation();
    },

    _runNameQuery: function (name) {
      var self = this,
          nameQuery = new NameQuery({containerId: this.options.parentId},
              {connector: this.options.connector});

      nameQuery.queryNames(name)
        .done(function (cleanFileName, conflictFileName) {
          if (conflictFileName && conflictFileName.length > 0) {
            self._resetConflictStatus(conflictFileName);
          }
          else {
            self._setRenameStatus();
          }
        })
        .fail(function (resp) {
          self.ui.progressWheel.addClass('binf-hidden');
          self._processServerError(resp);
        });
    },

    _processServerError: function (response) {
      this.options.removeItemList[this.model.get('id')] = this.model;
      this.model.status = 'serverError';
      this.$el.removeClass('edit-mode');
      this._setErrorMsg(response);
      this.setResolveStatus(true);
      this.render();
    },

    _setErrorMsg: function (response) {
      var msg = lang.serverError,
        logMsg = 'Conflict.Item.View: Server returned error during name query';

      if (response) {
        logMsg = new base.RequestErrorMessage(response);
      }

      log.error(logMsg) && console.error(log.last);
    },

    _setRenameStatus: function () {
      this.model.status = 'renamed';
      this.$el.removeClass('edit-mode');
      this.setResolveStatus(true);
      this.render();
    },

    _resetConflictStatus: function (newConflictFile) {
      this.model.set('id', newConflictFile[0].id);
      this.render();
    },

    _setDynamicPlacement: function () {
      var acceptedWidth = $(window).width() - (88 * 2);

      if (acceptedWidth < 600) {
        this.$el.addClass('sm');
        this.ui.statusText.addClass('sm');
        this.ui.fileDescription.addClass('sm');
      }
      else {
        this.$el.removeClass('sm');
        this.ui.statusText.removeClass('sm');
        this.ui.fileDescription.removeClass('sm');
      }
    }
  });


  return ConflictListItem;

});

