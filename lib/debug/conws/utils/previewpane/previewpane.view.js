// Business Workspace Header View
csui.define([
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/lib/handlebars',
  'csui/behaviors/widget.container/widget.container.behavior',
  'csui/utils/base',
  'csui/utils/log',
  'csui/utils/url',
  'csui/controls/list/emptylist.view',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'conws/utils/previewpane/impl/previewheader.model',
  'conws/utils/previewpane/impl/previewheader.view',
  'conws/utils/previewpane/impl/attributes.model',
  'conws/utils/previewpane/impl/role.model',
  'conws/utils/previewpane/impl/rolemembers.view',
  'conws/widgets/metadata/impl/forms.metadata.update.model',
  'conws/controls/selectedmetadataform/selectedmetadataform.view',
  'i18n!conws/utils/previewpane/impl/nls/previewpane.lang',
  'hbs!conws/utils/previewpane/impl/previewpane',
  'css!conws/utils/previewpane/impl/previewpane'
], function (require, _, $, Marionette, Handlebars, WidgetContainerBehavior, base, log, Url,
    EmptyView, PerfectScrollingBehavior, LayoutViewEventsPropagationMixin,
    PreviewHeaderModel, PreviewHeaderView, PreviewAttributesModel,
    RoleMemberCollection, RoleMembersView,
    MetadataModel, MetadataView,
    lang, template) {

  // initialize the Header View
  var PreviewPaneView = Marionette.LayoutView.extend({
    // CSS class names
    className: 'conws-preview panel panel-default',

    // Template is used to render the HTML for the view
    template: template,

    // the nested region is required to place right hand child view
    regions: {
      headerRegion: '.conws-preview-header',
      metaDataRegion: '.conws-preview-metadata',
      roleMembersRegion: '.conws-preview-role-members'
    },

    // the triggers are used to add / remove the workspace icon
    triggers: {
      'change #header-ws-add-icon-file': 'add:icon',
      'click  #header-ws-remove-icon': 'remove:icon'
    },

    // find a better solution instead of a blank 1x1px png image
    blankImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQI12NgYAAAAAMAASDVlMcAAAAASUVORK5CYII=',

    behaviors: {
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.conws-preview-perfect-scroll',
        suppressScrollX: true
      }
    },

    // The constructor gives an explicit name the the object in the debugger and
    // can update the options for the parent view
    constructor: function PreviewPaneView(options) {
      // wire models and collections also to the parent view
      Marionette.LayoutView.prototype.constructor.call(this, options);

      options || (options = {});
      this.config = options.config;
      this.fetched = false;

      // Only in case role or metadata is configured, show preview
      if (this.config.roleId || this.config.metadata) {
        // the related item view to show the preview for
        this.parent = options.parent;

        this.config.noMetadataMessage = this._localize('noMetadataMessage');
        this.config.noRoleMembersMessage = this._localize('noRoleMembersMessage');
        this.config.readonly = true;

        //---------------------------------------------------------------
        // create Backbone models for PreviewPane
        //---------------------------------------------------------------
        this.headerModel = new PreviewHeaderModel(options);
        this.metaDataModel = new MetadataModel(undefined, {
          node: options.node,
          metadataConfig: this.config,
          autofetch: true,
          autoreset: true
        });

        this.roleMemberCollection = new RoleMemberCollection(null, options);

        //---------------------------------------------------------------
        // setup popover
        //---------------------------------------------------------------
        var container = $.fn.binf_modal.getDefaultContainer ?
                        $.fn.binf_modal.getDefaultContainer() : 'body';
        options.parent.$el.binf_popover({
          content: this.$el,
          parent: options.parent.$el,
          placement: function () {
            // reset element where popover is displayed, could have been changed e.g. due to
            // resize browser
            this.$element = this.options.parent;

            // See also binf.js (Bootstrap - popover placement)
            var defaultPlacement = "right";
            var placement = defaultPlacement;
            var tip = this.tip();

            // To get the correct size and check the position, it must be attached
            tip.detach()
                .css({top: 0, left: 0, display: 'block'})
                .addClass('binf-' + placement)
                .data('binf.' + this.type, this);
            this.options.container ? tip.appendTo(this.options.container) : tip.insertAfter(this.$element);

            var pos = this.getPosition();
            var $container = this.options.container ? $(this.options.container) :
                             this.$element.parent();
            var containerDim = this.getPosition($container);
            var actualWidth = tip[0].offsetWidth;

            // Check for space on the right side or on the left side of the widget
            // containerDim.width = complete window width
            if ((pos.right + actualWidth < containerDim.width) || (pos.left - actualWidth > 0)) {
              // Calculate right or left placement beside the widget
              placement = pos.right + actualWidth > containerDim.width ? 'left' :
                          pos.left - actualWidth < containerDim.left ? 'right' :
                          placement;
            }
            else {
              // In case on the left and on the right side is not enough space, place it on the
              // right side beside the title. Therefore change element beside popup is displayed
              // to preview pane default position element if exist
              var defaultPosition = $(this.$element[0]).find('.conws-previewpane-default-position');
              if (defaultPosition.length > 0) {
                this.$element.removeAttr('aria-describedby')
                this.$element = defaultPosition
                this.$element.attr('aria-describedby', tip.attr('id'))
              }
            }

            // If placement has changed, set proper class
            if( placement !== defaultPlacement ){
              tip.removeClass('binf-' + defaultPlacement).addClass('binf-' + placement);
            }

            return placement;
          },
          trigger: 'manual',
          container: container,
          html: true
        });

        var $tip = this.parent.$el.data('binf.popover');
        var $pop = $tip.tip();
        $pop.addClass('conws-previewpane-popover');

        //---------------------------------------------------------------
        // setup event handlers for popover and its associated item view
        //---------------------------------------------------------------

        $pop.on('mouseenter', this, $.proxy(function () {
              if (this.config.debug === true) {
                log.info('Preview ' + this.options.node.get('id') + ': Mouseenter popover') && console.log(log.last);
              }
              this.show();
            }, this)
        );

        $pop.on('mouseleave', this, $.proxy(function () {
              if (this.config.debug === true) {
                log.info('Preview ' + this.options.node.get('id') + ': Mouseleave popover') && console.log(log.last);
              }
              this.delayedHide();
            }, this)
        );

        this.propagateEventsToRegions();
      }
    },

    onBeforeDestroy: function (e) {
      if (this.config.roleId || this.config.metadata) {
        this.parent.$el.binf_popover('destroy');
      }
    },

    show: function () {
      // Only in case role or metadata is configured, show preview
      if (this.config.roleId || this.config.metadata) {
        var that = this;

        if (this.config.debug === true) {
          log.info('Preview ' + this.options.node.get('id') + ': Preparing show') && console.log(log.last);
        }

        // clear hide timeout if there is one
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
          if (this.config.debug === true) {
            log.info('Preview ' + this.options.node.get('id') + ': Cleared hide timeout') && console.log(log.last);
          }
          this.hideTimeout = null;
        }

        // nothing to do if already visible
        if (this.$el.is(":visible")) {
          if (this.config.debug === true) {
            log.info('Preview ' + this.options.node.get('id') + ': Already visible') && console.log(log.last);
          }
          return;
        }

        this.showCancelled = false;

        this.$el.hide();
        this.render();
        var $deferred = $.Deferred();

        if (this.headerView) {
          this.headerView.destroy();
        }

        if (this.roleView) {
          this.roleView.destroy();
        }

        if (this.metaDataView) {
          this.metaDataView.destroy();
        }

        this.headerView = new PreviewHeaderView({model: this.headerModel, originatingView: this, context: this.options.context});
        this.roleView = new RoleMembersView({
          collection: this.roleMemberCollection,
          noRoleMembersMessage: this.config.noRoleMembersMessage,
          // Context is needed in constructor of TeamMemberListItem, so we need to pass it here
          context: this.options.context
        });
        this.listenTo(this.roleView, 'click:member', this.hide);

        this.metaDataView = new MetadataView({
          model: this.metaDataModel,
          context: this.options.context
        });
        this.metaDataView.on('render:form', function () {
          that._attachUserFieldHandlers(this);
          // Only called in case meta data configured
          $deferred.resolve();
        });

        if( !this.config.metadata ){
          // In case no meta data configured, still show role members
          $deferred.resolve();
        }

        var proms;
        if (!this.fetched) {
          proms = [
            this.headerModel.fetch(),
            this.metaDataModel.fetch(),
            this.roleMemberCollection.fetch(),
            $deferred
          ];
        }
        else if ( this.config.metadata ) {
          // Do only in case metadata is configured
          this.metaDataModel.trigger('change');
          proms = [
            $.Deferred().resolve(),
            $.Deferred().resolve(),
            $.Deferred().resolve(),
            $deferred
          ];
        }

        $.when.apply(this, proms).done(
            _.bind(function () {
              this.fetched = true;
              if (!this.showCancelled) {
                // close all other preview popovers
                $(".conws-previewpane-popover").each(function (i, el) {
                  var popoverId = $(el).attr('id');
                  $("[aria-describedby^='" + popoverId + "']").binf_popover('hide')
                });

                if (this.config.debug === true) {
                  log.info('Preview ' + this.options.node.get('id') + ': Showing') && console.log(log.last);
                }

                var renderMeta = false;
                if (_.isEmpty(this.metaDataModel.attributes.data)) {
                  this.metaDataView = new EmptyView({text: this.config.noMetadataMessage});
                  renderMeta = true;
                }

                // prepare and show popover for this item
                this.headerRegion.show(this.headerView, {render: true});
                this.metaDataRegion.show(this.metaDataView, {render: renderMeta});
                this.roleMembersRegion.show(this.roleView, {render: true});
                this.$el.show();
                this.options.parent.$el.binf_popover('show');

                if (this.config.debug === true) {
                  log.info("Viewport height: " + $(window).height()) && console.log(log.last);
                  log.info("document height: " + $(document).height()) && console.log(log.last);
                  log.info("body     height: " + $('body').height()) && console.log(log.last);
                  log.info("popover  height: " + this.$el.height()) && console.log(log.last);
                  log.info("metadata height: " +
                              this.$el.find('.conws-preview-metadata').height()) && console.log(log.last);
                  log.info("role     height: " +
                              this.$el.find('.conws-preview-role-members').height()) && console.log(log.last);
                }
                //triggering the perfect scroll behavior after updating the dom with metadata and roles data
                this.triggerMethod('dom:refresh');
              }
              else if (this.config.debug === true) {
                log.info('Preview ' + this.options.node.get('id') +
                            ': Show was cancelled -> skipped') && console.log(log.last);
              }
            }, this)
        );
      }
    },

    hide: function () {
      if (this.config.debug === true) {
        log.info('Preview ' + this.options.node.get('id') + ': Going to hide') && console.log(log.last);
      }

      if (this.config && !this.config.debugNoHide) {
        if (this.config.debug === true) {
          log.info('Preview ' + this.options.node.get('id') + ': Hidden') && console.log(log.last);
        }
        this.options.parent.$el.binf_popover('hide');
        this.hideTimeout = null;
      }
      else {
        if (this.config.debug === true) {
          log.info('Preview ' + this.options.node.get('id') + ': Leaving visible') && console.log(log.last);
        }
      }

      this.showCancelled = true;
      this.hideTimeout = null;
    },

    delayedHide: function () {
      if (this.config.debug === true) {
        log.info('Preview ' + this.options.node.get('id') + ': Setting hide timeout') && console.log(log.last);
      }
      this.hideTimeout = window.setTimeout($.proxy(this.hide, this), 200);
    },

    _localize: function (name) {
      var ret = lang[name];

      if (this.config[name]) {
        ret = base.getClosestLocalizedString(this.config[name], ret);
      }

      return ret;
    },

    // Attaches event handlers to user fields to
    //    1. prevent user fields from displaying their info popover
    //    2. close preview pane when user field is clicked to open user profile
    _attachUserFieldHandlers: function (metadataView) {
      var handler = function (event) {
        log.info("User field mouseover") && console.log(log.last);
        event.stopPropagation();
        return false;
      };

      var userFields = metadataView.$el.find(".cs-userfield .cs-field-read");
      _.each(userFields, function (field) {
        field.addEventListener('mouseover', handler, true);
      });

      handler = $.proxy(this.hide, this);
      metadataView.$el.find(".cs-userfield .cs-field-read-inner").on('click',handler);
    }
  });

  _.extend(PreviewPaneView.prototype, LayoutViewEventsPropagationMixin);

  // return the initialized view
  return PreviewPaneView;
});
