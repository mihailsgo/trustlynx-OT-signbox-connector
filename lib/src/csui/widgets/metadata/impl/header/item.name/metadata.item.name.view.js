/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['require', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/controls/node-type.icon/node-type.icon.view', 'csui/utils/base',
  'hbs!csui/widgets/metadata/impl/header/item.name/metadata.item.name',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu.view',
  'csui/utils/commands/versions',
  'csui/widgets/metadata/versions.toolbaritems',
  'csui/widgets/metadata/versions.toolbaritems.mask',
  'csui/widgets/metadata/header.dropdown.menu.items',
  'csui/widgets/metadata/header.dropdown.menu.items.mask',
  'csui/models/version', 'csui/behaviors/item.name/item.name.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'i18n', 'css!csui/widgets/metadata/impl/metadata',
  'css!csui/widgets/metadata/impl/header/item.name/metadata.item.name'
], function (require, $, _, Backbone, Marionette, NodeTypeIconView, base, template, lang,
    DropdownMenuView, versionCommands, versionToolbarItems, VersionsToolbarItemsMask,
    dropdownMenuItems, DropdownMenuItemsMask, VersionModel,
    ItemNameBehavior, TabableRegionBehavior, ViewEventsPropagationMixin, i18n) {
  'use strict';

  var MetadataItemNameView = Marionette.ItemView.extend({

        className: 'cs-metadata-item-name-container',
        template: template,

        templateHelpers: function () {
          return {
            name: this.modelHasEmptyName ? (this.readonly ? this.placeHolderName : '') :
                  this.options.model.get("name"),
            edit_name: this.modelHasEmptyName ? '' : this.options.model.get("name"),
            edit_name_id: _.uniqueId('cs-metadata-edit-name'),
            placeholder_text: this.placeHolderName,
            nameAria: this.options.model.get("name") || lang.emptyObjectNameAria,
            cancel_edit_name_tooltip: lang.cancelEditNameTooltip,
            save_edit_name_tooltip: lang.saveEditNameTooltip,
            switch_language_tooltip: lang.switchLanguageTooltip,
            show_dropdown_menu: this.options.showDropdownMenu ? true : false,
            read_only: this.readonly,
            goBack: lang.goBackTooltip,
            sidebarToggleTitle: lang.expand,
            hideCancelButton: this.options.mode && this.options.mode === 'create',
            mlDataEnabled: this.metadataLanguages.enabled
          };
        },

        ui: {
          name: '.title',
          contextMenuDiv: '.csui-metadata-item-name-dropdown',
          nameEditDiv: '.title-edit-div',
          nameInput: '.title-input',
          nameEditCancelIcon: '.csui-edit-cancel',
          titleError: '.title-error',
          toggleIcon: '.csui-metadata-listview',
          toggleWrapper: '.csui-toggle-wrapper',
          backEle: '.arrow_back',
          titleHeader: '.title-header',
          saveButtonInEditMode: '.csui-edit-save',
          mlGlobeIcon: '.csui-multilingual-icon'
        },

        modelEvents: {
          'change': 'render'
        },

        events: {
          'keydown': 'onKeyInView',
          'mouseenter': 'onMouseEnterName',
          'mouseleave': 'onMouseLeaveName',
          'keydown @ui.nameInput': 'onKeyDown',
          'input @ui.nameInput': 'onChangeName',
          'click @ui.toggleIcon': 'toggleSideBar',
          'click @ui.backEle': 'goBack',
          'keydown @ui.toggleIcon': 'toggleSideBar',
          'keydown @ui.backEle': 'goBack',
          'keydown @ui.toggleWrapper': '_onKeyInView',
          'click @ui.mlGlobeIcon': 'onClickGlobeIcon',
          'keydown @ui.mlGlobeIcon': 'onKeyDownGlobeIcon',
          'paste @ui.nameInput': 'onKeyDown'
        },

        behaviors: function () {
          return {
            ItemName: {
              behaviorClass: ItemNameBehavior,
              nameSchema: this._nameSchema,
              mode: this.options.mode,
              autoSave: this.options.autoSave
            }
          };
        },

        toggleSideBar: function (event) {
          if (!!event && (event.keyCode === 13 || event.keyCode === 32 || event.type === 'click')) {
            this.toggleSideBarEvent();
            event.preventDefault();
            event.stopPropagation();
          }
        },
        setToggleIconTabIndex: function () {
          this.ui.toggleIcon.attr('tabindex', 0);
        },

        onChangeName: function (event) {
          if (this.ui.saveButtonInEditMode.length) {
            var currentInputElementVal = this.ui.nameInput.val().trim();
            this.enableAddButton = false;
            this.enableAddButton = this.isSaveEnabled(event.target.value);
            this.ui.saveButtonInEditMode.prop('disabled', !this.enableAddButton);
            _.isFunction(this.updateMLdata) && this.updateMLdata(event);
          }
          this.refreshTabableElements();
        },

        isSaveEnabled: function (newName) {
          newName = newName.trim();
          if (!newName.length || (newName === this.model.get('name') && !this.saveMldata)) {
            return false;
          } else {
            return true;
          }
        },

        refreshTabableElements: function () {
          this.tabableElements = this.$el.find('input:not([disabled]),  button:not([disabled])').filter(
              ':visible').toArray();
        },

        _moveTab: function (event) {
          this.currentlyFocusedElementIndex = this.tabableElements.indexOf(event.target);
          if (event.shiftKey) {
            if (this.currentlyFocusedElementIndex > 0) {
              this.currentlyFocusedElementIndex -= 1;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            } else {
              this.currentlyFocusedElementIndex = this.tabableElements.length - 1;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            }
          } else {
            if (this.currentlyFocusedElementIndex < this.tabableElements.length - 1) {
              this.currentlyFocusedElementIndex += 1;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            } else {
              this.currentlyFocusedElementIndex = 0;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            }
          }
          event.stopPropagation();
          event.preventDefault();
        },

        toggleSideBarEvent: function () {
          if (this.leftBar && this.leftBar.length > 0) {
            var parentWrapper = this.leftBar.closest(".metadata-navigation");
            if (!!parentWrapper) {
              if (parentWrapper.length > 0) {
                var sideBarEle = this.leftBar;
                if (sideBarEle.length > 0) {
                  if (parentWrapper.hasClass('csui-hide-side-bar')) {
                    parentWrapper.toggleClass("csui-hide-side-bar");
                    $(sideBarEle).show('blind', {direction: this.direction}, '200', function () {
                      $(window).trigger("resize.tableview");
                    });
                    $(this.ui.backEle).hide();
                    $(this.ui.toggleIcon).attr('title', lang.collapse).attr('aria-label',
                        lang.collapse);
                    $(this.ui.toggleIcon).addClass('csui-metadata-listview-collapse-icon').removeClass(
                        'csui-metadata-listview-expand-icon');
                    this.sideBarHidden = false;
                  } else {
                    var that = this;
                    $(sideBarEle).hide('blind', {direction: this.direction}, '200', function () {
                      parentWrapper.toggleClass("csui-hide-side-bar");
                      $(window).trigger("resize.tableview");
                    });
                    $(that.ui.backEle).show().trigger('focus');
                    this.sideBarHidden = true;
                    $(this.ui.toggleIcon).attr('title', lang.expand).attr('aria-label',
                        lang.expand);
                    $(this.ui.toggleIcon).addClass('csui-metadata-listview-expand-icon').removeClass(
                        'csui-metadata-listview-collapse-icon');
                  }
                  $(sideBarEle).promise().done(function () {
                    var event = $.Event('toggled:navigationbar');
                    this.closest('.metadata-navigation').find('.cs-metadata').trigger(event);
                  });
                }
              }
            }
          }
        },
        ensureTitleLabelIcon: function () {
          if (this.leftBar && this.leftBar.length > 0) {
            var parentWrapper = this.leftBar.closest(".metadata-navigation");
            if (!!parentWrapper) {
              if (parentWrapper.length > 0) {
                var sideBarEle = this.leftBar;
                if (sideBarEle.length > 0) {
                  if (parentWrapper.hasClass('csui-hide-side-bar')) {
                    $(this.ui.toggleIcon).attr('title', lang.expand).attr('aria-label',
                        lang.expand);
                    $(this.ui.toggleIcon).addClass('csui-metadata-listview-expand-icon').removeClass(
                        'csui-metadata-listview-collapse-icon');
                  } else {
                    $(this.ui.toggleIcon).attr('title', lang.collapse).attr('aria-label',
                        lang.collapse);
                    $(this.ui.toggleIcon).addClass('csui-metadata-listview-collapse-icon').removeClass(
                        'csui-metadata-listview-expand-icon');
                  }
                }
              }
            }
          }
        },

        constructor: function MetadataItemNameView(options) {
          options || (options = {});
          this._nameSchema = _.extend({
            required: true,
            readonly: false
          }, options.nameSchema);
          var autoSave = false;
          if (options.mode === 'create') {
            autoSave = true;
          }
          options.autoSave = autoSave;
          this.listenTo(options.model, "change:name", this._updateName);

          this.direction = !!i18n.settings.rtl ? 'right' : 'left';

          Marionette.ItemView.prototype.constructor.call(this, options);

          this.readonly = this._nameSchema.readonly;
          this.placeHolderName = lang.addItemPlaceHolderName;
          var name = this.model.get("name");
          this.modelHasEmptyName = name ? false : true;
          this.options.showDropdownMenu && this._createDropdownMenu();

          $(window).on('resize.' + this.cid, {view: this}, this._onWindowResize);

          var self = this;
          this.metadataLanguages = base.getMetadataLanguageInfo();
          this.saveMldata = '';
          this.listenTo(this, "ml:value:updated", function (obj) {
            self.saveMldata = obj;
            self.enableAddButton = true;
            self.ui.saveButtonInEditMode.prop('disabled', !self.enableAddButton);
            if (self.model.get("id") === undefined) {
              self.model.set("name", obj.value, {
                silent: true,
              });
              this.inputBoxNameChange = true;
              this.ui.nameInput.removeClass('csui-empty-with-placeholder');
              this.trigger("update:button", {disabled: false});
            }
            self.model.set("name_multilingual", obj.value_multilingual, {
              silent: true,
            });
            self.targetElement.val(obj.value);
            self.refreshTabableElements();
          });
          this.listenTo(this.model.actions, 'reset update', function () {
            this._checkAndEnableOrDisableEditing();
          });
        },

        goBack: function (event) {
          if (event.keyCode === 13 || event.keyCode === 32 || event.type === 'click') {
            this.options.originatingView.triggerMethod('metadata:close');
            event.preventDefault();
            event.stopPropagation();
          }
        },

        _checkAndEnableOrDisableEditing: function () {
          var nameEle = $(this.ui.name);
          if(nameEle.length && this.ItemNameBehavior._isEditingEnabled()) {
            var title = _.str.sformat(lang.itemTitleAria, this.model.get('name'));
            nameEle.attr('aria-label', title);
            nameEle.attr('title', title);
            nameEle.attr('tabindex', 0);
            nameEle.removeClass('csui-disabled');
          } else {
            nameEle.removeAttr('aria-label');
            nameEle.removeAttr('title');
            nameEle.removeAttr('tabindex');
            nameEle.addClass('csui-disabled');
          }
        },

        _applyToggle: function () {
          if (!!this.sideBarHidden) {} else {
            this.ui.toggleWrapper instanceof Object &&
            this.ui.toggleWrapper.removeClass('binf-hidden');
            this.$el.addClass("csui-metadata-header-with-toggle");
            if (this.options.originatingView && !!this.options.originatingView.mdn &&
                !!this.options.originatingView.mdn.$el.is(":visible")) {
              if (this.ui.backEle instanceof Object) {
                this.ui.backEle.hide();
              }
            }
          }
        },

        _removeToggle: function () {
          if (this.ui.toggleWrapper instanceof Object) {
            this.ui.toggleWrapper.addClass('binf-hidden');
            this.$el.removeClass("csui-metadata-header-with-toggle");
          }
          if (!!this.sideBarHidden) {
            this.toggleSideBarEvent();
          }
        },

        onDestroy: function () {
          this._destroyDropdownMenu();
          $(window).off('resize.' + this.cid).off('resize.tableview.' + this.cid);
        },

        _updateName: function () {
          var name = this.model.get("name");
          this.modelHasEmptyName = name ? false : true;
          this.render();
          var focus = $(this.ui.nameInput).is(":focus");
          this._toggleEditMode(focus || this.modelHasEmptyName || false, false);
          this.validate();
        },

        _destroyDropdownMenu: function () {
          if (this.dropdownMenuView) {
            this.cancelEventsToViewsPropagation(this.dropdownMenuView);
            this.dropdownMenuView.destroy();
          }
        },

        _createDropdownMenu: function () {
          var oView = this.options.originatingView;
          var isVersionModel = this.options.model instanceof VersionModel;
          var toolItems,
              toolItemsMask = this.options.toolbarItemsMask;
          if (oView && oView.options && oView.options.toolbarItems &&
              oView.options.toolbarItems.dropdownMenuListInProperties) {
            toolItems = oView.options.toolbarItems.dropdownMenuListInProperties;
          } else {
            if (isVersionModel) {
              toolItems = versionToolbarItems.dropdownMenuList;
            } else {
              toolItems = dropdownMenuItems.dropdownMenuList;
            }
          }
          if (!toolItemsMask) {
            if (isVersionModel) {
              toolItemsMask = new VersionsToolbarItemsMask(this.options);
            } else {
              toolItemsMask = new DropdownMenuItemsMask();
            }
          }
          if (this.options.showPermissionView) {
            toolItems = toolItems.collection.filter(
                function (command) {
                  return (command.get("signature") != "permissions");
                });
          } else if (this.options.showPropertiesCommand !== true) {
            toolItems = toolItems.collection.filter(
                function (command) {
                  return (command.get("signature") != "Properties" && command.get("signature") !=
                          "VersionProperties");
                });
          }
          this._destroyDropdownMenu();
          var ddm = this.dropdownMenuView = new DropdownMenuView({
            model: this.options.model,
            container: this.options.container,
            containerCollection: this.options.collection || this.options.containerCollection,
            toolItems: toolItems,
            toolItemsMask: toolItemsMask,
            originatingView: this.options.originatingView,
            targetView: this.options.targetView,
            context: this.options.context,
            commands: isVersionModel ? versionCommands : this.options.commands,
            metadataScenario: this.options.metadataScenario,
            showPermissionView: this.options.showPermissionView,
            noMetadataNavigation: this.options.noMetadataNavigation
          });
          this.listenTo(ddm, 'rename', _.bind(this._toggleEditMode, this, true));

          ddm.$el.on('keydown', _.bind(function (event) {
            if (event.keyCode === 9 && event.shiftKey) {
              if (this.ui.backEle.is(':visible') || this.ui.toggleIcon.is(':visible')) {
                this.ui.name.prop('tabindex', 0);
                event.stopPropagation();
              }
            }
          }, this));
          this.propagateEventsToViews(this.dropdownMenuView);
        },

        _onWindowResize: function (event) {
          if (event && event.data && event.data.view) {
            var self = event.data.view;
            if (self.resizeTimer) {
              clearTimeout(self.resizeTimer);
            }

            self.resizeTimer = setTimeout(function () {
              self._setHideShowToggleButton();
            }, 200);
          }
        },

        _setHideShowToggleButton: function (event) {

          var isLandscape = window.matchMedia("(orientation: landscape)").matches,
              isPortrait  = window.matchMedia("(orientation: portrait)").matches,
              self        = !!event && !!event.data && !!event.data.view ? event.data.view : this;

          self.leftBar = self.options.originatingView &&
                         self.options.originatingView.$el.find(".metadata-sidebar");

          if (self.leftBar && self.leftBar.length > 0) {
            var navBar = self.leftBar.closest(".metadata-navigation");
            if (isLandscape) {
              if (window.innerWidth <= 1280) {
                if (!!self.sideBarHidden) {
                  self.ui.toggleWrapper instanceof Object &&
                  self.ui.toggleWrapper.removeClass('binf-hidden');
                  if (self.ui.backEle instanceof Object) {
                    self.ui.backEle.css({display: "inline-block", position: "relative"});
                    self.ui.backEle.attr("tabindex", 0);
                  }
                  this.ensureTitleLabelIcon();
                } else {
                  self._applyToggle(event);
                  self.leftBar.removeClass('binf-hidden');
                  if (navBar.hasClass('csui-hide-side-bar')) {
                    self.leftBar.show();
                    navBar.toggleClass("csui-hide-side-bar");
                    if (self.ui.backEle instanceof Object) {
                      self.ui.backEle.hide();
                    }
                    $(window).trigger("resize.tableview");
                  }
                  this.ensureTitleLabelIcon();
                }
              } else {
                this.sideBarHidden = false;
                self._removeToggle(event);
                if (navBar.hasClass('csui-hide-side-bar')) {
                  self.leftBar.show();
                  navBar.toggleClass("csui-hide-side-bar");
                  if (self.ui.backEle instanceof Object) {
                    self.ui.backEle.hide();
                  }
                }
                $(window).trigger("resize.tableview");
                this.ensureTitleLabelIcon();
              }
            } else if (isPortrait) {
              self._applyToggle(event);
              if (self.leftBar.length > 0) {
                if (!navBar.hasClass('csui-hide-side-bar')) {
                  self.leftBar.hide();
                  navBar.toggleClass("csui-hide-side-bar");
                  $(window).trigger("resize.tableview");
                }
                if (self.ui.backEle instanceof Object) {
                  self.ui.backEle.css({display: "inline-block", position: "relative"});
                  self.ui.backEle.attr("tabindex", 0);
                }
              }
              this.ensureTitleLabelIcon();
            }
          }
        },

        currentlyFocusedElement: function (options) {
          if (!!this.ui.backEle && $(this.ui.backEle).is(':visible')) {
            return this.ui.backEle;
          } else if (!!this.ui.toggleIcon && $(this.ui.toggleIcon).is(':visible')) {
            return this.ui.toggleIcon;
          } else if (!!this.options.mode && this.options.mode === 'create') {
            var mlIcon = $(this.ui.mlGlobeIcon);
            return options && options.shiftKey && mlIcon.is(':visible') ? mlIcon : $(this.ui.nameInput);
          } else {
            return $(this.ui.name);
          }
        },

        onRender: function () {
          this.editing = false;
          this.ui.nameEditDiv.addClass('binf-hidden');

          if (this._nodeIconView) {
            this._nodeIconView.destroy();
          }
          this._nodeIconView = new NodeTypeIconView({
            el: this.$('.csui-type-icon').get(0),
            node: this.options.model,
            displayThumbnailIcon: false
          });
          if (this.model.get('type') === 1) {
            this._nodeIconView.$el.addClass('csui-metadata-shortcut-overlay');
          }
          this._nodeIconView.render();

          if (this.dropdownMenuView) {
            this.dropdownMenuView.render();
            Marionette.triggerMethodOn(this.dropdownMenuView, 'before:show', this.dropdownMenuView,
                this);
            this.ui.contextMenuDiv.append(this.dropdownMenuView.el);
            Marionette.triggerMethodOn(this.dropdownMenuView, 'show', this.dropdownMenuView, this);
          }

          if (this.modelHasEmptyName) {
            this.ui.nameInput.addClass('csui-empty-with-placeholder');
            this.ui.nameInput.attr('placeholder', this.placeHolderName);
            if (this.readonly) {
              this.ui.name.addClass('csui-empty-with-placeholder');
            }
          }

          this._setHideShowToggleButton();
          this._checkAndEnableOrDisableEditing();
          var self = this, targetElement = self.ui.nameInput, mlGlobeIcon = self.ui.mlGlobeIcon;
          if (this.metadataLanguages.enabled && !(this.model.get('version_id'))) {
            this.ui.nameInput.addClass('csui-multilingual-input');
            self.$el.addClass('binf-hidden');
            require(["csui/controls/multilingual.text.picker/multilingual.popover.mixin"], function (
                MultiLingualPopoverMixin
            ) {
              MultiLingualPopoverMixin.mixin(MetadataItemNameView.prototype);
              self.targetElement = targetElement;
              self.requiredInfoAvilable('name_multilingual').then(function () {
                self.multiLingualForm &&
                self.targetElement.binf_popover("destroy");
                var mlOptions = {
                  parentView: self,
                  targetElement: targetElement,
                  mlGlobeIcon: mlGlobeIcon,
                  validationRequired: true,
                  multilingualData: self.model.get("name_multilingual")
                };
                self._loadMultiLingualPopover(mlOptions);
                self.$el.removeClass('binf-hidden');
              });
            });
          }
        },
        onMouseEnterName: function (event) {
          if (this.readonly) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
        },

        onMouseLeaveName: function (event) {
          if (this.readonly) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
        },

        onKeyDown: function (event) {
          if (this.$el.parents(".cs-item-action-metadata").find(
              "div[class='load-container']").length >
              0) {
            return false;
          }
          if (this.readonly) {
            return;
          }
          if (this.modelHasEmptyName && this.inputBoxNameChange !== true) {
            this.setInputBoxValue('');
            this.inputBoxNameChange = true;
            this.ui.nameInput.removeClass('csui-empty-with-placeholder');
          }
        },

        _validateAndSave: function () {
          var currentValue = this.getValue().trim();
          var inputValue = this.getInputBoxValue();
          inputValue = inputValue.trim();

          if (inputValue.length === 0 || currentValue !== inputValue ||
              this.model.changed.name_multilingual) {
            var success = this.validate(inputValue);
            if (success === true) {
              var self = this;
              this.setInputBoxValue(inputValue);
              this.setValue(inputValue);
              this.modelHasEmptyName = false;
              this.trigger("metadata:item:name:save", {
                sender: this,
                success: function () {
                  self._toggleEditMode(false, false);
                },
                error: function (error) {
                  var name_multilingual = _.clone(self.prevMultilingualVal);
                  self.setValue(currentValue);
                  self._toggleEditMode(true);
                  self.showInlineError(error);
                  self.saveMldata && self.model.set({name_multilingual: self.prevMultilingualVal});
                  name_multilingual && (self.prevMultilingualVal = _.clone(name_multilingual));
                }
              });
            }
          } else {
            this.clearInlineError();
            this._toggleEditMode(false, false);
          }
          this.saveMldata = '';
        },
        onKeyInView: function (event) {
          if (this.readonly) {
            return;
          }
          if (!!this.options.mode && this.options.mode === 'create') {
            var target = $(event.target);
            if (event.keyCode === 9 && this.$el.find('.csui-multilingual-icon').length) {
              ((event.shiftKey && target.is(this.ui.mlGlobeIcon)) || (target.is(this.ui.nameInput) && !event.shiftKey)) &&
              this.ItemNameBehavior.onKeyInView(event);
            }
            return true;
          }
          if (event.keyCode === 9 && event.shiftKey) {
            event.stopPropagation();
          }
          return this.ItemNameBehavior.onKeyInView(event);
        },

        _toggleEditMode: function (edit, setFocus) {
          if (this.options.mode != 'create') {
            return this.ItemNameBehavior._toggleEditMode(edit, setFocus);
          }
        },

        getValue: function () {
          return this.ItemNameBehavior.getValue();
        },

        setValue: function (value) {
          return this.ItemNameBehavior.setValue(value);
        },

        getInputBoxValue: function () {
          return this.ItemNameBehavior.getInputBoxValue();
        },

        setInputBoxValue: function (value) {
          return this.ItemNameBehavior.setInputBoxValue(value);
        },

        validate: function (iName) {
          return this.ItemNameBehavior.validate(iName);
        },

        setEditModeFocus: function () {
          return this.ItemNameBehavior.setEditModeFocus();
        },

        showInlineError: function (error) {
          var errorTxt = error;
          if (error instanceof Object) {
            errorTxt = this._getErrorMessageFromResponse(error);
          }
          return this.ItemNameBehavior.showInlineError(errorTxt);
        },

        clearInlineError: function () {
          return this.ItemNameBehavior.clearInlineError();
        },

        _getErrorMessageFromResponse: function (err) {
          return this.ItemNameBehavior._getErrorMessageFromResponse(err);
        },
        setReadOnly: function (mode) {
          mode = mode ? true : false;
          var focus;
          if ((this.readonly ? true : false) !== mode) {
            this.readonly = mode;
            this.render();
            focus = $(this.ui.nameInput).is(":focus");
            this._toggleEditMode(focus || this.modelHasEmptyName || false, false);
            this.validate();
          } else {
            focus = $(this.ui.nameInput).is(":focus");
            if (!focus) {
              this.validate();
            }
          }
        },

        setPlaceHolder: function (placeHolderName) {
          placeHolderName || (placeHolderName = lang.addItemPlaceHolderName);
          if (this.placeHolderName !== placeHolderName) {
            this.placeHolderName = placeHolderName;
            this.render();
          }
        },

        updateNameSchema: function (nameSchema) {
          if (this.modelHasEmptyName && this.ui.nameInput.val() === "" && !nameSchema.readonly) {
            nameSchema.required = true;
          }
          this._nameSchema = _.extend({
            required: true,
            readonly: false
          }, nameSchema);
          this.readonly = this._nameSchema.readonly;
          this.render();
          this.ui.nameInput[0].placeholder = this.placeHolderName;
          var focus = $(this.ui.nameInput).is(":focus");
          this._toggleEditMode(focus || this.modelHasEmptyName || false, false);
          return this.ItemNameBehavior.updateNameSchema(nameSchema);
        },

    onKeyDownGlobeIcon: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
      this.multiLingualForm && this.keyDownOnGlobeIcon(event);
      }
    },

   onClickGlobeIcon: function () {
     this._showLanguagePopover();
    }

      }
  );

  _.extend(MetadataItemNameView.prototype, ViewEventsPropagationMixin);

  return MetadataItemNameView;

});
