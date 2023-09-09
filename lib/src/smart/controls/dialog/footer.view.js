/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/lib/backbone','nuc/lib/marionette','nuc/lib/underscore',
], function (Backbone, Marionette, _
) {
  var ButtonView = Marionette.ItemView.extend({

    tagName: 'button',

    className: 'binf-btn',

    template: false,

    triggers: {
      'click': 'click'
    },
    constructor: function ButtonView(options) {
      Marionette.View.prototype.constructor.apply(this, arguments);
      this.listenTo(this,"dom:refresh", _.bind(this.onDomRefresh, this));
    },
    isTabable: function () {
      return this.$el.is(':not(:disabled)') && this.$el.is(':not(:hidden)');
    },
    currentlyFocusedElement: function () {
      if (this.$el) {
        this.$el.prop('tabindex', 0);
      }
      return this.$el;
    },

    onRender: function () {
      var button = this.$el,
          attributes = this.model.attributes;
      button.text(attributes.label);
      button.addClass(
          attributes['default'] ? 'binf-btn-primary cs-add-button' : 'binf-btn-default');
      if (attributes.toolTip) {
        button.attr('title', attributes.toolTip);
      }
      if (attributes.id) {
        button.attr('id', attributes.id);
      }
      if (attributes.separate) {
        button.addClass('cs-separate');
      }
      this.updateButton(attributes);
     
    },

    onDomRefresh: function () {
      if (this.isTabable()) {
        this.currentlyFocusedElement();
      }
    },
    updateButton: function (attributes) {
      var $button = this.$el;
      attributes || (attributes = {});
      if (attributes.hidden !== undefined) {
        if (attributes.hidden) {
          $button.addClass('binf-hidden');
        } else {
          $button.removeClass('binf-hidden');
        }
      }
      if (attributes.disabled !== undefined) {
        $button.prop('disabled', attributes.disabled);
      }
      this.trigger("dom:refresh");
    }

  });
  var DialogFooterView = Marionette.CollectionView.extend({

    childView: ButtonView,
    constructor: function DialogFooterView(options) {
      Marionette.CollectionView.prototype.constructor.apply(this, arguments);
      this.completeCollection = new Backbone.Collection();
      if(this.collection && this.collection.length){
      this.completeCollection.add(this.collection.toJSON(), { silent: true });
      }
    },
    onDomRefresh: function () {
      this.children.each(function (buttonView) {
        buttonView.trigger('dom:refresh');
      });
    },
    getButtons: function () {
      return this.children.toArray();
    },
    updateButton: function (id, attributes) {
      var button = this.collection.get(id),
      completeCollectionButton = this.completeCollection.get(id);

      if (completeCollectionButton) {
      completeCollectionButton.set(attributes);
      }

      if (button) {
        this.children
            .findByModel(button)
            .updateButton(attributes);
      } else {
        ButtonView.updateButton(this.$('[data-cs-id="' + id + '"]'), attributes);
      }
    }

  });

  return DialogFooterView;
});
