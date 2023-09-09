# NodeTableReportView

**Module: webreports/widgets/nodestable.report/nodestable.report.view**

Shows a full page Nodes Table WebReport. The Nodes Table WebReport provides a table of nodes returned by a WebReport data source. This widget is similar to other table widgets such as the Node Browsing Table.

This widget must use the ID of a WebReport that uses the `Nodes List WebReport Widget - Report JSON` default reportview. This uses the INSERTJSON tag with the @NODESTABLEFIELDS directive to return Smart UI compatible node data from nodes in the data source. See the WebReports tag guide and Nodes Table WebReport widget documentation for more information.

This widget allows for filtering on the nodes by opening a search field and entering filter criteria. Nodes can be filtered by name and are sorted ascending alphabetically by name. Clicking on a single node executes the default action for the node. Each node has an inline action bar with additional actions and checkboxes for multi-select actions.

### Licensing

Although it is installed as part of core Content Server, WebReports is licensed separately. This component will only be available on an instance if you apply a valid WebReports license or if you install a licensed Content Server Application.

### Example

     var    contentRegion = new Marionette.Region({el: '#content'}),
            pageContext   = new PageContext(),
            nodesTableReportView,
            options;

     options = {
        context: pageContext,
        data: {
            id: 73591,
            title: 'Most Commonly Accessed Locations',
            titleBarIcon: 'title-assignments',
            parameters: [
            {
                name: 'myparm1',
                value: 'val1'
            },
            {
                name: 'myparm2',
                value: 'val2'
            }
            ]
        }
     };

     nodesTableReportView = new NodesTableReportView(options);
     contentRegion.show(nodesTableReportView);
     pageContext.fetch();

### Options

`context` (PageContext)
: **Mandatory.** A PageContext object instance referencing RequireJS path `csui/utils/contexts/page/page.context`.

### Options Data

`id` (integer)
:**Mandatory.** The ID for the WebReport that you want to use to generate the JSON data for the tile.

`title` (string)
:**Optional.** The title for the tile. Typically, this would describe the WebReport that you are rendering.

`titleBarIcon` (string)
:**Optional.** The CSS class for the icon that you want to appear in the top left corner. For example: Content ServerInstallDir/support/csui/themes/carbonfiber/icons.css contains icons such as title-assignments, title-customers, title- favourites, title-opportunities, title-recentlyaccessed, title-activityfeed, title-customviewsearch. Default value = “title-webreports” icon .

`parameters` (array)
:**Optional.** One or more “name”-“value” pairs for the parameters that you want to pass into the WebReport.

