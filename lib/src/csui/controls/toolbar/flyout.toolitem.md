# Flyout Tool Item

Flyout tool item is a button with multiple actions attached to it. It is
rendered as a toolbar button in action bar. This dropdown offers all
actions assigned to the flyout as clickable menu items unless action has submenu.
The main button carries a signature to be able to mask it off, but it does not trigger
the action event instead it toggles the respective menu.

The main action item wil be visible if at least one of the action under it, is enable, otherwise
main action item itself won't be appear in the action bar.

Flyout tool item(submenus) now support at all places like toolbarheader, inlineactionbar and menu dropdownheader.

Toolitems can be added to menu using tool item collection extensibility.
Sub-menu actions are recognized by matching both `flyout` and `subItemOf` flag.

### Examples

```javascript
    {
      signature: 'share', // Button signature to mask the whole flyout off
      name: 'Share',      // Fixed label for the main button
      flyout: 'share'     // Introduce flyout with this identifier
    },
    {
      signature: 'email',
      name: 'Email link',
      flyout: 'share'     // Add this ection to the flyout 'share'
    },
    {
      signature: 'share-via-core',
      name: 'Share via Core',
      flyout: 'share'     // Add this ection to the flyout 'share'
    },
    {
      signature:'Action', // duplicate flyout add under share flyout
      name:'Action',
      flyout:'share'
    },
    {
      signature: 'EmailAttachment',
      name: 'EmailAttachment',
      flyout: 'share',
      subItemOf: 'Action'  // here we are adding EmailAttachment as subItemof Action tool item.
    }

#### Attributes

* `flyout` - *String* Indicates which flyout this tool item belongs to.
* `subItemOf` - *String* Indicates that the tool item is subItemOf of `signature` mentioned.