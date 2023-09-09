# Configuration

## Side Panel Smart Control​

<p>Marionette view that provides a modal panel that slides in from the side of the screen with configuration to display single or multiple views.​</p>

**Module:smart/controls/side.panel/side.panel.view**

### Example for using SmartControls Side panel view

```js


define(['smart/controls/side.panel/side.panel.view'], function (SmartSidePanelView) {
      var SidePanelView = SmartSidePanelView.extend({
        constructor: function SidePanelView(options) {
          SmartSidePanelView.prototype.constructor.call(this, options);
        },

        // listening events provided by SmartControls for customized logic
      this.listenTo(this, 'event:name', this._mycallback));
    },

    _mycallback:  function(){
      ...
      ...
      ...
      });

      return SidePanelView;
    });

```

### Custom width for  SmartControls Side panel view
Users need to pass layout.size as "custom" and add the following styling to obtain custom width for their side panel.

```css

.binf-widgets .csui-sidepanel.csui-sidepanel-custom .csui-sidepanel-container {
  width: <<custom-width>>;
  max-width: <<custom-max-width>>;
  min-width: <<custom-min-width>>;
}

```
For more specificity, users can append classname that was provided using option sidePanelClassName instead to take higher precedence.

```css

.binf-widgets <<sidePanelClassName>>.csui-sidepanel-custom .csui-sidepanel-container {
  width: <<custom-width>>;
  max-width: <<custom-max-width>>;
  min-width: <<custom-min-width>>;
}

```

## Parameters

<ul>
  <li><b>title - `required`</b>*String* Title to be used for header. Considered only when `slides` are empty.</li>
  <li><b>backdrop - `optional`</b>*Boolean|String* Default `static`. Includes a `sidepanel-backdrop` element. Alternatively, specify `static` for a backdrop which doesn't close the modal on click.</li>

  <li><b>keyboard - `optional`</b>*Boolean* Default `true`. Closes the modal when escape key is pressed.</li>

  <li><b>focus - `optional`</b>*Boolean* Default `true`. Puts the focus on the modal when initialized.</li>

  <li><b>sidePanelClassName - `optional`</b>*String*. Class names (with blank-space as separator) to be added to the top parent of the side panel's dom element. It allows others to override stylings by using these class names as name-specificity to take higher precedence.</li>

  <li><b>openFrom - `optional`</b>*String* to open panel from `left` or `right`. Default value is `right`.</li>

  <li><b>slides - `optional`</b>*Array* of slides to display, navigates using back, next buttons at footer.</li>

  <li><b>content - `optional`</b>*View*|View to be displayed as content. Considered only when `slides` are empty. </li>

  <li><b>buttons - `optional`</b>*Array* of buttons to be displayed at footer. Considered only when `slides` are empty. </li>

  <li><b>footer - `optional`</b> *Boolean* If footer should be hidden for current slide, not for the whole side panel.</li>

  <li><b>footer.hide - `optional`</b>*Boolean* If footer should be hidden for current slide, not for the whole side panel.</li>

  <li><b>leftButtons - `optional`</b>*Array* of buttons to be displayed at footer (left side).</li>

  <li><b>rightButtons - `optional`</b>*Array* of buttons to be displayed at footer (right side).</li>

   <li><b>layout.header - `optional`</b>*Boolean* Show/hide header, by default it is true.</li>

  <li><b>layout.footer - `optional`</b>*Boolean* Show/hide footer, by default it is true.</li>

  <li><b>layout.mask - `optional`</b>*Boolean* Show/hide mask overlay behind side panel, by default it is true.</li>

  <li><b>layout.resize - `optional`</b>*Boolean* Applies resize capabilities to side panel, by default it is false, i.e., no resize.</li>

  <li><b>layout.size - `optional`</b>*Boolean* Applies width for side panel based on "small", "medium", "large" and "custom". Default is "small". NOTE: In ipad max-width is 100% for large size</li>
</ul>

## Public Methods

<ul>
  <li><b>extractSlides():</b> Returns slide info using options</li>
  <li><b>onBackdropClick():</b> Decides to destroy side panel when clicked on backdrop depending on the "backdrop" flag passed.</li>
  <li><b>updateButton():</b> To updat fooer view button</li>
  <li><b>show():</b> Called when side panel needs to be shown.</li>
  <li><b>_doShow():</b> Opens side panel.</li>
  <li><b>onDomRefresh():</b> Account for Window resizing effecting the appearance of the pagination bar.</li>
  <li><b>hide():</b>  Hides side panel.</li>
  <li><b>handleKeyDown():</b> Event handler, called when user does keyboard navigation.</li>
  <li><b>onKeyInView():</b> Event handler, called when user does keyboard navigation.</li>
  <li><b>_onBackClick():</b> Shows slides when clicked on back button.</li>
   <li><b>_onNextClick():</b> Shows slides when clicked on next button.</li>
  <li><b>_onCancelClick():</b> Closes side panel when clicked on cancel icon.</li>
  <li><b>_showSlide():</b> Shows specific slide on side panel.</li>
   <li><b>_updateHeader():</b> Updates header view</li>
     <li><b>_updateBody():</b> Updates body view</li>
  <li><b>_showSlide():</b> Shows specific slide on side panel.</li>
 
 
</ul>

## Events

<ul>
<li><b>after:show</b> An event is triggered when page is shown</li>
<li><b>before:hide</b> An event is triggered before side panel is hidden</li>
<li><b>after:hide</b> An event is triggered after before side panel is hidden</li>
<li><b>show:slide</b> An event is triggered to show slide</li>
<li><b>shown:slide</b> An event is triggered when slide is shown</li>
<li><b>update:header</b> An event is triggered header needs to be updated</li>
<li><b>set:focus</b> An event is triggered focus needs to be set on body</li>
<li><b>close:button:clicked</b> An event is triggered when sidepanel default header close button is clicked</li>
<li><b>update:footerview</b> An event is triggered and to be triggered to update the footerview in case of any modifications.</li>

</ul>
