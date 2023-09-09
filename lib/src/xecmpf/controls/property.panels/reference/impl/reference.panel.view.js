/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/log',
  'csui/controls/form/form.view',
  'csui/utils/base',
  'csui/dialogs/modal.alert/modal.alert',
  'xecmpf/controls/bosearch/bosearch.model',
  'xecmpf/controls/bosearch/bosearch.dialog.controller',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/globalmessage/globalmessage',
  'hbs!xecmpf/controls/property.panels/reference/impl/reference.panel',
  'hbs!xecmpf/controls/property.panels/reference/impl/reference.panel-initial',
  'hbs!xecmpf/controls/property.panels/reference/impl/reference.panel-replace',
  'i18n!xecmpf/controls/property.panels/reference/impl/nls/lang',
  'css!xecmpf/controls/property.panels/reference/impl/reference.panel'
], function (_, $, Backbone, Marionette, log, FormView,
  base, ModalAlert,
  BoSearchModel,
  BoSearchDialogController,
  TabableRegionBehavior, GlobalMessage, template, initialtmpl, replacetmpl, lang) {
  'use strict';

  var ReferenceInitialView = Marionette.ItemView.extend({

    className: "conws-reference reference-initial",

    template: initialtmpl,

    constructor: function ReferenceInitialView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    },

    ui: {
      searchButton: '.binf-btn.search'
    },

    triggers: {
      "click .binf-btn.search": "referencetab:search"
    },

    templateHelpers: function () {
      var bo_ref = this.options.actionContext.workspaceReference,
        bo_type_name = bo_ref && bo_ref.get("bo_type_name"),
        ext_system_name = bo_ref && bo_ref.get("ext_system_name");
      return {
        search_button_label: _.str.sformat(lang.referenceSearchButtonLabel, bo_type_name, ext_system_name),
        search_button_title: lang.referenceSearchButtonTitle,
        complete_reference: bo_ref.get("complete_reference"),
        cannot_complete_business_reference: lang.cannotCompleteBusinessReference
      };
    }
  });

  var ReferenceReplaceView = Marionette.LayoutView.extend({

    className: "conws-reference reference-replace",

    template: replacetmpl,

    constructor: function ReferenceReplaceView(options) {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },

    ui: {
      replaceButton: '.binf-btn.replace'
    },

    triggers: {
      "click .binf-btn.remove": "referencetab:remove",
      "click .binf-btn.replace": "referencetab:replace"
    },

    regions: {
      metadataRegion: '.conws-reference-metadata'
    },

    templateHelpers: function () {
      var bo_ref = this.options.actionContext.workspaceReference,
        bo_type_name = bo_ref && bo_ref.get("bo_type_name"),
        ext_system_name = bo_ref && bo_ref.get("ext_system_name");
      return {
        allow_remove_reference_from_create: this.options.actionContext.mode === "workspace_reference_create",
        allow_remove_reference_from_edit: this.options.actionContext.mode === "workspace_reference_edit",
        remove_button_title: lang.referenceRemoveButtonTitle,
        replace_button_title: lang.referenceReplaceButtonTitle,
        reference_buttons_label: _.str.sformat(lang.referenceSearchButtonLabel, bo_type_name, ext_system_name),
        change_reference: bo_ref.get("change_reference")
      };
    },

    onRender: function () {
      var formData, formOptions, formSchema;
      if (this.options.actionContext.mode === "workspace_reference_create") {
        formData = this.options.actionContext.workspaceReference.get("data") || {};
        formOptions = this.options.actionContext.workspaceReference.get("options") || {};
        formSchema = this.options.actionContext.workspaceReference.get("schema") || {};
      }
      if (this.options.actionContext.mode === "workspace_reference_edit") {
        formData = {
          BOID: this.options.actionContext.workspaceReference.get("bo_id")
        };
        formOptions = {
          fields: {
            BOID: {}
          }
        };
        formSchema = {
          properties: {
            BOID: {
              readonly: true,
              required: false,
              title: lang.businessObjectIdLabel,
              type: "string"
            }
          }
        };
      }
      if (formData && formOptions && formSchema) {
        this.formModel = new Backbone.Model({
          data: formData,
          options: formOptions,
          schema: formSchema
        });
        this.metdataForm = new FormView({
          model: this.formModel,
          context: this.options.context
        });
        this.metadataRegion.show(this.metdataForm);
      }
    }
  });

  var ReferencePanelView = Marionette.LayoutView.extend({

    className: 'conws-reference reference-panel cs-form cs-form-create',

    template: template,

    regions: {
      initialRegion: '.conws-reference-initial',
      replaceRegion: '.conws-reference-replace'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function ReferencePanelView(options) {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);

      this.options.actionContext.referencePanelView = this;
      this.actionContext = _.clone(this.options.actionContext); // Avoid sharing actionContext from sidePanel

      var viewContext, anchor, containerType;
      if (this.options.mode === "create") {
        this.actionContext.mode = "workspace_reference_create";
        viewContext = this.options.metadataView;
        var forms = options && options.fetchedModels,
          formCollection = forms && forms.formCollection,
          formOptions = formCollection && formCollection.options,
          addItemController = formOptions && formOptions.metadataAddItemController,
          sidePanel = addItemController && addItemController.sidePanel;
        if (addItemController.dialog) {
          containerType = 'dialog';
          anchor = addItemController.dialog.$(".binf-modal-content");
        } else if (addItemController.sidePanel) {
          containerType = 'side-panel';
          anchor = addItemController.sidePanel.$(".csui-sidepanel-body");
        }
      } else if (this.options.mode === "update") {
        this.actionContext.mode = "workspace_reference_edit";
        if (this.options.metadataView && this.options.metadataView.options.metadataNavigationView) {
          viewContext = this.options.metadataView.options.metadataNavigationView;
        } else {
          viewContext = this.options.metadataView;
        }
        anchor = ".cs-metadata:has(> .metadata-content-wrapper)";
      }
      if (viewContext !== this.actionContext.viewContext) {
        delete this.actionContext.boSearchModel;
        delete this.actionContext.boSearchDialogController;
        this.actionContext.viewContext = viewContext;
      }

      var bo_ref = this.actionContext.workspaceReference;
      if (!this.actionContext.boSearchModel) {
        this.actionContext.boSearchModel = new BoSearchModel({
          bo_type_id: bo_ref.get("bo_type_id"),
          bo_type_name: bo_ref.get("bo_type_name"),
          row_id: bo_ref.get("row_id")
        });
      } else {
        this.actionContext.boSearchModel.set({
          bo_type_id: bo_ref.get("bo_type_id"),
          bo_type_name: bo_ref.get("bo_type_name"),
          row_id: bo_ref.get("row_id")
        });
      }

      if (!this.actionContext.boSearchDialogController) {
        this.actionContext.boSearchDialogController = new BoSearchDialogController({
          mode: this.actionContext.mode,
          context: this.options.context,
          htmlPlace: anchor,
          containerType: containerType,
          sidePanel: sidePanel,
          boSearchModel: this.actionContext.boSearchModel,
          disableItemsWithWorkspace: true
        });
      } else {
        this.actionContext.boSearchDialogController.options.mode = this.actionContext.mode;
        this.actionContext.boSearchDialogController.options.htmlPlace = anchor;
      }

      this.listenTo(this.actionContext.boSearchModel, "boresult:select", this._replaceReference);
      this.listenTo(this.actionContext.boSearchModel, "bosearch:cancel", this._cancelSearch);
      this.listenTo(this.actionContext.boSearchModel, "change:bo_type_name", _.bind(function () {
        this.actionContext.workspaceReference.set("by_type_name", this.actionContext.boSearchModel.get("bo_type_name"));
        this.render();
      }, this));

      this.listenTo(this.actionContext.workspaceReference, "error", function (model, response, options) {
        var isRemoveError = (options && options.invoker && options.invoker === 'remove_bo_ref');
        var errmsg;
        if (isRemoveError) {
          errmsg = response && (new base.Error(response)).message || lang.errorRemovingWorkspaceReference;
          log.error("Removing the workspace reference failed: {0}", errmsg) && console.error(log.last);
        } else {
          errmsg = response && (new base.Error(response)).message || lang.errorUpdatingWorkspaceReference;
          log.error("Updating the workspace reference failed: {0}", errmsg) && console.error(log.last);
        }
        ModalAlert.showError(errmsg);
      });

      this.listenTo(options.originatingView, "render:forms", this._formsRendered);
      if (this.actionContext.mode === "workspace_reference_create") {
        this.actionContext.scrollToPanel = true;
        this.actionContext.focusButton = true;
      }
      _.extend(this.options.actionContext, this.actionContext);
    },

    onDestroy: function () {
      if (this === this.actionContext.referencePanelView) {
        delete this.actionContext.referencePanelView;
      }
    },

    templateHelpers: function () {
      return {
        title: lang.referenceTabTitle,
        bo_id: this.actionContext.workspaceReference.get("bo_id"),
        add_note: lang.referencePanelAddNote,
        change_note: lang.referencePanelChangeNote,
        remove_note: lang.referencePanelRemoveNote,
        change_reference: this.actionContext.workspaceReference.get("change_reference")
      };
    },

    currentlyFocusedElement: function () {
      var el;
      if (this.actionContext.workspaceReference.get("bo_id")) {
        el = this.replaceView && this.replaceView.ui.replaceButton;
      } else {
        el = this.initialView && this.initialView.ui.searchButton;
      }
      if (el && el.attr && el.prop) {
        log.debug("currently focused element of {0} count {1} class {2}", this.cid, el ? el.length : "no el", el.attr('class')) && console.log(log.last);
        return el;
      } else {
        return undefined;
      }
    },
    onRender: function () {
      if (this.actionContext.workspaceReference.get("bo_id")) {
        delete this.initialView;
        this.replaceView = new ReferenceReplaceView(this.options);
        this.listenTo(this.replaceView, "referencetab:remove", this._removeReference);
        this.listenTo(this.replaceView, "referencetab:replace", this._triggerSearch);
        this.replaceRegion.show(this.replaceView);
      } else {
        delete this.replaceView;
        this.initialView = new ReferenceInitialView(this.options);
        this.listenTo(this.initialView, "referencetab:search", this._triggerSearch);
        this.initialRegion.show(this.initialView);
      }
    },

    _triggerSearch: function () {
      log.debug("trigger reference:search") && console.log(log.last);
      this.actionContext.boSearchModel.trigger("reference:search");
    },

    _removeReference: function () {
      log.debug("clear reference") && console.log(log.last);
      if (this.actionContext.mode === "workspace_reference_create") {
        this._refetchForms({
          "data": undefined,
          "options": {},
          "schema": {},
          "bo_id": undefined,
          "row_id": undefined
        });
      } else if (this.actionContext.mode === "workspace_reference_edit") {
        var self = this;
        var deferred = $.Deferred();
        ModalAlert.confirmQuestion(_.str.sformat(lang.removeBOReferenceAlertDescription, this.actionContext.workspaceReference.get('bo_id')),
            lang.removeBOReferenceAlertTitle)
          .done(function (result) {
            var bo_ref = self.actionContext.workspaceReference;
            bo_ref.destroy({
                wait: true,
                invoker: 'remove_bo_ref'
              })
              .done(function (data, status) {
                GlobalMessage.showMessage('success', lang.removeBOReferenceSuccessMessage);
                if (self.options.hasMetadataProperties === false) { // XECMPF-4045, when reference panel is rendered solely
                  bo_ref.set("bo_id", undefined);
                  bo_ref.fetch().then(function () {
                    self.render();
                  });
                } else {
                  self.actionContext.viewContext.triggerMethod("metadata:close");
                }
                deferred.resolve();
              })
              .fail(function (data, status, error) {
                deferred.reject(data.responseJSON.error);
              });
            return deferred.promise();
          });
      }
    },

    _cancelSearch: function () {
      this._focusButton({
        cancelSearch: true
      });
    },

    _replaceReference: function (selectEventInfo) {
      log.debug("set reference") && console.log(log.last);
      if (selectEventInfo && selectEventInfo.selectedItems &&
        selectEventInfo.selectedItems.length > 0 &&
        selectEventInfo.selectedItems[0]) {
        var selectedObject = selectEventInfo.selectedItems[0];
        var formData = {},
          formFields = {},
          formProperties = {},
          collection = selectedObject.collection,
          columnDefinitions = collection.columns,
          tableColumns = collection.tableColumns,
          sortedColumns = tableColumns.toArray().sort(function (a, b) {
            return a.get("sequence") - b.get("sequence");
          });
        _.each(sortedColumns, function (tc) {
          var key = tc.get("key"),
            col = columnDefinitions.get(key),
            name = col.get("fieldName");
          formData[name] = selectedObject.get(key);
          formFields[name] = {};
          formProperties[name] = {
            readonly: true,
            required: false,
            title: col.get("fieldLabel"),
            type: "string"
          };
        });
        this._refetchForms({
          "data": formData,
          "options": {
            fields: formFields
          },
          "schema": {
            properties: formProperties
          },
          "bo_id": selectedObject.get("businessObjectId"),
          "row_id": selectedObject.get("id")
        }, "select");
      } else {
        this.render();
        this.actionContext.boSearchModel.trigger("reference:selected");
        this._scrollToPanel();
        this._focusButton();
      }
    },

    _getAllValues: function () {

      var data = {},
        metadataView = this.options && this.options.metadataView;
      if (metadataView) {
        data = {
          "name": metadataView.metadataHeaderView.getNameValue(),
          "type": metadataView.options.model.get('type'),
          "parent_id": metadataView.options.model.get('parent_id')
        };
        var formsValues = metadataView.metadataPropertiesView.getFormsValues();
        _.extend(data, formsValues);
      }

      return data;
    },

    _refetchForms: function (attributes, mode) {
      var self = this,
        bo_ref = this.actionContext.workspaceReference,
        bo_id = attributes.bo_id,
        actionContext = this.actionContext,
        originatingView = this.options.originatingView,
        forms = this.options.fetchedModels;
      if (actionContext.mode === "workspace_reference_create") {
        var formCollection = forms.formCollection;
        if (bo_id) {
          formCollection.bo_type_id = bo_ref.get("bo_type_id");
          formCollection.bo_id = bo_id;
        } else {
          delete formCollection.bo_type_id;
          delete formCollection.bo_id;
        }
        formCollection.formsValues = this._getAllValues();
        formCollection.formsSchema = formCollection.serverForms;
        forms.fetch().then(function () {
            bo_ref.set(attributes);
            if (mode === "select") {
              originatingView.once("render:forms", function () {
                self.actionContext.boSearchModel.trigger("reference:selected");
              });
            }
            actionContext.scrollToPanel = true;
            actionContext.focusButton = true;
          },
          function () {
            if (mode === "select") {
              self.actionContext.boSearchModel.trigger("reference:rejected");
            }
          }
        );
      } else if (actionContext.mode === "workspace_reference_edit") {
        var bo_id_old = bo_ref.get("bo_id"),
          node = this.options.node;
        bo_ref.set("bo_id", bo_id);
        bo_ref.save({}, {
            wait: true
          })
          .then(function () {
            node.fetch().then(function () {
                if (forms) {
                  forms.fetch().then(function () {
                      bo_ref.set(attributes);
                      if (mode === "select") {
                        originatingView.once("render:forms", function () {
                          self.actionContext.boSearchModel.trigger("reference:selected");
                        });
                      }
                      actionContext.scrollToPanel = true;
                      actionContext.focusButton = true;
                    },
                    function () {
                      bo_ref.set("bo_id", bo_id_old);
                      if (mode === "select") {
                        self.actionContext.boSearchModel.trigger("reference:rejected");
                      }
                    });
                } else if (self.options.hasMetadataProperties === false) { // XECMPF-4045, when reference panel is rendered solely
                  bo_ref.set(attributes);
                  self.actionContext.boSearchModel.trigger("reference:selected");
                  bo_ref.fetch().then(function () {
                    self.render();
                  });
                }
              },
              function () {
                bo_ref.set("bo_id", bo_id_old);
                if (mode === "select") {
                  self.actionContext.boSearchModel.trigger("reference:rejected");
                }
              });
          }, function () {
            bo_ref.set("bo_id", bo_id_old);
            if (mode === "select") {
              self.actionContext.boSearchModel.trigger("reference:rejected");
            }
          });
      } else {
        bo_ref.set(attributes);
        this.render();
        if (mode === "select") {
          self.actionContext.boSearchModel.trigger("reference:selected");
        }
        this._scrollToPanel();
        this._focusButton();
      }
    },
    _scrollToPanel: function () {
      var originatingView = this.options && this.options.originatingView,
        tabLinks = originatingView && originatingView.tabLinks;
      if (tabLinks) {
        var refLink;
        tabLinks.children.each(function (tabLink) {
          if (tabLink.model.id === "conws-reference") {
            refLink = tabLink;
          }
        });
        if (refLink) {
          refLink.activate();
        }
      }
    },
    _focusButton: function (eventOptions) {
      var metadataView = this.options && this.options.metadataView,
        headerView = metadataView && metadataView.metadataHeaderView,
        nameView = headerView && headerView.metadataItemNameView;
      if (!nameView || nameView.readonly || nameView.model && nameView.model.get("name") ||
        (eventOptions && eventOptions.cancelSearch)) {
        if (this.actionContext.workspaceReference.get("bo_id")) {
          var butn;
          if (this.replaceView) {
            butn = $(this.replaceView.ui.replaceButton);
            butn.trigger("focus");
          }
        } else {
          if (this.initialView) {
            butn = $(this.initialView.ui.searchButton);
            butn.trigger("focus");
          }
        }
        var originatingView = this.options.originatingView, href;
        if ( originatingView !== undefined ) {
          href = originatingView.$el.find("div[id='conws-reference']");
        }
        if (href && href.length > 0) {
          var hrefTop = href[0].offsetTop;
          if (butn && butn.length > 0) {
            var butnTop = butn[0].offsetTop;
            var butnHeight = butn.height();
            var panelHeight = originatingView.tabContent.$el.height();
            if (butnTop + butnHeight > hrefTop + panelHeight) {
              var extraTopOffset = Math.max(originatingView.getOption('extraScrollTopOffset') || 0, 5);
              var scrollTop = butnTop + butnHeight - panelHeight + extraTopOffset;
              originatingView.tabContent.$el.animate({
                scrollTop: scrollTop
              }, 300);
            }
          }
        }
      } else {
        nameView.setEditModeFocus();
      }
    },

    _formsRendered: function () {
      if (this.actionContext.scrollToPanel) {
        delete this.actionContext.scrollToPanel;
        this._scrollToPanel();
      }
      if (this.actionContext.focusButton) {
        delete this.actionContext.focusButton;
        this._focusButton();
      }
    },

    validate: function () {
      return true;
    },

    getValues: function () {

      return {
        bo_id: this.actionContext.workspaceReference.get("bo_id"),
        bo_type_id: this.actionContext.workspaceReference.get("bo_type_id")
      };
    },

    hideNotRequired: function (hide) {
      return true;
    }

  });

  return ReferencePanelView;

});