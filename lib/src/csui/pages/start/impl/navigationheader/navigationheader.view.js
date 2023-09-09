/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'require', 'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/controls/globalmessage/globalmessage',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/widgets/navigation.header/navigation.header.controls',
  'hbs!csui/pages/start/impl/navigationheader/impl/navigationheader',
  'i18n!csui/pages/start/impl/nls/lang',
  'css!csui/pages/start/impl/navigationheader/impl/navigationheader',
  'csui/lib/jquery.when.all'
], function (require, module, _, $, Backbone, Marionette, GlobalMessage,
    LayoutViewEventsPropagationMixin, controls, template, lang) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    enableMinimiseButtonOnProgressPanel: true
  });

  var NavigationHeaderView = Marionette.LayoutView.extend({
    template: template,

    regions: {
      messageRegion: '.csui-navbar-message'
    },

    ui: {
      branding: '.binf-navbar-brand',
      logo: '.csui-logo',
      left: '.binf-navbar-left',
      right: '.binf-navbar-right'
    },

    templateHelpers: function () {
      return {
        mainNavigationAria: lang.mainNavigationAria
      };
    },

    constructor: function NavigationHeaderView(options) {
      Marionette.LayoutView.call(this, options);
      this.propagateEventsToRegions();
      this.listenTo(this, 'render:controls', this._adjustControls.bind(this));
      this.listenTo(this, 'processbar:minimize processbar:maximize',
          this._adjustControlsWithAnimation.bind(this));
      this.listenTo(this, 'before:destroy', _.bind(function () {
        $(window).off('resize.' + this.cid, this._adjustControls.bind(this));
      }, this));
      $(window).on('resize.' + this.cid, this._adjustControls.bind(this));
    },

    _adjustControls: function () {
      var totalWidth          = this.el.offsetWidth,
          leftToolbarEle      = this.el.getElementsByClassName('binf-navbar-left')[0],
          leftToolbarWidth    = 0,
          rightToolbarEle     = this.el.getElementsByClassName('binf-navbar-right')[0],
          rightToolbarWidth   = 0,
          logoEle             = this.el.getElementsByClassName('csui-logo')[0],
          logoLocation        = controls.logo.get('location'),
          logoWrapper         = this.el.getElementsByClassName('csui-logo-' + logoLocation)[0],
          isLogoInAbsolutePos = logoWrapper && window.getComputedStyle(logoWrapper).position === 'absolute',
          bufferForLogo       = 40,
          logoEleWidth        = logoEle.offsetWidth + bufferForLogo;

      for (var i = 0; i < rightToolbarEle.childElementCount; i++) {
        rightToolbarWidth += (rightToolbarEle.children[i].offsetWidth || 0);
      }
      for (i = 0; i < leftToolbarEle.childElementCount; i++) {
        leftToolbarWidth += (leftToolbarEle.children[i].offsetWidth || 0);
      }
      var isLogoOverlapped = !(isLogoInAbsolutePos ?
                             ((leftToolbarWidth + logoEleWidth / 2 < totalWidth / 2) &&
                              (rightToolbarWidth + logoEleWidth / 2 < totalWidth / 2)) :
                             totalWidth > (leftToolbarWidth + rightToolbarWidth + logoEleWidth));

      if (isLogoOverlapped) {
        logoEle.classList.add('binf-logo-hide');
      } else {
        if(logoEleWidth > 40){
          logoEle.classList.remove('binf-logo-hide');
        }
      }
      this.listenTo(this, "header:control:clicked", _.bind(function() {
        this.trigger("control:clicked");
      }, this));
    },

    _adjustControlsWithAnimation: function () {
      setTimeout(_.bind(function () {
        this._adjustControls();
      }, this), 301);
    },

    onRender: function () {
      var context = this.options.context,
          self    = this;

      GlobalMessage.setMessageRegionView(this, {
        classes: "csui-global-message",
        enableMinimiseButtonOnProgressPanel: config.enableMinimiseButtonOnProgressPanel
      });

      var logoLocation = controls.logo.get('location');
      if (logoLocation === 'none') {
        this.ui.logo.addClass('binf-hidden');
      } else {
        this.ui.branding.addClass('csui-logo-' + logoLocation);
      }

      this._resolveComponents()
          .done(function () {
            self.trigger('before:render:controls', self);
            controls.leftSide.each(createControls.bind(self, self.ui.left));
            controls.rightSide.each(createControls.bind(self, self.ui.right));
            self.trigger('render:controls', self);
          });

      function createControls(target, control) {
        var View = control.get('view');
        if (View) {
          var el     = $('<div>').addClass(control.get('parentClassName'))
              .appendTo(target),
              region = self.addRegion(_.uniqueId('csui:navigation.header.control'), {selector: el}),
              view   = new View({
                context: context,
                parentView: self
              });
          region.show(view);
        }
      }
    },

    _resolveComponents: function () {
      if (this._controlsResolved) {
        return this._controlsResolved;
      }

      function resolveControl(name) {
        var deferred = $.Deferred();
        require([name], deferred.resolve, deferred.reject);
        return deferred.promise();
      }

      var allComponents = controls.leftSide.models.concat(controls.rightSide.models),
          promises      = allComponents.map(function (control) {
            return resolveControl(control.id);
          }),
          deferred      = $.Deferred();
      $.whenAll.apply($, promises)
          .always(function (views) {
            views.forEach(function (view, index) {
              allComponents[index].set('view', view);
            });
            deferred.resolve();
          });
      this._controlsResolved = deferred.promise();
      return this._controlsResolved;
    }
  });

  _.extend(NavigationHeaderView.prototype, LayoutViewEventsPropagationMixin);

  return NavigationHeaderView;
});
