/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/backbone',
  'csui/lib/marionette',
  'csui/utils/contexts/page/page.context',
  'xecmpf/widgets/eac/impl/actionplan.details/actionplan.details.view',
  'xecmpf/widgets/eac/test/actionplan.mock',
  'csui/utils/testutils/async.test.utils'
],
  function ($, _, Backbone, Marionette, PageContext, ActionPlanDetailsView, mock, TestUtils) {
    describe('Action plan details view', function () {
      var actionPlanDetailsView,
        mockInst;
      beforeAll(function () {
        mockInst = mock();
        mockInst.enable();
        var mockModel = new Backbone.Model({ 'event_id': 'com.successfactors.Employment.AssignmentInformation.Hire', 'event_name': 'ChangeInTitle', 'namespace': 'SuccessFactors', 'action_plan_count': 1, 'action_plans': [{ 'run_as_key': '18206', 'run_as_value': 'jbaker', 'process_mode': 'Synchronously', 'rules': [{ 'position': 1, 'operand': 'perPersonUuid', 'operator': 'Equal to', 'value': '2562', 'conjunction': 'And' }], 'actions': [{ 'position': 1, 'action_key': 'DocGenEventAction.Generate Document', 'attribute_mappings': [{ 'action_attr_id': 443, 'position': 1, 'mapping_method': 'Event Property', 'mapping_data': 'seqNumber', 'action_attr_name': 'DocumentType' }, { 'action_attr_id': 444, 'position': 2, 'mapping_method': 'Event Property', 'mapping_data': 'personIdExternal', 'action_attr_name': 'UserId' }] }], 'plan_id': 37, 'rule_id': 37 }], 'enableActionPlanCount': true, 'eventIndexCount': 2, 'has_action_plan': 'true', 'hasMetadataRow': false, 'inactive': true }),
          mockContext = new PageContext({
            factories: {
              connector: {
                connection: {
                  url: 'http://server/otcs/cs/api/v1/',
                  supportPath: '/support',
                  session: {
                    ticket: 'dummy'
                  }
                }
              },
              node: {
                attributes: { id: 18750, type: 848 }
              }
            }
          }),
          $body = $('body'),
          contentRegion;

        $body.append('<div id="sample-region"></div>');

        actionPlanDetailsView = new ActionPlanDetailsView({
          context: mockContext,
          model: mockModel,
          eventname: 'ChangeInTitle',
          namespace: 'SuccessFactors'
        });
        contentRegion = new Marionette.Region({ el: '#sample-region' });
        contentRegion.show(actionPlanDetailsView);
      });
      it('can be instantiated', function () {
        expect(actionPlanDetailsView).toBeDefined();
      });
      it('headerview should be instantiated in details view ', function (done) {
        TestUtils.asyncElement(actionPlanDetailsView.$el, '.xecmpf-actionplan-header').done(function (el) {
          expect(actionPlanDetailsView.headerView).toBeDefined();
          done();
        });
      });
      it('listview should be instantiated in details view ', function (done) {
        TestUtils.asyncElement(actionPlanDetailsView.$el, '.xecmpf-action-plan-list-rows').done(function (el) {
          expect(actionPlanDetailsView.actionPlanListView).toBeDefined();
          done();
        });
      });
      it('updateContentView should set content view', function (done) {
        TestUtils.asyncElement(actionPlanDetailsView.$el, '.xecmpf-action-plan-list-rows').done(function (el) {
          actionPlanDetailsView.setActionPlanTabbedView(new Backbone.Model({"rules":[{}],"actions":[{"action":"DocGenEventAction.Generate Document","DocGenEventAction.Generate Document_fields":{"actionattributes":{"parametername":"Parameters","sourcelabel":"Source","valuelabel":"Value","key0":"DocumentType","key1":"UserId"},"DocumentType":{"actionattrname":"Document Type","source":"evtProp","evtProp_field":"Document Type"},"UserId":{"actionattrname":"Create document for","source":"evtProp","evtProp_field":"Document Type"}},"actionattrnameDocumentType":"Document Type","sourceDocumentType":"evtProp","evtProp_fieldDocumentType":"Document Type","actionattrnameUserId":"Create document for","sourceUserId":"evtProp","evtProp_fieldUserId":"Document Type"}],"summary":{"run_as":1000,"process_mode":"Asynchronously"},"gen_information":{"event_def_id":18750,"namespace":"Content Server","event_name":"Upload Document","rule_id":"","plan_id":47507},"mode":"Create","actionPlanName":"dscx","actionPlanId":47507,"eventDefinitionId":18750}),true);
          expect(actionPlanDetailsView.actionplanTabbedView).toBeDefined();
          done();
        });
      });
      it('isContentViewCanbeUpdated method should be resolved if tabbedView does not contain any changes', function (done) {
        actionPlanDetailsView.actionplanTabbedView.tabbedViewContainsChanges = false;
        actionPlanDetailsView.isContentViewCanbeUpdated().then(function () {
          done();
        })
      });
      afterAll(function () {
        mockInst.disable();
        TestUtils.cancelAllAsync();
        actionPlanDetailsView.destroy();
        TestUtils.restoreEnvironment();
      })
    });
  });