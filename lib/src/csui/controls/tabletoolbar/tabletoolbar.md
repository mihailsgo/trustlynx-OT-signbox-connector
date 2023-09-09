Add item toolbar
================

Default toolbar items are added into the add item toolbar dropdown, on 
rendering the page, from addable item's information
(either from v2/app/container call or direct addablenodetypes call). 
The items having inline forms, should send command info,
with signature and group along with inlineforms.

Other module addable types can be added to the dropdown by triggering an event
from tabletoolbar.view

Examples
--------

    // Addable item with command info
    getAddableCommandInfo() {
     return {
      signature: 'AddCONWSTemplate',
      group: 'conws'
    },
   

Attributes
----------

* getAddableCommandInfo: indicates the name of the method to be defined in inline forms.
* signature (string): indicates the signature of the menu item to be added.
* group (strung): indicates the group of the module to which the addable item belongs to.
