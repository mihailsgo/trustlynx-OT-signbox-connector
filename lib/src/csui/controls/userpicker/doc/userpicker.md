# User picker for adding roles extension

User picker drop-down (using type-ahead) with different options, renders based on the current type, for example (0: user view, 1: group view).

If any module want to render new custom type, then they have to register their views against the
custom type through the extension provided.



### How to register new custom role type view through extension

Custom user role views has to be registered as shown below from other modules.

```json
  "csui/controls/userpicker/userpicker.view": {
    "extensions": {
      "conws": [
        "conws/controls/userpicker/conws.roles"
      ]
    }
  }
```



### What should these custom view classes consists of?

These extension point from other modules should provide array of object, consists of respective
type and views as shown below.

```js
define([
  'conws/controls/userpicker/role.view'
], function (RoleView) {
  'use strict';

  return [{
    type: 848,
    viewClass: RoleView
  }];
});
```