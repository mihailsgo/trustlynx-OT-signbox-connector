/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/underscore',
  'i18n!greet/commands/add.hello/custom.inlineform/impl/nls/lang',
  'csui/controls/table/inlineforms/inlineform.registry',
  'csui/controls/table/inlineforms/inlineform/impl/inlineform.view',
  "hbs!greet/commands/add.hello/custom.inlineform/impl/hello.inlineform",
  "css!greet/commands/add.hello/custom.inlineform/impl/hello.inlineform"
], function ($, _, lang, inlineFormViewRegistry, InlineFormView, template) {
  'use strict';

  var HelloInlineFormView = InlineFormView.extend({

        className: function () {
          var className = "csui-inlineform-hello";
          if (InlineFormView.prototype.className) {
            className += ' ' + _.result(InlineFormView.prototype, 'className');
          }
          return className;
        },

        template: template,

        templateHelpers: function () {
          var data = this._templateHelpers();
          return _.extend(data, {
            namePlaceholder: lang.NamePlaceholder,
            descriptionPlaceholder: lang.DescriptionPlaceholder
          });
        },

        viewToModelData: function () {
          this._viewToModelData();

          var input = _.find(this.ui.descriptionInput, function (input) {
                return input.offsetHeight > 0;
              }),
              value = $(input).val().trim();
          this.model.set('description', value, {silent: true});
        },

        ui: {
          descriptionInput: '.greet-inlineform-input-hello'
        },

        events: {
          'keyup @ui.descriptionInput': 'keyReleased'
        },

        constructor: function HelloInlineFormView(options) {
          this.options = options || {};

          this.ui = _.extend({}, this.ui, InlineFormView.prototype.ui);
          this.events = _.extend({}, this.events, InlineFormView.prototype.events);

          InlineFormView.prototype.constructor.apply(this, arguments);
        },

        _saveIfOk: function () {
          this.viewToModelData();
          var name = this.model.get('name');
          var description = this.model.get('description');
          if (name.length > 0) {
            this._save({name: name, url: description});
          }
        }

      },
      {
        CSSubType: 12345 // Content Server Subtype of Url is 140
      }
  );

  inlineFormViewRegistry.registerByAddableType(HelloInlineFormView.CSSubType, HelloInlineFormView);

  return HelloInlineFormView;

});
