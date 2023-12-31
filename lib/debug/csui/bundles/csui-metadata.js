csui.define('csui/controls/tableheader/comment/comment.button.view',['require',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior'
], function (require,
    _,
    Marionette,
    ViewEventsPropagationMixin,
    TabableRegionBehavior) {

  var CommentButtonView = Marionette.View.extend({

    className: 'csui-comment-button',

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      }
    },

    constructor: function CommentButtonView(options) {
      Marionette.View.call(this, options);
      this.listenTo(this.model, 'change', this.render);
      var actions = this.model.actions;
      actions && this.listenTo(actions, 'update', this.render);
    },

    render: function () {
      var self = this;
      csui.require(['esoc/widgets/utils/commentdialog/commentdialog.view'],
          function (CommentDialogView) {
            var contentRegion = new Marionette.Region({
              el: self.el
            });

            var globalConfig = (typeof window.require !== "undefined") ?
                               window.require.s.contexts._.config :
                               window.csui.require.s.contexts._.config;
            globalConfig.roId = self.model.get('id');

            var commentDialogView = new CommentDialogView({
              connector: self.model.connector,
              nodeid: self.model.get('id'),
              CSID: self.model.get('id'),
              model: self.model,
              context: self.options.context,
              originatingView: self.options.originatingView
            });

            commentDialogView.listenTo(commentDialogView, 'before:render', function () {
              self.triggerMethod('before:render', self);
            });
            commentDialogView.listenTo(commentDialogView, 'render', function () {
              self.triggerMethod('render', self);
            });

            self.propagateEventsToViews(commentDialogView);
            contentRegion.show(commentDialogView);
          }, function () {}
      );
      return this;
    }

  });

  _.extend(CommentButtonView.prototype, ViewEventsPropagationMixin);

  return CommentButtonView;
});


csui.define('csui/widgets/metadata/versions.toolbaritems',['csui/lib/underscore',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'csui/controls/toolbar/toolitems.factory',
  // Load extra tool items to be added to this collection
  'csui-ext!csui/widgets/metadata/versions.toolbaritems',
  'csui/controls/toolbar/toolitem.model'
], function (_, lang, ToolItemsFactory, extraToolItems, TooItemModel) {

  var toolbarItems = {

    tableHeaderToolbar: new ToolItemsFactory(
        {
          info: [
            {
              signature: "VersionProperties",
              name: lang.ToolbarItemVersionInfo,
              iconName: "csui_action_properties32"
            },
            {
              signature: "DocVersionPreview",
              name: lang.ToolbarItemDocVersionPreview,
              commandData: {ifNotOpenDelegate: true}
            },
            {signature: "CopyLink", name: lang.ToolbarItemCopyLink}
          ],
          main: [
            {
              signature: 'EmailLink',
              name: lang.ToolbarItemEmailLink
            },
            {
              signature: "VersionDownload",
              name: lang.ToolbarItemVersionDownload
            },
            {
              signature: "VersionDelete",
              name: lang.ToolbarItemVersionDelete
            },
            {
              signature: "PromoteVersion",
              name: lang.ToolbarItemPromoteVersion
            }
          ]
        },
        {
          maxItemsShown: 10,
          dropDownIconName: "csui_action_more32"
        }),
    inlineActionbar: new ToolItemsFactory(
      {
        info: [
          {
            signature: 'VersionProperties',
            name: lang.ToolbarItemVersionInfo,
            iconName: 'csui_action_properties32'
          },
          {
            signature: "DocVersionPreview",
            name: lang.ToolbarItemDocVersionPreview,
            iconName: "csui_action_preview32",
            commandData: {ifNotOpenDelegate: true}
          },
          {
            signature: "CopyLink",
            name: lang.ToolbarItemCopyLink,
            iconName: "csui_action_copy_link32"
          }
        ],
        main: [
          {
            signature: 'EmailLink',
            name: lang.ToolbarItemEmailLink,
            iconName: 'csui_action_email32'
          },
          {
            signature: 'VersionDownload',
            name: lang.ToolbarItemVersionDownload,
            iconName: 'csui_action_download32',
          },
          {
            signature: 'VersionDelete',
            name: lang.ToolbarItemVersionDelete,
            iconName: 'csui_action_delete32',
          },
          {
            signature: 'PromoteVersion',
            name: lang.ToolbarItemPromoteVersion,
            iconName: 'csui_action_promote32',
          },
        ],
      },
      {
        maxItemsShown: 5,
        dropDownText: lang.ToolbarItemMore,
        dropDownIconName: 'csui_action_more32',
        addGroupSeparators: false,
      }
    ),
    dropdownMenuList: new ToolItemsFactory(
      {
        info: [
          {
            signature: "VersionProperties",
            name: lang.ToolbarItemVersionInfo
          },
          {signature: "CopyLink", name: lang.ToolbarItemCopyLink}
        ],
        main: [
          {
            signature: 'EmailLink',
            name: lang.ToolbarItemEmailLink
          },
          {
            signature: "VersionDownload",
            name: lang.ToolbarItemVersionDownload
          },
          {
            signature: "VersionDelete",
            name: lang.ToolbarItemVersionDelete
          },
          {
            signature: "PromoteVersion",
            name: lang.ToolbarItemPromoteVersion
          }
        ]
      },
      {
        maxItemsShown: 0, // force toolbar to immediately start with a drop-down list
        dropDownIconName: "csui_action_caret_down32"
      }
    ),
    rightToolbar: new ToolItemsFactory(
        {
          main: [
            {
              signature: "PurgeAllVersions",
              name: lang.ToolbarItemVersionPurgeAll
            }
          ]
        },
        {
          hAlign: "right"
        }
    )
  };

  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }

  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return toolbarItems;

});

csui.define('csui/widgets/metadata/impl/metadata.tabcontentcollection.view',['csui/lib/underscore', 'csui/controls/tab.panel/impl/tab.contents.view',
    'csui/utils/base'
], function(_, TabContentCollectionView, base) {

    // This view is specific to metadata view which overrides the 'currentlyFocusedElement' function such that 
    // only the tab contents elements visible in the current view port of the are focused on TAB and SHIFT+TAB.

    var MetadataTabContentCollectionView = TabContentCollectionView.extend({

        constructor: function MetadataTabContentCollectionView(attributes, options) {
            TabContentCollectionView.prototype.constructor.apply(this, arguments);
            _.extend(this, {
                currentlyFocusedElement: function(event) {
                    var reverseDirection = event && event.shiftKey;
                    var elToFocus = this.currentlyFocusedElementInternal(event);
                    var totalElements = this.keyboardBehavior.tabableElements.length;
                    var cursor =  (reverseDirection ? totalElements - 1 : 0);
                     while(elToFocus.hasClass('binf-hidden') &&
                            cursor >= 0 && cursor < totalElements) {
                        event.elementCursor = cursor = cursor  + (reverseDirection ? -1 : 1);
                        elToFocus = this.currentlyFocusedElementInternal(event);
                    }
                    //scroll to the last available element
                    if(!base.isElementVisibleInParent(elToFocus, this.$el, 1, 1)){
                        this.$el.scrollTop(elToFocus.offset().top);
                    }
                    return elToFocus;
                }
            });
        }
    });

    return  MetadataTabContentCollectionView;
});

csui.define('csui/widgets/metadata/impl/header/rightbar/toolbaritems',['csui/lib/underscore', 'csui/utils/base',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  // Load extra tool items to be added to this collection
  'csui-ext!csui/widgets/metadata/impl/header/rightbar/toolbaritems'
], function (_, base, lang, ToolItemsFactory, TooItemModel, extraToolItems) {
  'use strict';
  
  var toolbarItems = {

    rightToolbar: new ToolItemsFactory({
          main: [
          ]
        }
    )
  };

  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }

  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return toolbarItems;

});

csui.define('csui/widgets/metadata/impl/header/rightbar/toolbaritems.masks',['module', 'csui/lib/underscore',
  'csui/controls/toolbar/toolitems.mask',
  'csui/utils/toolitem.masks/global.toolitems.mask'
], function (module, _, ToolItemMask, GlobalMenuItemsMask) {
  'use strict';

  // Keep the keys in sync with csui/widgets/search.results/toolbaritems
  var toolbars = ['rightToolbar'];

  function ToolbarItemsMasks() {
    var config = module.config(),
        globalMask = new GlobalMenuItemsMask();
    // Create and populate masks for every toolbar
    this.toolbars = _.reduce(toolbars, function (toolbars, toolbar) {
      var mask = new ToolItemMask(globalMask, {normalize: false});
      // Masks passed in by separate require.config calls are sub-objects
      // stored in the outer object be different keys
      _.each(config, function (source, key) {
        source = source[toolbar];
        if (source) {
          mask.extendMask(source);
        }
      });
      // Enable restoring the mask to its initial state
      mask.storeMask();
      toolbars[toolbar] = mask;
      return toolbars;
    }, {});
  }

  ToolbarItemsMasks.toolbars = toolbars;

  return ToolbarItemsMasks;

});


csui.define('csui/utils/versions.default.action.items',[
  'module','csui/lib/underscore', 'csui/models/actionitems',
  // Load and register external default action rules
  'csui-ext!csui/utils/versions.default.action.items'
], function (module, _, ActionItemCollection, extraActions) {
  'use strict';

  var config = _.extend({
    openVersionContentOnly: false
  }, module.config());

  var defaultActionItems = new ActionItemCollection([
    {
      type: 144,
      signature: config.openVersionContentOnly ? 'OpenVersionDelegate' : 'VersionOpen',
      sequence: 10
    }
  ]);

  if (extraActions) {
    defaultActionItems.add(_.flatten(extraActions, true));
  }

  return defaultActionItems;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/header/item.name/metadata.item.name',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "  <div class=\"title-edit-icon-div\"></div>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "  <div class=\"csui-metadata-item-name-dropdown\"></div>\r\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <span class=\"csui-multilingual-icon-label\">\r\n      <button  class=\"icon csui-multilingual-icon\">\r\n        "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"states":"true","size":"small","iconName":"csui_action_language_switcher24"},"loc":{"start":{"line":31,"column":8},"end":{"line":31,"column":91}}})) != null ? stack1 : "")
    + "\r\n      </button>\r\n   </span>\r\n";
},"7":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button type=\"button\" class=\"csui-undo csui-edit-save inline-edit-icon\" disabled title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"save_edit_name_tooltip") || (depth0 != null ? lookupProperty(depth0,"save_edit_name_tooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"save_edit_name_tooltip","hash":{},"loc":{"start":{"line":36,"column":92},"end":{"line":36,"column":118}}}) : helper)))
    + "\">\r\n      "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"states":"true","size":"normal","iconName":"csui_action_confirm32"},"loc":{"start":{"line":37,"column":6},"end":{"line":37,"column":80}}})) != null ? stack1 : "")
    + "\r\n    </button>\r\n    <button type=\"button\" class=\"csui-undo csui-edit-cancel inline-edit-icon\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"cancel_edit_name_tooltip") || (depth0 != null ? lookupProperty(depth0,"cancel_edit_name_tooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cancel_edit_name_tooltip","hash":{},"loc":{"start":{"line":39,"column":85},"end":{"line":39,"column":113}}}) : helper)))
    + "\">\r\n      "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"states":"true","size":"normal","iconName":"csui_action_cancel32"},"loc":{"start":{"line":40,"column":6},"end":{"line":40,"column":79}}})) != null ? stack1 : "")
    + "\r\n    </button>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"cs-metadata-item-name\">\r\n<span class=\"csui-toggle-wrapper binf-hidden\">\r\n  <span class=\"icon circular1 arrow_back cs-go-back binf-hidden1\" style=\"display:none;\"\r\n        aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBack") || (depth0 != null ? lookupProperty(depth0,"goBack") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBack","hash":{},"loc":{"start":{"line":4,"column":20},"end":{"line":4,"column":30}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBack") || (depth0 != null ? lookupProperty(depth0,"goBack") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBack","hash":{},"loc":{"start":{"line":4,"column":39},"end":{"line":4,"column":49}}}) : helper)))
    + "\" tabindex=\"0\"></span>\r\n  <span class=\"csui-icon csui-metadata-listview csui-metadata-listview-expand-icon\" role=\"button\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sidebarToggleTitle") || (depth0 != null ? lookupProperty(depth0,"sidebarToggleTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sidebarToggleTitle","hash":{},"loc":{"start":{"line":5,"column":105},"end":{"line":5,"column":127}}}) : helper)))
    + "\"\r\n        aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sidebarToggleTitle") || (depth0 != null ? lookupProperty(depth0,"sidebarToggleTitle") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sidebarToggleTitle","hash":{},"loc":{"start":{"line":6,"column":20},"end":{"line":6,"column":42}}}) : helper)))
    + "\" tabindex=\"0\"></span>\r\n</span><span class=\"csui-type-icon\"></span>\r\n<div role=\"heading\" aria-level=\"2\" class=\"title-header\">\r\n<span class=\"title binf-line-clamp\" tabindex=\"0\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":9,"column":56},"end":{"line":9,"column":64}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"nameAria") || (depth0 != null ? lookupProperty(depth0,"nameAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"nameAria","hash":{},"loc":{"start":{"line":9,"column":78},"end":{"line":9,"column":90}}}) : helper)))
    + "\" role=\"button\"\r\n      aria-expanded=\"false\">\r\n    "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"name") || (depth0 != null ? lookupProperty(depth0,"name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"name","hash":{},"loc":{"start":{"line":11,"column":4},"end":{"line":11,"column":12}}}) : helper)))
    + "\r\n</span>\r\n</div>\r\n\r\n"
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"read_only") : depth0),{"name":"unless","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":15,"column":0},"end":{"line":17,"column":11}}})) != null ? stack1 : "")
    + "\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"show_dropdown_menu") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":19,"column":0},"end":{"line":21,"column":7}}})) != null ? stack1 : "")
    + "\r\n<div class=\"title-edit-div\">\r\n  <label id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"edit_name_id") || (depth0 != null ? lookupProperty(depth0,"edit_name_id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"edit_name_id","hash":{},"loc":{"start":{"line":24,"column":13},"end":{"line":24,"column":29}}}) : helper)))
    + "\" class=\"binf-hidden\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"placeholder_text") || (depth0 != null ? lookupProperty(depth0,"placeholder_text") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"placeholder_text","hash":{},"loc":{"start":{"line":24,"column":51},"end":{"line":24,"column":71}}}) : helper)))
    + "</label>\r\n  <span class=\"cs-icon-required category_required\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"required_tooltip") || (depth0 != null ? lookupProperty(depth0,"required_tooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"required_tooltip","hash":{},"loc":{"start":{"line":25,"column":58},"end":{"line":25,"column":78}}}) : helper)))
    + "\"></span>\r\n  <input type=\"text\" class=\"title-input\" placeholder=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"placeholder_text") || (depth0 != null ? lookupProperty(depth0,"placeholder_text") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"placeholder_text","hash":{},"loc":{"start":{"line":26,"column":54},"end":{"line":26,"column":74}}}) : helper)))
    + "\"\r\n         value=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"edit_name") || (depth0 != null ? lookupProperty(depth0,"edit_name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"edit_name","hash":{},"loc":{"start":{"line":27,"column":16},"end":{"line":27,"column":29}}}) : helper)))
    + "\" aria-labelledby=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"edit_name_id") || (depth0 != null ? lookupProperty(depth0,"edit_name_id") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"edit_name_id","hash":{},"loc":{"start":{"line":27,"column":48},"end":{"line":27,"column":64}}}) : helper)))
    + "\" aria-required=\"true\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"mlDataEnabled") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"loc":{"start":{"line":28,"column":2},"end":{"line":34,"column":9}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hideCancelButton") : depth0),{"name":"unless","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"loc":{"start":{"line":35,"column":2},"end":{"line":42,"column":13}}})) != null ? stack1 : "")
    + "</div>\r\n</div>\r\n<div class=\"title-error-div\">\r\n  <span class=\"title-error\"></span>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_header_item.name_metadata.item.name', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"binf-dropdown\">\r\n    <button id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"btnId") || (depth0 != null ? lookupProperty(depth0,"btnId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"btnId","hash":{},"loc":{"start":{"line":3,"column":16},"end":{"line":3,"column":25}}}) : helper)))
    + "\" type=\"button\" class=\"binf-btn binf-dropdown-toggle\"\r\n            data-binf-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\"\r\n            aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"showMoreAria") || (depth0 != null ? lookupProperty(depth0,"showMoreAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"showMoreAria","hash":{},"loc":{"start":{"line":5,"column":24},"end":{"line":5,"column":40}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"showMoreTooltip") || (depth0 != null ? lookupProperty(depth0,"showMoreTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"showMoreTooltip","hash":{},"loc":{"start":{"line":5,"column":49},"end":{"line":5,"column":68}}}) : helper)))
    + "\">\r\n      <span class=\"csui-button-icon icon-expandArrowDown\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"showMoreTooltip") || (depth0 != null ? lookupProperty(depth0,"showMoreTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"showMoreTooltip","hash":{},"loc":{"start":{"line":6,"column":65},"end":{"line":6,"column":84}}}) : helper)))
    + "\"></span>\r\n    </button>\r\n    <ul class=\"binf-dropdown-menu\" role=\"menu\"></ul>\r\n  </div>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "  <div class=\"csui-loading-parent-wrapper binf-disabled binf-hidden\">\r\n  <span class=\"csui-loading-dots-wrapper\">\r\n    <span class=\"csui-loading-dot\"></span>\r\n    <span class=\"csui-loading-dot\"></span>\r\n    <span class=\"csui-loading-dot\"></span>\r\n  </span>\r\n  </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"hasCommands") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":1,"column":0},"end":{"line":18,"column":7}}})) != null ? stack1 : "")
    + "\r\n";
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_header_dropdown.menu_dropdown.menu', t);
return t;
});
/* END_TEMPLATE */
;

/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/header/dropdown.menu/lazy.loading.template',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<li role=\"none\" class=\"csui-loading-parent-wrapper binf-disabled\">\r\n  <span class=\"csui-loading-dots-wrapper\">\r\n    <span class=\"csui-loading-dot\"></span>\r\n    <span class=\"csui-loading-dot\"></span>\r\n    <span class=\"csui-loading-dot\"></span>\r\n  </span>\r\n</li>";
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_header_dropdown.menu_lazy.loading.template', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu',[],function(){});
csui.define('csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu.view',[
  'module', "csui/lib/jquery", "csui/lib/underscore",
  'csui/utils/log', "csui/lib/backbone", "csui/lib/marionette",
  'csui/utils/commands', 'csui/utils/commandhelper', 'csui/controls/toolbar/toolitem.view',
  'csui/controls/toolbar/flyout.toolitem.view',
  'csui/models/nodes', 'csui/controls/toolbar/toolitems.filtered.model',
  'hbs!csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/behaviors/dropdown.menu/dropdown.menu.behavior',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'hbs!csui/widgets/metadata/impl/header/dropdown.menu/lazy.loading.template',
  'csui/utils/base',
  'csui/controls/globalmessage/globalmessage',
  'css!csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu',
  'csui/lib/binf/js/binf'
], function (module, $, _, log, Backbone, Marionette, commands, CommandHelper, ToolItemView,
  FlyoutToolItemView, NodeCollection, FilteredToolItemsCollection, template, TabableRegionBehavior,
    DropdownMenuBehavior, PerfectScrollingBehavior, lang, lazyloadingTemplate, base,
    GlobalMessage) {
  'use strict';

  log = log(module.id);

  // TODO: Make common dropdown menu control to be used in both the table header and the metadata header

  var DropdownMenuView = Marionette.CompositeView.extend({
    className: "cs-dropdown-menu",
    template: template,

    getChildView:  function (item) {
      return item.get('flyout') ? FlyoutToolItemView : ToolItemView;
    },
    childViewContainer: "ul.binf-dropdown-menu",
    childViewOptions: function (model) {
      return {
        role: 'none',
        command: this.collection.commands &&
                 this.collection.commands.findWhere({signature: model.get('signature')})
      };
    },

    templateHelpers: function () {
      return {
        hasCommands: !!this.collection.length,
        btnId: _.uniqueId('dropdownMenuButton'),
        showMoreTooltip: lang.showMore,
        showMoreAria: _.str.sformat(lang.showMoreAria, this.model.get('name'))
      };
    },

    ui: {
      dropdownToggle: '.binf-dropdown-toggle',
      dropdownMenu: '.binf-dropdown-menu',
      loadingIconsDiv: '.csui-loading-parent-wrapper'
    },

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior
      },
      DropdownMenuBehavior: {
        behaviorClass: DropdownMenuBehavior
      },
      PerfectScrolling: {
        behaviorClass: PerfectScrollingBehavior,
        contentParent: '.binf-dropdown-menu',
        suppressScrollX: true,
        includePadding: true
      }
    },

    constructor: function DropdownMenuView(options) {
      var status = {
        nodes: new NodeCollection([options.model]),
        container: options.container,
        containerCollection: options.containerCollection,
        context: options.context
      };
      options.status = status;
      this.commands = options.commands || commands;
      options.collection = new FilteredToolItemsCollection(
          options.toolItems, {
            status: status,
            commands: this.commands,
            delayedActions: options.containerCollection &&
                            options.containerCollection.delayedActions,
            mask: options.toolItemsMask
          });

      options.reorderOnSort = true;
      Marionette.CompositeView.prototype.constructor.apply(this, arguments);
      _.defaults(this.options, options.toolItems.options);  // set options from ToolItemFactory

      this.originatingView = options.originatingView;

      // Passing the el to the ctor prevents creating an own el, including
      // setting its attributes.  The caller must ensure the right tag.
      if (options.el) {
        $(options.el).addClass(_.result(this, "className"));
      }

      this.listenTo(this, "childview:toolitem:action", this._triggerMenuItemAction)
          .listenTo(this.model, "sync", this.render)
          .listenTo(Backbone, 'closeToggleAction', this._closeToggle)
          .listenTo(this.model, "change", this.render);
      if (this.model.delayedActions) {
        this.listenTo(this.model.delayedActions, 'request', this._hide)
            .listenTo(this.model.delayedActions, 'sync error', this._show);
      }
    },

    _updateMenuItems: function () {
      this.collection.silentFetch = true;
      this.fetchingNonPromotedActions = false;
      this.collection.refilter();
      this.render();
    },

    onRender: function () {
      if (this.model.delayedActions && this.model.delayedActions.fetching) {
        this._hide();
      }
      if (!this.collection.length) {
        var node                 = this.options.model ? this.options.model : this.model,
            lazyActionsRetrieved = !!node && !!node.get('csuiLazyActionsRetrieved'),
            isLocallyCreatedNode = !!node && !!node.isLocallyCreated;
        if (!!node && !lazyActionsRetrieved && node.nonPromotedActionCommands &&
            node.nonPromotedActionCommands.length && !isLocallyCreatedNode) {
          this.$el.find('.binf-dropdown').addClass('binf-hidden');
          this.ui.loadingIconsDiv.removeClass('binf-hidden');
          this.fetchingNonPromotedActions = true;
          node.setEnabledLazyActionCommands(
              true).done(_.bind(function () {
            this.fetchingNonPromotedActions = false;
            var blockingElement = this.$el.find('.csui-loading-parent-wrapper');
            blockingElement.animate("width: 0", 300, _.bind(function () {
              blockingElement.addClass('binf-hidden');
              this.$el.find('.binf-dropdown').removeClass('binf-hidden');
              //UpdateToolItems silently and re-render dropdown menu;
              this._updateMenuItems();
            }, this));
          }, this));
        }
      } else {
        //state variable for fetching nonpromoted actions started or not
        this.fetchingNonPromotedActions = false;
        this.ui.dropdownToggle.binf_dropdown();
        this.ui.dropdownMenu.find("> li > a.binf-hidden").removeClass('binf-hidden');
        var adjustDropdown = _.bind(function () {
          this.trigger("update:scrollbar");
          this.ui.dropdownMenu.removeClass('adjust-dropdown-menu');
          var dropdownLeftOffset        = this.ui.dropdownMenu.offset().left,
              originatingViewLeftOffest = this.options.originatingView.$el.offset().left,
              dropdownWidth             = this.ui.dropdownMenu.outerWidth(),
              originatingViewWidth      = this.options.originatingView.$el.width(),
              margin                    = (window.innerWidth - originatingViewWidth) / 2,
              rightOffset               = originatingViewWidth -
                                          (dropdownLeftOffset + dropdownWidth - margin);
          if (dropdownLeftOffset + dropdownWidth > originatingViewLeftOffest +
              originatingViewWidth ||
              (rightOffset + dropdownWidth > originatingViewWidth)) {
            this.ui.dropdownMenu.addClass('adjust-dropdown-menu');
          }
        }, this);
        var renderLazyActions = _.bind(function () {
          var self = this;
          var node                 = this.options.model ? this.options.model : this.model,
              lazyActionsRetrieved = !!node && !!node.get('csuiLazyActionsRetrieved'),
              isLocallyCreatedNode = !!node && !!node.isLocallyCreated,
              promise;
          if (!!node && !lazyActionsRetrieved && node.nonPromotedActionCommands &&
              node.nonPromotedActionCommands.length && !isLocallyCreatedNode) {
            this.fetchingNonPromotedActions = true;
            this.ui.dropdownMenu.append(lazyloadingTemplate);

            if (node.delayedActions.fetching) {
              promise = node.delayedActions.fetching;
            } else {
              promise = node.setEnabledLazyActionCommands(true);
            }
            promise.done(function (node) {
              self.fetchingNonPromotedActions = false;
              var newCollection = new FilteredToolItemsCollection(
                  self.options.toolItems, {
                    status: self.options.status,
                    commands: self.commands,
                    delayedActions: self.options.containerCollection &&
                                    self.options.containerCollection.lazyActions,
                    lazyActions: self.options.containerCollection &&
                                 self.options.containerCollection.lazyActions,
                    mask: self.options.toolItemsMask
                  });

              var blockingEle = self.ui.dropdownMenu.find('.csui-loading-parent-wrapper');
              //As per UX review comments, 300 ms given before rendering lazy actions
              blockingEle.animate("width: 0", 300, function () {
                blockingEle.remove();
                _.filter(newCollection.models, function (model) {
                  if (self.isDestroyed === true || self._isDestroyed) {
                    self.children = undefined;
                  } else {
                    var signature = model.get("signature");
                    if (!self.collection.find({signature: signature})) {
                      self.collection.models.push(model);
                      var lazyToolItemView = self.addChild(model, ToolItemView);
                      lazyToolItemView.renderTextOnly();
                    } else {  //re-render flyout toolitem view, if existing model's flyout toolitems count is different
                      var currModel = self.collection.find({signature : signature});
                      if(model.get('flyout') && currModel.toolItems.length !== model.toolItems.length) {
                        currModel.toolItems.reset(model.toolItems.models);
                      }
                    }
                  }
                });
              });

            }).fail(function (request) {
              self.fetchingNonPromotedActions = false;
              var blockingEle = self.ui.dropdownMenu.find('.csui-loading-parent-wrapper'),
                  error       = new base.Error(request);
              blockingEle.length && blockingEle.remove();
              GlobalMessage.showMessage('error', error.message);
            });
          }
        }, this);
        this.ui.dropdownToggle.on('binf.dropdown.after.show', adjustDropdown);
        this.ui.dropdownToggle.on('binf.dropdown.before.show', renderLazyActions);
        $(window).on('resize.metadata.header.dropdown.menu', _.debounce(adjustDropdown, 100));
        this.delegateEvents();
      }
    },

    onRenderCollection: function () {
      if (this.collection.length && this.fetchingNonPromotedActions) {
        //loading icons div appended to dropdown,
        //but before fectching nonpromoted actions collection reset event trigger from dropDownMenu Behavior
        // in this case we are removing loding icons div from drop down and appended again
        var loadingIconsDiv = this.ui.dropdownMenu.find('.csui-loading-parent-wrapper');
        loadingIconsDiv.length && loadingIconsDiv.remove();
        this.ui.dropdownMenu.append(lazyloadingTemplate);
      }
    },

    onDestroy: function () {
      this.undelegateEvents();
      $(window).off("resize.metadata.header.dropdown.menu");
    },

    currentlyFocusedElement: function () {
      return $(this.ui.dropdownToggle);
    },

    _hide: function () {
      this.$el.addClass('binf-invisible');
    },

    _show: function () {
      this.$el.removeClass('binf-invisible');
    },

    _closeToggle: function () {
      var dropdownToggleEl = this.$el.find('.binf-dropdown-toggle');
      if (dropdownToggleEl.parent().hasClass('binf-open')) {
        dropdownToggleEl.binf_dropdown('toggle');
      }
    },

    _triggerMenuItemAction: function (toolItemView, args) {
      this._closeToggle();

      var toolItem = args.toolItem;
      var signature = toolItem.get("signature");
      var command = this.commands.get(signature);
      var status = {
        context: this.options.context,
        nodes: new NodeCollection([this.model]),
        container: this.options.container,
        collection: this.options.containerCollection,
        originatingView: this.options.targetView ? this.options.targetView : this.originatingView,
        showPermissionView: !!this.options.showPermissionView,
        noMetadataNavigation: this.options.noMetadataNavigation,
        toolItem: toolItem,
        data: toolItem.get('commandData') || {}
      };
      try {
        // If the command was not found and the toolitem is executable, it is a developer's mistake.
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        }else if(_.isFunction(command.execute)){
          var promise = command.execute(status);
          CommandHelper.handleExecutionResults(
              promise, {
                command: command,
                suppressSuccessMessage: status.suppressSuccessMessage,
                suppressFailMessage: status.suppressFailMessage
              });
        }else{
          this.trigger(signature.toLowerCase(), this);
        }
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}',
        command.get('signature'), error.message) && console.warn(log.last);
      }
    }
  });

  return DropdownMenuView;
});


csui.define('csui/widgets/metadata/versions.toolbaritems.mask',['module', 'csui/lib/underscore',
  'csui/controls/toolbar/toolitems.mask',
  'csui/utils/toolitem.masks/global.toolitems.mask',
  // Load and external tool item masks
  'csui-ext!csui/widgets/metadata/versions.toolbaritems.mask'
], function (module, _, ToolItemMask, GlobalMenuItemsMask, dynamicMasks) {
  'use strict';
  dynamicMasks || (dynamicMasks = []);
  var VersionsToolbarItemsMask = ToolItemMask.extend({

    constructor: function VersionsToolbarItemsMask(options) {
      var config     = module.config(),
          globalMask = new GlobalMenuItemsMask();
      ToolItemMask.prototype.constructor.call(this, globalMask, {normalize: false});
      // Masks passed in by separate require.config calls are sub-objects
      // stored in the outer object be different keys
      _.each(config, function (source, key) {
        this.extendMask(source);
      }, this);
      // Enable restoring the mask to its initial state
      this.storeMask();
      this.context = options.context;
      this.node = !!options.node ? options.node : options.model;
      this._updateMask();
      this.listenTo(this.node, 'change:id', this._updateMask);
    },
    _updateMask: function () {
      var modified = this.restoreMask({silent: true});
      dynamicMasks.forEach(function (mask) {
        mask = mask({
          context: this.context,
          node: this.node
        });
        if (mask) {
          modified = this.extendMask(mask, {silent: true}) || modified;
        }
      }, this);
      if (modified) {
        this.trigger('update', this);
      }
    }
  });

  return VersionsToolbarItemsMask;

});



csui.define('csui/widgets/metadata/header.dropdown.menu.items',['csui/lib/underscore',
  //'i18n!csui/widgets/metadata/impl/nls/lang',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  // Load extra tool items to be added to this collection
  'csui-ext!csui/widgets/metadata/header.dropdown.menu.items',
  // Load extra tool items from the previous module location
  'csui-ext!csui/widgets/metadata/header.item.name/menuitems'
], function (_, lang, ToolItemsFactory, TooItemModel, extraToolItems,
    oldExtraToolItems) {
  'use strict';

  var toolbarItems = {
    dropdownMenuList: new ToolItemsFactory({

      info: [
        {
          signature: "Properties",
          name: lang.ToolbarItemInfo
        },
        {
          signature: "DocPreview",
          name: lang.ToolbarItemDocPreview,
          commandData: {
            ifNotOpenDelegate: true,
            fullView: true,
            includeContainers: false
          }
        },
        {
          signature: "CopyLink",
          name: lang.ToolbarItemCopyLink
        }
      ],
      edit: [
        {signature: "Edit", name: lang.ToolbarItemEdit, flyout: "edit", promoted: true},
        {signature: "EditActiveX", name: "EditActiveX", flyout: "edit"},
        {signature: "EditOfficeOnline", name: "EditOfficeOnline", flyout: "edit"},
        {signature: "EditWebDAV", name: "EditWebDAV", flyout: "edit"}
      ],
      share: [
        {
          signature: 'Share',
          name: lang.MenuItemShare,
          flyout: 'share'
        }
      ],
          main: [
            {signature: "SendTo", name: lang.ToolbarItemSendTo, flyout: 'sendto'},
            {signature: "EmailLink", name: lang.ToolbarItemEmailLinkShort, flyout: 'sendto'},
            {signature: "permissions", name: lang.ToolbarItemPermissions},
            {signature: "Rename", name: lang.ToolbarItemRename},
            {signature: "Download", name: lang.ToolbarItemDownload},
            {signature: "ReserveDoc", name: lang.ToolbarItemReserve},
            {signature: "UnreserveDoc", name: lang.ToolbarItemUnreserve},
            {signature: "Lock", name: lang.ToolbarItemLock},
            {signature: "Unlock", name: lang.ToolbarItemUnlock},
            {signature: "Copy", name: lang.ToolbarItemCopy},
            {signature: "Move", name: lang.ToolbarItemMove},
            {signature: "AddVersion", name: lang.ToolbarItemAddVersion},
            {signature: "Delete", name: lang.ToolbarItemDelete},
            {signature: "Collect", name: lang.ToolbarCollect},
            {signature: "ZipAndDownload", name: lang.MenuItemZipAndDownload},
            {
              signature: "CompoundDocument",
              name: lang.compoundDocument,
              flyout: "CompoundDocument"
            },
            {
              signature: "CreateRelease",
              name: lang.CreateRelease,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "CreateRevision",
              name: lang.CreateRevision,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            },
            {
              signature: "Reorganize",
              name: lang.Reorganize,
              subItemOf: "CompoundDocument",
              flyout: "CompoundDocument"
            }
          ],
          shortcut: [
            {signature: "OriginalCopyLink", name: lang.ToolbarItemOriginalCopyLink},
            {signature: "OriginalEdit", name: lang.ToolbarItemOriginalEdit},
            {signature: "OriginalEmailLink", name: lang.ToolbarItemOriginalShare},
            {signature: "OriginalReserveDoc", name: lang.ToolbarItemOriginalReserve},
            {signature: "OriginalUnreserveDoc", name: lang.ToolbarItemOriginalUnreserve},
            {signature: "OriginalCopy", name: lang.ToolbarItemOriginalCopy},
            {signature: "OriginalMove", name: lang.ToolbarItemOriginalMove},
            {signature: "OriginalAddVersion", name: lang.ToolbarItemAddVersion},
            {signature: "OriginalDownload", name: lang.ToolbarItemOriginalDownload},
            {signature: "OriginalDelete", name: lang.ToolbarItemOriginalDelete}
          ]
        },
        {
          maxItemsShown: 0, // force toolbar to immediately start with a drop-down list
          dropDownIconName: "csui_action_caret_down32"
        }
    )
  };

  if (oldExtraToolItems) {
    // TODO: Issue deprecation warning
    addExtraToolItems(oldExtraToolItems);
  }

  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }

  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return toolbarItems;

});

csui.define('csui/widgets/metadata/header.dropdown.menu.items.mask',['module', 'csui/lib/underscore',
  'csui/controls/toolbar/toolitems.mask',
  'csui/utils/toolitem.masks/global.toolitems.mask'
], function (module, _, ToolItemMask, GlobalMenuItemsMask) {
  'use strict';

  var DropdownMenuItemsMask = ToolItemMask.extend({

    constructor: function DropdownMenuItemsMask() {
      var config = module.config(),
          globalMask = new GlobalMenuItemsMask();
      ToolItemMask.prototype.constructor.call(this, globalMask, {normalize: false});
      // Masks passed in by separate require.config calls are sub-objects
      // stored in the outer object be different keys
      _.each(config, function (source, key) {
        this.extendMask(source);
      }, this);
      // Enable restoring the mask to its initial state
      this.storeMask();
    }

  });

  return DropdownMenuItemsMask;

});


csui.define('css!csui/widgets/metadata/impl/metadata',[],function(){});

csui.define('css!csui/widgets/metadata/impl/header/item.name/metadata.item.name',[],function(){});
csui.define('csui/widgets/metadata/impl/header/item.name/metadata.item.name.view',['require', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/controls/node-type.icon/node-type.icon.view', 'csui/utils/base',
  'hbs!csui/widgets/metadata/impl/header/item.name/metadata.item.name',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'csui/widgets/metadata/impl/header/dropdown.menu/dropdown.menu.view',
  'csui/utils/commands/versions',
  'csui/widgets/metadata/versions.toolbaritems',
  'csui/widgets/metadata/versions.toolbaritems.mask',
  'csui/widgets/metadata/header.dropdown.menu.items',
  'csui/widgets/metadata/header.dropdown.menu.items.mask',
  'csui/models/version', 'csui/behaviors/item.name/item.name.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'i18n', 'css!csui/widgets/metadata/impl/metadata',
  'css!csui/widgets/metadata/impl/header/item.name/metadata.item.name'
], function (require, $, _, Backbone, Marionette, NodeTypeIconView, base, template, lang,
    DropdownMenuView, versionCommands, versionToolbarItems, VersionsToolbarItemsMask,
    dropdownMenuItems, DropdownMenuItemsMask, VersionModel,
    ItemNameBehavior, TabableRegionBehavior, ViewEventsPropagationMixin, i18n) {
  'use strict';

  var MetadataItemNameView = Marionette.ItemView.extend({

        className: 'cs-metadata-item-name-container',
        template: template,

        templateHelpers: function () {
          return {
            name: this.modelHasEmptyName ? (this.readonly ? this.placeHolderName : '') :
                  this.options.model.get("name"),
            edit_name: this.modelHasEmptyName ? '' : this.options.model.get("name"),
            edit_name_id: _.uniqueId('cs-metadata-edit-name'),
            placeholder_text: this.placeHolderName,
            nameAria: this.options.model.get("name") || lang.emptyObjectNameAria,
            cancel_edit_name_tooltip: lang.cancelEditNameTooltip,
            save_edit_name_tooltip: lang.saveEditNameTooltip,
            switch_language_tooltip: lang.switchLanguageTooltip,
            show_dropdown_menu: this.options.showDropdownMenu ? true : false,
            read_only: this.readonly,
            goBack: lang.goBackTooltip,
            sidebarToggleTitle: lang.expand,
            hideCancelButton: this.options.mode && this.options.mode === 'create',
            mlDataEnabled: this.metadataLanguages.enabled
          };
        },

        ui: {
          // note: if you change the template or this mapping, be sure not to break the behavior code
          name: '.title',
          contextMenuDiv: '.csui-metadata-item-name-dropdown',
          nameEditDiv: '.title-edit-div',
          nameInput: '.title-input',
          nameEditCancelIcon: '.csui-edit-cancel',
          titleError: '.title-error',
          toggleIcon: '.csui-metadata-listview',
          toggleWrapper: '.csui-toggle-wrapper',
          backEle: '.arrow_back',
          titleHeader: '.title-header',
          saveButtonInEditMode: '.csui-edit-save',
          mlGlobeIcon: '.csui-multilingual-icon'
        },

        modelEvents: {
          'change': 'render'
        },

        events: {
          'keydown': 'onKeyInView',
          'mouseenter': 'onMouseEnterName',
          'mouseleave': 'onMouseLeaveName',
          'keydown @ui.nameInput': 'onKeyDown',
          'input @ui.nameInput': 'onChangeName',
          'click @ui.toggleIcon': 'toggleSideBar',
          'click @ui.backEle': 'goBack',
          'keydown @ui.toggleIcon': 'toggleSideBar',
          'keydown @ui.backEle': 'goBack',
          'keydown @ui.toggleWrapper': '_onKeyInView',
          'click @ui.mlGlobeIcon': 'onClickGlobeIcon',
          'keydown @ui.mlGlobeIcon': 'onKeyDownGlobeIcon',
          'paste @ui.nameInput': 'onKeyDown'
        },

        behaviors: function () {
          return {
            ItemName: {
              behaviorClass: ItemNameBehavior,
              nameSchema: this._nameSchema,
              mode: this.options.mode,
              autoSave: this.options.autoSave
            }
          };
        },

        toggleSideBar: function (event) {
          if (!!event && (event.keyCode === 13 || event.keyCode === 32 || event.type === 'click')) {
            this.toggleSideBarEvent();
            event.preventDefault();
            event.stopPropagation();
          }
        },
        //Calling this method from MetadataPropertiesView to set tabindex
        setToggleIconTabIndex: function () {
          this.ui.toggleIcon.attr('tabindex', 0);
        },

        onChangeName: function (event) {
          if (this.ui.saveButtonInEditMode.length) {
            var currentInputElementVal = this.ui.nameInput.val().trim();
            this.enableAddButton = false;
            // check the name field.
            this.enableAddButton = this.isSaveEnabled(event.target.value);
            this.ui.saveButtonInEditMode.prop('disabled', !this.enableAddButton);
            _.isFunction(this.updateMLdata) && this.updateMLdata(event);
          }
          this.refreshTabableElements();
        },

        isSaveEnabled: function (newName) {
          newName = newName.trim();
          if (!newName.length || (newName === this.model.get('name') && !this.saveMldata)) {
            return false;
          } else {
            return true;
          }
        },

        refreshTabableElements: function () {
          this.tabableElements = this.$el.find('input:not([disabled]),  button:not([disabled])').filter(
              ':visible').toArray();
        },

        _moveTab: function (event) {
          this.currentlyFocusedElementIndex = this.tabableElements.indexOf(event.target);
          if (event.shiftKey) {
            if (this.currentlyFocusedElementIndex > 0) {
              this.currentlyFocusedElementIndex -= 1;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            } else {
              this.currentlyFocusedElementIndex = this.tabableElements.length - 1;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            }
          } else {
            if (this.currentlyFocusedElementIndex < this.tabableElements.length - 1) {
              this.currentlyFocusedElementIndex += 1;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            } else {
              this.currentlyFocusedElementIndex = 0;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            }
          }
          event.stopPropagation();
          event.preventDefault();
        },

        toggleSideBarEvent: function () {
          if (this.leftBar && this.leftBar.length > 0) {
            var parentWrapper = this.leftBar.closest(".metadata-navigation");
            if (!!parentWrapper) {
              if (parentWrapper.length > 0) {
                var sideBarEle = this.leftBar;
                if (sideBarEle.length > 0) {
                  if (parentWrapper.hasClass('csui-hide-side-bar')) {
                    parentWrapper.toggleClass("csui-hide-side-bar");
                    $(sideBarEle).show('blind', {direction: this.direction}, '200', function () {
                      $(window).trigger("resize.tableview");
                    });
                    $(this.ui.backEle).hide();
                    $(this.ui.toggleIcon).attr('title', lang.collapse).attr('aria-label',
                        lang.collapse);
                    $(this.ui.toggleIcon).addClass('csui-metadata-listview-collapse-icon').removeClass(
                        'csui-metadata-listview-expand-icon');
                    this.sideBarHidden = false;
                  } else {
                    var that = this;
                    $(sideBarEle).hide('blind', {direction: this.direction}, '200', function () {
                      parentWrapper.toggleClass("csui-hide-side-bar");
                      $(window).trigger("resize.tableview");
                    });
                    $(that.ui.backEle).show().trigger('focus');
                    this.sideBarHidden = true;
                    $(this.ui.toggleIcon).attr('title', lang.expand).attr('aria-label',
                        lang.expand);
                    $(this.ui.toggleIcon).addClass('csui-metadata-listview-expand-icon').removeClass(
                        'csui-metadata-listview-collapse-icon');
                  }
                  $(sideBarEle).promise().done(function () {
                    var event = $.Event('toggled:navigationbar');
                    this.closest('.metadata-navigation').find('.cs-metadata').trigger(event);
                  });
                }
              }
            }
          }
        },

        // adapt the sidebar toggle button
        ensureTitleLabelIcon: function () {
          if (this.leftBar && this.leftBar.length > 0) {
            var parentWrapper = this.leftBar.closest(".metadata-navigation");
            if (!!parentWrapper) {
              if (parentWrapper.length > 0) {
                var sideBarEle = this.leftBar;
                if (sideBarEle.length > 0) {
                  if (parentWrapper.hasClass('csui-hide-side-bar')) {
                    $(this.ui.toggleIcon).attr('title', lang.expand).attr('aria-label',
                        lang.expand);
                    $(this.ui.toggleIcon).addClass('csui-metadata-listview-expand-icon').removeClass(
                        'csui-metadata-listview-collapse-icon');
                  } else {
                    $(this.ui.toggleIcon).attr('title', lang.collapse).attr('aria-label',
                        lang.collapse);
                    $(this.ui.toggleIcon).addClass('csui-metadata-listview-collapse-icon').removeClass(
                        'csui-metadata-listview-expand-icon');
                  }
                }
              }
            }
          }
        },

        constructor: function MetadataItemNameView(options) {
          options || (options = {});
          this._nameSchema = _.extend({
            required: true,
            readonly: false
          }, options.nameSchema);
          var autoSave = false;
          if (options.mode === 'create') {
            autoSave = true;
          }
          options.autoSave = autoSave;

          // be the first listener, before the ones of the behavior, so behavior listeners already
          // see updated ui elements
          this.listenTo(options.model, "change:name", this._updateName);

          this.direction = !!i18n.settings.rtl ? 'right' : 'left';

          Marionette.ItemView.prototype.constructor.call(this, options);

          this.readonly = this._nameSchema.readonly;
          this.placeHolderName = lang.addItemPlaceHolderName;
          var name = this.model.get("name");
          this.modelHasEmptyName = name ? false : true;
          // create dropdown menu
          this.options.showDropdownMenu && this._createDropdownMenu();

          $(window).on('resize.' + this.cid, {view: this}, this._onWindowResize);

          var self = this;
          this.metadataLanguages = base.getMetadataLanguageInfo();
          this.saveMldata = '';
          this.listenTo(this, "ml:value:updated", function (obj) {
            // to enable save button if any value updated in popup
            self.saveMldata = obj;
            self.enableAddButton = true;
            self.ui.saveButtonInEditMode.prop('disabled', !self.enableAddButton);
            if (self.model.get("id") === undefined) {
              self.model.set("name", obj.value, {
                silent: true,
              });
              this.inputBoxNameChange = true;
              this.ui.nameInput.removeClass('csui-empty-with-placeholder');
              this.trigger("update:button", {disabled: false});
            }
            self.model.set("name_multilingual", obj.value_multilingual, {
              silent: true,
            });
            self.targetElement.val(obj.value);
            self.refreshTabableElements();
          });

          // make a check for editing when there's a change in the actions.
          this.listenTo(this.model.actions, 'reset update', function () {
            this._checkAndEnableOrDisableEditing();
          });
        },

        goBack: function (event) {
          if (event.keyCode === 13 || event.keyCode === 32 || event.type === 'click') {
            this.options.originatingView.triggerMethod('metadata:close');
            event.preventDefault();
            event.stopPropagation();
          }
        },

        _checkAndEnableOrDisableEditing: function () {
          var nameEle = $(this.ui.name);
          if(nameEle.length && this.ItemNameBehavior._isEditingEnabled()) {
            var title = _.str.sformat(lang.itemTitleAria, this.model.get('name'));
            nameEle.attr('aria-label', title);
            nameEle.attr('title', title);
            nameEle.attr('tabindex', 0);
            nameEle.removeClass('csui-disabled');
          } else {
            nameEle.removeAttr('aria-label');
            nameEle.removeAttr('title');
            nameEle.removeAttr('tabindex');
            nameEle.addClass('csui-disabled');
          }
        },

        _applyToggle: function () {
          if (!!this.sideBarHidden) {} else {
            this.ui.toggleWrapper instanceof Object &&
            this.ui.toggleWrapper.removeClass('binf-hidden');
            this.$el.addClass("csui-metadata-header-with-toggle");
            if (this.options.originatingView && !!this.options.originatingView.mdn &&
                !!this.options.originatingView.mdn.$el.is(":visible")) {
              if (this.ui.backEle instanceof Object) {
                this.ui.backEle.hide();
              }
            }
          }
        },

        _removeToggle: function () {
          if (this.ui.toggleWrapper instanceof Object) {
            this.ui.toggleWrapper.addClass('binf-hidden');
            this.$el.removeClass("csui-metadata-header-with-toggle");
          }
          if (!!this.sideBarHidden) {
            this.toggleSideBarEvent();
          }
        },

        onDestroy: function () {
          this._destroyDropdownMenu();
          $(window).off('resize.' + this.cid).off('resize.tableview.' + this.cid);
        },

        _updateName: function () {
          var name = this.model.get("name");
          this.modelHasEmptyName = name ? false : true;
          this.render();
          var focus = $(this.ui.nameInput).is(":focus");
          this._toggleEditMode(focus || this.modelHasEmptyName || false, false);
          this.validate();
        },

        _destroyDropdownMenu: function () {
          if (this.dropdownMenuView) {
            this.cancelEventsToViewsPropagation(this.dropdownMenuView);
            this.dropdownMenuView.destroy();
          }
        },

        _createDropdownMenu: function () {
          var oView = this.options.originatingView;
          var isVersionModel = this.options.model instanceof VersionModel;
          // TODO: Pass toolItems to the constructor of this component instead
          // of sniffing some other ones.
          var toolItems,
              toolItemsMask = this.options.toolbarItemsMask;
          if (oView && oView.options && oView.options.toolbarItems &&
              oView.options.toolbarItems.dropdownMenuListInProperties) {
            toolItems = oView.options.toolbarItems.dropdownMenuListInProperties;
          } else {
            if (isVersionModel) {
              toolItems = versionToolbarItems.dropdownMenuList;
            } else {
              toolItems = dropdownMenuItems.dropdownMenuList;
            }
          }
          if (!toolItemsMask) {
            if (isVersionModel) {
              toolItemsMask = new VersionsToolbarItemsMask(this.options);
            } else {
              toolItemsMask = new DropdownMenuItemsMask();
            }
          }
          if (this.options.showPermissionView) {
            toolItems = toolItems.collection.filter(
                function (command) {
                  return (command.get("signature") != "permissions");
                });
          } else if (this.options.showPropertiesCommand !== true) {
            toolItems = toolItems.collection.filter(
                function (command) {
                  return (command.get("signature") != "Properties" && command.get("signature") !=
                          "VersionProperties");
                });
          }
          this._destroyDropdownMenu();
          var ddm = this.dropdownMenuView = new DropdownMenuView({
            model: this.options.model,
            container: this.options.container,
            containerCollection: this.options.collection || this.options.containerCollection,
            toolItems: toolItems,
            toolItemsMask: toolItemsMask,
            originatingView: this.options.originatingView,
            targetView: this.options.targetView,
            context: this.options.context,
            commands: isVersionModel ? versionCommands : this.options.commands,
            metadataScenario: this.options.metadataScenario,
            showPermissionView: this.options.showPermissionView,
            noMetadataNavigation: this.options.noMetadataNavigation
          });
          this.listenTo(ddm, 'rename', _.bind(this._toggleEditMode, this, true));

          ddm.$el.on('keydown', _.bind(function (event) {
            if (event.keyCode === 9 && event.shiftKey) {
              if (this.ui.backEle.is(':visible') || this.ui.toggleIcon.is(':visible')) {
                this.ui.name.prop('tabindex', 0);
                event.stopPropagation();
              }
            }
          }, this));
          this.propagateEventsToViews(this.dropdownMenuView);
        },

        _onWindowResize: function (event) {
          if (event && event.data && event.data.view) {
            var self = event.data.view;
            // optimization for rapid mouse movement and redraw when mouse movement slows down or stop
            if (self.resizeTimer) {
              clearTimeout(self.resizeTimer);
            }

            self.resizeTimer = setTimeout(function () {
              self._setHideShowToggleButton();
            }, 200);
          }
        },

        _setHideShowToggleButton: function (event) {

          var isLandscape = window.matchMedia("(orientation: landscape)").matches,
              isPortrait  = window.matchMedia("(orientation: portrait)").matches,
              self        = !!event && !!event.data && !!event.data.view ? event.data.view : this;

          self.leftBar = self.options.originatingView &&
                         self.options.originatingView.$el.find(".metadata-sidebar");

          if (self.leftBar && self.leftBar.length > 0) {
            var navBar = self.leftBar.closest(".metadata-navigation");
            if (isLandscape) {
              if (window.innerWidth <= 1280) {
                if (!!self.sideBarHidden) {
                  self.ui.toggleWrapper instanceof Object &&
                  self.ui.toggleWrapper.removeClass('binf-hidden');
                  if (self.ui.backEle instanceof Object) {
                    self.ui.backEle.css({display: "inline-block", position: "relative"});
                    self.ui.backEle.attr("tabindex", 0);
                  }
                  this.ensureTitleLabelIcon();
                } else {
                  self._applyToggle(event);
                  self.leftBar.removeClass('binf-hidden');
                  if (navBar.hasClass('csui-hide-side-bar')) {
                    self.leftBar.show();
                    navBar.toggleClass("csui-hide-side-bar");
                    if (self.ui.backEle instanceof Object) {
                      self.ui.backEle.hide();
                    }
                    $(window).trigger("resize.tableview");
                  }
                  this.ensureTitleLabelIcon();
                }
              } else {
                this.sideBarHidden = false;
                self._removeToggle(event);
                if (navBar.hasClass('csui-hide-side-bar')) {
                  self.leftBar.show();
                  navBar.toggleClass("csui-hide-side-bar");
                  if (self.ui.backEle instanceof Object) {
                    self.ui.backEle.hide();
                  }
                }
                $(window).trigger("resize.tableview");
                this.ensureTitleLabelIcon();
              }
            } else if (isPortrait) {
              self._applyToggle(event);
              if (self.leftBar.length > 0) {
                if (!navBar.hasClass('csui-hide-side-bar')) {
                  self.leftBar.hide();
                  navBar.toggleClass("csui-hide-side-bar");
                  $(window).trigger("resize.tableview");
                }
                if (self.ui.backEle instanceof Object) {
                  self.ui.backEle.css({display: "inline-block", position: "relative"});
                  self.ui.backEle.attr("tabindex", 0);
                }
              }
              this.ensureTitleLabelIcon();
            }
          }
        },

        currentlyFocusedElement: function (options) {
          if (!!this.ui.backEle && $(this.ui.backEle).is(':visible')) {
            return this.ui.backEle;
          } else if (!!this.ui.toggleIcon && $(this.ui.toggleIcon).is(':visible')) {
            return this.ui.toggleIcon;
          } else if (!!this.options.mode && this.options.mode === 'create') {
            var mlIcon = $(this.ui.mlGlobeIcon);
            return options && options.shiftKey && mlIcon.is(':visible') ? mlIcon : $(this.ui.nameInput);
          } else {
            return $(this.ui.name);
          }
        },

        onRender: function () {
          this.editing = false;
          this.ui.nameEditDiv.addClass('binf-hidden');

          if (this._nodeIconView) {
            this._nodeIconView.destroy();
          }
          this._nodeIconView = new NodeTypeIconView({
            el: this.$('.csui-type-icon').get(0),
            node: this.options.model,
            displayThumbnailIcon: false
          });
          // for shortcut objects add one more wrapper to apply special styling to overlay element.
          if (this.model.get('type') === 1) {
            this._nodeIconView.$el.addClass('csui-metadata-shortcut-overlay');
          }
          this._nodeIconView.render();

          if (this.dropdownMenuView) {
            this.dropdownMenuView.render();
            Marionette.triggerMethodOn(this.dropdownMenuView, 'before:show', this.dropdownMenuView,
                this);
            this.ui.contextMenuDiv.append(this.dropdownMenuView.el);
            Marionette.triggerMethodOn(this.dropdownMenuView, 'show', this.dropdownMenuView, this);
          }

          if (this.modelHasEmptyName) {
            this.ui.nameInput.addClass('csui-empty-with-placeholder');
            this.ui.nameInput.attr('placeholder', this.placeHolderName);
            if (this.readonly) {
              this.ui.name.addClass('csui-empty-with-placeholder');
            }
          }

          this._setHideShowToggleButton();
          this._checkAndEnableOrDisableEditing();
          var self = this, targetElement = self.ui.nameInput, mlGlobeIcon = self.ui.mlGlobeIcon;
          if (this.metadataLanguages.enabled && !(this.model.get('version_id'))) {
            this.ui.nameInput.addClass('csui-multilingual-input');
            self.$el.addClass('binf-hidden');
            csui.require(["csui/controls/multilingual.text.picker/multilingual.popover.mixin"], function (
                MultiLingualPopoverMixin
            ) {
              MultiLingualPopoverMixin.mixin(MetadataItemNameView.prototype);
              self.targetElement = targetElement;
              self.requiredInfoAvilable('name_multilingual').then(function () {
                self.multiLingualForm &&
                self.targetElement.binf_popover("destroy");
                var mlOptions = {
                  parentView: self,
                  targetElement: targetElement,
                  mlGlobeIcon: mlGlobeIcon,
                  validationRequired: true,
                  multilingualData: self.model.get("name_multilingual")
                };
                self._loadMultiLingualPopover(mlOptions);
                self.$el.removeClass('binf-hidden');
              });
            });
          }
        },
        onMouseEnterName: function (event) {
          if (this.readonly) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
        },

        onMouseLeaveName: function (event) {
          if (this.readonly) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
        },

        onKeyDown: function (event) {
          if (this.$el.parents(".cs-item-action-metadata").find(
              "div[class='load-container']").length >
              0) {
            return false;
          }
          if (this.readonly) {
            return;
          }
          if (this.modelHasEmptyName && this.inputBoxNameChange !== true) {
            this.setInputBoxValue('');
            this.inputBoxNameChange = true;
            this.ui.nameInput.removeClass('csui-empty-with-placeholder');
          }
        },

        _validateAndSave: function () {
          var currentValue = this.getValue().trim();
          var inputValue = this.getInputBoxValue();
          inputValue = inputValue.trim();

          if (inputValue.length === 0 || currentValue !== inputValue ||
              this.model.changed.name_multilingual) {
            var success = this.validate(inputValue);
            if (success === true) {
              var self = this;
              this.setInputBoxValue(inputValue);
              this.setValue(inputValue);
              this.modelHasEmptyName = false;
              this.trigger("metadata:item:name:save", {
                sender: this,
                success: function () {
                  self._toggleEditMode(false, false);
                },
                error: function (error) {
                  var name_multilingual = _.clone(self.prevMultilingualVal);
                  self.setValue(currentValue);
                  self._toggleEditMode(true);
                  self.showInlineError(error);
                  self.saveMldata && self.model.set({name_multilingual: self.prevMultilingualVal});
                  name_multilingual && (self.prevMultilingualVal = _.clone(name_multilingual));
                }
              });
            }
          } else {
            this.clearInlineError();
            this._toggleEditMode(false, false);
          }
          this.saveMldata = '';
        },

        // call proxies
        onKeyInView: function (event) {
          if (this.readonly) {
            return;
          }
          if (!!this.options.mode && this.options.mode === 'create') {
            var target = $(event.target);
            if (event.keyCode === 9 && this.$el.find('.csui-multilingual-icon').length) {
              ((event.shiftKey && target.is(this.ui.mlGlobeIcon)) || (target.is(this.ui.nameInput) && !event.shiftKey)) &&
              this.ItemNameBehavior.onKeyInView(event);
            }
            return true;
          }
          //prevent propagation to dialog box tabable behavior (e.g. Recently Access)
          if (event.keyCode === 9 && event.shiftKey) {
            event.stopPropagation();
          }
          return this.ItemNameBehavior.onKeyInView(event);
        },

        _toggleEditMode: function (edit, setFocus) {
          //prevent toggle for item name on create dialog
          if (this.options.mode != 'create') {
            return this.ItemNameBehavior._toggleEditMode(edit, setFocus);
          }
        },

        getValue: function () {
          return this.ItemNameBehavior.getValue();
        },

        setValue: function (value) {
          return this.ItemNameBehavior.setValue(value);
        },

        getInputBoxValue: function () {
          return this.ItemNameBehavior.getInputBoxValue();
        },

        setInputBoxValue: function (value) {
          return this.ItemNameBehavior.setInputBoxValue(value);
        },

        validate: function (iName) {
          return this.ItemNameBehavior.validate(iName);
        },

        setEditModeFocus: function () {
          return this.ItemNameBehavior.setEditModeFocus();
        },

        showInlineError: function (error) {
          var errorTxt = error;
          if (error instanceof Object) {
            errorTxt = this._getErrorMessageFromResponse(error);
          }
          return this.ItemNameBehavior.showInlineError(errorTxt);
        },

        clearInlineError: function () {
          return this.ItemNameBehavior.clearInlineError();
        },

        _getErrorMessageFromResponse: function (err) {
          return this.ItemNameBehavior._getErrorMessageFromResponse(err);
        },
        // end of: proxies

        // TODO: Deprecate this method and prefer using name field schema
        // for flags like readonly and required
        setReadOnly: function (mode) {
          mode = mode ? true : false;
          var focus;
          if ((this.readonly ? true : false) !== mode) {
            this.readonly = mode;
            this.render();
            focus = $(this.ui.nameInput).is(":focus");
            this._toggleEditMode(focus || this.modelHasEmptyName || false, false);
            this.validate();
          } else {
            focus = $(this.ui.nameInput).is(":focus");
            if (!focus) {
              this.validate();
            }
          }
        },

        setPlaceHolder: function (placeHolderName) {
          placeHolderName || (placeHolderName = lang.addItemPlaceHolderName);
          if (this.placeHolderName !== placeHolderName) {
            this.placeHolderName = placeHolderName;
            this.render();
          }
        },

        updateNameSchema: function (nameSchema) {
          if (this.modelHasEmptyName && this.ui.nameInput.val() === "" && !nameSchema.readonly) {
            nameSchema.required = true;
          }
          this._nameSchema = _.extend({
            required: true,
            readonly: false
          }, nameSchema);
          this.readonly = this._nameSchema.readonly;
          this.render();
          this.ui.nameInput[0].placeholder = this.placeHolderName;
          var focus = $(this.ui.nameInput).is(":focus");
          this._toggleEditMode(focus || this.modelHasEmptyName || false, false);
          return this.ItemNameBehavior.updateNameSchema(nameSchema);
        },

    onKeyDownGlobeIcon: function (event) {
      if (event.keyCode === 13 || event.keyCode === 32) {
      this.multiLingualForm && this.keyDownOnGlobeIcon(event);
      }
    },

   onClickGlobeIcon: function () {
     this._showLanguagePopover();
    }

      }
  );

  _.extend(MetadataItemNameView.prototype, ViewEventsPropagationMixin);

  return MetadataItemNameView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/header/leftbar/header.leftbar',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <span class=\"icon arrow_back cs-go-back\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackTooltip") || (depth0 != null ? lookupProperty(depth0,"goBackTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackTooltip","hash":{},"loc":{"start":{"line":2,"column":55},"end":{"line":2,"column":72}}}) : helper)))
    + "\"\r\n        title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"goBackTooltip") || (depth0 != null ? lookupProperty(depth0,"goBackTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"goBackTooltip","hash":{},"loc":{"start":{"line":3,"column":15},"end":{"line":3,"column":32}}}) : helper)))
    + "\"\r\n        role=\"link\"></span>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"back_button") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":5,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_header_leftbar_header.leftbar', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/impl/header/leftbar/header.leftbar',[],function(){});
csui.define('csui/widgets/metadata/impl/header/leftbar/header.leftbar.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'hbs!csui/widgets/metadata/impl/header/leftbar/header.leftbar',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'css!csui/widgets/metadata/impl/header/leftbar/header.leftbar'
], function (_, $, Marionette, template, lang, TabableRegionBehavior) {
  'use strict';

  var MetadataHeaderLeftBarView = Marionette.ItemView.extend({
    className: 'metadata-header-left-bar',

    template: template,
    templateHelpers: function () {
      var templateValues = {
        back_button: this.options.showBackIcon,
        goBackTooltip: lang.goBackTooltip
      };
      return templateValues;
    },

    behaviors: function () {
      if (this.options.showBackIcon) {
        return {
          TabableRegionBehavior: {
            behaviorClass: TabableRegionBehavior
          }
        };
      } else {
        return {};
      }
    },

    ui: {
      back: '.cs-go-back'
    },

    events: {
      'keydown': 'onKeyInView',
      'click @ui.back': 'onClickClose'
    },

    onKeyInView: function (e) {
      var event = e || window.event;
      var target = event.target || event.srcElement;
      if (event.keyCode === 13 || event.keyCode === 32) {
        // enter key(13) or space(32)
        event.preventDefault();
        event.stopPropagation();
        $(target).trigger('click');
      }
    },

    constructor: function MetadataHeaderLeftBarView(options) {
      options || (options = {});
      this.options = options;
      this.node = this.options.model;
      Marionette.ItemView.prototype.constructor.call(this, options);
    },

    currentlyFocusedElement: function () {
      if (this.options.showBackIcon) {
        return $(this.ui.back);
      }
      return undefined;
    },

    onClickClose: function (event) {
      event.preventDefault();
      event.stopPropagation();

      this.trigger('metadata:close');
    }
  });

  return MetadataHeaderLeftBarView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/header/rightbar/header.rightbar',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"binf-row shortcut-div\">\r\n    <a href=\"#\" class=\"shortcut-switch\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"right_label") || (depth0 != null ? lookupProperty(depth0,"right_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"right_label","hash":{},"loc":{"start":{"line":3,"column":47},"end":{"line":3,"column":62}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"right_label") || (depth0 != null ? lookupProperty(depth0,"right_label") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"right_label","hash":{},"loc":{"start":{"line":3,"column":64},"end":{"line":3,"column":79}}}) : helper)))
    + "</a>\r\n  </div>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <div class=\"metadata-header-floating-rightbar\">\r\n    <span class=\"icon close cs-metadata-close\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"close_metadata_button_tooltip") || (depth0 != null ? lookupProperty(depth0,"close_metadata_button_tooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"close_metadata_button_tooltip","hash":{},"loc":{"start":{"line":9,"column":54},"end":{"line":9,"column":87}}}) : helper)))
    + "\"></span>\r\n  </div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"is_shortcut") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"loc":{"start":{"line":1,"column":0},"end":{"line":5,"column":7}}})) != null ? stack1 : "")
    + "<div class=\"csui-extra-header-wrapper\"></div>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"show_close_icon") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"loc":{"start":{"line":7,"column":0},"end":{"line":11,"column":7}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_header_rightbar_header.rightbar', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/impl/header/rightbar/header.rightbar',[],function(){});
csui.define('csui/widgets/metadata/impl/header/rightbar/header.rightbar.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/commands', 'csui/controls/tabletoolbar/tabletoolbar.view',
  'csui/widgets/metadata/impl/header/rightbar/toolbaritems',
  'csui/widgets/metadata/impl/header/rightbar/toolbaritems.masks',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'hbs!csui/widgets/metadata/impl/header/rightbar/header.rightbar',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/controls/form/fields/booleanfield.view',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'css!csui/widgets/metadata/impl/header/rightbar/header.rightbar'
], function (_, $, Backbone, Marionette, commands, TableToolbarView,
    toolbarItems, ToolbarItemsMasks, ViewEventsPropagationMixin, template, lang,
    ApplicationScopeModelFactory, BooleanFieldView, TabableRegionBehavior) {

  var MetadataHeaderRightBarView = Marionette.LayoutView.extend({

    className: 'metadata-header-right-bar',

    template: template,
    templateHelpers: function () {
      var templateValues = {
        show_close_icon: this.options.showCloseIcon,
        close_metadata_button_tooltip: lang.closeMetadataButtonTooltip
      };
      // showing properties of the original model of a shortcut
      if (this.options.showShortcutSwitch && this.options.shortcutNode) {
        var right_static_label = lang.viewOriginalMessage;
        if (this.options.shortcutNode.original === this.node) {
          right_static_label = lang.viewShortcutMessage;
        }
        return _.extend(templateValues, {
          is_shortcut: true,
          right_label: right_static_label
        });
      } else {
        return templateValues;
      }
    },

    regions: {
      extraToolbarRegion: '.csui-extra-header-wrapper'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    ui: {
      shortcutSwitchLabel: 'a.shortcut-switch',
      closeIcon: '.cs-metadata-close'
    },

    events: {
      'keydown': 'onKeyInView',
      'click @ui.shortcutSwitchLabel': 'onClickShortcutSwitch',
      'click @ui.closeIcon': 'onClickClose'
    },

    constructor: function MetadataHeaderRightBarView(options) {
      options || (options = {});
      this.options = options;
      this.node = this.options.model;
      if (!options.toolbarItemsMasks) {
        options.toolbarItemsMasks = new ToolbarItemsMasks();
      }

      if (!options.toolbarItems) {
        options.toolbarItems = toolbarItems;
      }
      Marionette.LayoutView.prototype.constructor.call(this, options);
    },

    onRender: function () {
      if (this.options.showExtraRightActionBar) {
        this.options.parent.$el.addClass("extended-headers");
        this._showExtraRightActionBar();
      }
    },

    _showExtraRightActionBar: function (args) {
      var collection       = this.collection || this.options.model.collection,
          container        = this.options.container || collection ?
                             (collection.node ? collection.node :
                              this.options.model) : this.options.model,
          applicationScope = this.options.context &&
                             this.options.context.getModel(ApplicationScopeModelFactory),
          removeContainer  = false;
      if (applicationScope && applicationScope.get("id") === "search") {
        removeContainer = true;
      }
      this.toolbarView = new TableToolbarView({
        toolbarItems: this.options.toolbarItems,
        toolbarItemsMasks: this.options.toolbarItemsMasks,
        collection: collection,
        model: this.options.model,
        originatingView: this.options.originatingView,
        context: this.options.context,
        container: container,
        removeContainer: removeContainer
      });
      this.extraToolbarRegion.show(this.toolbarView);
    },

    onKeyInView: function (e) {
      var event = e || window.event;
      var target = event.target || event.srcElement;
      if (event.keyCode === 13 || event.keyCode === 32) {
        // enter key(13) or space(32)
        event.preventDefault();
        event.stopPropagation();
        // need timeout to overcome FireFox space press
        setTimeout(function () {
          $(target).trigger('click');
        }, 200);
      }
    },

    currentlyFocusedElement: function (event) {
      var tabElements = this.$('*[tabindex]');
      if (tabElements.length) {
        tabElements.prop('tabindex', 0);
      }
      if (!!event && event.shiftKey) {
        return $(tabElements[tabElements.length - 1]);
      } else {
        return $(tabElements[0]);
      }
    },

    onClickShortcutSwitch: function (event) {
      event.preventDefault();
      event.stopPropagation();

      this.trigger('shortcut:switch');
    },

    onClickClose: function (event) {
      event.preventDefault();
      event.stopPropagation();

      this.trigger("metadata:close");
    }

  });

  _.extend(MetadataHeaderRightBarView.prototype, ViewEventsPropagationMixin);

  return MetadataHeaderRightBarView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/header/metadata.header',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    return "\r\n  <div class=\"metadata-header-left-bar-container\"></div>\r\n  <div class=\"metadata-header with-right-bar\"></div>\r\n\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"back_button") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.program(9, data, 0),"loc":{"start":{"line":8,"column":2},"end":{"line":26,"column":9}}})) != null ? stack1 : "")
    + "\r\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\r\n    <div class=\"metadata-header-left-bar-container\"></div>\r\n\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"show_only_required_fields_switch") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(7, data, 0),"loc":{"start":{"line":12,"column":4},"end":{"line":16,"column":11}}})) != null ? stack1 : "")
    + "\r\n";
},"5":function(container,depth0,helpers,partials,data) {
    return "      <div class=\"metadata-header with-back-button with-right-bar\"></div>\r\n";
},"7":function(container,depth0,helpers,partials,data) {
    return "      <div class=\"metadata-header with-back-button\"></div>\r\n";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"show_only_required_fields_switch") : depth0),{"name":"if","hash":{},"fn":container.program(10, data, 0),"inverse":container.program(12, data, 0),"loc":{"start":{"line":20,"column":4},"end":{"line":24,"column":11}}})) != null ? stack1 : "")
    + "\r\n";
},"10":function(container,depth0,helpers,partials,data) {
    return "      <div class=\"metadata-header with-right-bar\"></div>\r\n";
},"12":function(container,depth0,helpers,partials,data) {
    return "      <div class=\"metadata-header\"></div>\r\n";
},"14":function(container,depth0,helpers,partials,data) {
    return "  <div class=\"metadata-header-right-bar-container\"></div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"is_shortcut") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":1,"column":0},"end":{"line":28,"column":7}}})) != null ? stack1 : "")
    + "\r\n"
    + ((stack1 = (lookupProperty(helpers,"xif")||(depth0 && lookupProperty(depth0,"xif"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),"this.show_close_icon || this.show_only_required_fields_switch || this.is_shortcut",{"name":"xif","hash":{},"fn":container.program(14, data, 0),"inverse":container.noop,"loc":{"start":{"line":30,"column":0},"end":{"line":32,"column":8}}})) != null ? stack1 : "");
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_header_metadata.header', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/impl/header/metadata.header',[],function(){});
csui.define('csui/widgets/metadata/impl/header/metadata.header.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/widgets/metadata/impl/header/item.name/metadata.item.name.view',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/widgets/metadata/impl/header/leftbar/header.leftbar.view',
  'csui/widgets/metadata/impl/header/rightbar/header.rightbar.view',
  'hbs!csui/widgets/metadata/impl/header/metadata.header',
  'i18n!csui/widgets/metadata/impl/nls/lang', 'csui/utils/log',
  'csui/controls/form/fields/booleanfield.view',
  'css!csui/widgets/metadata/impl/header/metadata.header',
  'csui/lib/handlebars.helpers.xif'
], function (_, $, Backbone, Marionette, MetadataItemNameView, ViewEventsPropagationMixin,
    MetadataHeaderLeftBarView, MetadataHeaderRightBarView, template, lang, log,
    BooleanFieldView) {

  var MetadataHeaderView = Marionette.ItemView.extend({

    className: 'metadata-content-header',
    template: template,
    templateHelpers: function () {
      var templateValues = {
        back_button: this.options.showBackIcon,
        show_close_icon: this.options.showCloseIcon,
        close_metadata_button_tooltip: lang.closeMetadataButtonTooltip,
        show_only_required_fields_switch: this.options.showRequiredFieldsSwitch,
        only_required_fields_label: lang.onlyRequiredFieldsLabel
      };
      // showing properties of the original model of a shortcut
      if (this.options.showShortcutSwitch && this.options.shortcutNode) {
        var right_static_label = lang.viewOriginalMessage;
        if (this.options.shortcutNode.original === this.node) {
          right_static_label = lang.viewShortcutMessage;
        }
        return _.extend(templateValues, {
          is_shortcut: true,
          right_label: right_static_label
        });
      } else {
        return templateValues;
      }
    },

    ui: {
      leftbar: '.metadata-header-left-bar-container',
      header: '.metadata-header',
      rightbar: '.metadata-header-right-bar-container'
    },

    events: {
      'click .metadata-header': 'onClickHeader'
    },

    constructor: function MetadataHeaderView(options) {
      options || (options = {});
      this.options = options;
      this.node = this.options.model;
      this.originatingView = options.originatingView;
      Marionette.ItemView.prototype.constructor.call(this, options);
      this._createMetadataHeaderLeftBarView();
      this._createMetadataItemNameView();
      this._createMetadataHeaderRightBarView();
    },

    _createMetadataHeaderLeftBarView: function () {
      if (this.leftbarView) {
        this.cancelEventsToViewsPropagation(this.leftbarView);
        this.leftbarView.destroy();
      }

      var lbv = this.leftbarView = new MetadataHeaderLeftBarView(this.options);
      this.listenTo(lbv, 'metadata:close', function (args) {
        this.trigger('metadata:close', args);
      });

      this.propagateEventsToViews(this.leftbarView);
    },

    _createMetadataItemNameView: function (viewNode) {
      if (this.metadataItemNameView) {
        this.cancelEventsToViewsPropagation(this.metadataItemNameView);
        this.metadataItemNameView.destroy();
      }

      var node = viewNode || this.node;
      var inv = this.metadataItemNameView = new MetadataItemNameView({
        model: node,
        container: this.options.container,
        containerCollection: this.options.containerCollection,
        collection: this.options.collection,
        context: this.options.context,
        nameSchema: this._getNameSchema(),
        commands: this.options.commands,
        originatingView: this.options.originatingView,
        showDropdownMenu: this.options.showDropdownMenu,
        metadataScenario: this.options.metadataScenario,
        showPermissionView: this.options.showPermissionView,
        mode: this.options.action,
        targetView: this.options.targetView
      });
      this.listenTo(inv, 'metadata:item:name:save', function (args) {
        this.trigger('metadata:item:name:save', args);
      });
      this.listenTo(inv, 'update:button', _.bind(function (args) {
        this.trigger('update:button', args);
      }, this));

      this.propagateEventsToViews(this.metadataItemNameView);
    },

    _createMetadataHeaderRightBarView: function (viewNode) {
      if (this.rightbarView) {
        this.cancelEventsToViewsPropagation(this.rightbarView);
        this.rightbarView.destroy();
      }

      var node = viewNode || this.node;
      var rbv = this.rightbarView = new MetadataHeaderRightBarView(
          _.extend({}, this.options,
              {model: node, parent: this, showExtraRightActionBar: this.options.showExtraRightActionBar})
      );
      this.listenTo(rbv, 'shortcut:switch', this.onClickShortcutSwitch);
      this.listenTo(rbv, 'metadata:close', function (args) {
        this.trigger('metadata:close', args);
      });

      this.propagateEventsToViews(this.rightbarView);
    },

    onRender: function () {
      var lbv = this.leftbarView.render();
      Marionette.triggerMethodOn(lbv, 'before:show', lbv, this);
      this.ui.leftbar.append(lbv.el);

      var inv = this.metadataItemNameView.render();
      Marionette.triggerMethodOn(inv, 'before:show', inv, this);
      this.ui.header.append(inv.el);

      var rbv = this.rightbarView.render();
      Marionette.triggerMethodOn(rbv, 'before:show', rbv, this);
      this.ui.rightbar.append(rbv.el);

      if (this.options.showCloseIcon) {
        this.$el.addClass('with-close-icon');
      }
      if (this.options.showShortcutSwitch && this.options.shortcutNode) {
        this.$el.addClass('shortcut-object');
      }

      Marionette.triggerMethodOn(lbv, 'show', lbv, this);
      Marionette.triggerMethodOn(inv, 'show', inv, this);
      Marionette.triggerMethodOn(rbv, 'show', rbv, this);
    },

    onBeforeDestroy: function () {
      if (this.leftbarView) {
        this.cancelEventsToViewsPropagation(this.leftbarView);
        this.leftbarView.destroy();
      }
      if (this.metadataItemNameView) {
        this.cancelEventsToViewsPropagation(this.metadataItemNameView);
        this.metadataItemNameView.destroy();
      }
      if (this.requiredFieldSwitchView) {
        this.requiredFieldSwitchView.destroy();
      }
    },

    onClickHeader: function (event) {
      event.preventDefault();
      event.stopPropagation();

      // UX changed their mind
      //this.trigger("metadata:close", {sender: this});
    },

    onClickShortcutSwitch: function () {
      var viewNode = this.model;
      if (this.options.shortcutNode && this.options.shortcutNode.original === this.node) {
        // content shall show now shortcut
        // label shall be 'show original'
        viewNode = this.node = this.options.shortcutNode;
      } else {
        // content shall show now original
        // label shall be 'show shortcut'
        viewNode = this.node = this.node.original;
      }

      this._createMetadataItemNameView(viewNode);
      var inv = this.metadataItemNameView.render();
      Marionette.triggerMethodOn(inv, 'before:show', inv, this);
      this.ui.header.append(inv.el);
      Marionette.triggerMethodOn(inv, 'show', inv, this);

      this._createMetadataHeaderRightBarView(viewNode);
      var rbv = this.rightbarView.render();
      Marionette.triggerMethodOn(rbv, 'before:show', rbv, this);
      this.ui.rightbar.append(rbv.el);
      Marionette.triggerMethodOn(rbv, 'show', rbv, this);
      // set focus back on the new view for keyboard navigation
      var $elem = rbv.currentlyFocusedElement();
      $elem && $elem.trigger('focus');

      this.trigger('shortcut:switch', {node: viewNode});
    },

    getNameInputBoxValue: function () {
      return this.metadataItemNameView.getInputBoxValue();
    },

    validateName: function () {
      var inputValue = this.metadataItemNameView.getInputBoxValue();
      return this.metadataItemNameView.validate(inputValue);
    },

    getNameValue: function () {
      return this.metadataItemNameView.getValue();
    },

    setNameEditModeFocus: function () {
      this.metadataItemNameView.setEditModeFocus();
    },

    showBackIcon: function(show, doRender) {
      this.options.showBackIcon = show;
      this.leftbarView.options.showBackIcon = show;
      if (!this.isDestroyed && doRender) {
          this.render();
      }
    },

    _getNameSchema: function () {
      var generalForm = this.options.collection && this.options.collection.first(),
          formSchema  = generalForm && generalForm.get('schema'),
          nameSchema  = formSchema && formSchema.properties && formSchema.properties.name;
      // Warn only if the form collection was used to populate the view;
      // it is the case only for the creation mode, where the name should
      // be always present and flagged by required/readonly correctly
      if (this.options.collection && formSchema && !nameSchema) {
        log.warn('Form collection lacks name field in the first form.');
      }
      return nameSchema || {};
    }

  });

  _.extend(MetadataHeaderView.prototype, ViewEventsPropagationMixin);

  return MetadataHeaderView;

});

csui.define('csui/widgets/metadata/property.panels/categories/impl/category.form.view',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/base',
  'csui/utils/url', 'csui/utils/log', 'csui/controls/form/form.view',
  'csui/controls/globalmessage/globalmessage', 'csui/models/appliedcategories/category'
], function (module, _, $, base, Url, log, FormView, GlobalMessage, CategoryModel) {
  'use strict';

  log = log(module.id);

  var CategoryFormView = FormView.extend({
    constructor: function CategoryFormView(options) {
      FormView.prototype.constructor.call(this, options);

      this.node = this.options.node;
      this.listenTo(this, 'change:field', this._saveField);
      this.listenTo(this, 'disable:active:item', this._disableItem);
    },

    onRequestProcessing: function (view) {
      this.propagatedView = view;
    },

    _disableItem: function (args) {
      this.options.metadataView && this.options.metadataView.trigger('disable:active:item');
    },

    _saveField: function (args) {
      // This view is shared for both creation and editing scenarios.
      // Do not save immediately in the creation mode.  The creation dialog
      // has a button to get all field values and perform the action.
      if (this.mode === 'create') {
        return;
      }

      // Optimizing the payload to send a part of the category, which has to
      // be complete, is complicated.  The classic UI sends all data anyway.
      // Until we have PATCH behaviour in the REST API, it doesn't pay off.
      var values = this.getValues();
      this._saveChanges(values);
    },

    _saveChanges: function (changes) {
      if (!this.node) {
        throw new Error('Missing node to save the categories to.');
      }
      this.isDataUpdating = true;
      if (_.keys(changes).length) {
        if (this._validate(changes)) {
          this._removeInternalProperties(changes);
          this._blockActions();
          var categoryModel = new CategoryModel({}, {connector: this.node.connector, node: this.node, id: this.model.get('id')});
          return categoryModel.save(changes, {
                type: 'PUT',
                processData: false,
                contentType: false
              })
              .done(_.bind(function (response) {
                this._updateMetadataToken(response, changes);
                this.model.set('data', changes, {silent: true});
                this.trigger('forms:sync');
                // event for keyboard navigation
                var event = $.Event('tab:content:field:changed');
                this.options.metadataView &&
                this.options.metadataView.trigger('enable:active:item');
                this.$el.trigger(event);
              }, this))
              .fail(_.bind(function (jqxhr) {
                var preValues = this.model.get('data');
                this.form.children.forEach(function (formField) {
                  formField.setValue(preValues[formField.propertyId]);
                  formField.refresh();
                });
                var error = new base.Error(jqxhr);
                GlobalMessage.showMessage('error', error.message);
                this.trigger('forms:error');
              }, this))
              .always(_.bind(function () {
                this.isDataUpdating = false;
                //Unblocking the metadataView
                this.options.metadataView && this.options.metadataView.unblockActions
                  && this.options.metadataView.unblockActions();
                //Trigerring the event to proceed further actions if there is any
                this.trigger("request:completed", this.propagatedView);
                this._unblockActions();
              }, this));
        }
        return $.Deferred().reject().promise();
      }
      return $.Deferred().resolve().promise();
    },

    // Alpaca returns all field values including read-only ones. The server
    // rejects the request, if the read-only internal fields are posted.
    _removeInternalProperties: function (categoryData) {
      var categoryId = this.model.get('id');
      var stateId = categoryId + '_1';
      var categorySchema = this.model.get('schema') || {};
      var stateSchema = categorySchema.properties && categorySchema.properties[stateId];
      if (stateSchema) {
        stateSchema = stateSchema.properties || (stateSchema.properties = {});
        var stateData = categoryData[stateId] || {};
        Object
          .keys(stateSchema)
          .forEach(function (propertyName) {
            if (propertyName === 'metadata_token') {
              log.debug('Metadata token "{1}" detected in the category "{0}".',
                  categoryId, stateData[propertyName]) && console.log(log.last);
            }
            // Let only writable properties sent back to the server.
            if (stateSchema[propertyName].readonly) {
              delete stateData[propertyName];
            }
          });
      }
    },

    // Set the metadata token using Alpaca API, because setting values in
    // the model does not work and values are retrieved by Alpaca API.
    _updateMetadataToken: function (response, data) {
      var categoryId = this.model.get('id');
      var stateId = categoryId + '_1';
      var categorySchema = this.model.get('schema') || {};
      var stateSchema = categorySchema.properties && categorySchema.properties[stateId];
      if (stateSchema) {
        stateSchema = stateSchema.properties || (stateSchema.properties = {});
        if (stateSchema.metadata_token) {
          try {
            var metadataTokenValue = response.state.categories[0][categoryId].metadata_token;
            var metadataTokenField = this.form.childrenByPropertyId[stateId].childrenByPropertyId.metadata_token;
            metadataTokenField.setValue(metadataTokenValue);
            data && (data[stateId] = metadataTokenValue);
            log.debug('Metadata token in the category "{0}" updated to "{1}".',
                categoryId, metadataTokenValue) && console.log(log.last);
          } catch (error) {
            log.warn('Updating metadata token the category "{0}" failed.',
                categoryId) && console.log(log.last);
          }
        }
      }
    }
  });

  return CategoryFormView;
});


csui.define('csui/widgets/metadata/metadata.general.form.fields',[
  'csui/lib/underscore', 'csui/lib/backbone',
  // Load extra property panels to be added to the built-in tabs
  'csui-ext!csui/widgets/metadata/metadata.general.form.fields'
], function (_, Backbone, extraGeneralFormFields) {

  var MetadataGeneralFormFieldModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      controller: null,
      controllerOptions: null
    },

    constructor: function MetadataGeneralFormFieldModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var MetadataGeneralFormFieldCollection = Backbone.Collection.extend({

    model: MetadataGeneralFormFieldModel,
    comparator: 'sequence',

    constructor: function MetadataGeneralFormFieldCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }

  });

  var metadataGeneralFormFields = new MetadataGeneralFormFieldCollection();

  if (extraGeneralFormFields) {
    extraGeneralFormFields = _.flatten(extraGeneralFormFields, true);
    _.each(extraGeneralFormFields, function () {
      var sequence = extraGeneralFormFields.sequence;
      if (sequence < 10 || sequence > 100) {
        throw new Error('Sequence must be greater or equal to 10 and less or equal to 100.');
      }
    });
    metadataGeneralFormFields.add(extraGeneralFormFields);
  }

  return metadataGeneralFormFields;

});


csui.define('css!csui/widgets/metadata/general.form.fields/impl/general.form.fields.view',[],function(){});
csui.define('csui/widgets/metadata/general.form.fields/impl/general.form.fields.view',['csui/lib/underscore', 'csui/lib/marionette',
  'csui/controls/form/form.view',
  'css!csui/widgets/metadata/general.form.fields/impl/general.form.fields.view'
], function (_, Marionette, FormView) {
  'use strict';

  var GeneralFormFieldCollectionView = Marionette.CollectionView.extend({

    className: 'csui-general-form-fields',

    getChildView: function (model) {
      var fieldDescriptor = _.findWhere(this.options.fieldDescriptors,
          {formModel: model});
      return fieldDescriptor && fieldDescriptor.formView || FormView;
    },

    childViewOptions: function (model) {
      var options = {
            context: this.options.context,
            node: this.options.node,
            mode: this.options.mode,
            generalFormView: this.view,
            fetchedModels: this.options.fetchedModels,
            displayedModels: this.options.displayedModels,
            originatingView: this.options.originatingView,
            metadataView: this.options.metadataView,
            layoutMode: 'singleCol'
          },
          fieldDescriptor = _.findWhere(this.options.fieldDescriptors,
              {formModel: model});
      if (fieldDescriptor) {
        _.extend(options, fieldDescriptor.formViewOptions);
      }
      return options;
    },

    constructor: function GeneralFormFieldCollectionView(options) {
      Marionette.CollectionView.prototype.constructor.call(this, options);
      this.listenTo(this, 'render', this._triggerRenderForms);
    },

    // Trigger render:forms once every form has triggered render:form
    _triggerRenderForms: function () {
      var children = this.children.map(function (formView) {
        var formViewId = formView.cid;
        formView.once('render:form', function () {
          children = _.without(children, formViewId);
          if (!children.length) {
            this.triggerMethod('render:forms', this);
          }
        }, this);
        return formView.cid;
      }, this);
    }

  });

  return GeneralFormFieldCollectionView;

});

csui.define('csui/widgets/metadata/general.form.fields/general.form.field.behavior',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/widgets/metadata/metadata.general.form.fields',
  'csui/widgets/metadata/general.form.fields/impl/general.form.fields.view',
  'csui/dialogs/modal.alert/modal.alert'
], function (_, $, Backbone, Marionette, metadataGeneralFormFields,
    GeneralFormFieldCollectionView, ModalAlert) {
  'use strict';

  var GeneralFormFieldBehavior = Marionette.Behavior.extend({
    constructor: function GeneralFormFieldBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);
      this.view = view;
      this
          .listenTo(this.view, 'render', this._insertFieldExtensions)
          .listenTo(this.view, 'destroy', this._emptyExtensionRegion);

      var self = this;
      view.getGeneralFormFieldValues = function () {
        var formValues = {};
        // Forms with extra fields are rendered only if there
        // were any field descriptors specified; there are no
        // data without forms
        if (self.fieldRegion) {
          self.fieldRegion.currentView.children.each(function (formView) {
            var values = formView.getValues(),
                roleName = formView.model.get("role_name"),
                roles, role;
            if (values) {
              if (roleName) {
                roles = formValues.roles || (formValues.roles = {});
                role = roles[roleName] || (roles[roleName] = {});
                // With a role defined, merge the properties to the
                // roles.<role_name> object
                _.extend(role, values);
              } else {
                // With no role defined, merge the properties to the root
                // object literal with the general properties
                _.extend(formValues, values);
              }
            }
          });
        }
        return formValues;
      };
    },

    _insertFieldExtensions: function () {
      var fieldParent = this.getOption('fieldParent');
      if (_.isFunction(fieldParent)) {
        fieldParent = fieldParent.call(this.view);
      }
      if (fieldParent) {
        fieldParent = this.view.$(fieldParent)[0];
      }
      if (!fieldParent) {
        return;
      }

      var fieldDescriptors = this.getOption('fieldDescriptors');
      if (_.isFunction(fieldDescriptors)) {
        fieldDescriptors = fieldDescriptors.call(this.view);
      }
      if (!fieldDescriptors || !fieldDescriptors.length) {
        return;
      }

      this.fieldRegion = new Marionette.Region({el: fieldParent});

      var fieldViewOptions = this.getOption('fieldViewOptions');
      if (_.isFunction(fieldViewOptions)) {
        fieldViewOptions = fieldViewOptions.call(this.view);
      }
      var fieldModels = new Backbone.Collection(_.pluck(fieldDescriptors, 'formModel')),
          fieldViews = new GeneralFormFieldCollectionView(_.extend({
            context: this.view.options.context,
            fieldDescriptors: fieldDescriptors,
            collection: fieldModels,
            node: this.view.options.node,
            mode: this.view.options.mode,
            generalFormView: this.view,
            fetchedModels: this.view.options.fetchedModels,
            displayedModels: this.view.options.displayedModels,
            originatingView: this.view.options.originatingView,
            metadataView: this.view.options.metadataView
          }, fieldViewOptions));
      this.listenTo(fieldViews, 'render:forms', function () {
        this.view.triggerMethod('render:general:form:fields', fieldViews);
      });
      this.fieldRegion.show(fieldViews);
    },

    _emptyExtensionRegion: function () {
      if (this.fieldRegion) {
        this.fieldRegion.empty();
      }
    }

  }, {

    getFieldDescriptors: function (options) {
      var methodName, parameters;
      if (options.action === 'create') {
        methodName = 'getGeneralFormFieldsForCreate';
        parameters = [{forms: options.forms}];
      } else if (options.action === 'copy') {
        methodName = 'getGeneralFormFieldsForCopy';
        parameters = [{forms: options.forms}];
      } else if (options.action === 'move') {
        methodName = 'getGeneralFormFieldsForMove';
        parameters = [{forms: options.forms}];
      }else if (options.action === 'restructure') {
        // restructure functionality is similar to move, so we can reuse this method
        methodName = 'getGeneralFormFieldsForMove';
        parameters = [{forms: options.forms}]; 
      }else {
        methodName = 'getGeneralFormFields';
      }
      var promises = metadataGeneralFormFields.chain()
          .map(function (fieldControllerDescriptor) {
            var Controller = fieldControllerDescriptor.get('controller'),
                controllerOptions = fieldControllerDescriptor.get('controllerOptions'),
                controller = new Controller(_.extend({
                  context: options.context,
                  model: options.node,
                  fetchedModels: options.forms
                }, controllerOptions)),
                method = controller[methodName];
            return method && method.apply(controller, parameters);
          })
          .compact()
          .value();
      return $.when
          .apply($, promises)
          .then(function () {
            return _.flatten(arguments);
          });
    }

  });

  return GeneralFormFieldBehavior;
});


csui.define('csui/widgets/metadata/metadata.general.action.fields',[
  'csui/lib/underscore', 'csui/lib/backbone',
  // Load extra property panels to be added to the built-in tabs
  'csui-ext!csui/widgets/metadata/metadata.general.action.fields'
], function (_, Backbone, generalActionFields) {

  var MetadataGeneralActionFieldModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      controller: null,
      controllerOptions: null
    },

    constructor: function MetadataGeneralActionFieldModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var MetadataGeneralActionFieldCollection = Backbone.Collection.extend({

    model: MetadataGeneralActionFieldModel,
    comparator: 'sequence',

    constructor: function MetadataGeneralActionFieldCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }

  });

  var metadataGeneralActionFields = new MetadataGeneralActionFieldCollection();

  // Adding Action Fields to General Panels

    if (generalActionFields) {
        generalActionFields = _.flatten(generalActionFields, true);
        _.each(generalActionFields, function () {
            var sequence = generalActionFields.sequence;
            if (sequence < 10 || sequence > 100) {
                throw new Error('Sequence must be greater or equal to 10 and less or equal to 100.');
            }
        });
        metadataGeneralActionFields.add(generalActionFields);
    }


  return metadataGeneralActionFields;

});

csui.define('csui/widgets/metadata/general.action.fields/impl/general.action.fields.view',['csui/lib/underscore', 'csui/lib/marionette',
    'csui/controls/form/form.view',
    'css!csui/widgets/metadata/general.form.fields/impl/general.form.fields.view'
], function (_, Marionette, FormView) {
    'use strict';

    var GeneralActionFieldCollectionView = Marionette.CollectionView.extend({

        className: 'csui-general-action-fields',

        getChildView: function (model) {
            var fieldDescriptor = _.findWhere(this.options.fieldDescriptors,
                {formModel: model});
            return fieldDescriptor && fieldDescriptor.formView || FormView;
        },

        childViewOptions: function (model) {
            var options = {
                    context: this.options.context,
                    node: this.options.node,
                    mode: this.options.mode,
                    generalFormView: this.view,
                    fetchedModels: this.options.fetchedModels,
                    displayedModels: this.options.displayedModels,
                    originatingView: this.options.originatingView,
                    metadataView: this.options.metadataView,
                    layoutMode: 'singleCol'
                },
                fieldDescriptor = _.findWhere(this.options.fieldDescriptors,
                    {formModel: model});
            if (fieldDescriptor) {
                _.extend(options, fieldDescriptor.formViewOptions);
            }
            return options;
        },

        constructor: function GeneralActionFieldCollectionView(options) {
            Marionette.CollectionView.prototype.constructor.call(this, options);
            this.listenTo(this, 'render', this._triggerRenderForms);
        },

        // Trigger render:forms once every form has triggered render:form
        _triggerRenderForms: function () {
            var children = this.children.map(function (formView) {
                var formViewId = formView.cid;
                formView.once('render:form', function () {
                    children = _.without(children, formViewId);
                    if (!children.length) {
                        this.triggerMethod('render:forms', this);
                    }
                }, this);
                return formView.cid;
            }, this);
        }

    });

    return GeneralActionFieldCollectionView;

});

csui.define('csui/widgets/metadata/general.action.fields/general.action.field.behavior',[
    'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
    'csui/lib/marionette', 'csui/widgets/metadata/metadata.general.action.fields',
    'csui/widgets/metadata/general.action.fields/impl/general.action.fields.view',
    'csui/dialogs/modal.alert/modal.alert'
], function (_, $, Backbone, Marionette, metadataGeneralActionFields,
        GeneralActionFieldCollectionView, ModalAlert) {
    'use strict';

    var GeneralActionFieldBehavior = Marionette.Behavior.extend({
        constructor: function GeneralActionFieldBehavior(options, view) {
            Marionette.Behavior.prototype.constructor.apply(this, arguments);
            this.view = view;
            this
                .listenTo(this.view, 'render', this._insertFieldExtensions)
                .listenTo(this.view, 'destroy', this._emptyExtensionRegion);

            var self = this;
            view.getGeneralActionFieldValues = function () {
                var formValues = {};
                // Forms with extra fields are rendered only if there
                // were any field descriptors specified; there are no
                // data without forms
                if (self.fieldRegion) {
                    self.fieldRegion.currentView.children.each(function (formView) {
                        var values = formView.getValues(),
                            roleName = formView.model.get("role_name"),
                            roles, role;
                        if (values) {
                            if (roleName) {
                                roles = formValues.roles || (formValues.roles = {});
                                role = roles[roleName] || (roles[roleName] = {});
                                // With a role defined, merge the properties to the
                                // roles.<role_name> object
                                _.extend(role, values);
                            } else {
                                // With no role defined, merge the properties to the root
                                // object literal with the general properties
                                _.extend(formValues, values);
                            }
                        }
                    });
                }
                return formValues;
            };
        },

        _insertFieldExtensions: function () {
            var fieldParent = this.getOption('fieldParent');
            if (_.isFunction(fieldParent)) {
                fieldParent = fieldParent.call(this.view);
            }
            if (fieldParent) {
                fieldParent = this.view.$(fieldParent)[0];
            }
            if (!fieldParent) {
                return;
            }

            var fieldDescriptors = this.getOption('fieldDescriptors');
            if (_.isFunction(fieldDescriptors)) {
                fieldDescriptors = fieldDescriptors.call(this.view);
            }
            if (!fieldDescriptors || !fieldDescriptors.length) {
                return;
            }

            this.fieldRegion = new Marionette.Region({el: fieldParent});

            var fieldViewOptions = this.getOption('fieldViewOptions');
            if (_.isFunction(fieldViewOptions)) {
                fieldViewOptions = fieldViewOptions.call(this.view);
            }
            var fieldModels = new Backbone.Collection(_.pluck(fieldDescriptors, 'formModel')),
                fieldViews = new GeneralActionFieldCollectionView(_.extend({
                    context: this.view.options.context,
                    fieldDescriptors: fieldDescriptors,
                    collection: fieldModels,
                    node: this.view.options.node,
                    mode: this.view.options.mode,
                    generalFormView: this.view,
                    fetchedModels: this.view.options.fetchedModels,
                    displayedModels: this.view.options.displayedModels,
                    originatingView: this.view.options.originatingView,
                    metadataView: this.view.options.metadataView
                }, fieldViewOptions));
            this.listenTo(fieldViews, 'render:actions', function () {
                this.view.triggerMethod('render:general:action:fields', fieldViews);
            });
            this.fieldRegion.show(fieldViews);
        },

        _emptyExtensionRegion: function () {
            if (this.fieldRegion) {
                this.fieldRegion.empty();
            }
        }

    }, {

        getFieldDescriptors: function (options) {
            var methodName, parameters;
            if (options.action === 'create') {
                methodName = 'getGeneralActionFieldsForCreate';
                parameters = [{forms: options.forms}];
            } else if (options.action === 'copy') {
                methodName = 'getGeneralActionFieldsForCopy';
                parameters = [{forms: options.forms}];
            } else if (options.action === 'move') {
                methodName = 'getGeneralActionFieldsForMove';
                parameters = [{forms: options.forms}];
            }else if (options.action === 'restructure') {
                // restructure functionality is similar to move, so we can reuse this method
                methodName = 'getGeneralActionFieldsForMove';
                parameters = [{forms: options.forms}];
            }else {
                methodName = 'getGeneralActionFields';
            }
            var promises = metadataGeneralActionFields.chain()
                .map(function (fieldControllerDescriptor) {
                    var Controller = fieldControllerDescriptor.get('controller'),
                        controllerOptions = fieldControllerDescriptor.get('controllerOptions'),
                        controller = new Controller(_.extend({
                            context: options.context,
                            model: options.node,
                            fetchedModels: options.forms
                        }, controllerOptions)),
                        method = controller[methodName];
                    return method && method.apply(controller, parameters);
                })
                .compact()
                .value();
            return $.when
                .apply($, promises)
                .then(function () {
                    return _.flatten(arguments);
                });
        }

    });

    return GeneralActionFieldBehavior;
});

csui.define('csui/widgets/metadata/general.panels/node/server.adaptor.mixin',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/utils/nodesprites',
  'csui/controls/table/cells/size/size.view', 'csui/utils/base',
  'csui/utils/url', 'csui/models/form', 'csui/models/version',
  'csui/models/mixins/node.resource/node.resource.mixin',
  'i18n!csui/widgets/metadata/impl/nls/lang'
], function (_, Backbone, NodeSpriteCollection, SizeView, base, Url,
    FormModel, VersionModel, NodeResourceMixin, lang) {
  'use strict';

  var prototypeExt = {
    makeServerAdaptor: function (options) {
      return this;
    },

    url: function () {
      var node   = this.options.node,
          nodeId = node.get('id'),
          url;
      if (nodeId === undefined) {
        // creation form
        url = _.str.sformat('forms/nodes/create?type={0}&parent_id={1}',
            node.get('type'), node.get('parent_id'));
      } else {
        if (node instanceof VersionModel) {
          url = _.str.sformat('forms/nodes/versions/properties/general?id={0}&version_number={1}',
              nodeId, node.get('version_number'));
        } else {
          // update form
          url = _.str.sformat('forms/nodes/properties/general?id={0}', nodeId);
        }
      }
      return Url.combine(this.connector.connection.url, url);
    },

    parse: function (response, options) {
      if(!this.node) {
        this.node = options.node;
      }
      // Some views may fail if one of the three properties was missing
      var form  = _.extend({
            data: {},
            schema: {},
            options: {}
            // The server returns an array pf forms, although only one category
            // was requested.  Normalize the response to be just a single form.
          }, options.response || response.form || response.forms && response.forms[0] || response),
          // Title usually does not come from the server
          title = form.title || this.get('title') || lang.general;

      form.options = _.omit(form.options, 'form');
      if (!form.schema.title) {
        form.schema.title = title;
      }
      if (!form.title) {
        form.title = title;
      }

      this._addCreatorInfo(form, options);
      this._addOwnerInfo(form, options);
      this._addCreateDateInfo(form, options);
      this._addModifyDateInfo(form, options);
      this._addMimeTypeInfo(form, options);
      this._addSizeInfo(form, options);
      this._addItemidInfo(form, options);
      this._ensurePlaceholder(form, options);
      this._addReserveInfo(form, options);
      this._addMimeTypeClassNameInfo(form, options);
      this._addSystemAttributes(form,options);
      return form;
    },

    _addSizeInfo: function (ret, options) {
      var type = this.options.node.get('type');

      this.sizeView = new SizeView({
        model: this.options.node,
        column: {name: this.options.node.has('size') ? "size" : "file_size"}
      });

      var refNode =
              _.extend(ret.data, {
                // TODO: Create a custom field showing the friendly size
                // in the visible HTML element and the full size in bytes
                // in a tooltip
                size: this.sizeView.getValueData().formattedValue || this.options.node.get('size_formatted')
              });

      _.extend(ret.options.fields, {
        size: {
          hidden: false,
          readonly: true,
          label: lang.formFieldSizeLabel,
          placeholder: lang.alpacaPlaceholderNotAvailable,
          type: "text"
        }
      });

      _.extend(ret.schema.properties, {
        size: {
          hidden: false,
          readonly: true,
          title: lang.formFieldSizeLabel,
          type: "string"
        }
      });
    },

    _addItemidInfo: function (ret, options) {
      if (!!this.node) {
        var type = this.options.node.get('type');
        var refNode =
                _.extend(ret.data, {
                  itemId: this.node.get('id')
                });

        _.extend(ret.options.fields, {
          itemId: {
            hidden: false,
            readonly: true,
            label: lang.formFieldItemIdLabel,
            placeholder: lang.alpacaPlaceholderNotAvailable,
            type: "text"
          }
        });
        _.extend(ret.schema.properties, {
          itemId: {
            hidden: false,
            readonly: true,
            label: lang.formFieldItemIdLabel,
            placeholder: lang.alpacaPlaceholderNotAvailable,
            type: "text",
            tooltip: this.node.get('id')
          }
        });
      }
    },

    _addCreateDateInfo: function (ret, options) {
      if (!ret.options.fields.create_date) {
        return;
      }
      ret.options.fields.create_date.type = 'datetime';
      ret.options.fields.create_date.placeholder = lang.alpacaPlaceholderNotAvailable;
      ret.schema.properties.create_date.format = 'datetime';
    },

    _addModifyDateInfo: function (ret, options) {
      if (!ret.options.fields.modify_date) {
        return;
      }
      ret.options.fields.modify_date.type = 'datetime';
      ret.options.fields.modify_date.placeholder = lang.alpacaPlaceholderNotAvailable;
      ret.schema.properties.modify_date.format = 'datetime';
    },

    _addOwnerInfo: function (ret, options) {
      var ownerField = 'owner_user_id';
      // for version, we are still using v1 call for now until switch to v2
      if (this.node instanceof VersionModel) {
        ownerField = 'owner_id';  // v1 has a slightly different field name
      }
      if (!ret.options.fields[ownerField]) {
        return;
      }
      var isOwnerExists = this.node.get('owner_user_id') === -3,
          owner         = isOwnerExists ? {
            'id': -3
          } : (this.node.get('owner_user_id_expand') ||
               this.node.get('owner_user_id') ||
               this.node.get('owner_id'));

      if (owner && owner instanceof Object) {
        ret.data[ownerField] = owner.id;
        ret.options.fields[ownerField].type = 'otcs_user';
        ret.options.fields[ownerField].type_control = {
          name: isOwnerExists ? lang.NoOwner : base.formatMemberName(owner)
        };
        ret.options.fields[ownerField].placeholder = lang.alpacaPlaceholderNotAvailable;
      }
    },

    _addCreatorInfo: function (ret, options) {
      if (!ret.options.fields.create_user_id) {
        return;
      }
      var creator = this.node.get('create_user_id_expand') ||
                    this.node.get('create_user_id');
      if (creator && creator instanceof Object) {
        ret.data.create_user_id = creator.id;
        ret.options.fields.create_user_id.type = 'otcs_user';
        ret.options.fields.create_user_id.type_control = {
          name: base.formatMemberName(creator)
        };
        ret.options.fields.create_user_id.placeholder = lang.alpacaPlaceholderNotAvailable;
      }
    },

    _addMimeTypeInfo: function (ret, options) {
      var type = this.options.node.get('type');
      var node = this.options.node;

      _.extend(ret.data, {
        mime_type: NodeSpriteCollection.findTypeByNode(node)
      });

      _.extend(ret.options.fields, {
        mime_type: {
          hidden: false,
          readonly: true,
          label: lang.formFieldTypeLabel,
          placeholder: lang.alpacaPlaceholderNotAvailable,
          type: "text"
        }
      });

      _.extend(ret.schema.properties, {
        mime_type: {
          hidden: false,
          readonly: true,
          title: lang.formFieldTypeLabel,
          type: "string"
        }
      });
    },

    // will retrieve corr. className of MimeType
    _addMimeTypeClassNameInfo: function (ret, options) {
      var type = this.options.node.get('type');
      var node = this.options.node;
      _.extend(ret.data, {
        mimeTypeClassName: NodeSpriteCollection.findClassByNode(node)
      });
    },

    _ensurePlaceholder: function (ret, options) {
      // ensure Description placeholder
      if (ret.options.fields.description) {
        var desc = ret.options.fields.description;
        if (desc.placeholder === undefined || desc.placeholder.length === 0) {
          desc.placeholder = lang.alpacaPlaceholderDescription;
        }
      }
    },

    _addReserveInfo: function (ret, options) {
      var refNode =
              _.extend(ret.data, {
                reserve_info: ((!!this.options.node.get('reserved')) ? this : undefined)
              });

      _.extend(ret.options.fields, {
        reserve_info: {
          hidden: false,
          readonly: true,
          label: lang.formFieldReservedByLabel,
          type: "otcs_reserve_button"
        }
      });

      _.extend(ret.schema.properties, {
        reserve_info: {
          hidden: false,
          readonly: true,
          type: "otcs_reserve_button"
        }
      });
    },

    _addSystemAttributes: function (ret, options) {
      var formdata = this.options.node.systemattributes,
          self = this;
      if (formdata !== undefined) {
        Object
            .keys(formdata.data)
            .forEach(function (data) {
              ret.data[data] = formdata.data[data];
              ret.options.fields[data] = formdata.options.fields[data];
              ret.schema.properties[data] = formdata.schema.properties[data];
            });
        if ( ret.data.metadata_token !== undefined && ret.data.metadata_token.length > 0) {
          self.options.node.state.set('metadata_token', ret.data.metadata_token);
        }
      }
    }
  };

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, prototypeExt);
    }
  };

  return ServerAdaptorMixin;
});

csui.define('csui/widgets/metadata/general.panels/node/node.general.form.model',[
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/models/form',
  'csui/models/mixins/node.resource/node.resource.mixin',
  'csui/widgets/metadata/general.panels/node/server.adaptor.mixin',
  'i18n!csui/widgets/metadata/impl/nls/lang'
], function ($, _, FormModel, NodeResourceMixin, ServerAdaptorMixin,
    lang) {
  'use strict';

  var NodeGeneralFormModel = FormModel.extend({
    defaults: {
      id: 'general'
    },

    constructor: function NodeGeneralFormModel(attributes, options) {
      FormModel.prototype.constructor.apply(this, arguments);

      this.makeNodeResource(options)
          .makeServerAdaptor(options);
    }
  });

  NodeResourceMixin.mixin(NodeGeneralFormModel.prototype);
  ServerAdaptorMixin.mixin(NodeGeneralFormModel.prototype);

  return NodeGeneralFormModel;
});

csui.define('csui/widgets/metadata/general.panels/document/document.general.form.model',['csui/lib/underscore', 'csui/utils/base',
  'csui/controls/table/cells/size/size.view',
  'csui/widgets/metadata/general.panels/node/node.general.form.model',
  'i18n!csui/widgets/metadata/impl/nls/lang'
], function (_, base, SizeView, NodeGeneralFormModel, lang) {
  'use strict';

  var DocumentGeneralFormModel = NodeGeneralFormModel.extend({

    constructor: function DocumentGeneralFormModel(attributes, options) {
      NodeGeneralFormModel.prototype.constructor.apply(this, arguments);
    },

    parse: function (response, options) {
      var form = NodeGeneralFormModel.prototype.parse.apply(this, arguments);

      this._addSizeInfo(form, options);

      return form;
    },

    _addSizeInfo: function (ret, options) {
      var type        = this.options.node.get('type'),
          val         = this.options.node.has('size'),
          column_name = (val ? '' : 'file_') + 'size';
      this.sizeView = new SizeView({
        model: this.options.node,
        column: {name: column_name}
      });

      var sizeVal = this.sizeView.getValueData().formattedValue,
          refNode =
              _.extend(ret.data, {
                size: !!sizeVal ? sizeVal :
                      base.getReadableFileSizeString(this.options.node.get('size'))

              });


      _.extend(ret.options.fields, {
        size: {
          hidden: false,
          readonly: true,
          label: lang.formFieldSizeLabel,
          placeholder: lang.alpacaPlaceholderNotAvailable,
          type: "text"
        }
      });

      _.extend(ret.schema.properties, {
        size: {
          hidden: false,
          readonly: true,
          title: lang.formFieldSizeLabel,
          type: "string",
          tooltip: this.sizeView.getValueData().value
        }
      });
    }

  });

  return DocumentGeneralFormModel;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/general.panels/node/impl/node.general.form',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"binf-row\">\r\n  {{#if options.label}}\r\n  <div class=\"binf-col-md-12 alpaca-container-label\">\r\n    <h4>{{options.label}}</h4>\r\n  </div>\r\n  {{/if}}\r\n  <div class=\"metadata-pane-container\">\r\n    <div class=\"metadata-pane-left binf-col-md-6  cs-form-doublecolumn cs-form-leftcolumn\">\r\n      {{#if options.showitemId}}\r\n      <div class=\"owner_section general-information\"></div>\r\n      {{/if}}\r\n      <div class=\"typename_section general-information\"></div>\r\n      {{#if options.showSize}}\r\n      <div class=\"size_section general-information\"></div>\r\n      {{/if}}\r\n      <div class=\"systemattributes_section general-information\"></div>\r\n      <div class=\"reserve_info general-information\"></div>\r\n      <div class=\"csui-extra-general-fields\"></div>\r\n      <div class=\"csui-action-fields\"></div>\r\n    </div>\r\n    <div class=\"metadata-pane-right binf-col-md-6 cs-form-doublecolumn cs-form-rightcolumn\">\r\n      <div class=\"metadata-tab\">\r\n        {{#if options.showThumbnail}}\r\n        <div class=\"thumbnail_section metadata-preview preview-section\" title=\"{{options.title}}\">\r\n          <span class=\"default_thumbnail thumbnail_empty\" data-cstabindex=\"0\" role=\"button\"\r\n                aria-label=\"{{options.aria_label}}\"></span>\r\n        </div>\r\n        {{/if}}\r\n        <div class=\"description_section general-information\"></div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_metadata_general.panels_node_impl_node.general.form', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/general.panels/node/impl/node.general.form',[],function(){});
csui.define('csui/widgets/metadata/general.panels/node/node.general.form.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/controls/form/form.view',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/widgets/metadata/general.form.fields/general.form.field.behavior',
  'csui/widgets/metadata/general.action.fields/general.action.field.behavior',
  'csui/models/version',
  'csui/controls/globalmessage/globalmessage',
  'csui/models/appliedcategories/systemattributes.model',
  'hbs!csui/widgets/metadata/general.panels/node/impl/node.general.form',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'csui/utils/base',
  'i18n',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/commands', 'csui/utils/commands/versions', 'csui/utils/url',
  'css!csui/widgets/metadata/general.panels/node/impl/node.general.form'
], function (_, $, Backbone, FormView, DefaultActionBehavior,
    GeneralFormFieldBehavior, GeneralActionFieldBehavior, VersionModel,
    GlobalMessage, SystemAttributesModel, formTemplate, lang, base, i18n, NextNodeModelFactory, commands,
    versionCommands, Url) {
  'use strict';

  var NodeGeneralFormView = FormView.extend({
    behaviors: {
      defaultAction: {
        behaviorClass: DefaultActionBehavior
      },
      generalFormFields: {
        behaviorClass: GeneralFormFieldBehavior,
        fieldParent: '.csui-extra-general-fields',
        fieldDescriptors: function () {
          return this.options.generalFormFieldDescriptors;
        },
        fieldViewOptions: function () {
          return {
            context: this.options.context,
            node: this.node,
            mode: this.options.mode,
            originatingView: this,
            metadataView: this.options.metadataView
          };
        }
      },
      generalActionFields: {
        behaviorClass: GeneralActionFieldBehavior,
        fieldParent: '.csui-action-fields',
        fieldDescriptors: function () {
          return this.options.generalActionFieldDescriptors;
        },
        fieldViewOptions: function () {
          return {
            context: this.options.context,
            node: this.node,
            mode: this.options.mode,
            originatingView: this,
            metadataView: this.options.metadataView
          };
        }
      }
    },

    className: 'cs-form csui-general-form',

    // Default field set that needs to be refreshed while modifying any field in general form.
    // it can be extended if a particular module need to update more field.
    fieldToRefresh: ['modify_date', 'reserve_info'],

    constructor: function NodeGeneralFormView(options) {
      FormView.prototype.constructor.call(this, options);
      this.node = this.options.node;
      // extend fieldToRefresh from options.
      this.fieldToRefresh = _.union(this.fieldToRefresh, (options.fieldToRefresh || []));
      this.listenTo(this, 'change:field', this._saveField);
      this.listenTo(this.node, 'change', _.bind(function () {
        if (this.mode !== "create") {
          this.model.fetch();
        }

        // The model event is no longer triggered. If a single form field
        // is re-rendered, needs to let metadata keyboard navigation know
        // to refresh the list of tabable elements.
        var event = $.Event('tab:content:field:changed');
        this.$el.trigger(event);
      }, this));
      this.listenTo(this, 'before:destroy', this._stopListeningToThumbnailClick);
      this.listenTo(this, 'update:scrollbar', this.updateScrollbar);
      var action = this.defaultActionController.getAction(this.options.node);
      if (!action) {
        this.noDefaultActionExist = true;
      }
      this.mlDataAvailable = base.getMetadataLanguageInfo().enabled;
    },

    formTemplate: formTemplate,

    onRequestProcessing: function (view) {
      this.propagatedView = view;
    },

    updateScrollbar: function () {
      this.$el.closest('.binf-tab-content').scrollTop(0);
    },

    formTemplateHelpers: function () {
      var type_name = this.node.get('type_name'),
          node_name = this.node.get('name');
      return {
        showThumbnail: this.mode !== 'create',
        showitemId: this.model.get('data').itemId !== null && this.model.get('data').itemId !== undefined
                      && this.model.get('data').itemId !== "",
        showSize: (this.model.get('data').size && this.model.get('data').size !== "") ||
          (this.model.get('data').size_formatted && this.model.get('data').size_formatted !== ""),
        reserved: this.node.get('reserved'),
        title: this.noDefaultActionExist ? "" : _.str.sformat(lang.openDoc, type_name),

        showShortcutSection: !(this.options.metadataView.options.model.original && (this.options.metadataView.options.model.original.get('type') === undefined || this.options.metadataView.options.model.original.get('type') < 0) || !this.options.metadataView.options.model.get('original_id')),
        aria_label: this.noDefaultActionExist ? "" :
          _.str.sformat(lang.openDocAria, type_name, node_name)
      };
    },

    _getLayout: function () {
      if (this.alpaca.options.fields.description) {
        this.alpaca.options.fields.description.isTextareaAutoHeight = true;
        if (this.mlDataAvailable) {
          this.alpaca.options.fields.description.type = 'otcs_multilingual_textarea';
          this.alpaca.options.fields.description.keyAttribute = 'description_multilingual';
        }
      }
      var template = this.getOption('formTemplate'),
          html = template.call(this, {
            data: this.alpaca.data,
            mode: this.mode
          }),
          bindings = this._getBindings(),
          view = {
            parent: 'bootstrap-csui',
            layout: {
              template: html,
              bindings: bindings
            }
          };
      return view;
    },

    _getBindings: function () {
      var bindings = {
        name: 'name_section',
        create_date: '.owner_section',
        create_user_id: '.owner_section',
        modify_date: '.owner_section',
        owner_user_id: '.owner_section',
        mime_type: '.typename_section',
        description: '.description_section',
        itemId: '.owner_section',
        size: '.size_section'
      };
      // adding 'reserve_info' only for supported object types.
      if (this.node.get("reserved")) {
        bindings = _.extend(bindings, {
          reserve_info: ".reserve_info"
        });
      }
      // adding 'systemattributes' only for supported object types.
      if (this.node.systemattributes) {
        var formdata = this.node.systemattributes;
        Object
            .keys(formdata.data)
            .forEach(function (data) {
              bindings[data] = ".systemattributes_section";
            });
      }
      // for version, extend the bindings because the v1 and v2 keys are slightly different
      // To support wiki and document Versions
      if (this.node instanceof VersionModel) {
        bindings = _.extend(bindings, {
          version_number_name: ".owner_section",
          owner_id: ".owner_section"
        });
      }
      return bindings;
    },

    _saveField: function (args) {
      // This view is shared for both creation and editing scenarios.
      // Do not save immediately in the creation mode.  The creation dialog
      // has a button to get all field values and perform the action.
      if (this.mode === 'create') {
        return;
      }

      var field = args.targetField,
          changes = {},

          defaultLocale = base.getMetadataLanguageInfo().defaultLanguage;
      changes[field.name] = this.mlDataAvailable && _.isObject(field.value) ?
                            field.value[defaultLocale] : field.value;
      if (args && args.fieldView && args.fieldView.mlDataChanged && args.fieldView.alpacaField
          && args.fieldView.alpacaField.type === 'otcs_multilingual_textarea') {
        var key = args.fieldView.keyAttribute,
            mlData = args.model && args.model.node &&
                     args.model.node.get(key);
        key && (changes[key] = mlData);
      }
      this._saveChanges(changes);
    },

    _saveChanges: function (changes) {
      var MN = '{0}:_saveGeneralChanges {1} {2}';
      var node = this.model.options.node,
          self = this,
          isThumbnailView = self.options.metadataView &&
                            self.options.metadataView.thumbnailViewState,
          isSystemAttributeFields = this._checkSystemAttributeFields(changes),
          fieldsUpdated = isSystemAttributeFields ?
                          this._systemAttributesSave(changes, node) :
                          this._nodesave(changes, node, isThumbnailView);
      this.isDataUpdating = true;
      fieldsUpdated.then(function () {
        if (isSystemAttributeFields) {
          var attr = node.systemattributes,
              changefield = _.toArray(Object.keys(changes));
          attr.data[changefield[0]] = self.changes[changefield[0]];
        }
        return node.fetch();
      }).fail(function (jqxhr) {
        var preValues = self.model.get('data');
        // Reset form data and refresh fields
        self.form.children.forEach(function (formField) {
          formField.setValue(preValues[formField.propertyId]);
          formField.refresh();
        });
        var error = new base.Error(jqxhr);
        GlobalMessage.showMessage('error', error.message);
        self.trigger('forms:error');
        if (self.alpaca.options.fields.description &&
            self.alpaca.options.fields.description.isTextareaAutoHeight) {
          self.trigger('update:scrollbar');
        }
      })
          .always(_.bind(function () {
            this.isDataUpdating = false;
            //Unblocking the metadataView
            this.options.metadataView && this.options.metadataView.unblockActions && 
              this.options.metadataView.unblockActions();
            //Trigerring the event to proceed further actions if there is any
            this.trigger("request:completed", this.propagatedView);
            this._unblockActions();
          }, this));
    },

    updateRenderedForm: function (options) {
      this.updateReserveFieldDisplay();
      FormView.prototype.updateRenderedForm.apply(this, arguments);

      this._showDefaultImage();
      this._listenToThumbnailClick();
      // default action
      this.$('.thumbnail_section')
          .on("focusin", function (event) {
            base.checkAndScrollElemToViewport(event.currentTarget);
          });

      // Let render:form triggered once all extra fields were rendered
      var generalFormFieldDescriptors = this.options.generalFormFieldDescriptors;
      if (generalFormFieldDescriptors && generalFormFieldDescriptors.length) {
        this.listenToOnce(this, 'render:general:form:fields', options.async());
      }
    },

    setFocus: function () {
      //this.form.trigger('focus');
      var nonReadOnlyFields = this.$form.find('.alpaca-field:not(.alpaca-readonly) button');
      if (nonReadOnlyFields.length > 0) {
        nonReadOnlyFields.first().trigger('focus');
      }
    },

    updateForm: function () {
      if (!!this.node.isReservedClicked || !!this.node.isUnreservedClicked) {
        // only render when reserve or unreserve action is preformed.
        this.render();
        this.node.isReservedClicked = false;
        this.node.isUnreservedClicked = false;
      }
      var alpacaForm = this.$el.alpaca('get'),
          requiredSwitch = !!this.node.collection && !!this.node.collection.requireSwitched;
      if (!!alpacaForm) {
        var data = this.model.get('data');
        for (var i = 0; i < this.fieldToRefresh.length; i++) {
          var field = alpacaForm.childrenByPropertyId[this.fieldToRefresh[i]],
              value = data[this.fieldToRefresh[i]];
          if (!!field && field.getValue() !== value && !requiredSwitch) {
            field.setValue(value);
            field.refresh();
          }
        }
      }
      if (!this.thumbnail || (!this.thumbnail.imgUrl && (!this.thumbnail.node || !this.thumbnail.node.get('csuiThumbnailImageUrl')))) {
        this._showDefaultImage();
      }
      this.updateReserveFieldDisplay();
      return this;
    },

    updateReserveFieldDisplay: function () {
      var reserveInfoElem = this.$el.find(".reserve_info");
      if (!!this.node.get('reserved')) {
        if (reserveInfoElem.hasClass("binf-hidden")) {
          reserveInfoElem.removeClass("binf-hidden");
        }
      } else {
        if (!reserveInfoElem.hasClass("binf-hidden")) {
          reserveInfoElem.addClass("binf-hidden");
        }
      }
    },

    _showDefaultImage: function () {
      // show thumbnail missing svg and hide img tag
      var defaultThumbnailEl = this.$el.find('.default_thumbnail'),
          className = 'thumbnail_missing';
      //checking model is available or not
      if (!!this.options && !!(this.options.model.get('data'))) {
        className = this.options.model.get('data').mimeTypeClassName;
      }
      defaultThumbnailEl.addClass(className);
      defaultThumbnailEl.removeClass('thumbnail_empty');
      // event for keyboard navigation
      var event = $.Event('tab:content:render');
      this.$el.trigger(event);
      if (!!this.noDefaultActionExist) {
        this.$el.find('.default_thumbnail').addClass('thumbnail_disabled');
      }
    },

    _listenToThumbnailClick: function () {
      this._stopListeningToThumbnailClick();
      this._thumbnailClickHandler = _.bind(this._handleThumbnailClick, this);
      this.$('.thumbnail_section')
          .on('click', this._thumbnailClickHandler);
    },

    _stopListeningToThumbnailClick: function () {
      if (this._thumbnailClickHandler) {
        this.$('.thumbnail_section')
            .off('click', this._thumbnailClickHandler);
        this._thumbnailClickHandler = undefined;
      }
    },

    _handleThumbnailClick: function () {
      var context = this.options.context;
      var node = this.options.node;
      var status = {nodes: new Backbone.Collection([node])};
      var options = {
        context: context,
        originatingView: this
      };
      var command;

      // TODO: Move this to the version-specific view.
      if (node instanceof VersionModel) {
        command = versionCommands.get('VersionOpen');
        return command.execute(status, options);
      }

      // TODO: Move this to the document-specific view.
      command = commands.get('Open');
      if (command.enabled(status, options)) {
        return command.execute(status, options);
      }

      // TODO: Remove this code. It breaks encapsulation of this component. It
      // accesses a private method. Metadata should listen to events instead.
      var nextNode = this.options.context.getModel(NextNodeModelFactory);
      if (node.get("container") && node.get('id') ===
          nextNode.get("id")) {
        if (this.options.metadataView) {
          this.options.metadataView._closeMetadata();
        }
        return;
      }

      this.triggerMethod('execute:DefaultAction', node);
    },

    _checkSystemAttributeFields: function (changes) {
      var formdata = this.node && this.node.systemattributes,
          fields = formdata && formdata.options && formdata.options.fields,
          systemattributefields = fields && _.toArray(Object.keys(fields)),
          changefield = _.toArray(Object.keys(changes));
      return _.contains(systemattributefields, changefield[0]);
    },

    _nodesave: function (changes, node, isThumbnailView) {
      return node.save(changes, {
        wait: true,
        silent: isThumbnailView,
        patch: true
      });
    },

    _systemAttributesSave: function (changes, node) {
      var deferred = $.Deferred(),
          connector = node.connector,
          self = this;
      self.changes = changes;
      var systemAttributesModel = new SystemAttributesModel({}, {
        connector: this.node.connector,
        node: this.node,
        id: node.get('id')
      });
      return systemAttributesModel.save(changes, {
        type: 'PUT',
        processData: false,
        contentType: false
      });
    }
  });

  return NodeGeneralFormView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/general.panels/document/impl/document.general.form',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"binf-row\">\r\n  {{#if options.label}}\r\n  <div class=\"binf-col-md-12 alpaca-container-label\">\r\n    <h4>{{options.label}}</h4>\r\n  </div>\r\n  {{/if}}\r\n  <div class=\"metadata-pane-container\">\r\n\r\n    <div class=\"metadata-pane-left binf-col-md-6  cs-form-doublecolumn cs-form-leftcolumn\">\r\n      {{#if options.showitemId}}\r\n      <div class=\"owner_section general-information\"></div>\r\n      {{/if}}\r\n      <div class=\"typename_section general-information\"></div>\r\n      {{#if options.showSize}}\r\n      <div class=\"size_section general-information\"></div>\r\n      {{/if}}\r\n      <div class=\"systemattributes_section general-information\"></div>\r\n      <div class=\"reserve_info general-information\"></div>\r\n      <div class=\"csui-extra-general-fields\"></div>\r\n    </div>\r\n    <div class=\"metadata-pane-right binf-col-md-6 cs-form-doublecolumn cs-form-rightcolumn\">\r\n      <div class=\"metadata-tab\">\r\n        {{#if options.showThumbnail}}\r\n        <div class=\"thumbnail_section metadata-preview preview-section\" title=\"{{options.title}}\">\r\n          <span class=\"thumbnail_not_loaded thumbnail_empty\" data-cstabindex=\"0\" role=\"button\"\r\n                aria-label=\"{{options.aria_label}}\"></span>\r\n          <img src=\"{{options.imgSrc}}\" class=\"img-doc-preview binf-hidden\"\r\n               alt=\"{{options.imgAlt}}\">\r\n        </div>\r\n        {{/if}}\r\n        <div class=\"description_section general-information\"></div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_metadata_general.panels_document_impl_document.general.form', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/general.panels/document/impl/document.general.form',[],function(){});
csui.define('csui/widgets/metadata/general.panels/document/document.general.form.view',['csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/thumbnail/thumbnail.object',
  'csui/widgets/metadata/general.panels/node/node.general.form.view',
  'hbs!csui/widgets/metadata/general.panels/document/impl/document.general.form',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'css!csui/widgets/metadata/general.panels/document/impl/document.general.form'
], function (_, $, Thumbnail, NodeGeneralFormView, formTemplate, lang) {
  'use strict';

  var DocumentGeneralFormView = NodeGeneralFormView.extend({

    constructor: function DocumentGeneralFormView(options) {
      NodeGeneralFormView.prototype.constructor.call(this, options);

      this.thumbnail = this.options.thumbnail || new Thumbnail({
            node: this.options.node
          });
      this.listenTo(this.thumbnail, 'loadUrl', this._showImage)
          .listenTo(this.thumbnail, 'error', this._showDefaultImage)
          .listenTo(this, 'destroy', function () {
            this.thumbnail.destroy();
          });
    },

    formTemplate: formTemplate,
    fieldToRefresh: ['modify_date', 'reserve_info', 'mime_type', 'size'],
    formTemplateHelpers: function () {
      var type_name = this.node.get('type_name'),
          doc_name  = this.node.get('name');
      return {
        showThumbnail: this.mode !== 'create',
        title: _.str.sformat(lang.openDoc, type_name),
        showitemId: this.model.get('data').itemId !== null && this.model.get('data').itemId !== undefined
                      && this.model.get('data').itemId !== "",
        showSize: (this.model.get('data').size && this.model.get('data').size !== "") ||
          (this.model.get('data').size_formatted && this.model.get('data').size_formatted !== ""),
        aria_label: _.str.sformat(lang.openDocAria, type_name, doc_name),
        reserved: this.node.get('reserved'),
        // a 1x1 transparent gif, to avoid an empty src tag
        imgSrc: "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=",
        imgAlt: lang.docPreviewAlt
      };
    },

    _getBindings: function () {
      var bindings = NodeGeneralFormView.prototype._getBindings.apply(this, arguments);
      return _.extend(bindings, {
        size: ".size_section"
      });
    },

    updateRenderedForm: function (options) {
      NodeGeneralFormView.prototype.updateRenderedForm.apply(this, arguments);
      if (this.mode !== 'create') {
        var self = this;
        //Just show image if url is available,otherwise load thumbnail
        if (this.thumbnail.imgUrl || this.thumbnail.node.get('csuiThumbnailImageUrl')) {
          this._showImage();
        } else {
          this.thumbnail.loadUrl();
        }
      }
    },

    _showImage: function () {
      var self                 = this,
          img                  = this.$el.find('.img-doc-preview'),
          thumbnailNotLoadedEl = this.$el.find('.thumbnail_not_loaded');
      img.attr("src", this.thumbnail.imgUrl || this.thumbnail.node.get('csuiThumbnailImageUrl'));
      img.prop('tabindex', '0');
      img.one('load', function (evt) {

        if (evt.target.clientHeight >= evt.target.clientWidth) {
          img.addClass('cs-form-img-vertical');
        } else {
          img.addClass('cs-form-img-horizontal');
        }
        img.addClass('cs-form-img-border');
        //hide the thumbnail background span and show the real img
        thumbnailNotLoadedEl.addClass('binf-hidden');
        img.removeClass('binf-hidden');

        // event for keyboard navigation
        var event = $.Event('tab:content:render');
        self.$el.trigger(event);
      });
    },

    _showDefaultImage: function () {
      // show thumbnail missing svg and hide img tag
      var img                  = this.$el.find('.img-doc-preview'),
          thumbnailNotLoadedEl = this.$el.find('.thumbnail_not_loaded'),
          className            = 'thumbnail_missing';
      //checking model is available or not
      if (!!this.options && !!(this.options.model.get('data'))) {
        className = this.options.model.get('data').mimeTypeClassName;
      }
      // remove the old mime-type class , then update with new one.
      !!thumbnailNotLoadedEl.prop("className") &&
      thumbnailNotLoadedEl.prop("className").split(' ').forEach(_.bind(function (str) {
        if (str.indexOf('mime') === 0) {
          thumbnailNotLoadedEl.removeClass(str);
        }
      }, thumbnailNotLoadedEl));

      thumbnailNotLoadedEl.addClass(className);
      thumbnailNotLoadedEl.removeClass('thumbnail_empty');
      thumbnailNotLoadedEl.removeClass('csui-icon-notification-error');
      thumbnailNotLoadedEl.removeClass('binf-hidden');
      img.addClass('binf-hidden');

      // event for keyboard navigation
      var event = $.Event('tab:content:render');
      this.$el.trigger(event);
    }
  });

  return DocumentGeneralFormView;

});

csui.define('csui/widgets/metadata/general.panels/shortcut/shortcut.general.form.model',[
  'csui/lib/underscore',
  'csui/widgets/metadata/general.panels/node/node.general.form.model',
  'csui/models/specificnodemodel',
  'csui/models/mixins/syncable.from.multiple.sources/syncable.from.multiple.sources.mixin'
], function (_, NodeGeneralFormModel, SpecificNodeModel, SyncableMixin) {
  'use strict';

  var ShortcutGeneralFormModel = NodeGeneralFormModel.extend({

    constructor: function ShortcutGeneralFormModel(attributes, options) {
      NodeGeneralFormModel.prototype.constructor.apply(this, arguments);
      this.makeSyncableFromMultipleSources(options);
    },

    _mergeSources: function (specificNodeModel, nodeGeneralFormModel) {
      var specProperties    = specificNodeModel[0].forms[0], // for specific node propertie
          generalProperties = nodeGeneralFormModel[0].forms[0]; // for general node properties

      _.extend(generalProperties.data, specProperties.data);
      _.extend(generalProperties.options.fields, specProperties.options.fields);
      _.extend(generalProperties.schema.properties, specProperties.schema.properties);

      generalProperties.options = _.omit(generalProperties.options, 'form');

      this.set(generalProperties);  // fused properties
    },

    sync: function () {
      var specNodeModel        = new SpecificNodeModel(this.node.attributes, {
            connector: this.connector,
            node: this.node,
            context: this.options.context
          }),
          nodeGeneralModel     = new NodeGeneralFormModel(this.node.attributes, {
            connector: this.connector,
            node: this.options.node,
            context: this.options.context
          }),
          specificModelPromise = specNodeModel.fetch(),
          generalModelPromise  = nodeGeneralModel.fetch(),
          options              = {parse: false};
      return this.syncFromMultipleSources(
          [specificModelPromise, generalModelPromise], this._mergeSources, options);
    }
  });
  SyncableMixin.mixin(ShortcutGeneralFormModel.prototype);
  return ShortcutGeneralFormModel;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/general.panels/shortcut/impl/shortcut.general.form',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"binf-row\">\r\n  {{#if options.label}}\r\n  <div class=\"binf-col-md-12 alpaca-container-label\">\r\n    <h4>{{options.label}}</h4>\r\n  </div>\r\n  {{/if}}\r\n  <div class=\"metadata-pane-container\">\r\n    <div class=\"metadata-pane-left binf-col-md-6  cs-form-doublecolumn\r\n    cs-form-leftcolumn\">\r\n      {{#if options.showitemId}}\r\n      <div class=\"owner_section general-information\"></div>\r\n      {{/if}}\r\n      <div class=\"typename_section general-information\"></div>\r\n      <div class=\"systemattributes_section general-information\"></div>\r\n      <div class=\"csui-extra-general-fields\"></div>\r\n    </div>\r\n    <div class=\"metadata-pane-right binf-col-md-6 cs-form-doublecolumn cs-form-rightcolumn\">\r\n      <div class=\"metadata-tab\">\r\n        {{#if options.showThumbnail}}\r\n        <div class=\"thumbnail_section metadata-preview preview-section\" title=\"{{options.title}}\">\r\n          <span class=\"default_thumbnail thumbnail_empty\" data-cstabindex=\"0\" role=\"button\"\r\n                aria-label=\"{{options.title}}\"></span>\r\n        </div>\r\n        {{/if}}\r\n        {{#if options.showShortcutSection}}\r\n        <div class=\"shortcut_section general-information\"></div>\r\n        {{/if}}\r\n        <div class=\"description_section general-information\"></div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_metadata_general.panels_shortcut_impl_shortcut.general.form', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/general.panels/shortcut/impl/shortcut.general.form',[],function(){});
csui.define('csui/widgets/metadata/general.panels/shortcut/shortcut.general.form.view',['csui/lib/underscore',
  'csui/widgets/metadata/general.panels/node/node.general.form.view',
  'csui/utils/contexts/factories/node',
  'hbs!csui/widgets/metadata/general.panels/shortcut/impl/shortcut.general.form',
  'css!csui/widgets/metadata/general.panels/shortcut/impl/shortcut.general.form'
], function (_, NodeGeneralFormView, NodeModelFactory, formTemplate) {
  'use strict';

  var ShortcutGeneralFormView = NodeGeneralFormView.extend({

    constructor: function ShortcutGeneralFormView(options) {
      NodeGeneralFormView.prototype.constructor.call(this, options);

      // share the original node for deeper form fields code
      if (options.context && options.node && options.node.original &&
          options.node.original.get('id') > 0) {
        // Create the node model or do nothing if it exists
        options.context.getModel(NodeModelFactory, {
          // Add unique id to the propertyPrefix for this object
          attributes: {id: options.node.original.get('id')},
          // Pass the property value using the propertyPrefix of the factory
          node: options.node.original,
          // Discard the model during context change to prevent its re-fetch 
          temporary: true
        });
      }
    },

    formTemplate: formTemplate,

    _getBindings: function () {
      var bindings = NodeGeneralFormView.prototype._getBindings.apply(this, arguments);
      return _.extend(bindings, {
        original_id: '.shortcut_section'
      });
    }

  });

  return ShortcutGeneralFormView;

});

csui.define('csui/widgets/metadata/general.panels/url/url.general.form.model',['csui/lib/jquery', 'csui/lib/underscore',
  'csui/widgets/metadata/general.panels/node/node.general.form.model',
  'csui/models/specificnodemodel',
  'csui/models/mixins/syncable.from.multiple.sources/syncable.from.multiple.sources.mixin',
  'i18n!csui/widgets/metadata/impl/nls/lang'
], function ($, _, NodeGeneralFormModel, SpecificNodeModel, SyncableMixin, lang) {
  'use strict';

  var UrlGeneralFormModel = NodeGeneralFormModel.extend({

    constructor: function UrlGeneralFormModel(attributes, options) {
      NodeGeneralFormModel.prototype.constructor.apply(this, arguments);
      this.makeSyncableFromMultipleSources(options);
    },

    _mergeSources: function (specificNodeModel, nodeGeneralFormModel) {
      var specProperties    = specificNodeModel[0].forms[0], // for specific node propertie
          generalProperties = nodeGeneralFormModel[0].forms[0]; // for general node properties

      _.extend(generalProperties.data, specProperties.data);
      _.extend(generalProperties.options.fields, specProperties.options.fields);
      _.extend(generalProperties.schema.properties, specProperties.schema.properties);

      generalProperties.options = _.omit(generalProperties.options, 'form');

      this.set(generalProperties);  // fused properties
    },

    sync: function () {
      var specNodeModel        = new SpecificNodeModel(this.node.attributes, {
            connector: this.connector,
            node: this.node,
            context: this.options.context
          }),
          nodeGeneralModel     = new NodeGeneralFormModel(this.node.attributes, {
            connector: this.connector,
            node: this.options.node,
            context: this.options.context
          }),
          specificModelPromise = specNodeModel.fetch(),
          generalModelPromise  = nodeGeneralModel.fetch(),
          options              = {parse: false};
      return this.syncFromMultipleSources(
          [specificModelPromise, generalModelPromise], this._mergeSources, options);
    }
  });

  SyncableMixin.mixin(UrlGeneralFormModel.prototype);
  return UrlGeneralFormModel;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/general.panels/url/impl/url.general.form',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"binf-row\">\r\n  {{#if options.label}}\r\n  <div class=\"binf-col-md-12 alpaca-container-label\">\r\n    <h4>{{options.label}}</h4>\r\n  </div>\r\n  {{/if}}\r\n  <div class=\"metadata-pane-container\">\r\n    <div class=\"metadata-pane-left binf-col-md-6  cs-form-doublecolumn\r\n    cs-form-leftcolumn\">\r\n      {{#if options.showitemId}}\r\n      <div class=\"owner_section general-information\"></div>\r\n      {{/if}}\r\n      <div class=\"typename_section general-information\"></div>\r\n      <div class=\"systemattributes_section general-information\"></div>\r\n      <div class=\"csui-extra-general-fields\"></div>\r\n    </div>\r\n    <div class=\"metadata-pane-right binf-col-md-6 cs-form-doublecolumn cs-form-rightcolumn\">\r\n      <div class=\"metadata-tab\">\r\n        {{#if options.showThumbnail}}\r\n        <div class=\"thumbnail_section metadata-preview preview-section\" title=\"{{options.title}}\">\r\n          <span class=\"default_thumbnail thumbnail_empty\" data-cstabindex=\"0\" role=\"button\"\r\n                aria-label=\"{{options.title}}\"></span>\r\n        </div>\r\n        {{/if}}\r\n        <div class=\"url_section general-information\"></div>\r\n        <div class=\"description_section general-information\"></div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_metadata_general.panels_url_impl_url.general.form', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/general.panels/url/impl/url.general.form',[],function(){});
csui.define('csui/widgets/metadata/general.panels/url/url.general.form.view',['csui/lib/underscore',
  'csui/widgets/metadata/general.panels/node/node.general.form.view',
  'hbs!csui/widgets/metadata/general.panels/url/impl/url.general.form',
  'css!csui/widgets/metadata/general.panels/url/impl/url.general.form'
], function (_, NodeGeneralFormView, formTemplate) {
  'use strict';

  var UrlGeneralFormView = NodeGeneralFormView.extend({

    constructor: function UrlGeneralFormView(options) {
      NodeGeneralFormView.prototype.constructor.call(this, options);
    },

    formTemplate: formTemplate,

    _getBindings: function () {
      var bindings = NodeGeneralFormView.prototype._getBindings.apply(this, arguments);
      return _.extend(bindings, {
        url: ".url_section"
      });
    }

  });

  return UrlGeneralFormView;

});


csui.define('csui/widgets/metadata/metadata.general.panels',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/widgets/metadata/general.panels/document/document.general.form.model',
  'csui/widgets/metadata/general.panels/document/document.general.form.view',
  'csui/widgets/metadata/general.panels/node/node.general.form.model',
  'csui/widgets/metadata/general.panels/node/node.general.form.view',
  'csui/widgets/metadata/general.panels/shortcut/shortcut.general.form.model',
  'csui/widgets/metadata/general.panels/shortcut/shortcut.general.form.view',
  'csui/widgets/metadata/general.panels/url/url.general.form.model',
  'csui/widgets/metadata/general.panels/url/url.general.form.view',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  // Load extra general property panel rules to be added to the built-in ones
  'csui-ext!csui/widgets/metadata/metadata.general.panels'
], function (_, Backbone,
    DocumentGeneralFormModel, DocumentGeneralFormView,
    NodeGeneralFormModel, NodeGeneralFormView,
    ShortcutGeneralFormModel, ShortcutGeneralFormView,
    UrlGeneralFormModel, UrlGeneralFormView,
    RulesMatchingMixin, extraGeneralPanels) {
  'use strict';

  var MetadataGeneralPanelModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      contentModel: null,
      contentView: null,
      contentViewOptions: null
    },

    constructor: function MetadataGeneralPanelModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }

  });

  RulesMatchingMixin.mixin(MetadataGeneralPanelModel.prototype);

  var MetadataGeneralPanelCollection = Backbone.Collection.extend({

    model: MetadataGeneralPanelModel,
    comparator: "sequence",

    constructor: function MetadataGeneralPanelCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByNode: function (node) {
      return this.find(function (item) {
        return item.matchRules(node, item.attributes);
      });
    }

  });

  var generalPanels = new MetadataGeneralPanelCollection([
    {
      // document and Email
      equals: {type: [144, 749]},
      contentModel: DocumentGeneralFormModel,
      contentView: DocumentGeneralFormView,
      sequence: 100
    },
    {
      // shortcut and generation
      equals: {type: [1, 2]},
      contentModel: ShortcutGeneralFormModel,
      contentView: ShortcutGeneralFormView,
      sequence: 100
    },
    {
      // url
      equals: {type: 140},
      contentModel: UrlGeneralFormModel,
      contentView: UrlGeneralFormView,
      sequence: 100
    },
    {
      // default node
      contentModel: NodeGeneralFormModel,
      contentView: NodeGeneralFormView,
      sequence: 10000
    }
  ]);

  if (extraGeneralPanels) {
    generalPanels.add(_.flatten(extraGeneralPanels, true));
  }

  return generalPanels;

});

csui.define('csui/widgets/metadata/property.panels/general/metadata.general.property.controller',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/models/form', 'csui/controls/form/form.view',
  'csui/widgets/metadata/metadata.general.panels'
], function (_, $, Marionette, FormModel, FormView, generalPanels) {
  'use strict';

  var MetadataGeneralPropertyController = Marionette.Controller.extend({

    constructor: function MetadataExternalPropertyController(options) {
      Marionette.Controller.prototype.constructor.apply(this, arguments);
    },

    getPropertyPanels: function (options) {
      var generalForm, generalPanel, formModel, content, 
      formOptions = {
        connector: this.connector,
        node: this.options.model,
        context: this.options.context
      };

      if (options.forms && options.forms.models) {
        generalForm = _.find(options.forms.models, function (model) {
          return model.get("role_name") === undefined; // role_name is undefined for general category
        });
        if(generalForm) {
          formOptions.response = options.forms.models[0].attributes;
          formOptions.parse = true;
        }
      }

      generalPanel = this._getGeneralPanel();
      formModel = new generalPanel.model(generalForm, formOptions);
      content = [{
        model: formModel,
        contentView: generalPanel.contentView,
        contentViewOptions: generalPanel.contentViewOptions
      }];

      if (generalForm) {
        return $.Deferred().resolve(content).promise();
      } else {
        return formModel.fetch().then(function () {
            return content;
          });
      }
    },

    getPropertyPanelsForCreate: function (options) {
      var generalPanel = this._getGeneralPanel(),
          deferred = $.Deferred(),
          formModel = options.forms.findWhere({id: 'general'});
      // The 'v1/forms/nodes/create' always returns the general form.
      // If other collection is used to fetch the pre-filled forms, it
      // has to include some form with the 'general' id too
      if (!formModel) {
        throw new Error('General form missing.');
      }
      formModel = new generalPanel.model(formModel.attributes, {
        connector: this.connector,
        node: this.options.model,
        parse: true
      });
      return deferred
          .resolve([{
            model: formModel,
            contentView: generalPanel.contentView,
            contentViewOptions: generalPanel.contentViewOptions
          }])
          .promise();
    },

    getPropertyPanelsForMove: function (options) {
      return this._getPropertyPanelsForMoveAndCopy(options);
    },

    getPropertyPanelsForCopy: function (options) {
      return this._getPropertyPanelsForMoveAndCopy(options);
    },

    // Add read-only general tab fro move and copy scenarios;
    // useless for the operation, but the user may like to see
    // more information about the copied items and is ready to
    // pay the price for the fetching server call.
    _getPropertyPanelsForMoveAndCopy: function (options) {
      var generalPanel = this._getGeneralPanel(),
          formModel = new generalPanel.model(undefined, {
            connector: this.connector,
            node: this.options.model
          }),
          self = this;
      return formModel
          .fetch()
          .then(function () {
            return [{
              model: formModel,
              contentView: generalPanel.contentView,
              contentViewOptions: generalPanel.contentViewOptions
            }];
          });
    },

    _getGeneralPanel: function () {
      var panel = generalPanels.findByNode(this.options.model);
      return {
        model: panel.get('contentModel') || FormModel,
        contentView: panel.get('contentView') || FormView,
        contentViewOptions: panel.get('contentViewOptions')
      };
    }

  });

  return MetadataGeneralPropertyController;

});


csui.define('csui/widgets/metadata/metadata.property.panels',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/widgets/metadata/property.panels/general/metadata.general.property.controller',
  // Load extra property panels to be added to the built-in tabs
  'csui-ext!csui/widgets/metadata/metadata.property.panels'
], function (_, Backbone, MetadataGeneralPropertyController, extraPropertyPanels) {

  var MetadataPropertyPanelModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      controller: null,
      controllerOptions: null
    },

    constructor: function MetadataPropertyPanelModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var MetadataPropertyPanelCollection = Backbone.Collection.extend({

    model: MetadataPropertyPanelModel,
    comparator: "sequence",

    constructor: function MetadataPropertyPanelCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }

  });

  var metadataPropertyPanels = new MetadataPropertyPanelCollection([
    {
      sequence: 10,
      controller: MetadataGeneralPropertyController
    }
  ]);

  if (extraPropertyPanels) {
    extraPropertyPanels = _.flatten(extraPropertyPanels, true);
    _.each(extraPropertyPanels, function () {
      var sequence = extraPropertyPanels.sequence;
      if (sequence < 10 || sequence > 100) {
        throw new Error('Sequence must be greater or equal to 10 and less or equal to 100.');
      }
    });
    metadataPropertyPanels.add(extraPropertyPanels);
  }

  return metadataPropertyPanels;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/add.properties/add.properties.dropdown.menu',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"binf-dropdown\">\r\n  <button id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"btnId") || (depth0 != null ? lookupProperty(depth0,"btnId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"btnId","hash":{},"loc":{"start":{"line":2,"column":14},"end":{"line":2,"column":23}}}) : helper)))
    + "\" type=\"button\" class=\"binf-btn binf-dropdown-toggle\"\r\n          data-binf-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\"\r\n          aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"addTitleTooltip") || (depth0 != null ? lookupProperty(depth0,"addTitleTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"addTitleTooltip","hash":{},"loc":{"start":{"line":4,"column":22},"end":{"line":4,"column":41}}}) : helper)))
    + "\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"addTitleTooltip") || (depth0 != null ? lookupProperty(depth0,"addTitleTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"addTitleTooltip","hash":{},"loc":{"start":{"line":4,"column":50},"end":{"line":4,"column":69}}}) : helper)))
    + "\">\r\n    <span class=\"csui-button-icon icon-toolbarAdd\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"addTitleTooltip") || (depth0 != null ? lookupProperty(depth0,"addTitleTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"addTitleTooltip","hash":{},"loc":{"start":{"line":5,"column":58},"end":{"line":5,"column":77}}}) : helper)))
    + "\"></span>\r\n  </button>\r\n  <ul class=\"binf-dropdown-menu\" role=\"menu\"></ul>\r\n</div>\r\n<div class=\"csui-loading-parent-wrapper binf-disabled binf-hidden\">\r\n  <span class=\"csui-loading-dots-wrapper\">\r\n    <span class=\"csui-loading-dot\"></span>\r\n    <span class=\"csui-loading-dot\"></span>\r\n    <span class=\"csui-loading-dot\"></span>\r\n  </span>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_add.properties_add.properties.dropdown.menu', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/impl/add.properties/add.properties.dropdown.menu',[],function(){});
csui.define('csui/widgets/metadata/impl/add.properties/add.properties.dropdown.menu.view',[
  'module', "csui/lib/jquery", "csui/lib/underscore", "csui/lib/backbone", "csui/lib/marionette",
  'csui/utils/log', 'csui/controls/toolbar/toolitem.view', 'csui/controls/progressblocker/blocker',
  'csui/models/nodes', 'csui/controls/toolbar/toolitems.filtered.model', 'csui/utils/commands',
  'csui/behaviors/dropdown.menu/dropdown.menu.behavior',
  'hbs!csui/widgets/metadata/impl/add.properties/add.properties.dropdown.menu',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'css!csui/widgets/metadata/impl/add.properties/add.properties.dropdown.menu',
  'csui/lib/binf/js/binf'
], function (module, $, _, Backbone, Marionette, log, ToolItemView, BlockingView,
    NodeCollection, FilteredToolItemsCollection, commands, DropdownMenuBehavior,
    template, lang) {
  'use strict';

  log = log(module.id);

  //
  // This view shows the '+' icon for add properties commands such as 'add categories',
  // 'add classifications', etc.
  // - When there is only one command (for example: just 'add categories'), the '+' is just a
  // command icon that would launch the only only command when the user clicks on it.
  // - When there are two or more commands, the '+' icon is a dropdown menu that shows all the
  // available commands.
  //
  // Params:
  // - suppressAddProperties <boolean> : true to suppress the '+' icon
  //
  var AddPropertiesDropdownMenuView = Marionette.CompositeView.extend({

    className: "metadata-add-properties",

    template: template,
    templateHelpers: function () {
      return {
        btnId: _.uniqueId('addPropertiesButton'),
        addTitleTooltip: (this.collection.length === 1 ?
                          this.collection.at(0).get('name') : lang.addNewProperties)
      };
    },

    childView: ToolItemView,
    childViewContainer: "ul.binf-dropdown-menu",
    childViewOptions: function (model) {
      return {
        noMenuRoles: undefined
      };
    },

    behaviors: {
      DropdownMenuBehavior: {
        behaviorClass: DropdownMenuBehavior
      }
    },

    constructor: function AddPropertiesDropdownMenuView(options) {
      options || (options = {});
      this.context = options.context;
      this.commands = options.commands || commands;
      this.node = options.node;
      this.container = options.container;
      this.formCollection = options.collection;
      this.originalFormCollection = options.formCollection;
      this.listenTo(this.formCollection, "reset", this._updateMenuItems);

      this.originatingView = options.originatingView;
      if (options.blockingParentView) {
        BlockingView.delegate(this, options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }

      var status = {
        nodes: new NodeCollection([options.node]),
        container: options.container,
        formCollection: this.formCollection,
        originalFormCollection: this.originalFormCollection,
        context: options.context
      };

      var toolbarName = 'addPropertiesToolbar';
      var toolItemFactory = options.toolbarItems[toolbarName];
      options.collection = new FilteredToolItemsCollection(
          toolItemFactory, {
            status: status,
            commands: this.commands,
            delayedActions: options.containerCollection &&
                            options.containerCollection.delayedActions,
            mask: options.toolbarItemsMask
          });

      Marionette.CompositeView.prototype.constructor.apply(this, arguments);

      // Passing the el to the ctor prevents creating an own el, including
      // setting its attributes.  The caller must ensure the right tag.
      if (options.el) {
        $(options.el).addClass(_.result(this, "className"));
      }

      this.listenTo(this, "childview:toolitem:action", this._triggerMenuItemAction)
          .listenTo(this.node.actions, 'sync update', this._reRender)
          .listenTo(Backbone, 'closeToggleAction', this._closeToggle);

      if (options.containerCollection && options.containerCollection.delayedActions) {
        this.listenTo(options.containerCollection.delayedActions, 'sync', this._reRender);
      }

      this.listenTo(this.node, 'sync change', function () {
        this.node.set('csuiAddPropertiesActionsRetrieved', false, {silent: true});
      });
    },

    _updateMenuItems: function () {
      this.collection.refilter();
    },

    _reRender: function () {
      // Properties is being destroyed on changing the context node. Both destroyer
      // and a sub-view refreshed are listening on node changes. Although listening
      // is stopped during the destruction, already registered handlers will be
      // triggered nevertheless.
      if (this._isRendered && !this._isRendering && !this.isDestroyed) {
        this._updateMenuItems();
        this.render();
      }
    },

    onRender: function () {
      if (this._isRendering) {
        return;
      }
      this._isRendering = true;
      this._ensureLazyActionsRetrieved().always(_.bind(function () {
        this._isRendering = false;
      }, this)).done(_.bind(function () {
        var dropdownToggleEl = this.$el.find('.binf-dropdown-toggle');
        if (this.collection.length < 1 || this.options.suppressAddProperties === true) {
          // hide the + button if there is no action
          this.$el.addClass('binf-hidden');
          dropdownToggleEl.attr('data-cstabindex', '-1');
        } else {
          // show the view because with the latest code the view now can be hidden by the PUT call
          // event that the node does not have any actions yet until it is re-fetched
          this.$el.find('.binf-dropdown').removeClass('binf-hidden');
          this.$el.removeClass('binf-hidden');
          dropdownToggleEl.attr('data-cstabindex', '0');
          // when there is only one command, set aria-haspopup=false
          if (this.collection.length === 1) {
            var addNewCat = this.collection.at(0).get('name');
            dropdownToggleEl.attr({
              'aria-haspopup': false,
              'aria-label': addNewCat,
              'title': addNewCat
            });
            dropdownToggleEl.find('.icon-toolbarAdd').attr('title', addNewCat);
          }
        }

        if (this.collection.length > 1) {
          // make the dropdown menu when there are more than 1 menu item
          dropdownToggleEl.binf_dropdown();
        }

        this.$el.find('.binf-dropdown').off('click.' + this.cid).on('click.' + this.cid,
            _.bind(this._onClickAddButton, this));
        dropdownToggleEl.off('click.' + this.cid).on('click.' + this.cid,
            _.bind(this._onClickAddButton, this));

        var self = this;
        setTimeout(function () {
          // event for keyboard navigation
          var event = $.Event('tab:content:render');
          self.$el.trigger(event);
        }, 200);

      }, this)).fail(_.bind(function () {
        this.$el.addClass('binf-hidden');
        this.$el.find('.binf-dropdown-toggle').attr('data-cstabindex', '-1');
      }, this));

    },

    _closeToggle: function () {
      if (this.options.suppressAddProperties !== true) {
        var dropdownToggleEl = this.$el.find('.binf-dropdown-toggle');
        if (dropdownToggleEl.parent().hasClass('binf-open')) {
          dropdownToggleEl.binf_dropdown('toggle', false);
        }
      }
    },

    _onClickAddButton: function (event) {
      if (this.collection.length === 1) {
        Backbone.trigger('closeToggleAction');
        event.preventDefault();
        event.stopPropagation();

        // when there is just one command
        this._executeAction(this.collection.at(0));
      }
    },

    _triggerMenuItemAction: function (toolItemView, args) {
      var dropdownToggleEl = this.$el.find('.binf-dropdown-toggle');
      dropdownToggleEl.binf_dropdown('toggle');  // close the dropdown menu before triggering the event

      this._executeAction(args.toolItem);
    },

    _executeAction: function (toolItem) {
      var signature = toolItem.get('signature');
      var command = this.commands.get(signature);

      var executeOptions = {
        action: this.options.action,
        node: this.options.node,
        collection: this.formCollection,
        container: this.options.container,
        inheritance: this.options.inheritance,
        context: this.options.context,
        parentView: this.options.parentView,  // use for blocking view and callback
        addPropertiesCallback: this.options.addPropertiesCallback
      };

      var status = {
        context: this.options.context,
        nodes: new NodeCollection([this.node]),
        container: this.options.container,
        formCollection: this.formCollection,
        originalFormCollection: this.originalFormCollection,
        originatingView: this.originatingView
      };

      try {
        // If the command was not found and the toolitem is executable, it is
        // a developer's mistake.
        if (!command) {
          throw new Error('Command "' + signature + '" not found.');
        }

        var el = this.$el.find('.binf-dropdown');
        el.addClass("binf-disabled");
        command.execute(status, executeOptions)
            .done(_.bind(function (resp) {
              el.removeClass("binf-disabled");
              //focus on tab link for added property
              el.closest('.tab-links').find('.tab-links-bar ul li.binf-active a').trigger('focus');
            }, this))
            .fail(function (error) {
              el.removeClass("binf-disabled");
              if (error && error.cancelled) {
                //focus on dropdown toggle icon
                el.find(".binf-btn.binf-dropdown-toggle").trigger('focus');
              }
            });
      } catch (error) {
        log.warn('Executing the command "{0}" failed.\n{1}',
            command.get('signature'), error.message) && console.warn(log.last);
      }
    },

    _ensureLazyActionsRetrieved: function () {
      var deferred                         = $.Deferred(),
          node                             = this.options.node,
          lazyActionsAreRetrieved          = !!node.get('csuiLazyActionsRetrieved'),
          addPropertiesActionsAreRetrieved = !!node.get('csuiAddPropertiesActionsRetrieved'),
          isNodeLocallyCreated             = !node.get('id'),
          nonPromotedCommands              = node.nonPromotedActionCommands;
      var actionsCommands,
          actionsAreRetrieved = lazyActionsAreRetrieved && addPropertiesActionsAreRetrieved;

      // Add Properties toolbarItems
      // Optimization: AddProperties commands are no longer fetched upfront in NodesTable.
      if (this.options.toolbarItems && nonPromotedCommands && !node.lazyActionsDisabled) {
        // if lazyActionsAreRetrieved = false, merge Add Properties toolbarItems to it for retrieval
        if (!lazyActionsAreRetrieved) {
          // Fetch the AddProperties commands as part of nonPromotedCommands in Properties page.
          var additionalPropertiesCommands = commands.getSignatures(this.options.toolbarItems);
          if (additionalPropertiesCommands.length) {
            actionsCommands = nonPromotedCommands = node.nonPromotedActionCommands =
                _.union(additionalPropertiesCommands, node.nonPromotedActionCommands);
          }
        } else if (!addPropertiesActionsAreRetrieved) {
          // if not yet retrieved, retrieve the additional Add Properties toolbarItems only
          actionsCommands = commands.getSignatures(this.options.toolbarItems);
        }
      }

      function fetchActionsCommands() {
        if (!lazyActionsAreRetrieved) {
          return node.setEnabledLazyActionCommands(true);
        } else if (!addPropertiesActionsAreRetrieved) {
          return node.getAdditionalActionCommands(
              actionsCommands, 'csuiAddPropertiesActionsRetrieved');
        } else {
          return $.Deferred().reject().promise();
        }
      }

      if (!!node && !isNodeLocallyCreated && !actionsAreRetrieved && actionsCommands &&
          actionsCommands.length) {
        var self = this;
        this.$el.find('.binf-dropdown').addClass('binf-hidden');
        this.$el.find('.csui-loading-parent-wrapper').removeClass('binf-hidden');
        fetchActionsCommands()
            .done(function () {
              // As per UX req: need to show loading dots at least for 300ms after fetch as like in
              // inline actionbar
              setTimeout(function () {
                self.$el.find('.csui-loading-parent-wrapper').addClass('binf-hidden');
                self._updateMenuItems();
                deferred.resolve();
              }, 300);
            })
            .fail(function () {
              self.$el.find('.binf-dropdown').removeClass('binf-hidden');
              deferred.reject();
            });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    }

  });

  return AddPropertiesDropdownMenuView;
});



csui.define('csui/widgets/metadata/add.properties.menuitems',['csui/lib/underscore', 'csui/utils/base',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  // Load extra tool items to be added to this collection
  'csui-ext!csui/widgets/metadata/add.properties.menuitems',
  // Load extra tool items from the previous module location
  'csui-ext!csui/widgets/metadata/add.properties/toolbaritems'
], function (_, base, lang, ToolItemsFactory, TooItemModel,
    extraToolItems, oldExtraToolItems) {
  'use strict';

  var toolbarItems = {

    addPropertiesToolbar: new ToolItemsFactory(
        {
          add: [
            {
              signature: "AddCategory",
              name: lang.addNewCategory
            }
          ]
        },
        {
          maxItemsShown: 0 // force toolbar to immediately start with a drop-down list
        }
    )

  };

  if (oldExtraToolItems) {
    // TODO: Issue deprecation warning
    addExtraToolItems(oldExtraToolItems);
  }

  if (extraToolItems) {
    addExtraToolItems(extraToolItems);
  }

  function addExtraToolItems(extraToolItems) {
    _.each(extraToolItems, function (moduleToolItems) {
      _.each(moduleToolItems, function (toolItems, key) {
        var targetToolbar = toolbarItems[key];
        if (!targetToolbar) {
          throw new Error('Invalid target toolbar: ' + key);
        }
        _.each(toolItems, function (toolItem) {
          toolItem = new TooItemModel(toolItem);
          targetToolbar.addItem(toolItem);
        });
      });
    });
  }

  return toolbarItems;

});

csui.define('csui/widgets/metadata/add.properties.menuitems.mask',['module', 'csui/lib/underscore',
  'csui/controls/toolbar/toolitems.mask',
  'csui/utils/toolitem.masks/global.toolitems.mask'
], function (module, _, ToolItemMask, GlobalMenuItemsMask) {
  'use strict';

  var AddPropertiesMenuItemsMask = ToolItemMask.extend({

    constructor: function AddPropertiesMenuItemsMask() {
      var config = module.config(),
          globalMask = new GlobalMenuItemsMask();
      ToolItemMask.prototype.constructor.call(this, globalMask, {normalize: false});
      // Masks passed in by separate require.config calls are sub-objects
      // stored in the outer object be different keys
      _.each(config, function (source, key) {
        this.extendMask(source);
      }, this);
      // Enable restoring the mask to its initial state
      this.storeMask();
    }

  });

  return AddPropertiesMenuItemsMask;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/tab.contents.header/tab.contents.header',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"csui-tab-contents-header-content\">\r\n  <div class=\"csui-tab-contents-header-right\">\r\n    <div class=\"required-field-switch binf-hidden\">\r\n        <span id=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"requiredFieldsLabelId") || (depth0 != null ? lookupProperty(depth0,"requiredFieldsLabelId") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"requiredFieldsLabelId","hash":{},"loc":{"start":{"line":4,"column":18},"end":{"line":4,"column":43}}}) : helper)))
    + "\" class=\"only-required-fields-label\"\r\n              title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"onlyRequiredFieldsLabel") || (depth0 != null ? lookupProperty(depth0,"onlyRequiredFieldsLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"onlyRequiredFieldsLabel","hash":{},"loc":{"start":{"line":5,"column":21},"end":{"line":5,"column":48}}}) : helper)))
    + "\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"onlyRequiredFieldsLabel") || (depth0 != null ? lookupProperty(depth0,"onlyRequiredFieldsLabel") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"onlyRequiredFieldsLabel","hash":{},"loc":{"start":{"line":5,"column":50},"end":{"line":5,"column":77}}}) : helper)))
    + "</span>\r\n      <div class=\"required-fields-switch\"></div>\r\n    </div>\r\n  </div>\r\n  <h4>General</h4>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_tab.contents.header_tab.contents.header', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/impl/tab.contents.header/tab.contents.header',[],function(){});
csui.define('csui/widgets/metadata/impl/tab.contents.header/tab.contents.header.view',['require', 'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/marionette', 'csui/controls/form/pub.sub',
  'csui/models/version',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'hbs!csui/widgets/metadata/impl/tab.contents.header/tab.contents.header',
  'css!csui/widgets/metadata/impl/tab.contents.header/tab.contents.header', 'csui/lib/binf/js/binf'
], function (require, $, _, Backbone, Marionette, PubSub, VersionModel, lang,
    tabContentsHeaderTemplate) {
  'use strict';

  var TabContentsHeaderView = Marionette.ItemView.extend({

    tagName: 'div',

    className: 'csui-tab-contents-header',

    template: tabContentsHeaderTemplate,

    ui: {
      leftTabContentsHeader: '.csui-tab-contents-header-content',
      rightTabContentsHeader: '.csui-tab-contents-header-right',
      tabContentsHeaderTitle: '.csui-tab-contents-header-content h4',
      requiredSwitchEle: '.required-field-switch', //container of required field switch
      requiredSwitchIcon: '.required-field-switch > div.required-fields-switch'
    },

    events: {
      'click @ui.requiredSwitchIcon': 'onClickRequiredIconDiv',
      'keydown': 'onKeyInView'
    },

    constructor: function TabContentsHeaderView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      this.pubsubPostFix = (this.options.node instanceof VersionModel ? 'v' : 'p') +
                           this.options.node.get('id');

      this.requiredFieldsLabelId = _.uniqueId("requiredFields");

      var objPubSubId = 'pubsub:tab:contents:header:view:change:tab:title:' + this.pubsubPostFix;
      PubSub.off(objPubSubId);

      this.listenTo(PubSub, objPubSubId, this._changeTabTitle);

      this.listenTo(this.collection, 'add', function (model) {
        !!model.get('required') && this._showRequiredSwitch();
      });
      this.listenTo(this.collection, 'remove', function (model) {
        if (!this.isRequiredCatPresent()) {
          this._hideRequiredSwitch();
        }
      });

      this.listenTo(this, 'metadata:schema:updated', function (model) {
        if (!this.isRequiredCatPresent()) {
          this._hideRequiredSwitch();
        } else {
          this._showRequiredSwitch();
        }
      }, this);
    },

    templateHelpers: function () {
      return {
        onlyRequiredFieldsLabel: lang.onlyRequiredFieldsLabel,
        requiredFieldsLabelId: this.requiredFieldsLabelId
      };
    },

    _changeTabTitle: function (args) {
      this.$(this.ui.tabContentsHeaderTitle).html(args).attr('title',args);
      
    },

    onRender: function () {
      this.requiredFieldSwitchModel = new Backbone.Model(
          {data: !!this.options.node.collection.requireSwitched});
      var self = this;

      //fix for grunt out-release
      csui.require(['csui/controls/form/fields/booleanfield.view'], function (BooleanFieldView) {
        self.requiredFieldSwitchView = new BooleanFieldView({
          mode: 'writeonly',
          model: self.requiredFieldSwitchModel,
          labelId: self.requiredFieldsLabelId
        });
        self.requiredFieldSwitchView.render();
        self.listenTo(self.requiredFieldSwitchView, 'field:changed', function (event) {  //toggle
          // required fields
          var objPubSubId = 'pubsub:tab:contents:header:view:switch:' + self.pubsubPostFix;

          PubSub.trigger(objPubSubId, {on: event.fieldvalue});
          if (!!self.options.node.collection) {
            self.options.node.collection.requireSwitched = event.fieldvalue;
          }
        });
        self.$('.required-fields-switch').append(self.requiredFieldSwitchView.$el);
        if (self.isRequiredCatPresent()) {
          self._showRequiredSwitch();
        }

        PubSub.off('pubsub:header:rightbar:view:change:switch:status');
        self.listenTo(PubSub, 'pubsub:header:rightbar:view:change:switch:status', function (reset) {
          if (!!reset) {
            if (!!self.requiredFieldSwitchView.curVal) {
              self.requiredFieldSwitchView.$el.trigger('click');
            }
          } else if (!!self.requiredFieldSwitchModel &&
                     (self.requiredFieldSwitchModel.get('data') !== undefined &&
                     !self.requiredFieldSwitchModel.get('data')) && !!self.options.node &&
                     !!self.options.node.collection &&
                     !!self.options.node.collection.requireSwitched) {
            self.requiredFieldSwitchView.$el.trigger('click');
          }
        });

      });
    },

    currentlyFocusedElement: function (event) {
      if (!this.ui.requiredSwitchEle.hasClass('binf-hidden') && this.requiredFieldSwitchView) {
        return $(this.ui.requiredSwitchIcon.find(":input"));
      } else {
        return undefined;
      }
    },

    onKeyInView: function (e) {
      var event = e || window.event;
      var target = event.target || event.srcElement;
      if (event.keyCode === 32 || event.keyCode === 13) {
        // space key(32) or enter key(13)
        if (!this.ui.requiredSwitchEle.hasClass('binf-hidden') && this.requiredFieldSwitchView) {
          event.preventDefault();
          event.stopPropagation();
          // need timeout to overcome FireFox space press
          setTimeout(_.bind(function () {
            $(target).trigger('click');
          }, this), 200);
        }
      }
      return undefined;
    },

    // this method is triggered by keyboard
    onClickRequiredIconDiv: function (event) {
      this.requiredFieldSwitchView.onClickWriteField(event);
    },

    _hideRequiredSwitch: function () {
      this.ui.tabContentsHeaderTitle.addClass('csui-tab-contents-header-title-full-width');
      this.ui.requiredSwitchEle.addClass('binf-hidden');
      //turn off if no required cat is present
      !!this.requiredFieldSwitchView && !!this.requiredFieldSwitchView.getValue() &&
      this.requiredFieldSwitchView.ui.flagWriteField.trigger('click');
    },

    _showRequiredSwitch: function () {
      this.ui.tabContentsHeaderTitle.removeClass('csui-tab-contents-header-title-full-width');
      this.ui.requiredSwitchEle.removeClass('binf-hidden');
    },

    isRequiredCatPresent: function () {
      if (!!this.options.hideRequiredFieldsSwitch) {
        // Permanently hide "required" switch
        return false;
      }
      var isRequiredCatPresent = false,
          i                    = 0;
      for (; !isRequiredCatPresent && i < this.collection.models.length; i++) {
        isRequiredCatPresent = this.collection.models[i].get('required') === true;
      }
      return isRequiredCatPresent;
    }
  });

  return TabContentsHeaderView;

});

csui.define('csui/widgets/metadata/impl/metadata.properties.view',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/url', 'csui/utils/base', 'csui/controls/tab.panel/tab.panel.view',
  'csui/controls/tab.panel/tab.links.ext.view',
  'csui/controls/tab.panel/tab.links.ext.scroll.mixin',
  'csui/models/form', 'csui/controls/form/form.view',
  "csui/utils/commands/compound.document/compound.document.util",
  'csui/widgets/metadata/property.panels/categories/impl/category.form.view',
  'csui/models/appliedcategories', 'csui/widgets/metadata/impl/metadata.forms',
  'csui/dialogs/modal.alert/modal.alert', 'csui/controls/progressblocker/blocker',
  'csui/models/version', 'csui/widgets/metadata/impl/metadata.utils', 'i18n',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/widgets/metadata/general.form.fields/general.form.field.behavior',
  'csui/widgets/metadata/general.action.fields/general.action.field.behavior',
  'i18n!csui/widgets/metadata/impl/nls/lang', 'csui/widgets/metadata/metadata.property.panels',
  'csui/widgets/metadata/impl/add.properties/add.properties.dropdown.menu.view',
  'csui/widgets/metadata/add.properties.menuitems',
  'csui/widgets/metadata/add.properties.menuitems.mask',
  'csui/widgets/metadata/impl/tab.contents.header/tab.contents.header.view',
  'csui/controls/form/pub.sub',
  'csui/widgets/metadata/impl/metadata.tabcontentcollection.view',
  'csui/models/appliedcategories/appliedcategoriesaction',
  'csui/utils/deepClone/deepClone'

], function (_, $, Backbone, Marionette, Url, base, TabPanelView, TabLinkCollectionViewExt,
    TabLinksScrollMixin, FormModel, FormView, CompoundDocumentsUtil, CategoryFormView, AppliedCategoryCollection,
    MetadataFormCollection, ModalAlert, BlockingView, VersionModel, MetadataUtils, i18n,
    PerfectScrollingBehavior, GeneralFormFieldBehavior, GeneralActionFieldBehavior, lang,
    metadataPropertyPanels,
    AddPropertiesDropdownMenuView, toolbarItems, AddPropertiesMenuItemsMask,
    TabContentHeaderView, PubSub, MetadataTabContentCollectionView, AppliedCategoryActionsCollection) {

  //
  // Public: Metadata Properties View Class
  // Description: provides the view of general and other metadata properties (such as categories,
  // etc.) of a node.  It allows for navigation, editing and getting form values of different types
  // of metadata.
  //
  var MetadataPropertiesViewImpl = TabPanelView.extend({

    className: function() {
      var classNames = (base.isTouchBrowser() ? 'cs-touch-browser ' : '') + 'cs-metadata-properties' +
                       ' binf-panel binf-panel-default';
      classNames += !!this.options && !!this.options.topAlignLabel ? ' csui-top-align-label' : '';
      return classNames;
    },

    rtlEnabled: i18n.settings.rtl,

    contentView: function (model) {
      var panel = _.findWhere(this._propertyPanels, {model: model});
      if (panel) {
        return panel.contentView || FormView;
      }
      if (model.get('role_name') === 'categories') {
        return CategoryFormView;
      }
      return FormView;
    },

    contentViewOptions: function (model) {
      var options = {
            context: this.options.context,
            node: this.options.node,
            mode: this.options.formMode,
            fetchedModels: this.allForms,
            displayedModels: this.collection,
            originatingView: this,
            layoutMode: 'doubleCol',
            metadataView: this.options.metadataView,
            generalFormFieldDescriptors: this._generalFormFieldDescriptors,
            generalActionFieldDescriptors: this._generalActionFieldDescriptors
          },
          panel   = _.findWhere(this._propertyPanels, {model: model});
      if (panel) {
        _.extend(options, panel.contentViewOptions);
      }
      return options;
    },

    // specific implementation for TabableRegionBehavior
    isTabable: function () {
      if (this.options.notTabableRegion === true) {
        return false;
      }
      return true;  // this view can be reached by tab
    },

    constructor: function MetadataPropertiesViewImpl(options) {
      //debugger;
      options || (options = {});
      var delete_icon;

      if (base.isTouchBrowser()) {
        delete_icon = 'category_delete-touch-browser';
      } else {
        delete_icon = 'category_delete';
      }

      _.defaults(options, {
        tabType: 'binf-nav-pills',
        mode: 'spy',
        extraScrollTopOffset: 3,
        formMode: 'update',
        toolbar: true,
        toolbarItems: toolbarItems,
        delete_icon: delete_icon,
        delete_tooltip: lang.removeCategoryTooltip,
        contentView: this.getContentView,
        TabLinkCollectionViewClass: TabLinkCollectionViewExt,
        TabContentCollectionViewClass: MetadataTabContentCollectionView,
        searchTabContentForTabableElements: true,
        tabContentAccSelectors: 'a[href], area[href], input:not([disabled]),' +
                                ' select:not([disabled]), textarea:not([disabled]),' +
                                ' button:not([disabled]), iframe, object, embed,' +
                                ' *[tabindex], *[data-cstabindex], *[contenteditable]'
      });

      this.context = options.context;

      if (!options.toolbarItemsMask) {
        options.toolbarItemsMask = new AddPropertiesMenuItemsMask();
      }

      this.behaviors = _.extend({
        PerfectScrolling: {
          behaviorClass: PerfectScrollingBehavior,
          contentParent: '> .binf-tab-content',
          scrollXMarginOffset: 30,
          // like bottom padding of container, otherwise scrollbar is shown always
          scrollYMarginOffset: 15
        }
      }, this.behaviors);

      if (options.collection) {
        this.allForms = options.collection;
      } else {
         // in case of folder tweak the type while drag and drop folders, else sublevel files failed to upload
         var node = options.node,
         enforcedRequiredAttrsForFolders = node.get('enforcedRequiredAttrsForFolders'),
        tempNode = node;
        if(enforcedRequiredAttrsForFolders) {
          tempNode = node.clone();
          tempNode.set('type',144);
        }
        this.allForms = new MetadataFormCollection(undefined, {
          node: tempNode,
          connector: options.node.connector,
          container: options.container,
          action: options.action,
          inheritance: options.inheritance,
          autoreset: true,
          formCollection: options.formCollection
        });
        // Prepare an empty collection to be populated by tabs/forms later
        options.collection = new Backbone.Collection();
      }

      // have collection to keep track of newly added categories
      if (options.node.newCategories === undefined) {
        options.node.newCategories = new Backbone.Collection();
      }
      if (options.node.removedCategories === undefined) {
        options.node.removedCategories = [];
      }

      TabPanelView.prototype.constructor.apply(this, arguments);

      this.widths = [];

      if (this.options.blockingParentView) {
        BlockingView.delegate(this, this.options.blockingParentView);
      } else {
        BlockingView.imbue(this);
      }

      PubSub.off('pubsub:tab:contents:panel:textarea:scrollupdate');
      this.listenTo(PubSub, 'pubsub:tab:contents:panel:textarea:scrollupdate',
          this._updateToTextAreaScrollbar);

      this.listenTo(this.allForms, "request", this.blockActions)
          .listenTo(this.allForms, "request", this._checkFormFetching)
          .listenTo(this.allForms, "sync", this._syncForms)
          .listenTo(this.allForms, "sync", this.unblockActions)
          .listenTo(this.allForms, "destroy", this.unblockActions)
          .listenTo(this.allForms, "error", this.unblockActions)
          // If tab panel re-renders itself whe the tab collection changes, it
          // has to prevent tab links and tab content from doing the same,
          // because these two views are destroyed during tab panel re-rendering
          .listenTo(this.collection, "reset", this.render)
          .listenTo(options.node, 'change:id', function () {
            if (this.options.formMode !== 'create' && !this._fetchingForms && !this.isDestroyed) {
              this._fetchForms();
            }
          }).listenTo(this, 'reset:switch', this._resetRequiredSwitchView)
          .listenTo(this, "update:button", _.bind(function (flag) {
            this.options.metadataView && this.options.metadataView.trigger("update:button", {overlay: flag});
          }, this));

      // If the collection has been fetched before passing it to the view
      // and the operation is still ongoing, turn on the blocking view right
      // away and wait for the finishing event to turn it off
      if (this.allForms.fetching) {
        this.blockActions();
      }

      $(window).on('resize', {view: this}, this._onWindowResize);
      $(window).on('resize.tableview', {view: this}, this._onWindowResize);

      // Perform after-rendering steps after blocking view renders inside
      // into this view; it registers for the render event earlier
      this.listenTo(this, 'render', this.onRendered);
      this.listenTo(Backbone, 'metadata:schema:updated', function (model) {
        this.resolveHasRequiredFields(model);
        this.has_required_fields = this.collection
            .filter(
                function (model) {
                  return model.get('required') === true;
                });
        this.tabLinks.trigger('metadata:schema:updated', model);
        this.tabContentHeader.trigger('metadata:schema:updated', model);
      }, this);

    },

    onBeforeDestroy: function () {
      $(window).off('resize', this._onWindowResize);
      $(window).off('resize.tableview', this._onWindowResize);

      if (this.addPropertiesView) {
        this.cancelEventsToViewsPropagation(this.addPropertiesView);
        this.addPropertiesView.destroy();
      }

      if (this.contentHeaderRegion) {
        this.contentHeaderRegion.empty();
      }
    },

    _updateScrollbar: function () {
      this.trigger('update:scrollbar');
      this.$(this.behaviors.PerfectScrolling.contentParent).animate({scrollTop: 0}, "fast");
    },

    _updateToTextAreaScrollbar: function (data) {
      this.trigger('update:scrollbar');
      var scrollTop = data.$el.offset().top -
                      this.$(this.behaviors.PerfectScrolling.contentParent).offset().top;
      if (this.$(this.behaviors.PerfectScrolling.contentParent).scrollTop() > 0) {
        this.$(this.behaviors.PerfectScrolling.contentParent).animate({scrollTop: scrollTop},
            "fast");
      }
    },

    _getModelFromCollectionByTitle: function (title) {
      if (title && _.isString(title) && this.collection) {
        return this.collection.find({title: title});
      }
    },

    _getModelIndex: function (id, title) {
      var index = -1;
      if (this.collection && this.collection.length > 0) {
        var i, model, matchIndex = -1;
        for (i = 0; i < this.collection.length; i++) {
          model = this.collection.at(i);
          if (id === model.get('id') || title === model.get('title')) {
            index = i;
            break;
          }
        }
      }
      return index;
    },

    _activateTab: function (modelOrTitle) {
      var model = this._getModelFromCollectionByTitle(modelOrTitle) || modelOrTitle;
      if (model && model instanceof Backbone.Model) {
        var matchIndex = this._getModelIndex(model.get('id'), model.get('title'));
        if (matchIndex !== -1) {
          this._activateTabByIndex(matchIndex);
        }
      }
    },

    _activateTabByIndex: function (index) {
      this.options.activeTab.set("tabIndex", index);
      var tabLink = this.tabLinks.children.findByIndex(index);
      tabLink.activate(true);
    },

    _activateSelectedPropertyTab: function () {
      var selectedProperty = this._getModelFromCollectionByTitle(this.options.selectedProperty) ||
                             this.options.selectedProperty;
      if (selectedProperty && selectedProperty instanceof Backbone.Model) {
        var matchIndex = this._getModelIndex(selectedProperty.get('id'), selectedProperty.get('title'));
        if (matchIndex !== -1) {
          this.options.activeTab.set("tabIndex", matchIndex);
          this.tabLinks.children.findByIndex(matchIndex).activate();
        }
      }

    },

    // public
    render: function () {
      // fetch forms if not done or not failed already
      var dataFetched = true;
      if (!this.allForms.fetched && !this.allForms.error) {
        dataFetched = false;
        if (!this._fetchingForms) {
          this._fetchForms();
        }
      }
      if (dataFetched === false || this._fetchingForms) {
        // wait until data is there
        return this;
      }

      if (this.collection.length === 1) {
        // only one form given -> remove title
        var singleFormModel = this.collection.first(),
            schema          = _.clone(singleFormModel.get('schema'));
        schema.title = '';
        singleFormModel.set('schema', schema);
      }

      var self = this;
      this.collection.each(function (model, index) {
        var has_required_fields = self.resolveHasRequiredFields.call(self, model);
        if (has_required_fields) {
          self.hasRequiredField = true;
        }
      });
      _.extend(this, {
        _: _
      });
      // data available -> render
      TabPanelView.prototype.render.apply(this);
      // create add properties + dropdown toolbar
      this._createAddPropertiesView();
      this._initializeOthers();
      return this;
    },

    resolveHasRequiredFields: function (model) {
      var metadataUtils = new MetadataUtils();
      var has_required_fields = metadataUtils.AlpacaFormOptionsSchemaHaveRequiredFields(
          model.get('options'), model.get('schema'), model.get('id')
      );
      model.set('required', has_required_fields);
      return has_required_fields;
    },

    onDestroy: function () {
      if (this._fetchingForms) {
        this.unblockActions();
      }
    },

    onRendered: function () {
      this._setTablinksAttributes();
      // work around for the dialog fade-in delay
      // delay this call a bit since the initial dialog fade in makes the tab to be hidden
      // calling _setTabLinksAttributes() the second time here fixes the dialog fade-in delay
      // but does not have any effect if the first call already works
      setTimeout(_.bind(this._setTablinksAttributes, this), 300);

      // If tab panel re-renders itself whe the tab collection changes, it
      // has to prevent tab links and tab content from doing the same,
      // because these two views are destroyed during tab panel re-rendering
      this.tabLinks.stopListening(this.collection, 'reset');
      this.tabContent.stopListening(this.collection, 'reset');
      if (this.tabContentHeader) { // clean-up completely tab content's header if it not yet.
        this.tabContentHeader.destroy();
        this.$el.find(".csui-tab-contents-header-wrapper").remove();
      }

      this.listenTo(this.tabLinks, 'childview:delete:tab', _.bind(this._onDeleteCategory, this));

      // Alpaca slow rendering work-around: hide all views then block and
      // wait until all forms are rendered then show view and unblock
      this.tabLinks.$el.addClass('binf-hidden');
      this.tabContent.$el.addClass('binf-hidden');
      this.blockActions();
      this.updateTitle = true;
      var allFormsRendered = [],
          self             = this;
      this.tabContent.children.each(_.bind(function (childView) {
        var formRendered = $.Deferred();
        allFormsRendered.push(formRendered.promise());
        var childViewContent = childView.content;
        if (childViewContent instanceof FormView && !childViewContent.isRenderFinished()) {
          this.listenTo(childViewContent, 'render:form', function (childViewContent) {
            var formHtmlRegion = !!childViewContent.$el.find(".cs-form-singlecolumn") ?
                                 childViewContent.$el.find(".cs-form-singlecolumn") :
                                 childViewContent.$el.find(".cs-form-doublecolumn");
            if (!!formHtmlRegion && formHtmlRegion.length > 0) {
              if (!!formHtmlRegion.html()) {
                formRendered.resolve();
              }
            } else {
              formRendered.resolve();
            }
          });
        } else {
          formRendered.resolve();
        }
      }, this));
      $.when.apply($, allFormsRendered).done(function () {
        //debugger;
        self.unblockActions();
        self.tabLinks.$el.removeClass('binf-hidden');

        // Begin: tab contents header which contains tab title and required field view.
        var showStickyHeader = !(!!self.options.hideStickyHeader);
        if (showStickyHeader) {
          var objPubSubId = (self.options.node instanceof VersionModel ? 'v' : 'p');
          objPubSubId = 'pubsub:tab:contents:header:view:switch:' + objPubSubId +
                        self.options.node.get('id');
          PubSub.off(objPubSubId);
          self.listenTo(PubSub, objPubSubId, self._onRequiredSwitch);

          self.tabContent.$el.before("<div class='csui-tab-contents-header-wrapper'></div>");
          self.contentHeaderRegion = new Marionette.Region({
            el: self.$el.find('.csui-tab-contents-header-wrapper')
          });
          self.tabContentHeader = new TabContentHeaderView(self.options);
          self.contentHeaderRegion.show(self.tabContentHeader);
        }
        // End: tab contents header which contains tab title and required field view.

        if (!!self.tabContentHeader && !!self.options.node.collection.requireSwitched &&
            !!self.hasRequiredField) {
          self._hideNotRequiredFormFields(true);
        }
        self.tabContent.$el.removeClass('binf-hidden');

        // TODO: Find out, how the rightToolbar is added from outside;
        // it does not happen if the form collection is empty
        if (self.addPropertiesView && self.rightToolbar) {
          var apv = self.addPropertiesView.render();
          Marionette.triggerMethodOn(apv, 'before:show', apv, self);
          self.rightToolbar.append(apv.el);
          Marionette.triggerMethodOn(apv, 'show', apv, self);
          self.allFormsRendered = true;
        }

        // find out the first visible tab and make it active.
        // Iterate over tab colleciton instead of childer where order is not guaranteed.
        var firstVisibleTabLink,
            firstVisibleTab = self.tabLinks.collection.find(function (tabModel) {
              var tabLink = self.tabLinks.children.findByModel(tabModel);
              return !tabLink.$el.hasClass('binf-hidden');
            });
        if (firstVisibleTab &&
            !(firstVisibleTabLink = self.tabLinks.children.findByModel(
                firstVisibleTab)).isActive()) {
          firstVisibleTabLink.activate();
        }

        self._initializeOthers();
        self.triggerMethod('render:forms', this);

        // iPad needs a little timeOut
        setTimeout(function () {
          self._computeTablinkWidth();
          self._enableToolbarState();
        }, 300);

        // event for keyboard navigation
        var event = $.Event('tab:content:render');
        self.$el.trigger(event);

        if (self.options.formMode !== "create") {
          self.setFocus();
        }
        self.trigger('update:scrollbar');
        if (self.updateTitle) {
          var objPubSubTabId = (self.options.node instanceof VersionModel ? 'v' : 'p') +
                               self.options.node.get('id');
          objPubSubTabId = 'pubsub:tab:contents:header:view:change:tab:title:' +
                           objPubSubTabId;
          PubSub.trigger(objPubSubTabId, firstVisibleTabLink.el.innerText);
        }

      }).then(function () {
        // after rendered the metadata view,check options.selectedProperty and activate the tab if needed
        self._activateSelectedPropertyTab();
      });

      if (this.$el && !this.$el.is(":visible")) {
        this.updateTitle = false;
      }
      //Getting metadataItemNameView from metadataHeaderView presented in options.metadataView
      //to set tabindex for Toggle Icon
      this.options.metadataView && this.options.metadataView.metadataHeaderView &&
      this.options.metadataView.metadataHeaderView.metadataItemNameView.setToggleIconTabIndex();
    },

    onShow: function () {
    },

    setFocus: function () {
      // TODO: check if we want to have this
      // set focus to first form
      //var firstTabContentView = this.tabContent.children[0];
      //if( firstFormView) {
      //  firstTabContentView.content.setFocus();
      //}
    },

    _computeTablinkWidth: function () {
      var tabLinksBar = this.$el.find('.tab-links-bar');
      var tabLinks = tabLinksBar && tabLinksBar.find('ul > li');
      tabLinksBar && tabLinksBar.removeClass('wide-tablink very-wide-tablink');

      // compute only when there is more than one tab (e.g. General + cats/rms/etc.)
      if (tabLinksBar && tabLinksBar.length > 0 && tabLinks && tabLinks.length > 1) {
        var tabLinksBarWidth = $(tabLinksBar[0]).width();
        var totalTablinksWidth = 0;
        var i, numTabs = 0;
        for (i = 0; i < tabLinks.length; i++) {
          var $tabLink = $(tabLinks[i]);
          if (!($tabLink.hasClass('hidden-by-switch'))) {
            totalTablinksWidth += $tabLink.width();
            numTabs++;
          }
        }
        var oneTablinkWidth = numTabs > 0 ? (totalTablinksWidth / numTabs) : $(tabLinks[0]).width();

        // if this total width check values are still smaller than the tabLinks bar width,
        // then increase the tabLink width
        var totalWidthCheck1 = totalTablinksWidth * 2;  // twice smaller
        var totalWidthCheck2 = totalTablinksWidth + (1.3 * oneTablinkWidth);  // a little smaller
        if (tabLinksBarWidth > totalWidthCheck1) {
          tabLinksBar.addClass('very-wide-tablink');
        } else if (tabLinksBarWidth > totalWidthCheck2) {
          tabLinksBar.addClass('wide-tablink');
        } else {
          tabLinksBar.removeClass('wide-tablink very-wide-tablink');
        }
      }
    },

    onPanelActivated: function () {
      // delay this a bit since the fade-in may make the tabs to be hidden
      setTimeout(_.bind(function () {
        this._setTablinksAttributes();
        this._enableToolbarState();
      }, this), 300);
    },

    // public: validate all Alpaca forms
    validateForms: function () {
      function showOrHideValidationError() {
        if (++validationCounter === formCount) {
          // show/hide validation error after all forms are validated
          allFormsValid ? self._hideValidationError() : self._showValidationError();
        }
      }
      if (!!this.allFormsRendered) {
        var allFormsValid = true,
          formCount = this.tabContent.children.length,
          validationCounter = 0,
          self = this;
        this.tabContent.children.each(function (tab) {
          var isCurrentFormValid = tab.content.validate(showOrHideValidationError);
          allFormsValid = allFormsValid && isCurrentFormValid;
        });
        return allFormsValid;
      } else {
        return false;
      }
    },

    // public: get values from all Alpaca forms
    getFormsValues: function () {
      var formValues = {},
          formFieldValues, formFieldRoles, roles, role;

      this.tabContent.children.each(function (tab) {
        var values   = tab.content.getValues(),
            roleName = tab.content.model.get("role_name"),
            category, catId;

        if (values) {
          if (roleName) {
            roles = formValues.roles || (formValues.roles = {});
            role = roles[roleName] || (roles[roleName] = {});
            if (roleName === 'categories') {
              // For categories, merge the properties to the
              // roles.categories.<category_id> object
              catId = tab.model.get("id").toString();
              category = role[catId] || (role[catId] = {});
              // when attributes are not set, the server deletes
              // the category unless it is set to null
              if (_.isEmpty(values)) {
                category = null;
              } else {
                _.extend(category, values);
              }
            } else {
              // With a role defined, merge the properties to the
              // roles.<role_name> object
              _.extend(role, values);
            }
          } else {
            // With no role defined, merge the properties to the root
            // object literal with the general properties
            _.extend(formValues, values);
          }
        }
      });

      // add the deleted categories
      if (this.options.node.removedCategories.length > 0) {
        roles = formValues.roles || (formValues.roles = {});
        role = roles['categories'] || (roles['categories'] = {});
        _.each(this.options.node.removedCategories, function (removedCatId) {
          role[removedCatId] || (role[removedCatId] = {});
        });
      }

      var generalTab = this.tabContent.children.find(function (tab) {
        return !!tab.content.getGeneralFormFieldValues;
      });
      if (generalTab) {
        formFieldValues = generalTab.content.getGeneralFormFieldValues();
        // Do not make a full deep merge, but ensure, that we merge not
        // only properties on the root (general) level, but if there are
        // roles available, also on every role level
        formFieldRoles = formFieldValues.roles || {};
        delete formFieldValues.roles;
        _.extend(formValues, formFieldValues);
        _.each(_.keys(formFieldRoles), function (roleName) {
          roles = formValues.roles || (formValues.roles = {});
          role = roles[roleName] || (roles[roleName] = {});
          _.extend(role, formFieldRoles[roleName]);
        });
      }

      return formValues;
    },

    _addValidationErrorElement: function () {
      if (this.$el.find('.metadata-validation-error').length === 0) {
        this.tabLinks.$el.after('<div class="metadata-validation-error"></div>');
        this.validationErrorElem = $(this.$el.find('.metadata-validation-error')[0]);
        this.validationErrorElem.append(
            '<span class="icon notification_error cs-close-error-icon" alt="' +
            lang.hideValidationErrorMessageIconTooltip + '" title="' +
            lang.hideValidationErrorMessageIconTooltip + '"></span>');
        this.validationErrorElem.append('<span class="validation-error-message">' +
                                        lang.formValidationErrorMessage + '</span>');
        this.validationErrorElem.hide();

        var closeIcon = $(this.$el.find('.metadata-validation-error .cs-close-error-icon')[0]);
        closeIcon && closeIcon.on('click', _.bind(function (event) {
          event.preventDefault();
          event.stopPropagation();
          this._hideValidationError();
        }, this));
      }
    },

    _showValidationError: function () {
      if (this.validationErrorElem === undefined) {
        this._addValidationErrorElement();
      }
      if (this.tabContent.$el.find('.alpaca-message-notOptional').length > 0) {
        this.tabContent && this.tabContent.$el.addClass('show-validation-error');
        this.contentHeaderRegion && this.contentHeaderRegion.$el.addClass('show-validation-error');
        this.validationErrorElem && this.validationErrorElem.show();
      } else {
        this._hideValidationError();
      }
    },

    _hideValidationError: function () {
      this.tabContent && this.tabContent.$el.removeClass('show-validation-error');
      this.contentHeaderRegion && this.contentHeaderRegion.$el.removeClass('show-validation-error');
      this.validationErrorElem && this.validationErrorElem.hide();
    },

    _clearValidationError: function () {
      this.tabContent && this.tabContent.$el.removeClass('show-validation-error');
      this.contentHeaderRegion && this.contentHeaderRegion.$el.removeClass('show-validation-error');
      if (this.validationErrorElem) {
        this.validationErrorElem.remove();
        delete this.validationErrorElem;
      }
    },

    _checkFormFetching: function () {
      this._fetchingForms = true;
    },

    _fetchForms: function () {
      return this.allForms.fetch();
    },

    _syncForms: function () {
      var self = this;
      this.blockActions();
      this._clearValidationError();
      return this._loadPanels()
          .then(_.bind(this._loadGeneralFormFields, this)).then(
              _.bind(this._loadGeneralActionFields, this))
          .always(function () {
            self.unblockActions();
            self._fetchingForms = false;
          })
          .then(function () {
            var panelModels = _.pluck(self._propertyPanels, 'model'),
                models      = self.allForms.where({role_name: 'categories'});
            self.panelModelsLength = panelModels.length;
            // add back the newly added categories  that have not been saved to server
            if (self.options.node.newCategories.models.length > 0) {
              if (self.options.node.get('override_source')) {
                models = _.union(self.options.node.newCategories.models, models);
              } else {
                models = _.union(models, self.options.node.newCategories.models);
              }
            }
            var categoryModels = _.sortBy(models,
                function (model) {return model.attributes.title.toLowerCase()});
            models = panelModels.concat(categoryModels);
            self._normalizeModels(models);
            self.collection.reset(models);
            // check categories actions
            self._checkCategoriesActions();
          })
          .fail(function (request) {
            var error = new base.Error(request);
            ModalAlert.showError(error.message, lang.getPropertyPanelsFailTitle);
          });
    },

    _loadPanels: function () {
      var self = this,
          methodName, parameters;
      if (this.options.action === 'create') {
        methodName = 'getPropertyPanelsForCreate';
        parameters = [{forms: this.allForms}];
      } else if (this.options.action === 'copy') {
        methodName = 'getPropertyPanelsForCopy';
        parameters = [{forms: this.allForms}];
      } else if (this.options.action === 'move') {
        methodName = 'getPropertyPanelsForMove';
        parameters = [{forms: this.allForms}];
      } else if (this.options.action === 'restructure') {
        // restructure functionality is similar to move, so we can reuse this method
        methodName = 'getPropertyPanelsForMove';
        parameters = [{forms: this.allForms}];
      }  
      else { // update
        methodName = 'getPropertyPanels';
        //while updating process when generating panels.
        parameters = [{forms: this.allForms}];
        // There are no pre-fetched forms for the update action;
        // the 'v1/forms/info' has been abandoned, unfortunately,
        // thus every panel has to fetch its own model
      }
      var promises = metadataPropertyPanels.chain()
          .map(function (panel) {
            var Controller        = panel.get('controller'),
                controllerOptions = panel.get('controllerOptions'),
                controller        = new Controller(_.extend({
                  context: self.options.context,
                  model: self.options.node
                }, controllerOptions)),
                method            = controller[methodName];
            return method && method.apply(controller, parameters);
          })
          .compact()
          .value();
      return $.when
          .apply($, promises)
          .then(function () {
            self._propertyPanels = _.flatten(arguments);
          });
    },

    _loadGeneralFormFields: function () {
      var self = this;
      return GeneralFormFieldBehavior.getFieldDescriptors({
        context: this.options.context,
        action: this.options.action,
        node: this.options.node,
        forms: this.allForms
      }).then(function (fieldDescriptors) {
        self._generalFormFieldDescriptors = fieldDescriptors;
      });
    },

    _loadGeneralActionFields: function () {
      var self = this;
      return GeneralActionFieldBehavior.getFieldDescriptors({
        context: this.options.context,
        action: this.options.action,
        node: this.options.node,
        forms: this.allForms
      }).then(function (fieldDescriptors) {
        self._generalActionFieldDescriptors = fieldDescriptors;
      });
    },

    _normalizeModels: function (models) {
      _.each(models, function (model) {
        // If the view shows a form and the form has a title, which is
        // not empty, this title should be used for the tab too
        if (model instanceof FormModel) {
          var schema = model.get('schema');
          if (schema && schema.title) {
            model.set('title', schema.title);
          }
        }
        // Make sure, that the model has always an ID.  The scroll-spy
        // used within the tab control puts these IDs to the a@href on
        // the  tab links.  It could not recognize the particular link
        // to navigate to otherwise.
        if (model.get('id') == null) {
          model.set('id', model.cid);
        }
        // When models are added to a collection, their model.collection
        // property will not be updated, if it was already set - if they
        // were already added to some other collection earlier.  Here,
        // we're creating a new collection of property panel models, which
        // should own them - they have to be removed from their previous
        // collections, which fetched them.
        if (model.collection) {
          model.collection.remove(model);
        }
      });
    },

    // private
    _checkCategoriesActions: function () {
      // get category actions
      // talking to the server developer, only need to check available actions of one category
      var categoryModels = this.options.collection.where({role_name: 'categories'});
      if (categoryModels.length > 0) {
        var catId           = categoryModels[0].get('categoryId'),
            categoryActions = new AppliedCategoryActionsCollection(undefined, {
              node: this.options.node,
              action: this.options.action,
              urlResource: 'categories/' + catId + '/actions',
              autofetch: true,
              autoreset: true
            });
        this.blockActions();
        categoryActions.fetch()
            .done(_.bind(function () {
              /*
              For the below conditions, i.e. if the user opens the metadata of a version or
              if the node is newly created or if the metadata page is being opened as part of any action (like copy, move..), we do not fetch the category actions. (look at appliedcategoriesaction.js to know more) So we don't need to update anything for these cases.
              */
              var actionsUpdated = !(this.options.node instanceof VersionModel ||
                                     this.options.node.get('id') === undefined ||
                                     this.options.action);

              if(actionsUpdated) {
                /*
                When fecthing the forms for the metadata page,
                If the 'removable' option for a category form is not explicitly received as false, we set it to be true and render the respective category delete-icons initially.
                When the categoryActions are fecthed eventually, we need to updated the 'removable' property.

                if the 'category_remove' action is not present in the response, it means that the user cannot remove a category and so we set 'removable' to false, else we set it to true. We trigger 'action:updated' event to notify the view.
                */
                var isRemoveActionAvailable;
                if (categoryActions.length > 0 &&
                    categoryActions.at(0).get('categories_remove') &&
                    categoryActions.at(0).get('categories_remove').length > 0) {
                  isRemoveActionAvailable = true;
                } else {
                  isRemoveActionAvailable = false;
                }

                _.each(categoryModels, function (cat) {
                  cat.attributes['removeable'] = isRemoveActionAvailable;
                  cat.trigger('action:updated');
                });
              }

              this.unblockActions();
              setTimeout(_.bind(function () {
                // event for keyboard navigation
                var event = $.Event('tab:content:render');
                this.$el.trigger(event);
              }, this), 300);
            }, this))
            .fail(_.bind(function (resp) {
              var serverError = this._getRespError(resp);
              var title = lang.getCategoryActionsFailTitle;
              var message = _.str.sformat(lang.getActionsForACategoryFailMessage,
                  catId, this.options.node.get("id"), serverError);
              ModalAlert.showError(message, title);
              this.unblockActions();
            }, this));
      }
    },

    // private
    _initializeOthers: function () {
      var options = {
        gotoPreviousTooltip: lang.gotoPreviousCategoryTooltip,
        gotoNextTooltip: lang.gotoNextCategoryTooltip
      };
      this._initializeToolbars(options);
      this._listenToTabEvent();

      // delay this a bit since the initial dialog fade in makes the tab to be hidden
      setTimeout(_.bind(this._enableToolbarState, this), 300);
    },

    _onWindowResize: function (event) {
      if (event && event.data && event.data.view) {
        var self = event.data.view;
        // optimization for rapid mouse movement and redraw when mouse movement slows down or stop
        if (self.resizeTimer) {
          clearTimeout(self.resizeTimer);
        }

        var requireSwitched = self.options.node.collection && self.options.node.collection.requireSwitched;

        self.resizeTimer = setTimeout(function () {
          self._setTablinksAttributes();
          self._computeTablinkWidth();
          self._enableToolbarState();
          self._updateScrollbar();
          self.tabContent && self._hideNotRequiredFormFields(requireSwitched);
        }, 200);
      }
    },

    _setTablinksAttributes: function () {
      var i, limit = 5;
      var siblings, parent = this.$el.parent();
      for (i = 0; i < limit; i++) {
        siblings = parent.siblings('.cs-tab-links.binf-dropdown');
        if (siblings.length > 0) {
          var width = $(siblings[0]).width();
          if (width > 15) {
            var newWidth    = width - 12,
                widForEle   = newWidth + "px",
                dirForEle   = this.rtlEnabled ? "margin-right" : "margin-left",
                tabLinksEle = this.$el.find('.tab-links');

            tabLinksEle.css({
              "width": function () {
                return "calc(100% - " + widForEle + ")";
              }
            });

            if (tabLinksEle.length) {
              tabLinksEle.css(dirForEle, widForEle);
              var tabLinksEleWidth = parseInt(tabLinksEle.css('width').replace('px', ''), 10);
              if (tabLinksEleWidth > 20 && tabLinksEleWidth < 250) {
                tabLinksEle.addClass('csui-mini-tablinks');
              } else {
                tabLinksEle.removeClass('csui-mini-tablinks');
              }
            }
          }
          break;
        }
        parent = parent.parent();
      }
    },

    _createAddPropertiesView: function () {
      var suppressAddProperties;
      if (this.addPropertiesView) {
        this.cancelEventsToViewsPropagation(this.addPropertiesView);
        this.addPropertiesView.destroy();
      }
      if (this.options.node && this.options.node.get('type') === 136) {
        suppressAddProperties = !CompoundDocumentsUtil.verifyNodeAncestors(this.context);
      }
      var options = _.extend({
        toolbarItems: this.options.toolbarItems,
        toolbarItemsMask: this.options.toolbarItemsMask,
        parentView: this,
        blockingParentView: this.options.blockingParentView,
        addPropertiesCallback: this.addPropertiesCallback,
        suppressAddProperties: suppressAddProperties ? suppressAddProperties : this.options.suppressAddProperties
      }, this.options);
      this.addPropertiesView = new AddPropertiesDropdownMenuView(options);
      this.propagateEventsToViews(this.addPropertiesView);
    },

    addCatAt: function (models, respModel) {
      var index = this.panelModelsLength;
      for (var i = index; i < models.length; i++) {
        if (models[i].get('title').toLowerCase() > respModel.get('title').toLowerCase()) {
          index = i;
          break;
        }
        index += 1;
      }
      return index;
    },

    addPropertiesCallback: function (catModel) {
      // keep a list of newly added categories
      if (this.options.action) {
        this.options.node.newCategories.add(catModel);
      }
      var index = this.options.collection.models.length === 1 ? 1 :
                  this.addCatAt(this.options.collection.models, catModel);

      this.doAddModelProperties(catModel, index);
      return false;
    },

    /**
     * Adds provided model's form and handles and fires respective adjustments and events.
     */
    doAddModelProperties: function doAddModelProperties(model, index, additionalAddOpts) {
      var self = this;
      this.tabLinks.$el.find(".binf-active").removeClass("binf-active")
          .removeAttr('aria-selected');

      function tabContentRendered() {
        // Refresh tab indexes
        var event = $.Event('tab:content:render');
        self.$el.trigger(event);
        // Scroll and activate Tab
        self._autoScrollTabTo(index, {animationOff: true})
            .done(function () {
              var newTab = self.tabLinks.children.findByModel(
                  self.options.collection.findWhere({id: model.get('id')}));
              //Adding this code in order to fix LPAD-104006 issue
              newTab.$el.removeClass("binf-active");
              var $a = newTab.$el.find(">a");
              $a.removeAttr('aria-selected');
              newTab.activate();
              newTab.$el.find("a.cs-tablink").trigger('focus');
            });
      }

      // Add model to collection to render form
      this.options.collection.add(model, _.extend(additionalAddOpts || {}, {at: index}));
      model.collection = this.options.collection;

      this._listenToTabIdEvent(index);

      var formContent = this.tabContent.children.findByModel(
          this.options.collection.findWhere({id: model.get('id')})),
          newFormView = formContent && formContent.content;
      if (newFormView !== undefined) {
        var isRendered = (newFormView instanceof FormView) ? newFormView.isRenderFinished() :
                         newFormView._isRendered;
        if (isRendered) {
          // Content rendred by now.
          tabContentRendered();
        } else {
          var renderEvent = (newFormView instanceof FormView) ? 'render:form' : 'dom:refresh';
          this.listenToOnce(newFormView, renderEvent, _.bind(function () {
            this.trigger("update:button", false);
            tabContentRendered();
          }, this));
        }
        // Scroll to current rendered Tab.
        // This is to make necessary adjustment to TabLinks scroll (Previous, Next)
        this._autoScrollTabTo(index, {animationOff: true});
      } else {
        tabContentRendered();
      }

      this._computeTablinkWidth();
      this._enableToolbarState();
      this.trigger('reset:switch');
    },

    _resetRequiredSwitchView: function () {
      PubSub.trigger('pubsub:header:rightbar:view:change:switch:status', 'reset');
    },

    // private
    _onDeleteCategory: function (tabLink) {
      this.tabToDelete = tabLink;
      var categoryName = tabLink.model.get("title");
      var title = lang.removeCategoryWarningTitle;
      var message = categoryName ? _.str.sformat(lang.removeCategoryWarningMessage, categoryName) :
                    lang.removeCategoryWarningMessage;
      ModalAlert
          .confirmWarning(message, title)
          .done(_.bind(this._removeCategory, this))
          .fail(_.bind(function (err) {
            if (!err) {
              this.tabToDelete.$el.find('a').trigger('focus');
            }
          }, this));
    },

    // private
    _removeCategory: function () {
      if (this.tabToDelete) {
        var id = this.tabToDelete.model.get('id');
        id = _.isNumber(id) ? id.toString() : id;

        // with add item metadata, the new node has not been created on the server yet
        if (this.options.node.get("id") === undefined || this.options.action) {
          this._removeTab();
          if (this.options.node.newCategories.remove(id) === undefined) {
            this.options.node.removedCategories.push(id);
          }
          return;
        }

        var fullUrl = Url.combine(this.options.node.urlBase(), 'categories/' + id);
        var options = {
          type: 'DELETE',
          url: fullUrl
        };

        this.blockActions();
        this.options.node.connector.makeAjaxCall(options)
            .done(_.bind(function () {
              this.unblockActions();
              this._removeTab();
            }, this))
            .fail(_.bind(function (resp) {
              this.unblockActions();
              var serverError = this._getRespError(resp);
              var categoryName = this.tabToDelete.model.get("title");
              var title = lang.removeCategoryFailMessageTitle;
              var message = _.str.sformat(lang.removeCategoryFailMessage, categoryName,
                  serverError);
              ModalAlert.showError(message, title);
            }, this));
      }
    },

    // private
    _removeTab: function () {
      if (this.tabToDelete.$el.hasClass('binf-active')) {
        var previousIndex = this.tabToDelete._index - 1;
        var previousTab = this.tabLinks.children.findByIndex(previousIndex);
        this._autoScrollTabTo(previousIndex, {animationOff: true})
            .done(function () {
              previousTab && previousTab.activate();
            });
      }
      this.options.collection.remove(this.tabToDelete.model);
      this.trigger('reset:switch');

      setTimeout(_.bind(function () {
        this._computeTablinkWidth();
        this._enableToolbarState();
        // event for keyboard navigation
        var event = $.Event('tab:content:render');
        this.$el.trigger(event);
      }, this), 300);
    },

    // private
    _onRequiredSwitch: function (args) {
      Backbone.trigger('closeToggleAction');
      this._updateScrollbar();
      this._hideNotRequiredFormFields(args.on, args);
      return false;
    },

    _hideNotRequiredFormFields: function (hide, args) {
      this.tabContent.children.each(function (tabContent) {
        // Not every tab panel has to be a form, or implemented by FormView
        if (tabContent.content.hideNotRequired) {
          var appliedToWholeForm = tabContent.content.hideNotRequired(hide);
          var tabLink = this.tabLinks.children.findByModel(tabContent.model);
          // If the whole form has been hidden, hide the tab content with
          // optional border lines and the tab link at the top too
          if (appliedToWholeForm) {
            var method = hide ? 'addClass' : 'removeClass';
            tabContent.$el[method]('binf-hidden hidden-by-switch');
            if (hide) {
              this._hideTabLinkByRequiredSwitch(tabLink.$el);
            } else {
              this._showTabLinkByRequiredSwitch(tabLink.$el, tabContent.model.get('removeable'));
            }
          } else {
            // The form has some required fields, make sure the tabLink is visible
            this._showTabLinkByRequiredSwitch(tabLink.$el, tabContent.model.get('removeable'));
          }
        }
      }, this);
      this.tabLinks.$el.find(".tab-links-first-visible").removeClass("tab-links-first-visible");
      this.tabContent.onReorder();
      // Ensure, that another tab gets activated, if the currently active
      // one was hidden, and scroll to the top to see it.
      /* var firstVisibleTabLink = this.tabLinks.children.find(function (tabLink) {
         return !tabLink.$el.hasClass('binf-hidden');
       });*/
      var firstVisibleTabLink,
          tabLinkViews      = this.tabLinks.children._views,
          keysSortedByIndex = Object.keys(tabLinkViews).sort(
              function (view1, view2) {
                return tabLinkViews[view1]._index - tabLinkViews[view2]._index;
              });
      for (var index = 0; index < keysSortedByIndex.length; index++) {
        if (!this.tabLinks.children._views[keysSortedByIndex[index]].$el.hasClass('binf-hidden')) {
          firstVisibleTabLink = this.tabLinks.children._views[keysSortedByIndex[index]];
          break;
        }
      }
      if (!!firstVisibleTabLink) {
        firstVisibleTabLink.$el.addClass("tab-links-first-visible");
      }
      // FIXME: If the very first tab (General) is hidden, this scrolls right
      // to the second one.  The scrollbar thumb stays a little above the top.
      // If it is moved really the the top, no tab link will be emphasized as
      // active one.  Hiding the tab links may need some cooperation from the
      // scroll-spy to skip the hidden tab links.
      if (firstVisibleTabLink && !firstVisibleTabLink.isActive()) {
        firstVisibleTabLink.activate();
      }

      setTimeout(_.bind(function () {
        this._computeTablinkWidth();
        this._enableToolbarState();
        // event for keyboard navigation
        var event = $.Event('tab:content:render');
        this.$el.trigger(event);
        if (!!args) { // executes only when coming thr' event driven
          this.currentTabPosition = 1;
        }

      }, this), 300);
    },

    // private
    _getRespError: function (resp) {
      var error = '';
      if (resp && resp.responseJSON && resp.responseJSON.error) {
        error = resp.responseJSON.error;
      } else if (base.MessageHelper.hasMessages()) {
        error = $(base.MessageHelper.toHtml()).text();
        base.MessageHelper.clear();
      }
      return error;
    }

  });

  _.extend(MetadataPropertiesViewImpl.prototype, TabLinksScrollMixin);

  return MetadataPropertiesViewImpl;

});

csui.define('csui/widgets/metadata/metadata.properties.view',['module', 'csui/lib/underscore', 'csui/widgets/metadata/impl/metadata.properties.view',
  'css!csui/widgets/metadata/impl/metadata'
], function (module, _, MetadataPropertiesViewImpl) {

  var config = module.config();
  _.defaults(config, {
    topAlignLabel: false
  });

  //
  // Public: Metadata Properties View Class
  // Description: provides the view of general and other metadata properties (such as categories,
  // etc.) of a node.  It allows for navigation, editing and getting form values of different types
  // of metadata.
  //
  // This class is a clean and easy-to-read wrapper to expose as a public interface.
  // See the implementation impl/metadata.properties.view.js for more available public methods.
  //
  var MetadataPropertiesView = MetadataPropertiesViewImpl.extend({

    constructor: function MetadataPropertiesView(options) {
      options.topAlignLabel = config.topAlignLabel;
      MetadataPropertiesViewImpl.prototype.constructor.apply(this, arguments);
    },

    validateForms: function () {
      return MetadataPropertiesViewImpl.prototype.validateForms.apply(this, arguments);
    },

    getFormsValues: function () {
      return MetadataPropertiesViewImpl.prototype.getFormsValues.apply(this, arguments);
    }

  });

  return MetadataPropertiesView;

});

csui.define('csui/widgets/metadata/impl/metadata.properties.content.view',['csui/lib/underscore', 'csui/lib/marionette', 'csui/utils/nodesprites',
  'csui/widgets/metadata/metadata.properties.view',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin'
], function (_, Marionette, NodeSpriteCollection, MetadataPropertiesView,
    ViewEventsPropagationMixin) {

  var MetadataPropertiesContentView = Marionette.ItemView.extend({

    className: 'metadata-inner-wrapper',

    constructor: function MetadataPropertiesContentView(options) {
      this.options = options;
      Marionette.ItemView.prototype.constructor.call(this, options);

      var tabOptions = {
        context: this.options.context,
        node: this.options.model,
        containerCollection: this.options.containerCollection,
        metadataView: this.options.metadataView,
        blockingParentView: this.options.blockingParentView,
        selectedProperty: this.options.selectedProperty,
        notTabableRegion: true
      };
      this.childTabPanelView = new MetadataPropertiesView(tabOptions);

      this.propagateEventsToViews(this.childTabPanelView);
    },

    render: function () {
      this._ensureViewIsIntact();
      this.triggerMethod('before:render', this);

      var mdv = this.childTabPanelView.render();

      Marionette.triggerMethodOn(mdv, 'before:show', mdv, this);
      this.$el.append(mdv.el);
      Marionette.triggerMethodOn(mdv, 'show', mdv, this);

      this.triggerMethod('render', this);
      return this;
    },

    onBeforeDestroy: function () {
      this.childTabPanelView.destroy();
    },

    onPanelActivated: function () {
      this.childTabPanelView && this.childTabPanelView.triggerMethod('panel:activated');
    }

  });

  _.extend(MetadataPropertiesContentView.prototype, ViewEventsPropagationMixin);

  return MetadataPropertiesContentView;

});

csui.define('csui/widgets/metadata/impl/versions/metadata.versions.columns',["csui/lib/backbone", 'i18n!csui/widgets/metadata/impl/nls/lang'],
    function (Backbone, lang) {

      var TableColumnModel = Backbone.Model.extend({

        idAttribute: "key",

        defaults: {
          key: null,  // key from the resource definitions
          sequence: 0 // smaller number moves the column to the front
        }

      });

      var TableColumnCollection = Backbone.Collection.extend({

        model: TableColumnModel,
        comparator: "sequence",

        getColumnKeys: function () {
          return this.pluck('key');
        },

        deepClone: function () {
          return new TableColumnCollection(
              this.map(function (column) {
                return column.attributes;
              }));
        }
      });

      // Fixed (system) columns have sequence number < 100, dynamic columns
      // have sequence number > 1000

      var tableColumns = new TableColumnCollection([
        {
          key: 'version_number_name',
          align: 'center',
          title: lang.versionColumnVersionNumberTitle,
          sequence: 10
        },
        {
          key: 'name',
          sequence: 20
        },
        {
          key: 'create_date',
          sequence: 30
        },
        {
          key: 'owner_id',
          sequence: 40
        },
        {
          key: 'file_size',
          align: 'right',
          title: lang.versionColumnSizeTitle,
          sequence: 50
        }
      ]);

      return tableColumns;

    });


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/versions/metadata.versions',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"csui-metadata-versions\">\r\n  <div class=\"csui-metadata-versions-rowselection-toolbar-view\"></div>\r\n  <div class=\"csui-table-view\"></div>\r\n  <div class=\"csui-pagination-view\"></div>\r\n</div>";
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_versions_metadata.versions', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/impl/versions/metadata.versions',[],function(){});
csui.define('csui/widgets/metadata/impl/versions/metadata.versions.view',["module", "csui/lib/jquery", "csui/lib/underscore",
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/controls/globalmessage/globalmessage',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/toolbar/toolitems.filtered.model',
  'csui/controls/toolbar/toolbar.view',
  'csui/controls/toolbar/delayed.toolbar.view',
  'csui/controls/table/table.view',
  'csui/controls/pagination/nodespagination.view',
  'csui/utils/versions.default.action.items',
  'csui/utils/commands/versions',
  'csui/utils/commandhelper',
  'csui/utils/accessibility',
  'csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view',
  'csui/controls/tableactionbar/tableactionbar.view',
  'csui/controls/toolbar/toolbar.command.controller',
  'csui/models/nodes',
  'csui/models/columns',
  'csui/models/nodeversions',
  'csui/models/version',
  'csui/widgets/metadata/impl/versions/metadata.versions.columns',
  'csui/widgets/metadata/versions.toolbaritems',
  'csui/widgets/metadata/versions.toolbaritems.mask',
  'csui/utils/log',
  'csui/utils/url',
  'hbs!csui/widgets/metadata/impl/versions/metadata.versions',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'css!csui/widgets/metadata/impl/versions/metadata.versions'
], function (module, $, _, Backbone, Marionette, base,
 GlobalMessage,
 LayoutViewEventsPropagationMixin,
 FilteredToolItemsCollection,
 ToolbarView,
 DelayedToolbarView,
 TableView,
 PaginationView,
 defaultActionItems,
 commands,
 CommandHelper,
 Accessibility,
 TableRowSelectionToolbarView,
 TableActionBarView,
 ToolbarCommandController,
 NodeCollection,
 NodeColumnCollection,
 NodeVersionCollection,
 VersionModel,
 metadataVersionsColumns,
 toolbarItems,
 VersionsToolbarItemsMask,
 Log,
 Url,
 template, metadataLang) {
  'use strict';

  var accessibleTable = Accessibility.isAccessibleTable();

  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30,
    defaultPageSizes: [30, 50, 100],
    showInlineActionBarOnHover: !accessibleTable,
    forceInlineActionBarOnClick: false,
    inlineActionBarStyle: 'csui-table-actionbar-bubble',
    enabled: true,
    useV2RestApi: false
  });

  var MetadataVersionsTableView = Marionette.LayoutView.extend({
    className: function () {
      var className = 'metadata-inner-wrapper';
      if (accessibleTable) {
        className += ' csui-no-animation';
      }
      return className;
    },
    template: template,

    ui: {
      tableRowSelectionToolbarView: '.csui-metadata-versions-rowselection-toolbar-view',
      tableView: '.csui-table-view',
      childContainer: '.csui-table-view',
      paginationView: '.csui-pagination-view'
    },

    regions: {
      tableRowSelectionToolbarRegion: '@ui.tableRowSelectionToolbarView',
      tableRegion: '@ui.tableView',
      paginationRegion: '@ui.paginationView'
    },

    constructor: function MetadataVersionsTableView(options) {
      this.commands = commands;
      _.defaults(options, {
        pageSize: config.defaultPageSize,
        ddItemsList: config.defaultPageSizes,
        showInlineActionBarOnHover: config.showInlineActionBarOnHover,
        forceInlineActionBarOnClick: config.forceInlineActionBarOnClick,
        inlineActionBarStyle: config.inlineActionBarStyle,
        toolbarItems: toolbarItems,
        originatingView: options.originatingView || options.metadataView
      });

      MetadataVersionsTableView.__super__.constructor.call(this, options);

      this.selectedNodes = new NodeCollection();

      this.collection = new NodeVersionCollection(undefined, {
        node: this.options.model,
        autoreset: true,
        expand: "user",
        commands: commands.getAllSignatures(),
        useV2RestApi: config.useV2RestApi,
        onlyClientSideDefinedColumns: true  // ignore columns sent by server
      });

      //TODO: we can get rid of this additional call, once advanced info is available in node call.
      this._ensureNodeAdvanceInfo();

      this.options.model.versions = this.collection;  // connect version collection with node

      this.commandController = new ToolbarCommandController({commands: this.commands});

      if (this.collection.delayedActions) {
        this.listenTo(this.collection.delayedActions, 'error',
            function (collection, request, options) {
              var error = new base.Error(request);
              GlobalMessage.showMessage('error', error.message);
            });
      }
      this.defaultActionItems = defaultActionItems;

      if (!this.options.toolbarItemsMasks) {
        this.options.toolbarItemsMasks = new VersionsToolbarItemsMask(this.options);
      }

      this._setTableView();

      // must be after setTableView
      this._setTableRowSelectionToolbar({
        toolItemFactory: this.options.toolbarItems.tableHeaderToolbar,
        toolbarItemsMask: this.options.toolbarItemsMasks,
        commands: this.options.commands || commands,
      });

      this._setTableRowSelectionToolbarEventListeners();

      this._setPagination();

      this._updateCollection();

      // Cause the show events triggered on the parent view re-triggered
      // on the views placed in the inner regions
      this.propagateEventsToRegions();
      this.listenTo(this.collection, "add", this._updateCollection)
      .listenTo(this.collection, "remove", this._updateCollection);
    },

    onRender: function () {
      this.tableRowSelectionToolbarRegion.show(this._tableRowSelectionToolbarView);
      this.tableRegion.show(this.tableView);
      this.paginationRegion.show(this.paginationView);
    },

    _updateCollection: function () {
      var deferred = $.Deferred();
      var errorMessage;
      this.collection.fetch().then(function(res){
        deferred.resolve();
      },function(err){
       
        if (err && err.responseJSON && err.responseJSON.error) {
          errorMessage = err.responseJSON.error;
        } else {
          var errorHtml = base.MessageHelper.toHtml();
          base.MessageHelper.reset();
          errorMessage = $(errorHtml).text();
        }
        GlobalMessage.showMessage('error', errorMessage);
        deferred.reject();
      });
    },

    _setTableView: function () {
      this.options || (this.options = {});

      var args = _.extend({
        tableColumns: metadataVersionsColumns,
        connector: this.model.connector,
        collection: this.collection,
        columns: this.collection.columns,
        columnsWithSearch: [],
        orderBy: "version_number_name desc",
        actionItems: defaultActionItems,
        commands: commands,
	inlineBar: {
	    viewClass: TableActionBarView,
	    options: _.extend(
	      {
	        collection: this.options.toolbarItems.inlineActionbar,
	        toolItemsMask: this.options.toolbarItemsMasks,
	        container: this.collection.node,
	        containerCollection: this.collection,
	      },
	      this.options.toolbarItems.inlineActionbar.options,
	      {
	        inlineBarStyle: this.options.inlineActionBarStyle,
	        forceInlineBarOnClick: this.options.forceInlineActionBarOnClick,
	        showInlineBarOnHover: this.options.showInlineActionBarOnHover,
	      }
	    ),
	},
        originatingView: this.options.originatingView,
        focusView: 'tableHeader',
        tableAria: _.str.sformat(metadataLang.versionTableAria, this.collection.node.get('name'))
      }, this.options);

      /*
      LPAD-60042
      deleting blockingParentView option to fix expand/collapse icon.
      table.view.js checks the condition this.$el[0].children.length > 0 in
      function calculateMaxColumnsDisplayed()
      */
      delete args.blockingParentView;

      if (!_.contains(this.options.ddItemsList, this.options.pageSize)) {
        this.options.ddItemsList.push(this.options.pageSize);
        this.options.ddItemsList.sort();
      }

      this.tableView = new TableView(args);

      // Events
      var cmdOption = {context: this.options.context, originatingView: this};

      this.listenTo(this.tableView, 'execute:defaultAction', function (node) {
        var action = this.defaultActionItems.find(function (actionItem) {
          if (actionItem.get('type') === node.get('type')) {
            return true;
          }
        }, this);
        var cmd = commands.get(action.get('signature'));
        var status = {nodes: new NodeVersionCollection([node])};
        var promise = cmd.execute(status, cmdOption);
        CommandHelper.handleExecutionResults(
            promise, {
              command: cmd,
              suppressSuccessMessage: status.suppressSuccessMessage,
              suppressFailMessage: status.suppressFailMessage
            });
      });
    },

    _setTableRowSelectionToolbar: function (options) {
      this._tableRowSelectionToolbarView = new TableRowSelectionToolbarView({
        toolItemFactory: options.toolItemFactory,
        toolbarItemsMask: options.toolbarItemsMask,
        toolbarCommandController: this.commandController,

        // if toolbarCommandController is not defined, a new ToolbarCommandController
        // with the following commands is created
        commands: commands,
        selectedChildren: this.tableView.selectedChildren,
        container: this.collection.node,
        context: this.options.context,
        originatingView: this.options.originatingView,
        collection: this.collection
      });
    },

    _setTableRowSelectionToolbarEventListeners: function () {
      // listen for change of the selected rows in the table.view and if at least one row is
      // selected, display the table-row-selected-toolbar
      this.listenTo(this.tableView.selectedChildren, 'reset', function () {
        // TODO: Re-use TableRowSelectionToolbarBehavior.
        if (this.tableView.selectedChildren.length > 0) {
          this.tableRowSelectionToolbarRegion.$el.addClass(
              'csui-metadata-versions-rowselection-toolbar-visible');
        } else {
          this.tableRowSelectionToolbarRegion.$el.removeClass(
              'csui-metadata-versions-rowselection-toolbar-visible');
        }
      });
    },

    _setPagination: function () {
      this.paginationView = new PaginationView({
        collection: this.collection,
        pageSize: this.options.pageSize,
        defaultDDList: this.options.ddItemsList,
        skipPaginationUpdateRequest: true
      });
    },
    
    _ensureNodeAdvanceInfo: function () {
      var versionNode = this.options.model;
      if (versionNode.get('advanced_versioning') === undefined) {
        var id = versionNode.get("id"),
            connector = versionNode.connector ? versionNode.connector : this.options.connector,
            fullUrl = Url.combine(
                connector.getConnectionUrl().getApiBase("v2"),
                "/nodes/" + id +
                "/properties"
            ),
            ajaxOptions = {
              type: "GET",
              url: fullUrl
            };

        connector.makeAjaxCall(ajaxOptions).done(
            _.bind(function (resp) {
              var response =  resp.results.data && resp.results.data.properties;
              response && versionNode.set(
                  {
                    advanced_versioning: response.advanced_versioning
                  },
                  {silent: true}
              );
            }, this)
        ).fail(function (request) {
          var error = new base.Error(request);
          Log.warn('fetching node properties failed.\n{0}', error.message) &&
          console.warn(Log.last);
        });
      }
    }

  });

  // Add the mixin functionality to the target view
  _.extend(MetadataVersionsTableView.prototype, LayoutViewEventsPropagationMixin);

  return MetadataVersionsTableView;

});

csui.define('csui/widgets/metadata/metadata.versions.view',["module", "csui/lib/jquery", "csui/lib/underscore",
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/widgets/metadata/impl/versions/metadata.versions.view',
  'csui/models/version'
], function (module, $, _, Backbone, Marionette, MetadataVersionsTableView, VersionModel) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    enabled: true
  });

  var MetadataVersionsView = MetadataVersionsTableView.extend({

    constructor: function MetadataVersionsView(options) {
      MetadataVersionsTableView.prototype.constructor.apply(this, arguments);
    }
  },
  {
    enabled: function (options) {
      if (config.enabled === false || options.enabled === false) {
        return false;
      }
      // don't enable if we are viewing properties of a VersionModel
      if (options.node instanceof VersionModel) {
        return false;
      }
      // TODO: Recognize versionable objects in a common way. For example,
      // available_roles in v1 REST API was a viable way. It could be also
      // done by extensibility on the client side.
      return _.contains([144, 736, 749, 5574], options.node.get('type'));
    }
  }
  );
  return MetadataVersionsView;

});

csui.define('csui/widgets/metadata/impl/audit/metadata.audit.columns',['csui/lib/backbone',
  'i18n!csui/widgets/metadata/impl/nls/lang'
], function (Backbone, lang) {

  var TableColumnModel = Backbone.Model.extend({

    idAttribute: 'key',

    defaults: {
      key: null,  // key from the resource definitions
      sequence: 0 // smaller number moves the column to the front
    }

  });

  var TableColumnCollection = Backbone.Collection.extend({

    model: TableColumnModel,
    comparator: 'sequence',

    getColumnKeys: function () {
      return this.pluck('key');
    },

    deepClone: function () {
      return new TableColumnCollection(
          this.map(function (column) {
            return column.attributes;
          }));
    }
  });

  var tableColumns = new TableColumnCollection([
    {
      key: 'audit_name',
      align: 'left',
      title: lang.action,
      sequence: 10
    },
    {
      key: 'audit_date',
      align: 'left',
      title: lang.date,
      sequence: 20
    },
    {
      key: 'user_id',
      align: 'left',
      title: lang.user,
      sequence: 30
    }
  ]);

  return tableColumns;
});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/audit/metadata.audit',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"csui-audit-table\"></div>\r\n<div class=\"csui-audit-pagination\"></div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_audit_metadata.audit', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/impl/audit/metadata.audit',[],function(){});
csui.define('csui/widgets/metadata/impl/audit/metadata.audit.view',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/contexts/factories/connector',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/table/table.view', 'csui/controls/pagination/nodespagination.view',
  'csui/models/audit/audit.collection',
  'csui/widgets/metadata/impl/audit/metadata.audit.columns',
  'csui/models/members',
  'csui/controls/userpicker/roles/user.view',
  'csui/utils/base',
  'hbs!csui/widgets/metadata/impl/audit/metadata.audit',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'css!csui/widgets/metadata/impl/audit/metadata.audit'
], function (module, _, $, Marionette, ConnectorFactory, LayoutViewEventsPropagationMixin, TableView,
  PaginationView, AuditCollection, metadataAuditTableColumns, MemberCollection, UserView, base,
  template, lang) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30,
    defaultPageSizes: [30, 50, 100]
  });

  var MetadataAuditTableView = Marionette.LayoutView.extend({

    className: 'csui-audit',

    template: template,

    ui: {
      tableView: '.csui-audit-table',
      paginationView: '.csui-audit-pagination'
    },

    regions: {
      tableRegion: '@ui.tableView',
      paginationRegion: '@ui.paginationView'
    },

    constructor: function MetadataAuditTableView (options) {
      options || (options = {});
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
      this.collection.fetch();
      // events triggered on the parent view re-triggered
      // on the views placed in the inner regions
      this.propagateEventsToRegions();
    },

    initialize: function () {
      _.defaults(this.options, {
        pageSize: config.defaultPageSize,
        ddItemsList: config.defaultPageSizes
      });
      this.collection = new AuditCollection(undefined, {
        connector: this.options.context.getObject(ConnectorFactory),
        node: this.options.model,
        autoreset: true
      });

      this._setTableView();
      this._setPagination();

      // to handle the case where focus comes to event search box on dom:refresh event and dropdown is shown after tableview is rendered.
      this.listenTo(this.tableView, 'before:render', function (event) {
        var eventsSearchBoxView = this.tableView.searchBoxes.length && this.tableView.searchBoxes[0];
        if (eventsSearchBoxView && !eventsSearchBoxView.ui.searchBox.hasClass('binf-hidden') &&
            !this.eventDropDownOpts.doNotShowDropDown && this.tableView.tableCaptionView.accFocusedColumn === 0) {
          this.eventDropDownOpts.doNotShowDropDown = true;
        }
      });

    },

    onRender: function () {
      this.tableRegion.show(this.tableView);
      this.paginationRegion.show(this.paginationView);
    },

    getUserSearchboxOptions: function () {

      var collection = new MemberCollection(undefined, {
          connector: this.options.context.getObject(ConnectorFactory),
          memberFilter: {
            type: [0]
          }, // filters only users
          limit: 10,
          comparator: function (item) {
            return item.get('name_formatted').toLowerCase();
          }
        }),

        _retrieveMembers = function (query) {
          var self = this;
          this.collection.query = query;
          // fetch and resolve
          return this.collection
            .fetch()
            .then(function () {
              // resolve
              return self.collection.models;
            });
        },

        _retrieveDisplayText = function (item) {
          return item.get('name');
        },

        _renderHighlighter = function (item) {
          var model = this.collection.findWhere({
              name: item
            }),
            view = new UserView({
              model: model,
              connector: this.collection.connector,
              lightWeight: false
            });
          // ... and render
          return view.render().el;
        };

      return {
        collection: collection,
        source: _retrieveMembers,
        displayText: _retrieveDisplayText,
        highlighter: _renderHighlighter,
        filter: 'user_id',
        pickerListId: _.uniqueId('userList'),
        pickerListClass: 'userpickerul'
      };
    },

    getEventSearchboxOptions: function () {

      this.eventDropDownOpts = {doNotShowDropDown: false};

      var collection = this.collection.auditEvents,
        _retrieveDisplayText = function (item) {
          return item.get('name');
        },

        _retrieveEvents      = function (query) {
          var self = this;
          var filteredModels = _.filter(self.collection.models, function (model) {
            return model.get('name').toLowerCase().indexOf(query.toLowerCase()) !== -1;
          });
          return _.sortBy(filteredModels, function (action) { return action.get('name'); });
        },

        focus = function (e) {
          if (!this.focused) {
            this.focused = true;
            if (this.options.showHintOnFocus && !this.options.dropDownOpts.doNotShowDropDown) {
                this.lookup();
            }
          }
          if (this.options.dropDownOpts.doNotShowDropDown) {
            this.options.dropDownOpts.doNotShowDropDown = false;
          }
        },

        highlighter = function (item) {
          return $('<div></div>').text(item).html();
        },

        afterSelect = function (item) {
          // don't show dropdown due to focus after selecting an item.
          if(this.options.dropDownOpts && !this.options.dropDownOpts.doNotShowDropDown) {
            this.options.dropDownOpts.doNotShowDropDown = true;
          }
          var val = this.options.clearOnSelect ? '' : base.formatMemberName(item);
          this.ui.searchBox.val(val);
          this.trigger(this.valueChangedEventName, {
            column: this.options.filter,
            keywords: item.get('id')
          });
        };

      return {
        collection: collection,
        source: _retrieveEvents,
        displayText: _retrieveDisplayText,
        filter: 'type',
        pickerListId: _.uniqueId('typeList'),
        showHintOnFocus: true,
        dropDownOpts: this.eventDropDownOpts,
        focus: focus,
        afterSelect: afterSelect,
        highlighter: highlighter
      };
    },

    _setTableView: function () {

      var userSearchOptions = this.getUserSearchboxOptions(),
        eventSearchOptions = this.getEventSearchboxOptions(),
        options = _.extend({
          connector: this.model.connector,
          collection: this.collection,
          tableColumns: metadataAuditTableColumns,
          orderBy: 'audit_date desc',
          columnsWithTypeaheadSearchbox: {
            "user_id": userSearchOptions,
            "audit_name": eventSearchOptions
          },
          selectColumn: false,
          haveDetailsRowExpandCollapseColumn: true,
          actionItems: this.defaultActionItems,
          commands: this.commands,
          wfElementID: '',
          customLabels: {
            emptyTableText: lang.auditNoResultsPlaceholder
          },
          focusView: 'tableHeader',
          tableAria: _.str.sformat(lang.auditTableAria, this.options.model.get('name'))
        }, this.options);

      this.tableView = new TableView(options);
    },

    _setPagination: function () {
      var options = {
        collection: this.collection,
        pageSize: this.options.pageSize,
        defaultDDList: this.options.ddItemsList
      };
      this.paginationView = new PaginationView(options);
    }
  });
  _.extend(MetadataAuditTableView.prototype, LayoutViewEventsPropagationMixin);

  return MetadataAuditTableView;
});

csui.define('csui/widgets/metadata/metadata.audit.view',["module", "csui/lib/jquery", "csui/lib/underscore",
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/widgets/metadata/impl/audit/metadata.audit.view'
], function (module, $, _, Backbone, Marionette, MetadataAuditTableView) {
  'use strict';

  var MetadataAuditView = MetadataAuditTableView.extend({

    constructor: function MetadataAuditView(options) {
      MetadataAuditTableView.prototype.constructor.apply(this, arguments);
    }
  },
  {
    enabled: function (options) {
      var config = module.config();
      _.defaults(config, {
        enabled: true
      });
      if (config.enabled === false) {
        return false;
      }
      return !!options.node.get('id');
    }
  }
  );
  return MetadataAuditView;

});

csui.define('csui/models/compound.document/releases/releases.collection',['csui/lib/underscore',
  'csui/lib/backbone',
  'nuc/models/browsable/browsable.mixin',
  'csui/models/mixins/connectable/connectable.mixin',
  'csui/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/browsable/v1.request.mixin',
  'csui/models/browsable/v2.response.mixin',
  'csui/models/compound.document/releases/server.adaptor.mixin',
  'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'csui/models/mixins/v2.fields/v2.fields.mixin',
  'csui/models/mixins/v2.expandable/v2.expandable.mixin',
  'csui/models/mixins/state.requestor/state.requestor.mixin',
  'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'csui/models/nodechildrencolumn',
  'csui/models/nodechildrencolumns',
  'csui/models/node/node.model'
], function (_, Backbone, BrowsableMixin, ConnectableMixin, FetchableMixin, BrowsableV1RequestMixin,
  BrowsableV2ResponseMixin, ServerAdaptorMixin, AdditionalResourcesV2Mixin, FieldsV2Mixin,
  ExpandableV2Mixin, StateRequestorMixin, DelayedCommandableV2Mixin, NodeChildrenColumnModel,
  NodeChildrenColumnCollection, NodeModel) {

  var releaseObject = {
    type: 'release_type',
    type_name:'type_name',
    name: 'name',
    reserved:'reserved',
    release_value: 'release_value',
    created: 'release_date',
    createdBy: 'create_user_name',
    favorite: 'favorite',
    dateType: '-7',
  };

  var ReleasesColumnModel = NodeChildrenColumnModel.extend({
    constructor: function ReleasesColumnModel(attributes, options) {
      NodeChildrenColumnModel.prototype.constructor.call(this, attributes, options);
    }
  });

  var ReleasesColumnCollection = NodeChildrenColumnCollection.extend({
    model: ReleasesColumnModel,

    resetColumnsV2: function (response, options) {
      if (!this.models.length) {// Stopping reset as event data is static and doesn't change after first fetch
        this.resetCollection(this.getV2Columns(response), options);
      }
    },

    getColumnModels: function (columnKeys, definitions) {
      var columns = NodeChildrenColumnCollection.prototype.getColumnModels.call(
        this, columnKeys, definitions);
      return columns;
    },

    getV2Columns: function () {
      var definitions = {},
        releaseObjectKeys = Object.keys(releaseObject);
      _.each(releaseObjectKeys, function (column) {
        definitions[column] = {};
        definitions[column].key = releaseObject[column];
      });
      definitions.created.type = releaseObject.dateType;
      definitions.type.type_name = releaseObject.type_name;
      var columnKeys = _.keys(definitions);
      return this.getColumnModels(columnKeys, definitions);
    }
  });

  var ReleasesModel = NodeModel.extend({});

  var ReleasesCollection = Backbone.Collection.extend({
    model: ReleasesModel,
    constructor: function ReleasesCollection(models, options) {
      this.options = options || {};
      Backbone.Collection.prototype.constructor.call(this, models, options);
      this.makeConnectable(options)
        .makeFetchable(options)
        .makeBrowsableV2Response(options)
        .makeAdditionalResourcesV2Mixin(options)
        .makeFieldsV2(options)
        .makeExpandableV2(options)
        .makeStateRequestor(options)
        .makeDelayedCommandableV2(options)
        .makeServerAdaptor(options);
      this.columns = new ReleasesColumnCollection();
    }
  });

  BrowsableMixin.mixin(ReleasesCollection.prototype);
  BrowsableV1RequestMixin.mixin(ReleasesCollection.prototype);
  BrowsableV2ResponseMixin.mixin(ReleasesCollection.prototype);
  ConnectableMixin.mixin(ReleasesCollection.prototype);
  FetchableMixin.mixin(ReleasesCollection.prototype);
  ServerAdaptorMixin.mixin(ReleasesCollection.prototype);
  AdditionalResourcesV2Mixin.mixin(ReleasesCollection.prototype);
  FieldsV2Mixin.mixin(ReleasesCollection.prototype);
  ExpandableV2Mixin.mixin(ReleasesCollection.prototype);
  StateRequestorMixin.mixin(ReleasesCollection.prototype);
  DelayedCommandableV2Mixin.mixin(ReleasesCollection.prototype);

  return ReleasesCollection;
});
csui.define('csui/widgets/metadata/impl/releases/metadata.releases.columns',["csui/lib/backbone", 'i18n!csui/widgets/metadata/impl/nls/lang'],
  function (Backbone, lang) {

    var TableColumnModel = Backbone.Model.extend({

      idAttribute: "key",

      defaults: {
        key: null,  // key from the resource definitions
        sequence: 0 // smaller number moves the column to the front
      }
    });

    var TableColumnCollection = Backbone.Collection.extend({

      model: TableColumnModel,
      comparator: "sequence",

      getColumnKeys: function () {
        return this.pluck('key');
      },

      deepClone: function () {
        return new TableColumnCollection(
          this.map(function (column) {
            return column.attributes;
          }));
      }
    });

    // Fixed (system) columns have sequence number < 100, dynamic columns
    // have sequence number > 1000

    var tableColumns = new TableColumnCollection([
      {
        key: 'type',
        titleIconInHeader: 'mime_type',
        permanentColumn: true,
        sequence: 10
      },
      {
        key: 'name',
        sequence: 20
      },
      {
        key: 'reserved',
        title: 'State',
        sequence: 30,
        noTitleInHeader: true // don't display a column header
      },
      {
        key: 'release_value',
        title: lang.release,
        sequence: 40
      },
      {
        key: 'created',
        title: lang.created,
        sequence: 50
      },
      {
        key: 'createdBy',
        title: lang.createdBy,
        sequence: 60
      },
      {
        key: 'favorite',
        column_key: 'favorite',
        sequence: 70,
        title: lang.favorite,
        noTitleInHeader: true,
        permanentColumn: true
      }
    ]);

    return tableColumns;

  });

csui.define('csui/widgets/metadata/impl/releases/toolbaritems',[
  'csui/lib/underscore',
  'i18n!csui/controls/tabletoolbar/nls/localized.strings',
  'i18n!csui/controls/tabletoolbar/impl/nls/localized.strings',
  'csui/controls/toolbar/toolitems.factory',
  'csui/controls/toolbar/toolitem.model',
  // Load extra tool items to be added to this collection
  // Load extra tool items from the previous module location
], function (_, publicLang, lang, ToolItemsFactory, TooItemModel) {
  'use strict';

  var toolbarItems = {
    tableHeaderToolbar: new ToolItemsFactory({
          info: [
            {
              signature: "ReleasesProperties",
              name: lang.ToolbarItemInfo,
              iconName: "csui_action_properties32"
            },
            {signature: "CopyLink", name: lang.ToolbarItemCopyLink}
          ],

          main: [
            {
              signature: "FavoriteRename",
              name: lang.ToolbarItemRename,
              onlyInTouchBrowser: true
            },
            {signature: "InlineEdit", name: lang.ToolbarItemRename},
            {signature: "Lock", name: lang.ToolbarItemLock},
            {signature: "Unlock", name: lang.ToolbarItemUnlock},
            {signature: "Delete", name: lang.ToolbarItemDelete},
          ]
        },
        {
          maxItemsShown: 15,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false,
          lazyActions: true
        }),

        inlineToolbar: new ToolItemsFactory({
          info: [
            {
              signature: "ReleasesProperties",
              name: lang.ToolbarItemInfo,
              iconName: "csui_action_properties32"
            },
            {
              signature: "CopyLink",
              name: lang.ToolbarItemCopyLink,
              iconName: "csui_action_copy_link32"
            }
          ],
          other: [
            {
              signature: "InlineEdit",
              name: lang.ToolbarItemRename,
              iconName: "csui_action_rename32"
            },
            {
              signature: "Lock",
              name: lang.ToolbarItemLock,
              iconName: "csui_action_reserve32"
            },
            {
              signature: "Unlock",
              name: lang.ToolbarItemUnlock,
              iconName: "csui_action_unreserve32"
            },
            {
              signature: "Delete",
              name: lang.ToolbarItemDelete,
              iconName: "csui_action_delete32"
            }
          ]
        },
        {
          maxItemsShown: 5,
          dropDownText: lang.ToolbarItemMore,
          dropDownIconName: "csui_action_more32",
          addGroupSeparators: false
        })
  };
  
  return toolbarItems;
});

csui.define('csui/widgets/metadata/impl/releases/toolbaritems.masks',['module', 'csui/lib/underscore',
  'csui/controls/toolbar/toolitems.mask',
  'csui/utils/toolitem.masks/global.toolitems.mask'
], function (module, _, ToolItemMask, GlobalMenuItemsMask) {
  'use strict';

  var toolbars = ['tableHeaderToolbar', 'otherToolbar', 'inlineActionbar'];

  function ToolbarItemsMasks() {
    var config = module.config(),
        globalMask = new GlobalMenuItemsMask();
    // Create and populate masks for every toolbar
    this.toolbars = _.reduce(toolbars, function (toolbars, toolbar) {
      var mask = new ToolItemMask(globalMask, {normalize: false});
      // Masks passed in by separate require.config calls are sub-objects
      // stored in the outer object be different keys
      _.each(config, function (source, key) {
        source = source[toolbar];
        if (source) {
          mask.extendMask(source);
        }
      });
      // Enable restoring the mask to its initial state
      mask.storeMask();
      toolbars[toolbar] = mask;
      return toolbars;
    }, {});
  }

  ToolbarItemsMasks.toolbars = toolbars;

  return ToolbarItemsMasks;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/releases/metadata.releases',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"csui-metadata-releases-rowselection-toolbar-view\"></div>\r\n<div class=\"csui-releases-table\"></div>";
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_releases_metadata.releases', t);
return t;
});
/* END_TEMPLATE */
;

csui.define('css!csui/widgets/metadata/impl/releases/metadata.releases',[],function(){});
csui.define('csui/widgets/metadata/impl/releases/metadata.releases.view',['module', 'csui/lib/underscore', 'csui/lib/marionette3',
  'csui/utils/contexts/factories/connector',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/table/table.view',
  'csui/utils/accessibility',
  'csui/models/nodechildren',
  'csui/models/compound.document/releases/releases.collection',
  'csui/widgets/metadata/impl/releases/metadata.releases.columns',
  'csui/widgets/metadata/impl/releases/toolbaritems',
  'csui/widgets/metadata/impl/releases/toolbaritems.masks',
  'csui/controls/table.rowselection.toolbar/table.rowselection.toolbar.view',
  'csui/controls/toolbar/toolbar.command.controller',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/utils/commands',
  'csui/utils/commands/compound.document/releases.commands',
  'csui/controls/tableactionbar/tableactionbar.view',
  'hbs!csui/widgets/metadata/impl/releases/metadata.releases',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'css!csui/widgets/metadata/impl/releases/metadata.releases'
], function (module, _, Marionette, ConnectorFactory, LayoutViewEventsPropagationMixin, TableView, Accessibility, NodeChildrenCollection,
  ReleasesCollection, metadataReleaseTableColumns, toolbarItems, ToolbarItemsMasks, TableRowSelectionToolbarView,
  ToolbarCommandController, DefaultActionBehavior,
  commands, releasesCommands, TableActionBarView, template, lang) {
  'use strict';

  var accessibleTable = Accessibility.isAccessibleTable();
  
  var config = module.config();
  _.defaults(config, {
    toolbarItems: toolbarItems,
    showInlineActionBarOnHover: !accessibleTable,
  });

  var MetadataReleasesTableView = Marionette.View.extend({
    className: 'csui-compound-document-releases',
    template: template,

    ui: {
      tableView: '.csui-releases-table',
      tableRowSelectionToolbarView: '.csui-metadata-releases-rowselection-toolbar-view'
    },

    regions: {
      tableRegion: '@ui.tableView',
      tableRowSelectionToolbarRegion: '@ui.tableRowSelectionToolbarView'
    },

    behaviors: {
      DefaultAction: {
        behaviorClass: DefaultActionBehavior
      }
    },

    constructor: function MetadataReleasesTableView(options) {
      options || (options = {});
      Marionette.View.prototype.constructor.apply(this, arguments);
      options.toolbarItems || (options.toolbarItems = toolbarItems);
      options.toolbarItemsMasks || (options.toolbarItemsMasks = new ToolbarItemsMasks());
      _.defaults(this.options, {
        showInlineActionBarOnHover: config.showInlineActionBarOnHover
      }, {
        forceInlineActionBarOnClick: false,
        inlineActionBarStyle: "csui-table-actionbar-bubble",
        toolbarItems: toolbarItems
      });
      this.collection.commands = this.collection.options.commands;
      this.collection.fetch();
      this.context = options.context;
      this.connector = this.context.getObject(ConnectorFactory);
      this.commands = options.commands || commands;
      if (releasesCommands) {
        this.commands.push(releasesCommands.models);
      }
      this.commandController = new ToolbarCommandController({
        commands: this.commands
      });
      this.listenTo(this.commandController, 'before:execute:command', this._beforeExecuteCommand);
      this.listenTo(this.commandController, 'after:execute:command', this._afterExecuteCommand);
      this._setTableView();
      this._setTableRowSelectionToolbar({
        toolItemFactory: this.options.toolbarItems.tableHeaderToolbar,
        toolbarItemsMask: this.options.toolbarItemsMasks,
        commands: this.options.commands || commands,
      });
      this._setTableRowSelectionToolbarEventListeners();
      // events triggered on the parent view re-triggered
      // on the views placed in the inner regions
      this.propagateEventsToRegions();
    },

    initialize: function () {
      var defaultActionItems = this.defaultActionController.actionItems;
      this.collection = new ReleasesCollection(undefined, {
        connector: this.options.context.getObject(ConnectorFactory),
        node: this.options.model,
        orderBy: 'create_date desc',
        autoreset: true,
        commands: commands.getAllSignatures(),
        defaultActionCommands: defaultActionItems.getAllCommandSignatures(commands),
        delayRestCommands: true
      });
      this.collection.setEnabledDelayRestCommands(true);
    },

    onRender: function () {
      var tableRegion = this.getRegion('tableRegion');
      this.tableRowSelectionToolbarRegion = this.getRegion('tableRowSelectionToolbarRegion');
      this.tableRowSelectionToolbarRegion.show(this._tableRowSelectionToolbarView);
      tableRegion.show(this.tableView);
      this.listenTo(this.tableView, 'tableRowSelected', function () {
        this.tableView.cancelAnyExistingInlineForm.call(this.tableView);
      });
    },

    // controller for the toolbar actions
    _beforeExecuteCommand: function () {
      this.tableView.cancelAnyExistingInlineForm.call(this.tableView);
    },

    _afterExecuteCommand: function (toolbarActionContext) {
      switch (toolbarActionContext.commandSignature) {
        case 'Delete':
          if (!toolbarActionContext || toolbarActionContext.cancelled) {
            // command was cancelled
            return;
          }
          //uncheck select all checkbox after deleting nodes.
          var checkboxView = this.tableView._selectAllCheckboxRegion.currentView;
          checkboxView.model.set('checked', false);
          break;
      }
    },

    _setTableView: function () {
      if (!this.inlineToolbarItemsMasks) {
        this.inlineToolbarItemsMasks = new ToolbarItemsMasks(this.options);
      }
      var args = _.extend({
        connector: this.model.connector,
        collection: this.collection,
        context: this.context,
        originatingView: this,
        tableColumns: metadataReleaseTableColumns,
        selectColumn: true,
        haveDetailsRowExpandCollapseColumn: true,
        actionItems: this.defaultActionController.actionItems,
        commands: this.commands,
        customLabels: {
          emptyTableText: lang.releasesNoResultsPlaceholder
        },
        focusView: 'tableHeader',
        inlineBar: {
          viewClass: TableActionBarView,
          options: _.extend({
            collection: this.options.toolbarItems.inlineToolbar,
            toolItemsMask: this.inlineToolbarItemsMasks.toolbars.inlineActionBar,
            delayedActions: this.collection.delayedActions,
            container: this.container,
            containerCollection: this.collection
          }, this.options.toolbarItems.inlineToolbar &&
          this.options.toolbarItems.inlineToolbar.options, {
            inlineBarStyle: this.options.inlineActionBarStyle,
            forceInlineBarOnClick: this.options.forceInlineActionBarOnClick,
            showInlineBarOnHover: this.options.showInlineActionBarOnHover
          })
        },
        tableAria: _.str.sformat(lang.releasesTableAria, this.options.model.get('name'))
      }, this.options);

      this.tableView = new TableView(args);
      if (this.tableView.collection && this.tableView.collection.length === 0 && this.collection.fetched) {
        this.tableView._showEmptyViewText = true;
      }
      this.listenTo(this.tableView, 'execute:defaultAction', function (node) {
        var nextNode, nextNodeId, childrenCollection, childNode;
        nextNode = this.options.context.getModel('nextNode');
        childrenCollection = new NodeChildrenCollection(undefined, { node: node, autoreset: true });
        childrenCollection.fetch().done(function (resp) {
          childNode = _.has(resp.data[0], 'id') && resp.data[0].id;
          nextNodeId = !!childNode ? childNode : node;
          nextNode.set('id', nextNodeId);
        });
      });
    },

    _setTableRowSelectionToolbar: function (options) {
      this._tableRowSelectionToolbarView = new TableRowSelectionToolbarView({
        toolItemFactory: options.toolItemFactory,
        toolbarItemsMask: options.toolbarItemsMask,
        toolbarCommandController: this.commandController,
        // if toolbarCommandController is not defined, a new ToolbarCommandController
        // with the following commands is created
        commands: commands,
        selectedChildren: this.tableView.selectedChildren,
        container: this.collection.node,
        context: this.options.context,
        originatingView: this.options.originatingView,
        collection: this.collection
      });
    },

    _setTableRowSelectionToolbarEventListeners: function () {
      // listen for change of the selected rows in the table.view and if at least one row is
      // selected, display the table-row-selected-toolbar
      this.listenTo(this.tableView.selectedChildren, 'reset', function () {
        // TODO: Re-use TableRowSelectionToolbarBehavior.
        if (this.tableView.selectedChildren.length > 0) {
          this.tableRowSelectionToolbarRegion.$el.addClass(
            'csui-metadata-releases-rowselection-toolbar-visible');
        } else {
          this.tableRowSelectionToolbarRegion.$el.removeClass(
            'csui-metadata-releases-rowselection-toolbar-visible');
        }
      });
    }

  });
  _.extend(MetadataReleasesTableView.prototype, LayoutViewEventsPropagationMixin);

  return MetadataReleasesTableView;
});
csui.define('csui/widgets/metadata/metadata.releases.view',["module", "csui/lib/underscore",
  'csui/widgets/metadata/impl/releases/metadata.releases.view',
  'csui/utils/commands/compound.document/compound.document.util'
], function (module, _, MetadataReleasesTableView, CompoundDocumentsUtil) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    enabled: true
  });

  var MetadataReleasesView = MetadataReleasesTableView.extend({

    constructor: function MetadataReleasesView() {
      MetadataReleasesTableView.prototype.constructor.apply(this, arguments);
    }
  },
    {
      enabled: function (options) {
        if (config.enabled === false) {
          return false;
        }
        if (options.node.get('type') === 136) {
          return CompoundDocumentsUtil.verifyNodeAncestors(options.context);
        }
        else {
          return false;
        }
      }
    }
  );
  return MetadataReleasesView;

});


csui.define('csui/widgets/metadata/metadata.panels',[
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/widgets/metadata/impl/metadata.properties.content.view',
  'csui/widgets/metadata/metadata.versions.view',
  'csui/widgets/metadata/metadata.audit.view',
  'csui/widgets/metadata/metadata.releases.view',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  // Load extra panels to be added to the built-in dropdown tabs
  'csui-ext!csui/widgets/metadata/metadata.panels'
], function (_, Backbone, MetadataPropertiesContentView,
    MetadataVersionsTableView, MetadataAuditTableView,MetadataReleasesTableView, lang, extraPanels) {

  var MetadataPanelModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      title: null,
      name: '',
      contentView: null,
      contentViewOptions: null
    },

    constructor: function MetadataPanelModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var MetadataPanelCollection = Backbone.Collection.extend({

    model: MetadataPanelModel,
    comparator: "sequence",

    constructor: function MetadataPanelCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }

  });

  var metadataPanels = new MetadataPanelCollection([
    {
      title: lang.properties,
      name: 'properties',
      sequence: 10,
      contentView: MetadataPropertiesContentView
    }, {
      title: lang.versions,
      name: 'versions',
      sequence: 20,
      contentView: MetadataVersionsTableView
    }, {
      title: lang.audit,
      name: 'audit',
      sequence: 20,
      contentView: MetadataAuditTableView
    }, {
      title: lang.releases,
      name: 'releases',
      sequence: 20,
      contentView: MetadataReleasesTableView
    }
  ]);

  if (extraPanels) {
    metadataPanels.add(_.flatten(extraPanels, true));
    // assign default name to panels that are not having the 'name' field yet
    var counter = 1;
    metadataPanels.forEach(function (model) {
      // name can't be empty to be able to save the metadata view state in the url.
      if (!model.get('name')) {
        model.set('name', 'unnamed_panel' + counter, {silent: true});
        counter++;
      }
    });
  }

  return metadataPanels;

});

csui.define('csui/widgets/metadata/impl/metadata.dropdowntab.view',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone',
  'csui/controls/tab.panel/tab.panel.view',
  'csui/widgets/metadata/metadata.panels',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/controls/tab.panel/tab.links.dropdown.view',
  'csui/lib/binf/js/binf'
], function (_, $, Backbone, TabPanelView, metadataPanels,
  PerfectScrollingBehavior, TabLinkDropDownCollectionView) {
  'use strict';

  var MetadataDropdownTabView = TabPanelView.extend({
    // FIXME: This removes the tab classes from the paren object
    className: 'metadata-content-wrapper binf-panel binf-panel-default',

    ui: {
      dropdownToggle: '.binf-dropdown-toggle'
    },

    contentView: function () {
      return this.options.contentView;
    },

    contentViewOptions: function () {
      return {
        context: this.options.context,
        model: this.options.node,
        originatingView: this.options.originatingView,
        metadataView: this.options.metadataView,
        blockingParentView: this.options.blockingParentView,
        selectedProperty: this.options.selectedProperty
      };
    },

    constructor: function MetadataDropdownTabView(options) {
      // Assign the options to this before the parent constructor
      // would do it, so that the _buildTabs below can access it
      this.options = options || (options = {});
      _.defaults(options, {
        TabLinkCollectionViewClass: TabLinkDropDownCollectionView,
        implementTabContentsDefaultKeyboardHandling: false,
        delayTabContent: options.delayTabContent !== false
      });

      this.behaviors = _.extend({
        PerfectScrolling: {
          behaviorClass: PerfectScrollingBehavior,
          contentParent: '.binf-dropdown-menu',
          suppressScrollX: true,
          includePadding: true
        }
      }, this.behaviors);

      options.tabs = this._buildTabs();

      TabPanelView.prototype.constructor.call(this, options);

      this.listenTo(this.options.node, "change", this._nodeChanged)
          .listenTo(Backbone, 'closeToggleAction', this._closeToggle);
    },

    _buildTabs: function () {
      return metadataPanels
          .chain()
          .filter(function (panel) {
            // If there is a static method enabled, call it, otherwise
            // consider the panel always enabled
            var contentView = panel.get('contentView'),
                enabled     = contentView.enabled;
            // providing way to render custom properties view for node types that has separate
            // view to show in metadata. Based on key 'customproperties' provided in response.
            if (this.options.node.attributes.customProperties) {
              // filter extra commands based on the key 'executeCommand' for respective node.
              if (panel.attributes.executeCommand) {
                return !enabled || enabled({
                      context: this.options.context,
                      node: this.options.node
                    });
              } else {
                return false;
              }
            } else {
              return !enabled || enabled({
                    context: this.options.context,
                    node: this.options.node
                  });
            }
          }, this)
          .map(function (panel) {
            return panel.attributes;
          })
          .value();
    },

    onRender: function () {
      this.$el.prepend("<div class='csui-metadata-tab-bar'></div>");
      var that = this;
      this.$el.find('.binf-dropdown-toggle').on('binf.dropdown.after.show', function () {
        that.trigger("update:scrollbar");  
      });
    },

    onActivateTab: function (tabContent, tabPane, tabLink) {
      // Warning: this onActivateTab is currently being triggered twice by the 'activate:tab' event.
      // The code in the base 'controls/tab.panel' needs to be revisited later when time permits.
      // Any code being called from here should handle two calls gracefully by itself !!!
      tabContent && tabContent.triggerMethod('panel:activated');
    },

    _closeToggle: function () {
      var dropdownToggleEl = this.$el.find('.binf-dropdown-toggle');
      if (dropdownToggleEl.parent().hasClass('binf-open')) {
        if (dropdownToggleEl.length && dropdownToggleEl.length > 1) {
          dropdownToggleEl.each(function (index, dropdownElement) {
            if ($(dropdownElement).parent().hasClass('binf-open')) {
              !$(dropdownElement).is(":hidden") && $(dropdownElement).binf_dropdown('toggle');
            }
          });
        } else {
          !dropdownToggleEl.is(":hidden") && dropdownToggleEl.binf_dropdown('toggle');
        }
      }
    },

    _updateTabs: function () {
      var tabs = this._buildTabs();
      // FIXME: _convertCollection should return an array of object
      // literals or models; the models below do not change their
      // parent collection without removing them
      this.collection.reset(this._convertCollection({tabs: tabs}).models);
    },

    _nodeChanged: function () {
      // We switched to other node or fetched the node info
      if (this.options.node.hasChanged('id') || this.options.node.hasChanged('type')) {
        this._updateTabs();
      }
    }
  });

  return MetadataDropdownTabView;
});

csui.define('csui/widgets/metadata/impl/metadata.controller',["csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone", "csui/utils/url",
  "csui/utils/base"
], function (_, $, Backbone, Url, base) {

  // handling server calls for metadata
  function MetadataController(status, options, attributes) {
    this.status = status || {};
    this.options = options || {};
    this.attributes = attributes || {};
  }

  _.extend(MetadataController.prototype, Backbone.Events, {

    save: function (model, data) {
      // Pass data via the first attrs param to get them set to model
      // attributes
      return model.save(data, {
        wait: true,
        patch: true
      });
    },

    createItem: function (model, formsValues) {
      return model.save(undefined, {
        // If data does not contain common attributes, which should be just set
        // to model attributes, it should be passed via options.data instead of
        // using the first attrs paremeter
        data: formsValues,
        wait: true
      });
    }

  });

  MetadataController.prototype.get = Backbone.Model.prototype.get;
  _.extend(MetadataController, {version: "1.0"});

  return MetadataController;
});

csui.define('csui/widgets/metadata/metadata.view',['module',
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/base', 'csui/widgets/metadata/impl/header/metadata.header.view',
  'csui/widgets/metadata/impl/metadata.dropdowntab.view',
  'csui/utils/contexts/factories/node',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/controls/mixins/view.state/metadata.view.state.mixin',
  'csui/widgets/metadata/impl/metadata.controller',
  'csui/controls/progressblocker/blocker', 'csui/utils/commandhelper',
  'csui/widgets/permissions/permissions.view',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/utils/contexts/factories/next.node',
  'i18n!csui/widgets/metadata/impl/nls/lang',
  'css!csui/widgets/metadata/impl/metadata'
], function (module, _, $, Marionette, base, MetadataHeaderView, MetadataDropdownTabView,
    NodeModelFactory, ViewEventsPropagationMixin, MetadataViewStateMixin, MetadataController,
    BlockingView, CommandHelper, PermissionsView, ModalAlert, NextNodeModelFactory, lang) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    showExtraRightActionBar: false
  });

  var MetadataView = Marionette.ItemView.extend({
    className: 'cs-metadata',

    template: false,

    constructor: function MetadataView(options) {
      var self = this;
      options || (options = {});
      options.data || (options.data = {});
      this.options = options;
      this.context = options.context;
      
      this.enableViewState = options.enableViewState === undefined ? true : options.enableViewState;
      if (this.enableViewState && this.isShowPermissionView() && !options.model) {
        this.initOptionsFromMetadataInfo(options);
      }

      this.options.showExtraRightActionBar = this.options.showPermissionView ||
                                             config.showExtraRightActionBar;
      this.targetView = options.targetView;
      
      this.thumbnailViewState = options.originatingView &&
                                options.originatingView.thumbnailViewState;

      var doNodeFetch = false;

      if (!options.model) {
        options.model = options.context.getModel(NodeModelFactory);
        // The node in the context is usually never fetched and
        // the nextNode info is filled in and is only marked as fetched.
        // When there is a perspective change to metadata , the context is cleared but the nextNode is
        // not fetched.And also, the node in the context is created anew with only id but with fetched = true.
        // If this is the case, we need to change the flag for the info to be fecthed again by 'ensureFetched'.
        // the node in the context is to be used because it contains info like 'fields' and 'expands' which
        // are necessary in computing the urlto fetch specific info (eg: extra modules).
        var keys = _.keys(options.model.attributes);
        if(!options.model.fetching && keys.length === 1 && keys[0] === 'id') {
          options.model.fetched = false;
        }
        doNodeFetch = true;
      }

      var viewStateModel = this.context && this.context.viewStateModel;
      if (this._isViewStateModelEnabled()) {
        if (doNodeFetch && options.model && options.model.ensureFetched) {
          if (this.isShowPermissionView() && !options.model.fetched) {
            // The permissions view needs the permissions action before it starts rendering.
            options.model.delayRestCommands = false;
          }
          options.model.ensureFetched();
        }
        if (!this.isMetadataNavigation()) {
          this.options.showBackIcon = true;
          if (viewStateModel && !viewStateModel.hasRouted()) {
            this.options.showBackIcon = false;
          }
          this._isViewStateModelEnabled() && this._addUrlParametersSupport(options.context);
          this.listenTo(this, 'metadata:close', this._backToPreviousPerspective);
          this.listenTo(options.model, 'delete', this._navigateToParent);
        } else {
          this.options.showBackIcon = false;
        }
      } else if (this.options.navigationView === false) {
        this.listenTo(options.model, 'delete', function () {
          self.trigger('metadata:close');
        });
      }

      // setting initialPanel if it was passed in from data or overriden by URL
      options.model.unset('initialPanel', {silent: true});
      if (options.data.initialPanel) {
        options.model.set('initialPanel', options.data.initialPanel, {silent: true});
      }
      this.options.showShortcutSwitch = true;
      this.options.showRequiredFieldsSwitch = true;
      if (this.options.model.get('type') === 1 || !!this.options.model.get('shortcutNode')) {  // shortcut
        if (!doNodeFetch && (!!this.options.model.get('shortcutNode') && this.options.model.get('type') !== 1 ||
          (this.options.model.original &&
            (this.options.model.original.get('type') === undefined ||
              this.options.model.original.get('type') < 0) ||
            !this.options.model.get('original_id')))) {
          this.options.shortcutNode = this.options.model.get('shortcutNode');
        } else if (!!this.options.model.get('shortcutNode') && this.options.model.get('type') !== 1) {
          this.options.shortcutNode = this.options.model.get('shortcutNode');
        }
        else {
          this.options.model.connector.assignTo(this.options.model.original); //TODO: have to do this?
          this.options.shortcutNode = this.options.model;
          var shortcutResourceScope = this.options.shortcutNode.getResourceScope();
          this.options.model.original.setResourceScope(shortcutResourceScope);
          this.options.model = this.options.model.original;
          this.options.model.set('shortcutNode', this.options.shortcutNode, { silent: true });
        }
        //Load permissions page after getting actions from REST API
        this.options.actionsPromise = this._ensureCompleteNode();
      } else if (this.options.model.refetchNodeActions) {
        this.options.actionsPromise = this._ensureCompleteNode();
      } else {
        this.options.actionsPromise = $.Deferred().resolve().promise();
      }

      // Once PropertiesView is opened , 'OrginatingView' becomes metadataView or
      // MetadataNavigationview.
      // If  properties view page does not have navigationlist (eg for folders and wikipage) then
      // originating view becomes 'MetadataView' based on supportOriginatingView
      if (!!this.options.originatingView && !!this.options.originatingView.supportOriginatingView) {
        this.options.baseOriginatingView = this.options.originatingView;
        this.options.originatingView = this;
      }

      Marionette.ItemView.prototype.constructor.call(this, options);

      // When this view is used alone on a perspective, if should offer
      // spinning sun to commands executed with it as originating view
      BlockingView.imbue(this);

      this.options.showDropdownMenu = true;
      this.options.originatingView = this.options.originatingView || this;
      this.metadataHeaderView = new MetadataHeaderView(_.extend({
        // Since ItemNameView (which includes DropdownMenuView, etc.) is now being used elsewhere,
        // this boolean flag is to indicate metadata scenario for ItemNameView to know.
        metadataScenario: true,
        // If this widget is placed on a perspective, it becomes the originating view itself
        originatingView: this
      }, this.options));
      this.listenTo(this.metadataHeaderView, "metadata:item:name:save", this._saveItemName)
      .listenTo(this.metadataHeaderView, "shortcut:switch", function (view) {
        self.options.model = view.node;
        self.options.model.set('shortcutNode', self.model.get('shortcutNode'), {silent: true});
        this._ensureCompleteNode()
        .always(function () {
          !!self.metadataTabView && self.metadataTabView.destroy();
          if (!!self.options.showPermissionView) {
            self.metadataTabView = new PermissionsView({
              model: self.options.model,
              originatingView: self.options.originatingView,
              context: self.options.context,
              showCloseIcon: self.options.originatingView ? false : true,
              showBackIcon: self.options.originatingView ? true : false,
              selectedTab: status.selectedTab,
              selectedProperty: self.options.selectedProperty
            });

          } else {
            self.metadataTabView = new MetadataDropdownTabView({
              context: self.options.context,
              node: self.options.model,
              containerCollection: self.options.containerCollection,
              originatingView: self.options.originatingView,
              metadataView: self,
              activeTab: self.options.activeTab,
              delayTabContent: self.options.delayTabContent
            });
          }

          self.$el.append(self.metadataTabView.render().$el);
          self.propagateEventsToViews(self.metadataTabView);
        });
      })
      .listenTo(this.metadataHeaderView, "metadata:close", function () {
        self.trigger("metadata:close");
      })
      .listenTo(this.options.context, 'retain:perspective', function () {
        // new data was fetched by context, but perspective stays same (if perspective changes
        // it is not necessary to close the metadata dialog, because it gets destroyed
        // anyways when new perspective slides in)
        self._closeMetadata();
      });

      var tabOptions = {
        context: this.options.context,
        node: this.options.model,
        containerCollection: this.options.containerCollection,
        originatingView: this.options.originatingView,
        metadataView: this,
        blockingParentView: this,
        activeTab: this.options.activeTab,
        selectedTab: this.options.selectedTab || this.getViewStateDropdown(),
        selectedProperty: this.options.selectedProperty,
        delayTabContent: self.options.delayTabContent
      };

      if (this.options.showPermissionView) {
        this.options.actionsPromise.always(function () {
           self.metadataTabView = new PermissionsView({
            model: self.options.model,
            originatingView: self.options.originatingView,
            context: self.options.context,
            showCloseIcon: self.options.originatingView ? false : true,
            showBackIcon: self.options.originatingView ? true : false,
            selectedTab: status.selectedTab,
            selectedProperty: self.options.selectedProperty
          });
          self.propagateEventsToViews(self.metadataTabView, self.metadataHeaderView);
          if (self._isViewStateModelEnabled()) {
            self.listenTo(self.context.viewStateModel, 'change:state', self.onViewStateChanged);
          }
        });
      }
      else {
        this.options.actionsPromise.always(function () {
          self.metadataTabView = new MetadataDropdownTabView(tabOptions);
          self.propagateEventsToViews(self.metadataTabView, self.metadataHeaderView);
          if (self._isViewStateModelEnabled()) {
            self.listenTo(self.context.viewStateModel, 'change:state', self.onViewStateChanged);
          }
        });
      }

      if (this.enableViewState) {
        viewStateModel && !this.isMetadataNavigation() &&
        this.listenTo(viewStateModel, "navigate", function (historyEntry) {
          if (historyEntry && self.options.showBackIcon !== true) {
            self.options.showBackIcon = true;
            self.metadataHeaderView.showBackIcon(true, self.__isRendered);
          }
        });
      }

    },

    onRender: function () {
      // don't render until the shortcut's original node has been fetched
      var fetching = this.options.model.fetchingActions || this.options.model.fetching;
      if (fetching) {
        // Note: render always so that the link to Shortcut Properties is available for the
        // user to click on to go into the Properties page and update the Original Location field.
        // This is due to the backward UX design that Original Properties is rendered first.
        // TODO: Find out, why the link "View shortcut" is dead after re-rendering
        return fetching.always(_.bind(this.render, this));
      }

      this.__isRendered = true;
      var mhv = this.metadataHeaderView.render();
      var mdv = this.metadataTabView.render();

      Marionette.triggerMethodOn(mhv, 'before:show', mhv, this);
      Marionette.triggerMethodOn(mdv, 'before:show', mdv, this);

      this.$el.append(mhv.el);
      this.$el.append(mdv.el);

      this.$el.attr({'role': 'region', 'aria-label': lang.metadataRegionAria});

      Marionette.triggerMethodOn(mhv, 'show', mhv, this);
      Marionette.triggerMethodOn(mdv, 'show', mdv, this);

      if (this._isViewStateModelEnabled() && !this.showPermissionView) {
        this._listenToDropdownSelection();
      }
    },

    _isViewStateModelEnabled: function () {
      var viewStateModel = this.context && this.context.viewStateModel;
      return this.enableViewState && viewStateModel && viewStateModel.get('enabled');
    },

    onViewStateChanged: function () {
      var selection = this.getViewStateDropdown() || this.getDefaultViewStateDropdown(),
          tabLinks = this.metadataTabView.tabLinks;
      if (tabLinks && tabLinks.selected) {
        if (selection && tabLinks.selected.get('name') !== selection) {
          tabLinks.activateDropdownTab(selection, true);
        }
      }
    },

    _listenToDropdownSelection: function () {
      var tabLinks = this.metadataTabView.tabLinks;
      if (tabLinks && tabLinks.selected) {
        var dropDownName = this.getViewStateDropdown();
        if (dropDownName !== tabLinks.selected.get('name')) {
          this.setViewStateDropdown(tabLinks.selected.get('name'),
              {default: !dropDownName, title: tabLinks.selected.get('title').toLowerCase()});
        }
        this.listenTo(tabLinks.selected, 'change', this._onDropDownSelectionChanged);
      }
    },

    _onDropDownSelectionChanged: function (model) {
      this.setViewStateDropdown(model.get('name'), {title: model.get('title').toLowerCase()});
    },

    onBeforeDestroy: function () {
      if (this.metadataTabView) {
        this.cancelEventsToViewsPropagation(this.metadataTabView);
        this.metadataTabView.destroy();
      }
      if (this.metadataHeaderView) {
        this.cancelEventsToViewsPropagation(this.metadataHeaderView);
        this.metadataHeaderView.destroy();
      }
      if (this.targetView && this.thumbnailViewState) {
        this.targetView.thumbnail.resultsView.triggerMethod("metadata:close");
      }
    },

    _saveItemName: function (args) {
      var self = this;
      var itemName = args.sender.getValue();
      var data = {'name': itemName};
      if (this.model.changed && this.model.changed.name_multilingual) {
        _.extend(data, {
          name_multilingual: this.model.changed.name_multilingual
        });
      }
      var metadataController = new MetadataController();
      var node = this.options.model;
      var collection = this.options.collection;
      var shortcutOriginal;
      // workarounds to handle the refresh of the shortcut node or original node
      if (this.options.shortcutNode && this.options.shortcutNode.original === node) {
        var originalNodeInCollection = this.options.collection.findWhere(
            {id: node.get('id')});
        if (originalNodeInCollection) {
          shortcutOriginal = node;
          node = originalNodeInCollection;
        } else {
          collection = undefined;
        }
      }

      var contextualNode = self.context.getModel(NodeModelFactory);
      if (contextualNode) {
        contextualNode.set('name', itemName);
      }

      self._blockActions();
      metadataController.save(node, data)
      .done(function () {
        return node.fetch()
        .then(function () {
          if (shortcutOriginal) {
            shortcutOriginal.set(node.attributes);
          }
          // Following command causing failure in breadcrumb collection update,
          // While renaming the item in metadata view, and clicking directly on breadcrumb
          // ancestor. After commenting out nodes table parent item renaming functionality
          // is working fine.
          //self.options.context && self.options.context.trigger('current:folder:changed');
          args.success && args.success();
          self._unblockActions();
          if (self.options.originatingView &&
              _.isFunction(self.options.originatingView.unblockActions)) {
            self.options.originatingView.unblockActions();
          }
        });
      })
      .fail(function (error) {
        self._unblockActions();
        var errorMsg = CommandHelper._getErrorMessageFromResponse(error);
        errorMsg === undefined && (errorMsg = lang.failedToSaveName);
        args.error && args.error(errorMsg);
      });
    },

    _ensureCompleteVersionNode: function () {
      this._blockActions();
      return this.options.model.fetch()
      .always(_.bind(this._unblockActions, this))
      .fail(function (request) {
        var error = new base.Error(request);
        ModalAlert.showError(error.message);
      });
    },

    _ensureCompleteNode: function () {
      var node = this.options.model;
      if (node && node.refetchNodeActions) {
        if (!node.fetchingActions) {
          node.fetchingActions = node.setEnabledLazyActionCommands(true);
        }
        node.fetchingActions
          .done(_.bind(function () {
            node.refetchNodeActions = false;
            node.fetchingActions = false;
          }, this))
          .fail(_.bind(function (request) {
            var error = new base.Error(request);
            ModalAlert.showError(error.message);
          }, this));
        return node.fetchingActions;
      } else if (this.options.showShortcutSwitch) {
        return node.fetch();
      }
      return $.Deferred().resolve().promise();
    },

    _backToPreviousPerspective: function () {
      if (this._isViewStateModelEnabled()) {
        this.context.viewStateModel.restoreRouterOfLastApplicationScope();
      } else {
        this._setNextNodeModelFactory(this.options.model.get('id'));
      }
    },

    _navigateToParent: function () {
      var parentId = this.options.model.get('parent_id');
      if (parentId) {
        this._setNextNodeModelFactory(parentId);
      } else {
        // Going back to previous page when parentId is undefined for scenarios like in ContentSharing, etc.
        this._backToPreviousPerspective();
      }
    },

    _setNextNodeModelFactory: function (id) {
      if (this.context && id !== undefined) {
        var nextNode = this.context.getModel(NextNodeModelFactory);
        if (nextNode) {
          if (nextNode.get('id') === id) {
            // when id is same as nextNode's id, nextNode.set(id) event is not triggered
            nextNode.unset('id', {silent: true});
          }
          nextNode.set('id', id);
        }
      }
    },

    _closeMetadata: function () {
      var node = this.options.model;
      if (node.get('type') === 1 && node.original && node.original.get('type') === 0) {
        this.trigger("metadata:close");
      } else {
        this.trigger('metadata:close:without:animation');
      }
    },

    _blockActions: function () {
      var origView = this.options.originatingView;
      origView && origView.blockActions && origView.blockActions();
    },

    _unblockActions: function () {
      var origView = this.options.originatingView;
      origView && origView.unblockActions && origView.unblockActions();
    },

    _addUrlParametersSupport: function (context) {
      var viewStateModel = context && context.viewStateModel;
      viewStateModel && viewStateModel.addUrlParameters(['dropdown'], context);
    }

  });

  _.extend(MetadataView.prototype, ViewEventsPropagationMixin);
  _.extend(MetadataView.prototype, MetadataViewStateMixin);

  return MetadataView;
});

csui.define('csui/widgets/metadata/metadata.action.one.item.properties.view',["module", "csui/lib/underscore", "csui/lib/jquery", "csui/lib/marionette",
  "csui/utils/base",
  "csui/widgets/metadata/impl/header/metadata.header.view",
  "csui/widgets/metadata/metadata.properties.view", 'csui/utils/log',
  "csui/controls/mixins/view.events.propagation/view.events.propagation.mixin",
  "css!csui/widgets/metadata/impl/metadata"
], function (module, _, $, Marionette, base, MetadataHeaderView, MetadataPropertiesView,
    log, ViewEventsPropagationMixin) {

  var MetadataActionOneItemPropertiesView = Marionette.ItemView.extend({

    className: 'cs-add-item-metadata-form',
    template: false,

    // public
    constructor: function MetadataActionOneItemPropertiesView(options) {
      options || (options = {});
      this.options = options;
      Marionette.ItemView.prototype.constructor.apply(this, arguments);

      options.showRequiredFieldsSwitch = true;
      this.metadataHeaderView = new MetadataHeaderView(options);
      this.listenTo(this.metadataHeaderView, "metadata:item:name:save", this._saveItemName);
      this.listenTo(this.metadataHeaderView, "update:button", _.bind(function (args) {
        this.trigger("update:button", args);
      }, this));

      this.metadataPropertiesView = new MetadataPropertiesView({
        node: options.model,
        collection: options.collection,
        container: options.container,
        context: options.context,
        hideStickyHeader: !!options.hideStickyHeader,
        formMode: 'create',
        action: options.action,
        inheritance: options.inheritance,
        metadataView: this,
        formCollection: options.formCollection,
        suppressAddProperties: options.suppressAddProperties
      });
      if (!options.collection) {
        this.listenTo(this.metadataPropertiesView.allForms, 'sync', this._updateSchema);
      }
      this.listenTo(this.metadataPropertiesView, 'render:forms', this.setNameFieldFocus);
      this.propagateEventsToViews(this.metadataHeaderView, this.metadataPropertiesView);
    },

    // private
    _updateSchema: function() {
      // just update name schema in name field of header
      var generalForm = this.metadataPropertiesView.allForms.first(),
          formSchema = generalForm && generalForm.get('schema'),
          nameSchema = formSchema && formSchema.properties && formSchema.properties.name;
      if (nameSchema) {
        this.metadataHeaderView.metadataItemNameView.updateNameSchema(nameSchema);
      } else {
        log.warn('Form collection lacks name field in the first form.') && console.warn(log.last);
      }
    },

    // private
    onRender: function () {
      var inv = this.metadataHeaderView.render();
      var mdv = this.metadataPropertiesView.render();

      Marionette.triggerMethodOn(inv, 'before:show', inv, this);
      Marionette.triggerMethodOn(mdv, 'before:show', mdv, this);

      if (this.options.suppressHeaderView !== true) {
        this.$el.append(inv.el);
      }
      this.$el.append(mdv.el);

      if (this.options.suppressHeaderView) {
        this.$el.addClass('without-header-bar');
      }

      if (this.options.extraViewClass) {
        this.$el.addClass(this.options.extraViewClass);
      }

      Marionette.triggerMethodOn(inv, 'show', inv, this);
      Marionette.triggerMethodOn(mdv, 'show', mdv, this);
    },

    // private
    onBeforeDestroy: function () {
      this.cancelEventsToViewsPropagation(this.metadataHeaderView, this.metadataPropertiesView);
      this.metadataHeaderView.destroy();
      this.metadataPropertiesView.destroy();
    },

    // public
    validate: function () {
      var bNameIsValid = this.metadataHeaderView.validateName();
      var bFormsAreValid = this.metadataPropertiesView.validateForms();

      return bNameIsValid && bFormsAreValid;
    },

    // public
    getValues: function () {
      var data = {};
      var validation = this.validate();      
      var mlDataEnabled = base.getMetadataLanguageInfo().enabled,
      defaultLocale = base.getMetadataLanguageInfo().defaultLanguage;
      if (validation) {
        var itemName = this.metadataHeaderView.getNameValue(),
            metadataHeaderViewModel = this.metadataHeaderView && this.metadataHeaderView.model;
        data = {
          "name": itemName,
          "type": this.options.model.get('type'),
          "parent_id": this.options.model.get('parent_id')
        };
        if (metadataHeaderViewModel) {
          if (mlDataEnabled) {
            var mlData = {};
            !!metadataHeaderViewModel.has('name_multilingual') &&
            (mlData.name_multilingual = metadataHeaderViewModel.get('name_multilingual'));
            !!metadataHeaderViewModel.has('description_multilingual') &&
            (mlData.description_multilingual = metadataHeaderViewModel.get(
                'description_multilingual'));
            _.extend(data, mlData);
          }
        }

        var formsValues = this.metadataPropertiesView.getFormsValues();
        if(formsValues.description) {
         formsValues.description =  mlDataEnabled && _.isObject(formsValues.description) ?
                            formsValues.description[defaultLocale] : formsValues.description;
        }
        _.extend(data, formsValues);
      }

      return data;
    },

    // public
    setNameFieldFocus: function () {
      if (this.firstFocusCalled !== true && this.options.suppressHeaderView !== true) {
        this.metadataHeaderView.setNameEditModeFocus();
      }
      this.firstFocusCalled = true;
    },

    _saveItemName: function (args) {
      var itemName = args.sender.getValue();
      this.model.set('name', itemName, {silent: true});
      args.success && args.success();
    }

  });

  MetadataActionOneItemPropertiesView.version = "1.0";

  _.extend(MetadataActionOneItemPropertiesView.prototype, ViewEventsPropagationMixin);

  return MetadataActionOneItemPropertiesView;

});

csui.define('csui/widgets/metadata/impl/common/base.metadata.action.view',["csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone",
  "csui/controls/dialog/dialog.view", "csui/controls/progressblocker/blocker",
  "i18n!csui/widgets/metadata/impl/nls/lang", "css!csui/widgets/metadata/impl/metadata"
], function (_, $, Backbone, DialogView, BlockingView, lang) {

  function BaseMetadataActionView() {
  }

  _.extend(BaseMetadataActionView.prototype, Backbone.Events, {

    // public: display metadata view in either originatingView with animation or modal dialog
    // @parameter:
    // - options: {
    //    - originatingView: animate and show the form in the originating view
    //    - view: the view to show
    //    - dialogOptions: {
    //      - dialogTitle: dialog title
    //      - OkButtonTitle: the OK button title
    //      - OkButtonClick: method to handle the OkClick
    //      - CancelButtonTitle: (optional) the Cancel button title
    //      - CancelButtonClick: (optional) method to handle the CancelClick
    //    }
    // }
    baseDisplayForm: function (options) {
      options || (options = {});
      this.options = options;
      this.deferred = $.Deferred();

      if (options.view) {
        BlockingView.imbue(options.view);
      }

      // replace the originatingView with sliding left/right animation
      if (options.originatingView) {

        // TODO: UX and Josef will ask for this in the future, add this support when time permits

      } else {  // show Metadata View in a modal dialog

        var dialogOptions = options.dialogOptions || {};
        var okAction = dialogOptions.OkButtonClick || this._cancelAction;
        var cancelAction = dialogOptions.CancelButtonClick || this._cancelAction;
        var buttons = [
          {
            id: 'okButton',
            default: true,
            label: dialogOptions.OkButtonTitle ? dialogOptions.OkButtonTitle :
                   lang.defaultDialogOkButtonTitle,
            click: _.bind(okAction, this, options)
          },
          {
            id: 'cancel',
            label: dialogOptions.CancelButtonTitle ? dialogOptions.CancelButtonTitle :
              lang.defaultDialogCancelButtonTitle,
            close: true,
            click: _.bind(cancelAction, this),
            actionToken: dialogOptions.CancelButtonActionToken
          }
        ];
        if (this.options.view.model) {
          if (!(this.options.view.model.get('name'))) {
            buttons[0].disabled = true;
          }
        }
        var title = dialogOptions.dialogTitle ? dialogOptions.dialogTitle :
                    lang.defaultDialogTitle;
        var dialog = new DialogView({
          className: 'cs-item-action-metadata',
          title: title,
          buttons: buttons,
          largeSize: true,
          view: options.view
        });
        this.dialog = dialog;
        this.listenTo(this.dialog, "hide", this._cancelAction)
            .listenTo(this.dialog, "update:button", _.bind(function (args) {
              // Apply overlay[pointer-events:none] for button to prevent user interaction
              // until the respective action is performed instead of disabling the button
              // which may cause ambiguity
              if (args.overlay !== undefined) {
                var buttonModel = this.dialog.footerView.collection.get('okButton'),
                    button      = this.dialog.footerView.children.findByModel(buttonModel),
                    method      = button && !button.$el.is(":disabled") && args.overlay ?
                                  'addClass' : 'removeClass';
                button.$el[method]("cs-button-overlay");
              } else {
                this.dialog.footerView.updateButton('okButton', args);
              }
            }, this));

        dialog.show();

      }

      return this.deferred.promise();
    },

    // private
    _cancelAction: function (args) {
      var resetRequiredSwitch = !!this.node && !!this.node.collection &&
                                !!this.node.collection.requireSwitched &&
                                (!!this.node.get('action') ||
                                 (!!this.options.view && this.options.view.options.action));
      if (resetRequiredSwitch) {
        this.node.collection.requireSwitched = false;
      }
      if (this.options.view) {
        this.options.view.unblockActions();
      }
      this.dialog.destroy();

      // assume that the close button was clicked if args is undefined
      if (args === undefined) {
        args = {
          buttonAttributes: {
            actionToken: "closeMetadataActionView"
          }
        };
      }

      this.deferred.reject(args);
    }

  });

  BaseMetadataActionView.prototype.get = Backbone.Model.prototype.get;
  _.extend(BaseMetadataActionView, {version: "1.0"});

  return BaseMetadataActionView;

});

csui.define('csui/widgets/metadata/impl/add.properties/metadata.add.categories.view',['require', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/url',
  'csui/utils/log', 'csui/widgets/metadata/impl/common/base.metadata.action.view',
  'csui/models/forms', 'csui/models/appliedcategories/category', 'i18n!csui/widgets/metadata/impl/nls/lang',
  'csui/dialogs/modal.alert/modal.alert', 'css!csui/widgets/metadata/impl/metadata'
], function (require, _, $, Url, log, BaseMetadataActionView, FormCollection,
    CategoryModel, lang, ModalAlert) {
  'use strict';

  //
  // Metadata add categories view displays the category form for the user to fill out
  // categories values, validates the form and adds the category to the object when the user clicks
  // on the Add button.
  //
  function MetadataAddCategoriesView() {
  }

  _.extend(MetadataAddCategoriesView.prototype, BaseMetadataActionView.prototype, {

    displayForm: function (options) {
      var deferred = $.Deferred();
      var self = this;

      options || (options = {});
      this.node = options.model;
      this.catId = options.catId;
      this.catName = options.catName;

      var catCollection = new FormCollection([options.catModel]);
      catCollection.fetching = false;
      catCollection.fetched = true;

      csui.require(["csui/widgets/metadata/metadata.action.one.item.properties.view"
      ], function (MetadataActionOneItemPropertiesView) {

        self.metadataAddItemPropView = new MetadataActionOneItemPropertiesView({
          model: options.model,
          collection: catCollection,
          context: options.context,
          commands: options.commands,
          suppressAddProperties: true,
          suppressHeaderView: true,
          // send this flag to MetadataActionOneItemPropertiesView to hide sticky header.
          hideStickyHeader: true,
          extraViewClass: 'add-category'
        });

        var baseUIOptions = {};
        baseUIOptions.callerProcessData = options.callerProcessData;
        baseUIOptions.originatingView = options.originatingView;
        baseUIOptions.view = self.metadataAddItemPropView;
        var dialogOptions = {};
        dialogOptions.dialogTitle = options.dialogTitle ? options.dialogTitle :
                                    lang.addNewCategoryDialogTitle;
        dialogOptions.OkButtonTitle = options.okButtonTitle ? options.okButtonTitle :
                                      lang.addNewCategoryDialogAddButtonTitle;
        dialogOptions.OkButtonClick = self._addCategory;
        baseUIOptions.dialogOptions = dialogOptions;

        self.baseDisplayForm(baseUIOptions)
            .done(function (resp) {
              deferred.resolve(resp);
            })
            .fail(function (error2) {
              deferred.reject(error2);
            });

      }, function (error) {
        log.warn('Failed to load MetadataActionOneItemPropertiesView. {0}', error)
        && console.log(log.last);
        deferred.reject(error);
      });

      return deferred.promise();
    },

    // private
    _addCategory: function (args) {
      var valid = this.metadataAddItemPropView.validate();
      if (valid) {
        //generic error handling for all modules
        this.options.view.$el.find(".cs-formfield-invalid").removeClass('cs-formfield-invalid');
        var nodeId = this.node.get('id');
        var catData = this.metadataAddItemPropView.getValues();
        var data = {id: nodeId, category_id: this.catId};
        if (catData.roles && catData.roles.categories) {
          _.each(catData.roles.categories, function (cat, key) {
            data = _.extend(data, cat);
          });
        }

        var categoryModel = new CategoryModel({}, {connector: this.node.connector, node: this.node});

        this.metadataAddItemPropView.blockActions();
        categoryModel.save(data, {
          type: 'POST',
          processData: false,
          contentType: false
        }).done(_.bind(function (resp) {
              this.metadataAddItemPropView.unblockActions();
              this.dialog.destroy();
              this.deferred.resolve(resp);
            }, this))
            .fail(_.bind(function (error) {
              this.metadataAddItemPropView.unblockActions();
              var serverError = '';
              if (error && error.responseJSON && error.responseJSON.error) {
                serverError = error.responseJSON.error;
              }
              var title = lang.addNewCategoryFailTitle;
              var message = _.str.sformat(lang.addNewCategoryFailMessage,
                  this.catName, this.node.get('name'), nodeId, serverError);
              ModalAlert.showError(message, title);
            }, this));

      } else {
        //generic error handling for all modules
        this.options.view.$el.find(".binf-has-error .cs-formfield").addClass(
            'cs-formfield-invalid');

      }

    }

  });

  _.extend(MetadataAddCategoriesView, {version: "1.0"});

  return MetadataAddCategoriesView;

});

csui.define('csui/widgets/metadata/metadata.add.categories.controller',[
  'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/utils/url',
  'csui/utils/base', 'i18n!csui/widgets/metadata/impl/nls/lang',
  'csui/dialogs/modal.alert/modal.alert', 'csui/widgets/metadata/impl/metadata.utils',
  'csui/widgets/metadata/impl/add.properties/metadata.add.categories.view',
  'csui/models/appliedcategoryform', 'csui/dialogs/node.picker/node.picker',
  'csui/utils/commands', 'css!csui/widgets/metadata/impl/metadata'
], function (_, $, Backbone, Url, base, lang, ModalAlert,
    MetadataUtils, MetadataAddCategoriesView, AppliedCategoryFormModel,
    NodePicker, commands) {
  'use strict';

  //
  // Metadata add categories controller handles adding category to an existing item, a new item
  // being created or copied or moved.
  //

  function MetadataAddCategoriesController() {
  }

  _.extend(MetadataAddCategoriesController.prototype, Backbone.Events, {

    // Public: add category to an existing item, new item being created or copied or moved
    //
    // Parameters:
    // - <object> options containing:
    //   - action: the action 'create', 'copy', 'move', or undefined for an existing item
    //   - node: an existing or a temporary NodeModel for a new item being created with undefined id
    //   - collection: the existing category collection
    //   - container: the container where the item is/will be in
    //   - inheritance: the category inheritance 'original', 'destination' or 'merged'
    //   - context: the application context
    //   - parentView: the view to have blockingView on
    //
    // Return:
    // - <object> jQuery deferred object containing the new 'catModel' if succeeds
    //
    AddNewCategory: function (options) {
      var deferred = $.Deferred();
      var nodePicker = new NodePicker({
        startLocation: 'category.volume',
        context: options.context,
        selectableTypes: [131],
        unselectableNodes: !options.collection ? [] :
                           options.collection.where({role_name: "categories"}),
        selectMultiple: false,
        dialogTitle: lang.selectCategoryTitle,
        globalSearch: true,
        selectButtonLabel: lang.selectCategoryButtonLabel
      });
      nodePicker.show()
          .done(_.bind(function (args) {
            _.reduce(args.nodes, function (promise, node) {
                  return promise.then(_.bind(function () {
                    var catId = node.get('id');
                    var catName = node.get('name');

                    // with adding a new item, the object does not exist yet.  Just load the form.
                    if (options.node.get('id') === undefined || options.action) {
                      // load the category create form for the user to fill out values
                      return this._loadNewCategoryForm(options, catId, catName);
                    } else {
                      // code path new: display the form in a modal dialog with the Add button
                      return this._displayAddCategoryForm(options, catId, catName);
                    }
                  }, this));
                }, $.Deferred().resolve(), this)
                .done(function (resp3) {
                  deferred.resolve(resp3);
                })
                .fail(function (error3) {
                  deferred.reject(error3);
                });
          }, this))
          .fail(function (error2) {
            deferred.reject(error2);
          });

      return deferred.promise();
    },

    // private: display the form in a modal dialog with the Add button
    _displayAddCategoryForm: function (options, catId, catName) {
      var deferred = $.Deferred();
      var self = this;
      this._getCategoryModel(options, catId, catName)
          .done(function (resp) {
            var formOptions = {
              model: options.node,
              context: options.context,
              commands: commands,
              catId: catId,
              catName: catName, catModel: resp.catModel
            };
            var metadataAddCatView = new MetadataAddCategoriesView();
            metadataAddCatView.displayForm(formOptions)
                .done(function (resp2) {
                  self._loadNewCategoryForm(options, catId, catName, "update")
                      .done(function (resp3) {
                        deferred.resolve(resp3);
                      })
                      .fail(function (error3) {
                        deferred.reject(error3);
                      });
                })
                .fail(function (error2) {
                  deferred.reject(error2);
                });
          })
          .fail(function (error) {
            deferred.reject(error);
          });

      return deferred.promise();
    },

    // Private: load the category create form first for the user to fill out values
    _loadNewCategoryForm: function (options, catId, catName, formType) {
      if (catId && options.collection.get(catId)) {
        var title = lang.addNewCategoryFailTitle;
        var message = _.str.sformat(lang.categoryExistsMessage, catName);
        ModalAlert.showError(message, title);
        return $.Deferred().reject({});
      }

      var deferred = $.Deferred();
      this._getCategoryModel(options, catId, catName, formType)
          .done(_.bind(function (resp) {
            deferred.resolve(resp);
          }, this))
          .fail(function (error) {
            deferred.reject(error);
          });


      return deferred.promise();
    },

    // Private: get the category model
    _getCategoryModel: function (options, catId, catName, formType) {

      var allowDeleteCat = true;
      // default: formType = 'create'
      if (!formType) {
        formType = 'create';
        if (options.action === undefined) {
          allowDeleteCat = false;
        }
      }

      var deferred = $.Deferred();
      var fullUrl;
      var connector = (options.node && options.node.connector) ||
                      (options.container && options.container.connector);
      var nodeId = options.node.get('id');
      //TO:DO pId is passed to made it availabe in TKLFieldView need to fix as this temp fix
      if (options.container) {
        options.node.pId = options.container.get('id');
      }
      if (options.node.get('id') === undefined && options.action === 'create') {
        fullUrl = Url.combine(connector.connection.url,
            'forms/nodes/create?parent_id=' + options.container.get('id') +
            '&type=' + options.node.get('type') + '&category_id=' + catId);
      } else if (options.action === 'copy' || options.action === 'move' || options.action === 'restructure') {
        var inheritanceVal = 0;
        if (options.inheritance === 'destination') {
          inheritanceVal = 1;
        } else if (options.inheritance === 'merged') {
          inheritanceVal = 2;
        }
        fullUrl = Url.combine(connector.connection.url,
            'forms/nodes/' + options.action + '?id=' + nodeId +
            '&parent_id=' + options.container.get('id') +
            '&inheritance=' + inheritanceVal + '&category_id=' + catId);
      } else {
        fullUrl = Url.combine(connector.connection.url,
            'forms/nodes/categories/' + formType + '?id=' + nodeId +
            '&category_id=' + catId);
      }

      var ajaxOptions = {
        type: 'GET',
        url: fullUrl
      };
      if (options.parentView) {
        options.parentView.blockActions();
        //prevent pointer events on add button untill new category form is rendered
        options.parentView.trigger("update:button", true);
      }
      connector
          .makeAjaxCall(ajaxOptions)
          .done(_.bind(function (resp) {
            options.parentView && (options.parentView.unblockActions());

            // different calls have different data structure
            var categoryForm, categoryData, categoryOptions, categorySchema;
            if (options.action === 'create' ||
                options.action === 'copy' || options.action === 'move' || options.action === 'restructure') {
              if (resp.forms.length > 1) {
                categoryForm = _.find(resp.forms, function (form) {
                  return form.role_name === "categories";
                });
                if (categoryForm) {
                  categoryData = (categoryForm.data[catId]) || {};
                  categoryOptions = (categoryForm.options.fields[catId]) || {};
                  categorySchema = (categoryForm.schema.properties[catId]) || {};
                }
              }
            } else {
              categoryForm = resp && resp.forms && resp.forms[0];
              categoryData = (categoryForm && categoryForm.data) || {};
              categoryOptions = (categoryForm.options) || {};
              categorySchema = (categoryForm.schema) || {};
            }

            if (categoryForm) {
              if (categoryOptions.form) {
                categoryOptions = _.omit(categoryOptions, 'form');
              }
              if (categorySchema.title === undefined && catName) {
                categorySchema.title = catName;
              }

              var metadataUtils = new MetadataUtils();
              var required = metadataUtils.AlpacaFormOptionsSchemaHaveRequiredFields(categoryOptions,
                  categorySchema);

              var categoryModel = new AppliedCategoryFormModel({
                id: catId,
                title: catName || (categoryOptions && categoryOptions.fields && categoryOptions.fields.category_id &&
                                   categoryOptions.fields.category_id.label),
                allow_delete: allowDeleteCat,
                removeable: allowDeleteCat,
                required: required,
                data: categoryData,
                schema: _.omit(categorySchema, 'description'),
                options: categoryOptions,
                role_name: "categories"
              }, {
                node: options.node,
                categoryId: catId,
                action: 'none',
                parse: true
              });

              deferred.resolve({catModel: categoryModel});
            } else {
              deferred.reject({});
            }
          }, this))
          .fail(_.bind(function (error) {
            if (options.parentView) {
              options.parentView.unblockActions();
              options.parentView.trigger("update:button", false);
            }
            var serverError = this._getRespError(error);
            var title = lang.loadNewCategoryFailTitle;
            var message = _.str.sformat(lang.loadNewCategoryFailMessage,
                catName, options.node.get('name'), nodeId, serverError);
            ModalAlert.showError(message, title);
            deferred.reject(error);
          }, this));

      return deferred.promise();
    },

    // private
    _getRespError: function (resp) {
      var error = '';
      if (resp && resp.responseJSON && resp.responseJSON.error) {
        error = resp.responseJSON.error;
      } else if (base.MessageHelper.hasMessages()) {
        error = $(base.MessageHelper.toHtml()).text();
        base.MessageHelper.clear();
      }
      return error;
    }
  });

  _.extend(MetadataAddCategoriesController, {version: "1.0"});

  return MetadataAddCategoriesController;
});

csui.define('csui/widgets/metadata/metadata.add.item.controller',["csui/lib/underscore", "csui/widgets/metadata/impl/common/base.metadata.action.view",
  "csui/widgets/metadata/impl/metadata.controller",
  "csui/widgets/metadata/metadata.action.one.item.properties.view",
  "csui/utils/commandhelper", "i18n!csui/widgets/metadata/impl/nls/lang",
  "csui/dialogs/modal.alert/modal.alert", 'csui/utils/nodesprites',
  'csui/utils/commands', "css!csui/widgets/metadata/impl/metadata"
], function (_, BaseMetadataActionView, MetadataController,
    MetadataActionOneItemPropertiesView, CommandHelper, lang, ModalAlert,
    nodeSpriteCollection, commands) {

  //
  // Metadata Add Item Controller allows the adding of item with complete metadata
  // that the user can edit and change values of general metadata, categories and other roles.
  //

  function MetadataAddItemController() {
  }

  _.extend(MetadataAddItemController.prototype, BaseMetadataActionView.prototype, {

    // public (usually called from the 'command' class that has 'status' and 'options' parameters)
    displayForm: function (status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      var node = nodes.length > 0 ? nodes.models[0] : null;
      // Compute the type name only if the new node includes the type name
      // sent by the server, to be able to fall back to it
      var addableTypeName = node.get('type_name') ?
                            nodeSpriteCollection.findTypeByNode(node) :
                            lang.addItemMetadataDialogTitleGeneric;

      this.node = node;
      this.metadataController = options.metadataController;

      var addItemView = this.metadataAddItemPropView = new MetadataActionOneItemPropertiesView({
        model: node,
        container: status.container,
        id: options.id,
        context: status.context || options && options.context,
        commands: commands,
        action: 'create',
        inheritance: options.inheritance,
        // Performs the complete fetch and preparation of the creation forms
        collection: options.completeFormCollection,
        // Performs just fetch; the preparation is performed by the csui forms collection
        formCollection: options.formCollection,
        //supress Add Category for custom node, adding ability to create Hold Groups in the new Hold Management perspective tile
        suppressAddProperties: options.suppressAddProperties
      });
      var baseUIOptions = {};
      baseUIOptions.callerProcessData = options.callerProcessData;
      baseUIOptions.originatingView = options.originatingView;
      baseUIOptions.view = addItemView;
      var dialogOptions = {};
      dialogOptions.dialogTitle = options.dialogTitle ? options.dialogTitle :
                                  _.str.sformat(lang.addItemMetadataDialogTitle1, addableTypeName);
      dialogOptions.OkButtonTitle = options.addButtonTitle ? options.addButtonTitle :
                                    lang.addItemMetadataDialogButtonAddTitle;
      dialogOptions.OkButtonClick = this._addItem;
      dialogOptions.CancelButtonActionToken = options.cancelButtonActionToken;
      baseUIOptions.dialogOptions = dialogOptions;

      var deferred = this.baseDisplayForm(baseUIOptions);
      this.listenTo(this.metadataAddItemPropView, "update:button", _.bind(function (args) {
        this.dialog && this.dialog.trigger("update:button", args);
      }, this));

      return deferred;
    },

    // private
    _addItem: function (args) {
      function updateButtons(dialog, attributes) {
        if (dialog && dialog.footerView) {
          dialog.footerView.getButtons().forEach(function (buttonView) {
            buttonView.updateButton(attributes);
          });
        }
      }

      if (!!args.view.metadataPropertiesView.allFormsRendered) {
        var enable = false;
        if (args.callerProcessData !== true) {
          updateButtons(this.dialog, {disabled: true});
          enable = true;
        }
        var valid = this.metadataAddItemPropView.validate();
        if (valid) {
          var data = this.metadataAddItemPropView.getValues();

          if (args.callerProcessData === true) {
            this.dialog.destroy();
            this.deferred.resolve({data: data});
          } else {
            var metadataController = this.metadataController ||
                                     new MetadataController();

            this.metadataAddItemPropView.blockActions();
            enable = false;
            metadataController.createItem(this.node, data)
                .done(_.bind(function (resp) {
                  this.listenToOnce(this.dialog, "hide", function () {
                    this.metadataAddItemPropView.unblockActions();
                    updateButtons(this.dialog, {disabled: false});
                  });
                  this.dialog.destroy();
                  this.deferred.resolve({name: data.name});
                }, this))
                .fail(_.bind(function (resp) {
                  this.metadataAddItemPropView.unblockActions();
                  var error = lang.failedToCreateItem;
                  if (resp) {
                    if (resp.responseJSON && resp.responseJSON.error) {
                      error = resp.responseJSON.error;
                    } else if (resp.responseText) {
                      error = resp.responseText;
                    }
                    ModalAlert.showError(error);
                  }
                  updateButtons(this.dialog, {disabled: false});
                }, this));
          }
        }
        if (enable) {
          updateButtons(this.dialog, {disabled: false});
        }
      }
    }

  });

  _.extend(MetadataAddItemController, {version: "1.0"});

  return MetadataAddItemController;

});

csui.define('csui/widgets/metadata/impl/metadata.navigation.list.keyboard.behavior',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/utils/log', 'csui/lib/marionette'
], function (module, _, $, log, Marionette) {
  'use strict';

  // This behavior implements a default keyboard navigation for the metadata navigation list.

  var TabPosition = {
    none: -1,
    header: 0,
    list: 1
  };

  var MetadataNavigationListKeyboardBehavior = Marionette.Behavior.extend({

    constructor: function MetadataNavigationListKeyboardBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      view.keyboardBehavior = this;
      this.tabableElements = [];

      var self = this;
      this.listenTo(view, 'show', function () {
        self.refreshTabableElements(view);
      });
      this.listenTo(view, 'click:item', function (item) {
        // clear the currently focused element
        var selIndex = view.selectedIndex;
        var selectedElem = view.selectedIndexElem(selIndex);
        selectedElem && selectedElem.prop('tabindex', '-1');
        // set the new element tabindex
        view.currentTabPosition = TabPosition.list;
        view.selectedIndex = view.collection.indexOf(item.model);
      });

      _.extend(view, {

        _focusHeader: function () {
          if (this.headerFocusable === true && this.headerElement) {
            this.currentTabPosition = TabPosition.header;
            return $(this.ui.header);
          }
          return undefined;
        },

        _focusList: function () {
          if (this.selectedIndex < 0 || this.selectedIndex === undefined) {
            this.selectedIndex = this.getSelectedIndex();
          }
          this.currentTabPosition = TabPosition.list;
          return this.getSelectedItem() && this.getSelectedItem().$el;
        },

        _setFocus: function () {
          if (this.headerFocusable === true && this.headerElement) {
            return this._focusHeader();
          } else {
            return this._focusList();
          }
        },

        _headerIsInFocus: function () {
          return this.$(this.ui.header).is(":focus");
        },

        _listIsInFocus: function () {
          var inFocus = false;
          var i;
          for (i = 0; i < this.collection.length; i++) {
            var $elem = this.selectedIndexElem(i);
            if ($elem && $elem.is(":focus")) {
              inFocus = true;
              break;
            }
          }

          return inFocus;
        },

        _checkFocusAndSetCurrentTabPosition: function () {
          if (this._headerIsInFocus()) {
            this.currentTabPosition = TabPosition.header;
          } else if (this._listIsInFocus()) {
            this.currentTabPosition = TabPosition.list;
          } else {
            this.currentTabPosition = TabPosition.none;
          }
        },

        // handle scenario that currentlyFocusedElement does not have event param for shiftTab
        _setFirstAndLastFocusable: function () {
          if (this.headerFocusable === true) {
            $(this.ui.header).prop('tabindex', '0');
          }
          this.getSelectedItem() && this.getSelectedItem().$el.prop('tabindex', '0');
        },

        currentlyFocusedElement: function (event) {
          this._checkFocusAndSetCurrentTabPosition();
          this._setFirstAndLastFocusable();
          if (event && event.shiftKey) {
            return this._focusList();
          }
          // maintain old position
          if (this.currentTabPosition === TabPosition.header) {
            return this._focusHeader();
          } else if (this.currentTabPosition === TabPosition.list) {
            return this._focusList();
          } else {
            return this._setFocus();
          }
        },

        _resetFocusedListElem: function () {
          // workaround the general behaviors that it keeps the old focus
          // reset focus back to the active list item before moving out of the region
          var selIndex, selectedElem;

          // clear the currently focused element
          selIndex = this.selectedIndex;
          selectedElem = this.selectedIndexElem(selIndex);
          selectedElem && selectedElem.prop('tabindex', '-1');

          // set to the active element
          selIndex = this.getSelectedIndex();
          selectedElem = this.selectedIndexElem(selIndex);
          if (selectedElem) {
            selectedElem.prop('tabindex', '0');
            this.selectedIndex = selIndex;
          }

          // always have the header focusable
          $(this.ui.header).prop('tabindex', '0');
        },

        _moveTo: function (event, $elem, $preElem) {
          event.preventDefault();
          event.stopPropagation();
          // this.trigger('changed:focus', this);
          setTimeout(_.bind(function () {
            $preElem && $preElem.prop('tabindex', '-1');
            $elem.prop('tabindex', '0');
            $elem[0].focus();
          }, this), 50);
        },

        onKeyInView: function (event) {
          this._checkFocusAndSetCurrentTabPosition();
          if (event.keyCode === 9) {
            // tab
            if (event.shiftKey) {  // shift tab -> activate previous region
              if (this.currentTabPosition === TabPosition.list &&
                  this.headerFocusable === true && this.headerElement) {
                if ($(this.ui.header).is(":visible")) {
                  this._moveTo(event, this._focusHeader());
                  this._resetFocusedListElem();
                }
              }
            } else {
              if (this.currentTabPosition === TabPosition.header) {
                if (this.$el.find(">.cs-content").is(":visible")) {
                  this._moveTo(event, this._focusList());
                }
              } else {
                setTimeout(_.bind(function () {
                  this._resetFocusedListElem();
                }, this), 50);
              }
            }
          } else if (event.keyCode === 32 || event.keyCode === 13) {
            // space(32) or enter(13)
            if (this.currentTabPosition === TabPosition.header) {
              event.preventDefault();
              event.stopPropagation();
              this.clickBack();
            } else if (this.currentTabPosition === TabPosition.list) {
              event.preventDefault();
              event.stopPropagation();
              this.selectAt(this.selectedIndex);
            }
          }
        },

        onKeyDown: function (event) {
          this._checkFocusAndSetCurrentTabPosition();
          if (this.currentTabPosition !== TabPosition.list) {
            this.onKeyInView(event);
            return;
          }

          var selIndex = this.selectedIndex;
          if (selIndex < 0 || selIndex === undefined) {
            selIndex = this.getSelectedIndex();
          }
          var $preElem = this.selectedIndexElem(selIndex);

          switch (event.which) {
          case 33: // page up
            this._moveTo(event, this._selectFirst(), $preElem);
            break;
          case 34: // page down
            this._moveTo(event, this._selectLast(), $preElem);
            break;
          case 38: // up
            this._moveTo(event, this._selectPrevious(), $preElem);
            break;
          case 40: // down
            this._moveTo(event, this._selectNext(), $preElem);
            break;
          default:
            this.onKeyInView(event);
            return; // exit this handler for other keys
          }
        },

        _selectFirst: function () {
          this.selectedIndex = 0;
          return this.selectedIndexElem(this.selectedIndex);
        },

        _selectLast: function () {
          this.selectedIndex = this.collection.length - 1;
          return this.selectedIndexElem(this.selectedIndex);
        },

        _selectNext: function () {
          if (this.selectedIndex < 0 || this.selectedIndex === undefined) {
            this.selectedIndex = this.getSelectedIndex();
          }
          if (this.selectedIndex < this.collection.length - 1) {
            this.selectedIndex++;
          }
          return this.selectedIndexElem(this.selectedIndex);
        },

        _selectPrevious: function () {
          if (this.selectedIndex < 0 || this.selectedIndex === undefined) {
            this.selectedIndex = this.getSelectedIndex();
          }
          if (this.selectedIndex > 0) {
            this.selectedIndex--;
          }
          return this.selectedIndexElem(this.selectedIndex);
        },

        selectAt: function (index) {
          if (index >= this.collection.length || index < 0) {
            return;
          }
          var $elem = this.selectedIndexElem(index);
          $elem && $elem.trigger('click');
        }

      });

    }, // constructor

    refreshTabableElements: function (view) {
      log.debug('MetadataNavigationListKeyboardBehavior::refreshTabableElements ' +
                view.constructor.name) &&
      console.log(log.last);
      if (view.options.data.back_button) {
        this.view.headerFocusable = true;
        this.view.headerElement = view.ui.header;
      }
      this.view.currentTabPosition = TabPosition.none;
      this.view.selectedIndex = -1;
    }

  });

  return MetadataNavigationListKeyboardBehavior;
});

csui.define('csui/widgets/metadata/impl/metadata.navigation.list.view',['csui/lib/underscore', 'csui/lib/jquery',
  'csui/controls/list/simplelist.view',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/metadata/impl/metadata.navigation.list.keyboard.behavior',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/models/version',
  'i18n!csui/widgets/metadata/impl/nls/lang'
], function (_, $,
    SimpleListView,
    TabableRegionBehavior,
    MetadataNavigationListKeyboardBehavior,
    NodeTypeIconView,
    VersionModel,
    lang) {

  var MetadataNavigationListView = SimpleListView.extend({

    childViewOptions: function (model) {
      return {
        templateHelpers: function () {
          var nameAttribute = this.options.nameAttribute || 'name';
          return {enableIcon: true, name: this.model.get(nameAttribute)};
        },
        nameAttribute: this.options.data.nameAttribute,
        childRole: this.options.data.childRole
      };
    },

    events: {
      'keydown': 'onKeyDown'
    },

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior,
        initialActivationWeight: 100
      },
      MetadataNavigationListKeyboardBehavior: {
        behaviorClass: MetadataNavigationListKeyboardBehavior
      }
    },

    constructor: function MetadataNavigationListView(options) {
      this.options = options || {};
      this.events = _.extend({}, SimpleListView.prototype.events, this.events);
      SimpleListView.apply(this, arguments);

      // Do not use childEvents, because SimpleListView does it and our property
      // would overwrite their value and disable their event handlers
      this.listenTo(this, 'childview:render', this.onRenderItem);
      this.listenTo(this, 'childview:before:destroy', this.onBeforeDestroyItem);
    },

    onRenderItem: function (childView) {
      // for version metadata, show the version number in place of the icon
      if (childView.model instanceof VersionModel) {
        var verNum = childView.model.get('version_number_name');
        $(childView.$('.csui-type-icon').get(0)).append(
            "<span title='" + verNum + "' class='list-item-version'>" + verNum + "</span>"
        );
      } else {
        // Checking for ThumbnailView
        if ((this.options && this.options.isThumbnailView) ||
            (this.options.originatingView && this.options.originatingView.thumbnailView)) {
          this.$el.addClass("csui-metadata-navigation-thumbnail");
          childView.model.attributes.image_url = childView.model.get('csuiThumbnailImageUrl');
        } else {
          this.$el.find(".csui-metadata-navigation-thumbnail").removeClass(
              "csui-metadata-navigation-thumbnail");
        }
        childView._nodeIconView = new NodeTypeIconView({
          el: childView.$('.csui-type-icon').get(0),
          node: childView.model
        });
        childView._nodeIconView.render();
      }

      // show a red star if the model has enforced required attribute
      var show_required = this.options.data && this.options.data.show_required === true;
      var enforcedRequire = childView.model && childView.model.options &&
                            childView.model.options.enforcedRequiredAttrs === true;
      if (show_required && enforcedRequire) {
        var titleEl = childView.$('.list-item-title').get(0);
        if (titleEl) {
          var cssClasses, tooltip;
          if (childView.model.validated === true) {
            // change the star to green checkmark if the model passed validation
            cssClasses = 'cs-icon-required category_required_done';
            tooltip = lang.requiredPassedTooltip;
          } else {
            //show red star icon for required attributes to be filled
            cssClasses = 'cs-icon-required category_required';
            tooltip = lang.requiredTooltip;
          }
          $(titleEl).before("<span class='" + cssClasses + "' aria-label='" + tooltip +
                            "' title='" + tooltip + "'></span>");
        }
      }
    },

    onBeforeDestroyItem: function (childView) {
      if (childView._nodeIconView) {
        childView._nodeIconView.destroy();
      }
    }

  });

  return MetadataNavigationListView;

});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/common/metadata.action.multiple.items',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"metadata-wrapper binf-col-md-12\">\r\n  <div class=\"metadata-navigation\">\r\n    <div class=\"metadata-sidebar\"></div>\r\n    <div class=\"metadata-content\"></div>\r\n  </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_common_metadata.action.multiple.items', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/metadata/impl/metadata.navigation.list.behavior',['csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette'
], function (_, $, Backbone, Marionette) {
  'use strict';

  // This behavior provides shared functionality for the metadata navigation list.

  var MetadataNavigationListBehavior = Marionette.Behavior.extend({

    constructor: function MetadataNavigationListBehavior(options, view) {
      Marionette.Behavior.prototype.constructor.apply(this, arguments);

      _.extend(view, {

        onBeforeShow: function () {
          this._showChildViews();
        },
        onShow: function () {
          this._showScrollPosition();
        },
        onBeforeDestroy: function () {
          if (this.mdv && this.mdv.internal) {
            this.mdv.destroy();
          }
          if (this.mdn) {
            this.mdn.destroy();
          }
        },

        _showChildViews: function () {
          this.navigationRegion.show(this.mdn);
          this.contentRegion.show(this.mdv);
        },

        _showScrollPosition: function () {
          if (this.initiallySelected instanceof Backbone.Model) {
            var index = this.mdn.collection.findIndex({id: this.initiallySelected.get('id')});
            (index < 0 || index > this.mdn.collection.length - 1) && (index = 0);
            return this.mdn.setSelectedIndex(index);
          } else if (this.initiallySelected && this.initiallySelected.length > 0) {
            var firstSelected = this.initiallySelected.models[0];
            var selIndex = this.mdn.collection.indexOf(firstSelected);
            if (selIndex === -1) {
              selIndex = this.mdn.collection.findIndex({id: firstSelected.get('id')});
            }
            this.mdn.setSelectedIndex(selIndex);
          } else {
            if (this.mdn.collection.models.length > 0) {
              this.mdn.setSelectedIndex(0);
            }
          }

        }
      });

    } // constructor

  });

  return MetadataNavigationListBehavior;
});


csui.define('css!csui/widgets/metadata/impl/common/metadata.action.multiple.items',[],function(){});
csui.define('csui/widgets/metadata/impl/common/metadata.action.multiple.items.view',['csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/widgets/metadata/impl/metadata.navigation.list.view',
  'csui/widgets/metadata/metadata.action.one.item.properties.view',
  'hbs!csui/widgets/metadata/impl/common/metadata.action.multiple.items',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/widgets/metadata/impl/metadata.navigation.list.behavior', "csui/lib/jsonpath",
  'css!csui/widgets/metadata/impl/common/metadata.action.multiple.items'
], function (_, Backbone, Marionette, MetadataNavigationListView,
    MetadataActionOneItemPropertiesView, template, LayoutViewEventsPropagationMixin,
    MetadataNavigationListBehavior, jsonPath) {

  var MetadataActionMultipleItemsView = Marionette.LayoutView.extend({

    className: 'cs-metadata-add-items',
    template: template,

    regions: {
      navigationRegion: ".metadata-sidebar",
      contentRegion: ".metadata-content"
    },

    behaviors: {
      MetadataNavigationListBehavior: {
        behaviorClass: MetadataNavigationListBehavior
      }
    },

    constructor: function MetadataActionMultipleItemsView(options) {
      options || (options = {});
      this.options = options;
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);

      this.collection = options.collection;
      this.container = options.container;
      this.context = options.context;
      this.originatingView = options.originatingView;
      this.initiallySelected = this.options.selected;
      this.commonCategories = options.commonCategories;
      this.initialFormData = options.initialFormData;
      this.requiredFields = [];

      var initiallySelectedModel = this._getInitiallySelectedModel();
      if (options.applyFlag) {
        initiallySelectedModel.set("applyFlag", options.applyFlag);
      }

      this.mdv = new MetadataActionOneItemPropertiesView({
        model: initiallySelectedModel,
        container: this.container,
        context: this.context,
        commands: options.commands,
        originatingView: this.originatingView,
        action: options.action,
        inheritance: options.inheritance
      });
      this.mdv.internal = true;
      this._subscribeToMetadataViewEvents();

      this.mdn = new MetadataNavigationListView({
        collection: options.collection,
        data: {
          back_button: false,
          title: '',
          show_required: true
        }
      });
      //Set the Initial categories to all uploadable files
      if (options.applyFlag) {
        this.setInitialCategories();
      }
      this.listenTo(this.mdn, 'click:item', this.onClickItem);
      this.listenTo(this.mdn, 'click:back', this.onClickBack);
      this.listenTo(this.mdn, 'show:node', function (args) {
        this._showNode(args.model);
      });
      this.propagateEventsToRegions();
    },

    _getInitiallySelectedModel: function () {
      if (this.initiallySelected && this.initiallySelected.length > 0) {
        return this.initiallySelected.models[0];
      } else if (this.collection && this.collection.length > 0) {
        return this.collection.models[0];
      } else {
        return null;
      }
    },

    onClickItem: function (item) {
      var valid = this.validateAndSetValuesToNode();
      if (valid) {
        this._showNode(item.model);
      } else {
        item.cancelClick = true;
      }
    },

    // set initial category values to all Alpaca forms
    setInitialCategories: function () {
      var that = this;
      _.each(this.mdn.collection.models, function (model) {
        var attr = {};
        if(model.get("data") === undefined){
          if(model.get("type") === 0 || model.get('container')){
            attr.type = model.get("type") || 0;
            attr.container = model.get("container") || true;
          }else {
            attr.advanced_versioning = false;
            attr.mime_type = model.get("mime_type");
            attr.type = model.get("type") || 144;
          }
          attr.name = model.get("newName") || model.get("name");
          attr.parent_id = this.mdv.options.container.get("id");
          _.extend(attr, JSON.parse(JSON.stringify(that.commonCategories)));
        }
        model.set('data', attr);
      }, this);

    },

    getRequiredFields: function () {
      var formValues = {},
          that       = this;
      that.requiredFields = [];
      if (this.initialFormData && this.initialFormData.models) {
        _.each(this.initialFormData.models, function (tab, key) {
          var values   = tab.get("data"),
              roleName = tab.get("role_name"),
              options  = tab.get('options'),
              schema   = tab.get('schema'),
              roles, role, category;

          if (values) {
            if (roleName) {
              roles = formValues.roles || (formValues.roles = {});
              role = roles[roleName] || (roles[roleName] = {});
              if (roleName === 'categories') {
                var requiredFields = jsonPath(schema, "$..[?(@.required===true)]",
                    {resultType: "PATH"});
                var nonValidateFields = jsonPath(options, "$..[?(@.validate===false)]",
                    {resultType: "PATH"});

                // getting field id for non validate fields
                var nonValidateFieldsIds = [];
                _.each(nonValidateFields, function (nvField) {
                  var matches = nvField.toString().match(/(\'[\w]*\')/g);
                  if (!!matches) {
                    nonValidateFieldsIds.push(matches[matches.length - 1].replace(/'/g, ""));
                  }
                });

                // getting field id for Required Fields
                var reqFieldId = [];
                _.each(requiredFields, function (reqField) {
                  var matches = reqField.toString().match(/(\'[\w]*\')/g);
                  if (!!matches) {
                    reqFieldId.push(matches[matches.length - 1].replace(/'/g, ""));
                  }
                });

                // eliminating non validating fields from required field ids.
                reqFieldId = reqFieldId.filter(function (n) {
                  // Eliminate if validation not required.
                  return nonValidateFieldsIds.indexOf(n) === -1;
                });
                if (reqFieldId.length > 0) {
                  that.requiredFields.push(reqFieldId);
                }
              }
            }
          }
        });
      }
    },

    validateAndSetValuesToAllNode: function () {
      var that           = this,
          requiredFields = {},
          valid          = true;
      var formsValid = true;
      this.getRequiredFields();
      _.each(this.mdn.collection.models, _.bind(function (form) {
        var data = form.get('data');
        _.each(data.roles.categories, function (category) {
          valid = valid && that._checkForAlpacaRequiredFields(form, category);
        });
        form.validated = valid;
        formsValid = formsValid && valid;
      }, this));
      return formsValid;
    },

    // private
    _checkForAlpacaRequiredFields: function (form, category) {
      var valid    = true,
          reqArray = [];
      if (!!this.requiredFields) {
        var nullCount = false;
        _.each(this.requiredFields, function (arrayElement) {
          reqArray = jsonPath(category, "$.." + arrayElement.toString(),
              {resultType: "PATH"}.toArray);
          _.each(reqArray, function (arrayElement) {
            var checkNull = function (element) {
              if (element instanceof Array && (element !== null || element !== "")) {
                _.each(element, function (childElement) {
                  checkNull(childElement);
                });
              } else if (element === null || element === "") {
                nullCount = true;
                return;
              }
            };
            if (!nullCount) {
              checkNull(arrayElement);
            } else {
              valid = false;
              return;
            }
          });
          if (nullCount) {
            valid = false;
            return;
          }
        });
      }
      return valid;
    },

    // public: validate the current form and set values to node if valid.
    //         returns true if form is valid; otherwise, false.
    validateAndSetValuesToNode: function () {
      var item = this.mdn.getSelectedItem();
      var valid = this.mdv.validate();
      if (valid) {
        var data = this.mdv.getValues();
        // store the newly added categories data
        if (item.model.newCategories.models.length > 0) {
          _.each(item.model.newCategories.models, function (catModel) {
            var catId = catModel.get('id');
            var roleName = catModel.get('role_name');
            var catData = {};
            if (data && data.roles && data.roles[roleName]) {
              catData = data.roles[roleName];
            }
            if (_.isEmpty(catData[catId]) === false) {
              _.each(catModel.attributes.data, function (iValue, iKey) {
                if (_.has(catData[catId], iKey)) {
                  catModel.attributes.data[iKey] = catData[catId][iKey];
                }
              });
            }
          });
        }
        item.model.validated = true;
        item.model.set('data', data);  // intentionally trigger the set to redraw list item
        return true;
      }
      if (!!this.mdv.metadataPropertiesView.allFormsRendered) {
        item.model.validated = false;
        item.model.trigger('change', item.model); // intentionally trigger the set to redraw list item
      }
      return false;
    },

    onClickBack: function () {
      this.trigger("metadata:close", {sender: this});
    },

    onItemNameChanged: function (newName) {
      var selectedItem  = this.mdn.getSelectedItem(),
          selectedIndex = this.mdn.getSelectedIndex();

      selectedItem.render(); // name has been set silently
      this.mdn.setSelectedIndex(selectedIndex);
    },

    _showNode: function (model) {
      if (this.mdv && this.mdv.internal) {
        this.mdv.destroy();
      }
      model.set("applyFlag", this.options.applyFlag);
      this.mdv = new MetadataActionOneItemPropertiesView({
        model: model,
        container: this.container,
        context: this.context,
        originatingView: this.originatingView,
        action: this.options.action,
        inheritance: this.options.inheritance
      });
      this.mdv.internal = true;
      this._subscribeToMetadataViewEvents();
      this.contentRegion.show(this.mdv);
    },

    _subscribeToMetadataViewEvents: function () {
      this.listenTo(this.mdv, 'metadata:close',
          _.bind(function () {
            this.trigger("metadata:close", {sender: this});
          }, this));
      this.listenTo(this.mdv, 'item:name:changed', _.bind(this.onItemNameChanged, this));
    }

  });

  _.extend(MetadataActionMultipleItemsView.prototype, LayoutViewEventsPropagationMixin);

  return MetadataActionMultipleItemsView;

});

csui.define('csui/widgets/metadata/impl/add.items/metadata.add.multiple.items.controller',["csui/lib/underscore", "csui/widgets/metadata/impl/common/base.metadata.action.view",
  "csui/models/node/node.model", "csui/controls/dialog/dialog.view",
  "csui/widgets/metadata/impl/common/metadata.action.multiple.items.view",
  "i18n!csui/widgets/metadata/impl/nls/lang", "csui/dialogs/modal.alert/modal.alert",
  'csui/utils/commands',
  "css!csui/widgets/metadata/impl/metadata", "csui/utils/deepClone/deepClone"
], function (_, BaseMetadataActionView, NodeModel, DialogView,
    MetadataActionMultipleItemsView, lang, ModalAlert, commands) {

  function MetadataAddMultipleItemsController() {
  }

  _.extend(MetadataAddMultipleItemsController.prototype, BaseMetadataActionView.prototype, {

    // public
    displayForm: function (status, options) {

      var applyFlag        = false,
          commonCategories = this._getCommonCategories(options);
      if (options.initialFormData && options.initialFormData.models &&
          options.initialFormData.models.length > 1) {
        applyFlag = true;
      }
      this.metadataAddItems = new MetadataActionMultipleItemsView({
        container: options.container,
        collection: status.nodes,
        selected: status.nodes,
        action: 'create',
        originatingView: options.originatingView,
        context: options.context,
        commands: commands,
        commonCategories: commonCategories,
        applyFlag: applyFlag,
        initialFormData: options.initialFormData
      });

      this.listenTo(this.metadataAddItems, "metadata:add", _.bind(function () {
        this.deferred.resolve();
      }, this));

      var baseUIOptions = {};
      baseUIOptions.originatingView = options.originatingView;
      baseUIOptions.view = this.metadataAddItems;
      var dialogOptions = {};
      dialogOptions.dialogTitle = options.dialogTitle ? options.dialogTitle :
                                  lang.addItemsMetadataDialogTitle;
      dialogOptions.OkButtonTitle = options.addButtonTitle ? options.addButtonTitle :
                                    lang.addDocumentMetadataDialogAddButtonTitle;
      dialogOptions.OkButtonClick = this._addItems;
      baseUIOptions.dialogOptions = dialogOptions;

      return this.baseDisplayForm(baseUIOptions);

    },

    _getCommonCategories: function (options) {
      var formValues = {},
          that       = this;
      if (options.initialFormData && options.initialFormData.models) {
        _.each(options.initialFormData.models, function (tab, key) {
          var values   = tab.get("data"),
              roleName = tab.get("role_name"),
              options  = tab.get('options'),
              schema   = tab.get('schema'),
              roles, role, category;

          if (values) {
            if (roleName) {
              roles = formValues.roles || (formValues.roles = {});
              role = roles[roleName] || (roles[roleName] = {});
              if (roleName === 'categories') {
                // For categories, merge the properties to the
                // roles.categories.<category_id> object
                var catId = tab.get("id").toString();
                category = role[catId] || (role[catId] = {});
                // when attributes are not set, the server deletes
                // the category unless it is set to null
                if (_.isEmpty(values)) {
                  category = null;
                } else {
                  //Replace null values with empty string
                  values = JSON.parse(JSON.stringify(values).replace(/null/g, "\"\""));
                  _.extend(category, values);
                }
              } else {
                // With a role defined, merge the properties to the
                // roles.<role_name> object
                //TODO: uncomment this once classifications are displayed on upload dialog
                //_.extend(role, values);
              }
            }
          }
        });
      }
      return formValues;
    },

    // private
    _addItems: function (args) {
      if (args.view.mdv && args.view.mdv.metadataPropertiesView &&
          args.view.mdv.metadataPropertiesView.allFormsRendered) {
        var valid = this.metadataAddItems.validateAndSetValuesToNode();
        if (valid) {
          //generic error handling for all modules
          this.options.view.$el.find(".cs-formfield-invalid").removeClass('cs-formfield-invalid');
          var allValid = true;
          this.metadataAddItems.validateAndSetValuesToAllNode();
          this.metadataAddItems.collection.forEach(function (model) {
            allValid = allValid && (model.validated ? true : false);
          });
          if (allValid) {
            this.metadataAddItems.collection.forEach(function (model) {
              var data = model.get('data');
              var item = model.get('itemObject') || model.get('fileObject');
              var extended_data = model.get('extended_data');

              if (data && item) {
                var extendedData = {};
                item.set('newName', data.name);
                if (!!data.name_multilingual) {
                  item.set('name_multilingual', data.name_multilingual);
                  item.set('multilingual_provided', true);
                }
                if (data.description !== undefined) {
                  extendedData.description = data.description;
                  !!data.description_multilingual &&
                  (extendedData.description_multilingual = data.description_multilingual);
                }
                if (data.advanced_versioning !== undefined) {
                  extendedData.advanced_versioning = data.advanced_versioning;
                }
                if (data.roles) {
                  extendedData.roles = _.deepClone(data.roles);
                }
                if (_.isEmpty(extendedData) === false) {
                  _.extend(extended_data, extendedData);
                }
              }
            });
            this.dialog.destroy();
            this.deferred.resolve();
          } else {
            var title = lang.defaultDialogTitle;
            var message = lang.missingRequiredMetadataForObjects;
            ModalAlert.showError(message, title);
          }
        } else {
          //generic error handling for all modules
          this.options.view.$el.find(".binf-has-error .cs-formfield").addClass(
              'cs-formfield-invalid');
        }
      }
    }

  });

  _.extend(MetadataAddMultipleItemsController, {version: "1.0"});

  return MetadataAddMultipleItemsController;

});

/**
 * this is exclusively for documents and folders
 */
csui.define('csui/widgets/metadata/impl/add.items/metadata.add.item.controller',["csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone",
  "csui/models/nodes", "csui/models/node/node.model",
  "csui/widgets/metadata/metadata.add.item.controller",
  "csui/widgets/metadata/impl/metadata.utils",
  "csui/widgets/metadata/impl/add.items/metadata.add.multiple.items.controller",
  "i18n!csui/widgets/metadata/impl/nls/lang", "csui/utils/deepClone/deepClone"
], function (_, $, Backbone, NodeCollection, NodeModel, MetadataAddOneItemController, MetadataUtils,
    MetadataAddMultipleItemsController, lang) {
  'use strict';

  function MetadataAddItemController() {
  }

  _.extend(MetadataAddItemController.prototype, Backbone.Events, {

    addItemsRequiredMetadata: function (items, options) {

      // 'original' does not need checking
      if (options.openMetadata !== true && options.inheritance === 'original') {
        return $.Deferred().resolve();
      }

      var deferred      = $.Deferred(),
          file          = _.find(items, function (item) {
                return item.get('newVersion') === undefined;
              }) || items[0],
          tempName      = items.length > 0 ? items[0].get('name') : 'temp_name',

          utilOptions   = {
            action: 'create',
            name: tempName,
            items: items,
            container: options.container,
            context: options.container.context,
            collection: options.collection,
            docParentId: items.length > 0 ? file.get('id') : null,
            addableType: options.addableType != undefined ? options.addableType : 144
            // this is tweak to get validate required attrs for folders also,
            // since by default container won't ask to fill all req attrs,
            // while drag and drop folders we have to fill else uploading sub level files fails
          },
          metadataUtils = new MetadataUtils(),
          newFiles      = $.grep(items, function (item) {
            return item.get('newVersion') === undefined;
          }); //Collection might contain new versions of existing items, remove such items

      metadataUtils.ContainerHasEnforcedEmptyRequiredMetadata(utilOptions)
          .done(_.bind(function (resp) {
            if (resp.hasRequiredMetadata === true) {
              // if the container has empty required metadata.
              var metadataDeferred = $.Deferred();
              if (newFiles && newFiles.length === 1) {
                // add one item with required metadata
                metadataDeferred = this._addOneItemWithRequiredMetadata(newFiles,
                    options);
              } else if (newFiles && newFiles.length > 1) {
                // add multiple items with required metadata
                if (resp.initialFormData) {
                  options.initialFormData = resp.initialFormData;
                }
                metadataDeferred = this._addMultipleItemsWithRequiredMetadata(newFiles,
                    options);
              } else if (items.length) {
                //if items has no new files but has versions to files.
                deferred.resolve();
              }
              else {
                deferred.reject();
              }

              metadataDeferred.done(function (resp) {
                deferred.resolve(resp);
              }).fail(function (error) {
                deferred.reject(error);
              });

            } else {
              // no required metadata: resolve and let the caller code proceed with add item as normal
              deferred.resolve({});
            }
          }, this))
          .fail(function (error) {
            deferred.reject(error);
          });

      return deferred.promise();
    },

    _addOneItemWithRequiredMetadata: function (items, options) {
      var deferred = $.Deferred(),
          nodes    = this._makeNodeCollectionFromItems(items, options),
          status   = {
            nodes: nodes,
            container: options.container,
            context: options.context
          };
      options = options || {};
      _.extend(options, {
        callerProcessData: true,
        cancelButtonActionToken: "cancelAddOneItemWithRequiredMetadata",
        dialogTitle: nodes.models[0].get('fileObject') ? lang.addDocumentMetadataDialogTitle :
                     lang.addFolderMetadataDialogTitle,
        addButtonTitle: lang.addItemMetadataDialogButtonUploadTitle
      });
      this.displayForm(status, options)
          .done(function (resp) {
            if (options.callerProcessData) {
              var model = nodes.models[0];
              var item = model.get('itemObject') || model.get('fileObject');
              item.set('newName', resp.data.name);

              if (item) {
                var extendedData = {};
                item.set('newName', resp.data.name);
                if (!!resp.data.name_multilingual) {
                  item.set('name_multilingual', resp.data.name_multilingual);
                  item.set('multilingual_provided', true);
                }
                if (resp.data.description !== undefined) {
                  extendedData.description = resp.data.description;
                  !!resp.data.description_multilingual &&
                  (extendedData.description_multilingual = resp.data.description_multilingual);
                }
                if (resp.data.advanced_versioning !== undefined) {
                  extendedData.advanced_versioning = resp.data.advanced_versioning;
                }
                if (resp.data.roles) {
                  extendedData.roles = _.deepClone(resp.data.roles);
                }
                if (_.isEmpty(extendedData) === false) {
                  item.set('extended_data', extendedData);
                }
              }
              deferred.resolve(items);
            } else {
              deferred.resolve.apply(deferred, arguments);
            }
          })
          .fail(function () {
            deferred.reject.apply(deferred, arguments);
          });
      return deferred.promise();
    },
    // Private: add multiple items with required metadata
    _addMultipleItemsWithRequiredMetadata: function (nodes, options) {
      nodes = this._makeNodeCollectionFromItems(nodes, options);
      var folderLen = 0, fileLen = 0, nodesLen = nodes.length, cmdStatus = {nodes: nodes},
          deferred                                                       = $.Deferred();
      for (var i = 0; i < nodesLen; i++) {
        nodes.models[i].get('fileObject') ? fileLen++ : folderLen++;
      }
      _.extend(options, {
        dialogTitle: fileLen === nodesLen ? lang.addDocumentsMetadataDialogTitle :
                     folderLen === nodesLen ? lang.addFoldersMetadataDialogTitle :
                     lang.addItemsMetadataDialogTitle,
        addButtonTitle: lang.addItemMetadataDialogButtonUploadTitle
      });
      var metadataAddMultipleDocsController = new MetadataAddMultipleItemsController();
      metadataAddMultipleDocsController
          .displayForm(cmdStatus, options)
          .done(function (resp) {
            deferred.resolve(nodes);
          })
          .fail(function () {
            deferred.reject();
          });

      return deferred.promise();
    },

    // Private: create a node collection from the items array
    _makeNodeCollectionFromItems: function (items, options) {
      var nodes = new NodeCollection();
      var node;
      if (items && items.length > 0) {
        _.each(items, function (item) {
          var file = item.get('file');
          if (file) {
            node = new NodeModel({
              name: item.get('newName') || file.name,
              type: item.get('type') || 144,
              size: file.size,
              mime_type: file.type,
              fileObject: item,
              parent_id: options.container.get('id'),
              extended_data: item.get('extended_data')
            }, {
              connector: options.container.connector
            });
          } else {
            node = new NodeModel({
              container: true,
              name: item.get('newName') || item.get('name'),
              type: item.get('type') || item.get('subType' || 0),
              type_name: item.get('type_name') || 'Folder',
              itemObject: item,
              parent_id: options.container.get('id'),
              extended_data: item.get('extended_data'),
              enforcedRequiredAttrsForFolders: item.get('enforcedRequiredAttrsForFolders')
            }, {
              connector: options.container.connector
            });
          }

          _.extend(node.options, {
            enforcedRequiredAttrs: true
          });
          nodes.add(node, {silent: true});
        }, this);
      }
      return nodes;
    },
    //to support previous implemenation
    displayForm: function (status, options) {
      var metadataAddOneItemController = new MetadataAddOneItemController();
      return metadataAddOneItemController
          .displayForm(status, options);
    }

  });

  MetadataAddItemController.prototype.get = Backbone.Model.prototype.get;
  _.extend(MetadataAddItemController, {version: "1.0"});

  return MetadataAddItemController;

});

csui.define('csui/widgets/metadata/impl/add.items/metadata.add.multiple.docs.controller',["csui/lib/underscore", "csui/widgets/metadata/impl/common/base.metadata.action.view",
  "csui/models/node/node.model", "csui/controls/dialog/dialog.view",
  "csui/widgets/metadata/impl/common/metadata.action.multiple.items.view",
  "i18n!csui/widgets/metadata/impl/nls/lang", "csui/dialogs/modal.alert/modal.alert",
  'csui/utils/commands',
  "css!csui/widgets/metadata/impl/metadata", "csui/utils/deepClone/deepClone"
], function (_, BaseMetadataActionView, NodeModel, DialogView,
    MetadataActionMultipleItemsView, lang, ModalAlert, commands) {

  function MetadataAddMultipleDocsController() {
  }

  _.extend(MetadataAddMultipleDocsController.prototype, BaseMetadataActionView.prototype, {

    // public
    displayForm: function (status, options) {

      var applyFlag        = false,
          commonCategories = this._getCommonCategories(options);
      if (options.initialFormData && options.initialFormData.models &&
          options.initialFormData.models.length > 1) {
        applyFlag = true;
      }
      this.metadataAddItems = new MetadataActionMultipleItemsView({
        container: options.container,
        collection: status.nodes,
        selected: status.nodes,
        action: 'create',
        originatingView: options.originatingView,
        context: options.context,
        commands: commands,
        commonCategories: commonCategories,
        applyFlag: applyFlag,
        initialFormData: options.initialFormData
      });

      this.listenTo(this.metadataAddItems, "metadata:add", _.bind(function () {
        this.deferred.resolve();
      }, this));

      var baseUIOptions = {};
      baseUIOptions.originatingView = options.originatingView;
      baseUIOptions.view = this.metadataAddItems;
      var dialogOptions = {};
      dialogOptions.dialogTitle = options.dialogTitle ? options.dialogTitle :
                                  lang.addDocumentMetadataDialogTitle;
      dialogOptions.OkButtonTitle = options.addButtonTitle ? options.addButtonTitle :
                                    lang.addDocumentMetadataDialogAddButtonTitle;
      dialogOptions.OkButtonClick = this._addItems;
      baseUIOptions.dialogOptions = dialogOptions;

      return this.baseDisplayForm(baseUIOptions);

    },

    _getCommonCategories: function (options) {
      var formValues = {},
          that       = this;
      if (options.initialFormData && options.initialFormData.models) {
        _.each(options.initialFormData.models, function (tab, key) {
          var values   = tab.get("data"),
              roleName = tab.get("role_name"),
              options  = tab.get('options'),
              schema   = tab.get('schema'),
              roles, role, category;

          if (values) {
            if (roleName) {
              roles = formValues.roles || (formValues.roles = {});
              role = roles[roleName] || (roles[roleName] = {});
              if (roleName === 'categories') {
                // For categories, merge the properties to the
                // roles.categories.<category_id> object
                var catId = tab.get("id").toString();
                category = role[catId] || (role[catId] = {});
                // when attributes are not set, the server deletes
                // the category unless it is set to null
                if (_.isEmpty(values)) {
                  category = null;
                } else {
                  //Replace null values with empty string
                  values = JSON.parse(JSON.stringify(values).replace(/null/g, "\"\""));
                  _.extend(category, values);
                }
              } else {
                // With a role defined, merge the properties to the
                // roles.<role_name> object
                //TODO: uncomment this once classifications are displayed on upload dialog
                //_.extend(role, values);
              }
            }
          }
        });
      }
      return formValues;
    },

    // private
    _addItems: function (args) {
      if (args.view.mdv && args.view.mdv.metadataPropertiesView &&
          args.view.mdv.metadataPropertiesView.allFormsRendered) {
        var valid = this.metadataAddItems.validateAndSetValuesToNode();
        if (valid) {
          //generic error handling for all modules
          this.options.view.$el.find(".cs-formfield-invalid").removeClass('cs-formfield-invalid');
          var allValid = true;
          this.metadataAddItems.validateAndSetValuesToAllNode();
          this.metadataAddItems.collection.forEach(function (model) {
            allValid = allValid && (model.validated ? true : false);
          });
          if (allValid) {
            this.metadataAddItems.collection.forEach(function (model) {
              var data = model.get('data');
              var item = model.get('fileObject');
              var extended_data = model.get('extended_data');
              if (data && item) {
                item.set('newName', data.name);
                if (!!data.name_multilingual) {
                  item.set('name_multilingual', data.name_multilingual);
                  item.set('multilingual_provided', true);
                }
                var extendedData = {};
                if (data.description !== undefined) {
                  extendedData.description = data.description;
                  !!data.description_multilingual &&
                  (extendedData.description_multilingual = data.description_multilingual);
                }
                if (data.advanced_versioning !== undefined) {
                  extendedData.advanced_versioning = data.advanced_versioning;
                }
                if (data.roles) {
                  extendedData.roles = _.deepClone(data.roles);
                }
                if (_.isEmpty(extendedData) === false) {
                  _.extend(extended_data, extendedData);
                }
              }
            });
            this.dialog.destroy();
            this.deferred.resolve();
          } else {
            var title = lang.addDocumentMetadataDialogTitle;
            var message = lang.missingRequiredMetadataForDocuments;
            ModalAlert.showError(message, title);
          }
        } else {
          //generic error handling for all modules
          this.options.view.$el.find(".binf-has-error .cs-formfield").addClass(
              'cs-formfield-invalid');
        }
      }
    }

  });

  _.extend(MetadataAddMultipleDocsController, {version: "1.0"});

  return MetadataAddMultipleDocsController;

});

csui.define('csui/widgets/metadata/metadata.add.document.controller',["csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone",
  "csui/models/nodes", "csui/models/node/node.model",
  "csui/widgets/metadata/impl/add.items/metadata.add.item.controller",
  "csui/widgets/metadata/impl/metadata.utils",
  "csui/widgets/metadata/impl/add.items/metadata.add.multiple.docs.controller",
  "i18n!csui/widgets/metadata/impl/nls/lang", "csui/utils/deepClone/deepClone"
], function (_, $, Backbone, NodeCollection, NodeModel, MetadataAddItemController, MetadataUtils,
    MetadataAddMultipleDocsController, lang) {
  'use strict';

  function MetadataAddDocumentController() {
  }

  _.extend(MetadataAddDocumentController.prototype, Backbone.Events, {

    //
    // Public: check for enforced required metadata and show the metadata view if true
    //
    addItemsRequiredMetadata: function (fileUploadCollection, options) {
       // 'original' does not need checking
       if (options.openMetadata !== true && options.inheritance === 'original') {
        return $.Deferred().resolve();
      }

      var deferred      = $.Deferred(),
          fileModels    = fileUploadCollection.models,
          file          = _.find(fileUploadCollection.models, function (fileUploadModel) {
                return fileUploadModel.get('newVersion') === undefined;
              }) || fileModels[0],
          tempName      = fileModels.length > 0 ? file.get('file').name : 'temp_name',
          utilOptions   = {
            action: 'create',
            addableType: options.addableType,
            name: tempName,
            container: options.container,
            docParentId: fileModels.length > 0 ? file.get('id') : null
          },
          metadataUtils = new MetadataUtils(),
          newFiles      = $.grep(fileUploadCollection.models, function (fileUploadModel) {
            return fileUploadModel.get('newVersion') === undefined;
          }); //Collection might contain new versions of existing items, remove such items

      metadataUtils.ContainerHasEnforcedEmptyRequiredMetadata(utilOptions)
          .done(_.bind(function (resp) {
            if (resp.hasRequiredMetadata === true) {
              // if the container has empty required metadata.
              var metadataDeferred = $.Deferred();

              if (newFiles && newFiles.length === 1) {
                // add one item with required metadata
                metadataDeferred = this._addOneItemWithRequiredMetadata(newFiles,
                    options);
              } else if (newFiles && newFiles.length > 1) {
                // add multiple items with required metadata
                if (resp.initialFormData) {
                  options.initialFormData = resp.initialFormData;
                }
                metadataDeferred = this._addMultipleItemsWithRequiredMetadata(newFiles,
                    options);
              } else if (fileUploadCollection.length) {
                //if fileUploadCollection has no new files but has versions to files.
                deferred.resolve();
              }
              else {
                deferred.reject();
              }

              metadataDeferred.done(function (resp) {
                deferred.resolve(resp);
              }).fail(function (error) {
                deferred.reject(error);
              });

            } else {
              // no required metadata: resolve and let the caller code proceed with add item as normal
              deferred.resolve({});
            }
          }, this))
          .fail(function (error) {
            deferred.reject(error);
          });

      return deferred.promise();
    },

    // Private: create a node collection from the items array
    _makeNodeCollectionFromItems: function (items, options) {
      var nodes = new NodeCollection();
      if (items && items.length > 0) {
        _.each(items, function (item) {
          var file = item.get('file');
          var node = new NodeModel({
            name: item.get('newName') || file.name,
            type: item.get('type') || 144,
            size: file.size,
            mime_type: file.type,
            fileObject: item,
            parent_id: options.container.get('id'),
            extended_data: item.get('extended_data')
          }, {
            connector: options.container.connector
          });
          _.extend(node.options, {
            enforcedRequiredAttrs: true
          });
          nodes.add(node, {silent: true});
        }, this);
      }
      return nodes;
    },

    // Private: add one item with required metadata
    _addOneItemWithRequiredMetadata: function (items, options) {
      var deferred = $.Deferred();

      var nodes = this._makeNodeCollectionFromItems(items, options);
      var status = {
        nodes: nodes,
        container: options.container,
        context: options.context
      };
      var cmdOptions = {
        callerProcessData: true,
        dialogTitle: lang.addDocumentMetadataDialogTitle,
        addButtonTitle: lang.addDocumentMetadataDialogAddButtonTitle,
        cancelButtonActionToken: "cancelAddOneItemWithRequiredMetadata"
      };

      // show add item metadata view
      var metadataAddItemController = new MetadataAddItemController();
      metadataAddItemController
          .displayForm(status, cmdOptions)
          .done(function (resp) {
            var item = items[0];
            item.set('newName', resp.data.name);
            if (!!resp.data.name_multilingual) {
              item.set('name_multilingual', resp.data.name_multilingual);
              item.set('multilingual_provided', true);
            }
            var extendedData = {};
            if (resp.data.description !== undefined) {
              extendedData.description = resp.data.description;
              !!resp.data.description_multilingual &&
              (extendedData.description_multilingual = resp.data.description_multilingual);
            }
            if (resp.data.advanced_versioning !== undefined) {
              extendedData.advanced_versioning = resp.data.advanced_versioning;
            }
            if (resp.data.roles) {
              extendedData.roles = _.deepClone(resp.data.roles);
            }
            if (_.isEmpty(extendedData) === false) {
              item.set('extended_data', extendedData);
            }

            deferred.resolve();
          })
          .fail(function (args) {
            var error = (args && args.error) ? args.error : undefined;
            var userAction;

            if (args && args.buttonAttributes) {
              if (args.buttonAttributes.actionToken === "cancelAddOneItemWithRequiredMetadata") {
                userAction = "cancelAddOneItemWithRequiredMetadata";
              }
              else if (args.buttonAttributes.actionToken === "closeMetadataActionView") {
                userAction = "closeMetadataActionView";
              }
            }
            deferred.reject({error: error, userAction: userAction});
          });

      return deferred.promise();
    },

    // Private: add multiple items with required metadata
    _addMultipleItemsWithRequiredMetadata: function (items, options) {
      var deferred = $.Deferred();

      var nodes = this._makeNodeCollectionFromItems(items, options);
      var cmdStatus = {nodes: nodes};

      var metadataAddMultipleDocsController = new MetadataAddMultipleDocsController();
      metadataAddMultipleDocsController
          .displayForm(cmdStatus, options)
          .done(function (resp) {
            deferred.resolve();
          })
          .fail(function () {
            deferred.reject();
          });

      return deferred.promise();
    }

  });

  MetadataAddDocumentController.prototype.get = Backbone.Model.prototype.get;
  _.extend(MetadataAddDocumentController, {version: "1.0"});

  return MetadataAddDocumentController;

});

csui.define('csui/widgets/metadata/impl/copy.move.items/metadata.copy.move.one.item.controller',["csui/lib/underscore", "csui/widgets/metadata/impl/common/base.metadata.action.view",
  "csui/widgets/metadata/impl/metadata.controller",
  "csui/widgets/metadata/metadata.action.one.item.properties.view",
  "csui/utils/commandhelper", "i18n!csui/widgets/metadata/impl/nls/lang",
  "csui/dialogs/modal.alert/modal.alert", 'csui/utils/commands',
  "css!csui/widgets/metadata/impl/metadata"
], function (_, BaseMetadataActionView, MetadataController,
    MetadataActionOneItemPropertiesView, CommandHelper, lang, ModalAlert, commands) {

  //
  // Metadata Copy/Move One Item Controller allows copying/moving of ONE item with complete metadata
  // that the user can edit and change values of general metadata, categories and other roles.
  //

  function MetadataCopyMoveOneItemController() {
  }

  _.extend(MetadataCopyMoveOneItemController.prototype, BaseMetadataActionView.prototype, {

    // public (usually called from the 'command' class that has 'status' and 'options' parameters)
    displayForm: function (status, options) {
      var nodes = CommandHelper.getAtLeastOneNode(status);
      var node = nodes.length > 0 ? nodes.models[0] : null;

      this.node = node;

      var addItemView = this.metadataAddItemPropView = new MetadataActionOneItemPropertiesView({
        model: node,
        container: status.container,
        originatingView: options.originatingView,
        context: options.context,
        commands: commands,
        action: options.action,
        inheritance: options.inheritance
      });

      var baseUIOptions = {};
      baseUIOptions.callerProcessData = options.callerProcessData;
      baseUIOptions.originatingView = options.originatingView;
      baseUIOptions.view = addItemView;
      var dialogOptions = {};
      dialogOptions.dialogTitle = options.dialogTitle ? options.dialogTitle :
                                  lang.defaultDialogTitle;
      dialogOptions.OkButtonTitle = options.okButtonTitle ? options.okButtonTitle :
                                    lang.defaultDialogOkButtonTitle;
      dialogOptions.OkButtonClick = this._CopyMoveItem;
      baseUIOptions.dialogOptions = dialogOptions;

      var deferred = this.baseDisplayForm(baseUIOptions);

      return deferred;
    },

    // private
    _CopyMoveItem: function (args) {
      if (args.view.metadataPropertiesView && args.view.metadataPropertiesView.allFormsRendered) {
        var valid = this.metadataAddItemPropView.validate();
        if (valid) {
          var data = this.metadataAddItemPropView.getValues();

          if (args.callerProcessData === true) {
            this.dialog.destroy();
            this.deferred.resolve({data: data});
          } else {
            var metadataController = new MetadataController();
            metadataController.createItem(this.node, data)
                .done(_.bind(function (resp) {
                  this.dialog.destroy();
                  this.deferred.resolve({name: data.name});
                }, this))
                .fail(function (resp) {
                  var error = lang.failedToCreateItem;
                  if (resp) {
                    if (resp.responseJSON && resp.responseJSON.error) {
                      error = resp.responseJSON.error;
                    } else if (resp.responseText) {
                      error = resp.responseText;
                    }
                    ModalAlert.showError(error);
                  }
                });
          }
        }
      }
    }

  });

  _.extend(MetadataCopyMoveOneItemController, {version: "1.0"});

  return MetadataCopyMoveOneItemController;

});

csui.define('csui/widgets/metadata/impl/copy.move.items/metadata.copy.move.multiple.items.controller',["csui/lib/underscore", 
  "csui/utils/base","csui/widgets/metadata/impl/common/base.metadata.action.view",
  "csui/models/node/node.model", "csui/controls/dialog/dialog.view",
  "csui/widgets/metadata/impl/common/metadata.action.multiple.items.view",
  "i18n!csui/widgets/metadata/impl/nls/lang", "csui/dialogs/modal.alert/modal.alert",
  "css!csui/widgets/metadata/impl/metadata", "csui/utils/deepClone/deepClone"
], function (_, base, BaseMetadataActionView, NodeModel, DialogView,
    MetadataActionMultipleItemsView, lang, ModalAlert) {

  function MetadataCopyMoveMultipleItemsController() {
  }

  _.extend(MetadataCopyMoveMultipleItemsController.prototype, BaseMetadataActionView.prototype, {

    // public
    displayForm: function (status, options) {

      this.metadataAddItems = new MetadataActionMultipleItemsView({
        container: options.container,
        collection: status.nodes,
        selected: status.nodes,
        originatingView: options.originatingView,
        context: options.context,
        action: options.action,
        inheritance: options.inheritance
      });

      this.listenTo(this.metadataAddItems, "metadata:add", _.bind(function () {
        this.deferred.resolve();
      }, this));

      var baseUIOptions = {};
      baseUIOptions.originatingView = options.originatingView;
      baseUIOptions.view = this.metadataAddItems;
      var dialogOptions = {};
      dialogOptions.dialogTitle = options.dialogTitle ? options.dialogTitle :
                                  lang.defaultDialogTitle;
      dialogOptions.OkButtonTitle = options.okButtonTitle ? options.okButtonTitle :
                                    lang.defaultDialogOkButtonTitle;
      dialogOptions.OkButtonClick = this._CopyMoveItems;
      baseUIOptions.dialogOptions = dialogOptions;

      return this.baseDisplayForm(baseUIOptions);

    },

    // private
    _CopyMoveItems: function (args) {
      if (args.view.mdv && args.view.mdv.metadataPropertiesView &&
          args.view.mdv.metadataPropertiesView.allFormsRendered) {
        var valid = this.metadataAddItems.validateAndSetValuesToNode();
        if (valid) {
          var allValid = true;
          this.metadataAddItems.collection.forEach(function (model) {
            var modelValid = model.options.enforcedRequiredAttrs === true ?
                             (model.validated ? true : false ) : true;
            allValid = allValid && modelValid;
          });
          if (allValid) {
            this.metadataAddItems.collection.forEach(function (model) {
              var data = model.get('data');
              var item = model.get('itemObject');
              if (data && item) {
                var mlDataEnabled = base.getMetadataLanguageInfo().enabled;
                if (mlDataEnabled) {
                  var mlData = {
                        multilingual_provided: true,
                      },
                      name_multilingual = data.name_multilingual,
                      description_multilingual = data.description_multilingual;
                  !!name_multilingual && (mlData.name_multilingual = name_multilingual);
                  !!description_multilingual &&
                  (mlData.description_multilingual = description_multilingual);
                  _.extend(item, mlData);
                }
                item.newName = data.name;

                var extendedData = {};
                if (data.description !== undefined) {
                  extendedData.description = data.description;
                }
                if (data.advanced_versioning !== undefined) {
                  extendedData.advanced_versioning = data.advanced_versioning;
                }
                if (data.roles) {
                  extendedData.roles = _.deepClone(data.roles);
                }
                if (_.isEmpty(extendedData) === false) {
                  item.extended_data = extendedData;
                }
              }
            });
            this.dialog.destroy();
            this.deferred.resolve();
          } else {
            var title = lang.defaultDialogTitle;
            var message = lang.missingRequiredMetadataForObjects;
            ModalAlert.showError(message, title);
          }
        }
      }
    }

  });

  _.extend(MetadataCopyMoveMultipleItemsController, {version: "1.0"});

  return MetadataCopyMoveMultipleItemsController;

});

csui.define('csui/widgets/metadata/metadata.copy.move.items.controller',["csui/lib/underscore", 
  "csui/utils/base", "csui/lib/jquery", "csui/lib/backbone", "csui/models/nodes",
  "csui/models/node/node.model", "csui/widgets/metadata/impl/metadata.utils", "csui/models/actions",
  "csui/widgets/metadata/impl/copy.move.items/metadata.copy.move.one.item.controller",
  "csui/widgets/metadata/impl/copy.move.items/metadata.copy.move.multiple.items.controller",
  "i18n!csui/widgets/metadata/impl/nls/lang", "csui/utils/deepClone/deepClone"
], function (_, base, $, Backbone, NodeCollection, NodeModel, MetadataUtils, ActionCollection,
    MetadataCopyMoveOneItemController, MetadataCopyMoveMultipleItemsController, lang) {

  function MetadataCopyMoveItemsController() {
  }

  _.extend(MetadataCopyMoveItemsController.prototype, Backbone.Events, {

    //
    // Public: copy/move one or multiple items with open metadata option
    //
    CopyMoveItemsWithMetadata: function (items, options) {
      return this.CopyMoveItemsRequiredMetadata(items, _.extend(options, {openMetadata: true}));
    },

    // private
    _copyMoveItemsWithMetadata: function (items, options) {
      var deferred = $.Deferred();
      var metadataDeferred = $.Deferred();

      if (items && items.length > 0) {
        options.id || (options.id = items[0].id);
        options.container || (options.container = options.targetFolder);
      }

      if (items && items.length === 1) {
        // copy/move one item with metadata
        metadataDeferred = this._copyMoveOneItemWithRequiredMetadata(items, options);
      } else if (items && items.length > 1) {
        // copy/move multiple items with metadata
        metadataDeferred = this._copyMoveMultipleItemsWithRequiredMetadata(items, options);
      } else {
        deferred.reject();
      }

      metadataDeferred.done(function (resp) {
        deferred.resolve();
      }).fail(function (error) {
        deferred.reject(error);
      });

      return deferred.promise();
    },

    //
    // Public: check for enforced required metadata and show the metadata view if true
    //
    CopyMoveItemsRequiredMetadata: function (items, options) {
      if (!items || items.length < 1) {
        return $.Deferred().reject();
      }

      // 'original' does not need checking
      if (options.openMetadata !== true && options.inheritance === 'original') {
        return $.Deferred().resolve();
      }

      // latest PM decision is to deal only with 'destination'.  Option 'merged' is only for 1 item.
      if (options.openMetadata !== true && items.length > 1 && options.inheritance === 'merged') {
        return $.Deferred().resolve();
      }

      var deferred = $.Deferred();
      // talking the server developers, only need to check with one object
      var utilOptions = {
        action: options.action,
        inheritance: options.inheritance,
        items: items,
        container: options.targetFolder,
        context: options.context
      };
      var metadataUtils = new MetadataUtils();
      metadataUtils.ContainerHasEnforcedEmptyRequiredMetadataOnNodes(utilOptions)
          .done(_.bind(function (resp) {
            if ((resp.requiredMetadata && resp.enforcedItems && resp.enforcedItems.length > 0) ||
                options.openMetadata === true) {
              if (resp.requiredMetadata) {
                utilOptions = _.extend(utilOptions, {enforcedItems: resp.enforcedItems});
              }
              this._copyMoveItemsWithMetadata(items, utilOptions)
                  .done(function (resp) {
                    deferred.resolve(resp);
                  }).fail(function (error) {
                deferred.reject(error);
              });
            } else {
              // no required metadata: resolve and let the caller code proceed normally
              deferred.resolve();
            }
          }, this))
          .fail(function (error) {
            deferred.reject(error);
          });

      return deferred.promise();
    },

    // Private: create a node collection from the items array
    _makeNodeCollectionFromItems: function (items, options) {
      var nodes = new NodeCollection();
      if (items && items.length > 0) {
        _.each(items, function (item) {
          var enforcedRequiredAttrs = _.find(options.enforcedItems,
              function (enfItem) { return enfItem.id === item.id; }) === undefined ? false : true;
          var node = new NodeModel({
            id: item.id,
            name: item.newName || item.name,
            container: item.container,
            mime_type: item.mime_type,
            original_id: item.original_id,
            type: item.type,
            type_name: item.type_name,
            action: options.action,
            inheritance: options.inheritance,
            itemObject: item,
            size: item.size,
            size_formatted: (item.type === 144 || item.type === 749 || item.type === 736 ||
                             item.type === 30309) ? item.size_formatted : undefined
          }, {
            connector: options.container.connector
          });
          if (item.type === 140) { // for url object
            node.attributes.url = item.url;
          }
          _.extend(node.options, {
            original: item.original,
            enforcedRequiredAttrs: enforcedRequiredAttrs
          });
          node.original = item.original || node.original;
          node.actions = item.actions || new ActionCollection();
          nodes.add(node, {silent: true});
        }, this);
      }
      return nodes;
    },

    // Private: copy/move one item with required metadata
    _copyMoveOneItemWithRequiredMetadata: function (items, options) {
      var deferred = $.Deferred();
      var nodes = this._makeNodeCollectionFromItems(items, options);
      var status = {
        nodes: nodes,
        container: options.container
      };
      var dialogTitle, okButtonTitle;
      if (options.action === 'copy') {
        dialogTitle = _.str.sformat(lang.copyOneItemMetadataDialogTitle, items.length);
        okButtonTitle = lang.copyItemsMetadataDialogButtonTitle;
      } else if (options.action === 'move') {
        dialogTitle = _.str.sformat(lang.moveOneItemMetadataDialogTitle, items.length);
        okButtonTitle = lang.moveItemsMetadataDialogButtonTitle;
      } else if(options.action === 'restructure') {
        dialogTitle = _.str.sformat(lang.restructureOneItemMetadataDialogTitle, items.length);
        okButtonTitle = lang.restructureItemsMetadataDialogButtonTitle;
      }
    
      var cmdOptions = {
        callerProcessData: true,
        action: options.action,
        context: options.context,
        inheritance: options.inheritance,
        originatingView: options.originatingView,
        dialogTitle: dialogTitle,
        okButtonTitle: okButtonTitle
      };

      // show copy/move one item metadata view
      var metadataCopyMoveOneItemController = new MetadataCopyMoveOneItemController();
      metadataCopyMoveOneItemController
          .displayForm(status, cmdOptions)
          .done(function (resp) {
            items[0].newName = resp.data.name;
            var mlDataEnabled = base.getMetadataLanguageInfo().enabled;
            if (mlDataEnabled) {
              var mlData = {
                    multilingual_provided: true,
                  },
                  name_multilingual = resp.data.name_multilingual,
                  description_multilingual = resp.data.description_multilingual;
              !!name_multilingual &&
              (mlData.name_multilingual = name_multilingual);
              !!description_multilingual &&
              (mlData.description_multilingual = description_multilingual);
              _.extend(items[0], mlData);
            }
            var extendedData = {};
            if (resp.data.description !== undefined) {
              extendedData.description = resp.data.description;
            }
            if (resp.data.advanced_versioning !== undefined) {
              extendedData.advanced_versioning = resp.data.advanced_versioning;
            }
            if (resp.data.roles) {
              extendedData.roles = _.deepClone(resp.data.roles);
            }
            if (_.isEmpty(extendedData) === false) {
              items[0].extended_data = extendedData;
            }

            deferred.resolve();
          })
          .fail(function (error) {
            deferred.reject(error);
          });

      return deferred.promise();
    },

    // Private: copy/move multiple items with metadata
    _copyMoveMultipleItemsWithRequiredMetadata: function (items, options) {
      var deferred = $.Deferred();

      var dialogTitle, okButtonTitle;
      if (options.action === 'copy') {
        dialogTitle = _.str.sformat(lang.copyMultipleItemsMetadataDialogTitle, items.length);
        okButtonTitle = lang.copyItemsMetadataDialogButtonTitle;
      } else if (options.action === 'move') {
        dialogTitle = _.str.sformat(lang.moveMultipleItemsMetadataDialogTitle, items.length);
        okButtonTitle = lang.moveItemsMetadataDialogButtonTitle;
      } else if(options.action == 'restructure') {
        dialogTitle = _.str.sformat(lang.restructureMultipleItemsMetadataDialogTitle, items.length);
        okButtonTitle = lang.restructureItemsMetadataDialogButtonTitle;
      }

      var nodes = this._makeNodeCollectionFromItems(items, options);
      var cmdStatus = {nodes: nodes};
      var cmdOptions = {
        action: options.action,
        inheritance: options.inheritance,
        container: options.container,
        context: options.context,
        originatingView: options.originatingView,
        dialogTitle: dialogTitle,
        okButtonTitle: okButtonTitle
      };
      var metadataCopyMoveMultipleItemsController = new MetadataCopyMoveMultipleItemsController();
      metadataCopyMoveMultipleItemsController
          .displayForm(cmdStatus, cmdOptions)
          .done(function (resp) {
            deferred.resolve();
          })
          .fail(function (error) {
            deferred.reject(error);
          });

      return deferred.promise();
    },

  });

  MetadataCopyMoveItemsController.prototype.get = Backbone.Model.prototype.get;
  _.extend(MetadataCopyMoveItemsController, {version: "1.0"});

  return MetadataCopyMoveItemsController;
});


/* START_TEMPLATE */
csui.define('hbs!csui/widgets/metadata/impl/metadatanavigation/impl/metadatanavigation',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"metadata-wrapper binf-col-md-12\">\r\n  <div class=\"metadata-navigation\">\r\n    <div class=\"metadata-sidebar\" role=\"navigation\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"sidebarRegionAria") || (depth0 != null ? lookupProperty(depth0,"sidebarRegionAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"sidebarRegionAria","hash":{},"loc":{"start":{"line":3,"column":64},"end":{"line":3,"column":85}}}) : helper)))
    + "\"></div>\r\n    <div class=\"metadata-content\"></div>\r\n    <div class=\"metadata-doc-preview binf-hidden\"></div>\r\n  </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_widgets_metadata_impl_metadatanavigation_impl_metadatanavigation', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/widgets/metadata/impl/metadatanavigation/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/metadata/impl/metadatanavigation/impl/nls/root/lang',{
  versionsTitle: 'Versions',
  listAria: 'Browse items',
  sidebarRegionAria: 'Metadata item selection',
});



csui.define('css!csui/widgets/metadata/impl/metadatanavigation/impl/metadatanavigation',[],function(){});
// Shows a list of links to favorite nodes
csui.define('csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view',[
  'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette', 'csui/lib/jquery',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/metadata/impl/metadata.navigation.list.behavior',
  'csui/widgets/metadata/impl/metadata.navigation.list.view',
  'csui/widgets/metadata/metadata.view',
  'csui/controls/progressblocker/blocker',
  'hbs!csui/widgets/metadata/impl/metadatanavigation/impl/metadatanavigation',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/utils/contexts/factories/metadata.factory',
  'csui/controls/mixins/view.state/metadata.view.state.mixin',
  'csui/utils/contexts/factories/next.node',
  'csui/models/nodeversions',
  'i18n!csui/widgets/metadata/impl/metadatanavigation/impl/nls/lang',
  'css!csui/widgets/metadata/impl/metadatanavigation/impl/metadatanavigation'
], function (_, Backbone, Marionette, $, TabableRegionBehavior, MetadataNavigationListBehavior,
    MetadataNavigationListView, MetadataView, BlockingView, template,
    LayoutViewEventsPropagationMixin,
    MetadataModelFactory, MetadataViewStateMixin, NextNodeModelFactory, NodeVersionCollection,
    lang) {
  'use strict';

  //
  // Constructor options:
  // - showTitleIcon: boolean to show or hide the icon in the title bar
  //
  var MetadataNavigationView = Marionette.LayoutView.extend({
    className: 'cs-metadata',
    template: template,

    regions: {
      navigationRegion: ".metadata-sidebar",
      contentRegion: ".metadata-content",
      docPreviewRegion: ".metadata-doc-preview"
    },

    behaviors: {
      TabableRegionBehavior: {
        behaviorClass: TabableRegionBehavior,
        initialActivationWeight: 100
      },
      MetadataNavigationListBehavior: {
        behaviorClass: MetadataNavigationListBehavior
      }
    },

    constructor: function MetadataNavigationView(options) {
      options || (options = {});
      BlockingView.imbue(this);
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);

      this.enableViewState = true;

      if (options.enableViewState === false) {
        this.enableViewState = false;
      }

      this.context = options.context;
      this._isViewStateModelEnabled() && this._addUrlParametersSupport(options.context);

      this.collection = options.collection;
      this.container = options.container;
      this.containerCollection = options.containerCollection;
      this.originatingView = options.originatingView;
      this.showCloseIcon = options.showCloseIcon;
      this.initiallySelected = this.options.selected;
      this.selectedTab = options.selectedTab || this.getViewStateDropdown();
      this.selectedProperty = options.selectedProperty || this.getViewStateSelectedProperty();
      this.isThumbnailView = options.isThumbnailView || this.getThumbnailViewState();
      this.showPermissionView = options.showPermissionView || this.isShowPermissionView();
      this.thumbnailViewState = options.originatingView &&
                                options.originatingView.thumbnailViewState;
      this.collection.inMetadataNavigationView = options.originatingView &&
                                                 options.originatingView.isTabularView;
      this.largeFileSettingsModel =  options.largeFileSettingsModel;

      // Set toolbarItems from originating view to this.options, because when creating
      // MetadataView, this is used as originatingView and we want to use the toolbar or menu
      // items that are specified at the initial originatingView
      if (!this.options.toolbarItems && this.originatingView && this.originatingView.options &&
          this.originatingView.options.toolbarItems) {
        this.options.toolbarItems = this.originatingView.options.toolbarItems;
      }

      var initiallySelectedModel = this._getInitiallySelectedModel();

      this.mdv = (this.options.data && this.options.data.contentView) ?
                 this.options.data.contentView :
                 new MetadataView({
                   model: initiallySelectedModel,
                   container: this.container,
                   containerCollection: this.containerCollection,
                   collection: this.collection,
                   context: this.context,
                   originatingView: this,
                   metadataNavigationView: this,
                   isExpandedView: !!this.options.isExpandedView,
                   showCloseIcon: this.showCloseIcon === undefined ? false : this.showCloseIcon,
                   selectedTab: this.selectedTab,
                   selectedProperty: this.selectedProperty,
                   showPermissionView: this.showPermissionView,
                   enableViewState: this.enableViewState
                 });
      if (!this.options.data || !this.options.data.contentView) {
        this.mdv.internal = true;
      }

      this._subscribeToMetadataViewEvents(initiallySelectedModel);

      var back_button,
          viewStateModel = this.context && this.context.viewStateModel;
      if (this._isViewStateModelEnabled()) {
        back_button = viewStateModel.hasRouted() || viewStateModel.get('lastRouter');
      } else {
        back_button = (this.originatingView || this.containerCollection) ? true : false;
      }

      this.mdn = new MetadataNavigationListView({
        collection: options.collection,
        containerCollection: this.containerCollection,
        data: {
          back_button: back_button,
          title: this._getBackButtonTitle(options),
          nameAttribute: options.nameAttribute,
          listAria: lang.listAria,
          listRole: 'menu',
          childRole: 'menuitem'
        },
        originatingView: options.originatingView,
        isThumbnailView: this.isThumbnailView
      });
      this.listenTo(this.mdn, 'click:item', this.onClickItem);
      this.listenTo(this.mdn, 'click:back', this.onClickBack);
      this.listenTo(this.mdn, 'show:node', function (args) {
        this._showNode(args.model);
      });
      this.listenTo(this.mdv, 'disable:active:item', function (args) {
        this.mdn.$el.find('.binf-active').addClass('active-item-disable');
      }).listenTo(this.mdv, 'enable:active:item', function () {
        this.mdn.$el.find('.active-item-disable').removeClass('active-item-disable');
      });

      if (this.options.originatingView &&
          (!_.isFunction(this.options.originatingView.cascadeDestroy) ||
           this.options.originatingView.cascadeDestroy())) {
        this.listenTo(this.options.originatingView, 'before:destroy', function () {
          this._closeMetadata();
        });
      }

      this.propagateEventsToRegions();

      if (this._isViewStateModelEnabled()) {
        var metadataModel = this.context.getModel(MetadataModelFactory);
        this.listenTo(metadataModel, 'change:metadata_info', function () {
          this.onMetadataInfoChanged();
        });

        // check if the previous fragment was for the metadata router. We need to go back
        // to that fragment when the user hits the back button.
        var currentHistoryEntry = viewStateModel && viewStateModel._currentHistoryEntry;
        if (currentHistoryEntry) {
          if (currentHistoryEntry && currentHistoryEntry.router == 'Metadata') {
              this.goBacktoFragmentIndex = viewStateModel._navigationHistory.length;
          }
        } else {
          currentHistoryEntry = viewStateModel.getLastHistoryEntry();
          if (currentHistoryEntry && currentHistoryEntry.router == 'Metadata') {
              this.goBacktoFragmentIndex = viewStateModel._navigationHistory.length - 1;
          }
        }
      }
    },

    templateHelpers: function() {
      return {
        sidebarRegionAria: lang.sidebarRegionAria
      };
    },

    _getBackButtonTitle: function (options) {
      // TODO: Put the title on the interface (to options). New scenarios
      // should not be hardcoded here one after another. They should
      // specify what they need on the interface.
      var title = options.container ? options.container.get('name') : '';
      if (!title && options.collection.length > 0 &&
          !!options.collection.models[0].collection.title) {
        title = options.collection.models[0].collection.title;
      }
      // for versions, use a static title
      if (options.collection && options.collection instanceof NodeVersionCollection) {
        title = lang.versionsTitle;
      }
      if (!title) {
        var viewStateModel = options.context && options.context.viewStateModel;
        title = viewStateModel && viewStateModel.getBackToTitle();
      }
      return title;
    },

    _isViewStateModelEnabled: function () {
      var viewStateModel = this.context && this.context.viewStateModel;
      return this.enableViewState && viewStateModel && viewStateModel.get('enabled');
    },

    _getInitiallySelectedModel: function () {
      if (this.initiallySelected instanceof Backbone.Model) {
        if (this.showPermissionView && this.initiallySelected.actions &&
            this.initiallySelected.actions.get('permissions')) {
          return this.initiallySelected;
        }
        var index = this.collection.findIndex({id: this.initiallySelected.get('id')});
        if (index < 0 || index > this.collection.length - 1) { return null; }
        return this.collection.at(index);
      } else if (this.initiallySelected && this.initiallySelected.length > 0) {
        return this.initiallySelected.models[0];
      } else if (this.collection && this.collection.length > 0) {
        return this.collection.models[0];
      } else {
        return null;
      }
    },

    onRender: function () {
      if (!this.showPermissionView) {
        var node;
        if (this.mdv && this.mdv.model) {
          node = this.mdv.model;
        } else {
          node = this._getInitiallySelectedModel();
        }
        node && this._showNode(node);
      }
    },

    onClickItem: function (item) {
      if (this._isViewStateModelEnabled() &&
          this.getViewStateId() !== item.model.get('id')) {
        this.setViewStateId(item.model.get('id'), {model: item.model});
      } else {
        this._showNode(item.model);
      }
    },

    onClickBack: function () {
      this._closeMetadata();
    },

    onItemNameChanged: function (newName) {
      var selectedItem = this.mdn.getSelectedItem(),
          selectedIndex = this.mdn.getSelectedIndex();

      selectedItem.render(); // name has been set silently
      this.mdn.setSelectedIndex(selectedIndex);
    },

    _moveToNextItemAfterDeleteOrMove: function () {
      if (this.mdn.collection.length === 0) {
        this._closeMetadata();
      } else {
        var nextIndex = this.currentIndex;
        nextIndex === this.mdn.collection.length && (nextIndex--);
        this.currentIndex = -1;
        this.mdn.selectAt(nextIndex);
      }
    },

    _currentIndex: function () {
      this.currentIndex = this.mdn.getSelectedIndex();
    },

    _onItemDeleted: function () {
      this._moveToNextItemAfterDeleteOrMove();
    },

    _onItemMoved: function (removedNode) {
      this.mdn.collection.remove(removedNode);
      this._moveToNextItemAfterDeleteOrMove();
    },

    _showNode: function (model) {
      var selectedTab = (this._isViewStateModelEnabled() && this.getViewStateDropdown()) || (
              this.mdv.metadataTabView && this.mdv.metadataTabView.tabLinks ?
              this.mdv.metadataTabView.tabLinks.selected :
              this.mdv && this.mdv.options && this.mdv.options.selectedTab ?
              this.mdv.options.selectedTab : ""),
          activeTab = this.mdv.metadataTabView && this.mdv.metadataTabView.options.activeTab ?
                      this.mdv.metadataTabView && this.mdv.metadataTabView.options.activeTab :
                      this.mdv.options && this.mdv.options.activeTab ? this.mdv.options.activeTab :
                      "";
      if (this.mdv && this.mdv.internal) {
        this.mdv.destroy();
      }

      this.mdv = new MetadataView({
        model: model,
        container: this.container,
        containerCollection: this.containerCollection,
        collection: this.collection,
        context: this.context,
        originatingView: this,
        metadataNavigationView: this,
        showCloseIcon: this.showCloseIcon === undefined ? false : this.showCloseIcon,
        showBackIcon: false,
        activeTab: activeTab,
        selectedTab: selectedTab,
        showPermissionView: this.showPermissionView,
        enableViewState: this.enableViewState,
        selectedProperty: this.selectedProperty
      });
      this.mdv.internal = true;
      // after the first time we show the node, do not pass in the selectedProperty
      this.selectedProperty = undefined;
      this._subscribeToMetadataViewEvents(model);
      this.contentRegion.show(this.mdv);
    },

    _modelIdChanged: function () {
      var id = this.model.get('id');
      if (id) {
        this.setSelectedElementByModelId(id);
      }
    },

    onMetadataInfoChanged: function() {
      var metadataModel = this.context.getModel(MetadataModelFactory),
          metadataInfo = metadataModel.get('metadata_info');
      if (!metadataInfo) {
        return;
      }
      this.showPermissionView = metadataInfo.showPermissionView;    
      this.setSelectedElementByModelId(metadataInfo.id);
    },

    setSelectedElementByModelId: function (id) {
      var element = this.getItemByModelId(id);
      if (element) {
        this.mdn.setSelectedElement(element);
        this._showNode(element.model);
      }
    },

    getItemByModelId: function (id) {
      var view;
      this.mdn.children.some(function (element) {
        if (element.model.get('id') === id) {
          view = element;
          return true;
        }
      });
      return view;
    },

    onMetadataClose: function () {
      this._closeMetadata();
    },

    onDestroy: function () {
      if (this.thumbnailViewState) {
        this.originatingView.thumbnail &&
        this.originatingView.thumbnail.resultsView.triggerMethod('metadata:close');
      }
    },

    _closeMetadata: function () {
      this.trigger('metadata:close', {sender: this});

      var viewStateModel = this.context.viewStateModel,
          currentRouter = viewStateModel && viewStateModel.get(viewStateModel.CONSTANTS.CURRENT_ROUTER);

      if (!this.originatingView) {
        if ((currentRouter && currentRouter === 'Metadata') ||
            (this._isViewStateModelEnabled() && !this.showPermissionView)) {
          if (this.goBacktoFragmentIndex !== undefined) {
            this.context.viewStateModel._restoreHistoryEntryByIndex(this.goBacktoFragmentIndex);
          } else {
            this.context.viewStateModel.restoreLastRouter();
          }
        } else {
          var id = this._getCommonContainerId();
          if (id) {
            // there is no originatingView to go back; thus, go to the container
            this._setNextNodeModelFactory(id);
          }
        }
      }
    },

    _getCommonContainerId: function () {
      var id;
      if (this.containerCollection) {
        if (this.containerCollection.node) {
          // there is no originatingView to go back; thus, go to the container
          id = this.containerCollection.node.get('id');
        } else if (this.containerCollection.models.length > 0) {
          // if you have a list of models and they have the same parent id then select the
          // parent id that is common to all.
          id = this.containerCollection.models[0].get('parent_id');
          this.containerCollection.models.some(function (model) {
            if (model.get('parent_id') !== id) {
              id = undefined;
              return true;
            }
          });
        }
      }
      return id;
    },

    _setNextNodeModelFactory: function (id) {
      if (this.context && id !== undefined) {
        var nextNode = this.context.getModel(NextNodeModelFactory);
        if (nextNode) {
          if (nextNode.get('id') === id) {
            // when id is same as nextNode's id, nextNode.set(id) event is not triggered
            nextNode.unset('id', {silent: true});
          }
          nextNode.set('id', id);
        }
      }
    },

    _subscribeToMetadataViewEvents: function (model) {
      this.listenTo(this.mdv, 'metadata:close', _.bind(function () {
        this._closeMetadata();
      }, this));
      this.listenTo(this.mdv, 'metadata:close:without:animation', _.bind(function () {
        this.trigger('metadata:close:without:animation', {sender: this});
      }, this));
      this.listenTo(this.mdv, 'item:name:changed', _.bind(this.onItemNameChanged, this));
      this.listenTo(model, 'before:delete before:move', this._currentIndex);
      this.listenTo(model, 'delete', this._onItemDeleted);
      this.listenTo(model, 'move', this._onItemMoved);
    },

    _addUrlParametersSupport: function (context) {
      var viewStateModel = context && context.viewStateModel;
      viewStateModel && viewStateModel.addUrlParameters(['dropdown'], context);
    }

  });

  _.extend(MetadataNavigationView.prototype, LayoutViewEventsPropagationMixin);
  _.extend(MetadataNavigationView.prototype, MetadataViewStateMixin);

  return MetadataNavigationView;
});

csui.define('csui/widgets/metadata.navigation/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/metadata.navigation/impl/nls/root/lang',{

  FetchNodeFailTitle: 'Error',
  FetchNodeFailMessage: 'Failed to fetch node "{0}". \n\n{1}',
  MetadataNavWrapperAria: 'Metadata with navigation'


});



csui.define('css!csui/widgets/metadata.navigation/impl/metadata.navigation',[],function(){});
csui.define('csui/widgets/metadata.navigation/metadata.navigation.view',['module','csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/base', 'csui/controls/progressblocker/blocker', 'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/children', 'csui/utils/contexts/factories/children2',
  'csui/widgets/nodestable/nodestable.view',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view',
  'csui/utils/contexts/factories/largefilesettings.factory',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/utils/contexts/factories/metadata.factory',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  'csui/behaviors/default.action/impl/defaultaction',
  'i18n!csui/widgets/metadata.navigation/impl/nls/lang',
  'css!csui/widgets/metadata.navigation/impl/metadata.navigation'
], function (module, _, $, Backbone, Marionette, base, BlockingView, NodeModelFactory,
    ChildrenCollectionFactory, Children2CollectionFactory, NodesTableView,
    ViewEventsPropagationMixin, MetadataNavigationViewImpl, LargeFileSettingsFactory,
    ModalAlert, MetadataModelFactory, nodeExtraData, DefaultActionController, lang) {
  'use strict';

  var config = module.config();
  // TODO: remove this code when v1 and v2 browse call is finalized
  if (NodesTableView.useV2RestApi) {
    ChildrenCollectionFactory = Children2CollectionFactory;
  }

  //
  // Public: Metadata Navigation View
  // Description: view consists of the navigation list panel on the left and metadata view panel.
  //
  var MetadataNavigationView = Marionette.ItemView.extend({

    className: 'cs-metadata-navigation-wrapper',

    template: false,

    constructor: function MetadataNavigationView(options) {
      options = _.defaults(options, config);
      options.data || (options.data = {});
      options.showCloseIcon = false;
      this.options = options;

      // Once PropertiesView is opened, 'originatingView' becomes metadataView or
      // MetadataNavigationView.
      // If  properties view page does not have navigationlist (eg for folders and wikipage) then
      // originating view becomes 'MetadataView' based on supportOriginatingView
      if (!!this.options.originatingView && !!this.options.originatingView.supportOriginatingView) {
        this.options.baseOriginatingView = this.options.originatingView;
        this.options.originatingView = this;
      }
      this.context = this.options.context;
      Marionette.ItemView.prototype.constructor.call(this, options);
      this.largeFileSettingsFactory = this.context.getFactory(LargeFileSettingsFactory);
      this.options.largeFileSettingsModel = this.largeFileSettingsFactory && this.largeFileSettingsFactory.property;
      // When this view is used alone on a perspective, if should offer
      // spinning sun to commands executed with it as originating view
      BlockingView.imbue(this);
    },

    onRender: function () {
      // don't render until the complete data have been fetched
      var fetching = this._ensureCompleteData();
      if (fetching) {
        return fetching.done(_.bind(this.render, this));
      }
      this.metadataNavigationView && this.metadataNavigationView.destroy();
      var mnv = this.metadataNavigationView = new MetadataNavigationViewImpl(this.options);
      this.propagateEventsToViews(this.metadataNavigationView);

      this.metadataNavigationView.render();
      Marionette.triggerMethodOn(mnv, 'before:show', mnv, this);
      this.$el.append(mnv.el);
      this.$el.attr({'role': 'region', 'aria-label': lang.MetadataNavWrapperAria});
      Marionette.triggerMethodOn(mnv, 'show', mnv, this);
    },

    onBeforeDestroy: function () {
      if (this.metadataNavigationView) {
        this.cancelEventsToViewsPropagation(this.metadataNavigationView);
        this.metadataNavigationView.destroy();
      }
    },

    _modelIdChanged: function () {
      //if the model on which properties are selected is from the different collection
      //displayed in metadataNavigationView then rerender view with other collection.
      var metadataModel = this.options.context.getModel(MetadataModelFactory),
          metadataInfo  = metadataModel.get('metadata_info');
      if(metadataInfo && (this.contextCollection !==  metadataInfo.collection)){
        this.deleteData();
        this.render();
      }
    },

    deleteData: function (){
      delete this.options.selected;
      delete this.options.collection;
      delete this.options.containerCollection;
    },

    _ensureCompleteData: function () {
      var options = this.options;
      if (options.model && options.collection && options.containerCollection) {
        return;  // return nothing (undefined) for synchronous code flow in onRender
      }

      // Data is not yet available, load the data and return a fetching promise..
      return this._loadingDataByMetadata();
    },

    _loadingDataByMetadata: function () {
      var self = this;
      var deferred;
      var options = this.options;
      if (!options.model || (!options.collection && !options.containerCollection)) {
        deferred = $.Deferred();
      }

      function loadCollectionAfterModel() {
        self._loadCollection()
            .always(function () {
              self.unblockActions();
            })
            .done(function (response) {
              deferred && deferred.resolve(response);
            })
            .fail(function (error) {
              deferred && deferred.reject(error);
            });
      }

      // Load the model if it is not passed in via the options
      if (!options.model) {
        var nodeId = options.data.id && {id: options.data.id};
        if (!nodeId) {
          var metadataModel = options.context.getModel(MetadataModelFactory);
          if (metadataModel) {
            nodeId = metadataModel.get('metadata_info').id;
          }
        }
        var defaultActionController = new DefaultActionController();
        options.model = options.context.getModel(NodeModelFactory, {
          attributes: nodeId && {id: nodeId},
          temporary: true,
          options: {
            defaultActionCommands: defaultActionController.actionItems.getAllCommandSignatures(
              defaultActionController.commands),
            delayRestCommands: false
          }
        });
        //options.model.commands = ['properties'];
        options.selected = options.model;
        self.blockActions();
        loadCollectionAfterModel();
      } else if (!options.collection || !options.containerCollection) {
        options.selected = options.model;
        self.blockActions();
        loadCollectionAfterModel();
      }

      return deferred && deferred.promise();
    },

    _loadCollection: function () {
      var self = this;
      var deferred = $.Deferred();
      var options = this.options;
      var collection = options.collection || options.containerCollection;

      function ensureModelInCollection() {
        // if the model is not in the collection, insert it at the beginning
        if (!collection.findWhere({id: options.model.get('id')})) {
          collection.add(options.model, {at: 0, silent: true});
        }
      }

      function updateMetadataInfo(collection) {
        var metadataModel = options.context.getModel(MetadataModelFactory);
        if (metadataModel) {
          var metadataInfo = metadataModel.get('metadata_info');
          metadataInfo.collection = collection;
        }
      }

      function setCollectionToOptions() {
        options.collection || (options.collection = collection);
        options.containerCollection || (options.containerCollection = collection);
      }

      if (!collection) {
        // Check to see if the collection is already available on Context MetadataInfo
        var metadataModel = options.context.getModel(MetadataModelFactory);
        if (metadataModel) {
          var metadataInfo = metadataModel.get('metadata_info');
          this.contextCollection = metadataInfo && metadataInfo.collection;
          if (this.contextCollection && this.contextCollection.length > 0) {
            collection = this.contextCollection.clone();
            ensureModelInCollection();
            updateMetadataInfo(collection);
            setCollectionToOptions();
            delete options.context.viewStateModel.get('state').collection;
            return deferred.resolve().promise();
          }
        }
      }

      if (!collection) {
        options.model.ensureFetched()
            .done(function (response) {
              // If the parent_id is -1 then the metadata navigation is displaying the favorites collection
              // or some thing like that. When the page gets refreshed with (i.e. hitting f5) we don't know
              // what type of collection existed before.
              if (options.model.get('parent_id') === -1) {
                collection = new Backbone.Collection();
                ensureModelInCollection();
                updateMetadataInfo(collection);
                setCollectionToOptions();
                deferred.resolve();
                return;
              }
              var defaultActionController = new DefaultActionController();

              options.container = options.context.getModel(NodeModelFactory,
                {attributes: {id:options.model.get('parent_id')},
                temporary: true,
                options: {
                  defaultActionCommands: defaultActionController.actionItems.getAllCommandSignatures(
                      defaultActionController.commands),
                  delayRestCommands: true
                }
              });

              options.container.ensureFetched()
                  .done(function (response) {
                    collection = options.context.getCollection(
                        ChildrenCollectionFactory, {
                          options: {
                            node: options.container,
                            defaultActionCommands: defaultActionController.actionItems.getAllCommandSignatures(
                              defaultActionController.commands),
                            delayRestCommands:true
                          }
                        });
                    collection.setFields && collection.setFields(nodeExtraData.getModelFields());
                    collection.setExpand && collection.setExpand(nodeExtraData.getModelExpand());
                    collection.ensureFetched()
                        .done(function (response2) {
                          ensureModelInCollection();
                          updateMetadataInfo(collection);
                          setCollectionToOptions();
                          deferred.resolve(response2);
                        })
                        .fail(function (error2) {
                          self._showFetchNodeFailMessage(error2, options.container.get("id"));
                          deferred.reject(error2);
                        });
                  })
                  .fail(function (error) {
                    self._showFetchNodeFailMessage(error, options.container.get("id"));
                    deferred.reject(error);
                  });
            })
            .fail(function (error) {
              self.unblockActions();
              self._showFetchNodeFailMessage(error, options.model.get("id"));
              deferred && deferred.reject(error);
            });

        return deferred.promise();
      }

      return deferred.resolve().promise();
    },

    _showFetchNodeFailMessage: function (error, nodeId) {
      var errorObj = new base.Error(error);
      var title = lang.FetchNodeFailTitle;
      var message = _.str.sformat(lang.FetchNodeFailMessage, nodeId, errorObj.message);
      ModalAlert.showError(message, title);
    }

  });

  _.extend(MetadataNavigationView.prototype, ViewEventsPropagationMixin);

  return MetadataNavigationView;

});

/**
 * Controller for saving a search query
 */
csui.define('csui/widgets/metadata/metadata.save.query.controller',["csui/lib/underscore", "csui/lib/jquery", "csui/lib/backbone",
	"csui/models/nodes", "csui/models/node/node.model",
	"csui/widgets/metadata/impl/metadata.utils", 'csui/utils/commands/add.item.metadata', 'i18n!csui/utils/commands/nls/localized.strings'
], function (_, $, Backbone, NodeCollection, NodeModel, MetadataUtils, AddItemMetadataCommand, lang) {
	'use strict';

	function MetadataSaveQueryController() {
	}

	_.extend(MetadataSaveQueryController.prototype, Backbone.Events, {

		_checkForRequiredMetadata: function (model, status) {
			var context = status.context,
				containderId = model.get('parent_id'),
				deferredObject = $.Deferred(),
				utilOptions = {
					name: model.get('name'),
					docParentId: model.get('parent_id'),
					addableType: model.get('type'),
					action: 'create',
					container: new NodeModel({ id: containderId },
						{ connector: status.connector })
				};

			var metadataUtils = new MetadataUtils();
			metadataUtils.ContainerHasEnforcedEmptyRequiredMetadata(utilOptions)
				.done(_.bind(function (resp) {
					if (resp.hasRequiredMetadata === true) {
						var nodes = new NodeCollection();
						nodes.push(model);

						var addItemStatus = {
							nodes: nodes,
							container: new NodeModel({ id: containderId },
								{ connector: status.connector })
						},
							options = {
								context: context,
								addableType: model.get('type'),
								callerProcessData: true,
								addButtonTitle: lang.saveButtonLabel,
								dialogTitle: lang.DialogTitleSaveQuery
							};

						var addItemMetadataCmd = new AddItemMetadataCommand();
						addItemMetadataCmd.execute(addItemStatus, options)
							.then(function (resp) {
								deferredObject.resolve(resp);
							}).fail(function (err) {
								deferredObject.reject();
							});
					} else {
						deferredObject.resolve();
					}
				})).fail(function () {
					deferredObject.reject();
				});
			return deferredObject.promise();
		},

	});

	MetadataSaveQueryController.prototype.get = Backbone.Model.prototype.get;
	_.extend(MetadataSaveQueryController, { version: "1.0" });

	return MetadataSaveQueryController;

});


csui.define('json!csui/widgets/metadata/metadata.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "fullpage",
  "schema": {
    "type": "object",
    "properties": {
      "id": {
        "title": "{{idTitle}}",
        "description": "{{idDescription}}",
        "type": "integer"
      },
      "initialPanel": {
        "title": "{{initialPanelTitle}}",
        "description": "{{initialPanelDescription}}",
        "type": "string"
      }
    },
    "required": ["id"]
  },
  "options": {
    "fields": {
      "id": {
        "type": "otcs_node_picker",
        "type_control": {
          "parameters": {
            "select_types": []
          }
        }
      }
    }
  },
  "actions": [
    {
      "toolItems": "csui/widgets/metadata/header.dropdown.menu.items",
      "toolItemMasks": "csui/widgets/metadata/header.dropdown.menu.items.mask",
      "toolbars": [
        {
          "id": "dropdownMenuList",
          "title": "{{dropdownMenuTitle}}",
          "description": "{{dropdownMenuDescription}}"
        }
      ]
    },
    {
      "toolItems": "csui/widgets/metadata/add.properties.menuitems",
      "toolItemMasks": "csui/widgets/metadata/add.properties.menuitems.mask",
      "toolbars": [
        {
          "id": "addPropertiesToolbar",
          "title": "{{addPropertiesTitle}}",
          "description": "{{addPropertiesDescription}}"
        }
      ]
    }
  ]
}
);


csui.define('json!csui/widgets/metadata.navigation/metadata.navigation.manifest.json',{
  "$schema": "http://opentext.com/cs/json-schema/draft-04/schema#",
  "title": "{{widgetTitle}}",
  "description": "{{widgetDescription}}",
  "kind": "fullpage",
  "schema": {
    "type": "object",
    "properties": {
      "id": {
        "title": "{{idTitle}}",
        "description": "{{idDescription}}",
        "type": "integer"
      },
      "initialPanel": {
        "title": "{{initialPanelTitle}}",
        "description": "{{initialPanelDescription}}",
        "type": "string"
      }
    },
    "required": ["id"]
  },
  "options": {
    "fields": {
      "id": {
        "type": "otcs_node_picker",
        "type_control": {
          "parameters": {
            "select_types": []
          }
        }
      }
    }
  }
}
);

csui.define('csui/widgets/metadata/impl/nls/metadata.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/metadata/impl/nls/root/metadata.manifest',{
  "widgetTitle": "Object Information",
  "widgetDescription": "Shows information about an object and offers the most important actions for it.",
  "idTitle": "Object",
  "idDescription": "An object to show the information for",
  "initialPanelTitle": "Object information",
  "initialPanelDescription": "An object to show the information for",
  "dropdownMenuTitle": "Object Context Menu",
  "dropdownMenuDescription": "Context menu, which is displayed when clicking on the arrow on the right side of the name of the opened object.",
  "addPropertiesTitle": "Add Feature Menu",
  "addPropertiesDescription": "Drop-down menu, which is displayed when clicking on the plus on the right side of the property tabs."
});


csui.define('csui/widgets/metadata.navigation/impl/nls/metadata.navigation.manifest',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/widgets/metadata.navigation/impl/nls/root/metadata.navigation.manifest',{
  "widgetTitle": "Object Information",
  "widgetDescription": "Shows information about an object and offers the most important actions for it.",
  "idTitle": "Object",
  "idDescription": "An object to show the information for",
  "initialPanelTitle": "Object information",
  "initialPanelDescription": "An object to show the information for"
});


csui.define('bundles/csui-metadata',[
  // Controls
  'csui/controls/tableheader/comment/comment.button.view',
  'csui/widgets/metadata/versions.toolbaritems',
  'csui/widgets/metadata/impl/metadata.tabcontentcollection.view',
  'csui/widgets/metadata/impl/header/rightbar/toolbaritems',
  'csui/widgets/metadata/impl/header/rightbar/toolbaritems.masks',  
  'csui/utils/versions.default.action.items',

  // Application widgets
  'csui/widgets/metadata/metadata.view',
  'csui/widgets/metadata/metadata.properties.view',
  'csui/widgets/metadata/metadata.action.one.item.properties.view',
  'csui/widgets/metadata/metadata.add.categories.controller',
  'csui/widgets/metadata/metadata.add.document.controller',
  'csui/widgets/metadata/impl/add.items/metadata.add.item.controller',
  'csui/widgets/metadata/metadata.add.item.controller',
  'csui/widgets/metadata/metadata.copy.move.items.controller',
  'csui/widgets/metadata/property.panels/general/metadata.general.property.controller',
  'csui/widgets/metadata/impl/metadatanavigation/metadatanavigation.view',
  'csui/widgets/metadata.navigation/metadata.navigation.view',
  'csui/widgets/metadata/impl/add.items/metadata.add.multiple.items.controller',
  'csui/widgets/metadata/impl/header/item.name/metadata.item.name.view',
  'csui/widgets/metadata/metadata.save.query.controller',

  // Application widgets manifests
  'json!csui/widgets/metadata/metadata.manifest.json',
  'json!csui/widgets/metadata.navigation/metadata.navigation.manifest.json',
  'i18n!csui/widgets/metadata/impl/nls/metadata.manifest',
  'i18n!csui/widgets/metadata.navigation/impl/nls/metadata.navigation.manifest',

  // Tool items and tool item masks
  'csui/widgets/metadata/add.properties.menuitems',
  'csui/widgets/metadata/add.properties.menuitems.mask',
  'csui/widgets/metadata/header.dropdown.menu.items',
  'csui/widgets/metadata/header.dropdown.menu.items.mask',
  'csui/widgets/metadata/versions.toolbaritems.mask',

  // Metadata general action fields
  'csui/widgets/metadata/metadata.general.action.fields',
  'csui/widgets/metadata/metadata.versions.view',
  'csui/widgets/metadata/metadata.audit.view'

], {});

csui.require(['require', 'css'], function (require, css) {

  css.styleLoad(require, 'csui/bundles/csui-metadata', true);

});

