/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/controls/icons.v2',
  'csui/controls/icon/icon.view',
  'csui/behaviors/default.action/default.action.behavior',
  'csui/behaviors/default.action/impl/defaultaction',
  'csui/behaviors/dropdown.menu/dropdown.menu.behavior',
  'csui/behaviors/keyboard.navigation/retainfocus.behavior',
  'csui/behaviors/keyboard.navigation/tabkey.behavior',
  'csui/behaviors/widget.container/widget.container.behavior',
  'csui/controls/error/error.view',
  'csui/controls/globalmessage/globalmessage',
  'css!csui/controls/globalmessage/globalmessage_icons',
  'csui/controls/grid/grid.view',
  'csui/controls/doc.preview/doc.preview.view',
  'csui/controls/doc.preview/active.plugin',
  'csui/controls/doc.preview/preview.plugins/preview.plugins',
  'csui/controls/node-type.icon/node-type.icon.view',
  'csui/controls/progressblocker/blocker',
  'csui/controls/globalmessage/impl/progresspanel/progresspanel.view',
  'csui/controls/globalmessage/impl/progresspanel/progressbar.view',
  'csui/controls/globalmessage/progresspanel.view.ext',
  'csui/controls/globalmessage/progressbar.view.ext',
  'i18n!csui/controls/globalmessage/impl/nls/globalmessage.lang',
  'csui/controls/perspective.panel/perspective.animator',
  'csui/controls/perspective.panel/perspective.panel.view',
  'csui/controls/breadcrumbspanel/breadcrumbspanel.view',
  'csui/controls/breadcrumbs/breadcrumbs.view',
  'csui/controls/breadcrumbs/breadcrumb.view',
  'csui/controls/breadcrumbs/impl/breadcrumb/breadcrumb.view',
  'csui/controls/form/pub.sub',
  'csui/controls/mixins/keyboard.navigation/modal.keyboard.navigation.mixin',
  'csui/controls/tab.panel/tab.panel.view',
  'csui/controls/tab.panel/tab.links.dropdown.view',
  'csui/controls/tab.panel/tab.links.ext.scroll.mixin',
  'csui/controls/tab.panel/tab.links.ext.view',
  'csui/controls/tab.panel/impl/tab.link.ext.view',
  'csui/controls/tab.panel/impl/tab.contents.view',
  'csui/controls/tab.panel/behaviors/common.keyboard.behavior.mixin',
  'csui/controls/tab.panel/behaviors/tab.contents.keyboard.behavior',
  'csui/controls/tab.panel/behaviors/tab.contents.proxy.keyboard.behavior',
  'csui/controls/tab.panel/behaviors/tab.links.dropdown.keyboard.behavior',
  'csui/controls/tab.panel/behaviors/tab.links.keyboard.behavior',
  'csui/controls/tab.panel/behaviors/tab.panel.keyboard.behavior',
  'csui/controls/perspective.header/perspective.header.view',
  'csui/controls/tab.panel/impl/tab.link.view',
  'csui/controls/tab.panel/impl/tab.links.view',
  'i18n!csui/controls/tab.panel/impl/nls/lang',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'csui/controls/mixins/view.events.propagation/view.events.propagation.mixin',
  'csui/controls/mixins/global.alert/global.alert.mixin',
  'csui/controls/mixins/view.state/metadata.view.state.mixin',
  'csui/controls/mixins/view.state/node.view.state.mixin',
  'csui/controls/mixins/view.state/toolitems.state.mixin',
  'csui/controls/mixins/view.state/multi.node.fetch.mixin',
  'csui/controls/mixins/view.state/node.selection.restore.mixin',
  'csui/controls/tile/behaviors/blocking.behavior',
  'csui/controls/tile/behaviors/infinite.scrolling.behavior',
  'csui/controls/tile/behaviors/parent.scrollbar.updating.behavior',
  'csui/controls/tile/behaviors/perfect.scrolling.behavior',
  'csui/controls/tile/behaviors/searching.behavior',
  'csui/dialogs/modal.alert/modal.alert',
  'csui/perspectives/flow/flow.perspective.view',
  'csui/perspectives/grid/grid.perspective.view',
  'csui/perspectives/left-center-right/left-center-right.perspective.view',
  'csui/perspectives/banner-content-sidebar/banner-content-sidebar.perspective.view',
  'csui/perspectives/sidepanel-left/sidepanel-left.perspective.view',
  'csui/perspectives/sidepanel-right/sidepanel-right.perspective.view',
  'csui/perspectives/single/single.perspective.view',
  'csui/perspectives/tabbed/tabbed.perspective.view',
  'csui/perspectives/tabbed-flow/tabbed-flow.perspective.view',
  'csui/perspectives/zone/zone.perspective.view',
  'csui/perspectives/mixins/perspective.edit.mixin',
  'csui/perspectives/tabbed/tab.index/tab.index.preferences',
  'csui/pages/start/perspective.router',
  'csui/pages/start/perspective.routing',
  'csui/pages/start/multi.perspective.routing',
  'csui/pages/start/impl/landing.perspective.router',
  'csui/pages/start/impl/node.perspective.router',
  'csui/pages/start/impl/search.perspective.router',
  'csui/pages/start/impl/metadata.perspective.router',
  'csui/pages/start/impl/root.perspective.router',
  'csui/pages/start/impl/version.perspective.router',
  'i18n!csui/pages/start/impl/nls/lang',
  'csui/utils/classic.nodes/impl/core.classic.nodes',
  'csui/utils/content.helper',
  'csui/utils/handlebars/l10n',
  'csui/utils/impl/core.defaultactionitems',
  'csui/utils/non-attaching.region/non-attaching.region',
  'csui/utils/non-emptying.region/non-emptying.region',
  'csui/utils/script-executing.region/script-executing.region',
  'csui/utils/node.links/impl/core.node.links',
  'csui/utils/open.authenticated.page',
  'csui/utils/smart.nodes/impl/core.smart.nodes',
  'csui/utils/taskqueue',
  'csui/behaviors/keyboard.navigation/tabables.behavior',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/models/node/node.addable.type.factory',
  'csui/controls/perspective.panel/perspective.factory',
  'csui/utils/contexts/browsing/browsing.context',
  'csui/utils/contexts/impl/csui.context.plugin',
  'csui/utils/contexts/portal/portal.context',
  'csui/utils/contexts/perspective/impl/landing.perspective.context.plugin',
  'csui/utils/contexts/perspective/plugins/node/node.perspective.context.plugin',
  'csui/utils/contexts/perspective/impl/search.perspective.context.plugin',
  'csui/utils/contexts/perspective/plugins/search.perspective.context.plugin',
  'csui/utils/contexts/perspective/impl/metadata.perspective.context.plugin',
  'csui/utils/contexts/perspective/impl/root.perspective.context.plugin',
  'csui/utils/contexts/perspective/impl/version.perspective.context.plugin',
  'csui/utils/contexts/perspective/plugins/node/main.node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/impl/csui.node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/impl/csui.main.node.extra.data',
  'csui/utils/contexts/perspective/plugins/node/utils/implement.extra.data',
  'csui/utils/contexts/perspective/plugins/node/utils/merge.extra.data',
  'csui/utils/contexts/perspective/landing.perspectives',
  'csui/utils/contexts/perspective/node.perspectives',
  'csui/utils/contexts/perspective/perspective.context',
  'csui/utils/contexts/perspective/perspective.guide',
  'csui/utils/contexts/perspective/perspective.context.plugin',
  'csui/utils/contexts/perspective/search.perspectives',
  'csui/utils/contexts/factories/ancestors',
  'csui/utils/contexts/factories/appcontainer',
  'csui/utils/contexts/factories/children',
  'csui/utils/contexts/factories/children2',
  'csui/utils/contexts/factories/columns',
  'csui/utils/contexts/factories/columns2',
  'csui/utils/contexts/factories/global.error',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/next.node',
  'csui/utils/contexts/factories/previous.node',
  'csui/utils/contexts/factories/version',
  'csui/utils/contexts/factories/next.version',
  'csui/utils/contexts/factories/user',
  'csui/utils/contexts/factories/usernodepermission',
  'csui/utils/contexts/factories/volume',
  'csui/utils/contexts/factories/application.scope.factory',
  'csui/utils/contexts/factories/favoritescolumns',
  'csui/utils/contexts/factories/favorite2groups',
  'csui/utils/contexts/factories/favorites',
  'csui/utils/contexts/factories/favorites2',
  'csui/utils/contexts/factories/favorite2columns',
  'csui/utils/contexts/factories/myassignmentscolumns',
  'csui/utils/contexts/factories/myassignments',
  'csui/utils/contexts/factories/recentlyaccessedcolumns',
  'csui/utils/contexts/factories/recentlyaccessed',
  'csui/utils/contexts/factories/search.results.table.columns',
  'csui/utils/contexts/factories/search.results.table.factory',
  'csui/utils/contexts/factories/member',
  'csui/utils/contexts/factories/search.box.factory',
  'csui/utils/contexts/factories/search.formquery.factory',
  'csui/utils/contexts/factories/search.metadata.factory',
  'csui/utils/contexts/factories/search.query.factory',
  'csui/utils/contexts/factories/metadata.factory',
  'csui/utils/contexts/factories/task.queue.factory',
  'csui/utils/contexts/factories/server.info',
  'csui/utils/contexts/factories/search.settings.factory',
  'csui/utils/contexts/factories/compound.document.reorganize.factory',
  'csui/utils/contexts/factories/largefilesettings.factory',
  'csui/utils/contexts/factories/objecttypes.factory',
  'csui/pages/start/impl/location',
  'json!csui/utils/contexts/perspective/impl/perspectives/document.overview.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/version.overview.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/favorites2.table.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/container.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/metadata.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/metadata.navigation.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/myassignmentstable.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/recentlyaccessedtable.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/search.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/saved.query.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/user.json',
  'json!csui/utils/contexts/perspective/impl/perspectives/searchresults.table.json',
  'csui/widgets/error/error.view',
  'csui/models/widget/recentlyaccessed.model',
  'csui/temporary/activeviews/icons/icons',
  'csui/temporary/appearances/icons/icons',
  'csui/temporary/cop/icons/icons',
  'i18n!csui/models/widget/nls/lang',
  'i18n!csui/perspectives/impl/nls/lang',
  'csui/models/widget/myassignments.model'
], {});

require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-data', true);
});