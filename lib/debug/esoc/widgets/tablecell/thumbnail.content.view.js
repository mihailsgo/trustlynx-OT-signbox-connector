csui.define(['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/handlebars', 'csui/lib/marionette',
  'csui/utils/contexts/factories/connector',
  'csui/controls/thumbnail/content/content.registry',
  'csui/controls/thumbnail/thumbnail.content',
  'csui/utils/url',
  'csui/utils/log',
  'hbs!esoc/widgets/tablecell/impl/tablecell',
  'esoc/widgets/socialactions/commentscollectionwidget',
  'esoc/widgets/tablecell/tablecell.model',
  'esoc/widgets/common/util',
  'i18n!esoc/widgets/tablecell/nls/lang',
  'css!esoc/widgets/tablecell/impl/social.css',
  'css!esoc/widgets/socialactions/socialactions.css'
], function (_, $, Handlebars, Marionette, ConnectorFactory, ContentRegistry, thumbnailContent, Url,
    Log, template, CommentsCollectionWidget, TableCellModel, CommonUtil, lang) {

  // Writes the `thenValue` to the output if the `flag` converts to `true`,
  // otherwise writes the `elseValue`.  If no `elseValue` is provided,
  // nothing will be written out.
  Handlebars.registerHelper('value-if', function (flag, thenValue, elseValue) {
    // The last parameter is a hash of named parameters, which are not used
    // here; use it to simulate the undefined default value for the `elsevalue`
    if (_.isObject(elseValue) && _.isObject(elseValue.hash)) {
      elseValue = '';
    }
    return flag ? thenValue : elseValue;
  });

  // Declares a column which renders its contents by a template and uses
  // the social information as-is inside the template
  var ThumbnailContentView = Marionette.ItemView.extend({

        // The table cell will obtain a CSS class `esoc-column-social`
        // automatically; we just add a class provided by the CS UI Widgets
        // to prevent the icons to be wrapped on multiple lines
        className: 'csui-nowrap csui-thumbnail-test',

        // Point to the Handlebars template rendering the HTML view
        template: template,
        title: '',  // do not display the column header

        // Declare events triggered by clicking on the rendered icons; they
        // can be caught by the caller and they are handled in this object too

        events: {
          "keydown": "onKeyInView",
          "click .esoc-socialactions-comment .esoc-socialactions-comment-button": "onClickComment"
        },

        log: Log,
        commonUtil: CommonUtil,

        // Always declare the named constructor function to see the object name
        // in the web browser debugger
        constructor: function ThumbnailContentView(options) {
          options || (options = {});
          Marionette.ItemView.prototype.constructor.apply(this, arguments);
          // Whenever the social properties change, re-render the table cell;
          // this could be optimized to re-render just the elements which show
          // the changing data by using Backbone.ModelBinder, for example
          this.listenTo(this.model, 'change comment:icon:view', this.render);

          this._iconTheme = options.useIconsForDarkBackground ? 'dark' : '';
        },

        templateHelpers: function () {
          // set the computed social settings and return the model
          var actions = this.model.collection && this.model.collection.delayedActions,
              that = this,
              totalComments = this.model.get('wnd_comments') || 0;
          this.updateSocailActions(this.model);
          actions && this.listenTo(actions, 'sync', function () {
            that.updateSocailActions(that.model);
            that.render();
          });

          this.model.set('messages', lang, {silent: true});
          this.model.set('iconName', totalComments > 0 ? 'esoc_comment32' : 'esoc_no_comment32',
              {silent: true});
          this.model.set('iconTheme', this._iconTheme, {silent: true});
          this.model.set('wnd_comments_title',
              totalComments > 0 ? totalComments > 1 ?
                                  totalComments + " " + lang.commentCount :
                                  totalComments + " " + lang.oneComment : '', {silent: true});
          /* TODO: lang bundle has to move to templateHelpers*/
          this.model.set('wnd_comments_validated',
              totalComments > 0 ?
              totalComments > 99 ? '99' + '+' :
              totalComments : '', {silent: true});
          this.model.set('wnd_no_comments', lang.noComments, {silent: true});

          return this.model.toJSON();
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

        // Clicking on the comment icon adds a comment to the item on behalf
        // of the current user and updates the like count accordingly
        onClickComment: function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (!this.options.connector) {
            this.options.connector = this.options.context.getObject(ConnectorFactory);
          }
          var commentConfig = {
                tablecellwidget: true,
                currentNodeModel: this.model,
                currentTarget: $(e.currentTarget).closest(".csui-thumbnail-content.csui-thumbnail-wnd_comments"),
                baseElement: this.$el.find(".esoc-socialactions-comment"),
                socialActionsInstanse: this
              },
              commentEle = this.$el.find(".esoc-socialactions-comment")[0],
              csId = commentEle.getAttribute("data-value") || commentEle.dataset.value;
          commentConfig.csId = csId;

          if (this.options.originatingView) {
            commentConfig.blockingParentView = this.options.originatingView;
            this.options.originatingView._blockingCounter < 1 &&
            this.options.originatingView.blockActions();
          }
          var tableCellModel = new TableCellModel({
            csId: csId,
            currentNodeModel: this.model
          }, {
            connector: this.options.connector
          });

          tableCellModel.fetch().then(function (response) {
            this.model.attributes.socialactions = response.available_settings;
            commentConfig.socialActionsInstanse.options.connector.connection.url = this.options.connector.connection.url;
            var commentsCollectionWidget = new CommentsCollectionWidget(commentConfig);
            commentsCollectionWidget.show();
          }.bind(this), function (jqXHR, statusText, error) {
            this.options.originatingView && this.options.originatingView.unblockActions();
            this.log.error("TEMP.  ERROR Getting available settings");
          }.bind(this));
        },

        onKeyInView: function (event) {
          if (event.keyCode === 32 || event.keyCode === 13) {
            // space or enter key
            var hasSocialActions = !!this.model.actions.get('comment') ? true : false;
            if (hasSocialActions) {
              this.onClickComment(event);
            }
          }
        }
      },
      {
        hasFixedWidth: true,
        columnClassName: 'csui-table-cell-esoc-social'
      }
  );
  ContentRegistry.registerByKey('wnd_comments', ThumbnailContentView);
  // Make the column always appear behind the system columns, which have
  // sequence number < 100; custom columns have sequence number > 1000
  thumbnailContent.add({
    key: 'wnd_comments',
    sequence: 905,
    permanentColumn: true // don't wrap column due to responsiveness into details row
  });

});
