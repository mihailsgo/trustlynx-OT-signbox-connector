/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["module", "csui/lib/jquery", "csui/lib/underscore",
  "csui/utils/log",
  "hbs!esoc/widgets/utils/command/comment/comment.toolitem",
  "csui/controls/toolbar/toolitem.view",
  "i18n!esoc/widgets/tablecell/nls/lang",
  'esoc/controls/icons/esoc.icons.v2'  // returns nothing, but needs to be loaded
], function (module, $, _, log, template, ToolItemView, Lang) {

  var CommentToolItemView = ToolItemView.extend({

    tagName: 'li',

    template: template,

    templateHelpers: function () {
      var commentCount = this.nodeModel.get('wnd_comments'),
      data = {
        iconName: commentCount > 0 ? 'esoc_comment32' : 'esoc_no_comment32',
        iconTheme: this._iconTheme,
        renderIconAndText: this.options.renderIconAndText === true,
        renderTextOnly: this.options.renderTextOnly === true,
        isSeparator: this.model.isSeparator(),
        id: this.model.attributes.commandData.id,
        wnd_comments_title: this._getCommentsTitle(commentCount),
        wnd_comments_validated: commentCount > 99 ? '99+' : (commentCount > 0 ? commentCount : ''),
        commentTooltip: Lang.addComments
      };
      return data;
    },

    constructor: function CommentToolItemView(options) {
      options || (options = {});
      ToolItemView.prototype.constructor.apply(this, arguments);

      this.nodeModel = this.model.get('commandData').currentNodeModel;
      this.listenTo(this.nodeModel, 'change comment:icon:view', this.render);
      this._iconTheme = options.useIconsForDarkBackground ? 'dark' : '';
    },
    _getCommentsTitle: function (commentCount) {
      Number.isInteger = Number.isInteger || function (value) {
        return typeof value === 'number' &&
               isFinite(value) &&
               Math.floor(value) === value;
      };
      commentCount = Number.isInteger(commentCount) ? commentCount : 0;
      if (commentCount !== 1) {
        return commentCount + " " + Lang.commentCount;
      } else {
        return "1 " + Lang.oneComment;
      }
    }
  });

  return CommentToolItemView;

});

