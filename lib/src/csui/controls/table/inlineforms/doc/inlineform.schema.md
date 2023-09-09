# InlineFormSchema

  * `InlineFormSchema` is different from general 'InlineFormView'
  * General `InlineFormView` has a base inline form view, from that point, derived inline form
  views extends and provides their own templates and implementation.
  * Due to which, there is no centralized control to apply any fix and/or any new enhancements
  which can be applied seamlessly to all inline forms.
  * For this, introduced this `InlineFormSchema` which has basic inline form schema view that
  has the control to render the inline form view based on the schema provided by the respective module.

### How to provide schema through extension

All module's schema classes can be loaded by registering respective module extension, which
returns a view in the format as shown below.

The extension point is supposed to be used like this:

```json
  'csui/inlineform/inlineform.schemas': {
    'extensions': {
      'otemail': [
        'otemail/controls/table/inlineforms/emailfolder/email.inlineform.view'
      ]
    }
  }
```

### Format of inline form schema

Below is the format of inline for schema.

```js
    define([i18n!oteaml/table/inlineform/inlineformschema/impl/nls/root], function(lang) {
      return [{
        equals: {type: 751}, // required
        addableCommandInfo: { // optional
          signature: "AddEmailFolder"
        },
        form: {
          fields: {
            name: {
              type: 'text',
              required: true,
              namePlaceholder: lang.NewNamePlaceholder, //NewNamePlaceholder: "Enter e-mail folder name", in lang bundle.
              multilingual: true
            }
          }
        }
      }];
    });
```

#### About each schema attribute

* `equals` (Object): It has a type attribute. Value is object's sub-type. In legacy inline form
view, similar property is `CSSubtype`.

    `Required`: true

    `Example`:

        equals: {
          type: 751 // 751 is email folder's sub-type
        }


* `addableCommandInfo` (Object): It has `signature` and `group`, which is used to filter the
add command toolbar. In legacy inline form view, similar property is obtained from
`getAddableCommandInfo` function.

    `Required`: false

    `Default`:

        addableCommandInfo: {
          signature: 'Add',
          group: 'add'
        }

    `Example`:

        addableCommandInfo: {
          signature: 'AddWorkspace',
          group: 'conws'
        }


* `schema` (object): It has the complete information about the inline form input fields. Each
input field has it's own attributes.

    `Required`: true

    Attributes of schema field's property:

    * type: (String), data-type of field. Example: String, Select, etc.,

    * required: (Boolean), value is required or not.
      default: false

    * multilingual: (Boolean), add multilingual support to current input field.
      default: false

    * namePlaceholder: (String), text to be shown as placeholder and aria-label for the current
    input field.

    * regex: (regex pattern), validates the current input field against the given regex.

    * getData: (Function), which return promising object, once resolved, it renders the current
    input field with the data.


### typical example name (text field - with multlingual, url filed - with regex, select field - with getData function)

 

   ```js
     {
      equals: {type: 0},
      form: {
        fields: {
          name: {
            type: 'text',
            required: true,
            namePlaceholder: lang.NewNamePlaceholder,
            // Multilingual globe icon will enable if 'multilingual' is true
            multilingual: true
          },
          url: {
            type: 'text',
            required: true,
            namePlaceholder: lang.UrlAddressPlaceholder,
            // field validation done against below regex
            regex: /^[a-z0-9]+:\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*(\:[0-9]{1,5})?(([0-9]{1,5})?\/.*)?$/i
          },
           reference_type: {
              type: 'select',
              required: true,
              hideInEditMode: true,
              namePlaceholder: lang.WSTypePlaceholder,
              // below function will execute at the time of inlineform rendering
              // this form returns promising object which internally has the complete info of select field
              getData: function (options) {
                var deferred = $.Deferred();
                var wstypes = options.context.getModel(WorkspaceTypesFactory),
                filterWsTypes = function (wstypes) {
                      var selectEnum = [];
                      wstypes.forEach(function (wst) {
                        selectEnum.push({
                          "value": wst.get('id'),
                          "displayName": wst.get('wksp_type_name'),
                          "selected": false
                        });
                      });
                      return selectEnum;
                    }

                if (!wstypes.fetched) {
                  wstypes.fetch().done(function (wstypes) {
                    deferred.resolve(filterWsTypes(wstypes));
                  });
                } else {
                  deferred.resolve(filterWsTypes(wstypes));
                }
                return deferred.promise();
              }
            }
        }
      }
    }
 ```
