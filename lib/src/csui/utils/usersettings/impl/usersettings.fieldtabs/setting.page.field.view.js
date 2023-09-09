/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  "csui/lib/jquery",
  "csui/lib/underscore",
  "csui/lib/marionette",
  "csui/models/form",
  "csui/models/forms",
  "csui/controls/form/form.view",
  "csui/utils/contexts/page/page.context",
  "csui/utils/usersettings/impl/usersettings.model",
  "i18n!csui/utils/usersettings/impl/nls/lang",
  "css!csui/utils/usersettings/impl/usersettingstab",
], function ($, _, Marionette, FormModel, FormCollection, FormView, PageContext, UserSettingsModel, lang) {
  "use strict";

  var IDS = {
    ACCESSIBLEMODE: "accessibleMode",
    CONTENTMGT: "contentMgt",
    CONTENTMGTHELPERTXT: "contentMgtHelperTxt",
    REASON4CONTENTMGT: "reason4ContentMgt",
  };

  var SettingPageFieldView = Marionette.ItemView.extend({
    constructor: function (options) {
      this.model = new UserSettingsModel(options);
      Marionette.ItemView.prototype.constructor.apply(this);
      this.settingsModeChanged = this.model.get("settingsModeChanged") || false;
    },

    tagName: "div",
    template: false,
    ui: {
      btnReason: ".btn-reason",
      reasonTxt: "#reason-txt",
      editReason: '.edit-reason'
    },
    events: {
      "click @ui.btnReason": "btnReasonClick",
      "blur @ui.reasonTxt": "reasonTxtBlur",
      "keyup @ui.reasonTxt": "reasonTxtKeyUp",
      "focus @ui.reasonTxt": "reasonTxtfocus",
      "click @ui.editReason": "editReasonclick",
    },
    editReasonclick: function(){
      $(".lbl-reason-field").hide();
      $(".show-reason-container").show();
      $("#reason-txt").val(this.reasonvalfromApi);
    },
    reasonTxtfocus: function(){
      $(".show-error-reason").hide();
      $("#reason-txt").removeClass('err-reason-txt');
    },
    btnReasonClick: function (event) {
      var val = event.target.value || event.target.parentElement.parentElement.value;
      if (val === "cancel") {
        if(!this.reasonvalfromApi){
          this.setInizState(false);
          this.handleContentManagement(false);
        }else{
          $('.show-reason-container').hide();
          $('.lbl-reason-field').show();
        }
        
      } else if(val === 'save') {
        this.saveContentMgtData(true);
      }
    },
    getURLv2: function(){
      var url =  this.model.attributes.connector.getConnectionUrl().getApiBase('v2');
      if(url){
        url+='members/preferences';
      }
      return url;

    },
    saveContentMgtData: function(isContentMgtEnabled){
      var options = {
        url : this.getURLv2(),
        method: 'PUT',
        data: {
          General:{
            enableCMMode: isContentMgtEnabled,
            cmModeReason:  this.reasonValue
          }
        }
      };

      this.model.attributes.connector.makeAjaxCall(options)
      .then(function () {
        if(isContentMgtEnabled){
          location.reload();
        }else{
          console.log("Content Mgt disabled");
        }
      }).catch(function(error){
        console.log("Failed", error);
      });

    },
    reasonTxtKeyUp: function () { // to check error
      this.reasonValue = $("#reason-txt").val();
      if (!this.reasonValue) {
        $(".btn-reason.save").attr("disabled", true);
        this.ui.reasonTxt.addClass('err-reason-txt');
      } else {
        $(".btn-reason.save").removeAttr("disabled");
        $(".show-error-reason").hide();
        this.ui.reasonTxt.removeClass('err-reason-txt');
      }
    },
    reasonTxtBlur: function () {
      var context =  this.model.attributes.context,
      showErrReason = $(".show-error-reason"), reasonTxt = $("#reason-txt");
      if (!this.reasonValue) {
        context.canBeSavedDirectlyAlert = false;
        context.cannotMoveOutOfSettingPage = true;
        showErrReason.show();
        reasonTxt.addClass('err-reason-txt');
      } else {
        this.model.attributes.context.canBeSavedDirectlyAlert = true;
        this.model.attributes.context.cannotMoveOutOfSettingPage = false;
        this.model.attributes.context.canBeSavedDirectlyMethod = this;
        showErrReason.hide();
        reasonTxt.removeClass('err-reason-txt');
      }
    },

    getContentMgtSwitch: function (state4ContentMgt) {
      return {
        containerID: IDS.CONTENTMGT,
        data: {
          contentMgt: state4ContentMgt,
        },
        options: {
          fields: {
            contentMgt: {
              hidden: false,
              label: lang.contentMgtModeLabel,
              type: "checkbox",
            },
          },
        },
        schema: {
          properties: {
            contentMgt: {
              readonly: false,
              required: false,
              type: "boolean",
            },
          },
          title: lang.contentMgtHeader,
          type: "object",
        },
      };
    },
    getRawFormsData: function (state4Accessible, enableContentManager, state4ContentMgt) {
      var form = [
        {
          containerID: IDS.ACCESSIBLEMODE,
          data: {
            accessibleMode: state4Accessible,
          },
          options: {
            fields: {
              accessibleMode: {
                hidden: false,
                label: lang.accModeLabel,
                type: "checkbox",
                helper: lang.accModeText,
              },
            },
          },
          schema: {
            properties: {
              accessibleMode: {
                readonly: false,
                required: false,
                type: "boolean",
              },
            },
            title: lang.accHeader,
            type: "object",
          },
        },
      ];
      if (enableContentManager) {
        form.push(this.getContentMgtSwitch(state4ContentMgt));
      }

      return {
        forms: form,
      };
    },
    getRawFormsDataContentMgt: function (state4ContentMgt) {
      var form = [
        {
          containerID: IDS.CONTENTMGTHELPERTXT,
          data: {
            contentMgtHelperTxt: lang.contentMgtHelper,
          },
          schema: {
            type: "object",
            properties: {
              contentMgtHelperTxt: {
                type: "string",
              },
            },
          },
          view: {
            globalTemplate:
              "<div style='padding:8px'><p style='font-size:12px'>{{{data.contentMgtHelperTxt}}}</p></div>",
          },
        },
      ];
      if (state4ContentMgt) {
        form.push({
          containerID: IDS.REASON4CONTENTMGT,
          data: {
            reason4ContentMgt: lang.contentMgtHelper,
          },
          schema: {
            type: "object",
            properties: {
              reason4ContentMgt: {
                type: "string",
              },
            },
          },
          view: {
            globalTemplate:
              '<div class="reason-main-container">' +
                '<label class="lbl-reason" for="reason-txt">' +
                  '<span style="color:red; margin-right: 2px;">*</span>' +
                  lang.lblReason +
                "</label>" +
                    '<div class="show-reason-container">' +
                      '<input type="text" id="reason-txt" tabindex="0" data-cstabindex="0" class="context-mgt-reason">' +
                      '<button class="btn-reason save" value="save" disabled>{{{icon-v2 iconName="csui_action_confirm32" size="small" states="normal"}}}</button>' +
                      '<button class="btn-reason cancel" value="cancel">{{{icon-v2 iconName="csui_action_cancel32" size="small" states="normal"}}}</button>' +
                      '<div class="show-error-reason">' +
                          '<div class="show-error-reason-msg">' +
                            '<span class="error-reason-msg-rectangle">' +
                            '<span class="error-cross-mark"></span>' +
                            '</span>' +
                            '<span class="error-msg-txt">' +
                            lang.errMsgReasonField +
                            '</span>' +
                          '</div>' +
                        '</div>' +                        
                    '</div>' +
                    '<div class="lbl-reason-field">'+
                      '<span class="reason-text-lbl">'+this.reasonvalfromApi+'</span>'+
                      '<span class="csui-icon-edit inline-edit-icon icon-edit edit-reason"></span>'+
                    '</div>'+
                '</div>',
          },
        });
      }
      return {
        forms: form,
      };
    },
    setInizState: function (state4ContentMgt) {

      var accModeCheckedState = this.model.get("accessibleMode");
      var formModels = new FormCollection();
      var formData = this.getRawFormsData(
        accModeCheckedState,
        this.enableContentManager,
        state4ContentMgt
      );
      formModels.reset(formModels.parse(formData));
      var formArr = formModels.models[0].attributes.forms;
      for (var i = 0; i < formArr.length; i++) {
        var formModel = new FormModel(formArr[i]);
        this.renderFormModel(formModel, state4ContentMgt);
      }
    },
    renderFormModel: function (curCat, state4ContentMgt) {
      var randomID = "container_" + Math.floor(Math.random() * Math.pow(10, 8));
      var newContainerID = curCat.get("containerID") || randomID;
      this.$el.append($("<div>").attr("id", newContainerID));

      var contentRegion = new Marionette.Region({
        el: this.$el.find("#" + newContainerID)[0],
      });

      var formView = new FormView({
        context: new PageContext(),
        model: curCat,
        mode: "update",
      });

      this.listenTo(formView, "change:field", function (event) {
          switch (event.name) {
            case "contentMgt":
              this.handleContentManagement(event.value);
              break;
            case "accessibleMode":
              this.settingsModeChanged = !this.settingsModeChanged; //which helps to page reload
              this.model.set({
                settingsModeChanged: this.settingsModeChanged,
                accessibleMode: event.value,
              });
              this.model.save();
              break;
            default:
              console.log("Incorrect event.name = ", event.name);
          }
        }, this);
      this.listenTo(formView, "render:form", function (event) {
          this.trigger("childview:rendered");
          var data = event.alpaca.data;
          if (state4ContentMgt && data && data.hasOwnProperty("contentMgt")) {
            this.handleContentManagement(state4ContentMgt);
          }

          if(this.reasonvalfromApi && data && data.hasOwnProperty("reason4ContentMgt")){
            this.populateReason();
          }
        }, this);
      contentRegion.show(formView);
    },
    populateReason: function(){
      $('.show-reason-container').hide();
      $('.lbl-reason-field').show();
    },
    onRender: function () {
      this.model.fetch({
        prepare: false,
        async: false,
      }); // TODO is sync the recommend way to do this?
      this.enableContentManager = this.model.get('hasContentMgrPriv');
      var isInContentMgrMode = this.model.get('isInContentMgrMode');

      this.contentMgtEnable = isInContentMgrMode? isInContentMgrMode: false;
      this.reasonvalfromApi = '';
      this.setInizState(this.contentMgtEnable);
    },
    handleContentManagement: function (switchValOfContentMgt) {
      if (!switchValOfContentMgt) {
        this.model.attributes.context.cannotMoveOutOfSettingPage = false;
        $("#" + IDS.CONTENTMGTHELPERTXT).remove();
        $("#" + IDS.REASON4CONTENTMGT).remove();
        $("#reason-txt").val("");
        this.reasonValue = "";
        this.saveContentMgtData(switchValOfContentMgt, "");
        
        return;
      }
      if(!this.contentMgtEnable){ // need to be check
        this.model.attributes.context.cannotMoveOutOfSettingPage = true;
      }
      var formModels = new FormCollection();
      formModels.reset(
        formModels.parse(this.getRawFormsDataContentMgt(switchValOfContentMgt))
      );
      var formArr = formModels.models[0].attributes.forms;
      for (var i = 0; i < formArr.length; i++) {
        var formModel = new FormModel(formArr[i]);
        this.renderFormModel(formModel);
      }
    },
  });

  return SettingPageFieldView;
});
