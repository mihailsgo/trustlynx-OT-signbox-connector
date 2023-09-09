/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
      'module',
      'require',
      "csui/lib/underscore",
      "csui/lib/jquery",
      "csui/utils/url",
      "csui/utils/base"
    ],
    function (module, require, _, $, Url, base) {
      "use strict";

      var config = module.config();

      _.defaults(config, {
        PopoverFormView: 'csui/controls/multilingual.text.picker/impl/multilingual.form.view'
      });

      var MultiLingualPopoverMixin = {
        mixin: function (prototype) {
          return _.extend(prototype, {
            multiLingualForm: "",
            _loadMultiLingualPopover: function (options) {
              var self = this;
              this.targetElement = options.targetElement;
              self.mlOptions = options;
              var clonedObject = JSON.parse(
                  JSON.stringify(self.metadataLanguages.languages)
              );
              this._updatePrevobeject(clonedObject);
              this.mlGlobeIcon = options.mlGlobeIcon;
              _.defaults(options, {
                valueRequired: true,
                isTextAreaField: false,
                changetoReadmodeOnclose: false
              });
              this.changetoReadmodeFlag = options.changetoReadmodeOnclose;
              var pickerOptions = {
                data: clonedObject,
                popoverTargetElement: self.targetElement,
                valueRequired: options.validationRequired,
                mlGlobeIcon: options.mlGlobeIcon,
                parentView: self,
                textField: !options.isTextAreaField,
                changetoReadmodeOnclose: options.changetoReadmodeOnclose
              };

              require([config.PopoverFormView], function (PopoverFormView) {
                self.multiLingualForm = new PopoverFormView(pickerOptions);
                self._isReadyToSave = true;
                self.trigger('multiLingualForm:isReady');
                if (self.changetoReadmodeFlag) {
                  self.stopListening(self.multiLingualForm, 'ml:close:writeMode')
                      .listenTo(self.multiLingualForm, 'ml:close:writeMode', function () {
                        self.trigger('ml:close:writeMode');
                      });
                }

              });
              self.model.get("id") !== undefined &&
              self.mode !== "writeonly" && self.disableElement(clonedObject);
              self._isReadyToSave = true;
            },

            _updatePrevobeject: function (langObject) {
              var self = this,
                  multilingual_data = self.mlOptions.multilingualData;
              if (_.isObject(multilingual_data)) {
                _.each(langObject, function (language) {
                  language.value = multilingual_data[language.language_code] || '';
                });
              }
              self.prevObject = JSON.parse(
                  JSON.stringify(langObject)
              );
            },
            _showLanguagePopover: function () {
              var self = this, parent = self.$el;
              if (!self._isReadyToSave) {
                this.multiLingualForm && this.multiLingualForm.trigger('ml:hide:popover');
                return;
              }
              if (!parent.find('.csui-edit-save').length) {
                parent = self.$el.parents('.csui-inline-editform');
              }
              this._updatePrevobeject(this.prevObject);
              parent.addClass('csui-multilingual-greyout');
              self._isReadyToSave = false;
              this.multiLingualForm && this.multiLingualForm.trigger('ml:show:popover');
              this.stopListening(this.multiLingualForm, 'ml:doneWith:popover')
                  .listenTo(this.multiLingualForm, 'ml:doneWith:popover', _.bind(function (data) {
                    data && this._handlePickerSuccess(data);
                    parent.removeClass('csui-multilingual-greyout');
                    self._isReadyToSave = true;
                    self.mlOptions.popoverClosed = true;
                  }, this));

            },

            _handlePickerSuccess: function (data) {
              var self = this;
              this.editVal = "";
              var multiLang = {};
              _.each(data, function (lang) {
                multiLang[lang.language_code] = lang.value;
                if (!self.editVal) {
                  self.editVal = lang.value;
                }
              });
              this.disableElement(data);
              if (!this.isEqualObjects(this.prevObject, data)) {
                this.trigger("ml:value:updated", {
                  value_multilingual: multiLang,
                  value: this.editVal
                });
                this.mlOptions.multilingualData = multiLang;
              } else {
                this.changetoReadmodeFlag && this.trigger("ml:close:writeMode");
              }
            },

            requiredInfoAvilable: function (key) {
              var _deferred = $.Deferred();
              if (this.model.get(key) || !this.model.get("id")) {
                _deferred.resolve();
              } else {
                var node = this.model,
                    id = node.get("id"),
                    connector = node.connector ? node.connector : this.options.connector,
                    fullUrl = Url.combine(
                        connector.getConnectionUrl().getApiBase("v2"),
                        "/nodes/" + id +
                        "/properties"
                    ),
                    ajaxOptions = {
                      type: "GET",
                      url: fullUrl
                    };

                connector.makeAjaxCall(ajaxOptions).done(
                    _.bind(function (resp) {
                      var response = resp.results.data.properties,
                          obj = {
                            name: response.name,
                            description: response.description,
                            name_multilingual: response.name_multilingual,
                            description_multilingual: response.description_multilingual
                          };
                      response[key] && (obj[key] = response[key]);
                      node.set(obj,
                          {silent: true}
                      );
                      _deferred.resolve(resp);
                    }, this)
                ).fail(function (err) {
                  _deferred.reject(err);
                });
              }

              return _deferred.promise();
            },

            disableElement: function (data) {
              var userMetadata_Language_code = base.getUserMetadataLanguageInfo(),
                defaultLang = _.find(data, {
                  language_code: userMetadata_Language_code
                }),
                anyValue = _.find(data, function (item) {
                  return item.value !== '';
                });
              this.targetElement.prop("disabled", false);
              this.targetElement.removeClass("mlDisabled");
              if (defaultLang && defaultLang.value === "" && anyValue) {
                this._isReadyToSave = true;
                this.targetElement.prop("disabled", true);
                this.targetElement.addClass("mlDisabled");
                this.mlOptions.popoverClosed= false;
              }
            },

            isEqualObjects: function (prevObj, data) {
              var equalObjects = true;
              _.each(data, function (language) {
                if (language.value ===
                    _.findWhere(prevObj, {language_code: language.language_code}).value) {
                  equalObjects = equalObjects && true;
                } else {
                  equalObjects = false;
                }
              });
              return equalObjects;
            },

            keyDownOnGlobeIcon: function (event) {
              switch (event.keyCode) {
              case 13: // ENTER
              case 32: // SPACE
                this.mlGlobeIcon.prop('ariaExpanded', true);
                this._showLanguagePopover();
                event.preventDefault();
                event.stopPropagation();
                break;
              case 27: // ESCAPE
                if (this.multiLingualForm) {
                  this.multiLingualForm && this.multiLingualForm.trigger('ml:hide:popover');
                  event.preventDefault();
                  event.stopPropagation();
                }
                break;
              }
            },
            _openMLFlyoutInEditMode: function () {
              var metadataLangInfo = base.getMetadataLanguageInfo();
              if (metadataLangInfo.enabled) {
                var defaultLang = metadataLangInfo.defaultLanguage,
                    userMetadataLang = base.getUserMetadataLanguageInfo(),
                    multilingual_data = this.mlOptions.multilingualData,
                    multiLang_values_available = _.values(multilingual_data).filter(
                        function (LangVal) {
                          return !!LangVal;
                        }).length >= 2;

                if (multilingual_data && (!multilingual_data[userMetadataLang]
                                          || multiLang_values_available)) {
                  if (this.multiLingualForm) {
                    this.targetElement.addClass("mlDisabled");
                    this._showLanguagePopover();
                    this.targetElement.prop("disabled", true);
                  } else {
                    this.listenToOnce(this, 'multiLingualForm:isReady',
                        this._showLanguagePopover);
                  }

                }
              }
            },
            updateMLdata: function (event) {
              var textFieldvalue = event && event.target.value,
                  userMetadataLang = base.getUserMetadataLanguageInfo(),
                  multilingual = this.mlOptions.multilingualData;
              multilingual && (multilingual[userMetadataLang] = textFieldvalue);
            }
          });
        }
      };
      return MultiLingualPopoverMixin;
    });
