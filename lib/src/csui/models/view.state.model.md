# View State Model 

## Introduction
The two major functionalities the view state model (VSM) provides are
1) Saving and restoring the UI state of widgets using the url parameters and the browser session storage.
2) Saving and restoring the navigation history from the browser session storage. 

Currently there is only one single instance of the VSM in a csui web application. This single instance works with the help of the context,
context plugins, the perspective routing singleton, routers, backbone history singleton and the widgets to achieve the two mentioned 
functionalities.   

The VSM supports the Perspective context from all the type of context that can be created in the csui application. The csui developer can access 
the single VSM instance from the context instance. If multiple perspective contexts get created in the csui application, all these instances will 
be pointing to the  same VSM instance and therefore all context instances will share the same history. The perspective contexts share the same  
single instance of the PerspectiveRouting single instance and the single instance of the Backbone history.

When a perspective context gets created all context plugins, the perspective routing singleton, routers, and the VSM gets wired to listen to 
the different events associated with that context instance and the factories of that context. Therefore the context instance and the 
different navigation modules are tightly coupled.

The csui application the navigation subsystem consists of instances of VSM, routers, routers context plugins, the perspective context, the 
perspective routing and the Backbone history. All these instances work very closely together to manage the perspectives loading and restoration. 

#Different conditions when restoring the UI
There are different conditions happens during the url restoration and the VSM accounts for
1) The user might have a url and wants to navigate directly to that url. In this case the VSM has nothing saved in the the browser session storage 
and this will be the first navigation.
2) The user might be navigating by clicking on different UI controls in the csui application. This is the normal navigation behaviour.
3) The user might have pressed the browser refresh button. No new history entry gets added to the navigation history.

#Navigation Subsystem consists of
1) Perspective Context: The perspective context loads the perspective, it initializes the widgets and fetches all the factories if needed. (Note: 
there are different type of contexts like the PageContext, PortalContext, BrowsingContext. But the VSM does not get used with these contexts)

2) Context plugins: (Example of the many context plugins in a csui applications are NodePerspectiveContextPlugin, MetadataPerspectiveContextPlugin, 
SearchPerspectiveContextPlugin). These plugins listen to the different factories created in the context and the application scope to decide when to 
call the context to apply a certain perspective.

3) PerspectiveRouting: Singleton class that initialize all the routers and the backbone history.

4) Routers: (Example of the many routers in a csui applications are NodePerspectiveRouter, MetadataPerspectiveRouter, SearchPerspectiveRouter). 
Routers define the different url patterns that a router can handle, and its main purpose is to call the navigate method on the base class. 

5) VSM (see introduction)

6) Widgets

#Navigation subsystem Startup
1) During the csui application StartPageView creation, a perspective context instance gets created from the StatePageView and then a singleton 
of the PerspectiveRouting gets created by passing the perspective context to it. At that time the PerspectiveRouting gets initialized and it all 
routers that gets created will use that particular context instance to initialize.
2) The perspective context plugins gets created after the context creation and all the context plugins will listen to the context and its 
factories for the different messages they fire. Those context plugins play a major role on deciding what type of perspective the context should load.
3) During the context creation, the VSM module gets loaded and the VSM singleton gets created. The VSM single csui application gets wired to listen
 to the context fetching of new perspectives and the routers navigation messages to updates the navigation history.
4) The perspective widgets gets loaded and inform the VSM at what url parameters they support by calling 'addUrlParameters' public function on the 
VSM.
5) Widgets start listening to the state member of the VSM and update those based on the UI state of the widget. The state variables holds the url 
parameters. The default_state member also holds the url parameters that should not be included in the url initially.

#VSM Members
##state
Holds the url parameters included in the url and their values.
##default_state
Exclude the url parameters that should not be part of the url. 
##session_state
General storage used to store variables needed for the widgets
##allowWidgetUrlParams
Some perspectives liked the tabbed perspective to stop the VSM to support any widget url parameters.
##back_to_title:
Used by the back to button to display where the back button will navigate to.
##currentRouter
Name of the current router.
##currentRouterFragment
The current url without url parameters
##currentRouterScopeId
The application scope id
##lastRouter
The previous router name
##navigationHistoryArray
Array of the navigation history
##urlParams
Current supported widget url parameters
##CONSTANTS
Constants that can be used to access the different VSM members

##VSM public methods

##setViewState: function (key, value, options) 
Change to the state member
##getViewState: function (key, decode) 
Get to the state member
##setDefaultViewState: function(key, value, options) 
Change to the default state member
##getDefaultViewState: function(key, decode) 
Get to the default state member
##setSessionViewState: function (key, value, options) 
Change to the session state member
##getSessionViewState: function (key) 
Get to the session state member
##onNavigationStarted: function(newRouterInfo) 
Called by the router base call to inform the VSM a navigation attempt started
##onContextFetch: function() 
Called by the context that the last navigation attempt finished
##saveHistory: function() 
Save all the history so it can be restored later on.
##clearHistory: function()
After saving the history the caller can clear the history and restore it as needed.
##restoreHistory: 
Used to restore the saved history.
##hasRouted: 
Check if this is the first navigation or not.
##isSameRoutingInfo: 
Checking if multiple calls are being made to the navigation functions.
##clean: 
Clear all the storage entries associated with the VSM
##getBackToTitle: function () 
Get the back to title
##clearCurrentHistoryEntry: function ()
Ignore the last navigation attempt 
##getLastRouterIndex: function () 
Search the history and return the last entry that was made by the router
##getLastHistoryEntry: function () 
Get the last history entry.
##restoreLastRouter: function () 
Restore last history entry that was made by previous router
##restoreLastFragment: function () 
Restore last history entry regardless of the router name.
##addUrlParameters: function (urlParameters, context, replace, force) 
Add the widget or the perspective support url parameters.
##getPotentialHistoryEntry: function ()
Returns a temporary history entry that will be pushed to the permanent history if the context succeeds in switching the perspective.
## getHistory: function ()
Returns an array of history entries.
## restoreHistoryEntryByIndex: function(index)
Restores the UI based on the history entry specified by the index 
