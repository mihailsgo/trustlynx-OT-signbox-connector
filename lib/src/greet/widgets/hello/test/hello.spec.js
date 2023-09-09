/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/utils/contexts/page/page.context',
  'greet/widgets/hello/hello.view', './hello.mock.js'
], function (PageContext, HelloView, HelloMock) {

  describe('WidgetHelloView', function () {

    beforeEach(function () {
      HelloMock.enable();
    });

    afterEach(function () {
      HelloMock.disable();
    });

    describe('given a server connection with the person to greet', function () {
      var context, helloView;
      beforeEach(function (done) {
        context = new PageContext({
          factories: {
            connector: {
              connection: {
                url: '//server/otcs/cs/api/v1',
                supportPath: '/support',
                session: {
                  ticket: 'dummy'
                }
              }
            }
          }
        });

        helloView = new HelloView({
          context: context
        });

        helloView.render();

        context
            .fetch()
            .done(done);
      }, 5000);

      it('creates a model with information about the person', function () {
        var model = helloView.model;
        expect(model).toBeDefined();
        var name = model.get('name');
        expect(name).toBe('jdoe');
      });

      it('marks the widget with the right CSS class', function () {
        expect(helloView.$el.hasClass('greet-hello')).toBeTruthy();
      });

      it('renders the greeting', function () {
        var innerText = helloView.$el.text();
        expect(innerText).not.toMatch(/Unnamed/);
      });

    });

  });

});
