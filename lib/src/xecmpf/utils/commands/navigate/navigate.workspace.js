/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([], function () {
    return {
        isWorkspaceNavigationEnabled: function (status, options) {
            if (status.context && status.context.options) {
                var contextOptions = status.context.options;
                if (contextOptions.enableWorkspaceNavigation === false) {
                    return false;
                } else {
                    return true;
                }
            }
            return true;
        },

        checkNodesTableToolbarElements: function (status, options, current) {
            if (status.context && status.context.options) {
                var contextOptions = status.context.options;
                if (contextOptions.navigateMode && contextOptions.navigateMode === 'treeView') {
                    return { treeView: true, navigateUp: false };
                } else if (contextOptions.navigateMode && contextOptions.navigateMode === 'navigateUp') {
                    return { treeView: false, navigateUp: true };
                }
            }
            return current;
        },

        checkHeaderViewOptions: function (options, current) {
            if (options.context && options.context.options) {
                var contextOptions = options.context.options;
                if (contextOptions.headerViewOptions) {
                    return contextOptions.headerViewOptions;
                }
            }
            return current;
        }
    };
});