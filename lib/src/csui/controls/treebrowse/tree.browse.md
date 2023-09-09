# Tree Navigation (controls/node.tree.view)
==============

Shows a tree to navigate between different nodes in multiple levels directly.

## Tree Navigation in NodesTableView

Presently it is used in nodestable view(widgets/nodestable/nodestable.view.js) for navigating through multiple levels. But it is not enabled by default.
Any module that wants tree in nodestable can enable it with the help of interface that has been provided.(csui/controls/treebrowse/navigation.tree.js)

There are two steps in enabling the tree view in nodestable for any module

i)  Provide an extension to the interface 'csui/controls/treebrowse/navigation.tree'
ii) Provide own implementation of enable and data methods in the extension. status and options are passed as parameters to the enable and data methods.

### Example

conws/conws-extensions.json

"csui/controls/treebrowse/navigation.tree": {
    "extensions": {
      "conws": ["conws/utils/test/conws.navigation.tree"]
    }
}

conws/utils/test/conws.navigation.tree

return {
    sequence: 50,
    enable: function(status, options) {
        if(status.xyz === true)
           return true;
    },
    data: function(status, options) {
        return {
            lazyTree : false,
            showItemsBlockSize : 15,
            rootNodes: [nodemodel]
        }
    }
}

#### Parameters thats need to be included as part of module config:
* `sequence` - *number*
default: `100`
Decides the priority of a module when multiple modules enabled treeview.
* `enable` - *function*
Decides whether the treeview command should be visible or not. Need to return a logic whether tree view command is visible.
* `data` - *function*
Returns an object of data that are passed to treeview. The parameters that are returned by the data method are passed as options to the constructor of node.tree.view.
Paremeters that can be returned by data method are:

##### Parameters:
* `lazyTree` - *Boolean*
default: `false`
Decides whether to prefetch items at one level ahead to display without any delay on clicking showmore button / to fetch the items after clicking show more button.
* `showItemsBlockSize` - *Number*
default: `10`
Number of items that are shown on expansion of any node or clicking on showmore button.
* `rootNodes` - *Array of nodemodels*
default: `top most ancestor node of the currently active node`
An array of nodes which are used as root nodes by the tree. If more than one root node is provided then multiples root nodes are displayed.

## Tree Navigation in any other widget

This tree view is independant component and not tightly coupled with nodestable, so can be used in different widgets as well.
Instantiating the tree in any other widget can be done as follows.

### Example
var nodeTreeViewnew = NodeTreeview({
   originatingView: this,
   lazyTree : false,
   showItemsBlockSize : 15,
   rootNodes: [nodemodel]
})

#### Required Parameters:

* `originatingView` -
The tree view uses originating view in order to get the connector and context. Tree view uses them in order to function.
It also uses the collection of the originating view to be in sync with changes of originating view, like updating names of nodes etc in the originating view.

Options that are passed to tree view override the defult options in tree view. In similar way, callabacks that are passed to fancytree can also be overriden.

#### Optional Parameters:
* `lazyTree` - *Boolean*
default: `false`
Decides whether to prefetch items at one level ahead to display without any delay on clicking showmore button / to fetch the items after clicking show more button.
* `showItemsBlockSize` - *Number*
default: `10`
Number of items that are shown on expansion of any node or clicking on showmore button.
* `rootNodes` - *Array of nodemodels*
default: `top most ancestor node of the currently active node`
An array of nodes which are used as root nodes by the tree. If more than one root node is provided then multiples root nodes are displayed.








