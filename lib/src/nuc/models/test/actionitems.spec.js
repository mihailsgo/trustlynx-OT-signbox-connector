/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'nuc/lib/backbone', 'nuc/models/actionitems'
], function (Backbone, ActionItemCollection) {
    'use strict';

  describe("ActionItemCollection", function () {
    beforeEach(function () {
      this.actions = new ActionItemCollection([{ signature: 'test' }]);
      this.CommandModel = Backbone.Model.extend({ idAttribute: 'signature' });
      this.CommandCollection = Backbone.Collection.extend({ model: this.CommandModel });
      this.commands = new this.CommandCollection();

    });

    it("collects command keys from attributes", function () {
      this.commands.add({ signature: 'test', command_key: ['test1'] });
      var commandKeys = this.actions.getAllCommandSignatures(this.commands);
      expect(Array.isArray(commandKeys)).toBeTruthy();
      expect(commandKeys.length).toBe(1);
      expect(commandKeys[0]).toBe('test1');
    });

    it("collects command keys from methods", function () {
      var command = new this.CommandModel({ signature: 'test' });
      command.getCommandKey = function () { return 'test2' };
      this.commands.add(command);
      var commandKeys = this.actions.getAllCommandSignatures(this.commands);
      expect(Array.isArray(commandKeys)).toBeTruthy();
      expect(commandKeys.length).toBe(1);
      expect(commandKeys[0]).toBe('test2');
    });

    it("Ensure restapi calls for command are all lower case, no matter the case initially", function () {
      var command = new this.CommandModel({ signature: 'test' });
      command.getCommandKey = function () { return 'TEST3' };
      this.commands.add(command);
      var commandKeys = this.actions.getAllCommandSignatures(this.commands);
      expect(Array.isArray(commandKeys)).toBeTruthy();
      expect(commandKeys.length).toBe(1);
      expect(commandKeys[0]).toBe('test3');
    });
  });
});