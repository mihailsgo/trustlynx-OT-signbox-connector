# Add Business Workspace from Side Panel Command

**Module: conws/utils/commands**

Will launch a side bar widget showing a list of workspace templates with names and icons. Support to only show workspace templates that can be used to create workspaces without passing target location (manual creation enabled + fixed creation location set). Creation dialog is opened after selecting/clicking on a workspace template thumbnail.

## Example

```javascript
    {
      signature: 'AddBWSFromSidePanel',
      name: "Create Business Workspace",
      data: {title:"customized header title",
             subtitle:"customized header sub title/description",
             groupName:"customized group name",
             size: "small, medium, large", //ignored if resize = true
             resize: false
            }
    }
```
The "data" option is optional to customize:
  title:      set value or default is "Create business Workspace" - title of the side panel header on the select template slide
  subtitle:   set value or default is empty  - description in side panel header on the select template slide
  groupName:  set value or default is "Available Business Workspace Templates"
  resize:     *Boolean* Applies resize capabilities to side panel, by default it is false, i.e., no resize.
  size:       small, medium and large are possible, default is set from side panel to small
              - this property will be ignored if resize = true
              - more informations: https://uxd.opentext.net/guidelines/modal_panels_visdspec_21_web.htm, 
                and //products/main/pkg/CS_CORE_UI/src/controls/side.panel/doc/side.panel.view.md
