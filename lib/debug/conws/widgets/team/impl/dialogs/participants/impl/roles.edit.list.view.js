csui.define([
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/lib/marionette',
  'csui/lib/handlebars',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'conws/widgets/team/impl/behaviors/list.keyboard.behavior',
  'i18n!conws/widgets/team/impl/nls/team.lang',
  'hbs!conws/widgets/team/impl/dialogs/participants/impl/roles.edit.list'
], function (_, $, Marionette, Handlebars, TabableRegionBehavior, ListKeyboardBehavior,
    lang, template) {

  var RolesEditList = Marionette.LayoutView.extend({

    // CSS class names
    className: 'conws-roles-edit-list',

    template: template,

    // filter model
    filterModel: {},

    // constructor for the Roles list
    constructor: function RolesEditList(options) {
      options || (options = {});

      // the model has to be a RolesCollection with the filterList method
      this.model = options.model;
      // filterModel is the FilterModel with the filter criteria
      this.filterModel = options.filterModel;
      //used for accessibility
      this.selectedIndex = 0;
      // apply properties to parent
      Marionette.LayoutView.prototype.constructor.apply(this, arguments);
    },

    ui: {
      select: 'a.conws-roles-edit-itemaction-select'
    },

    events: {
      'click @ui.select': 'itemSelect',
      'click li': 'itemSelect',
      'dragstart @ui.select': 'itemDrag',
      'keydown': 'onKeyDownExt'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      },
      ListKeyboard: {
        behaviorClass: ListKeyboardBehavior
      }
    },

    // support up/down navigation
    onKeyDownExt: function (e) {
      var $preElem = this.currentlyFocusedElement();

      switch (e.keyCode) {
      case 38: // up
        this.calculateSelectedIndex();
        this._moveTo(e, this._selectPrevious(), $preElem);
        break;
      case 40: // down
        this.calculateSelectedIndex();
        this._moveTo(e, this._selectNext(), $preElem);
        break;
      case 13:
      case 32:
        this.currentlyFocusedElement().trigger('click', e);
        break;
      }
    },

    initialize: function () {
      // listen on the change of the filter
      this.listenTo(this.filterModel, 'change', this.render);
      this.listenTo(this.filterModel, 'change:filter', function () {
        // when search filter changes, reset the focus element to the first item
        this.selectedIndex = 0;
      });
      // listen on the model changes
      this.listenTo(this.model, 'add change reset remove', this.render);
      this.listenTo(this, 'updateFocus', this.updateFocus);
    },

    // template helper to prepare the model for the view
    templateHelpers: function () {
      return {
        allRoles: this.model.filterList(this.filterModel.get('filter')).toJSON()
      }
    },

    calculateSelectedIndex: function () {
      var keywords = this.filterModel.get('filter');
      if (keywords.length) {
        this.totalCount = this.model.filterList(keywords).models.length;
        if (this.selectedIndex !== 0 && this.selectedIndex === this.totalCount - 1) {
          this.selectedIndex = this.selectedIndex - 1;
        }
      } else {
        this.totalCount = this.model.length;
      }
    },

    updateFocus:function(){
      this.trigger('changed:focus', this);
      this.currentlyFocusedElement().trigger('focus');
    },

    // Click on an item in the available list
    // mark the item as selected and add it to the selected items list
    itemSelect: function (event) {
      var target = $(event.currentTarget);
      var id = target.data("id");

      // if the remove action is called from keyboard the current element is <div> and not <a>
      if( _.isUndefined(id) && target.find(this.ui.select).length > 0){
        id = $(event.currentTarget).find(this.ui.select).data('id')
      }

      //calculate new selected index
      this.calculateSelectedIndex();
      //remove model
      this.model.remove(id);

      // don't propagate click event into name cell, because it would cause selecting the row
      event.preventDefault();
      event.stopPropagation();

    },

    // Prevent the drag function for the link element
    itemDrag: function (event) {
      return false;
    }
  });

  return RolesEditList;
});

