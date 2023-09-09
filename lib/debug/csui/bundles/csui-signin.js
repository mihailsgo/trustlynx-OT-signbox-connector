
/* START_TEMPLATE */
csui.define('hbs!csui/controls/signin/impl/signin',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"login-container\">\r\n  <div class=\"login-controls\">\r\n    <div class=\"branding\"><span role=\"presentation\" class=\"ot-logo\">&nbsp;</span></div>\r\n    <div class=\"login-error\" id=\"loginError\"></div>\r\n    <div class=\"login-form-wrapper\">\r\n      <form>\r\n        <div class=\"binf-form-group binf-has-feedback\">\r\n          <div class=\"col-md-20\">\r\n            <input id=\"inputUsername\" type=\"text\" class=\"binf-form-control binf-input-lg textbox hasclear\"\r\n                   placeholder=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"placeholderusername") || (depth0 != null ? lookupProperty(depth0,"placeholderusername") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"placeholderusername","hash":{},"loc":{"start":{"line":10,"column":32},"end":{"line":10,"column":55}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"userNameAria") || (depth0 != null ? lookupProperty(depth0,"userNameAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"userNameAria","hash":{},"loc":{"start":{"line":10,"column":69},"end":{"line":10,"column":85}}}) : helper)))
    + "\">\r\n              <span id=\"usernameclearer\" class=\"clearer clear-icon binf-form-control-feedback\"></span>\r\n\r\n          </div>\r\n        </div>\r\n        <div class=\"binf-form-group binf-has-feedback\">\r\n          <div class=\"col-md-20\">\r\n            <input id=\"inputPassword\" type=\"password\"\r\n                   class=\"binf-form-control binf-input-lg textbox hasclear\"\r\n                   placeholder=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"placeholderpassword") || (depth0 != null ? lookupProperty(depth0,"placeholderpassword") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"placeholderpassword","hash":{},"loc":{"start":{"line":19,"column":32},"end":{"line":19,"column":55}}}) : helper)))
    + "\" aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"passwordAria") || (depth0 != null ? lookupProperty(depth0,"passwordAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"passwordAria","hash":{},"loc":{"start":{"line":19,"column":69},"end":{"line":19,"column":85}}}) : helper)))
    + "\">\r\n              <span id=\"passwordclearer\" class=\"clearer clear-icon binf-form-control-feedback\"></span>\r\n          </div>\r\n        </div>\r\n        <button id=\"buttonSubmit\" type=\"button\" class=\"login-btn\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"buttontext") || (depth0 != null ? lookupProperty(depth0,"buttontext") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"buttontext","hash":{},"loc":{"start":{"line":23,"column":66},"end":{"line":23,"column":80}}}) : helper)))
    + "</button>\r\n      </form>\r\n    </div>\r\n  </div>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_controls_signin_impl_signin', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/controls/signin/impl/nls/localized.strings',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/controls/signin/impl/nls/root/localized.strings',{
  signinButtonText: "Sign in",
  signinForgotPassword: "Forgot password?",
  signinPlaceholderUsername: "User name",
  usernameAria: 'Enter user name',
  signinPlaceholderPassword: "Password",
  passwordAria: 'Enter password',
  signinInvalidUsernameOrPassword: "You have entered an invalid user name or password. Please try again."
});



csui.define('css!csui/controls/signin/impl/css/signin',[],function(){});
csui.define('csui/controls/signin/signin.view',[
  'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/authenticators/basic.authenticator',
  'csui/utils/authenticators/credentials.authenticator',
  'csui/utils/contexts/page/page.context',
  'csui/utils/connector', 'csui/utils/contexts/factories/connector',
  'csui/lib/marionette', 'hbs!csui/controls/signin/impl/signin',
  'i18n!csui/controls/signin/impl/nls/localized.strings',
  'css!csui/controls/signin/impl/css/signin'
], function (module, _, $, BasicAuthenticator, CredentialsAuthenticator,
    PageContext, Connector, ConnectorFactory, Marionette, template, lang) {
  'use strict';

  var config = _.extend({
    useBasicAuthentication: false
  }, module.config());

  var SignInView = Marionette.ItemView.extend({
    constructor: function SignInView() {
      Marionette.ItemView.apply(this, arguments);
    },

    className: 'cs-signin',

    template: template,

    triggers: {
      'click button': 'click:button',
      //'click @ui.usernameclearer': 'click:usernameclearer',
      //'click @ui.passwordclearer': 'click:passwordclearer',
      'mousedown @ui.usernameclearer': 'click:usernameclearer',
      'mousedown @ui.passwordclearer': 'click:passwordclearer',
      'focus @ui.username': 'focus:username',
      'focus @ui.password': 'focus:password',
      'change @ui.password': 'change:password',
      'change @ui.username': 'change:username'
    },

    ui: {
      username: '#inputUsername',
      password: '#inputPassword',
      button: '#buttonSubmit',
      passwordclearer: '#passwordclearer',
      usernameclearer: '#usernameclearer',
      loginerror: '#loginError'
    },

    onRender: function () {
      this.ui.usernameclearer.toggle(false);
      this.ui.passwordclearer.toggle(false);
      //if (window.navigator.userAgent.indexOf("MSIE") === -1) {
        this.ui.username.prop('autofocus', true);
      //}
    },

    onClickPasswordclearer: function (event) {
      this.ui.password.val('').trigger('focus');
      this._unsetErrorStyle();
      this.ui.passwordclearer.hide();
    },

    onClickUsernameclearer: function (event) {
      this.ui.username.val('').trigger('focus');
      this._unsetErrorStyle();
      this.ui.usernameclearer.hide();
    },

    onFocusUsername: function () {
        this.validate();
    },

    onFocusPassword: function () {
        this.validate();
    },

    onChangeUsername: function () {
        this.validate();
    },

    onChangePassword: function () {
        this.validate();
    },

    templateHelpers: function () {
      return {
        buttontext: lang.signinButtonText,
        copyright: lang.signinCopyright,
        forgotpassword: lang.signinForgotPassword,
        placeholderusername: lang.signinPlaceholderUsername,
        usernameAria: lang.usernameAria,
        placeholderpassword: lang.signinPlaceholderPassword,
        passwordAria: lang.passwordAria
      };
    },

    events: {
      'keyup .binf-form-control': 'validate',
      'keydown button': 'onKeyPress'
    },

    onKeyPress: function (event) {
      var isButtonDisabled = this.ui.button.prop("disabled");

      // handle enter -> enable button
      if (!isButtonDisabled && event.which === 13) {
        this.ui.button.toggleClass('login-btn-enabled');
      }
    },

    validate: function (event) {
      this._unsetErrorStyle();

      var bIsUserNameSet = !!this.ui.username.val().length,
        bIsPasswordSet = true, //!!this.ui.password.val().length, // allow for empty pw
        bIsValidInput = bIsUserNameSet && bIsPasswordSet,
        bUserNameHasFocus = $(document.activeElement).is(this.ui.username),
        bPasswordHasFocus = $(document.activeElement).is(this.ui.password);

      // show/hide clearers
      this.ui.usernameclearer.toggle(bIsUserNameSet && bUserNameHasFocus);
      this.ui.passwordclearer.toggle(bIsPasswordSet && bPasswordHasFocus);

      // en/disable button
      this.ui.button.prop("disabled", !bIsValidInput);
      this.ui.button.toggleClass('login-btn-enabled', bIsValidInput);

      // submit on enter
      if (bIsValidInput && event && event.which === 13) {
        event.preventDefault();
        this.ui.button.trigger('click');
      }
    },

    onClickButton: function () {
      // disable button during login
      this.ui.button.toggleClass('login-btn-enabled', false);

      // Credentials always come from the form fields, while the rest
      // of the connection was specified in the constructor options
      var credentials = {
            username: this.ui.username.val(),
            password: this.ui.password.val()
          },
          useBasicAuthentication = config.useBasicAuthentication;

      if (!this.authenticator) {
        var connection = _.defaults({
              credentials: credentials
            }, this.options.connection),
            Authenticator = useBasicAuthentication ? BasicAuthenticator :
                            CredentialsAuthenticator,
            authenticator = new Authenticator({
              connection: connection
            }).on('loggedIn', _.bind(function () {
              this.ui.button.toggleClass('login-btn-enabled', true);
              this.trigger('success', {
                username: credentials.username,
                session: connection.session
              });
            }, this));
        this.authenticator = authenticator;
      }

      // authenticate
      var successHandler = _.bind(function () {
            // authentication succeeded -> update the shared connector used on the page
            var context = new PageContext(),
                connector = context.getObject(ConnectorFactory),
                session = this.authenticator.connection.session;
            connector.authenticator.updateAuthenticatedSession(session);
          }, this),
          errorHandler = _.bind(function (error, connection) {
            // authentication failed -> raise event, show error
            this.ui.button.toggleClass('login-btn-enabled', true);
            this._setErrorStyle();
            this.trigger('failure', {
              username: credentials.username,
              error: error
            });
          }, this);
      if (useBasicAuthentication) {
        this.authenticator.check({
          credentials: credentials,
        }, successHandler, errorHandler);
      } else {
        this.authenticator.login({
          data: credentials
        }, successHandler, errorHandler);
      }
    },

    _setErrorStyle: function () {
      this.ui.username.trigger('focus').trigger('select');
      this.ui.password.val('');
      this.ui.usernameclearer.toggle(true);
      this.ui.passwordclearer.toggle(true);
      this.ui.loginerror.html(lang.signinInvalidUsernameOrPassword);
      // TODO Force the error message through the screenreader

      this.$('.binf-form-group').addClass('binf-has-error');
      this.$('.clearer').removeClass('clear-icon').addClass('error-icon');
    },

    _unsetErrorStyle: function () {
      this.ui.loginerror.html('');
      this.$('.binf-form-group').removeClass('binf-has-error');
      this.$('.clearer').removeClass('error-icon').addClass('clear-icon');
    }
  });

  return SignInView;
});


/* START_TEMPLATE */
csui.define('hbs!csui/pages/signin/impl/signin.page',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"wrapper\">\r\n  <div id=\"signin\"></div>\r\n</div>\r\n<div class=\"footer\">\r\n  <span class=\"login-copyright\"></span>\r\n</div>\r\n";
}});
Handlebars.registerPartial('csui_pages_signin_impl_signin.page', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/pages/signin/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/pages/signin/impl/nls/root/lang',{
  copyrightMessage: "Copyright \u00A9 2018 Open Text SA or Open Text ULC (in Canada). All rights reserved."
});


csui.define('csui/utils/non-attaching.region/non-attaching.region',['csui/lib/marionette'], function (Marionette) {
  'use strict';

  var NonAttachingRegion = Marionette.Region.extend({

    constructor: function NonAttachingRegion(options) {
      Marionette.Region.prototype.constructor.apply(this, arguments);
    },

    attachHtml: function (view) {}

  });

  return NonAttachingRegion;

});


csui.define('css!csui/pages/signin/impl/signin.page',[],function(){});
// Places the sign-in form to the page body
csui.define('csui/pages/signin/signin.page.view',['module', 'csui/lib/underscore', 'csui/lib/jquery', 'csui/lib/marionette',
  'csui/utils/contexts/page/page.context', 'csui/utils/contexts/factories/connector',
  "csui/controls/signin/signin.view", 'hbs!csui/pages/signin/impl/signin.page',
  'i18n!csui/pages/signin/impl/nls/lang', "csui/utils/log", 'csui/utils/base',
  'csui/utils/non-attaching.region/non-attaching.region',
  'css!csui/pages/signin/impl/signin.page'
], function (module, _, $, Marionette, PageContext,
    ConnectorFactory, SignInView, pageTemplate, lang, log, base,
    NonAttachingRegion) {

  var config = _.extend({
    applicationPageUrl: 'index.html'
  }, module.config());

  var SignInPageView = Marionette.LayoutView.extend({

    template: pageTemplate,

    regions: {
      formRegion: '#signin'
    },

    ui: {
      copyright: '.login-copyright'
    },

    constructor: function SignInPageView(options) {
      options || (options = {});
      options.el = document.body;

      Marionette.LayoutView.prototype.constructor.call(this, options);

      // Namespace for binf widgets
      this.$el.addClass('binf-widgets');

      // Enable styling workarounds for Safari on iPad.  We might want to
      // put them to a separate CSS file loaded dynamically, instead of
      // having them in the same file identified by this class, if the size
      // of the workaround styles grows too much.
      if (base.isAppleMobile()) {
        this.$el.addClass('csui-on-ipad');
      }
      
      if (base.isIOSBrowser()) {
        this.$el.addClass('csui-on-macintosh');
      }
    },

    onRender: function () {
      var context = new PageContext(),
          connector = context.getObject(ConnectorFactory),
          control = new SignInView({
            connection: connector.connection
          });

      this.listenTo(control, 'failure', function (event) {
        log.warn("Login for user {0} failed: {1} ", event.username,
            event.error.statusText) && console.warn(log.last);
      });
      this.listenTo(control, 'success', function (event) {
        log.info("Login succeeded for user: ", event.username) && console.log(log.last);
        // Login redirects to the nextUrl parameter or to the configured
        // default application page
        var query = location.search.substring(1),
            nextUrl = /\bnextUrl(?:=([^&]+))?\b/i.exec(query),
            applicationPageUrl = nextUrl && decodeURIComponent(nextUrl[1]) ||
                                 this.options.applicationPageUrl ||
                                 config.applicationPageUrl;
        // Do not keep the nextUrl parameter in the application page URL
        query = query.replace(/\bnextUrl(?:=[^&]*)?/i, '').replace(/&$/, '');
        if (query) {
          applicationPageUrl += (applicationPageUrl.indexOf('?') > 0 ? '&' : '?') + query;
        }
        location.href = applicationPageUrl + location.hash;
      });

      this.formRegion.show(control);
      this.ui.copyright.html(lang.copyrightMessage);

      // Do not send showing events before triggering the first render event
      setTimeout(_.bind(function () {
        var bodyRegion = new NonAttachingRegion({el: this.el});
        bodyRegion.show(this, {render: false});
      }, this));
    }

  });

  return SignInPageView;

});

csui.define('csui/utils/authenticators/interactive.credentials.authenticator',[
  'require', 'module', 'csui/lib/underscore',
  'csui/utils/authenticators/request.authenticator'
], function (require, module, _, RequestAuthenticator) {
  'use strict';

  // Warns, that the developer did not specify any authentication ticket
  // or other header.  There is no interactive authentication in CS UI
  // Widgets.  Integrators have to authenticate, preferably by SSO.
  var InteractiveCredentialsAuthenticator = RequestAuthenticator.extend({
    interactive: function() {
      return true;
    },

    constructor: function InteractiveCredentialsAuthenticator(options) {
      RequestAuthenticator.prototype.constructor.call(this, options);
    },

    authenticate: function (options, succeeded, failed) {
      // Normalize input parameters, which are all optional.
      if (typeof options === 'function') {
        failed = succeeded;
        succeeded = options;
        options = undefined;
      }

      RequestAuthenticator.prototype.authenticate.call(this, options,
          succeeded, _.bind(this.openSignInDialog, this, succeeded));
    },

    openSignInDialog: function (succeeded) {
      if (this.reauthenticating) {
        return;
      }
      var self = this;
      self.reauthenticating = true;
      csui.require([
        'csui/utils/impl/signin.dialog/signin.dialog', 'csui/controls/progressblocker/blocker'
      ], function (SignInDialog, BlockingView) {
        var dialog = new SignInDialog({
          connection: self.connection
        });
        BlockingView.suppressAll();
        dialog.show()
              .done(function (args) {
                self.connection.session = args.session;
                self.reauthenticating = false;
                BlockingView.resumeAll();
                succeeded(self.connection);
              });
      });
    }
  });

  return InteractiveCredentialsAuthenticator;
});

csui.define('csui/utils/user.session/impl/nls/lang',{
    // Always load the root bundle for the default locale (en-us)
    "root": true,
    // Do not load English locale bundle provided by the root bundle
    "en-us": false,
    "en": false
  });
  
csui.define('csui/utils/user.session/impl/nls/root/lang',{

  errorTerminateSession: 'Terminating the session failed.',    
  errorContinueSession: 'Continuing the session failed.',

  errorHttpPrefix: 'HTTP'

});


csui.define('csui/utils/user.session/user.session',[
  'module',
  'require',
  'csui/lib/underscore',
  'csui/lib/jquery',
  'csui/utils/log',
  'csui/utils/url',
  'csui/utils/base',
  'i18n!csui/utils/user.session/impl/nls/lang'
  ], function (module, require, _, $, log, Url, base, lang) {
    'use strict';
    log = log(module.id);

    var singleton = function() {
      log.info("user.session: module.config is: " + JSON.stringify(module.config())) && console.log(log.last);
      var DEFAULT_KINDNESS_PERIOD = 30 * 1000;                // at least 30 sec kindness time needed for refresh-call with still valid ticket
      var DEFAULT_COOKIE_EXPIRATION_MODE = 1;                 // last request
      var DEFAULT_ENABLE_EXPIRATION_HANDLING = false;         // disabled
      var DEFAULT_SESSION_INACTIVITY_TIME = 30 * 60 * 1000;
      var DEFAULT_SESSION_REACTION_TIME = 3 * 60 * 1000;

      var config = _.extend({
            signInPageUrl: 'signin.html',       // only for development
            kindnessPeriod: DEFAULT_KINDNESS_PERIOD,
            cookieExpirationMode: DEFAULT_COOKIE_EXPIRATION_MODE,
            enableExpirationHandling: DEFAULT_ENABLE_EXPIRATION_HANDLING    
          }, module.config()),
          redirectEnabled = config.enableExpirationHandling == null ? DEFAULT_ENABLE_EXPIRATION_HANDLING : config.enableExpirationHandling,
          cookieExpirationMode = config.cookieExpirationMode == null ? DEFAULT_COOKIE_EXPIRATION_MODE : config.cookieExpirationMode,
          sessionInactivity = config.sessionInactivity == null ? DEFAULT_SESSION_INACTIVITY_TIME : config.sessionInactivity,
          sessionReactionTime = config.sessionReactionTime == null ? DEFAULT_SESSION_REACTION_TIME : config.sessionReactionTime,
          kindnessPeriod = config.kindnessPeriod == null ? DEFAULT_KINDNESS_PERIOD : config.kindnessPeriod,

          // CS provides 3 modes: 
          //     0 = never expires (no additional params available)
          //     1 = expire after last request
          //     2 = expire after last login
          isCookieExpirationEnabled   = (cookieExpirationMode > 0);

      // print the finally used config values
      var usedConfig = {
        enableExpirationHandling: redirectEnabled,
        cookieExpirationMode: cookieExpirationMode,          
        sessionInactivity: sessionInactivity,
        sessionReactionTime: sessionReactionTime,
        kindnessPeriod: kindnessPeriod
      };
      log.warn("user.session: used config: " + JSON.stringify(usedConfig)) && console.warn(log.last);


      var timerId;
      var expWarnDialog;
      var logoutInitiated = false;


      function getSessionReactionTime() {
        return sessionReactionTime;
      }

      function getSessionInactivity() {
        return sessionInactivity;
      }

      function isSessionExpirationEnabled() {
        return redirectEnabled;
      }

      function getCookieExpirationMode() {
        return cookieExpirationMode;
      }

      function currentDateUTC() {
        return (new Date()).toUTCString();
      }

      // returns the overall expiration time, used to correct wrong/missing values
      function _getOverallExpirationTime() {
        return getSessionInactivity() + getSessionReactionTime();
      }

      // Ensures that the 'expires' and 'serverDate' exists
      function _ensureExpiresTime(session) {
        if ( session ) {
          if (!session.expires || !session.serverDate) {
            var dat = new Date();
            session.serverDate = dat.toUTCString();
            session.expires = new Date(dat.getTime() + _getOverallExpirationTime()).toUTCString();          
            log.warn("user.session: _ensureExpiresTime: Adding 'serverDate' and 'expires' information to session (expires: " + session.expires + ").") && console.warn(log.last);
          } else if( new Date(session.expires).getTime() <= new Date(session.serverDate).getTime() ) {
            var dat2 = new Date();
            session.serverDate = dat2.toUTCString();
            session.expires = new Date(dat2.getTime() + _getOverallExpirationTime()).toUTCString();
            log.warn("user.session: _ensureExpiresTime: Provided 'serverDate' is newer or equal than 'expires' value, exceptionally replacing values (expires: " + session.expires + ").") && console.warn(log.last);
          }
        } else {
          log.error("user.session: _ensureExpiresTime: The provided argument 'session' is undefined!") && console.error(log.last);
        }
      }

      // Returns the expiration start time duration for the timer in seconds.
      // After the duration the ExpirationWarningDialog should be shown.
      function _calcExpirationStartTime(authenticator) {
        var session = authenticator.connection.session;
        var diffTime = 0;

        _ensureExpiresTime(session);

        if ( session && session.expires !== undefined && 
            (typeof session.expires === "string") && session.expires.length > 0 ) {

          var expireDate = new Date(session.expires);
          if (isNaN(expireDate.getTime())) { 
            expireDate = new Date(new Date().getTime() + _getOverallExpirationTime());
            log.info("user.session: _calcExpirationStartTime: Got unparseable date value for expires '" + session.expires + "', using fallback value '" + expireDate.toUTCString() + "'.") && console.log(log.last);
            session.expires = expireDate.toUTCString();
          }
          var expireTime = expireDate.getTime();
          expireTime -= kindnessPeriod;
          if (expireTime < 0) { expireTime = 0; }

          var currentDate = new Date(session.serverDate);
          if (isNaN(currentDate.getTime())) {
            currentDate = new Date();
            log.warn("user.session: _calcExpirationStartTime: Got unparseable date value for serverDate '" + session.serverDate + "', using fallback value '" + currentDate.toUTCString() + "'.") && console.warn(log.last);
            session.serverDate = currentDate.toUTCString();
          }
          var currentTime = currentDate.getTime();
          log.info("user.session: _calcExpirationStartTime: srvDate: " 
            + session.serverDate + ", expires: " + session.expires + " (Date: " + currentDateUTC() + ").") 
            && console.log(log.last);

          if ( currentTime >= expireTime ) {
            diffTime = 0;
          } else {
            diffTime = expireTime - currentTime;
          }
          diffTime /= 1000; // secs
        } else {
          log.error("user.session: _calcExpirationStartTime: The provided authenticator.connection.session has no expiration information.") && console.error(log.last);
          // if we want to allow this you can return e.g. 5 secs, within a REST-call with expiration information has to provide the start time
        }
        log.info("user.session: _calcExpirationStartTime: secs until expiration: " + diffTime) && console.log(log.last);
        return diffTime;
      }

      // helper if countdown of expiration warning dialog should be displayed
      function _shouldDisplayExpirationWarning() {
        if ( this.isSessionExpirationEnabled() === true && isCookieExpirationEnabled ) {
          // == 1 for only 'expire after last request'
          // > 0 for mode 1 and 2
          return ( this.getCookieExpirationMode() == 1 );
        } else {
          return false;
        }
      }

      // The authenticator.connection.session contains the 'ticket', 'serverDate' and 'expires' information.
      function updateSessionTicket(authenticator, request) {
        if (authenticator && authenticator.isAuthenticated()) {
          if (request && request.settings && request.settings.url) {
            var url = new Url(request.settings.url).getAbsolute().toLowerCase(),
                match = url.match(/^.*\/(api\/[^?]+)/);
            // Only REST API request handlers can supply a fresh ticket and
            // renew the expiration warning timeout. Custom handlers written
            // without the RESTAPIObject are not standardized and will not be
            // able to take part on the expiration warning feature.
            if (match) {
              var call = match[1];
              log.debug("user.session: updateSessionTicket: Resetting expiration timer based on call '" + call + "'.") && console.log(log.last);
              this.clearExpirationTimer();
              this._createExpirationTimer(authenticator);
            }
          } else {
            log.debug("user.session: updateSessionTicket: Resetting expiration timer based on unspecified call.") && console.log(log.last);
            this.clearExpirationTimer();
            this._createExpirationTimer(authenticator);
          }
        } else {
          log.warn("user.session: updateSessionTicket: Authenticator has to be 'authenticated' before updating session ticket!") && console.warn(log.last);
        }
      }
      
      function startExpirationTimer(authenticator) {
        if (authenticator && authenticator.isAuthenticated()) {
          log.debug("user.session: startExpirationTimer: Creating new expiration timer with provided authenticator...") && console.log(log.last);
          this.clearExpirationTimer();
          this._createExpirationTimer(authenticator);
        } else {
          console.warn("user.session: startExpirationTimer: Unable to start expiration timer, you have to provide an (still) authenticated 'authenticator'! Verify your parameter(s) for startExpirationTimer() function.");
        }
      }
      
      function clearExpirationTimer() {
        log.debug("user.session: clearExpirationTimer: called...") && console.log(log.last);
        if ( timerId ) {
          clearInterval(timerId);
          timerId = undefined;
        }
      }

      // doOnce is called inside this function just once, but with each invokation of this function
      // it can get called once.
      function _createExpirationTimer(authenticator) {
        var timer = _calcExpirationStartTime(authenticator);
        var self = this;
        var reactionTimeSecs = this.getSessionReactionTime()/1000;
        var doOnce = (function() {
          var executed = false;
          return function(curTimer) {
              if (!executed) {
                  executed = true;
          log.info("user.session: expirationTimer: current time for expiration warning count down: " + self.currentDateUTC()) && console.log(log.last);
                  self.displayExpirationWarning(authenticator, 
                    { startWithWarningContent: true, startTime: curTimer });
              }
          };
        })();

        timerId = setInterval(function () {
          if (--timer < reactionTimeSecs) {
            log.info("user.session: current expiration value: " + timer) && console.log(log.last);
            if ( timer >= 0 ) {
              // create dialog with separate timer, so upcoming REST-calls do not influence the timer;
              // an automatic logout is initiated as soon as the timer reached 0
              doOnce(timer);
            } else {
              self.clearExpirationTimer();
              log.info("user.session: expirationTimer: Switching to LoggedOut dialog content due to expired session...") && console.log(log.last);
              // trigger logout event on authenticator
              self.sendAuthenticatorEvent(authenticator);
              // show loggedOut content
              self.performSessionExpired(authenticator, false);
            }
          }
        }, 1000);
      }

      function stopExpirationWarningViewTimer(dialog) {
        if ( dialog ){
          log.debug("user.session: Sending event 'clear:timer' to dialog...") && console.log(log.last);
          dialog.triggerMethod('clear:timer', 'someValue');
        } else {
          log.debug("user.session: Skipping sending event 'clear:timer' to dialog, because dialog is already destroyed.") && console.log(log.last);
        }
      }

      function _showExpirationWarningDialog(authenticator, options) {
        var self = this;
        // we use here dynamical loading to allow the expiration warning dialog
        // to be in a different bundle than UserSession which gets required in authenticator
        csui.require([ 'csui/utils/expiration.warning/expiration.warning.dialog'
          ], function(ExpirationWarningDialog) {
            
            var dlgOptions = {
              userSession: self,
              authenticator: authenticator,
              startWithWarningContent: options.startWithWarningContent,
              startTime: options.startTime,
              clearExpirationTimer: function() {  // callback function to clear timer
                self.clearExpirationTimer();
              }
            };
            
            expWarnDialog = ExpirationWarningDialog.createExpirationWarningDialog(dlgOptions);

            ExpirationWarningDialog.showExpirationWarningDialog(expWarnDialog)          
            .always(function(result) {
              log.debug("user.session: _showExpirationWarningDialog: Expiration dialog was finished, setting internal dialog to undefined.") && console.log(log.last);
              expWarnDialog = undefined;
            });        

        });
      }

      // In case the remaining time is already lower than the sessionReactionTime when loading
      // the page then this function is called with each REST-call.
      // => there should be only one expiration warning dialog.
      function displayExpirationWarning(authenticator, options) {
        if ( expWarnDialog === undefined && this.isSessionExpirationEnabled() === true) {     // we want just one dialog
          if (options && options.startWithWarningContent === true) {
            if ( this._shouldDisplayExpirationWarning() ) {
              return this._showExpirationWarningDialog(authenticator, options);    
            }
          } else {
            // just loggedOut content for 2 (= after login) without countdown
            if ( isCookieExpirationEnabled ) {
              options = options || {};
              options.startWithWarningContent = false;
              return this._showExpirationWarningDialog(authenticator, options);
            }
          }        
        }
      }

      function redirectToTargetPage(authenticator) {
        log.debug("user.session: redirectToTargetPage: Called ...") && console.log(log.last);
        // At this point of time the session in authenticator is normally invalid or cleared.
        var cgiUrl = new Url(authenticator.connection.url).getCgiScript();
        var targetUrl = Url.appendQuery(cgiUrl, 'func=csui.redirecttotarget');

        // redirect to target
        location.href = targetUrl;
      }

      function performSessionExpired(authenticator, doRedirect) {
        var self = this;
        if (this.isSessionExpirationEnabled() === true) {
          if (!logoutInitiated) {
            logoutInitiated = true;
            log.debug("user.session: performSessionExpired: Initiating automatic logout ...") && console.log(log.last);
            // initiate automatic logout
            this.clearExpirationTimer();

            if (doRedirect === true) {
              // redirect without logout    
              log.info("user.session: performSessionExpired: Session expired, performing requested redirect (Date: " + this.currentDateUTC() + ").") && console.log(log.last);
              this.redirectToTargetPage(authenticator);
            } else {
              // perform signOut
              log.info("user.session: performSessionExpired: Session expired, performing signOut (Date: " + this.currentDateUTC() + ").") && console.log(log.last);
              this.signOut(authenticator, { onErrorRedirect: true, isSessionExpired: true })
              .done(function() {
                logoutInitiated = false;
                log.debug("user.session: performSessionExpired: Automatic logout requests successfully sent.") && console.log(log.last);
              })
              .fail(function() {
                logoutInitiated = false;
                log.info("user.session: performSessionExpired: Sending automatic logout requests returned error.") && console.log(log.last);
              })
              .always(function() {
                log.info("user.session: performSessionExpired: Sending automatic logout requests finished, spawning redirect timer.") && console.log(log.last);
                // the timer based on kindnessPeriod may last longer than the session is valid, 
                // but redirectToTargetPage() supports this
                var timerRedirectId = setTimeout(function () {
                  logoutInitiated = false;
                  if ( timerRedirectId ) {
                    clearTimeout(timerRedirectId);
                    timerRedirectId = undefined;
                  }
                  log.info("user.session: performSessionExpired: Redirecting to target page...'") && console.log(log.last);
                  self.redirectToTargetPage(authenticator);
                }, kindnessPeriod);
              });
            }

            // keep dialog on page to hide content
          } else {
            log.debug("user.session: performSessionExpired: A logout is already executed.") && console.log(log.last);
          }
        } else {
          log.debug("user.session: performSessionExpired: Skipping automatic logout due to disabled expiration handling.") && console.log(log.last);
          this.clearExpirationTimer();
        }
      }

      function continueSession(authenticator) {
        var self = this;
        var cgiUrl = new Url(authenticator.connection.url).getCgiScript();

        // performs 'GET auth' call
        var authUrl = Url.combine(cgiUrl, 'api/v1/auth');
        authenticator.makeAjaxCall({
          url: authUrl,
          headers: { 
              OTCSTicket: authenticator.connection.session.ticket
            },
          success: function (response, textStatus, request) {
              log.debug('Receiving request response from {0}.', authUrl) && console.log(log.last);
              response = authenticator.parseResponse(response, request);
              // update session and call indirectly updateSessionTicket
              authenticator.updateAuthenticatedSession(response, request);
            }
        })
        .done(function() {
          // the modal alert dialog handles destroy itself when you press a button
          // self._dialogViewDestroy(dialog);
          self.startExpirationTimer(authenticator);
          log.info("expiration.warning.dialog: Processed continue session (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
        })
        .fail(function(req) {            
          self.sendAuthenticatorEvent(authenticator, 'failedTicketRefresh');          
          // the error parameter is the request and the error-messages are in base.MessageHelper
          var errMsg = lang.errorContinueSession;
          var errDetails = new base.RequestErrorMessage(req);
          var errResponse = lang.errorHttpPrefix + ' ' + errDetails.statusCode + (errDetails.message?': ':'') + errDetails.message;
          log.error("expiration.warning.dialog: Processing continue session failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
          csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
            ModalAlert
              .showError(errMsg + '\n' + errResponse)
              .always(function () {
                self.redirectToTargetPage(authenticator);
              });
          });             
        });      
      }

      function sendAuthenticatorEvent(authenticator, reasonStr) {
        if (authenticator) {
          authenticator.trigger(reasonStr || 'loggedOut', { sender: authenticator });
        }
      }

      // The cmdData can contain optional flags:
      //   unauthenticateReason - user specified unauthenticateReason reason
      //   onErrorRedirect - if true, on error directly a redirect is performed 
      //                     otherwise a modal-error is displayed
      //   isSessionExpired - flag, if signOut-reason is an expired session (e.g. automatic logout)
      function signOut(authenticator, cmdData) {
        var deferred = $.Deferred();
        var self = this;
        cmdData || (cmdData = {});

        if (authenticator && authenticator.isAuthenticated()) {
          var cgiUrl = new Url(authenticator.connection.url).getCgiScript();

          csui.require(['csui/utils/routing',
                   'csui/utils/open.authenticated.page'
            ], function (routing, openAuthenticatedPage) {

            // Development HTML pages do not use the OTDS login page
            if (routing.routesWithSlashes()) {

              if (self.isSessionExpirationEnabled() === true) {

                if (authenticator && authenticator.makeAjaxCall && typeof authenticator.makeAjaxCall === 'function') {
                  // Invalidate the authenticated session, get the secure request token
                  // for the classic logout page and perform the logout by navigating there.
                  // Since csui.DoLogout is a ClassicUI call you have to provide a cookie.

                  // get secure request token
                  var tokenUrl = Url.combine(cgiUrl, 'api/v1/auth/logouttoken');
                  authenticator.makeAjaxCall({
                    url: tokenUrl,
                    headers: {
                      OTCSTicket: authenticator.connection.session.ticket
                    },
                    success: function (response, textStatus, request) {
                      log.debug('Receiving request response from {0}.', tokenUrl) && console.log(log.last);
                      response = authenticator.parseResponse(response, request);
                      // update session and call indirectly updateSessionTicket
                      authenticator.updateAuthenticatedSession(response, request);
                    }
                  }).then(function (response) {
                    // perform csui.DoLogout
                    var queryStr = 'func=csui.dologout&secureRequestToken=' + encodeURIComponent(response.token);
                    if (cmdData.isSessionExpired === true) {
                      // inform OTDS about expired session
                      queryStr += '&authcontext=sessionexpired';
                    }
                    var logoutFct = Url.appendQuery(cgiUrl, queryStr);
                    openAuthenticatedPage(authenticator.connection, logoutFct, {
                      openInNewTab: false
                    }).always(function() {
                      authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                      log.debug("user.session: signOut: The logout request was sent to server (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                      deferred.resolve();
                    });
                  }, function(req) {
                    // the error parameter is the request and the error-messages are in base.MessageHelper
                    var errMsg = lang.errorTerminateSession;
                    var errDetails = new base.RequestErrorMessage(req);
                    var errResponse = lang.errorHttpPrefix + ' ' + errDetails.statusCode + (errDetails.message?': ':'') + errDetails.message;
                    if (cmdData.onErrorRedirect === true) {
                      authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                      log.info("user.session: signOut: Terminate session was not successful, redirecting ... (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
                      self.redirectToTargetPage(authenticator);
                    } else {
                      log.error("user.session: signOut: Terminate session failed with an error (Date: " + self.currentDateUTC() + "). Error: " + errResponse + ".") && console.error(log.last);
                      csui.require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
                        ModalAlert
                          .showError(errMsg + '\n' + errResponse)
                          .always(function () {
                            authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                            // redirect without logout    
                            self.redirectToTargetPage(authenticator);
                          });                        
                      });
                    }
                    deferred.reject(req);     
                  });
                } else {
                  // we have no makeAjaxCall, so perform just redirect to target page
                  authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
                  log.debug("user.session: signOut: makeAjaxCall is not available, so performing redirect to target page (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                  self.redirectToTargetPage(authenticator);
                  deferred.resolve();
                }

              } else {
                // no session expiration warning enabled
                // let the authenticators do their work, do not unauthenticate since it clears the session

                log.debug("user.session: signOut: Session expiration handling is disabled, skipping logout (Date: " + self.currentDateUTC() + ").") && console.log(log.last);
                deferred.resolve();
              }

            } else {
              
              // This is used on the development pages.
              // Invalidate the authenticated session and navigate to the login page.
              authenticator.unauthenticate(cmdData.unauthenticateReason || {reason: 'logged-out'});
              var signInPageUrl = config.signInPageUrl,
                  query = location.search;
              query += query ? '&' : '?';
              query += 'nextUrl=' + encodeURIComponent(location.pathname);
              var logoutUrl = signInPageUrl + query + location.hash;
              log.debug("user.session: signOut: Performed unauthenticate with redirect to development signIn page.") && console.log(log.last);
              location.href = logoutUrl;

              deferred.resolve();
            }
          });   // require

        } else {
          // not authenticated
          log.info("user.session: signOut: Authenticator is not 'authenticated' anymore, just returning success.") && console.log(log.last);
          deferred.resolve();
        }

        return deferred.promise();
      }    



      return {
        // this can be used by everyone and specifies the authentication expiration
        // configuration
        getSessionReactionTime: getSessionReactionTime,
        getSessionInactivity: getSessionInactivity,
        isSessionExpirationEnabled: isSessionExpirationEnabled,
        getCookieExpirationMode: getCookieExpirationMode,
        currentDateUTC: currentDateUTC,

        // these are helpers which can be used
        signOut: signOut,
        continueSession: continueSession,
        redirectToTargetPage: redirectToTargetPage,

        // these internal functions are needed by the dialog and views,
        // you should avoid to call these functions directly
        updateSessionTicket: updateSessionTicket,
        startExpirationTimer: startExpirationTimer,
        displayExpirationWarning: displayExpirationWarning,
        performSessionExpired: performSessionExpired,      
        clearExpirationTimer: clearExpirationTimer,
        stopExpirationWarningViewTimer: stopExpirationWarningViewTimer,      
        sendAuthenticatorEvent: sendAuthenticatorEvent,    

        // private functions
        _createExpirationTimer: _createExpirationTimer,
        _shouldDisplayExpirationWarning: _shouldDisplayExpirationWarning,
        _showExpirationWarningDialog: _showExpirationWarningDialog
      };
    };

    return singleton();

  });
  

/* START_TEMPLATE */
csui.define('hbs!csui/utils/authenticators/impl/redirecting.form.authenticator',['module','hbs','nuc/lib/handlebars'], function( module, hbs, Handlebars ){ 
var t = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        "
    + ((stack1 = (lookupProperty(helpers,"icon-v2")||(depth0 && lookupProperty(depth0,"icon-v2"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"icon-v2","hash":{"on":(depth0 != null ? lookupProperty(depth0,"on") : depth0),"states":"true","iconName":(depth0 != null ? lookupProperty(depth0,"iconName") : depth0)},"loc":{"start":{"line":4,"column":8},"end":{"line":4,"column":59}}})) != null ? stack1 : "")
    + "        \r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <div class=\"icon circular "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"iconRight") || (depth0 != null ? lookupProperty(depth0,"iconRight") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"iconRight","hash":{},"loc":{"start":{"line":6,"column":34},"end":{"line":6,"column":47}}}) : helper)))
    + "\"></div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<button class=\"csui-signin-close csui-with-iframe\" title=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dialogCloseButtonTooltip") || (depth0 != null ? lookupProperty(depth0,"dialogCloseButtonTooltip") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dialogCloseButtonTooltip","hash":{},"loc":{"start":{"line":1,"column":58},"end":{"line":1,"column":86}}}) : helper)))
    + "\"\r\n    aria-label=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"dialogCloseAria") || (depth0 != null ? lookupProperty(depth0,"dialogCloseAria") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"dialogCloseAria","hash":{},"loc":{"start":{"line":2,"column":16},"end":{"line":2,"column":35}}}) : helper)))
    + "\">    \r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"iconName") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"loc":{"start":{"line":3,"column":4},"end":{"line":7,"column":11}}})) != null ? stack1 : "")
    + "</button>\r\n";
}});
Handlebars.registerPartial('csui_utils_authenticators_impl_redirecting.form.authenticator', t);
return t;
});
/* END_TEMPLATE */
;
csui.define('csui/utils/authenticators/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('csui/utils/authenticators/impl/nls/root/lang',{

  dialogCloseButtonTooltip: 'Close',
  dialogCloseButtonAria: 'Close sign in dialog'

});



csui.define('css!csui/utils/authenticators/impl/redirecting.form.authenticator',[],function(){});
csui.define('csui/utils/authenticators/redirecting.form.authenticator',[
  'require', 'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/lib/jquery', 'csui/utils/log',
  'csui/utils/authenticators/request.authenticator',
  'csui/utils/user.session/user.session',
  'hbs!csui/utils/authenticators/impl/redirecting.form.authenticator',
  'i18n!csui/utils/authenticators/impl/nls/lang',
  'css!csui/utils/authenticators/impl/redirecting.form.authenticator'
], function (require, module, _, Backbone, $, log, RequestAuthenticator, 
             UserSession, CloseButton, lang) {
  'use strict';
  log = log(module.id);

  var config                      = module.config(),
      authenticationIFrameTimeout = config.authenticationIFrameTimeout || 3000,
      showCloseButtonOnError      = config.showCloseButtonOnError;

  // Warns, that the developer did not specify any authentication ticket
  // or other header.  There is no interactive authentication in CS UI
  // Widgets.  Integrators have to authenticate, preferably by SSO.
  var RedirectingFormAuthenticator = RequestAuthenticator.extend({
    interactive: function() {      
      return false;      
    },

    constructor: function RedirectingFormAuthenticator(options) {
      RequestAuthenticator.prototype.constructor.call(this, options);
    },

    authenticate: function (options, succeeded, failed) {
      // Normalize input parameters, which are all optional.
      if (typeof options === 'function') {
        failed = succeeded;
        succeeded = options;
        options = undefined;
      }
      RequestAuthenticator.prototype.authenticate.call(this, options,
          succeeded, _.bind(this.initiateLoginSequence, this, succeeded, failed));
    },

    
    updateAuthenticatedSession: function (response, request) {
      // call the parent implementation
      RequestAuthenticator.prototype.updateAuthenticatedSession.call(this, response, request);

      if (this.connection.session && this.connection.session.ticket) {        
        // inform user session about updated ticket; in rare cases UserSession can be undefined 
        // if something went wrong in UserSession
        if ( UserSession ) {
          UserSession.updateSessionTicket(this, (request ? request : response));
        } else {
          log.info("redirecting.form.authenticator: updateAuthenticatedSession: UserSession is undefined, unable to updateSessionTicket in UserSession.") && console.log(log.last);
        }
      } else {
        log.error("redirecting.form.authenticator: updateAuthenticatedSession: Cannot get 'ticket' from just updated session, invalid request!") && console.error(log.last);
      }

    },

    unauthenticate: function (options) {
      var authen = this.isAuthenticated();
      if (authen && options && options.reason 
        && (options.reason === 'logged-out' || options.reason === 'expired') ) {
          if (UserSession && UserSession.isSessionExpirationEnabled() === true) {
            // Avoid popup of expiration warning dialog e.g. during ticket refresh.
            // Clear expiration timer.
            log.debug("redirecting.form.authenticator: unauthenticate: clearing expiration timer based on logged-out or expired.") && console.log(log.last);
            UserSession.clearExpirationTimer();
          }
      }
      // the parent clears the session and sends 'loggedOut'
      return RequestAuthenticator.prototype.unauthenticate.apply(this, arguments);
    },


    initiateLoginSequence: function (succeeded, failed) {
      // this method is trying to reauthenticate with OTDS in the background
      var self = this;
      var timer, dialog, urlOrigin;
      var skipFailedEvent = false;

      // the initiateLoginSequence is only called if the authenticate failed;
      if ( !isTruthy( self.getUserId() ) ) {
        showErrorMessage();
      } else {
        window.addEventListener('message', receiveMessage, false);
        createIFrame()
          .done(waitForLogin);
      }

      function showErrorMessage() {
        csui.require([
          'csui/controls/dialog/dialog.view',
          'csui/widgets/error.global/error.global.view'
        ], function (DialogView, ErrorGlobalView) {
          // wrong credentials is a programmer error and we must not translate this message
          var errorModel    = new Backbone.Model({
              message:  'The userId is undefined, the preceding authentication failed. Please initialize CSUI in a correct way.',
              hideNavigationButtons: true,
              showCloseButton: showCloseButtonOnError,
              errorCode: 401,
              showLogout: false
            }),
            errorGlobalView = new ErrorGlobalView({
              model: errorModel
            });

            var edialog = new DialogView({
              standardHeader: false,
              view: errorGlobalView,
              fullSize: true
            });
  
            edialog
              .on('destroy', handleDestroy)
              .on('childview:destroy', handleDestroy)
              .show();

            function handleDestroy() {
              reportFailedTicketRefresh();
              edialog.off('destroy', handleDestroy);
              edialog.off('childview:destroy', handleDestroy);
              // destroy the dialog and not just the view (but without receiving events again)
              edialog.destroy();
            }

          // get rid of rotating wheel
          suppressBlockingView();
        });
      }      

      function reportFailedTicketRefresh()  {
        if (skipFailedEvent === false && !self.isAuthenticated()) {
          log.warn("redirecting.form.authenticator: Sending 'failedTicketRefresh' event...") && console.log(log.last);
          self.trigger('failedTicketRefresh', { sender: self });
        }        
      }

      function createIFrame() {
        var deferred = $.Deferred();
        csui.require([
          'csui/lib/marionette', 
          'csui/controls/dialog/dialog.view',
          'csui/utils/url'          
        ], function (Marionette, DialogView, Url) {
          var src = Url.appendQuery(new Url(self.connection.url).getCgiScript(), 'func=csui.ticket');
          src = Url.appendQuery(src, 'userid=' + self.getUserId());
          urlOrigin = new Url(self.connection.url).getOrigin();

          var view = new Marionette.View({
            el: $('<iframe>', {
              width: '100%',
              height: '100%',
              src: src
            })
          });

          var ControlView = Marionette.ItemView.extend({

            ui: {
              closeButton: 'button.csui-signin-close'
            },

            templateHelpers: function () {
              return {
                dialogCloseButtonTooltip: lang.dialogCloseButtonTooltip,
                dialogCloseAria: lang.dialogCloseButtonAria,
                iconName: 'csui_action_close_white32',
                on: 'false'
              };
            },

            template: CloseButton,

            events: {
              'click @ui.closeButton': 'onButtonClick'
            },

            onButtonClick: function(event) {
              // use the matching implementation for destruction of the dialog from the parent
              dialog.onClickClose(event);
            }

          });

          dialog = new DialogView({
            className: 'csui-signin-close',
            standardHeader: false,
            view: view,
            fullSize: true,
            footerView: new ControlView()
          });
          view.render();

          //
          // Comment out code below because on a real server with SSO, it always fails.
          // The iframe load event is triggered 3 times:
          // - The first 2 times have undefined location. Thus, error is triggered.
          // - Only the third time has href pointing to the csui.ticket URL.
          //
          //view.el.addEventListener('load', function () {
          //  try {
          //    // If we cannot access the URL, the iframe was blocked by the content security policy.
          //    var href = !!this.contentWindow.location.href;
          //  } catch (error) {
          //    reportError(error);
          //  }
          //});
          dialog
            .on('destroy', function () {
              reportFailedTicketRefresh();
            })
            .show({render: false});

          dialog.$el.css({'z-index': '1061'});  // higher than popover
          dialog.$el.addClass('binf-hidden');
          deferred.resolve();
        }, deferred.reject);
        return deferred.promise();
      }

      function removeIFrame() {
        resumeBlockingView();
        // prevent failedTicketRefresh event from being triggered by destroy
        skipFailedEvent = true;
        dialog && dialog.destroy();
        skipFailedEvent = false;
      }

      function suppressBlockingView() {
        csui.require(['csui/controls/progressblocker/blocker'],
            function (BlockingView) {
              BlockingView.suppressAll();
            });
      }

      function resumeBlockingView() {
        csui.require(['csui/controls/progressblocker/blocker'],
            function (BlockingView) {
              BlockingView.resumeAll();
            });
      }

      function receiveMessage(event) {
        // the IFrame was created with urlOrigin, so check that we communicate only with our IFrame
        if (event.origin !== urlOrigin) {
          log.warn('redirecting.form.authenticator: event.origin and urlOrigin differ, aborting!') && console.warn(log.last);
          return;
        }
        if (event.data === 'csuiTicketLoaded') {
          log.info('redirecting.form.authenticator: Sending getOrigin back to child.') && console.log(log.last);
          event.source.postMessage('getOrigin', '*');
        } else {
          if (event.data.ticket) {
            log.debug('redirecting.form.authenticator: Redirecting Form Authenticator received new ticket.') && console.log(log.last);
            window.removeEventListener('message', receiveMessage, false);
            timer && clearTimeout(timer);
            timer = undefined;
            removeIFrame();
            var session = self.connection.session || (self.connection.session = {});
            session.ticket = event.data.ticket;
            session.expires = event.data.expires;
            session.serverDate = event.data.serverDate;
            succeeded && succeeded(self.connection);
            // if this ticket refresh will be used with expiration warning, inform here UserSession
            if (UserSession) {
              UserSession.updateSessionTicket(self);
            }
            // signal loggedIn (= ticket refreshed), like normal login-page does
            log.info("redirecting.form.authenticator: Sending 'loggedIn' event...") && console.log(log.last);
            self.trigger('loggedIn', {
              sender: self,
              connection: self.connection
            });            
          }
        }
      }

      function waitForLogin() {
        // If the server doesn't post a message after a few seconds, show the OTDS page.
        timer = setTimeout(enableInteactiveLogin, authenticationIFrameTimeout);
      }

      function enableInteactiveLogin() {
        // Show modal dialog containing the iFrame that shows the OTDS login page.
        if (dialog) {
          dialog.$el.removeClass('binf-hidden');
          suppressBlockingView();
        }
      }

      function reportError(error) {
        csui.require(['csui/dialogs/modal.alert/modal.alert'
        ], function (ModalAlert) {
          ModalAlert.showError(error.message);
        });
        failed(error, self.connection);
      }

      // avoid undefined, null, 0 and ''
      function isTruthy(n) {
        return !!n;
      }

    }
  });

  return RedirectingFormAuthenticator;
});

csui.define('csui/utils/authenticators/core.authenticators',[
  'module', 'csui/lib/underscore',
  'csui/utils/authenticators/ticket.authenticator',
  'csui/utils/authenticators/interactive.credentials.authenticator',
  'csui/utils/authenticators/redirecting.form.authenticator'
], function (module, _, TicketAuthenticator,
    InteractiveCredentialsAuthenticator, RedirectingFormAuthenticator) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
      .config['csui/utils/interactiveauthenticator'] || {},
      enableInteractiveAuthenticator = config.enabled,
      originalConfig = module.config();
  config = _.extend({
    // If there is no ticket, show a modal dialog with a login form and
    // allow the user to enter credentials and get a ticket.
    enableInteractiveAuthenticator: originalConfig.enableRedirectingFormAuthenticator === undefined &&
                                    enableInteractiveAuthenticator !== false,
    // If there is no ticket, try to get it using a request in a hidden
    // iframe. Using response redirection it either posts back a ticket
    // automatically, or it renders a login form and waits. The iframe
    // will be shown to the user, who will log in manually and let the
    // redirection to the pahe posting back tyhe ticket continue.
    enableRedirectingFormAuthenticator: false
  }, originalConfig);

  // If no custom authentication means are detected, authentication
  // will assume the native ticket. There are two authenticators, which
  // can be enabled to prompt for login, or fetch the ticket
  // automatically, is it is missing.
  var FallbackAuthenticator =
    config.enableInteractiveAuthenticator ?
      InteractiveCredentialsAuthenticator :
      config.enableRedirectingFormAuthenticator ?
        RedirectingFormAuthenticator :
        TicketAuthenticator;

  return [
    {
      sequence: 500,
      authenticator: FallbackAuthenticator
    }
  ];
});

/**
 * This class will be removed as soon as SVF-1020 got resolved.
 * For the respective document, please do follow smart/utils/high.contrast/doc/detector.md file.
 */


csui.define('csui/utils/high.contrast/detector',[],function () {
  'use strict';

  var highContrast;

  function detectHighContrast() {
    // See https://github.com/hanshillen/HCMDS
    var testBackgroundColor = "rgb(127, 127, 127)";
    var lightBackgroundColor = "rgb(255, 255, 255)";
    // var darkBackgroundColor = "rgb(0, 0, 0)";
    var div = document.createElement('div');
    var style = div.style;
    style.backgroundColor = testBackgroundColor;
    style.borderWidth = '1px';
    style.borderStyle = 'solid';
    style.borderTopColor = '#ff0000';
    style.borderRightColor = '#00ffff';
    style.position = 'absolute';
    style.left = '-9999px';
    style.width = div.style.height = '2px';
    var body = document.body;
    body.appendChild(div);
    style = window.getComputedStyle(div);
    var backgroundColor = style.backgroundColor;
    if (backgroundColor === testBackgroundColor) {
      highContrast = 0;
    } else {
      if (backgroundColor === lightBackgroundColor) {
        highContrast = 2; // dark on light
      } else {
        highContrast = 1; // light on dark
      }
    }

    //    highContrast = style.borderTopColor === style.borderRightColor;
    body.removeChild(div);
    var method = highContrast ? 'add' : 'remove';
    var hcMode = 'csui-highcontrast-light-on-dark';
    if (highContrast === 2) {
      hcMode = 'csui-highcontrast-dark-on-light';
    }
    document.documentElement.classList[method]('csui-highcontrast');
    document.documentElement.classList[method](hcMode);
  }

  return {
    load: function (name, _require, onLoad, config) {
      function ensureHighContrastDetection() {
        if (document.readyState === 'complete') {
          if (highContrast === undefined) {
            detectHighContrast();
          }
          onLoad(highContrast);
          return true;
        }
      }

      if (config.isBuild) {
        onLoad(null);
      } else {
        if (!ensureHighContrastDetection()) {
          document.addEventListener('readystatechange',
              ensureHighContrastDetection);
        }
      }
    }
  };
});

csui.define('csui/models/view.state.model',[
  'module', 'csui/lib/underscore', 'csui/lib/backbone',
  'csui/utils/log', 'csui/utils/url', 'csui/utils/namedsessionstorage'

], function (module, _, Backbone, log, Url, NamedSessionStorage) {
  'use strict';

  var PublicLang;
  csui.require(['i18n!csui/pages/start/nls/lang'
  ], function (publicLang) {
    PublicLang = publicLang;
  }.bind(this));

  var MAX_ROUTERS_INFO_STACK = 50;

  var constants = Object.freeze({
    LAST_ROUTER: 'lastRouter',
    CURRENT_ROUTER: 'currentRouter',
    CURRENT_ROUTER_FRAGMENT: 'currentRouterFragment',
    CURRENT_ROUTER_NAVIGATE_OPTIONS: 'currentRouterNavigateOptions',
    CURRENT_ROUTER_SCOPE_ID: 'currentRouterScopeId',
    BACK_TO_TITLE: 'back_to_title',
    METADATA_CONTAINER: 'metadata_container',
    STATE: 'state',
    DEFAULT_STATE: 'default_state',
    SESSION_STATE: 'session_state',
    NAVIGATION_HISTORY_ARRAY: 'navigationHistoryArray',
    URL_PARAMS: 'urlParams',
    ALLOW_WIDGET_URL_PARAMS: 'allowWidgetUrlParams',
    START_ID: 'start_id',
    BREADCRUMB: 'breadcrumb',
    QUERY_STRING_PARAMS: 'query_string_params'
  });

  var counter = 0;

  /*var noExpanding = /\bno_expand\b(?:=([^&]*)?)?/i.exec(location.search);
  noExpanding = noExpanding && noExpanding[1] !== 'false';*/
    
  // The view state model stores variables in the state attribute. Those variables are used to build
  // the url parameters. In this sense the url is the long term storage.
  // The session session_state contains variables that are stored in the browser session storage.
  var ViewStateModel = Backbone.Model.extend({

    constructor: function ViewStateModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      if (counter === 0) {
        this.storage = new NamedSessionStorage(module.id);
      } else {
        this.storage = new NamedSessionStorage(module.id + '_' + counter);
        this.storage.destroy();
      }

      counter++;

      this.set('enabled', attributes ? attributes.enabled : false);

      this._navigationHistory = [];

      _.values(constants).forEach(function (property) {
        var value = attributes ? attributes[property] : this.storage.get(property);
        if (value && (property.indexOf("Array") !== -1 || property.indexOf("urlParams") !== -1)) {
          value = _.isString(value) ? JSON.parse(value) : value;
        }
        this.listenTo(this, 'change:' + property, this._syncWithStorage.bind(this, property));
        this.set(property, value);
      }.bind(this));

      this._navigationHistory = this.get(constants.NAVIGATION_HISTORY_ARRAY) || [];
    },

    CONSTANTS: constants,

    _setViewStateAttribute: function (attributeName, key, value, options) {
      options || (options = {});
      if (this._getViewStateAttribute(attributeName, key) === value) {
        return;
      }

      var object = this.get(attributeName) || {};
      object = _.clone(object);
      if (value === undefined || value === '') {
        delete object[key];
      } else {
        object[key] = value;
      }
      options = _.omit(options, 'encode');
      this.set(attributeName, object, options);
      this._syncWithStorageIfSilentUpdate(attributeName, options);
      return true;
    },

    _getViewStateAttribute: function(attributeName, key, decode) {
      var state = this.get(attributeName);
      if (state) {
        return state[key];
      }
    },

    // All the view state elements are added to the url. These variables are stored in the url.
    setViewState: function (key, value, options) {
      if (key === 'state') {
        this.set(constants.STATE, value, options);
        this._syncWithStorageIfSilentUpdate(constants.STATE, options);
      } else {
        return this._setViewStateAttribute(constants.STATE, key, value, options);
      }
    },

    getViewState: function (key, decode) {
      return this._getViewStateAttribute(constants.STATE, key, decode);
    },

    // Default states are not serialized in the url even if they exist in the 'state' object.
    setDefaultViewState: function(key, value, options) {
      return this._setViewStateAttribute(constants.DEFAULT_STATE, key, value, options);
    },

    getDefaultViewState: function(key, decode) {
      return this._getViewStateAttribute(constants.DEFAULT_STATE, key, decode);
    },

    // All variables in the session view state are stored in the session local storage.
    // They are used to initialize the widgets view
    setSessionViewState: function (key, value, options) {
      options || (options = {});
      if (this.getSessionViewState(key) === value) {
        return;
      }
      var sessionState = this.get(constants.SESSION_STATE) || {};
      sessionState = _.clone(sessionState);
      sessionState[key] = value;
      this.set(constants.SESSION_STATE, sessionState, options);
      this._syncWithStorageIfSilentUpdate(constants.SESSION_STATE, options);
      return true;
    },

    getSessionViewState: function (key) {
      var state = this.get(constants.SESSION_STATE);
      if (state) {
        return state[key];
      }
    },

    _syncWithStorageIfSilentUpdate: function(property, options) {
      if (options && options.silent) {
        this._syncWithStorage(property);
      }
    },

    _syncWithStorage: function (property) {
      var value = this.get(property);
      if (_.isArray(value)) {
        value = JSON.stringify(value);
      }
      this.storage.set(property, value);
    },

    getCurrentRouterName: function() {
      return this.get(this.CONSTANTS.CURRENT_ROUTER);
    },

    onNavigationStarted: function (newRouterInfo, canRestore) {

      this.trigger('before:navigate');

      this.set('navigated', true);

      var restore = this.isSameRoutingInfo(newRouterInfo, this.getLastHistoryEntry());
      if (!canRestore) {
        restore = false;
      }
      // we need to do this for backward compatibility. This is for any code that uses this
      // value from previous implementation.
      this.set(this.CONSTANTS.LAST_ROUTER, this.get(this.CONSTANTS.CURRENT_ROUTER));

      if (restore) {
        this._currentHistoryEntry = undefined;
        this._restoreStatesFromHistoryEntry(this._navigationHistory.pop());
        this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
        this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
      } else {
        this._savePotentialHistoryEntry();
      }
    },

    _savePotentialHistoryEntry: function () {
      var storage = this.storage;
      var routerName = storage.get(constants.CURRENT_ROUTER);
      if (routerName) {

        var state = this.get('saved_viewstate');
        if (!state) {
          state = this.storage.get(constants.STATE);
        }

        // some context plugins could change the urlParams in the viewState
        // make sure we take the urlParams from the router and not the viewStateModel.
        var router = this.get('PerspectiveRouting').getRouter(routerName);
        
        this._currentHistoryEntry = {
          'router': routerName,
          'back_to_title': this.storage.get(constants.BACK_TO_TITLE),
          'urlParam': router && router.urlParams,
          'fragment': this.storage.get(constants.CURRENT_ROUTER_FRAGMENT),
          'scopeId': this.storage.get(constants.CURRENT_ROUTER_SCOPE_ID),
          'navigateOptions': this.storage.get(constants.CURRENT_ROUTER_NAVIGATE_OPTIONS),
          'state': state,
          'sessionState': this.storage.get(constants.SESSION_STATE),
          'defaultState': this.storage.get(constants.DEFAULT_STATE)
        };
      }
    },

    getPotentialHistoryEntry: function () {
      return this._currentHistoryEntry;
    },

    onContextFetch: function () {
      this.trigger('navigate', this._currentHistoryEntry);
      this.unset("isFromHistory", {silent: true});
      this._currentHistoryEntry && this._addRouterInfoToHistory(this._currentHistoryEntry);
    },

    _restoreStatesFromHistoryEntry : function(historyInfo) {
      if (historyInfo) {
        var restoreStates = {
          'isFromHistory': true,
          'state': historyInfo.state,
          'default_state': historyInfo.defaultState,
          'session_state': historyInfo.sessionState
        };
        this.set(restoreStates, {silent: true});
        ['state', 'default_state', 'session_state'].forEach(function (property) {
          this._syncWithStorage(property);
        }.bind(this));
      }
    },

    _addRouterInfoToHistory: function (historyEntry) {

      // do not add duplicate entries
      if (this._navigationHistory.length > 0 &&
            JSON.stringify(historyEntry) === JSON.stringify(this._navigationHistory[this._navigationHistory.length - 1])) {
        return;
      }

      this._navigationHistory.push(historyEntry);

      if (this._navigationHistory.length > MAX_ROUTERS_INFO_STACK) {
        this._navigationHistory.shift();
      }

      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
    },

    _copyAttributes: function (viewStateModel) {
      Object.keys(viewStateModel.attributes).forEach(function (attributeName) {
        this.unset(attributeName);
        this.set(attributeName, viewStateModel.get(attributeName));
      }.bind(this));
    },

    saveHistory: function() {
      this.savedViewStateModel = this.clone();
      this.savedViewStateModel._copyAttributes(this);
      this._resetAttributes();
    },

    _resetAttributes: function() {

      this._navigationHistory = [];

      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);

      this.set(constants.LAST_ROUTER, undefined);
      this.set(constants.CURRENT_ROUTER, undefined);
      this.set(constants.CURRENT_ROUTER_FRAGMENT, undefined);
      this.set(constants.CURRENT_ROUTER_NAVIGATE_OPTIONS, undefined);
      this.set(constants.CURRENT_ROUTER_SCOPE_ID, undefined);
      this.set(constants.BACK_TO_TITLE, undefined);
      this.set(constants.METADATA_CONTAINER, undefined);
      this.set(constants.STATE, undefined);
      this.set(constants.DEFAULT_STATE, undefined);
      this.set(constants.SESSION_STATE, undefined);
      this.set(constants.URL_PARAMS, undefined);
      this.set(constants.ALLOW_WIDGET_URL_PARAMS, undefined);
      this.set(constants.SESSION_STATE, undefined);
      this.set(constants.START_ID, undefined);
      this.set(constants.BREADCRUMB, undefined);
    },

    restoreHistory: function () {
      if (this.savedViewStateModel) {
        this._copyAttributes(this.savedViewStateModel);
        this.savedViewStateModel.clean();
        this.savedViewStateModel = undefined;

        var value = this.storage.get(constants.NAVIGATION_HISTORY_ARRAY);
        if (value) {
          value = JSON.parse(value);
          this._navigationHistory = value;
        }
      }
    },

    hasRouted: function () {
      return this._navigationHistory.length > 0;
    },

    isSameRoutingInfo: function (router1Info, router2Info) {
      return router1Info && router2Info &&
             router1Info.router === router2Info.router &&
             router1Info.fragment === router2Info.fragment;
    },

    /**
     * Warning: Cleaning of state will eventually clears the internals session storage. 
     * Thus, restoring the state (perhaps on page refresh or navigating between pages) will not be possible after this operation.
     */
    clean: function() {
      // Clear model state
      this.clear(); 
      // Clear session storage
      this.storage.destroy();
    },

    getBackToTitle: function () {

      var title = PublicLang.back;
      if (this._currentHistoryEntry) {
        title = this._currentHistoryEntry.back_to_title || title;
      } else {
        var index = this.getLastRouterIndex();
        if (index !== -1) {
          var lastRouterInfo = this._navigationHistory[index];
          if (lastRouterInfo) {
            title = lastRouterInfo.back_to_title || title;
          }
        }
      }

      return title;
    },

    clearHistory: function() {
      this._navigationHistory = [];
      this.unset(constants.NAVIGATION_HISTORY_ARRAY, {silent: true});
      this.set(constants.NAVIGATION_HISTORY_ARRAY, this._navigationHistory);
    },

    clearCurrentHistoryEntry: function () {
      this._currentHistoryEntry = undefined;
    },

    getLastRouterIndex: function () {
      var index = -1,
          navigationHistory = this._navigationHistory;
      if (navigationHistory && navigationHistory.length > 0) {
        for (var i = navigationHistory.length - 1; i >= 0; i--) {
          if (navigationHistory[i].router !== this.get(constants.CURRENT_ROUTER)) {
            index = i;
            break;
          }
        }
      }
      return index;
    },

    getIndexOfOfLastApplicationScope: function () {
      var index = -1,
          navigationHistory = this._navigationHistory;
      if (navigationHistory && navigationHistory.length > 0) {
        for (var i = navigationHistory.length - 1; i >= 0; i--) {
          if (navigationHistory[i].scopeId !== this.get(constants.CURRENT_ROUTER_SCOPE_ID)) {
            index = i;
            break;
          }
        }
      }
      return index;
    },

    getLastHistoryEntry: function () {
      return this._navigationHistory && this._navigationHistory.length > 0 &&
             this._navigationHistory[this._navigationHistory.length - 1];
    },

    getHistory: function () {
      return this._navigationHistory;
    },

    restoreRouterOfLastApplicationScope: function () {
      this._restoreHistoryEntryByIndex(this.getIndexOfOfLastApplicationScope());
    },

    restoreLastRouter: function () {
      this._restoreHistoryEntryByIndex(this.getLastRouterIndex());
    },

    restoreLastFragment: function () {
      this._restoreHistoryEntryByIndex(this._navigationHistory.length - 1);
    },

    restoreHistoryEntryByIndex: function(index) {
      return this._restoreHistoryEntryByIndex(index);
    },

    _restoreHistoryEntryByIndex: function (index) {
      if (index !== -1 && index < this._navigationHistory.length) {
        this._navigationHistory.length = index + 1;
        var historyEntryInfo = this.getLastHistoryEntry();
        this._restoreStatesFromHistoryEntry(historyEntryInfo);
        this.get('PerspectiveRouting').restoreRouter(historyEntryInfo);
      } else {
        // Just go back if no history. It should not happen really.
        window.history.back();
      }
    },

    addUrlParameters: function (urlParameters, context, replace, force) {
      if (!force && !this.get(this.CONSTANTS.ALLOW_WIDGET_URL_PARAMS)) {
        return;
      }
      var perspectiveRouting = this.get('PerspectiveRouting');
      // The activeRouterInstance gets inserted in the viewStateModel
      // once the new router is activated and before the routing happens
      // But the new router from that time on will start listening to the viewState change.
      var activeRouter = this.get("activeRouterInstance");
      var routerName = activeRouter && activeRouter.name;
      routerName = routerName || this.get(constants.CURRENT_ROUTER);
      return perspectiveRouting &&
                   perspectiveRouting.addUrlParameters(routerName, urlParameters, replace);
    },

    clear: function () {
      this.storage.destroy();
      // init also all variables, just incase someone wants to use this viewStateModel instance again.
      // see SAPSSF-7778
      this._navigationHistory = [];
      this._currentHistoryEntry = undefined;
      Backbone.Model.prototype.clear.call(this, {silent: true});
    },

    hasNotNavigatedAndNotJustStarted:function() {
    }

  }, {
    CONSTANTS: constants,
    clean: function() {
      var storage = new NamedSessionStorage(module.id);
      storage.destroy();
    }
  });

  return ViewStateModel;
});

csui.define('csui/utils/contexts/impl/csui.context.plugin',[
  'csui/utils/contexts/context.plugin', 'csui/models/view.state.model'
], function (ContextPlugin, ViewStateModel) {
  'use strict';

  var CsuiContextPlugin = ContextPlugin.extend({
    constructor: function CsuiContextPlugin(options) {
      ContextPlugin.call(this, options);

      var context = this.context;
      context.viewStateModel = new ViewStateModel();
      context.listenTo(context, 'request', propagateRequestEventToViewState.bind(this))
             .listenTo(context, 'destroy', clearViewState.bind(this));
    }
  });

  function propagateRequestEventToViewState() {
    this.context.viewStateModel.onContextFetch();
  }

  function clearViewState() {
    this.context.viewStateModel.clear();
  }

  return CsuiContextPlugin;
});

csui.define('bundles/csui-signin',[
  // Pages
  'csui/pages/signin/signin.page.view',

  // Utilities
  'csui/utils/authenticators/core.authenticators',
  'csui/utils/high.contrast/detector',

  // Contexts
  'csui/utils/contexts/impl/csui.context.plugin'
], {});

csui.require(['require', 'css'], function (require, css) {
  css.styleLoad(require, 'csui/bundles/csui-signin', true);
});

