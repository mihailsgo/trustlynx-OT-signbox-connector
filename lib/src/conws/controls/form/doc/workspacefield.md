# WorkspaceFieldView (conws/controls/form/fields/workspacefield.view)

  Shows a `WorkspaceFieldView`. The view shows a standalone typeahead control.
  The mandatory model behind expects a options object holding the node id of the initially
  selected workspace and other data, for example a mandatory context through which the
  selected workspace can be fetched (via the context's connector), both initially and after editing.

  The control shows an input field, typing in that opens a dropdown showing all matching workspaces.
  After selection, the name is displayed in the field.
  If the selection is taken over, the field raises the `field:changed` event.

### References

See the workspace alpaca control in [WorkspaceFieldView](alpaca/alpworkspacefield.md).

See a server testing test page in [murdoch_workspacefield_view.html](../../../../test/pages/murdoch_workspacefield_view.html).

See a local source debug test page in [murdoch_workspacefield_view_debug.html](../fields/alpaca/test/alpworkspacefield/murdoch_workspacefield_view_debug.html).
