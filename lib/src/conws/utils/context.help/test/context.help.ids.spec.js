/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/node',
  'csui/utils/contexts/factories/application.scope.factory',
  'conws/utils/context.help/context.help.ids'
], function (
  PageContext,
  NodeModelFactory,
  ApplicationScopeModelFactory,
  ConwsContextHelpIds
) {

  describe('ConwsContextHelpIdsTest', function () {

    var pageContext;
    var nodeModel;
    var applicationScope;
    var result;

    function testsetup(type) {

      pageContext = new PageContext({
        factories: {
          connector: {
            assignTo: function assignTo(what) {
              what && (what.connector = this);
            },
            connection: {
              url: '//server/otcs/cs/api/v1',
              supportPath: '/support',
              session: {
                ticket: 'dummy'
              }
            }
          },
          node: {
            get: function (key) {
              return this.attributes[key];
            },
            attributes: {
              id: 2121212,
              type: type,
              volume_id: 1212121
            }
          }
        }
      });

      nodeModel = pageContext.getModel(NodeModelFactory);
      applicationScope = pageContext.getModel(ApplicationScopeModelFactory);
      applicationScope.set("id","node");
    }

    it('in a workspace is enabled', function (done) {

      testsetup(848);
      nodeModel.set("data", { bwsinfo: {id: nodeModel.get("id")} });
      result = ConwsContextHelpIds[0].decides({ context: pageContext });
      expect(result).toEqual(true,'decides to true');
      done();

    });

    it('in a workspace subfolder is enabled', function (done) {

      testsetup(0);
      nodeModel.set("data", { bwsinfo: {id: nodeModel.get("volume_id")} });
      result = ConwsContextHelpIds[0].decides({ context: pageContext });
      expect(result).toEqual(true,'decides to true');
      done();

    });

    it('outside a workspace is disabled', function (done) {

      testsetup(0);
      nodeModel.set("data", { bwsinfo: {id: null} });
      result = ConwsContextHelpIds[0].decides({ context: pageContext });
      expect(result).toEqual(false,'decides to false');
      done();

    });

  });

});
