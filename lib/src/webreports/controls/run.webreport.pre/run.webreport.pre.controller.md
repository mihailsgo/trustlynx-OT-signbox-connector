# RunWebReportPre Controller

**Module: webreports/controls/run.webreport.pre/run.webreport.pre.controller**

An object of util functions used for retrieving and processing 'run' related information for a WebReport, including Destination and Parameter Prompt models.

### Licensing

Although it is installed as part of core Content Server, WebReports is licensed separately. This component will only be available on an instance if you apply a valid WebReports license or if you install a licensed Content Server Application.

### Public Methods

####`checkForPromptParameters(options)`
Takes an object argument and returns a promise that resolves to a string value when an async request to obtain the model has completed.

Possible returned string values are:

`noPrompts`: There are no prompt parameters for the WebReport node

`showSmartPrompts`: The WebReport node has prompt parameters that are supported in the Smart UI

`showClassicPrompts`: The WebReport node has prompt parameters that are NOT supported in the Smart UI. (e.g. custom input fields)  
  
 The 'options' argument should be an object with the following properties:  
 
 `context`: the page context  
 `node`: the node ID of the WebReport  
 `suppressPromptView`: boolean flag. By default, the method causes a prompt view to be invoked. Set this true if you want the model but not the view. 
    
 ---
 ####`getRunWRPreModel(options)`
 Takes an object argument and returns a promise (with no resolved payload). Assuming a successful async request to retrieve the models, it sets the following properties on the RunWebReportPreController control instance:  
 `destinationModel`: The model for the WebReport destination  
 `parametersModel`: The model for the WebReport parameters
 
 ---
  

### Example

```javascript
var pageContext = new PageContext(),
    currentNode = pageContext.getModel(NodeModelFactory, {attributes: {id: 348547}}),
    runWRController = new RunWRController(); // create an instance of the RunWebReportPre controller

// call a function of the controller:
runWRController.getRunWRPreModel({
							node: currentNode,
							context: pageContext
						})
```
