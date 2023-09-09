# Multilingual Popover Mixin

 * Defines the interface for sending/receiving popover data from multilingual form view and provides an implementation for updating data.
 * Multilingual form view is required to perform the operations like updating the data in popover and updating the respective model.

### How to load the multilingual form extension through config?

The extension point is supposed to be used like this:

### Example

```javascript
   _.defaults(config, {
        PopoverFormView: 'csui/controls/multilingual.text.picker/impl/multilingual.form.view'
      });
```
If the extension point is not provided, the default multilingual form is loaded.

```javascript
require([config.PopoverFormView], function (PopoverFormView) {
                self.multiLingualForm = new PopoverFormView(pickerOptions);
      });
```
## Parameters used in PopoverFormView

var pickerOptions = {
                data: array of objects,
                popoverTargetElement: targetElement,
                valueRequired: boolean,
                mlGlobeIcon: GlobeIcon,
                parentView: this,
                textField: boolean,
                changetoReadmodeOnclose: boolean
              };
 * data -
 ```json
data format:
               [
                 {"default":false,"language_code":"ko_KR","display_name":"í•œêµ­ì–´","value":"koreanvalue"},
                 {"default":true,"language_code":"en","display_name":"English","value":"englishvalue"},
                 {"default":false,"language_code":"de_DE","display_name":"Deutsch (Deutschland)","value":"germanvalue"},
                 ...
                 ...
                 ..
               ]
```
 * popoverTargetElement - HTML DOM element
 * valueRequired - true if atleast one field of popover is required
 * mlGlobeIcon - HTML DOM element
 * parentView - reference of current view
 * textField - if true, the input field in popover is displayed as textField if not displayed as textarea field(description field)
 * changetoReadmodeOnclose - if true, it triggers the 'ml:close:writeMode' event which changes from read mode to write mode(description field)


## Events need to be triggered to communicate with multilinugal form view

### ml:doneWith:popover

This event is triggered once all the data is entered in popover and on listening this in multilingual form view, gets the popover data , does the validation, and enable the popover to save.

### ml:hide:popover

This event is triggered to close the multilingual popover

### ml:show:popover

This event is triggered to show the multilingual popover

### ml:close:writeMode

This event is triggered for special cases to change write mode to read mode(for description field).





