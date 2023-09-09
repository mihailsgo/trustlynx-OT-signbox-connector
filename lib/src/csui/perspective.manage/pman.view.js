/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/base',
  'csui/utils/non-emptying.region/non-emptying.region',
  'csui/perspective.manage/impl/pman.panel.view',
  'csui/utils/perspective/perspective.util',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/user',
  'csui/models/perspective/personalization.model',
  'csui/perspectives/mixins/draganddrop.kn.mixin',
  'i18n!csui/perspective.manage/impl/nls/lang',
  'hbs!csui/perspective.manage/impl/pman',
  'i18n',
  'css!csui/perspective.manage/impl/pman',
  'csui/perspective.manage/behaviours/pman.widget.config.behaviour',
  'csui/lib/jquery.ui/js/jquery-ui'
], function (_, $, Backbone, Marionette, base, NonEmptyingRegion, PManPanelView, PerspectiveUtil,
    ApplicationScopeModelFactory,
    NodeModelFactory, UserModelFactory, PersonalizationModel, DragAndDropKNMixin, lang, template, i18n) {

  var pmanContainer;

  var PManView = Marionette.ItemView.extend({
    className: function () {
      var classNames = ['pman', 'pman-container'];
      classNames.push('pman-mode-' + this.options.mode);
      return _.unique(classNames).join(' ');
    },

    template: template,

    templateHelpers: function () {
      return {
        addWidget: lang.addWidget,
        save: lang.save,
        saveAriaLabel: lang.saveAriaLabel,
        cancel: lang.cancel,
        cancelAriaLabel: lang.cancelAriaLabel,
        reset: lang.reset,
        resetAriaLabel: lang.resetAriaLabel,
        personalizeMode: this.mode === PerspectiveUtil.MODE_PERSONALIZE &&
                         (this.options.perspective.has('perspective_id') ||
                          this.options.perspective.has('id'))
      };
    },

    ui: {
      "pmanPanel": ".pman-header .pman-pannel-wrapper",
      'cancelEdit': '.pman-header .cancel-edit',
      'addIcon': '.pman-header .icon-toolbarAdd',
      'saveBtn': '.pman-header .icon-save',
      'trashArea': '.pman-header .pman-trash-area',
      'resetBtn': '.pman-header .icon-reset'
    },

    events: {
      'click @ui.cancelEdit': "onClickClose",
      'click @ui.addIcon': "togglePannel",
      'click @ui.saveBtn': "onClickSave",
      'click @ui.resetBtn': "onClickReset",
      'keydown': 'onKeyDown'
    },

    constructor: function PManView(options) {
      options || (options = {});
      _.defaults(options, {
        applyMasking: this.applyMasking.bind(this),
        container: document.body,
        mode: PerspectiveUtil.MODE_EDIT_PERSPECTIVE
      });
      options.container = $(options.container);
      this.context = options.context;
      this.applicationScope = this.context.getModel(ApplicationScopeModelFactory);
      this.mode = options.mode;
      this._prepareForEdit(options.perspective);
      Marionette.ItemView.prototype.constructor.call(this, options);
      this._registerEventHandler();
    },

    _registerEventHandler: function () {
      this.listenTo(this, 'change:layout', function (newLayoutType) {
        this.perspective.setPerspective({
          type: newLayoutType,
          options: {perspectiveMode: this.mode}
        }, {silent: true});
        this._triggerEditMode();
        this.togglePannel();
      });
      this.listenTo(this, 'swap:layout', function (newLayoutType) {
        this.perspective.setPerspective({
          type: newLayoutType,
          options: this.perspective.attributes.perspective.options
        }, {silent: true});
        this.context.triggerMethod('swap:layout', this.perspective);
      });
      this.listenTo(this.context, 'save:perspective', this._savePerspective);
      this.listenTo(this.context, 'change:perspective', this._onChangePerspective);
      this.listenTo(this.context, 'retain:perspective', this._doExitPerspective);
      this.listenTo(this.context, 'finish:exit:edit:perspective', this._doCleanup);
    },

    _prepareForEdit: function (originalPerspective) {
      if (!originalPerspective) {
        throw new Error("Missing perspective");
      }
      this.perspective = this._clonePrespective(originalPerspective);
      if (this.perspective.isNew() && this.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        this.perspective.setPerspective(this._getDefaultPerspectiveConfig());
      }
    },

    _clonePrespective: function (original) {
      var perspectiveConfig = original.getPerspective();
      var config = JSON.parse(JSON.stringify(perspectiveConfig));
      original.setPerspective(config);
      return original;
    },

    show: function () {
      var container = this.getContainer(),
          region = new NonEmptyingRegion({
            el: container
          });
      region.show(this);
      return this;
    },

    getContainer: function () {
      if (!pmanContainer || !$.contains(this.options.container, pmanContainer)) {
        pmanContainer = $('<div>', {'class': 'binf-widgets'}).appendTo(this.options.container)[0]
      }
      return pmanContainer;
    },
    _getDefaultPerspectiveConfig: function () {
      return {
        "type": "left-center-right",
        "options": {
          "center": {
            "type": "csui/widgets/nodestable"
          }
        }
      };
    },
    _savePerspective: function (perspectiveChanges) {
      if (!!perspectiveChanges && !!perspectiveChanges.error) {
        this.ui.saveBtn.prop('disabled', false);
        return;
      }
      this.perspective.update(perspectiveChanges);
      this.perspective.save().then(_.bind(this._onSaveSuccess, this),
          _.bind(this._onSaveError, this));
    },

    _onSaveSuccess: function () {
      var self = this;
      if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        this._showMessage("success", lang.perspectiveSaveSuccess);
      } else {
        this._showMessage("success", lang.personalizationSaveSuccess);
      }
      var contextPerspectiveMode = self.context.perspective.get('perspectiveMode') ||
                                   PerspectiveUtil.MODE_EDIT_PERSPECTIVE,
          sourceModel = self._getSourceModel();

      var updatePerspective = self.perspective.getPerspective();
      updatePerspective.id = self.perspective.getPerspectiveId();
      if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        var originalPerspective = sourceModel.get('perspective');
        sourceModel.set('perspective', _.defaults(updatePerspective, originalPerspective));
      } else {
        var originalPerspective = sourceModel.get('perspective');
        sourceModel.set('perspective',
            _.defaults({personalizations: self.perspective.toJSON()}, originalPerspective));
      }

      if (contextPerspectiveMode === self.mode) {
        self.context.perspective.set(updatePerspective);
      } else if (self.mode === PerspectiveUtil.MODE_EDIT_PERSPECTIVE) {
        var personalization = new PersonalizationModel({}, {perspective: updatePerspective});
        personalization.setPerspective(self.context.perspective.toJSON());
        updatePerspective = personalization.getPerspective();
        self.context.perspective.set(updatePerspective);

      } else if (self.mode === PerspectiveUtil.MODE_PERSONALIZE) {
        var personalization = new PersonalizationModel({},
            {perspective: sourceModel.get('perspective')});
        personalization.setPerspective(updatePerspective);
        updatePerspective = personalization.getPerspective();
        self.context.perspective.set(updatePerspective);
      }
      self._doExitPerspective();
    },

    _onSaveError: function (error) {
      this.ui.saveBtn.prop('disabled', false);
      var errorMessage;
      if (error && error.responseJSON && error.responseJSON.error) {
        errorMessage = error.responseJSON.error;
      } else {
        var errorHtml = base.MessageHelper.toHtml();
        base.MessageHelper.reset();
        errorMessage = $(errorHtml).text();
      }
      this._showMessage("error", errorMessage);
    },

    _showMessage: function (type, message) {
      require([
        'csui/controls/globalmessage/globalmessage'
      ], function (GlobalMessage) {
        GlobalMessage.showMessage(type, message);
      });
    },

    onClickSave: function () {
      this.ui.saveBtn.prop('disabled', true);
      var popoverTarget = this.options.container.find(".binf-popover");
      if (popoverTarget.length) {
        popoverTarget.binf_popover('hide');
        setTimeout(_.bind(function () {
          this.context.triggerMethod('serialize:perspective', this.perspective);
        }, this), 1500);
      } else {
        this.context.triggerMethod('serialize:perspective', this.perspective);
      }
    },

    onClickReset: function () {
      var self = this;
      require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
        alertDialog.confirmQuestion(lang.resetConfirmMsg,
            lang.reset,
            {
              buttons: {
                showYes: true,
                labelYes: lang.reset,
                showNo: true,
                labelNo: lang.cancel
              }
            })
            .done(function (yes) {
              if (yes) {
                self._doReset();
              }
            });
      });
    },

    _doReset: function () {
      var sourceModel = this._getSourceModel();
      originalPerspective = JSON.parse(JSON.stringify(sourceModel.get('perspective')));
      originalPerspective.options = originalPerspective.options || {};
      originalPerspective.options.perspectiveMode = this.mode;
      var originalConfig = new Backbone.Model(originalPerspective);
      this.context.triggerMethod('enter:edit:perspective', originalConfig);
      this.listenToOnce(this.context, 'finish:enter:edit:perspective', function () {
        this._showMessage("success", lang.resetSuccessful);
      });
    },

    _getSourceModel: function (params) {
      var sourceModel;
      if (this.applicationScope.get('id') === 'node') {
        sourceModel = this.context.getModel(NodeModelFactory);
      } else if (!this.applicationScope.get('id')) {
        sourceModel = this.context.getModel(UserModelFactory);
      }
      return sourceModel;
    },

    onClickClose: function () {
      this._doExitPerspective();
    },

    togglePannel: function (event) {
      if (!this.ui.pmanPanel.hasClass('binf-active')) {
        if (!(event.originalEvent.pointerType === 'mouse')) {
          this.$el.find('.csui-layout-tab').attr('tabindex', 0);
          this.$el.find('.csui-layout-tab').focus();
        }
        this._openToolsPanel();
      } else {
        this.$el.find('.csui-layout-tab').attr('tabindex', -1);
        this.$el.find('.cs-go-back').attr('tabindex', -1);
        this._closeToolsPanel();
      }
    },

    _openToolsPanel: function () {
      this.pmanPanelView.trigger('reset:items');
      this.ui.addIcon.addClass('binf-active');
      this.ui.addIcon.attr("title", lang.close);
      this.ui.pmanPanel.addClass('binf-active');
      this.pmanPanelView.triggerMethod("panel:open");
    },

    _closeToolsPanel: function () {
      this.ui.pmanPanel.removeClass('binf-active');
      this.ui.addIcon.attr("title", lang.addWidget);
      this.ui.addIcon.removeClass('binf-active');
    },

    applyMasking: function () {

    },

    _initializeWidgets: function () {
      if (this.mode === PerspectiveUtil.MODE_PERSONALIZE) {
        return;
      }
      this.pmanPanelRegion = new Marionette.Region({
        el: this.ui.pmanPanel
      });
      this.pmanPanelView = new PManPanelView({
        pmanView: this
      });
      this.pmanPanelRegion.show(this.pmanPanelView);
      _.isFunction(this.ui.trashArea.droppable) && this.ui.trashArea.droppable({
        tolerance: 'pointer',
        hoverClass: "pman-trash-hover",
        accept: function () {
          return false;
        }
      });
    },

    _triggerEditMode: function () {
      var perspectiveConfig = this.perspective.getPerspective();
      perspectiveConfig.options = perspectiveConfig.options || {};
      perspectiveConfig.options.perspectiveMode = this.mode;
      var perspective = new Backbone.Model(perspectiveConfig);
      this.context.triggerMethod('enter:edit:perspective', perspective);
      this.listenToOnce(this.context, 'finish:enter:edit:perspective', this._setFocusOnFirstWidget);
    },

    _beforeTransition: function () {
      var perspectiveContainer = this.options.container.find('.cs-perspective');
      this.options.container.addClass('perspective-editing-transition');
      base.onTransitionEnd(perspectiveContainer, function () {
        this.options.container.removeClass('perspective-editing-transition');
      }, this);
    },

    onRender: function () {
      var self = this;
      this._beforeTransition();
      this.options.container.addClass('perspective-editing');
      this.options.applyMasking();
      this._initializeWidgets();
      this._triggerEditMode();
      $(document).on('click.' + this.cid, {view: this}, this._documentClick);
      var applyKNMixin = this.perspective.get('type') === 'sidepanel-right' ||
        this.perspective.get('type') === 'sidepanel-left' ||
        this.perspective.get('type') === "flow" ||
        this.perspective.get('perspective').type === 'sidepanel-right' ||
        this.perspective.get('perspective').type === 'sidepanel-left' ||
        this.perspective.get('perspective').type === "flow";
      if (applyKNMixin) {
        $(document).on('keydown', {view: this}, this.onKeyInView);
      }
    },

    onKeyInView: function (event) {
      var isRtl = i18n && i18n.settings.rtl,
        self = event.data && event.data.view,
        continueEvent = true,
        isMac = base.isMacintosh();
      if ($(document.activeElement).parents('#banner').length > 0) {
        return;
      }
      if (isMac && event.metaKey && !event.ctrlKey || !isMac && !event.metaKey &&
          event.ctrlKey) {
        var $target = $(event.target),
            $targetParent = $target.closest('.csui-draggable-item'),
            widgetCells = self.options && self.options.context &&
                          self.options.context.widgetCollection &&
                          self.options.context.widgetCollection.at(0).columns.models;
        switch (event.keyCode) {
        case 39:
          isRtl ? self.moveToLeft($targetParent, $target, widgetCells) : self.moveToRight($targetParent, $target, widgetCells);
          continueEvent = false;
          break;
        case 37:
          isRtl ? self.moveToRight($targetParent, $target, widgetCells) : self.moveToLeft($targetParent, $target, widgetCells);
          continueEvent = false;
          break;
        }
      }
      return continueEvent;
    },


    _documentClick: function (event) {
      var self = event.data.view;
      if (self.ui.addIcon.is(event.target) || !!self.ui.addIcon.has(event.target).length) {
        return;
      }
      if (self.ui.pmanPanel.is(event.target) || !!self.ui.pmanPanel.has(event.target).length) {
        return;
      }
      self._closeToolsPanel();
    },

    _onChangePerspective: function () {
      this._doCleanup();
    },

    _doCleanup: function () {
      var popoverTarget = this.options.container.find(".binf-popover");
      this._beforeTransition();
      if (popoverTarget.length) {
        popoverTarget.binf_popover('destroy');
      }
      this.options.container.removeClass('perspective-editing');
      $(document).off('click.' + this.cid, this._documentClick);
      $(document).off('keydown', this.onKeyInView);
      this.trigger('destroy');
    },
    _doExitPerspective: function () {
      this.context.triggerMethod('exit:edit:perspective', this.perspective);
    },
    _setFocusOnFirstWidget: function () {
      var focusableEle = this.options.container.find(
          '.cs-perspective-panel .cs-perspective .csui-pman-editable-widget').first(),
          shortcutButton = focusableEle.find('.shortcut-group-wrapper');
      if (shortcutButton.attr('tabindex') === '0') {
        shortcutButton[0].focus();
      } else {
        focusableEle.find('.wrapper-button')[0].focus();
      }
    },

    onKeyDown: function (event) {
      switch (event.keyCode) {
      case 9: //TAB
        if (!event.shiftKey && $(event.target).is(this.ui.cancelEdit)) {
          this._setFocusOnFirstWidget();
          return false;
        }
      }
    }

  });
  DragAndDropKNMixin.mixin(PManView.prototype);
  return PManView;
});
