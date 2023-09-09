# Parameter Prompt Control
========

Shows a prompt form enabling a user to edit any parameters supplied to a WebReport. The form view is supplied via RunWRController.getFormView(options) using the WebReport Pre Controller 'webreports/controls/run.webreport.pre/run.webreport.pre.controller'.


### Licensing

Although it is installed as part of core Content Server, WebReports is licensed separately. This component will only be available on an instance if you apply a valid WebReports license or if you install a licensed Content Server Application.

### Example

```javascript

      require(['csui/lib/underscore', 'csui/lib/jquery','csui/lib/marionette','csui/utils/contexts/page/page.context', 'csui/models/node/node.model', 'webreports/controls/run.webreport.pre/run.webreport.pre.controller',
                  '../parameter.prompt.view', './parameter.prompt.mock'
              ], function (_, $, Marionette, PageContext, NodeModel, RunWebReportPreController, ParameterPromptView, Mock) {
      
                  var RunWRController = new RunWebReportPreController(),
                      promptView,
                      promptRegion,
                      context = new PageContext(),
                      node = new NodeModel({
                          id: 22550,
                          type: 30303
                      }),
                      options = {
                          context: context,
                          node: node,
                          suppressPromptView: true, // default behavior of the checkForPromptParameters control is to invoke a complete prompt view. We want to create our own view
                          showCancelButton: true
                      };
      
                  Mock.enable();
      
                  // before invoking a prompt form, check for prompt params
                  var promptParameters = RunWRController.checkForPromptParameters(options);
      
                  $.when(promptParameters).then(function(promptRoute) {
      
                      if (promptRoute === 'showSmartPrompts') {
                          options.promptRoute = promptRoute;
                          options.model = RunWRController.runWRPreModel;
      
                          promptView = new ParameterPromptView(options);
                          promptRegion = new Marionette.Region({
                              el: "#promptView"
                          });
      
                          promptRegion.show(promptView);
      
                          context.fetch();
                      }
      
      
                  });


```

### Options

`model` (Backbone model)
: **Required.** A model representing the prompt form. This can be obtained by requiring in the control: *RunWebReportPreController* 'webreports/controls/run.webreport.pre/run.webreport.pre.controller'

`title` (string)
: **Optional.** The title shown on a parameter prompt tile. If none is specified, a default XLATE string will be used

`suppressPromptView` (boolean)
: **Optional.** The WebReport PreController control has a method checkForPromptParameters() which will automatically render a prompt view. This flag bypasses the rendering of a view.
  
`showCancelButton` (boolean)
: **Optional.** Optionally choose to show a cancel button that may be used to dismiss the parameter prompt view


