# SidePanelView

Shows a panel sliding from left/right based on configuration provided. This view can be used to
show a single view or multiple views (as slides) as per configuration provided to it.

If `slides` provided to the panel, panel's footer include navigation buttons along with the
button provided to the respective slide as part of configuration.

`side.panel` has modal (dialog) behaviour by default which optionally can pass using constructor
param as well (`options.modal`).

## Constructor Summary

### constructor(options)

  Creates a new SidePanelView.

#### Parameters
* `options` - *Object* | object literal with initial settings.
* `options.backdrop` - *Boolean|String* Default `static`. Includes a `sidepanel-backdrop` element. Alternatively, specify `static` for a backdrop which doesn't close the modal on click.
 url to authenticate against.
* `options.keyboard` - *Boolean* Default `true`. Closes the modal when escape key is pressed.
* `options.focus` - *Boolean* Default `true`. Puts the focus on the modal when initialized.
* `options.sidePanelClassName` - *String*. Class names (with blank-space as separator) to be added to the top parent of the side panel's dom element. It allows others to override stylings by using these class names as name-specificity to take higher precedence.
* `options.openFrom` - *String* to open panel from `left` or `right`. Default value is `right`.
* `options.slides` - *Array* of slides to display, navigates using back, next buttons at footer. Also see [Slide Configuration](#slide-configuration)
* `options.title` - *String* Title to be used for header. Considered only when `slides` are empty.
* `options.content` - *View* View to be displayed as content. Considered only when `slides` are empty. 
* `options.buttons` - *Array* of buttons to be displayed at footer. Considered only when `slides` are empty. 
* `options.footer` - *Object* of Footer configuration as follows. Considered only when `slides` are empty. 
* `options.footer.hide` - *Boolean* If footer should be hidden for current slide, not for the whole side panel.
* `options.leftButtons` -  *Array* of buttons to be displayed at footer (left side).
  * `leftButtons.v2Icon` - *Object* of button's properties containing iconName(string) and states
  (boolean).
   * `leftButtons.attributes` - *Object* of button's atrributes containing title(string) and aria-label
  (string).
* `options.rightButtons` -  *Array* of buttons to be displayed at footer (right side).
* `options.layout.header` -  *Boolean* Show/hide header, by default it is true.
* `options.layout.footer` -  *Boolean* Show/hide footer, by default it is true.
* `options.layout.mask` -  *Boolean* Show/hide mask overlay behind side panel, by default it is true.
* `options.layout.resize` -  *Boolean* Applies resize capabilities to side panel, by default it is false, i.e., no resize.


#### Slide configuration
* `title` - *String* Considered when `slides` are empty. Title to be userd for header.
* `headerView` -  *View* to be used to display at header area. Overrides `title` option.
* `options.content` - *View* Content to be displayed.
* `containerClass` - *String* Class to be added to sidepanel when this slide is being displayed.
* `buttons` - *Array* of buttons to be displayed at footer.
* `footer` - *Object* of Footer configuration as follows.
* `footer.hide` - *Boolean* If footer should be hidden for the content currently displayed.
* `leftButtons` -  *Array* of buttons to be displayed at footer (left side).
  * `leftButtons.btnType` - *String* to hold behaviour of the button, at present we are supporting
  only back and search types.
  * `leftButtons.className` - *String* to store the class of the button, 'csui-has-v2icon' class
      need to be added for only V2 icons.
* `rightButtons` -  *Array* of buttons to be displayed at footer (right side).
  * `rightButtons.btnType` - *String* to hold behaviour of the button, at present we are supporting
       only back and search types.

#### Returns

  The newly created object instance.

## Events
Following are the events triggered by side panel
### before:show

### after:show

### before:hide

### after:hide

### show:slide
This event will be fired before showing a slide
#### Parameters
* `slide` - 
* `slideIndex` - 

### shown:slide
 This event will be fired after showing a slide
#### Parameters:
* `slide` - complete information about current slide, like title, sub-title, content view, etc.,
* `slideIndex` - Order of the current slide to be appear.

### update:header
This event will update content in header.This is listening on sidepanel body and footer.
#### Parameters
*`headerModel`- type {Object} it will hold informatin of title, sub-title for headerview to update.


## API

### show

### hide

### destroy

### updateButton


## Examples

### Simple Usage
      var sidePanel = new SidePanelView({
          title: 'Simple Usage Title',
          content: new Backbone.View(),
          buttons: [{
            label: 'Button1'
          }]
      });
      sidePanel.show();
### Customize Footer
    var sidePanel = new SidePanelView({
        headerView: new Backbone.View(),
        content: new Backbone.View(),
        footer: {
          leftButtons: [{
            label: 'Button1',
            attributes: {
                'title': 'button1',
                'aria-label': 'button1',
            },
          }],
          rightButtons: [{
            label: 'Button2',
            attributes: {
                'title': 'Button2',
                'aria-label': 'Button2',
            },
            id: 'btn2'
          }]
        }
    });
    sidePanel.show();
### Customize Footer, Left/Right buttons with V2 icons.
    var sidePanel = new SidePanelView({
        headerView: new Backbone.View(),
        content: new Backbone.View(),
        footer: {
          leftButtons: [{
              type: 'action',
              v2Icon: {
                  iconName: 'csui_action_***',
                  states: true
              },
               attributes: {
                  'title': 'button1',
                  'aria-label': 'button1',
              },
              btnType: 'back',
              className: 'class-button-1 csui-has-v2icon', //this class "csui-has-v2icon" needed Only for V2 icons
              }],
          rightButtons: [{
              label: 'button2',
              type: 'action',
              id: 'btn-id-1',
              btnType: 'search',
              className: 'class-button-2'
            }]
        }
    });
### Wizard Style
      var sidePanel = new SidePanelView({
        slides: [{
            title: 'Step1',
            content: new Backbone.View(),
            buttons: [{
              label: 'Reset Form',
              className: 'binf-btn binf-btn-default'
            },
            {
              label: 'Search',
              disabled: true
            }]
          },
          {
            title: 'Step2',
            content: new Backbone.View(),
            buttons: [{
              label: 'Finish',
              close: true,
              className: 'binf-btn binf-btn-primary'
            }]
          }]
      });
      sidePanel.show();

### Overriding default side panel's styling (in this example, overriding width-related styling)
      var sidePanel = new SidePanelView({
          title: 'Simple Usage Title',
          content: new Backbone.View(),
          sidePanelClassName: 'intflng-in-sidepanel',
          buttons: [{
            label: 'Button1'
          }]
      });
      sidePanel.show();

      /* By default, .csui-sidepanel-container has the below stylings... */
      .binf-widgets .csui-sidepanel.csui-sidepanel-visible .csui-sidepanel-container {
        max-width: 400px;
        min-width: 278px;
        width: 50vw;
      }

      /* Overriding with the given sidepanelClassName... */
      .binf-widgets .csui-sidepanel.csui-sidepanel-visible.intflng-in-sidepanel .csui-sidepanel-container {
        max-width: 750px;
        min-width: 100px;
        width: 75vw;
      }
### Dynamic update header from Sidepanel body

 var contentView = Marionette.ItemView.extend({
   .....
            template: function(){
              return '<button class="binf-btn binf-btn-default" id="updateHeader">update Header</button>'
            },
            events: {
              // clicking on button update heading
              'click #updateHeader' : function(){
                this.trigger('update:header',{
                  title:'new heading',
                  subTitle: 'new sub heading'
                });
              }
            },
    ........
  });

    var sidePanel = new SidePanelView({
        headerView: new Backbone.View(),
        content: new contentView(),
         buttons: [{
            label: 'Button1'
          }]
});

### Dynamic update header from Sidepanel footer

 var contentView = Marionette.ItemView.extend({
   ..... 
          onRender: function () {
            // update header from footer
            this.listenTo(this, "button:click", function (actionButton) {
              if(!!actionButton.updateHeader){
                this.trigger('update:header',{
                    title:'new heading from footer',
                    subTitle: 'new sub heading from footer'
                  });
              }
            });

          }
    ........
  });

var sidePanel = new SidePanelView({
        headerView: new Backbone.View(),
        content: new contentView(),
        footer: {
        buttons: [{
            label: 'Button1'
          },
          {
            label: 'update header',
            type: 'action',
            updateHeader:true
          }
          ]
        }
    });