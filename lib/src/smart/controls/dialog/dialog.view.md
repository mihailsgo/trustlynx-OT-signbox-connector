# Dialog Control

**Module: smart/controls/dialog/dialog.view**

The dialog.view.js implements a marionette.LayoutView that renders a view in a modal dialog and waits for the user to close it.

The attributes used to display the views in body, header, footer:

- 'view'
- 'headerView'
- 'footerView'

## DialogView()

Creates a new instance.

#### Example

```js
....
....
csui.require(
  ["nuc/lib/marionette", 'smart/controls/dialog/dialog.view'],
  ({ Region }, DialogView) => {
    //Example with body messgae and buttons
    var dialogViewRegion = new Region({ el: this.ui.dialogViewRegion });
    var dialogView = new DialogView({
              title: this.dialogTitle, // title of model dialog that is to be displayed on header
              largeSize: true, // size of modal dialog
              bodyMessage: this.bodyMessage, // message to be displayed on body
              attributes: {
                'aria-label': dialogTitle // title of modal dialog
              },
              buttons = [{ // array of button options to be shown on footer of dialog
                    id: 'cancel1',
                    label: primaryButton ? primaryButton : "Primary",
                    'default': true,
                    close: true
                 },
                 {
                    id: 'cancel',
                    label: secondaryButton ? secondaryButton : "Cancel",
                    close: true
                  }]
         });

    dialogViewRegion.show(dialogView);
    // `this.ui.dialogViewRegion` : dialogview region defined in the specific view where dialog view needs to be rendered

    //Example with header, footer and body view
    var dialogViewRegion2 = new Region({ el: this.ui.dialogViewRegion2 });
    var dialogView2 = new DialogView({
              title: this.dialogTitle, // title of model dialog that is to be displayed on header
              largeSize: true, // size of modal dialog
              attributes: {
                'aria-label': dialogTitle // title of modal dialog
              },
              view: this.bodyView, // body view to be displayed
              headerView:  this.headerView, // header view to be displayed
              footerView: this.footerView // footer view to be displayed

         });

    dialogViewRegion2.show(dialogView2);
    // `this.ui.dialogViewRegion2` : dialogview region defined in the specific view where dialog view needs to be rendered
  }
);
....
....
```

#### Options
<ul>
 <li><p><b>title - `required` (String)</b> title attribute set on the HTML markup of the control. Default is ''.</p></li>
  <li><b>fullSize -`optional` (Boolean)</b> if true, adds the class 'binf-modal-full' to 'binf-modal-dialog' that displays the dialog in full page.</li>
  <li><p><b>largeSize - `optional` (Boolean)</b> if true, adds the class 'binf-modal-lg' to 'binf-modal-dialog' that displays the dialog with maximum width.</p></li>
  <li><b>midSize -`optional` (Boolean)</b> if true, adds the class 'binf-modal-md' to 'binf-modal-dialog' that displays the dialog with medium width.</li>
  <li><p><b>smallSize - `optional` (Boolean)</b> if true, adds the class 'binf-modal-sm' to 'binf-modal-dialog' that displays the dialog with minimum width.</p></li>
  <li><b>bodyMessage -`optional` (String)</b> string or a message that displays in the body of the dialog. Default is ''.</li>
  <li><p><b>buttons - `optional` (Array)</b>button options to show buttons in the footer if no footerview is provided.</p></li>
  <li><b>view -`optional` (Marionette view)</b> view that renders in the body of the dialog. Default is ''.</li>
  <li><p><b>headerView - `optional` (Marionette view)</b> view that renders in the header of the dialog. Default is ''.</p></li>
  <li><b>footerView -`optional` (Marionette view)</b>view that renders in the footer of the dialog. Cancel button that destroys the modal dialog must be provided in this view. Default is ''.</li>
</ul>

## Public Methods

<ul>
  <li><b>setCurrentTabFocus() :</b> Set focus on the current tab positioned element.</li>
  <li><b>kill() :</b> destroys the current view.</li>
  <li><b>destroy():</b> hides then destroys the dialog.</li>
  <li><b>updateButton() :</b> updates the button in the footerview if available.</li>
  <li><b>onClickClose() :</b> closes the dialog and destroys.</li>
  <li><b>onClickActionIcon() :</b> originating view listens this event and then executes their call back function.</li>
</ul>

## Events

<ul>
  <li><b>hide.binf.modal :</b> Triggers when the dialog hides.</li>
  <li><b>shown.binf.modal :</b> Triggers when the dialog is shown.</li>
</ul>