/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



define(['csui/lib/jquery', 'csui/lib/underscore',
  'csui/utils/contexts/page/page.context',
  'csui/lib/marionette',
  'csui/lib/backbone',
  'csui/utils/log',
  'csui/utils/testutils/async.test.utils',
  'conws/utils/test/testutil',
  'conws/utils/usersettings/usersettings.tabs/navigation.field.view',
  'csui/utils/contexts/factories/connector',
  'i18n!conws/utils/usersettings/impl/nls/lang',
  './navigation.field.mock.js',
],  function ($, _, PageContext, Marionette, Backbone, log,
   TestUtils, TestUtil, NavigationFieldView, ConnectorFactory, lang, Mockdata){

    var pageContext, resultsRegion, regionEl, formView;

    function FormOptions() {

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
        }
      });

      $.extend(this,{
        model: new Backbone.Model({
          data: {},
          schema: {
            properties: {}
          },
          options:{
            fields: {}
          }
        }),
        userid: 1,
        connector: pageContext.getObject(ConnectorFactory),
        context: pageContext
      });
    }

    function testsetup(done) {

      resultsRegion = undefined;
      regionEl = undefined;
      formView = undefined;

      $('body').empty();
      regionEl = $('<div style="width:500px; height:200px;"></div>').appendTo(document.body);
      resultsRegion = new Marionette.Region({
        el: regionEl
      });

      formView = new NavigationFieldView(new FormOptions())

      formView.once("childview:rendered",function(){
        TestUtils.waitFor(function(){
          var isVisible = TestUtils.isElementVisible($(".alpaca-field-checkbox .binf-control-label")[0]);
          return isVisible;
        }, "element to appear").then(done, done.fail);
      });

      resultsRegion.show(formView);
    }

    function teardown(done) {
      resultsRegion.destroy();
      regionEl.remove();
      $('body').empty();
      done();
    }

    describe('NavigationFieldTest', function () {

      beforeAll(function (done) {
        Mockdata.enable();
        testsetup(done);
      });

      afterAll(function (done) {
        Mockdata.disable();
        teardown(done);
      });

      it("show user settings dialog", function (done) {

        var title = $(".cs-form-create .alpaca-container-label").text().trim(),
            checkboxLabel = $(".alpaca-field-checkbox .binf-control-label").text().trim(),
            helpText = $(".csui-field-checkbox .binf-help-block").text().trim();

        expect(title).toEqual(lang.navHeader);
        expect(checkboxLabel).toEqual(lang.navModeLabel);
        expect(helpText).toEqual(lang.navModeText);

        done();
      });

      it("click on checkbox", function(done){

        var checkbox = formView.$('.csui-field-checkbox .binf-switch-container input[type="checkbox"]');
        expect(checkbox.prop("checked")).toEqual(true, "check box on");

        var checkfield = formView.$('.csui-field-checkbox .binf-switch-container');
        TestUtil.fireEvents(checkfield[0],TestUtil.MouseEvent,['mousedown','mouseup','click']);

        checkbox = formView.$('.csui-field-checkbox .binf-switch-container input[type="checkbox"]');
        expect(checkbox.prop("checked")).toEqual(false, "check box off");

        done();
      });
    });
});