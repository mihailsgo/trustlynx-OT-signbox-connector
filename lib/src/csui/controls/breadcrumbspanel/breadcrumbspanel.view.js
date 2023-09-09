/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore', 'csui/lib/marionette', 'csui/utils/contexts/factories/ancestors',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/controls/breadcrumbs/breadcrumbs.view',
  'hbs!csui/controls/breadcrumbspanel/impl/breadcrumbspanel',
  'i18n!csui/controls/breadcrumbs/impl/breadcrumb/impl/nls/lang',
  'csui-ext!csui/controls/breadcrumbspanel/breadcrumbspanel.view',
  'css!csui/controls/breadcrumbspanel/impl/breadcrumbspanel'
], function (_, Marionette, AncestorCollectionFactory, ApplicationScopeModelFactory,
    BreadcrumbsView,
    BreadcrumbsPanelTemplate, lang, extns) {
  'use strict';

  var BreadcrumbsPanelView = Marionette.LayoutView.extend({

    attributes: {id: 'breadcrumb-wrap'},

    className: 'binf-container-fluid',

    template: BreadcrumbsPanelTemplate,

    ui: {
      tileBreadcrumb: '.tile-breadcrumb',
      breadcrumbsWrap: '#breadcrumb-wrap'
    },

    regions: {
      breadcrumbsInner: '.breadcrumb-inner'
    },

    templateHelpers: function () {
      return {
        breadcrumbAria: lang.breadcrumbAria
      };
    },

    constructor: function BreadcrumbsPanelView(options) {

      Marionette.LayoutView.apply(this, arguments);

      this.applicationScope = options.context.getModel(ApplicationScopeModelFactory);
      this.listenTo(this.applicationScope, 'change:breadcrumbsVisible',
          this._showOrHideBreadcrumbs);

      this.ancestors = this.options.context.getCollection(AncestorCollectionFactory);

      this.listenTo(this, 'dom:refresh', function () {
        if (this.breadcrumbs) {
          this.breadcrumbs.refresh(); // calls _adjustToFit
        }
      });

      var viewStateModel = this.options.context.viewStateModel;
      viewStateModel &&
      this.listenTo(viewStateModel, 'change:' + viewStateModel.CONSTANTS.START_ID,
          this.updateStopIdFromViewState.bind(this)).listenTo(viewStateModel,
          'change:' + viewStateModel.CONSTANTS.BREADCRUMB, this._showOrHideBreadcrumbs.bind(this));
    },

    onRender: function () {
      this._showOrHideBreadcrumbs();
    },

    _showOrHideBreadcrumbs: function () {
      if (this.ancestors.blockId !== undefined) {
        this.$el.removeClass('csui-hide-breadcrumbs');
      }
      var context = this.options.context,
        viewStateModel = context && context.viewStateModel,
        viewStateBreadcrumbs = viewStateModel &&
          viewStateModel.get(viewStateModel.CONSTANTS.BREADCRUMB),
        opts = {
          context: context,
          node: this.ancestors && this.ancestors.node,
          connector: this.ancestors && this.ancestors.connector
        },
        self = this,
        availableExtensions = _.filter(_.flatten(extns, true), function (extn) {
          var hideBreadcrumbs = extn.hideBreadcrumbs && _.isFunction(extn.hideBreadcrumbs) ?
            extn.hideBreadcrumbs(opts) : !!extn.hideBreadcrumbs;
          if (hideBreadcrumbs && self.applicationScope.get("previousBreadcrumbVisibility") === undefined) {
            self.$el.addClass('csui-hide-breadcrumbs');
            var previousBreadcrumbVisibility = self.applicationScope.get('breadcrumbsVisible');
            self.applicationScope.set('previousBreadcrumbVisibility', previousBreadcrumbVisibility, { silent: true });
          }
          return hideBreadcrumbs;
        });

      if (availableExtensions.length) {
        if (this.applicationScope.get('breadcrumbsVisible')) {
          this.applicationScope.set('breadcrumbsVisible', false);
        }
        this.applicationScope.set({ 'hiddenByExtension': true, 'hideToggleButton': true });
      } else {
        this.applicationScope.set({ 'hideToggleButton': false, 'hiddenByExtension': false });
        if (this.applicationScope.get("previousBreadcrumbVisibility") !== undefined) {
          this.ancestors.blockId = this.ancestors.node.get('id');
          this.$el.addClass('csui-hide-breadcrumbs');
          this.applicationScope.set('breadcrumbsVisible', this.applicationScope.get("previousBreadcrumbVisibility"));
          this.applicationScope.set('previousBreadcrumbVisibility', undefined, { silent: true });
        }
      }

      if (viewStateBreadcrumbs !== undefined) {
        this._breadcrumbsVisible = viewStateBreadcrumbs;
      } else {
        this._breadcrumbsVisible = this.applicationScope.get('breadcrumbsVisible');
      }

      this._breadcrumbsAvailable = this.ancestors.isFetchable();
      if (this._breadcrumbsVisible && this._breadcrumbsAvailable) {
        if (!this.breadcrumbs) {
          this.breadcrumbs = new BreadcrumbsView({
            context: this.options.context,
            collection: this.ancestors,
            fetchOnCollectionUpdate: false,
            theme: 'dark'
          });
          this.$el.removeClass('binf-hidden');
          this.breadcrumbsInner.show(this.breadcrumbs);
          this.breadcrumbs.synchronizeCollections();
          this.$el.addClass('breadcrumb-wrap-visible');
          this.triggerMethod("tabable", this);
          this.breadcrumbs.triggerMethod("refresh:tabindexes");
          this.updateStopIdFromViewState();
        }
      } else {
        if (this.breadcrumbs) {
          this.$el.removeClass('breadcrumb-wrap-visible').addClass('binf-hidden');
          this.breadcrumbsInner.empty();
          delete this.breadcrumbs;
        }
      }
    },

    updateStopIdFromViewState: function () {
      var viewStateModel = this.options.context.viewStateModel;
      var start_id = viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.START_ID);
      start_id && this.breadcrumbs &&
      this.breadcrumbs.updateStopId(viewStateModel.get(viewStateModel.CONSTANTS.START_ID));
    },
    hideBreadcrumbs: function () {
      if (this.breadcrumbs) {
        this.breadcrumbs.hideSubCrumbs();
      }
      this.$el.removeClass('breadcrumb-wrap-visible');
      this.triggerMethod("tabable:not", this);
      this.$el.hide();
    },

    showBreadcrumbs: function () {
      this.$el.addClass('breadcrumb-wrap-visible');
      this.triggerMethod("tabable", this);
      this.$el.show();
      this.breadcrumbs && this.breadcrumbs.triggerMethod("refresh:tabindexes");
    },

    isTabable: function () {
      if (this.breadcrumbs) {
        return this.ancestors.size() > 1;
      } else {
        return false;
      }
    }

  });

  return BreadcrumbsPanelView;
});
