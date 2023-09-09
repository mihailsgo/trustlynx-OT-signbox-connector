## icons-v2

Icons-v2 is a handlebars helper that encapsulates the icon rendering.

### Referencing the handlebars helper

Icon-v2 is a helper for handlebars and must be registered before it can be
used.
By adding ````'smart/controls/icons.v2/icons.v2```` to the list of modules to the
require.js define statement, the handlebars helper gets registered.
This also creates the so called iconRegistry, which gets returned and
require.js sets the corresponding variable to it (here: iconRegistry).

This is an example of a require.js define statement. 
````
define(['module',
        'nuc/lib/underscore',
        'nuc/lib/backbone',
        'nuc/lib/marionette',
        'hbs!csui/controls/toolbar/toolitem',
        'smart/controls/icons.v2/icons.v2',
], function (module, _, Backbone, Marionette, template, iconRegistry) {
````

Note: the returned iconRegistry instance should not be needed when using the handlebars 
helper to render icons. However there are rare use cases where it makes
sense to get the raw SVG string for an icon.
There is another use case where the iconRegistry is needed: registering new
icons that are part of your implementation.

## How to specify the icon
In the handlebars (.hbs) template of the view, the handlebars helper
allows inserting an icon without writing down the actual html markup.
       
The name of the icon must be specified and other options can be set.
During runtime, when the template gets executed, the SVG of the specified
icon is rendered and some css classes are set, depending on the given
options.

The (mandatory) option to specify the icon is ````iconName````.

There are two ways to specify the icon:
### 1) hardcoded icon name

   In case the template should render always the same icon, the name of
   the icon can be hardcoded inside the template. The following example
   will insert the icon that is identified by the key 
   ````csui_action_search32````:
   ````
   {{{icon-v2 iconName='csui_action_search32'}}}
   ````


### 2) icon name passed from view code
   
   In case the icon depends on model data of the view, an attribute
   (here: ````svgName````) can be passed to the template either as a model
   attribute or in the object returned by the templateHelpers function.
   
   Within the handlebars template use this attribute to assign the value
   of the iconName option:
   ````
   {{{icon-v2 iconName=svgName}}}
   ````

## Toggle icons (on-state)

With icons-v2 it is supported to render icons for the so called 'on'-state.

You can find this use case typically in a toolbar, where the user
can switch on and off a specific feature.

If the symbol itself does not change but only the colors change to
signal the 'on'-state it is not necessary to provide a different icon
for this specific state. Instead the colors of some elements within the
SVG image are changed to match the right color schema.

If ````on='true'```` is set in the icon-v2 handlebars helper, the icon
is rendered with the changed colors. Technically, a css class is applied
and styles are applied through icons.v2.css (note, that you must not
override styles from icons.v2.css).

The following example shows this option in the handlebars template:
````
   {{{icon-v2 iconName='csui_action_search32' on='true'}}}
   ````
As always, the value can be hardcoded in the template or passed as
a variable through the view model or returned by the templateHelpers
function.

## Toggle icons (on-state) in toolbar.view


When displaying icons in toolbar.view, they don't need to be rendered
"by hand". Instead the toolbar items are declared in a ToolItemsFactory.
The following code piece shows an example of a toolbar item declaration:
````
{
  signature: "Properties",
  name: lang.ToolbarItemInfo,
  iconName: "csui_action_properties32"
}
```` 

The toolbar item view (toolitem.view.js) is finally using this
attribute within the handlebars template to render the icon
for this specific toolbar item.

### on-state icon variant in toolitem.view
To let toolbar item view render the icon for the on-state, you
must set the on-state in the toolitem.view model.

When a toolbar item is clicked, toolitem.view triggers the event
````toolitem:action```` and in the event argument
object is ````toolItem````, which is the items model.
Changing the model attribute ````stateIsOn```` will force the
toolbar icon to be re-rendered with the corresponding icon.
The following example shows how the stateIsOn attribute is
set depending on whether the facet filter sidebar is open or not:
````
    _toolbarActionTriggered: function (args) {
      switch (args.commandSignature) {
      case 'Filter':
        this._completeFilterCommand();
        args.toolItem.set('stateIsOn', this.showFilter);
        break;
      }
    }
````

### different icon for on-state in toolitem.view

This is similar to the previous case, but not only 
the variant with other colors is displayed, instead a
completely different icon is specified for the on-state).

To let toolitem.view render a different icon for the toggled-on
state, specifiy the second icon with the attribute name
````iconNameForOn````:
````
{
  signature: "Comment",
  name: lang.ToolbarItemComment,
  iconName: "esoc_no_comment32",
  iconNameForOn: "esoc_comment32"
}
````
To toggle the icon, follow the steps described before to set
````stateIsOn````.

## Change icon during runtime without re-rendering the whole view
If the icon is embedded in a view using ````{{{icon-v2 iconName='...}}}````,
the icon can change only if the view is re-rendered with a different
iconName.
This is not always wanted. The focus is getting lost when re-rendering
elements that currently have the focus or screenreaders interpret
the re-render as change on the page and re-read the almost same
content again.

The solution for this problem is to wrap the icon into a separate
marionette view that can be re-rendered to display a different
icon, but the outer element can stay.

For convenience, such a view is provided: ````IconView````.
Include 'smart/controls/icon/icon.view' in the list of require.js
defines and create a instance of it in your view code:
````
var iconView = new IconView({iconName: 'csui_action_properties32'});
````
Then, add a listener to the render event of your view to add
rendering of the icon:
````
this.listenTo(this, 'render', function () {
  // create a region with specified jquery element (that comes from
  // the ui object - see marionette documentation) 
  var region = new Marionette.Region({el: this.ui.myIconContainer});
  region.show(iconView);
});
````
Whenever you want to change the icon by code, you can call:
````iconView.setIcon('my_new_icon_name');````

or set the 'on'-state by calling 

````iconView.setIconStateIsOn(true/false);````

## icon theme - icons at dark background
Set the option ````theme```` to 'dark' and styling for the icons
is applied (only for action icons) to change colors in a way that
they are better visible when displayed on a dark background.

Note, that there is a helper function to detect high contrast.
You can use it by adding ````smart/utils/high.contrast/detector!'````
to the modules list of the require.js define. The module returns a
variable (you find ````highContrast```` in the smart-controls code) that
can be used to decide whether to use ````theme='dark'```` or not.
````highContrast```` is 1 for white on dark and 2 for dark on white
background.

## icon states
Set the option ````states```` to 'true' and styling for the icons
is applied (only for action icons) when the icon is hovered or active
(during click) or focused. The styles for focus are also applied when
the container element of the icon element has the focus.

## icon handleRTL
Set the option ````handleRTL```` to 'true' and the icon's direction will 
be handled automatically in RTL mode. Default value of this flag will be false
and as the leading application declear this in .hbs, the particular icon will 
have "smart-handle-rtl" class and will be reversed horizontally in RTL mode.

## trigger element
It is possible to set any parent element to trigger :hover, :active or :focus for the icon
instead detecting those state changes on the icon element only.

To do this, give the desired parent element the class ````csui-icon-v2-state-el````
and set in the icon view the following options to true 
(choose only those to which the icon should react on):
* ````hoverStateByElement````
* ````activeStateByElement````
* ````focusStateByElement````
* ````disabledStateByElement````

When using the handlebars helper, the options are specified as follows:
````
{{{icon-v2 iconName='csui_action_search32' 
           hoverStateByElement='true' 
           activeStateByElement='true'
           focusStateByElement='true'
           disabledStateByElement='true'}}}
````
A shortcut can be used in case all four flags should be set to true:
````
{{{icon-v2 iconName='csui_action_search32' 
           allStateByElement='true'
}}}
````
If ````allStateByElement```` is set to ````true````, the other tree flags are not
evaluated and handled as they would all be ````true````.

If the trigger element is not a button, it has no disabled flag. If such an element
should be marked as disabled anyways, the modifier class csui-disabled can be
added to it.

## grayscale (DEPRECATED. Use filter='grayscale' instead)
Set the option ````filter```` to 'grayscale' and styling for the icons
is applied to make all colors appear grayscale. This is useful for icons
that should display a disabled state of an item.

## colorTheme
Set the option ````colorTheme```` to one of the following theme names and the icon is displayed in
colors based on the theme colors.
* ````Tree````
* ````OT Navy````
* ````OT Indigo````
* ````OT Plum````
* ````OT Teal````
* ````OT Light Blue````
* ````OT Steal````
* ````OT Cloud````

Note: to be able to use colorTheme, the SVG must be drawn in a way that
all elements (path, poly, circle, etc.) that should get colorFirst from the theme colors are in
a layer with name 'colorFirst'. The exported SVG should then have a group with
 id="colorFirst". The same rules apply for colorSecond and colorThird.

During build, the layer-ids are converted into a corresponding class names that are used by
 icons-v2 css to apply the corresponding theme colors.

The actual color values are defined in the icons.v2.css stylesheet. Note, that only fill colors 
are currently used and stroke is set to ````none````.

## icon sizes
Set the option ````size```` to one of the following values:
1) ````xlarge```` (48px)
2) ````large````  (40px)
3) ````normal```` (default - when no size is specified: 32px)
4) ````small````  (24px)
5) ````xsmall```` (16px)
6) ````contain```` (width: 100%, height: 100%)

Note that using ````contain```` allows at the one side every individual
icon size, but that should be used only in rare cases. One valid use case
is if the icon should grow or shrink with the outer element.

## Extend icons-v2 with own icons in external modules
There are two ways to extend the 'icon registry' with additional icons:
1) use the extension mechanism of icons-v2
2) call registerIcons from your external module

### Adding icons by using icons-v2 extension mechanism
This approach is suggested only if it is essential that the added icons are
available even before your external module is loaded. An example is the addition
of mime type icons for new document types and because your module is displaying
mime type icons for example in standard widgets at the landing page, those
icons must immediately be available.

To let the icons-v2 extension mechanism load your icons into the icon registry,
create a javascript module which returns a javascript object where the keys are the icon
names by which they are accessed. The value is the SVG string (SVG image files
contain only text in SVG format. Make it to be a single line and use that string).

It is necessary to add ````class="csui-icon-v2```` to the root svg element of
each icon. In the example below you see an additional class, which has the 
icon name in it. This class is not used in any css selectors. It is for reference
only and you should not add styles in css that depend on such a icon specific
class. You even should not create css selectors to override icon-v2 styling.

It is also good practice to prefix the icon name with the module name.

The following is an example of such a module:
````
define([], function () {
  return {"mymodule_funny": '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 32 32" style="enable-background:new 0 0 32 32;" xml:space="preserve" ' +
                            'class="csui-icon-v2 csui-icon-v2__mymodule_funny"> ' +
                            '<path d="M15.167,23.5c0,0.5,0.333,0.833,0.833,0.833S16.833,24,16.833,23.5v-6.667H23.5c0.5,0,0.833-0.333,0.833-0.833S24,15.167,23.5,15.167h-6.667V8.5C16.833,8,16.5,7.667,16,7.667S15.167,8,15.167,8.5v6.667H8.5C8,15.167,7.667,15.5,7.667,16S8,16.833,8.5,16.833h6.667V23.5z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333"/>' + 
                            '</svg>',
... more icons ...
  };
});
````

To let smart controls, add the icons from your module, you must add it to your
<module>_extensions.json like the following:
````
  "smart/controls/icons.v2/icons.v2": {
    "extensions": {
      "smart": [
        "mymodule/myicons"
      ]
    }
  },

````


Important: if the icons are only referred in your module, it is strongly
recommend to use the second approach (see below), because
this helps keeping the size of the initial loaded icons small.

### Adding icons by calling registerIcons

Using slightly different code in your icon file does the registration of 
your icons at the time when your module is loaded the first time:

define([
  'smart/controls/icons.v2/icons.v2',
], function (iconRegistry) {
  iconRegistry.registerIcons(
      {
        "esoc_no_comment32": '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                             ' xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"' +
                             ' viewBox="0 0 32 32" style="enable-background:new 0 0 32 32;"' +
                             ' xml:space="preserve" class="csui-icon-v2' +
                             ' csui-icon-v2__esoc_no_comment32"><circle cx="16" cy="16" r="14"' +
                             ' fill="none" class="csui-icon-v2-state"/><path' +
                             ' d="M12.259,23.75v-2.955c-2.066,0-3.741-1.654-3.741-3.694v-2.956c0-2.04,1.675-3.694,3.741-3.694h7.481c2.066,0,3.741,1.654,3.741,3.694V17.1c0,2.04-1.675,3.694-3.741,3.694h-4.489L12.259,23.75z M15.868,22.295h3.873c2.877,0,5.241-2.308,5.241-5.194v-2.956c0-2.886-2.364-5.194-5.241-5.194h-7.481c-2.877,0-5.241,2.308-5.241,5.194V17.1c0,2.364,1.586,4.34,3.741,4.978v1.672c0,0.605,0.363,1.151,0.922,1.384c0.558,0.233,1.202,0.108,1.632-0.317L15.868,22.295z" fill-rule="evenodd" clip-rule="evenodd" fill="#333333" class="csui-icon-v2-metaphor0"/><circle cx="16" cy="16" r="15.5" fill="none" stroke="#2E3D98" class="csui-icon-v2-focus"/></svg>',
        ...
      }
  );
  return iconRegistry;
});


Here the icon module requires the icons.v2 module from smart controls, which returns
the icon registry (iconRegistry).
By calling ````iconRegistry.registerIcons({... list of icons ...});````
the icons are added to the registry when this module is loaded and at that
time those icons are available in the handlebars helper.

This is the preferred way to register additional icons. Adding the module path
to the <module>_extensions.json file is not needed.
