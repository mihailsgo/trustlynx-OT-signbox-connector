# Mutilingual Form

  * Mutilingual Form view creates a popover with multilingual information provided.

## Extension

  * Any module can extend this general multilingual form view from that point, derived multilingual form
  views provides their own templates and implementation along with the methods in parent form view.
  * If any module want to render new custom form, then they have to register their views against the
  custom form through the extension provided.

### How to register new custom form view through extension

Custom form views has to be registered as shown below from other modules.

```javascript
   'csui/controls/multilingual.text.picker/multilingual.popover.mixin': {
              PopoverFormView: 'esoc/form/multilingual.form.view'
    },
```
 ### What should these custom form view consists of?

 * These extension point from other modules should provide their own methods.
 * The extended multilingual form view can provide their own templates and implementation along with the methods in parent form view
 * The derived form view can use the methods like closePopover(), showPopover(),  etc.. form the parent form view.

## Methods

### initializationData ()

Must be called in the constructor to initialize the functionality.

### closePopover ()

Closes the multilingual popover on listening the 'ml:hide:popover' event from multilingual popover mixin.

### showPopover ()

shows the multilingual popover on listening the 'ml:show:popover' event from multilingual popover mixin.

### onKeyDown ()

Provides the keyboard navigation for the input fields in the popover.

## Events need to be triggered to communicate with multilingual mixin

### ml:doneWith:popover

This event is triggered once all the data is entered and closed the popover. The result data is sent to mixin in below format:

### Example

```json
dataformat:
               [
                 {"default":false,"language_code":"ko_KR","display_name":"í•œêµ­ì–´","value":"updated koreanvalue"},
                 {"default":true,"language_code":"en","display_name":"English","value":"updated englishvalue"},
                 {"default":false,"language_code":"de_DE","display_name":"Deutsch (Deutschland)","value":"updated germanvalue"},
                 ...
                 ...
                 ...
               ]
```














