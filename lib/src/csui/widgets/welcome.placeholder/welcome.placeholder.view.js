/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/marionette',
  'csui/utils/base',
  'csui/utils/contexts/factories/user',
  'csui/utils/types/date',
  'csui/behaviors/keyboard.navigation/tabable.region.behavior',
  'csui/widgets/welcome.placeholder/impl/welcome.video/welcome.video.view',
  'i18n!csui/widgets/welcome.placeholder/impl/nls/lang',
  'hbs!csui/widgets/welcome.placeholder/impl/welcome.placeholder',
  'css!csui/widgets/welcome.placeholder/impl/welcome.placeholder'
], function ($,
    _,
    Marionette,
    base,
    UserModelFactory,
    DateType,
    TabableRegionBehavior,
    WelcomeVideo,
    lang,
    placeholderTemplate) {

  var WelcomeView = Marionette.ItemView.extend({

    _dataDefaults: {
      includeMessage: true,
      includeVideo: true,
      message: lang.message
    },

    className: 'tile hero',

    template: placeholderTemplate,

    ui: {
      welcomeMessageContainer: '> .csui-hero-tile .csui-message',
      welcomeMessage: '> .csui-hero-tile .csui-message > p',
      greetingsMessage: '> .csui-hero-tile .csui-hero-left .csui-greeting'
    },

    behaviors: {
      TabableRegion: {
        behaviorClass: TabableRegionBehavior
      }
    },

    triggers: {
      'click .csui-hero-tile': 'show:video'
    },

    templateHelpers: function () {
      var optionsData = this.options.data,
          firstName   = this.user.get('first_name'),
          date        = new Date(),
          hour        = date.getHours(),
          greeting    = this._getGreeting(firstName, hour);

      return {
        videoSrc: optionsData.videoSrc,
        videoPoster: optionsData.videoPoster,
        includeMessage: optionsData.includeMessage,
        includeVideo: optionsData.includeVideo,
        greeting: greeting,
        message: optionsData.message,
        videoLabel: lang.videoLabel,
        date: DateType.formatExactDate(DateType.deserializeDate(date))
      };
    },

    events: {"keydown": "onKeyInView"},

    currentlyFocusedElement: function () {
      return this.$el;
    },

    onKeyInView: function (event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        this.triggerMethod("show:video");
      }
    },

    constructor: function WelcomeView(options) {
      options || (options = {});
      options.data || (options.data = {});
      _.each(this._dataDefaults, function(value,key){
        var serverValue = options.data[key];
        if (serverValue == null || serverValue === ''){
          options.data[key] = value;
        }
      });
      Marionette.ItemView.call(this, options);
      this.user = options.context.getModel(UserModelFactory);
      this.listenTo(this.user, 'change', this._updateGreeting);
      $(window).on("resize.app", this.render);
      this.listenTo(this, 'dom:refresh', this._setTextEllipse);
    },

    onRender: function() {
      var helpers = this.templateHelpers();
      if (helpers.includeVideo) {
        this.$el.attr('aria-label', helpers.greeting + " " + helpers.videoLabel);
      }
    },

    onDestroy: function () {
      $(window).off("resize.app", this.render);
    },

    onShowVideo: function () {
      var welcomeVideo = new WelcomeVideo(this.options);
      welcomeVideo.show();
    },

    _setTextEllipse: function () {
      var welcomeMessage  = this.ui.welcomeMessage,
          containerHeight = this.ui.welcomeMessageContainer.height(),
          lineHeight      = parseInt(welcomeMessage.css('line-height'), 10);

      if (lineHeight <= containerHeight) {
        while (welcomeMessage.outerHeight() > containerHeight) {
          var text = welcomeMessage.text();
          var shortenedText = text.replace(/\W*\s(\S)*$/, '...');
          if (shortenedText.length < text.length) {
            welcomeMessage.text(shortenedText);
          } else {
            break;
          }
        }
        this.ui.welcomeMessageContainer.removeClass('binf-hidden');
      }
      else {
        this.ui.welcomeMessageContainer.addClass('binf-hidden');
      }
    },

    _getGreeting: function(firstName, hour){
      return this._generateGreetingMessage(firstName, hour);
    },

    _updateGreeting: function(){      
      $(this.ui.greetingsMessage).text(this._generateGreetingMessage(this.user.get('first_name'), new Date().getHours()));
    },

    _generateGreetingMessage: function(firstName, hour){
      var greeting;
      if(firstName){
        greeting = hour < 12 ? lang.greetingMorning : hour < 18 ? lang.greetingAfternoon : lang.greetingEvening;
        greeting = _.str.sformat(greeting, firstName);
      }else{
        greeting = hour < 12 ? lang.greetingMorningNoName : hour < 18 ? lang.greetingAfternoonNoName : lang.greetingEveningNoName;
      }
      return greeting;
    }
  });

  return WelcomeView;

});