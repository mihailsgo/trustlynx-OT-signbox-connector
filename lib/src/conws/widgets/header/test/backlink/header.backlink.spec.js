/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'csui/utils/contexts/factories/node',
  'conws/utils/test/testutil',
  'conws/widgets/header/header.view',
  'conws/widgets/header/impl/header.model',
  'conws/widgets/header/impl/header.icon.model',
  'conws/widgets/header/impl/editicon.view',
  'esoc/widgets/utils/commentdialog/commentdialog.view',
  './header.backlink.mock.js',
  'csui/utils/log',
  'csui/lib/jquery.simulate',
  'csui/lib/jquery.simulate.ext',
  'csui/lib/jquery.simulate.key-sequence'
], function ($, _,
  Marionette,
  PageContext, NodeModelFactory, TestUtil, HeaderView, HeaderModel, HeaderIconModel,
  EditIconView, CommentDialogView, MockData, log) {

  function historyEntry(values) {
    var result = {
      'router': values.router||'Node',
      'back_to_title': values.title||'',
      'urlParam': undefined,
      'fragment': '',
      'scopeId': '',
      'navigateOptions': undefined,
      'state': {},
      'sessionState': _.pick(values,'id','wkspid'),
      'defaultState': {}
    };
    if (result.router==='Node') {
      _.extend(result,{
        'back_to_title': values.title || 'Node'+values.id,
        'fragment': 'nodes/'+values.id,
        'scopeId': 'node'
      });
    } else if (result.router==='Landing') {
      _.extend(result,{
        'back_to_title': values.title || 'Home'
      });
    }
    return result;
  }
  function mockViewState(viewState,history,potential,current) {

    viewState._currentHistoryEntry = potential ? historyEntry(potential) : undefined;
    if (history && history.length>0) {
      history = _.map(history,historyEntry);
      if (viewState._navigationHistory) {
        viewState._navigationHistory.splice.apply(viewState._navigationHistory,[0,viewState._navigationHistory.length].concat(history));
      } else {
        viewState._navigationHistory = history;
        viewState.attributes[viewState.CONSTANTS.NAVIGATION_HISTORY_ARRAY] = history;
      }
    } else {
      if (viewState._navigationHistory && viewState._navigationHistory.length>0) {
        viewState._navigationHistory.splice(0,viewState._navigationHistory.length);
      }
    }
    viewState.attributes[viewState.CONSTANTS.SESSION_STATE] = _.pick(current,'id','wkspid');
  }

  describe('HeaderViewBackLinkTest', function () {

    var regionEl;
    var resultsRegion;
    var testContext;
    var headerView;
    var viewState;

    beforeAll(function (done) {
      $.mockjax.clear(); // to be sure, no mock data relict from previous test spec can affect our tests 
      MockData.enable();

      $('body').empty();
      regionEl = $('<div style="width:1000px; height:200px;"></div>').appendTo(document.body);
      resultsRegion = new Marionette.Region({
        el: regionEl
      });
      testContext = undefined;
      headerView = undefined;
      viewState = undefined;
      testContext = new PageContext({
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
              id: 12345,
              type: 848
            }
          }
        }
      });
      viewState = testContext.viewStateModel;
      var viewOptions = {
        context: testContext,
        data: {}
      };
      viewOptions.data = {
        workspace: {
          properties: {
            icon: "{categories.20368_2}",
            title: "{name}",
            type: "{workspace_type_name}",
            description: "{categories.23228_18_1_19} {categories.23228_18_1_21}\n" +
                          "{categories.23228_2_1_8.value}"
          }
        },
        widget: {
          type: "src/widgets/header/test/controls/feeds.mock",
          options: {
            x: "y"
          }
        }
      };
      headerView = new HeaderView(viewOptions);

      headerView.model.fetch().then(function(){
        resultsRegion.show(headerView);
        done();
      },done.fail);

    });

    afterAll(function (done) {
      done();
    });

    it('header view renders correctly', function (done) {
      expect(headerView.$('div .conws-header-edit > div').length).toBe(2);
      expect(headerView.$('div .header-image > img').attr('src').match('image.png')).toBeTruthy();
      expect(headerView.$('div .header-editor > span').length).toBe(1);
      expect(headerView.$('div .conws-header-title > h1').length).toBe(1);
      expect(headerView.$('div .conws-header-title > h1').html()).toBe(
          'Equipment Roller Support Stand');
      expect(headerView.$('div .conws-header-type > p').length).toBe(1);
      expect(headerView.$('div .conws-header-type > p').html()).toBe('Equipment');
      expect(headerView.$('div .conws-header-desc .conws-description > span').length).toBe(1);
      expect(headerView.$('div .conws-header-desc .conws-description > span').html()).toBe(
          'Bosch PTA 1000\nThe flexible PTA 1000. Perfect support when sawing large workpieces');
      expect(headerView.$('div #conws-header-childview').length).toBe(1);
      expect(headerView.$('div .conws-header-toolbar li[id^="Comment"]').length).toBe(1);
      expect(headerView.$('div .conws-header-toolbar .conws-rightToolbar li[id^="Favorite"]').length).toBe(1);
      expect(headerView.$('.conws-header-wrapper .conws-header-toolbar .conws-rightToolbar li[id^="Favorite"] button')
        .hasClass('csui-favorite-star')).toBeTruthy();
      expect(headerView.$('.conws-header-wrapper .conws-header-toolbar .conws-rightToolbar li[id^="Favorite"] button')
        .hasClass('selected')).toBeFalsy();

      done();
    });

    it('History: -, Potential: -, Current: Workspace', function(done) {

      mockViewState(viewState, undefined, undefined, {id:12345,wkspid:12345});
      headerView.render();
      expect(headerView.$('.conws-header-navitem').length).toBe(0);
      done();

    });

    it('History: Landing, Potential: -, Current: Workspace', function(done) {

      mockViewState(viewState, [{'router':'Landing'}], undefined, {id:12345,wkspid:12345});
      headerView.render();
      expect(headerView.$('.conws-header-navitem').length).toBe(0);
      done();

    });

    it('History: -, Potential: Node, Current: Workspace', function(done) {

      mockViewState(viewState, undefined, {id:10001,wkspid:0}, {id:12345,wkspid:12345});
      headerView.render();
      expect(headerView.$('.conws-header-navitem .conws-header-navicon').length).toBe(1);
      expect(headerView.$('.conws-header-navitem .conws-header-navtext').text().trim()).toEqual("Node10001");
      done();

    });

    it('History: Node, Potential: -, Current: Workspace', function(done) {

      mockViewState(viewState, [{id:10002,wkspid:0}], undefined, {id:12345,wkspid:12345});
      headerView.render();
      expect(headerView.$('.conws-header-navitem .conws-header-navicon').length).toBe(1);
      expect(headerView.$('.conws-header-navitem .conws-header-navtext').text().trim()).toEqual("Node10002");
      done();

    });

    it('History: Node > Workspace, Potential: -, Current: Node', function(done) {

      mockViewState(viewState, [{id:10003,wkspid:0},{id:12345,wkspid:12345}], undefined, {id:12346,wkspid:12345});
      headerView.render();
      expect(headerView.$('.conws-header-navitem .conws-header-navicon').length).toBe(1);
      expect(headerView.$('.conws-header-navitem .conws-header-navtext').text().trim()).toEqual("Node10003");
      done();

    });

  });
});
