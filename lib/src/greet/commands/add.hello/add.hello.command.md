# AddHelloCommand

A command, which adds a new object and provides a custom item in the "+" menu
for that.

Items in the "+" menu can be based on any command, or on the response of
the `GET .../api/v1/nodes/{id}/addablenodetypes` request, which is always
available for a container, or on a custom asynchronous code.

## Shows how to

* Create a command applicable to a container
* Register the command in the CS UI framework
* Place an item to the menu of the "+" button
* Let a new object be created by the generic inline form
* Provide a custom inline form
* Localize user interface
* Develop the command using a mocked debugging page
* Test the command by a mocked spec

## Pages in test/

* index.html
  : Helps developing the command using the nodes table

# AddHelloTemplateCommand

An alternative command, which shows how to create different objects using
multiple buttons, but a single command with parameters.

## Shows how to

* Pass custom data from a particular menu item to the command execution
* Let a new object be created by the forced generic dialog
