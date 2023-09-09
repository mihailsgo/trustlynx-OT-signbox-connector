# MultilingualTextFieldView (controls/form/fields/multilingual.textfield.view)

  Shows a `MultilingualTextFieldView`. The `MultilingualTextFieldView` shows a multilingual text
  field single line input
  control. The model behind expects a field `data` holding the Object value. in case the value is
   a text value then it will be internally converted into Object and the text value will be
   treated as a default language value.
  `MultilingualTextFieldView` is derived from [FormFieldView](./formfield.md) and inherits its behavior.
  The multilingual text field is implemented as a button in read state and as a html input field
  in write state.

## Example for a new registered alpaca type for single line input

    _.extend(form.options.fields, {
      "187420_6": {
        ...
        "label": "Multilingual (text)",
        "type": "otcs_multilingual_string"    //  this type decides about the field will be
                                                  normal input field or multilingual input field
        ...
      }
    });

## Example

    var model = new Backbone.Model({ data: 'Text' }),
        contentRegion = new Marionette.Region({el: '#content'}),
        field = new TextFieldView({
          id: 'id1',
          model: model
        });

    field.on("field:changed", function (event) {
        alert(event.fieldid + ' field:changed, new value: ' + event.fieldvalue);
    });

    contentRegion.show(field);

## Constructor Summary

### constructor(options)

  Creates a new `MultilingualTextFieldView`.

#### Parameters:

* `options` - *Object* The view's options object.
* `options.model` - *Backbone.Model* holding the model used by the view.

#### Returns:

  The newly created object instance.

#### Example:

  See the [MultilingualTextFieldView](#) object for an example.


## Note:

if type provided as otcs_multilingual_string, text field will ideally works a multilingual
input field (with globe icon).
But if more then one metadata languages are not configured then multilingual input field will
behave like a normal input field.