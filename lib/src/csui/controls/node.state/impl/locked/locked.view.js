/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/marionette3', 'csui/utils/base',
  'csui/utils/contexts/factories/user', 'csui/models/nodes',
  'csui/utils/commandhelper',
  'csui/utils/commands/compound.document/unlock',
  'hbs!csui/controls/node.state/impl/locked/impl/locked',
  'i18n!csui/controls/node.state/impl/locked/impl/nls/lang',
  'css!csui/controls/node.state/impl/locked/impl/locked'
], function (_, Marionette, base, UserModelFactory, NodeCollection, CommandHelper, UnlockCommand, template, lang) {
  'use strict';

  var LockedIconView = Marionette.View.extend({
    tagName: 'li',
    className: 'csui-node-state-locked',

    template: template,
    templateContext: function () {
      var locked = this.model.get('locked'),
        isLockedByOther = false,
        lockedDate, lockedUserExpand, lockedTooltip, lockedUser, lockedAria;
      if (locked) {
        lockedUserExpand = this.model.get('locked_user_id_expand');
        isLockedByOther = this.userId !== this.model.get('locked_user_id');
        lockedDate = base.formatExactDate(this.model.get('locked_date'));
        if (lockedUserExpand) {
          lockedUser = lockedUserExpand.name;
          lockedTooltip = _.str.sformat(lang.lockedTooltip, lockedUserExpand.name, lockedDate);
          lockedAria = _.str.sformat(lang.lockedAria, lockedUserExpand.name, lockedDate);
        }
      }
      this.lockedStatus = {
        locked: locked,
        lockedUser: lockedUser,
        lockedTooltip: lockedTooltip,
        lockedAria: lockedAria,
        canUnlock: this.canUnlock || !isLockedByOther
      };
      return this.lockedStatus;
    },

    triggers: {
      'click button': 'remove:lock'
    },

    constructor: function LockedIconView() {
      Marionette.View.prototype.constructor.apply(this, arguments);
    },

    initialize: function () {
      var user = this.options.context.getModel(UserModelFactory);
      this.userId = user.get('id');
      this.commandStatus = { nodes: new NodeCollection([this.model]), context: this.options.context };
      this.unlockCommand = new UnlockCommand();
      this.canUnlock = this.unlockCommand.enabled(this.commandStatus);
    },

    onRemoveLock: function () {
      var promiseFromCommand;
      if (this.lockedStatus.canUnlock) {
        promiseFromCommand = this.unlockCommand.execute(this.commandStatus);
        CommandHelper.handleExecutionResults(
          promiseFromCommand, {
            command: this.unlockCommand,
            suppressSuccessMessage: this.commandStatus.suppressSuccessMessage,
            suppressFailMessage: this.commandStatus.suppressFailMessage
          });
      }
    },

  },
    {
      enabled: function (status) {
        var model = status.node,
          isSupported = _.contains([138, 139], model.get("type")), // Lock is only supported for release and revision in smart view
        isLocked = isSupported ? model.has('locked') && model.get('locked') : false;
        return isLocked;
      },
      getModelExpand: function (options) {
        return {properties: ['locked_user_id']};
      }
    });

  return LockedIconView;
});