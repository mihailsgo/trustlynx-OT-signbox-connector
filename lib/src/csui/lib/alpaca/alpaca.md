# Alpaca Library updates

With the latest release Alpaca library has been split into alpaca.lite.js(Alpaca Lite) and alpaca.js(Alpaca Rest) to imrprove the performance.

## Alpaca Lite - alpaca.lite.js
- alpaca.lite.js is the ligter version of original alpaca.js, it consists of most used components only. 
- it is also optimised version of code by replacing expensive jquery DOM operations with vanilla javascript functions whereever it is feasible.
- It is part of csui-forms.js bundle.

## Alpaca Rest - alpaca.js
- alpaca.js consists of the rest of components (removed from alpaca.lite.js) by extending alpaca.lite.js
- It is part of the csui-alpaca-legacy.js bundle.

## Improvements
1. Parsing time of alpaca.js script
2. Rendering time of forms/fields
3. Overall loading time

## List of the components removed from Alpaca Lite

### Fields
- AddressField
- EditorField
- EmailField
- GridField
- IPv4Field
- PersonalNameField
- TinyMCEField
- ZipcodeField
- CKEditorField
- ColorField
- CountryField
- CurrencyField
- ImageField
- JSONField
- Wizard container (ObjectField)

### Methods
- CloudCmsConnector

## List of jquery methods replaced with vanilla javascript methods
- $.find()
- $.show()
- $.hide()
- $.addClass()
- $.removeClass()
