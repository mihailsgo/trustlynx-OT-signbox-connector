/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/backbone', 'greet/controls/cells/hello/hello.view'
], function (Backbone, HelloView) {

  xdescribe('CellsHelloView', function () {

    describe('given a server connection with the person to greet', function () {
      var incompleteNode, seeableNode, modifiableNode, deletableNode;
      beforeEach(function () {
        incompleteNode = new Backbone.Model({
          id: 1,
          name: 'Incomplete'
        });
        seeableNode = new Backbone.Model({
          id: 2,
          name: 'Readable',
          perm_see: true,
          perm_modify: false,
          perm_delete: false
        });
        modifiableNode = new Backbone.Model({
          id: 5,
          name: 'Modifiable',
          perm_see: true,
          perm_modify: true,
          perm_delete: false
        });
        deletableNode = new Backbone.Model({
          id: 4,
          name: 'Modifiable',
          perm_see: true,
          perm_modify: true,
          perm_delete: true
        });
      });

      it('shows nothing for an incomplete node', function () {
        var helloView = new HelloView({
          model: incompleteNode
        });
        helloView.render();
        expect(helloView.$el.text()).toBe('');
      });

      it('shows "Readable" for an read-only node', function () {
        var helloView = new HelloView({
          model: seeableNode
        });
        helloView.render();
        expect(helloView.$el.text()).toBe('Readable');
      });

      it('shows "Readable" for an modifiable, but not deletable node', function () {
        var helloView = new HelloView({
          model: modifiableNode
        });
        helloView.render();
        expect(helloView.$el.text()).toBe('Readable');
      });

      it('shows "Editable" for an a deletable node', function () {
        var helloView = new HelloView({
          model: deletableNode
        });
        helloView.render();
        expect(helloView.$el.text()).toBe('Editable');
      });

    });

  });

});
