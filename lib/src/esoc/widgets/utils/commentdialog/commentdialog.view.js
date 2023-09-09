/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/handlebars',
  'csui/lib/marionette',
  'csui/utils/contexts/factories/connector',
  'esoc/widgets/utils/commentdialog/commentdialog.model',
  'hbs!esoc/widgets/tablecell/impl/tablecell',
  'esoc/widgets/socialactions/commentscollectionwidget',
  'esoc/widgets/common/util',
  'esoc/factory/commentmodelfactory',
  'csui/utils/log',
  'csui/utils/url',
  'i18n!esoc/widgets/tablecell/nls/lang',
  'esoc/controls/icons/esoc.icons.v2',  // returns nothing, but needs to be loaded
  'css!esoc/widgets/socialactions/socialactions.css',
  'css!esoc/widgets/tablecell/impl/social.css'
], function ($, _, Handlebars, Marionette, ConnectorFactory, CommentDialogModel,
    CommentDialogTemplate, CommentsCollectionWidget, CommonUtil, CommentModelFactory, Log, Url,
    Lang) {
  var self = null;
  var CommentDialogView = Marionette.ItemView.extend({

    className: 'esoc-socialactions-wrapper',
    template: CommentDialogTemplate,

    templateHelpers: function () {
      var messages = {
            addComments: Lang.addComments
          },
          comments_count = this.model.get('wnd_comments') || 0,
          wnd_comments_title = comments_count > 0 ?
                               comments_count > 1 ?
                               comments_count + " " + Lang.commentCount :
                               comments_count + " " + Lang.oneComment : '';
      return {
        messages: messages,
        wnd_comments_title: wnd_comments_title,
        iconName: comments_count > 0 ? 'esoc_comment32' : 'esoc_no_comment32',
        iconTheme: this._iconTheme
      };
    },

    initialize: function (options) {
      this.options = options;
      self = this;
      $(document).on('keydown click', this.closeCommentDialog);
    },

    events: {
      'click .esoc-socialactions-comment .esoc-socialactions-comment-button': 'onClickComments'
    },

    log: Log,
    commonUtil: CommonUtil,

    constructor: function CommentDialogView(options) {
      options = options || {};
      this._iconTheme = options.useIconsForDarkBackground ? 'dark' : '';
      options.connector = options.connector ? options.connector :
                          options.context.getObject(ConnectorFactory);
      if (!options.model) {
        options.model = options.context.getModel(CommentModelFactory, {
          attributes: {id: options.nodeid},
          connector: options.connector
        });
        options.model.ensureFetched();
      } else {
        this.updateSocailActions(options.model);
        var commentsCount = options.model.get('wnd_comments') || 0,
            wnd_comments_validated = commentsCount > 0 ?
                                     commentsCount > 99 ? '99+' :
                                     commentsCount : '',
         commentDlgModel = new CommentDialogModel({
          wnd_comments_validated: wnd_comments_validated,
          wnd_comments: options.model.get('wnd_comments'),
          socialactions: options.model.get('socialactions'),
          id: options.model.get('id'),
          showSocialActions: options.model.get('showSocialActions')
        }, {
          connector: options.connector,
          csid: options.nodeid
        });
	options.model.attributes = _.extend(options.model.attributes, commentDlgModel.attributes);

      }
      Marionette.ItemView.prototype.constructor.call(this, options);

      this.model.on('change', this.render, this);
      this.model.on('error', this.errorHandle, this);
    },

    errorHandle: function (model, response) {
      var errText = response.responseJSON ?
                    (response.responseJSON.errorDetail ? response.responseJSON.errorDetail :
                     response.responseJSON.error) :
                    Lang.defaultErrorMessageCommentsFetch;
      self.log.info("Error Occured :" + errText);
    },

    updateSocailActions: function (nodeModel) {
      var showSocialActions = !!nodeModel.actions.get('comment');
      nodeModel.attributes.showSocialActions = showSocialActions;
      nodeModel.attributes.socialactions = {
        "attachementsEnabled": showSocialActions,
        "chatEnabled": showSocialActions,
        "commentingOpen": showSocialActions,
        "commentsEnabled": showSocialActions,
        "CSID": nodeModel.attributes.id,
        "likesEnabled": showSocialActions,
        "taggingEnabled": showSocialActions,
        "threadingEnabled": showSocialActions,
        "shortcutEnabled": showSocialActions
      };
    },

    onClickComments: function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.options.originatingView && this.options.originatingView._blockingCounter < 1) {
        this.options.originatingView.blockActions();
      }
      var commentConfig = {
            tablecellwidget: true,
            currentNodeModel: this.model,
            baseElement: this.$el.find(".esoc-socialactions-comment"),
            currentTarget: e.currentTarget,
            socialActionsInstanse: this,
            nodeID: this.options.CSID,
            context: this.options.context,
            blockingParentView: this.options.originatingView
          },
          csId = commentConfig.nodeID;
      commentConfig.csId = csId;
      var ajaxParams = {
        "url": Url.combine(CommonUtil.getV2Url(this.options.connector.getConnectionUrl()),
            "nodes", csId),
        "type": "GET",
        "connector": this.options.connector,
        "currentNodeModel": this.model,
        "requestType": "updateCommentCount"
      };
      CommonUtil.updateAjaxCall(ajaxParams);

      var restUrl = Url.combine(this.options.connector.connection.url,
          this.commonUtil.REST_URLS.csGetROI) + "CSID=" + csId;
      var responseData;

      $.ajax(this.options.connector.extendAjaxOptions({
        type: "GET",
        async: false,
        cache: false,
        url: restUrl,
        success: function (response) {
          responseData = JSON.parse(JSON.stringify(response.available_settings));
        },
        error: function () {
          self.log.error("Error while getting available settings");
        }
      }));
      this.model.attributes.socialactions = responseData;
      commentConfig.socialActionsInstanse.options.connector.connection.url = this.options.connector.connection.url;
      var commentsCollectionWidget = new CommentsCollectionWidget(commentConfig);
      commentsCollectionWidget.show();
      $(document.activeElement).trigger("blur");
    }
  });
  return CommentDialogView;
});
