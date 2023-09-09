/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  "csui/lib/jquery",
  "csui/lib/underscore",
  'csui/lib/backbone',
  "csui/lib/marionette3",
  "csui/utils/base",
  "csui/utils/log",
  'csui/lib/jsonpath',
  'csui/models/nodes',
  'csui/models/nodecreateforms',
  'csui/utils/commands/add.item.metadata',
  'csui/controls/table/inlineforms/base/views/textfield/textfield.view',
  'csui/controls/table/inlineforms/base/views/textfield/multilingual.textfield.view',
  'csui/controls/table/inlineforms/base/views/selectfield/selectfield.view'
], function ($, _, Backbone, Marionette, base, log, jsonPath, NodeCollection,
    NodeCreateFormCollection, AddItemMetadataCommand, TextFieldView, MultilingualTextFieldView,
    SelectFieldView) {

  var InlineFormView = Marionette.CollectionView.extend({

        className: 'csui-inlineform-field-container',

        childView: function (options) {
          var view, type = options.get('type') || '';
          switch (type) {
          case 'text':
            view = TextFieldView;
            break;
          case 'multilingualtextfield':
            view = MultilingualTextFieldView;
            break;
          case 'select':
            view = SelectFieldView;
            break;
          default:
            view = TextFieldView;
          }
          return view;
        },

        childViewOptions: function () {
          return {
            context: this.options.context,
            formType: this.options.model.get('type'),
            regExp: this.options.model.get('regex'),
            node: this.options.node,
            options: this.options,
            parentView: this
          };

        },

        constructor: function InlineFormView(options) {
          options = options || {};
          options.collection = new Backbone.Collection(
              this.getFieldModels(options));
          Marionette.CollectionView.prototype.constructor.apply(this, arguments);
        },

        onRender: function () {
          this.listenTo(this, 'save:form', this._saveForm);
        },
        checkAllformFields: function () {
          return !!this.model.get('id') ? this.collection.findIndex({validField: true}) !== -1 :
                 this.collection.findIndex({validField: false}) === -1;
        },

        _saveIfOk: function () {
          var canFormSave = true, attributes = {},
              isThumbnailView                = this.options.originatingView &&
                                               this.options.originatingView.thumbnailView,
              psContainer                    = isThumbnailView && this.$el.closest('.csui-perfect-scrolling');
          this.children.each(function (fieldView) {
            var fieldModel      = fieldView.model,
                multiLingualKey = fieldModel.get('fieldName') + '_multilingual';
            canFormSave = canFormSave && fieldView.isReadyToSave();
            attributes[fieldModel.get('fieldName')] = fieldModel.get('value');
            if (fieldModel.get('type') === 'multilingualtextfield' &&
                fieldModel.attributes[multiLingualKey]) {
              attributes[multiLingualKey] = fieldModel.get(multiLingualKey);
            }
          });

          if (canFormSave) {
            this._save(attributes).fail(function (resp) {
              this.model.set(this.model.changed, {silent: true}); // handle me
              psContainer && psContainer.perfectScrollbar('update');
            }.bind(this));
          }
        },

        _getErrorMessageFromResponse: function (err) {
          var errorMessage;
          if (err && err.responseJSON && err.responseJSON.error) {
            errorMessage = err.responseJSON.error;
          } else {
            var errorHtml = base.MessageHelper.toHtml();
            base.MessageHelper.reset();
            errorMessage = $(errorHtml).text();
          }
          return errorMessage;
        },

        _saveForm: function () {
          if (!!this.model.get("id")) {
            this._saveIfOk();
          } else { // in create mode
            var self = this;
            self.required = false;
            self._getCategoryID().done(function () { // return true if required fields found in container
              if (self.required) {
                self._openMetadataPage();
              } else {
                self._saveIfOk();
              }
            });
          }
        },
        viewToModelData: function () {
          this.children.each(_.bind(function (fieldView) {
            this.model.set(fieldView.model.get('fieldName'), fieldView.model.get('value'),
                {silent: true});
          }, this));
        },

        _removeLastElement: function () {
          if (this.model.collection && this.model.collection.length > 0 &&
              this.model.collection.length > this.model.collection.topCount) {
            this.model.collection.isPoped = true;
            this.model.collection.pop();
          }
        },

        _getCategoryID: function () {
          var self           = this,
              nId            = self.options.model.collection.node.get('id'),
              type           = this.model.get('type'),
              connector      = self.options.model.connector,
              deferredObject = $.Deferred(),
              createForms    = new NodeCreateFormCollection(undefined, {
                node: this.model,
                docParentId: nId,
                type: type
              });
          this.xhr = this.model.get('xhr') || new XMLHttpRequest();
          createForms.fetch().then(_.bind(function (resp, status, jqXHR) {
            _.any(resp["forms"], function (form) {
              if (form.hasOwnProperty('role_name')) {
                var requiredFilled = self._checkForAlpacaRequiredFields(form),
                    reqFields      = jsonPath(form.schema.properties, "$..[?(@.required===true)]");
                if (_.isArray(reqFields) && reqFields.length > 0 && !requiredFilled) {
                  self.required = true;
                }
              }
            });

            self.model.attributes.forms = resp;
            self.model.attributes.xhr = this.xhr;

            deferredObject.resolve();
          })).fail(function (resp) {
            deferredObject.reject();
          });
          return deferredObject.promise();
        },

        _save: function (attributes) {

          var blockableView = this.options.originatingView;
          if (blockableView && blockableView.blockActions) {
            blockableView.blockActions();
          }
          var method  = this.model.get('id') === undefined ?
                        '_saveNewModel' : '_updateModel',
              promise = this[method](attributes);
          if (blockableView && blockableView.unblockActions) {
            promise.always(_.bind(blockableView.unblockActions, blockableView));
          }
          promise.done(_.bind(function () {
            this.trigger('end:of:edit');
          }, this));
          return promise;
        },

        _checkForAlpacaRequiredFields: function (form) {
          var valid             = true,
              data              = form.data || form.get('data'),
              options           = form.options || form.get('options'),
              schema            = form.schema || form.get('schema'),
              reqArray          = [],
              requiredFields    = jsonPath(schema, "$..[?(@.required===true)]", {resultType: "PATH"}),
              nonValidateFields = jsonPath(options, "$..[?(@.validate===false)]", {resultType: "PATH"});
          var nonValidateFieldsIds = [];
          _.each(nonValidateFields, function (nvField) {
            var matches = nvField.toString().match(/(\'[\w]*\')/g);
            if (!!matches) {
              nonValidateFieldsIds.push(matches[matches.length - 1].replace(/'/g, ""));
            }
          });
          var reqFieldId = [];
          _.each(requiredFields, function (reqField) {
            var matches = reqField.toString().match(/(\'[\w]*\')/g);
            if (!!matches) {
              reqFieldId.push(matches[matches.length - 1].replace(/'/g, ""));
            }
          });
          var removeNonValidateFields = function (nvFields, rFields) {
            var rFields_ = rFields.filter(function (n) {
              return nvFields.indexOf(n) === -1;
            });
            return rFields_;
          };

          var filteredRequiredFieldsIds = removeNonValidateFields(nonValidateFieldsIds, reqFieldId);

          if (!!filteredRequiredFieldsIds) {
            var nullCount = false;
            _.each(filteredRequiredFieldsIds, function (arrayElement) {
              reqArray = jsonPath(data, "$.." + arrayElement.toString(), {resultType: "PATH"}.toArray);
              _.each(reqArray, function (arrayElement) {
                var checkNull = function (element) {
                  if (element instanceof Array && (element !== null || element !== "")) {
                    _.each(element, function (childElement) {
                      checkNull(childElement);
                    });
                  } else if (element === null || element === "") {
                    nullCount = true;
                    return;
                  }
                };
                if (!nullCount) {
                  checkNull(arrayElement);
                } else {
                  valid = false;
                  return;
                }
              });
              if (nullCount) {
                valid = false;
                return;
              }
            });
          }

          return valid;
        },
        _saveNewModel: function (attributes) {
          var MN = '{0}:_saveNewModel {1}';
          var inlineForm = this.model.inlineFormView; // save in case the save fails
          delete this.model.inlineFormView; // let row render normally when model changes after save

          this.model.set(attributes, {silent: true});
          var data = _.clone(this.model.attributes);
          delete data.hasMetadataRow;
          delete data.csuiInlineFormErrorMessage;
          delete data.forms;
          delete data.xhr;
          var self = this;
          return this.model
              .save(undefined, {
                data: data,
                wait: true,
                silent: true
              })
              .then(function () {
                if (self.model.mustRefreshAfterPut !== false) {
                  self._removeLastElement();
                  return self.model.fetch();
                }
                self.model.set('csuiInlineFormErrorMessage', 'dummy', {silent: true});
                self.model.unset('csuiInlineFormErrorMessage'); // this lets the model be
              })
              .fail(function (err) {
                self.model.inlineFormView = inlineForm; // use the form again
                self.model.trigger('error', self.model); // need sync for blocking view

                var errorMessage = self._getErrorMessageFromResponse(err);
                self.model.set('csuiInlineFormErrorMessage', errorMessage);
                log.error('Saving failed. ', errorMessage) && console.error(log.last);
              });
        },

        _updateModel: function (attributes) {
          var MN = '{0}:_updateModel {1}';
          var inlineForm = this.model.inlineFormView; // save in case the sync fails
          delete this.model.inlineFormView; // let row render normally when model changes after save
          var data = this.model.mustRefreshAfterPut !== false ? attributes : undefined;
          var saveAttr = this.model.mustRefreshAfterPut !== false ? undefined : attributes;

          var self            = this,
              isThumbnailView = self.options.originatingView &&
                                self.options.originatingView.thumbnailView;
          return this.model
              .save(saveAttr, {
                data: data,
                patch: true,  // let form data be 'body:{"name":"Pictures"}' and uploadable
                wait: true,
                silent: true,
                skipSetValue: isThumbnailView // to stop re-rendering entire thumbnail item
              })
              .then(function () {
                self.model.set(attributes, {silent: true});
                if (self.model.mustRefreshAfterPut !== false) {
                  return self.model.fetch();
                }
                self.model.set('csuiInlineFormErrorMessage', 'dummy', {silent: true});
                self.model.unset('csuiInlineFormErrorMessage'); // this lets the model be
              })
              .fail(function (err) {
                self.model.inlineFormView = inlineForm; // use the form again
                var attributeKeys = _.keys(attributes);
                var cloneAttributes = _.pick(_.clone(self.model.attributes), attributeKeys);
                self.model.set(attributes, {silent: true});
                var errorMessage = self._getErrorMessageFromResponse(err);
                self.model.set('csuiInlineFormErrorMessage', errorMessage);
                log.error('Saving failed. ', errorMessage) && console.error(log.last);
                self.model.set(cloneAttributes, {silent: true});
              });
        },
        _openMetadataPage: function () {

          var MN = '{0}:metadataIconClicked {1}';

          var self = this;
          self.viewToModelData();
          var nodes = new NodeCollection();
          nodes.push(self.options.model);

          var status = {
            nodes: nodes,
            container: self.options.model.collection.node,
            collection: self.options.model.collection
          };

          var options = {context: self.options.context};
          self.children.each(function (fieldView) {
            var fieldModel = fieldView.model,
              multiLingualKey = fieldModel.get('fieldName') + '_multilingual',
              multiLingualValues = fieldModel.attributes[multiLingualKey];
            if (fieldModel.get('type') === 'multilingualtextfield' && multiLingualValues) {
              self.model.set(multiLingualKey, multiLingualValues, { silent: true });
            }
          });

          options = _.extend(options, {
            addableType: self.model.get('type') // get subtype from static property
          });
          var addItemMetadataCmd = new AddItemMetadataCommand();
          addItemMetadataCmd.execute(status, options)
              .then(function (args) {
                delete self.model.inlineFormView;
                self.model.unset('csuiInlineFormErrorMessage', {silent: true});
                self.trigger('end:of:edit', this);
                if (args.name) {
                  self._removeLastElement();
                  return self.model.fetch();
                }
              }).fail(function (err) {
            self.trigger('cancel:edit:form');
          });

        },

        getFieldModels: function (viewOptions) {
          var node                 = viewOptions.node,
              showOnlyDefaultField = viewOptions.showOnlyDefaultField,
              fields               = node.get('form').fields,
              filedArr             = [],
              metadataLanguages    = base.getMetadataLanguageInfo(),
              isCreateMode         = viewOptions.model.get('id') === undefined;
          for (var field in fields) {
            if (fields[field] !== undefined) {
              var obj = fields[field];
              if ((!(showOnlyDefaultField && obj.type !== 'text') ||
                   !(showOnlyDefaultField && obj.type !== 'multilingualtextfield'))) {
                obj.fieldName = field;
                obj.type = (obj.type === 'text' && !!obj.multilingual && metadataLanguages.enabled) ?
                           'multilingualtextfield' : obj.type;
                obj.validField = obj.required ?
                                 (isCreateMode && !!viewOptions.model.get(obj.fieldName) ? true :
                                  false) : true;
                filedArr.push(obj);
              }

            }
          }
          return filedArr;
        }
      }
  );

  return InlineFormView;

});
