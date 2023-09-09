/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/marionette', 'csui/lib/backbone',
  'csui/utils/commands',
  'csui/utils/commandhelper'
], function (_, Marionette, Backbone, commands, CommandHelper) {
  'use strict';

  var ParentBaseView = Marionette.ItemView.extend({

    constructor: function ParentBaseView(options) {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.listenTo(this, 'cell:node:request', function () {
        var command = commands.get('goToLocation');
        if (!command) {
          throw new Error('Invalid command: goToLocation');
        }
        var status = {
              nodes: new Backbone.Collection([this.options.node]),
              model: this.options.model,
              context: this.options.context,
              originatingView: this
            },
            options = {
              context: this.options.context,
              originatingView: this
            };
        CommandHelper.handleExecutionResults(command.execute(status, options));
      });
    }

  });

  return ParentBaseView;
});
