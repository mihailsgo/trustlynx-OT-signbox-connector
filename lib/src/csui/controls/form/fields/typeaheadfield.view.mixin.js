/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module', 'csui/utils/log',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/utils/contexts/factories/connector',
  'csui/utils/base',
  'csui/utils/nodesprites',
  'csui/controls/form/impl/fields/csformfield.view',
  'csui/controls/typeaheadpicker/typeaheadpicker.view',
  'csui/controls/node-type.icon/node-type.icon.item.view.mixin',
  'hbs!csui/controls/form/impl/fields/typeaheadfield/typeaheadfield',
  'i18n!csui/controls/form/impl/nls/lang',
  'css!csui/controls/form/impl/fields/typeaheadfield/typeaheadfield',
  'csui/lib/jquery.binary.ajax'
], function (module, Log, _, $, Backbone, ConnectorFactory, base, 
  nodeSpriteCollection,
  FormFieldView, TypeaheadPickerView, NodeTypeIconItemViewMixin, itemTemplate, lang) {

  var log = new Log(module.id);

  function elementToString(element){
    var outstr = element.localName;
    outstr += element.id ? '#'+element.id : '';
    outstr += element.className ? '.'+element.className.replace(/ /g,'.') : '';
    return outstr;
  }

  var TypeaheadFieldViewMixin = {
    mixin: function (prototype) {

      var original = _.extend({},prototype);

      NodeTypeIconItemViewMixin.mixin(prototype);

      return _.extend(prototype, {

        makeTypeaheadFieldView: function (options) {
          this.connector = this.options.context.getObject(ConnectorFactory);
          this.dropdownMenuVisible = false;
          if (options.css && options.css.root) {
            this.className = options.css.root;
          }
          this.makeNodeTypeIconItemView();
        },

        ui: {
          readField: '.cs-field-read-content', // There is no button input class in hbs
          readFieldInner: '.cs-field-read-inner',
          pickerContainer: '.picker-container',
          writeField: '.picker-container input',
          readArea: '.cs-field-read',
          fieldPicture: '.cs-field-picture',
          customImage: '.cs-field-picture.csui-custom-image',
          defaultIcon: '.cs-field-picture.csui-default-icon',
          itemName: '.csui-typeahead-container',
          cancelIcon: '.edit-cancel',
          readContentArea: '.cs-field-read-content',
          itemDisplayName: '.cs-name .csui-typeahead-container'
        },

        events: function () {
          var ret = base.isTouchBrowser() ? {} : {
            'mouseover @ui.customImage': 'showItemInfoPopup',
            'mouseover @ui.defaultIcon': 'showItemInfoPopup',
            'mouseover @ui.itemDisplayName': 'showItemInfoPopup',
            'mouseleave @ui.customImage': 'removeUnderline',
            'mouseleave @ui.defaultIcon': 'removeUnderline',
            'mouseleave @ui.itemDisplayName': 'removeUnderline',
            'focusout @ui.itemDisplayName': 'removeUnderline',
            'click @ui.itemDisplayName': 'showItemProfileDialog'
          };

          if (base.isTouchBrowser() && !!this.model.get("schema").readonly) {
            _.extend(ret, {
              'click @ui.itemDisplayName': 'showItemProfileDialog'
            });
          }

          _.extend(ret, {
            'click @ui.customImage': 'showItemProfileDialog',
            'click @ui.defaultIcon': 'showItemProfileDialog',
            'keyup': 'onKeyUp',
            'keydown': 'onKeyDown',
            'click @ui.cancelIcon': 'onCancelClicked',
            'focusout @ui.writeField': 'onFocusOutWrite',
            'mousedown': 'onMouseDown',
            'click': 'onClick'
          });

          return ret;
        },

        onRender: function () {

          if (!this.ui.itemName.hasClass('csui-hovering')) {
            this.ui.itemName.addClass("cs-no-hover csui-hovering");
          }

          this.data = this.model.get('data');
          this.editValue = this.data;
          this.curVal = this.editValue;

          this.placeHolderText = (this.options.alpacaField &&
            this.options.alpacaField.schema.disabled) ?
              lang.noValueSet :
              (this.alpacaField && this.alpacaField.schema &&
                !!this.alpacaField.schema.placeholder) ?
              this.alpacaField.schema.placeholder :
              (this.options.lang&&this.options.lang.alpacaPlaceholder) || lang.alpacaPlaceholderGeneric;

          var ariaLabel = "";
          if (this.alpacaField && this.alpacaField.options &&
              this.alpacaField.options.isMultiFieldItem) {
            ariaLabel = (this.alpacaField.parent && this.alpacaField.parent.options) ?
                        this.alpacaField.parent.options.label : "";
          } else if (this.alpacaField && this.alpacaField.options) {
            ariaLabel = this.alpacaField.options.label ? this.alpacaField.options.label : "";
          }

          var PickerView = this.options.TypeaheadPickerView || TypeaheadPickerView;
          this.pickerView = new PickerView($.extend({
            context: this.options.context,
            placeholder: this.placeHolderText,
            prettyScrolling: true,
            limit: 20,
            id: _.uniqueId(this.model.get('id')),
            id_input: this.model.get('id'),
            ariaLabel: ariaLabel,
            isRequired: this.options.alpacaField && this.options.alpacaField.isRequired(),
            descriptionId: this.options ? this.options.descriptionId : '',
            lang: this.options.lang
          },this.options.pickerOptions||{}));

          var self = this;
          this.listenTo(this.pickerView, 'item:clear', function () {
            if (!self.$el.hasClass('cs-userfield')){
              self.onItemClear();
            }
          });
          this.listenTo(this.pickerView, 'item:change', this.onItemChange);
          this.listenTo(this.pickerView, 'typeahead:picker:open', this.onItemPickerOpen);
          this.listenTo(this.pickerView, 'typeahead:picker:close', this.onItemPickerClose);
          this.listenTo(this.pickerView, 'render', this.disableField);
          this.setItemPicked(true);
          this.dialogOpen = false;

          this.ui.pickerContainer.append(this.pickerView.$el);
          this.ui.writeField = this.$el.find('.picker-container input');
          this.getEditableBehavior().ui.writeField = this.ui.writeField;

          if (this.data.id && (this.options.noID===undefined || this.data.id !== this.options.noID)) {
            this.pickerView.model.set(this.data);  // write field

            this._keyboardNavigationNotification();

          }
          this.pickerView.render();
        },

        attachElContent: function() {
          var result = original.attachElContent.apply(this,arguments);
          var data = this.model.get('data');
          if (data.id && (this.options.noID===undefined || data.id !== this.options.noID)) {
            var targetElement = this.$('.field-picture');
            var iconClasses = this.options.css && this.options.css.defaultIcon || 'csui-icon csui-initials image_typeahead_placeholder';
            var imageClasses = this.options.css && this.options.css.customImage || 'binf-img-circle';
            iconClasses += ' cs-field-picture csui-default-icon csui-typeahead-icon-' + data.id;
            imageClasses += ' cs-field-picture csui-custom-image csui-typeahead-image-' + data.id;
            var node = new Backbone.Model(data);
            node.imageAttribute = this.model.imageAttribute;
            node.nameAttribute = this.model.nameAttribute;
            node.connector = this.connector;
            var options ={};
            if ((" "+iconClasses+" ").indexOf(" csui-initials ")<0 && (" "+iconClasses+" ").indexOf(" csui-nodesprites ")<0) {
              options.nodeSprite = new nodeSpriteCollection.model({ className: iconClasses });
            }
            this.renderNodeTypeIconView(node,targetElement,iconClasses,imageClasses,options);
          }
          return result;
        },

        disableField: function (e) {
          this.ui.pickerContainer.append(this.pickerView.$el);
          this.ui.writeField = this.$el.find('.picker-container input');
          this.getEditableBehavior().ui.writeField = this.ui.writeField;
          this.trigger("disable:field");
        },

        onItemPickerOpen: function (e) {
          this.options.isDropDownOpen = true;
          var scrollableCols = this.$el.closest('.csui-scrollable-writemode');
          if (!!scrollableCols && !scrollableCols.hasClass('csui-dropdown-open')) {
            scrollableCols.addClass('csui-dropdown-open');
          }
          if (!!this.getEditableBehavior().hideActions) {
            this.getEditableBehavior().hideActions(e);
          }
        },

        onItemPickerClose: function (e) {
          this.options.isDropDownOpen = false;
          var scrollableCols = this.$el.closest('.csui-scrollable-writemode');
          if (!!scrollableCols && scrollableCols.hasClass('csui-dropdown-open')) {
            scrollableCols.removeClass('csui-dropdown-open');
          }
          if (!!this.getEditableBehavior().showActions) {
            this.getEditableBehavior().showActions(e);
          }
        },

        removeUnderline: function (e) {
          if (this.options.noID!==undefined && this.data.id === this.options.noID) {
            return;
          }
          this.ui.fieldPicture.removeClass("cs-hover");
          this.ui.itemName.removeClass("cs-hover").addClass("cs-no-hover");
        },

        showItemProfileDialog: function (e) {
          if ((this.options.noID!==undefined && this.data.id === this.options.noID) || this.options.isInPopover) {
            return;
          } else {
            e.preventDefault();
            e.stopPropagation();
            if (this.getItemWidget()) {
              this.dialogOpen = true;
              this.showItemProfileDialogWidget(e);
            } else {
              this.createItemWidget('showItemProfileDialog', e);
            }
          }

        },

        showItemProfileDialogWidget: function(e) {
          this.ui.fieldPicture.addClass("cs-hover");
          this.ui.itemName.removeClass("cs-no-hover").addClass("cs-hover");
          this.getItemWidget().closeItemInfoPopup(e);
          this.getItemWidget().showItemProfileDialog(e);
        },

        showItemInfoPopup: function (e) {
          this.options.isInPopover = this.$el.closest('.csui-colout-formitems').length > 0;
          if ((this.options.noID!==undefined && this.data.id === this.options.noID) || this.options.isInPopover) {
            return;
          } else {
            if (this.getItemWidget()) {
              this.showItemInfoPopupWidget(e);
            } else {
              this.createItemWidget('showItemInfoPopup', e);
            }
          }
        },

        showItemInfoPopupWidget: function(e) {
          this.ui.fieldPicture.addClass("cs-hover");
          this.ui.itemName.removeClass("cs-no-hover").addClass("cs-hover");
          this.getItemWidget().showItemInfoPopup(e);
        },

        createItemWidget: function (methodName, e) {
          if (this.options.createItemWidgetView) {
            var miniProfileEl = this.$el.find('.csui-typeahead-container');
            this.options.createItemWidgetView.call(this,_.bind(function(itemWidgetView){
              this.setItemWidget(itemWidgetView);
              clearTimeout(this.getItemWidget().profileTimer);
              var profileTimer = setTimeout(_.bind(function () {
                miniProfileEl.binf_popover('show');
                this[methodName](e);
              }, this, e), 500);
              this.getItemWidget().profileTimer = profileTimer;
              this[methodName](e);
            },this));
          }
        },

        setItemWidget: function(view) {
          this.itemWidgetView = view;
        },

        getItemWidget: function() {
          return this.itemWidgetView;
        },

        setItemPicked: function(state) {
          this.itemPicked = state;
        },

        getItemPicked: function() {
          return this.itemPicked;
        },
        onCancelClicked: function (e) {
          this.setItemPicked(true);
        },

        allowEditOnClickReadArea: function (e) {
          var canChangeToEditMode = !(this.mode !== 'readonly' && !!this.dialogOpen);
          this.dialogOpen = false;
          return canChangeToEditMode || (true/*!this._isItemWidgetEnabled*/ || !this.model.get('data').id);
        },

        className: 'cs-formfield cs-typeaheadfield',
        template: itemTemplate,

        templateHelpers: function () {
          var multiFieldLabel = "",
              isRequired      = this.options.alpacaField && this.options.alpacaField.isRequired(),
              requiredTxt     = "",
              labelName       = "",
              isReadOnly      = false,
              noName          = "";

          requiredTxt = isRequired ? lang.requiredField : "";
          isReadOnly = this.model && this.model.attributes && this.model.attributes.schema &&
                      this.model.attributes.schema.readonly;
          if (this.alpacaField && this.alpacaField.options &&
              this.alpacaField.options.isMultiFieldItem) {
            multiFieldLabel = (this.alpacaField.parent && this.alpacaField.parent.options) ?
                              this.alpacaField.parent.options.label : "";
            isReadOnly = this.alpacaField.parent.options.readonly;
          }
          labelName = multiFieldLabel ? multiFieldLabel :
                      this.model.get('options') && this.model.get('options').label;

          var currentModelData = this.model.get('data'),
              displayName      = (this.options.noId !== undefined && currentModelData.id === this.options.noId)
                                  ? (this.options.lang && this.options.lang.noItem || lang.noValue)
                                  : (currentModelData.display_name || currentModelData.name_formatted),
              displayName2Use  = displayName ? displayName : lang.noValue,
              editModeAria     = _.str.sformat(lang.fieldEditAria, labelName, displayName2Use) +
                                requiredTxt,
              readModeAria     = displayName
                                  ? _.str.sformat(this.options.lang&&this.options.lang.fieldReadOnlyAria||lang.fieldReadOnlyAria,
                                      labelName, displayName2Use) + requiredTxt
                                  : _.str.sformat(this.options.lang&&this.options.lang.emptyFieldReadOnlyAria||lang.fieldReadOnlyAria,
                                      labelName,displayName2Use) + requiredTxt,
              data             = {
                name: displayName,
                isTouch: base.isTouchBrowser(),
                idBtnLabel: this.options.labelId,
                applyFlag: this.options.applyFlag,
                multiFieldLabel: multiFieldLabel,
                readModeAria: readModeAria,
                editModeAria: isReadOnly ? readModeAria : editModeAria,
                noName: isReadOnly ? readModeAria : editModeAria,
                ariaRequired: isRequired,
                imageUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
                cssItemName: this.options.css && this.options.css.itemName || 'cs-no-hover csui-hovering',
                cssCustomImage: this.options.css && this.options.css.customImage || 'binf-img-circle',
                cssDefaultIcon: this.options.css && this.options.css.defaultIcon || 'csui-icon csui-initials image_typeahead_placeholder'
              };

          var ret = _.extend(FormFieldView.prototype.templateHelpers.apply(this), data);
          return ret;
        },

        formatItemName: function(data) {
          return this.options.formatItemName ? this.options.formatItemName(data) : base.formatMemberName(data);
        },

        setStateWrite: function (validate, focus, prevState) {
          var that = this;
          var data = (this.mode === 'writeonly') ? this.getEditValue() :
                    ( ( prevState === 'read' ) ? this.model.get('data') : this.getEditValue() );
          this.pickerView.model.set(_.extend(data, {
            display_name: this.formatItemName(data)
          }));
          this.pickerView.render();
          this.getStatesBehavior()._setStateWrite(validate, focus);
          focus && that.$('.picker-container input').trigger('focus').trigger('select');
          this.editValue = data;
          return true; // we did all
        },

        isReadyToSave: function () {
          var $dropdown = this.$('.typeahead.binf-dropdown-menu'),
              bRet      = ($dropdown.length === 0 || !$dropdown.is(':visible'));
          return bRet && this.getItemPicked();
        },

        onItemChange: function (args) {
          log.debug('typeaheadFieldViewMixin item change') && console.log(log.last);
          this.editValue = args.item.attributes;
          this.setItemPicked(true);
          if (!!this.getEditableBehavior().showActions) {
            this.getEditableBehavior().showActions(this);
          }
          this.options.isDropDownOpen = false;
          this.trigger('selection:changed');
        },

        getEditValue: function () {
          var fieldValue = this.pickerView.$el.find('input').val();
          if (!fieldValue) {
            this.editValue = {display_name: "", id: null, name: ""};
          }

          if (this.getItemPicked()) {
            this.pickerView.$el.find('input').val(this.formatItemName(this.editValue));
          }

          return this.editValue;
        },

        _getChangeValue: function () {
          return this.model.get('data').id;
        },

        _keyboardNavigationNotification: function () {
          if (this.options.model && this.options.model.attributes.options &&
              this.options.model.attributes.options.mode === 'create') {
            setTimeout(_.bind(function () {
              var event = $.Event('tab:content:field:changed');
              this.$el.trigger(event);
            }, this), 300);
          }
        },

        getDisplayValue: function () {
          return this.getEditValue().name;
        },

        onDestroy: function () {
          if (this.pickerView) {
            this.pickerView.destroy();
          }
        },

        _getChangeEventValue: function () {
          var ret = this.getValue().id;
          return ret;
        },

        onKeyPress: function (event) {
          if (event.keyCode === 13) { // enter:13
            event.preventDefault();
            event.stopPropagation();
            if (this.getStatesBehavior().isStateRead() && this.allowEditOnEnter()) {
              this.getEditableBehavior().setViewStateWriteAndEnterEditMode();
            } else if (this.getStatesBehavior().isStateWrite() && this.allowSaveOnEnter()) {
              this.getEditableBehavior().trySetValueAndLeaveEditMode(true, true);
            }
          } else if (event.keyCode === 32) {
            if (this.getStatesBehavior().isStateRead() && this.allowEditOnEnter()) {
              event.preventDefault();
              event.stopPropagation();
              this.getEditableBehavior().setViewStateWriteAndEnterEditMode();
            }
          }
          if (event.keyCode === 13 || event.keyCode === 9 || event.keyCode === 16) {
            if (this.alpacaField && this.alpacaField.refreshValidationState) {
              this.alpacaField.refreshValidationState(false);
            }
          } else {
            this.setItemPicked(false);
          }
          return true; // we handle it
        },

        onKeyDown: function (event) {
          if (event.keyCode === 27) {
            this.dropdownMenuVisible = this.options.isDropDownOpen;
            this.onItemPickerClose(event);
            event.preventDefault();
          } else if (event.keyCode === 13 || event.keyCode === 32) {
            if ($(event.target).hasClass('csui-typeahead-container')) {
              this.showItemProfileDialog(event);
            }
            if (this.alpacaField) {
              this.alpacaField.keyDown = true;
            }
          }
        },
        onKeyUp: function (event) {
          if (event.keyCode === 13) { // enter:13
            if (this.alpacaField && this.alpacaField.refreshValidationState &&
                !!this.alpacaField.keyDown) {
              var that = this;
              this.alpacaField.refreshValidationState(false, function(){
                if(that.alpacaField.field.hasClass('alpaca-invalid')){
                  that.alpacaField.fieldView.$el.find('input.typeahead').select();
                }
              });
            }
            if (this.alpacaField) {
              this.alpacaField.keyDown = false;
            }
          } else if (event.keyCode === 8 || event.keyCode === 46) {
            if (event.target.value === '') {
              this.setItemPicked(true);
              if (this.mode === 'writeonly') {
                this.model.attributes.data = "";
              }
              if (!!this.getEditableBehavior().showActions) {
                this.getEditableBehavior().showActions(event);
              }
              this.options.isDropDownOpen = false;
            } else {
              this.setItemPicked(false);
            }
          } else if (event.keyCode === 27) { //escape:27
            if (this.dropdownMenuVisible) {
              event.preventDefault();
              event.stopPropagation();
            }
            this.dropdownMenuVisible = false;
          }

          this.setItemWidget('');
        },

        handleTabKey: function (event) {
          if (!!this.options.isDropDownOpen) {
            this.pickerView.trigger('typeahead:picker:close', event);
            event.preventDefault();
            event.stopPropagation();
          }
        },
        onMouseDown: function (event) {
          var outobj = { toString: function() { return elementToString(event.target); } };
          if (this._isInPicker(event.target,"input.cs-search, .csui-typeahead-picker-no-results")) {
            log.debug('typeaheadFieldViewMixin stop mousedown at {0}',outobj) && console.log(log.last);
            event.preventDefault();
            event.stopPropagation();
          } else {
            log.debug('typeaheadFieldViewMixin mousedown at {0}',outobj) && console.log(log.last);
          }
        },

        onClick: function( event ) {
          var outobj = { toString: function() { return elementToString(event.target); } };
          if (this._isInPicker(event.target,"input.cs-search, .cs-search-clear, .cs-search-icon, .csui-typeahead-picker-no-results")) {
            log.debug('typeaheadFieldViewMixin refresh on click at {0}',outobj) && console.log(log.last);
            this.alpacaField && this.alpacaField.refreshValidationState(false);
          } else {
            log.debug('typeaheadFieldViewMixin click at {0}',outobj) && console.log(log.last);
          }
        },

        _isInPicker: function( element, excluded ) {
          var picker = this.pickerView.$(".cs-item-picker");
          if (picker[0] && $.contains(picker[0],element)) {
            if (excluded) {
              if ($(element).is(excluded)) {
                return false;
              }
              if (_.some(picker.find(excluded),function(control){
                return $.contains(control,element);
              })) {
                return false;
              }
            }
            return true;
          }
          return false;
        },

        onItemClear: function() {
          log.debug('typeaheadFieldViewMixin item clear') && console.log(log.last);
          this.$el.parents('.binf-form-group.alpaca-field').removeClass('binf-has-error alpaca-invalid');
          this.$el.removeClass('cs-formfield-invalid');
          this.alpacaField && this.alpacaField.displayMessage();
          this.setItemPicked(true);
          this.getEditableBehavior().trySetValue();
          this.alpacaField && this.alpacaField.refreshValidationState(false);
        }
      
      });
    }
  };
    
  return TypeaheadFieldViewMixin;
});
