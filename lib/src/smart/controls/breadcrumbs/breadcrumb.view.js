/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/marionette',
  'nuc/utils/base', 'hbs!smart/controls/breadcrumbs/impl/breadcrumb',
  'i18n!smart/controls/breadcrumbs/impl/nls/lang'
], function (_, $, Marionette, base, template, lang) {
  'use strict';

  var BreadcrumbItemView = Marionette.ItemView.extend({
    tagName: 'li',

    template: template,

    modelEvents: {
      change: 'render'
    },

    events: {
      'click a.csui-breadcrumb': 'onClickLink'
    },

    onClickLink: function (e) {
      if (base.isControlClick(e)) {
      } else {
        e.preventDefault();
        e.stopPropagation();

        var model = this.model;
        if (model.get('subcrumbs').length > 0) {
          var id = $(e.target).data('id');
          model = this._getModel(id);
        }
        this.triggerMethod('click:ancestor', model);
      }
    },

    className: function () {
      var cname,
          subCrumbs = this.model.get('subcrumbs');

      if (this.options.isLastChild) {
        cname = 'binf-active';
      } else if (subCrumbs && subCrumbs.length > 0) {
        cname = 'binf-dropdown';
      } else {
        cname = 'tail';
      }

      return cname;
    },
    getAncestorUrl: function (crumb) {
      return crumb.get('hrefSrc') || '#';
    },
    getDisplayName: function () {
      return this.model.get('displayName') || this.model.get('name_formatted') ||
             this.model.get('name');
    },

    templateHelpers: function () {
      var options   = this.options,
          subCrumbs = _.map(this.model.get('subcrumbs'), _.bind(function (crumb) {
            return _.extend(crumb.toJSON(), {url: this.getAncestorUrl(crumb)});
          }, this));
      return {
        inactive: this.model.get('inactive') || options.isLastChild,
        hasSubCrumbs: subCrumbs.length > 0,
        subcrumbs: subCrumbs,
        name: this.getDisplayName(),
        url: this.getAncestorUrl(this.model),
        subcrumbTooltip: lang.subcrumbTooltip,
        subcrumbAria: lang.subcrumbAria
      };
    },

    onRender: function () {
    },

    constructor: function BreadcrumbItemView(options) {
      options || (options = {});
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
      if (!this.model.has('subcrumbs')) {
        this.model.set('subcrumbs', [], {silent: true});
      }
    },

    _getModel: function (id) {
      var subCrumbs = this.model.get('subcrumbs'),
          model     = null;

      for (var i = 0; i < subCrumbs.length; i++) {
        if (subCrumbs[i].get('id') === id) {
          model = subCrumbs[i];
          break;
        }
      }
      return model;
    }
  });

  return BreadcrumbItemView;
});
