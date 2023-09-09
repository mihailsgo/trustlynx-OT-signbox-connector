# VisualCountFullPageView

**Module: webreports/widgets/visual.count.full.page/visual.count.full.page.view**

Shows a filtered count chart in a full page widget. The chart types currently supported for the filtered count full page widget are pie, donut, horizontal bar and vertical bar. This widget requires a WebReport to be used to get the data. There are default reportviews that generate data in the correct format. Only reportviews that support dynamic filtering can be used with this widget.

The widget supports showing grouped counts of distinct values in a particular WebReport data source column. The active column and other aspects of the chart view can be dynamically changed in the UI.

This widget has support for dynamic filtering of columns by one or more values. It also allows one or more custom launch buttons to be added which can run a WebReport to process the grouped and filtered data.

This widget is fully documented in the Perspective Manager help.

### Licensing

Although it is installed as part of core Content Server, WebReports is licensed separately. This component will only be available on an instance if you apply a valid WebReports license or if you install a licensed Content Server Application.

### Example

```javascript

      var contentRegion = new Marionette.Region({el: '#content'}),
          context = new PageContext(),
          barChartView = new VisualCountFullPageView({
                                  context: context,
                                  data: {
                                        id: 218890,
                                        title: 'Full Page Bar Chart',
                                        type: 'horizontalBar',
                                        theme: 'otPrimary',
                                        activeColumn: 'Habitat',
                                        viewValueAsPercentage: false,
                                        groupAfter: -1,
                                        sortBy: 'ordinal',
                                        sortOrder: 'asc',
                                        launchButtonConfig: {
                                          rowLimit: 2,
                                          launchButtons:
                                              [
                                                  {
                                                      launchButtonID: 12345,
                                                      launchButtonLabel: "Email Results",
                                                      launchButtonTooltip: "Process filtered data using Email Results"
                                                  },
                                                  {
                                                      launchButtonID: 54321,
                                                      launchButtonLabel: "Export to CSV",
                                                      launchButtonTooltip: "Process filtered data using Export to CSV"
                                                  },
                                                  {
                                                      launchButtonID: 88888,
                                                      launchButtonLabel: "Save as Snapshot",
                                                      launchButtonTooltip: "Process filtered data using Save as Snapshot"
                                                  }
                                              ]
                                        },
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
                              });

      contentRegion.show(barChartView);
      pageContext.fetch();


```

### Options

`context` (PageContext)
: **Mandatory.** A PageContext object instance referencing RequireJS path `csui/utils/contexts/page/page.context`.

### Options Data

`id` (integer)
: **Mandatory.** DataID for the WebReport which contains the Visualization data

`activeColumn` (string)
: **Mandatory.** The name of the column in the data source which will be used to group and count the data.

`title` (string)
: **Optional.** The title of the tile to be rendered in the tile header

`type` (string)
: **Optional.** Defines the type of visualization used for your data set.
    Valid values are: ["bar", "verticalBar","horizontalBar","donut","pie"].
    Default = "bar".
    Note: "bar" and "verticalBar" are equivalent.

`theme` (String)
default: `otPrimary`
Color scheme used for charts. Possible values are `otPrimary`, `otSecondary`, `otTertiary` or `dataClarity`. Themes have an array of colours which the chart will cycle through for each new data category. If the number of categories exceeds the number of colours in the theme, the colour will cycle back to the start of the palette.

`viewValueAsPercentage` (boolean)
: **Optional.** Determines whether the count values are shown as actual or percentages.
    Default = false.

`groupAfter` (integer)
: **Optional.** The threshold used to determine how many distinct data values should be displayed before grouping the remaining values under Other.
    Valid values: [-1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
    Default = -1 (This uses the default for the particular chart type. Bar chart default: 15, Pie chart default: 5, Donut chart default: 5.)

`sortBy` (string)
: **Optional.** Defines the type of visualization used for your data set.
    Valid values are: ["ordinal","Count"].
    Default = "Count".

`sortOrder` (string)
: **Optional.** Defines the type of visualization used for your data set.
    Valid values are: ["desc","asc"].
    Default = "desc".

`launchButtonConfig` (Object)
: **Optional.** Object containing the `launchButtons` array to define custom buttons in the expanded view which can run a WebReport. There is also a `rowLimit` integer to limit the number of items that can be exported in the UI for performance reasons.

`parameters` (array)
: **Optional.** Parameters that are to be appended to the URL and passed into the Chart WebReport


