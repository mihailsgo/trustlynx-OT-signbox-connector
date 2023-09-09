# MultilingualTextAreaFieldView (controls/form/fields/multilingual.textareafield.view)

  Shows a `MultilingualTextAreaFieldView`. The `MultilingualTextAreaFieldView` shows a standalone
  multiline textarea control.
  The model behind expects a field `data` holding the Object value. in case the value is
   a text value then it will be internally converted into Object and the text value will be
   treated as a default language value.
  `MultilingualTextAreaFieldView` is derived from [FormFieldView](./formfield.md) and extended from
  [TextAreaFieldView](./textareafield.md) and inherits its behavior.
  The multilingual textarea field is implemented as a button in read state and as a html textarea
   input in write state.

## Example for new alpaca type

  _.extend(form.options.fields, {
    "187420_6": {
      ...
      "label": "Multilingual (text)",
      "type": "otcs_multilingual_textarea"    //  this type decides about the field will be
                                                normal textarea field or multilingual
                                                textarea field
      ...
    }
  });

 ## Example

    var model = new Backbone.Model({ data: 'Text' }),
        contentRegion = new Marionette.Region({el: '#content'}),
        field = new TextAreaFieldView({
          id: 'id1',
          model: model
        });

    field.on("field:changed", function (event) {
        alert(event.fieldid + ' field:changed, new value: ' + event.fieldvalue);
    });

    contentRegion.show(field);


## Constructor Summary

### constructor(options)

  Creates a new `MultilingualTextAreaFieldView`.

#### Parameters:

* `options` - *Object* The view's options object.
* `options.model` - *Backbone.Model* holding the model used by the view.

#### Returns:

  The newly created object instance.

#### Example:

  See the [MultilingualTextAreaFieldView](#) object for an example.


## Note:

if type provided as otcs_multilingual_textarea, textarea field will ideally works a multilingual
textarea field (with globe icon).
But if more then one metadata languages are not configured then multilingual textarea field will
behave like a normal textarea field.