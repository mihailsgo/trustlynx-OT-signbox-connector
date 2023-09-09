# Alpaca.Fields.ConwsWorkspaceField (conws/controls/form/fields/alpaca/alpworkspacefield)

  Shows a `Alpaca.Fields.ConwsWorkspaceField`. The view shows a
  typeahead field to select a workspace to be used within the Alpaca forms framework.
  The field is a alpaca-conform wrapper of the csui standalone conws form field, and as such
  allows for inplace editing.

  The field is validated by Alpaca means. I.e. if an required field is empty or if an invalid
  value is set (acc. to the field description in options and schema), an inline message is shown,
  which indicates the type of error.

### References

See the workspace field view in [WorkspaceFieldView](../workspacefield.md).

See a server testing test page in [murdoch_workspacefield_form.html](../../../../../test/pages/murdoch_workspacefield_form.html).

See a local source debug test page in [murdoch_workspacefield_form_debug.html](../../fields/alpaca/test/alpworkspacefield/murdoch_workspacefield_form_debug.html).


### Example

    var formDescr = {
          data: {
            workspaceIdA: 30388683
          },
          options: {
            fields: {
              workspaceIdA: {
                "type": "otconws_workspace_id",
                "type_control": {
                    "parameters": {
                        "page_size": 10, // default: 7
                        "search_type": "startsWith", //  default: "contains"
                        "workspace_types": [
                            26 // list of workspace type IDs
                        ] // if not given, search is done in all workspaces
                    }
                }
              }
            }
          },
          schema: {
            properties: {
              workspaceIdA: {
                description: "Workspace displayed in this widget",
                title: "Workspace A",
                type: "integer"
              }
            }
          }
        };

    var contentRegion = new Marionette.Region({el: '#content'}),
        formModel = new Backbone.Model(formDescr),
        formView = new FormView({model: formModel});

    contentRegion.show(formView);
