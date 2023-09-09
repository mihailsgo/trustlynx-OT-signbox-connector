/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/backbone', 'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'csui/controls/form/form.view',
  'csui/utils/testutils/async.test.utils',
  './show.wksp.in.form.mock.js'
], function ($, _, Backbone, Marionette,
  PageContext, FormView,
  TestUtil, MockData) {
    'use strict';

    var pageContext, resultsRegion, regionEl, formView;

    function FormOptions() {
      $.extend(this,{
        model: new Backbone.Model({
          data: {},
          schema: {
            properties: {}
          },
          options:{
            fields: {}
          }
        })
      });

      $.extend(true,this.model.attributes,{
        data: {
          workspaceIdA: 431473
        },
        schema: {
          properties: {
            workspaceIdA: {
              description: "Workspace displayed in this widget",
              title: "Workspace A",
              type: "integer"
            }
          }
        },
        options: {
          fields: {
            workspaceIdA:{
              "type": "otconws_workspace_id",
              "type_control": {
                "parameters": {
                  "workspace_types": [ 1, 496 ]
                }
              }
            }
          }
        }
      });
      $.extend(true,this.model.attributes,{
        data: {
          workspaceIdB: 413777
        },
        schema: {
          properties: {
            workspaceIdB: {
              "readonly": true,
              "required": false,
              "title": "",
              "type": "integer",
              "hidden": false
            }
          }
        },
        options: {
          fields: {
            workspaceIdB:{
              "label": "Workspace B",
              "hidden": false,
              "readonly": true,
              "hideInitValidationError": false,
              "type": "otconws_workspace_id"
            }
          }
        }
      });
      $.extend(true,this.model.attributes,{
        data: {
          workspaceIdC: 413556
        },
        schema: {
          properties: {
            workspaceIdC: {
              "type": "integer"
            }
          }
        },
        options: {
          fields: {
            workspaceIdC:{
              "label": "Workspace C",
              "type": "otconws_workspace_id",
              "type_control": {
                "parameters": {
                  "search_type": "startsWith"
                }
              }
            }
          }
        }
      });

    }

    function testsetup(done,formOptions) {

      $.mockjax.clear(); // to be sure, no mock data relict from previous test spec can affect our tests
      MockData.enable();

      pageContext = undefined;
      resultsRegion = undefined;
      regionEl = undefined;
      formView = undefined;

      $('body').empty();
      regionEl = $('<div style="width:500px; height:200px;"></div>').appendTo(document.body);
      resultsRegion = new Marionette.Region({
        el: regionEl
      });

      pageContext = new PageContext({
        factories: {
          connector: {
            connection: {
              url: '//server/otcs/cs/api/v1',
              supportPath: '/support',
              session: {
                ticket: 'dummy'
              }
            }
          },
          node: {
            attributes: {
              id: 2513449,
              type: 848
            }
          }
        }
      });

      $.extend(formOptions,{
        context: pageContext
      });

      formView = new FormView(formOptions);
      formView.once("render:form",done);
      resultsRegion.show(formView);

    }

    function teardown(done) {
      resultsRegion.destroy();
      regionEl.remove();
      $('body').empty();
      MockData.disable();
      done();
    }

    describe('AlpWorkspaceField ShowInFormTest', function () {

      var el;

      describe('ShowInCreateMode', function () {

        beforeAll(function (done) {

          var formOptions = new FormOptions();
          $.extend(formOptions,{
            mode: "create"
          });
          testsetup(done,formOptions);
        });

        afterAll(function (done) {
          teardown(done);
        });

        it('displays name in editable field A', function (done) {
          TestUtil.waitFor(function(){
            var name = $("[data-alpaca-container-item-name=workspaceIdA] input").prop("value");
            return name==="and prox";
          },"item name to appear").then(function(){
            el = $("[data-alpaca-container-item-name=workspaceIdA] input");
            expect(TestUtil.isElementVisible(el[0])).toEqual(true,"input field visibility");
            el = $("[data-alpaca-container-item-name=workspaceIdA] .cs-name .csui-typeahead-container");
            expect(TestUtil.isElementVisible(el[0])).toEqual(false,"readonly name visibility");
            done();
          },done.fail);
        });

        it('displays no icon or image in editable field A', function (done) {
          el = $("[data-alpaca-container-item-name=workspaceIdA] .cs-field-picture.csui-custom-image");
          expect(TestUtil.isElementVisible(el[0])).toEqual(false,"custom image visibility");
          el = $("[data-alpaca-container-item-name=workspaceIdA] .cs-field-picture.csui-default-icon");
          expect(TestUtil.isElementVisible(el[0])).toEqual(false,"default icon visibility");
          done();
        });

        it('displays name in readonly field B', function (done) {
          TestUtil.waitFor(function(){
            var name = $("[data-alpaca-container-item-name=workspaceIdB] .cs-name .csui-typeahead-container").text().trim();
            return name==="and near prox not";
          },"item name to appear").then(function(){
            el = $("[data-alpaca-container-item-name=workspaceIdB] input");
            expect(TestUtil.isElementVisible(el[0])).toEqual(false,"input field visibility");
            el = $("[data-alpaca-container-item-name=workspaceIdB] .cs-name .csui-typeahead-container");
            expect(TestUtil.isElementVisible(el[0])).toEqual(true,"readonly name visibility");
            done();
          },done.fail);
        });

        it('displays workspace icon in readonly field B', function (done) {
          el = $("[data-alpaca-container-item-name=workspaceIdB] .cs-field-picture.csui-custom-image");
          expect(TestUtil.isElementVisible(el[0])).toEqual(false,"custom image visibility");
          el = $("[data-alpaca-container-item-name=workspaceIdB] .cs-field-picture.csui-default-icon");
          expect(TestUtil.isElementVisible(el[0])).toEqual(true,"default icon visibility");
          var iconClass = "csui-icon-v2__conws_mime_workspace"
          expect(el.hasClass(iconClass)&&iconClass).toEqual(iconClass,"element shows workspace icon");
          expect(el.prop("tagName")).toEqual('svg',"element has svg loaded");
          done();
        });

        it('displays name in editable field C', function (done) {
          TestUtil.waitFor(function(){
            var name = $("[data-alpaca-container-item-name=workspaceIdC] input").prop("value");
            return name==="near where prox";
          },"item name to appear").then(function(){
            el = $("[data-alpaca-container-item-name=workspaceIdC] input");
            expect(TestUtil.isElementVisible(el[0])).toEqual(true,"input field visibility");
            el = $("[data-alpaca-container-item-name=workspaceIdC] .cs-name .csui-typeahead-container");
            expect(TestUtil.isElementVisible(el[0])).toEqual(false,"readonly name visibility");
            done();
          },done.fail);
        });

        it('generates correct search 1 in editable field A', function (done) {
          var searchvalue = "prox";
          var searchquery = '[QLREGION "XECMWkspLinkRefTypeID"] IN (1,496) AND [QLREGION "OTName"] *prox* AND [QLREGION "XECMWkspDocTemplateID"] > 0';
          el = $("[data-alpaca-container-item-name=workspaceIdA] input");
          MockData.onSearchRequest = function(data){
            expect(data.where).toEqual(searchquery,"search for '"+searchvalue+"' in editable field A");
            done();
          };
          el.prop("value",searchvalue);
          el.trigger("keydown");
          el.trigger("keypress");
          el.trigger("keyup");
        });

        it('drops down typeahead list in editable field A', function (done) {
          TestUtil.waitFor(function(){
            var visible = TestUtil.isElementVisible($("[data-alpaca-container-item-name=workspaceIdA] .typeahead.binf-dropdown-menu :first-child")[0]);
            return visible;
          },"drop down to open").then(function(){
            el = $("[data-alpaca-container-item-name=workspaceIdA] .typeahead.binf-dropdown-menu .csui-typeaheadpicker-item");
            expect(el.length).toEqual(20,"drop down length");
            expect(el.text().trim().replace(/\s*\n\s*/g,"|")).toEqual("and prox|near where prox|and near prox not|and benearer prox not|and nearer proxim not|and,near,prox,not|and benear proxim not|and benear prox not|and near approx not|and nearer prox not|and near approxim not|and near proxim not|and benear approx not|and benearer approx not|and benear approxim not|and benearer approxim not|and nearer approxim not|and benearer proxim not|and nearer approx not|and prox where near not");
            done();
          },done.fail);
        });

        it('shows drop down item 1 with default icon', function (done) {
          el = $("[data-alpaca-container-item-name=workspaceIdA] .typeahead.binf-dropdown-menu .csui-typeaheadpicker-item")[1];
          expect($(el).text().trim()).toEqual("near where prox");
          if (el) {
            expect(TestUtil.isElementVisible($(".csui-custom-image",el)[0])).toEqual(false,"custom image visibility");
            expect(TestUtil.isElementVisible($(".csui-default-icon",el)[0])).toEqual(true,"default icon visibility");
            el = $(".csui-default-icon",el);
            var iconClass = "csui-icon-v2__conws_mime_workspace"
            expect(el.hasClass(iconClass)&&iconClass).toEqual(iconClass,"element shows workspace icon");
            expect(el.prop("tagName")).toEqual('svg',"element has svg loaded");
            done();
          } else {
            done();
          }
        });

        it('closes drop down with click on item 1', function (done) {
          el = $("[data-alpaca-container-item-name=workspaceIdA] .typeahead.binf-dropdown-menu .csui-typeaheadpicker-item")[1];
          $(el).trigger("mouseenter");
          $(el).trigger("click");
          TestUtil.waitFor(function(){
            var visible = TestUtil.isElementVisible($("[data-alpaca-container-item-name=workspaceIdA] .typeahead.binf-dropdown-menu")[0]);
            return !visible;
          },"drop down to close").then(done,done.fail);
        });

        it('displays selected name in editable field A', function (done) {
          TestUtil.waitFor(function(){
            var name = $("[data-alpaca-container-item-name=workspaceIdA] input").prop("value");
            return name==="near where prox";
          },"item name to appear").then(function(){
            el = $("[data-alpaca-container-item-name=workspaceIdA] input");
            expect(TestUtil.isElementVisible(el[0])).toEqual(true,"input field visibility");
            el = $("[data-alpaca-container-item-name=workspaceIdA] .cs-name .csui-typeahead-container");
            expect(TestUtil.isElementVisible(el[0])).toEqual(false,"readonly name visibility");
            done();
          },done.fail);
        });

        it('generates correct search 2 in editable field A', function (done) {
          var searchvalue = "near<prox<";
          var searchquery = '[QLREGION "XECMWkspLinkRefTypeID"] IN (1,496) AND [QLREGION "OTName"] QLLEFT-TRUNCATION "near<prox<" & [QLREGION "OTName"] QLRIGHT-TRUNCATION "<prox<" AND [QLREGION "XECMWkspDocTemplateID"] > 0'
          el = $("[data-alpaca-container-item-name=workspaceIdA] input");
          MockData.onSearchRequest = function(data){
            expect(data.where).toEqual(searchquery,"search for '"+searchvalue+"' in editable field A");
            done();
          };
          el.prop("value",searchvalue);
          el.trigger("keydown");
          el.trigger("keypress");
          el.trigger("keyup");
        });

        it('generates correct search 3 in editable field A', function (done) {
          var searchvalue = "<near<prox<";
          var searchquery = '[QLREGION "XECMWkspLinkRefTypeID"] IN (1,496) AND [QLREGION "OTName"] QLRIGHT-TRUNCATION "<near<prox<" AND [QLREGION "XECMWkspDocTemplateID"] > 0'
          el = $("[data-alpaca-container-item-name=workspaceIdA] input");
          MockData.onSearchRequest = function(data){
            expect(data.where).toEqual(searchquery,"search for '"+searchvalue+"' in editable field A");
            done();
          };
          el.prop("value",searchvalue);
          el.trigger("keydown");
          el.trigger("keypress");
          el.trigger("keyup");
        });

        it('changes name back in editable field A', function (done) {
          var searchvalue = "prox";
          el = $("[data-alpaca-container-item-name=workspaceIdA] input");
          MockData.onSearchRequest = function(){
            setTimeout(function(){
              TestUtil.waitFor(function(){
                var visible = TestUtil.isElementVisible($("[data-alpaca-container-item-name=workspaceIdA] .typeahead.binf-dropdown-menu :first-child")[0]);
                return visible;
              },"drop down to open again").then(function(){
                el = $("[data-alpaca-container-item-name=workspaceIdA] .typeahead.binf-dropdown-menu .csui-typeaheadpicker-item")[0];
                $(el).trigger("mouseenter");
                $(el).trigger("click");
                TestUtil.waitFor(function(){
                  var visible = TestUtil.isElementVisible($("[data-alpaca-container-item-name=workspaceIdA] .typeahead.binf-dropdown-menu")[0]);
                  return !visible;
                },"drop down to close again").then(function(){
                  TestUtil.waitFor(function(){
                    var name = $("[data-alpaca-container-item-name=workspaceIdA] input").prop("value");
                    return name==="and prox";
                  },"item name to appear again").then(function(){
                    el = $("[data-alpaca-container-item-name=workspaceIdA] input");
                    expect(TestUtil.isElementVisible(el[0])).toEqual(true,"input field visibility");
                    el = $("[data-alpaca-container-item-name=workspaceIdA] .cs-name .csui-typeahead-container");
                    expect(TestUtil.isElementVisible(el[0])).toEqual(false,"readonly name visibility");
                    done();
                  },done.fail);
                },done.fail);
              },done.fail);
            },0);
          };
          el.prop("value",searchvalue);
          el.trigger("keydown");
          el.trigger("keypress");
          el.trigger("keyup");
        });

        it('generates correct search 1 in editable field C', function (done) {
          var searchvalue = "prox";
          var searchquery = '[QLREGION "OTSubType"] 848 AND [QLREGION "OTName"] QLRIGHT-TRUNCATION " prox" AND [QLREGION "XECMWkspDocTemplateID"] > 0';
          el = $("[data-alpaca-container-item-name=workspaceIdC] input");
          MockData.onSearchRequest = function(data){
            expect(data.where).toEqual(searchquery,"search for '"+searchvalue+"' in editable field A");
            done();
          };
          el.prop("value",searchvalue);
          el.trigger("keydown");
          el.trigger("keypress");
          el.trigger("keyup");
        });

        it('generates correct search 2 in editable field C', function (done) {
          var searchvalue = "near<prox<";
          var searchquery = '[QLREGION "OTSubType"] 848 AND [QLREGION "OTName"] QLRIGHT-TRUNCATION " near<prox<" AND [QLREGION "XECMWkspDocTemplateID"] > 0'
          el = $("[data-alpaca-container-item-name=workspaceIdC] input");
          MockData.onSearchRequest = function(data){
            expect(data.where).toEqual(searchquery,"search for '"+searchvalue+"' in editable field A");
            done();
          };
          el.prop("value",searchvalue);
          el.trigger("keydown");
          el.trigger("keypress");
          el.trigger("keyup");
        });

        it('generates correct search 3 in editable field C', function (done) {
          var searchvalue = "<near<prox<";
          var searchquery = '[QLREGION "OTSubType"] 848 AND [QLREGION "OTName"] QLRIGHT-TRUNCATION "<near<prox<" AND [QLREGION "XECMWkspDocTemplateID"] > 0'
          el = $("[data-alpaca-container-item-name=workspaceIdC] input");
          MockData.onSearchRequest = function(data){
            expect(data.where).toEqual(searchquery,"search for '"+searchvalue+"' in editable field A");
            done();
          };
          el.prop("value",searchvalue);
          el.trigger("keydown");
          el.trigger("keypress");
          el.trigger("keyup");
        });

      });

      describe('ShowInUpdateMode', function () {

        beforeAll(function (done) {
          var formOptions = new FormOptions();
          $.extend(formOptions,{
            layoutMode: "singleCol",
            mode: "update"
          });
          testsetup(done,formOptions);
        });

        afterAll(function (done) {
          teardown(done);
        });

        it('displays name in editable field A', function (done) {
          TestUtil.waitFor(function(){
            var name = $("[data-alpaca-container-item-name=workspaceIdA] input").prop("value");
            return name==="and prox";
          },"item name to appear").then(function(){
            el = $("[data-alpaca-container-item-name=workspaceIdA] input");
            expect(TestUtil.isElementVisible(el[0])).toEqual(false,"input field visibility");
            el = $("[data-alpaca-container-item-name=workspaceIdA] .cs-name .csui-typeahead-container");
            expect(TestUtil.isElementVisible(el[0])).toEqual(true,"readonly name visibility");
            done();
          },done.fail);
        });

        it('displays name in readonly field B', function (done) {
          TestUtil.waitFor(function(){
            var name = $("[data-alpaca-container-item-name=workspaceIdB] .cs-name .csui-typeahead-container").text().trim();
            return name==="and near prox not";
          },"item name to appear").then(function(){
            el = $("[data-alpaca-container-item-name=workspaceIdB] input");
            expect(TestUtil.isElementVisible(el[0])).toEqual(false,"input field visibility");
            el = $("[data-alpaca-container-item-name=workspaceIdB] .cs-name .csui-typeahead-container");
            expect(TestUtil.isElementVisible(el[0])).toEqual(true,"readonly name visibility");
            done();
          },done.fail);
        });

        it('displays workspace icon in readonly field C', function (done) {
          el = $("[data-alpaca-container-item-name=workspaceIdC] .cs-field-picture.csui-custom-image");
          expect(TestUtil.isElementVisible(el[0])).toEqual(false,"custom image visibility");
          el = $("[data-alpaca-container-item-name=workspaceIdC] .cs-field-picture.csui-default-icon");
          expect(TestUtil.isElementVisible(el[0])).toEqual(true,"default icon visibility");
          var iconClass = "csui-icon-v2__conws_mime_workspace"
          expect(el.hasClass(iconClass)&&iconClass).toEqual(iconClass,"element shows workspace icon");
          expect(el.prop("tagName")).toEqual('svg',"element has svg loaded");
          done();
        });

        it('displays pen, when mouse hovers over input field A', function (done) {
          el = $("[data-alpaca-container-item-name=workspaceIdA] .cs-field-read");
          var pen = $("[data-alpaca-container-item-name=workspaceIdA] .csui-icon-edit.icon-edit");
          expect(TestUtil.isElementVisible(pen[0])).toEqual(false,"pen icon visibility");
          el.trigger("mouseover");
          TestUtil.waitFor(function(){
            var visible = TestUtil.isElementVisible(pen[0]);
            return visible;
          },"pen icon becomes visible").then(done,done.fail);
        });

        it('enters input mode, when clicking on pen of editable field A', function (done) {
          el = $("[data-alpaca-container-item-name=workspaceIdA] input");
          expect(TestUtil.isElementVisible(el[0])).toEqual(false,"input field visibility");
          el = $("[data-alpaca-container-item-name=workspaceIdA] .cs-name .csui-typeahead-container");
          expect(TestUtil.isElementVisible(el[0])).toEqual(true,"readonly name visibility");
          var pen = $("[data-alpaca-container-item-name=workspaceIdA] .csui-icon-edit.icon-edit");
          pen.trigger("click");
          el = $("[data-alpaca-container-item-name=workspaceIdA] input");
          expect(TestUtil.isElementVisible(el[0])).toEqual(true,"input field visibility");
          el = $("[data-alpaca-container-item-name=workspaceIdA] .cs-name .csui-typeahead-container");
          expect(TestUtil.isElementVisible(el[0])).toEqual(false,"readonly name visibility");
          done();
        });

        it('drops down typeahead list in editable field A', function (done) {
          el = $("[data-alpaca-container-item-name=workspaceIdA] input");
          MockData.onSearchRequest = function(){};
          el.prop("value","prox");
          el.trigger("keydown");
          el.trigger("keypress");
          el.trigger("keyup");
          TestUtil.waitFor(function(){
            var visible = TestUtil.isElementVisible($("[data-alpaca-container-item-name=workspaceIdA] .typeahead.binf-dropdown-menu :first-child")[0]);
            return visible;
          },"drop down to open").then(done,done.fail);
        });


      });

      describe("InvalidConfiguration",function(){

        beforeAll(function (done) {

          var formOptions = new FormOptions();
          $.extend(formOptions,{
            mode: "create"
          });
          $.extend(true,formOptions.model.attributes,{
            options: {
              fields: {
                workspaceIdA: {
                  type_control: {
                    parameters: {
                      search_type: "InvalidSearchType"
                    }
                  }
                }
              }
            }
          });
          testsetup(done,formOptions);
        });

        afterAll(function (done) {
          teardown(done);
        });

        it('displays name in editable field A', function (done) {
          TestUtil.waitFor(function(){
            var name = $("[data-alpaca-container-item-name=workspaceIdA] input").prop("value");
            return name==="and prox";
          },"item name to appear").then(function(){
            el = $("[data-alpaca-container-item-name=workspaceIdA] input");
            expect(TestUtil.isElementVisible(el[0])).toEqual(true,"input field visibility");
            el = $("[data-alpaca-container-item-name=workspaceIdA] .cs-name .csui-typeahead-container");
            expect(TestUtil.isElementVisible(el[0])).toEqual(false,"readonly name visibility");
            done();
          },done.fail);
        });

        it('throws an exception and does not trigger a search', function (done) {
          var searched, searchvalue = "prox";
          el = $("[data-alpaca-container-item-name=workspaceIdA] input");
          MockData.onSearchRequest = function(data){
            searched = true;
          };
          var pickerView = formView.form.childrenByPropertyId.workspaceIdA.fieldView.pickerView;
          var retrieveItems = pickerView._retrieveItems;
          pickerView._retrieveItems = function() {
            var called, result;
            try {
              result = retrieveItems.apply(this,arguments);
              called = true;
            } catch(err) {
              result = $.Deferred().reject().promise();
            }
            expect(called).toBeUndefined("retrieval must throw an exception");
            expect(searched).toBeUndefined("search must not be called");
            done();
            return result;
          };
          el.prop("value",searchvalue);
          el.trigger("keydown");
          el.trigger("keypress");
          el.trigger("keyup");
        });

      });

    });

  });
