csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'hbs!conws/widgets/header/test/dialogs/tabable.test.view',
  'css!conws/widgets/header/test/dialogs/tabable.test.view'
], function (_, $, Backbone, Marionette, TabablesBehavior, template) {

  var NonEmptyingRegion = Marionette.Region.extend({

    constructor: function NonEmptyingRegion(options) {
      Marionette.Region.prototype.constructor.apply(this, arguments);
    },

    attachHtml: function (view) {
      this.el.appendChild(view.el);
    }
  });

  var TabableTestView = Marionette.LayoutView.extend({

    template: template,

    behaviors: {
      TabablesBehavior: {
        behaviorClass: TabablesBehavior,
        recursiveNavigation: true,
        containTabFocus: true
      }
    },

    regions: {
      view: '.tabable-test.view'
    },

    // constructor for the RolesEdit dialog
    constructor: function ModalDialogView(options) {
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },

    show: function () {
      // add region and view to region
      var region = new NonEmptyingRegion({el: document.body});
      region.show(this);
      // and return view
      return this;
    },

    destroy: function () {
      // destroy
      TabableTestView.__super__.destroy.apply(this, arguments);
      // and return
      return this;
    },

    kill: function () {
      // kill
      TabableTestView.__super__.destroy.apply(this, arguments);
      // and return
      return true;
    },

    onRender: function () {
      if (this.options.view) {
        this.view.show(this.options.view);
      }
    }
  });

  // return view
  return TabableTestView;
});


