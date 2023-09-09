/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/underscore', 'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'csui/utils/base',
  'csui/utils/testutils/async.test.utils',
  'csui/perspectives/tabbed/tabbed.perspective.view',
  'conws/widgets/metadata/metadata.view',
  'conws/widgets/metadata/test/metadata.mock',
  'conws/utils/test/testutil',
  'json!conws/widgets/metadata/test/widget.1.options.json',
  'json!conws/widgets/metadata/test/widget.2.options.json',
  'json!conws/widgets/metadata/test/widget.3.options.json',
  'json!conws/widgets/metadata/test/widget.4.options.json',
  'json!conws/widgets/metadata/test/widget.header.options.json'
], function ($, _, Marionette, PageContext, BaseUtils, TestUtils,
  TabbedPerspectiveView, MetadataView, MetadataMock, TestUtil,
  Widget1Options, Widget2Options, Widget3Options, Widget4Options) {

  function _iterate(obj, properties) {
    _.each(_.keys(obj), function (element) {
      if (obj.hasOwnProperty(element)) {
        if (typeof obj[element] === "object") {
          _iterate(obj[element], properties);
        } else {
          properties.push(element);
        }
      }
    });
  }

  describe('MetadataView', function () {

    var context;
    var v1, v2;

    beforeEach(function () {

      context = new PageContext({
        factories: {
          connector: {
            connection: {
              url: '//server/otcs/cs/api/v1',
              supportPath: '/support',
              session: {
                ticket: 'dummy'
              }
            },
            assignTo: function () {
            }
          },
          node: {
            attributes: {
              id: 19500,
              type: 848
            }
          }
        }
      });

      MetadataMock.enable();

    });

    afterEach(function () {

      MetadataMock.disable();

    });

    describe('given empty configuration', function () {

      beforeEach(function () {
        v1 = new MetadataView({
          context: context
        });
      });

      it('can be created', function () {
        expect(v1 instanceof MetadataView).toBeTruthy();
      });

    });

    describe('given valid configuration', function () {

      beforeEach(function () {

        v1 = new MetadataView({
          context: context,
          data: Widget1Options.content
        });
        v1.render(); // no model loaded

        v2 = new MetadataView({
          context: context,
          data: Widget2Options.content
        })

      });

      afterEach(function () {
        if(v1.options.data.metadata[0].label === "Related" && v1.options.data.metadata[0].type === "group"){
          v1.options.data.metadata.shift();
        }
      });

      it('has valid options', function () {

        expect(v1.options && v1.options.data).toBeDefined();

      });

      describe('matches configuration', function () {

        it('has configured title', function () {
          expect(v1.options.data.title).toBeDefined();
          var title = BaseUtils.getClosestLocalizedString(v1.options.data.title, "");
          expect(
            v1.$('> .conws-metadata > .tile-header > .tile-title > .csui-heading').text()
          ).toEqual(title);

        });

        it('has no configured icon', function () {
          expect(v1.options.data.icon).toBeUndefined();
          expect(
            v1.$('> .conws-metadata > .tile-header > .tile-type-icon').length
          ).toEqual(1);

        });

        it('has configured icon', function () {

            v2.render();
            expect(v2.options.data.icon).toBeDefined();
            var iconName = v2.options.data.icon;
            expect(
                    v2.$('> .conws-metadata > .tile-header > .tile-type-icon > .' + iconName).length
            ).toEqual(1);

        });

        describe('given valid data', function () {

          beforeEach(function (done) {

            v1.model.fetch();
            TestUtil.waitFor(done,function () {
              return v1.model.get("data");
            }, 'Data fetch timed out', 5000);

            v2.model.fetch();
            TestUtil.waitFor(done,function () {
              return v2.model.get("data");
            }, 'Data fetch timed out', 5000);

          });

          afterEach(function () {
            if(v1.options.data.metadata[0].label === "Related" && v1.options.data.metadata[0].type === "group"){
              v1.options.data.metadata.shift();
            }
          });

          describe('respects hideEmptyFields option', function () {

            it('shows non-empty field', function () {

              var catId = 12345, attId = 3, fieldName = "12345_3";
              var fieldConfigured = false;
              expect(v1.options.data.metadata).toBeDefined();
              _.each(v1.options.data.metadata, function (element) {
                if (element.attributeId === attId && element.categoryId === catId) {
                  fieldConfigured = true;
                }
              });
              expect(fieldConfigured).toBeTruthy();
              var properties = [];
              _iterate(v1.model.get('data'), properties);
              expect(properties).toContain(fieldName);

            });

            it('hides empty field', function () {

              var catId = 12345, attId = 4, fieldName = "12345_4";
              expect(v1.options.data.hideEmptyFields).toBeDefined();
              var hideEmptyFields = v1.options.data.hideEmptyFields === true;
              expect(hideEmptyFields).toBeTruthy();
              var fieldConfigured = false;
              _.each(v1.options.data.metadata, function (element) {
                if (element.attributeId === attId && element.categoryId === catId) {
                  fieldConfigured = true;
                }
              });
              expect(fieldConfigured).toBeTruthy();
              var properties = [];
              _iterate(v1.model.get('data'), properties);
              expect(properties).not.toContain(fieldName);

            });

            it('shows empty field', function () {

              var catId = 12345, fieldName = "12345_4";
              expect(v2.options.data.hideEmptyFields).toBeFalsy();
              var fieldConfigured = false;
              _.each(v2.options.data.metadata, function (element) {
                if (element.type === "category" && element.categoryId === catId) {
                  fieldConfigured = true;
                }
              });
              expect(fieldConfigured).toBeTruthy();
              var properties = [];
              _iterate(v2.model.get('data'), properties);
              expect(properties).toContain(fieldName);
              expect(v2.model.get('data')[fieldName]).toBe("");

            });

          });

          describe('respects label configuration', function () {

            it('has attribute label', function () {

              var catId = 12345, grpIdx = 4, attIdx = 0, fieldName = "12345_6", groupName = "";
              expect(v1.options.data.metadata[grpIdx].label).toBeDefined();
              groupName = v1.options.data.metadata[grpIdx].label;

              expect(v1.options.data.metadata[grpIdx].attributes[attIdx].label).toBeDefined();
			        var label = v1.options.data.metadata[grpIdx].attributes[attIdx].label
              expect(v1.model.get('options').fields[groupName].fields[fieldName].label).toEqual(label);

            });

            it('has localized attribute label', function () {

              var catId = 12345, grpIdx = 4, attIdx = 1, fieldName = "12345_7", groupName = "";
              expect(v1.options.data.metadata[grpIdx].label).toBeDefined();
              groupName = v1.options.data.metadata[grpIdx].label;

              expect(v1.options.data.metadata[grpIdx].attributes[attIdx].label).toBeDefined();
              var label = v1.options.data.metadata[grpIdx].attributes[attIdx].label.en;
              expect(v1.model.get('options').fields[groupName].fields[fieldName].label).toEqual(label);

            });

          });

          describe('respects section configuration', function () {

            it('allows multiple sections', function () {
              var grpCnt = 0;
              $.each(v1.options.data.metadata, function (index, value) {
                if (value.type === "group") {
                  grpCnt++;
                }
              });
              expect(grpCnt).toBeGreaterThan(1);
              $.each(v1.model.get("data"), function (index, value) {
                if (typeof value === "object") {
                  grpCnt--;
                }
              });
              expect(grpCnt).toEqual(0);

            });

            it('has section title', function () {

              var grpIdx = 5, grpName = "";
              expect(v1.options.data.metadata[grpIdx].label).toBeDefined();
              grpName = v1.options.data.metadata[grpIdx].label;

              expect(v1.options.data.metadata[grpIdx].label).toBeDefined();
              var label = v1.options.data.metadata[grpIdx].label;
              expect(v1.model.get("options").fields[grpName].label).toEqual(label);

            });

            xit('has localized section title', function () {

              var grpIdx = 4, grpName = "";
              expect(v1.options.data.metadata[grpIdx].label).toBeDefined();
              grpName = BaseUtils.getClosestLocalizedString(v1.options.data.metadata[grpIdx].label);

              expect(v1.options.data.metadata[grpIdx].label).toBeDefined();
			        var label = v1.options.data.metadata[grpIdx].label.en;
              expect(v1.model.get("options").fields[grpName].label).toEqual(label);

            });

          });

          describe('respects read-only configuration', function () {

            it('has writable item', function () {

              var attIdx = 0, fieldName = "12345_1";
              expect(v1.options.data.metadata[attIdx].readOnly).toBeFalsy();
              expect(v1.model.get('schema').properties[fieldName].readonly).toBeFalsy();
            });

            it('has read-only item', function () {

              var attIdx = 1, fieldName = "12345_2";
              expect(v1.options.data.metadata[attIdx].readOnly).toBeTruthy();
              expect(v1.model.get('schema').properties[fieldName].readonly).toBeTruthy();

            });

          });

          it('TODO: allows multiple widget instances', function () {

          });

          it('TODO: allows attributes from different categories', function () {

          });

          it('TODO: supports vertical scrolling', function () {

          });

        });

      });

    });

  });

  describe('MetadataSample', function(){

    var regionEl;
    var contentRegion;
    var pageContext

    function testsetup(done) {

      regionEl = undefined;
      contentRegion = undefined;
      pageContext = undefined;

      MetadataMock.enable();

      $('body').empty();
      regionEl = $('<div style="width:1264px; height:632px;"></div>').appendTo(document.body);
      contentRegion = new Marionette.Region({ el: regionEl });

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
                  attributes: {id: 19500}
              }
          }
      });

      var perspectiveConfig = {
          "header": {
              "widget": {
                  "type": "conws/widgets/header",
                  "options": {
                      "workspace": {
                          "properties": {
                              "title": "{name}",
                              "type": "{business_properties.workspace_type_name}",
                              "description": "{categories.12346_3} {categories.12346_1}. {categories.12346_2}",
                              "info": "{categories.12346_3}.\n\nValid from: {categories.12346_1}\nValid to: {categories.12346_2}"
                          }
                      }
                  }
              }
          },
          "tabs": [
              {
                  "title": "Info",
                  "columns": [
                      {
                          "sizes": {
                              "sm": 6,
                              "md": 5,
                              "lg": 3
                          },
                          "widget": {
                              "type": "conws/widgets/metadata",
                              "options": Widget1Options.content
                          }
                      },
                      {
                          "sizes": {
                              "sm": 6,
                              "md": 5,
                              "lg": 3
                          },
                          "widget": {
                              "type": "conws/widgets/metadata",
                              "options": Widget2Options.content
                          }
                      },
                      {
                          "sizes": {
                              "sm": 6,
                              "md": 5,
                              "lg": 3
                          },
                          "widget": {
                              "type": "conws/widgets/metadata",
                              "options": Widget3Options.content
                          }
                      },
                      {
                          "sizes": {
                              "sm": 6,
                              "md": 5,
                              "lg": 3
                          },
                          "widget": {
                              "type": "conws/widgets/metadata",
                              "options": Widget4Options.content
                          }
                      }
                  ]
              }
          ]
      };

      var perspectiveView = new TabbedPerspectiveView(_.defaults({context: pageContext}, perspectiveConfig));
      perspectiveView.widgetsResolved.always(function () {
          contentRegion.show(perspectiveView);
          pageContext.fetch().then(done,done.fail);
      });

    }

    function teardown(done) {
      MetadataMock.disable();
      contentRegion.destroy();
      regionEl.remove();
      $('body').empty();
      done();
    }

    beforeAll(function (done) {

      testsetup(done);

    });

    afterAll(function (done) {

      teardown(done);

    });

    describe("displays Header",function(){

      beforeAll(function(done){
        TestUtils.waitFor(function(){
          return TestUtils.isElementVisible($(".conws-header-title")[0]);
        },"header to appear").then(done,done.fail);
      })

      it("contains Header metadata",function(done){
        var text = $(".conws-header-metadata").text().trim().replace(/\s*[\r\n\f\v]\s*/g,"|");
        expect(text).toEqual("Equipment Roller Support Stand|Copy link|Mail as link|Equipment|Personal Tablet Computer 10002345. Computer");
        done();
      });


    });

    describe("displays Info tab",function(){

      beforeAll(function(done){
        TestUtils.waitFor(function(){
          return TestUtils.isElementVisible($('[title="Info"].cs-tablink')[0]);
        },"info tab to appear").then(done,done.fail);
      })

      describe("displays Overview tile",function(){

        var tileHeader, tileForms, tileText;

        beforeAll(function(done){
          TestUtils.waitFor(function(){
            tileHeader = $('.conws-metadata .tile-header .csui-heading:contains("Overview")');
            tileForms = tileHeader.closest('.tile-header').siblings('.tile-content').find('.cs-form');
            tileText = tileForms.text().trim().replace(/\s*[\r\n\f\v]\s*/g,"|");
            return tileText!=="";
          },"Overview tile to appear").then(done,done.fail);
        })

        it("contains Overview metadata",function(done){
          expect(tileText).toEqual("Name|Microsoft|Country|US|Model No.|Surface3|Construction Data|Year of Construction|2014|Month of Construction|8|Model Data|Model No.|Surface3");
          done();
        });

      })

      describe("displays Information 1 tile",function(){

        var tileHeader, tileForms, tileText;

        beforeAll(function(done){
          TestUtils.waitFor(function(){
            tileHeader = $('.conws-metadata .tile-header .csui-heading:contains("Information 1")');
            tileForms = tileHeader.closest('.tile-header').siblings('.tile-content').find('.cs-form');
            tileText = tileForms.text().trim().replace(/\s*[\r\n\f\v]\s*/g,"|");
            return tileText!=="";
          },"Information 1 tile to appear").then(done,done.fail);
        })

        it("contains Information 1 metadata",function(done){
          expect(tileText).toEqual("Name|Microsoft|Country|US|Model Number|Surface3|Part Number|Add text|Serial Number|Add text|Construction Year|2014|Construction Month|8");
          done();
        });

      });

    });

    describe("displays Information 2 tile",function(){

      var tileHeader, tileForms, tileText;

      beforeAll(function(done){
        TestUtils.waitFor(function(){
          tileHeader = $('.conws-metadata .tile-header .csui-heading:contains("Information 2")');
          tileForms = tileHeader.closest('.tile-header').siblings('.tile-content').find('.cs-form');
          tileText = tileForms.text().trim().replace(/\s*[\r\n\f\v]\s*/g,"|");
          return tileText!=="";
        },"Information 2 tile to appear").then(done,done.fail);
      })

      it("contains Information 2 metadata",function(done){
        expect(tileText).toEqual("Company Code|MS|Business Area|Hardware|Location|Street|Waldstrasse|City|Munich|Postal Code|81234");
        done();
      });

    });

    describe("displays Information 3 tile",function(){

      var tileHeader, tileForms, tileText;

      beforeAll(function(done){
        TestUtils.waitFor(function(){
          tileHeader = $('.conws-metadata .tile-header .csui-heading:contains("Information 3")');
          tileForms = tileHeader.closest('.tile-header').siblings('.tile-content').find('.cs-form');
          tileText = tileForms.text().trim().replace(/\s*[\r\n\f\v]\s*/g,"|");
          return tileText!=="";
        },"Information 3 tile to appear").then(done,done.fail);
      })

      it("contains Information 3 metadata",function(done){
        expect(tileText).toEqual("Equipment Number|10002345|Category|Computer|Description|Personal Tablet Computer|Status|No value");
        done();
      });

    });
});

});
