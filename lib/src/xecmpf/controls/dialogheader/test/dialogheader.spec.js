/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery',
  'csui/lib/marionette',
  'xecmpf/controls/dialogheader/dialogheader.view'
], function ($, Marionette, DialogHeaderView) {

  var SampleTitleView = Marionette.ItemView.extend({
    template: false,
    className: 'title-name',

    constructor: function SampleTitleView() {
      Marionette.ItemView.prototype.constructor.apply(this, arguments);
    }

  });

  describe("DialogHeaderView", function () {
    var dialogHeaderView;
    var sampleTitleView;

    beforeAll(function (done) {
      sampleTitleView = new SampleTitleView();
      sampleTitleView.render();
      dialogHeaderView = new DialogHeaderView({
        centerView: sampleTitleView
      });
      dialogHeaderView.render();
      $('body').append(dialogHeaderView.$el);
      done();
    });

    it("can be instantiated", function () {
      expect(dialogHeaderView instanceof DialogHeaderView).toBeTruthy();
    });

    it("has left, center, right sections", function () {
      var el = dialogHeaderView.$el;

      var leftSection = el.find('.left-section');
      var centerSection = el.find('.center-section');
      var rightSection = el.find('.right-section');

      expect(leftSection.length).toBeGreaterThan(0);
      expect(centerSection.length).toBeGreaterThan(0);
      expect(rightSection.length).toBeGreaterThan(0);
    });

    it("has center section", function (done) {
      var el = dialogHeaderView.$el;

      var centerSection = el.find('.center-section');
      var name = centerSection.find('.title-name');

      expect(name.length).toBeGreaterThan(0);

      done();
    });

    afterAll(function (done) {
      sampleTitleView.destroy();
      dialogHeaderView.destroy();
      $('body').empty();
      done();
    });
  });

});
