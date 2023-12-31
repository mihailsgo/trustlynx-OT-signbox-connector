csui.define(['csui/lib/underscore',
  'csui/controls/wizard/wizard.view',
  'csui/controls/mixins/layoutview.events.propagation/layoutview.events.propagation.mixin',
  'conws/controls/wizard/step/wizard.step.view',
  'css!conws/controls/wizard/impl/wizard'
], function (_, WizardView, LayoutViewEventsPropagationMixin, ConwsWizardStepView) {

  var ConwsWizardView = WizardView.extend({

    constructor: function ConwsWizardView(options) {
      options || (options = {});
      WizardView.prototype.constructor.apply(this, arguments);
    },

    // overriden and updated this function to call ConwsWizardStepView so as to customize the wizard step footer
    getCurrentView: function () {
      if (this.currentStep < this.stepViews.length) {
        return this.stepViews[this.currentStep];
      } else {
        var stepNum = this.currentStep;
        var view = new ConwsWizardStepView(_.extend(this.options.steps[stepNum],
          { wizard: this, isFirstStep: this.isFirstStep(), isLastStep: this.isLastStep() }));
        this.stepViews.push(view);
        this.listenTo(view, 'next:clicked', this.nextStep)
          .listenTo(view, 'previous:clicked', this.prevStep)
          .listenTo(view, 'done:clicked', this.save)
          .listenTo(view, 'close:wizard', this.closeWizard);
        return view;
      }
    },

    showCurrentView: function () {
      //TODO: uncomment below line to get the steps in slide transition
      //this.addDirection();
      this.currentView.$el.removeClass('binf-hidden');
      this.currentView.triggerMethod('set:initial:focus');
    }
  });

  _.extend(ConwsWizardView.prototype, LayoutViewEventsPropagationMixin);

  return ConwsWizardView;

});