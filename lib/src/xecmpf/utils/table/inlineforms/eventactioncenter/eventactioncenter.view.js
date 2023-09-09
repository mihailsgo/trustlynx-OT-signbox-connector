/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  "csui/lib/marionette",
  'csui/controls/table/inlineforms/inlineform.registry',
  'csui/controls/table/inlineforms/inlineform/impl/inlineform.view',
  'csui/behaviors/keyboard.navigation/tabkey.behavior',
  'csui/controls/icon/icon.view',
  'xecmpf/utils/table/inlineforms/eventactioncenter/factories/event.factory',
  "hbs!xecmpf/utils/table/inlineforms/eventactioncenter/impl/event",
  'i18n!xecmpf/utils/commands/nls/localized.strings',
  "css!xecmpf/utils/table/inlineforms/eventactioncenter/impl/event",

], function ($, _, Marionette, inlineFormViewRegistry, InlineFormView, TabKeyBehavior,  IconView, EventFeedCollectionFactory,
    template, lang) {

  var InlineFormEventView = InlineFormView.extend({

        className: function () {
          var className = "xecmpf-eac-inlineform-eac";
          if (InlineFormView.prototype.className) {
            className += ' ' + _.result(InlineFormView.prototype, 'className');
          }
          return className;
        },

        template: template,

        templateHelpers: function () {
          if (!!this.arrayofleadingsys && this.arrayofleadingsys.length > 0) {            
            this.Select_List_Data = {
              'choices': { // name of associated select box
                'Select source': {
                  text: [lang.selectEvent],
                  value: [lang.selectEvent]
                }
              }

            };
            this.Select_List_Data = JSON.parse(JSON.stringify(this.Select_List_Data).replace('Select source', lang.selectSource));
            for (var temp = 0; temp < this.arrayofleadingsys.length; temp++) {
              this.Select_List_Data['choices'][this.arrayofleadingsys[temp].key[temp]] =

              {
                "text": this.arrayofleadingsys[temp].value,
                "value": this.arrayofleadingsys[temp].EventIds
              }
            }

            this.enumobjs = Object.keys(this.Select_List_Data.choices);
          }

          return {
            eventproperties: this.enumobjs ? this.enumobjs : {},
            errorMessage: this.errorMessage,
            haveErrorMessage: this.haveErrorMessage,
            add: lang.add,
            cancel: lang.cancel,
            selectEvent: lang.selectEvent
          };

        },

        ui: {
          'selectBox': '.xecmpf-eac-inlineform-select',
          'selectEvent':'.xecmpf-eac-inlineform-options'

        },
        events: {
          'change @ui.selectBox': 'onChangeSelectBox',
          'change @ui.selectEvent': 'onChangeSelectEvent',
          'keydown @ui.selectEvent': 'keyReleased',
          'keydown': 'onKeyInView'
        },

        behaviors: {
          TabKeyBehavior: {
            behaviorClass: TabKeyBehavior
          }
        },

        onDomRefresh: function () {
          if (!!this.$el.find('xecmpf-eac-inlineform-eac')) {          
            $('.csui-table-empty').removeClass('xecmpf-table-empty');

          }
          this.updateSaveButtonDisableStatus(true);
          this.refreshTabableElements();
          !!this.tabableElements && !!this.tabableElements[0] &&
          $(this.tabableElements[0]).trigger('focus');
        },

        keyReleased: function () {
          this.refreshTabableElements();
        },

        onKeyInView: function (event) {
          if (event.keyCode === 9) {
            this._moveTab(event);
            return true;
          }
        },

        refreshTabableElements: function () {
          this.tabableElements = this.$el.find('select:not([disabled]),  button:not([disabled])').filter(
              ':visible').toArray();
        },

        _moveTab: function (event) {
          this.currentlyFocusedElementIndex = this.tabableElements.indexOf(event.target);
          if (event.shiftKey) {
            if (this.currentlyFocusedElementIndex > 0) {
              this.currentlyFocusedElementIndex -= 1;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            } else {
              this.currentlyFocusedElementIndex = this.tabableElements.length - 1;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            }
          } else {
            if (this.currentlyFocusedElementIndex < this.tabableElements.length - 1) {
              this.currentlyFocusedElementIndex += 1;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            } else {
              this.currentlyFocusedElementIndex = 0;
              $(this.tabableElements[this.currentlyFocusedElementIndex]).trigger('focus');
            }
          }
          event.stopPropagation();
          event.preventDefault();
        },

        onChangeSelectEvent: function(event) {
          if (event.target.value !== "0") {
            this.updateSaveButtonDisableStatus(false);
          } else {
            this.updateSaveButtonDisableStatus(true);
          }
        },

        onChangeSelectBox: function (event) {
          !!this.collection && !this.collection.fetched && this.collection.fetch();
          this.sel = document.getElementById('xecmpf-eac-inlineform-options');
          this.options = this.Select_List_Data['choices'][event.target.value];
          this.removeAllOptions(this.sel);
          this.updateSaveButtonDisableStatus(true);
          if (this.options.text.length === 1 && event.target.value !== lang.selectSource) {
            this.haveErrorMessage = true;
            this.errorMessage = lang.NoLeadingSys;
            this.$el.addClass('csui-form-error');
            this.$el.find('.csui-inlineform-group-error').removeClass('binf-hidden');
            this.$el.find('.binf-text-danger').attr('role', 'alert');
            this.$el.find('.csui-text-danger').text(this.errorMessage);
          } else {
            this.$el.removeClass('csui-form-error');
            this.$el.find('.csui-inlineform-group-error').addClass('binf-hidden');
          }
          if (event.target.value !== lang.selectSource) {
            this.ui.selectEvent.prop('disabled', false);
          }
          else {
            this.ui.selectEvent.prop('disabled', true);
          }
          this.refreshTabableElements();
          this.appendDataToSelect(this.sel, this.options);

        },
        updateSaveButtonDisableStatus: function(disableIt) {
          var $saveBtn = this.$el.find('.xecmpf-inline-action-container .csui-btn-save');
          $saveBtn.prop('disabled', disableIt);
        },

        constructor: function InlineFormEventView(options) {
          this.options = options || {};
          this.iconSaveState = false;
          this.saveEditIconView = new IconView({iconName: 'csui_action_input_confirm_disable', size: 'small'});
          this.cancelEditIconView = new IconView({iconName: 'csui_action_input_cancel', size: 'small'});
          this.ui = _.extend({}, this.ui, InlineFormView.prototype.ui);
          this.events = _.extend({}, this.events, InlineFormView.prototype.events);
          this.select_box = $('.xecmpf-eac-inlineform-select');
          this.collection = options.context.getCollection(EventFeedCollectionFactory, {});
          this.listenTo(this.collection, 'sync', this._fetchingEventFeed);
          this.listenTo(this.options.model.collection, 'sync', this._fetchingEventStatusFeed);
          !this.collection.fetched && this.collection.fetch();
          Marionette.ItemView.prototype.constructor.apply(this, arguments);
        },

        onRender: function(){
          this.ui.selectEvent.prop('disabled', true);
        },

        _fetchingEventStatusFeed: function () {
          this.arrayofleadingsys = [];
          this.collection = !!this.options.model && this.options.model.collection;
          if (!!this.collection) {
            var models_len = this.collection.models.length;
            for (var tempmodels = 0; tempmodels < models_len; tempmodels++) {
              var leading_sys = Object.keys(this.collection.models[tempmodels].attributes.data);
              var sys_len = leading_sys.length;
              for (var tempsys = 0; tempsys < sys_len; tempsys++) {
                var length_of_values = this.collection.models[tempmodels].attributes.data[leading_sys[tempsys]].length;
                var arrayofele = [];
                var arrayofEvents = [0];
                arrayofele.push(lang.selectEvent);               
                for (var tempvalues = 0; tempvalues < length_of_values; tempvalues++) {
                  arrayofele.push(
                      this.collection.models[tempmodels].attributes.data[leading_sys[tempsys]][tempvalues].name);
                  arrayofEvents.push(
                      this.collection.models[tempmodels].attributes.data[leading_sys[tempsys]][tempvalues].dataID);
                }
                this.arrayofleadingsys.push({
                  key: leading_sys,
                  value: arrayofele,
                  EventIds: arrayofEvents

                });
              }

            }

          }

          this.render();

        },

        _fetchingEventFeed: function () {
          this.arrayofleadingsys = [];
          var len_models = this.collection.models.length;
          for (var modelItr = 0; modelItr < len_models; modelItr++) {
            var leading_sys_name = Object.keys(this.collection.models[modelItr].attributes.data); 
            var len_led_sys = leading_sys_name.length;
            for (var leadingsysitr = 0; leadingsysitr < len_led_sys; leadingsysitr++) {
              var len_of_values = this.collection.models[modelItr].attributes.data[leading_sys_name[leadingsysitr]].length;
              var arrayofelements = [];
              var arrayofEventIds = [0];
              arrayofelements.push(lang.selectEvent);             
              for (var eachsystem = 0; eachsystem < len_of_values; eachsystem++) {

                if (this.collection.models[modelItr].attributes.data[leading_sys_name[leadingsysitr]][eachsystem].status === 0) {
                  arrayofelements.push(
                      this.collection.models[modelItr].attributes.data[leading_sys_name[leadingsysitr]][eachsystem].name);
                  arrayofEventIds.push(
                      this.collection.models[modelItr].attributes.data[leading_sys_name[leadingsysitr]][eachsystem].dataID);
                }

              }
              this.arrayofleadingsys.push({
                key: leading_sys_name,
                value: arrayofelements,
                EventIds: arrayofEventIds

              });

            }

          }

          this.render();

        },

        appendDataToSelect: function (sel, obj) {

          var f = document.createDocumentFragment();
          var optEle, i, objlen = obj.text.length;

          for (i = 0; i < objlen; i++) {
            optEle = document.createElement('option');
            optEle.appendChild(document.createTextNode(obj.text[i]));

            if (obj.value) {
              optEle.value = obj.value[i];
            }

            f.appendChild(optEle);
          }
          sel.appendChild(f);

        },

        removeAllOptions: function (sel) {
          var len, par;
          len = sel.options.length;
          for (var i = len; i; i--) {
            par = sel.options[i - 1].parentNode;
            par.removeChild(sel.options[i - 1]);
          }
        },

        cancelClicked: function (event) {
          event.preventDefault();
          event.stopPropagation();
          this.collection.fetch();

          this.cancel();
        },

        saveClicked: function () {
          if (this.sel.value) {
            this.model.set('id', this.sel.value);
            this.model.set('action_plan_text', lang.noPlans);
            this._save({id: this.sel.value, status: 1}).fail(function () {
              this.model.set('csuiInlineFormErrorMessage', lang.SaveFailError);
            }.bind(this));
          }
        },

       getAddableCommandInfo: function () {
          return {
            signature: "addEvents"
          };
        }
      },
      {
        CSSubType: 806
      }
  );

  inlineFormViewRegistry.registerByAddableType(
      InlineFormEventView.CSSubType,
      InlineFormEventView);

  return InlineFormEventView;
});
