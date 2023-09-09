// This file contains members added to the global csui object which should
// be available immediately without loading any modules.
(function () {
  'use strict';

  // Support development pages loading single files not built together yet.
  // Such pages are supposed to include three scripts:
  //   <script src=".../lib/require.js"></script>
  //   <script src=".../helpers.js"></script>
  //   <script src=".../config.js"></script>
  var csui = window.csui || (window.csui = {});
  if (!csui.requirejs && window.requirejs) {
    csui.requirejs = window.requirejs;
    csui.require = window.require;
    csui.define = window.define;
  }

  csui.setLanguage = function (language, country) {
    // Support the original interface with language and country
    // passed separately as strings
    if (country) {
      language = language + '-' + country;
    }
    // Support passing both a string with locale and an object
    // with the locale and other optional parameters
    if (typeof language === 'string' || language === null) {
      language = {locale: language};
    }
    // Normalize the locale to be always lower-case "language[-country]"
    if (language.locale) {
      language.locale = language.locale.toLowerCase().replace('_', '-');
    }
    // Enable RTL mode using the default value. There is no server to ask
    // about it at this time and it is not needed to waste a server call.
    if (language.rtl === undefined) {
      language.rtl = csui.needsRTL(language.locale);
    }
    csui.require.config({
      config: {i18n: language}
    });
  };

  csui.needsRTL = function (language) {
    // Enable RTL mode according to the usual writing direction in known
    // languages. There is no server to ask about it at this time and it
    // is not needed to waste a server call anyway. List more than officially
    // supplied languages here, in case custom language packs are created.
    // See https://en.wikipedia.org/wiki/Right-to-left
    // and https://en.wikipedia.org/wiki/Bi-directional_text.
    return /^(?:ar|fa|he|ur|yi)/.test(language);
  };

  csui.setLastLanguage = function () {
    console.warn('The csui.setLanguage method has become obsolete and has no effect. ' +
                 'If you need to remember the last chosen csui language, do it your ' +
                 'application, please.');
  };

  csui.setLogging = function (settings) {
    // Merge the util/log configuration with the specified object.
    csui.require.config({
      config: {'csui/utils/log': settings}
    });
  };

  var moduleLoggingEnabled;

  function enableModuleLogging() {
    if (moduleLoggingEnabled) {
      return;
    }
    moduleLoggingEnabled = true;

    // Debug logging method helpers.
    function logModule(log, map, earlier) {
      if (map.id.indexOf('!') > 0) {
        log.debug('A plugin processed {0}{1}.',
            map.id, earlier ? ' earlier' : '')
        && console.log(log.last);
      } else {
        log.debug('The module {0} was loaded{2} from {1}.',
            map.id, map.url, earlier ? ' earlier' : '')
        && console.log(log.last);
      }
    }

    function logModuleToConsole(map, earlier) {
      if (map.id.indexOf('!') > 0) {
        console.log('A plugin processed {0}.'
            .replace('{0}', map.id));
      } else {
        console.log('The module {0} was loaded from {1}.'
            .replace('{0}', map.id).replace('{1}', map.url));
      }
    }

    // Error logging method helpers.
    function getErrorInfo(error) {
      if (error.requireModules) {
        return {
          message: error.message.replace(/\r?\n.+$/, ''),
          requireModules: error.requireModules
        };
      }
      return {message: error.message + '\r\n' + error.stack};
    }

    function reportModule(log, error, earlier) {
      error = getErrorInfo(error);
      if (error.requireModules) {
        log.error('Loading modules [{0}] failed{2}: {1}',
            error.requireModules.join(','), error.message,
            earlier ? ' earlier' : '')
        && console.error(log.last);
      } else {
        log.error('Executing a module failed{1}: {0}',
            error.message, earlier ? ' earlier' : '')
        && console.error(log.last);
      }
    }

    function reportModuleToConsole(error) {
      error = getErrorInfo(error);
      if (error.requireModules) {
        console.log('Loading modules [{0}] failed: {1}'
            .replace('{0}', error.requireModules.join(','))
            .replace('{1}', error.message));
      } else {
        console.log('Executing a module failed: {0}'
            .replace('{1}', error.message));
      }
    }

    // Re-log debug and error entries when the log module is loaded.
    var beforeLoggingInitialization = [];

    function relogEntries(log) {
      if (beforeLoggingInitialization.length) {
        beforeLoggingInitialization.forEach(function (item) {
          (item.id ? logModule : reportModule)(log, item, true);
        });
        beforeLoggingInitialization = [];
      }
    }

    // Register for debug logging.
    var originalResourceLoad = csui.require.onResourceLoad;
    csui.require.onResourceLoad = function (context, map, depMaps) {
      // Call the original implementation before ours - it may modify something.
      if (originalResourceLoad) {
        originalResourceLoad.apply(this, arguments);
      }
      var log = csui.require.defined('csui/utils/log') &&
                csui.require('csui/utils/log');
      if (log) {
        relogEntries(log);
        logModule(log, map);
      } else {
        logModuleToConsole(map);
        beforeLoggingInitialization.push(map);
      }
    };

    // Register for error logging.
    var originalError = csui.require.onError;
    csui.require.onError = function (error) {
      var log = csui.require.defined('csui/utils/log') &&
                csui.require('csui/utils/log');
      if (log) {
        relogEntries(log);
        reportModule(log, error);
      } else {
        reportModuleToConsole(error);
        beforeLoggingInitialization.push(error);
      }
      // Call the original implementation after ours - it may throw.
      if (originalError) {
        originalError.apply(this, arguments);
      }
    };
  }

  function pushStartingModules(modules) {
    // The logging module should be loaded as early as possible.
    // The error handling module should be loaded as early as possible.
    // The domReady module ensures the HTML DOM for error reporting.
    ['csui/utils/log', 'csui/utils/base', 'csui/lib/domReady!']
        .forEach(function (module) {
          if (modules.indexOf(module) < 0) {
            modules.push(module);
          }
        });
  }

  csui.onReady = function (modules, success, failure) {
    var parameters = Array.prototype.slice.call(arguments);

    if (modules instanceof Array) {
      if (modules.indexOf('csui/integration/v1.widgets.wrapper') < 0) {
        modules.push('csui/integration/v1.widgets.wrapper');
      }
    } else {
      modules = ['csui/integration/v1.widgets.wrapper'];
      parameters.unshift(modules);
    }

    csui.onReady2.apply(this, parameters);
  };

  csui.onReady2 = function (modules, success, failure) {
    // Normalize the input parameters, which are all optional.
    if (!failure) {
      // call(success, failure)
      if (typeof modules === 'function') {
        failure = success;
        success = modules;
        modules = undefined;
      }
      // else call(modules, success)
    }
    if (!success) {
      // call(success)
      if (typeof modules === 'function') {
        success = modules;
        modules = undefined;
      }
    }
    if (!modules) {
      // call()
      modules = [];
    }

    // Loads the required modules, once all configuration scripts
    // have been loaded (or failed)
    function loadModules() {
      pushStartingModules(modules);
      csui.require(modules, function () {
        csui.ready || (csui.ready = true);
        success && success.apply(this, arguments);
      }, failure);
    }

    // Loads the scripts with language bundle indexes for every
    // registered csui extension; every code bundle index needs
    // a language bundle index to support the specified locale.
    // Bundle indexes have to be loaded before the very first
    // require() statement is executed.
    function loadLanguages() {
      // The server generates the list of bundle indexes from all
      // registered csui extensions
      var languageBundleIndexes = Object
          .keys(csui.bundleIndexes || {})
          .map(function (codeBundle) {
            return codeBundle.replace('/bundles/', '/bundles/nls/' +
              locale + '/') + '.js';
          }),
          languageCount = languageBundleIndexes.length + 1;

      function waitForLanguage() {
        if (!--languageCount) {
          loadModules();
        }
      }

      function loadLanguage(bundleIndexName) {
        var script = document.createElement('script');
        script.src = csui.require.toUrl(bundleIndexName);
        script.setAttribute('data-csui-required', 'true');
        script.addEventListener('load', waitForLanguage);
        // The language pack is missing for a particular component;
        // The English defaults will be used and the error will be
        // dumped on the console.
        script.addEventListener('error', waitForLanguage);
        document.head.appendChild(script, document.currentScript);
      }

      languageBundleIndexes.forEach(loadLanguage);
      waitForLanguage();
    }

    // TODO: Use some public interface to get the chosen locale
    // and locales, which point to loadable language packs
    // TODO: Think up something better, than copying this from i18n
    var i18n = csui.require.s.contexts._.config.config.i18n,
      locale = i18n && i18n.locale ||
        navigator.languages && navigator.languages[0] ||
        navigator.language || '';
    locale = locale.toLowerCase();
    // Ignore the default language; see nls/lang modules
    if (locale && locale !== 'en' && locale !== 'en-us') {
      var loadableLocales = i18n && i18n.loadableLocales || [];
      if (!(loadableLocales instanceof Array)) {
        loadableLocales = Object
          .keys(loadableLocales)
          .map(function (locale) {
            return locale.toLowerCase();
          });
      }
      // If no language pack for the full locale has been found,
      // try a language pack for the language only.
      if (loadableLocales.indexOf(locale) < 0) {
        locale = locale.split('-')[0];
      }
      // If no language pack for the language-only locale has been found,
      // try a full-locale language pack with other country.
      if (loadableLocales.indexOf(locale) < 0) {
        var alternativeLocales = loadableLocales.filter(function (alternativeLocale) {
          return alternativeLocale.indexOf(locale + '-') === 0;
        });
        if (alternativeLocales.length) {
          locale = alternativeLocales[0];
        }
      }
      // Only languages, for which a language pack has been installed,
      // makes sense to request to be loaded by require.js.
      if (loadableLocales.indexOf(locale) >= 0) {
        return loadLanguages();
      }
    }

    loadModules();
  };

  csui.onReady3 = function (csuiOptions, modules, success, failure) {
    // The csuiOptions are only passed to the success function if the pseudo-module 'csui-options' is specified
    // The csuiOptions parameter is not optional.
    if (typeof csuiOptions !== 'object' || csuiOptions === null ||
        Array.isArray(csuiOptions) || !csuiOptions.connection) {
      throw new Error('Missing connection options.');
    }

    // Normalize the input parameters, which are all optional.
    if (!failure) {
      // call(options, success, failure)
      if (typeof modules === 'function') {
        failure = success;
        success = modules;
        modules = undefined;
      }
      // else call(options, modules, success)
    }
    if (!success) {
      // call(options, success)
      if (typeof modules === 'function') {
        success = modules;
        modules = undefined;
      }
    }
    if (!modules) {
      // call(options)
      modules = [];
    }

    var csuiOptionsIndex;

    // ensure needed/wanted links in head-section
    function ensureNeededLinks(connection) {
      var linkArr = document.head.querySelectorAll("link,style");
      var i,
          linkHref,
          overrideExists = false,
          overrideElement,
          themeExists = false,
          themeRegex = /^.+\/csui\/themes\/.+\/(?:theme|theme-rtl)\.css(?:\?.*)?$/;

      // check all links for maybe already existing link-tags
      for (i = 0; i < linkArr.length; i++) {
        if (linkArr[i].hasAttribute("data-csui-theme-overrides")) {
          if (!overrideElement) {
            // remember first theme-overrides
            overrideElement = linkArr[i];
          }
        }
        if (linkArr[i].hasAttribute("href")) {
          linkHref = linkArr[i].getAttribute("href");
          linkHref = linkHref.toLowerCase();

          // classify link
          if (linkArr[i].hasAttribute("data-csui-theme-overrides")) {
            // overrides
            if (window.csuiOverrideCssUrl) {
              var overrideHref = window.csuiOverrideCssUrl.toLowerCase();
              if (overrideHref == linkHref) {
                overrideExists = true;
              }
            }
          } else {
            // theme
            if (themeRegex.test(linkHref)) {
              themeExists = true;
            }
          }
        }
      }

      if (!themeExists) {
        // theme(-rtl).css
        var i18n = csui.require.s.contexts._.config.config.i18n;
        var cssPath = '/csui/themes/carbonfiber/' + ((i18n.rtl === true) ? 'theme-rtl.css' : 'theme.css');
        var originalConnection = csui.require.s.contexts._.config.config['csui/utils/contexts/factories/connector'].connection;
        var supportPath = originalConnection.supportPath;
        var origin = /^(\w+:\/\/[^\/]+)/.exec(originalConnection.url);
        var baseSupportUrl = supportPath;
        if (origin) {
          baseSupportUrl = origin[1] + supportPath;
        }

        var themeHref = baseSupportUrl + cssPath;
        var moduleStamp = csui.require.s.contexts._.config.urlArgs('csui', themeHref);
        if (moduleStamp && moduleStamp.indexOf('v=') >= 0) {
          themeHref += moduleStamp;
        }

        var themeLink = document.createElement("link");
        themeLink.setAttribute("rel", "stylesheet");
        themeLink.setAttribute("data-csui-required", "true");
        themeLink.setAttribute("href", themeHref);

        if (overrideExists === true) {
          // insert before overrides.css
          document.head.insertBefore(themeLink, overrideElement);
        } else {
          document.head.appendChild(themeLink);
        }
      }

      // overrides.css
      if (window.csuiOverrideCssUrl && overrideExists !== true) {
        var newLink = document.createElement("link");
        newLink.setAttribute("rel", "stylesheet");
        newLink.setAttribute("type", "text/css");
        newLink.setAttribute("data-csui-theme-overrides", "true");
        newLink.setAttribute("data-csui-required", "true");
        newLink.setAttribute("href", window.csuiOverrideCssUrl);
        document.head.appendChild(newLink);
      }
    }

    // returns index (0-based) where csui-options were found
    function removeCsuiOptionsFromModules(modules) {
      csuiOptionsIndex = -1;
      if (modules.length > 0) {
        csuiOptionsIndex = modules.indexOf('csui-options');
        if (csuiOptionsIndex >= 0) {
          // remove csui-options from modules
          modules.splice(csuiOptionsIndex, 1);
        }
      }
    }

    function insertOptionsObjectIntoArguments(args) {
      if (csuiOptionsIndex >= 0) {
        // insert at remembered idx the options object
        Array.prototype.splice.call(args, csuiOptionsIndex, 0, csuiOptions);
      }
    }

    // Loads the required modules, once all configuration scripts
    // have been loaded (or failed)
    function loadModules() {
      pushStartingModules(modules);
      removeCsuiOptionsFromModules(modules);

      // Allow overriding or extending configuration sent from the server.
      var eventHandler = csuiOptions.onBeforeLoadModules;
      if (eventHandler) {
        eventHandler(csuiOptions, modules);
      }

      csui.require(modules, function () {
        csui.ready || (csui.ready = true);
        insertOptionsObjectIntoArguments(arguments);
        success && success.apply(this, arguments);
      }, failure);
    }

    // Initially add one for final waitForLoading() in loadConfiguration().
    // The other additional load-functions should increase the value
    // by their need.
    var waitLoadingCounter = 1;

    // callback function which decreases the loadingCounter
    // and finally calls loadModule()
    function waitForLoading() {
      if (!--waitLoadingCounter) {
        loadModules();
      }
    }

    // Loads the csui settings to get the additional requirejs
    // configurations which require authentication.
    // The necessary authentication is ensured by setting
    // HTTP-headers based on the given connection data.
    //
    // The configurations must be loaded before the very first
    // require() statement is executed.
    function loadCsuiSettings(connection, waitForLoading, checkedLocale, successCallback) {
      // set running state to true
      csui.settingsData[connection.url].isLoadRunning = true;
      // extend loading counter
      waitLoadingCounter = waitLoadingCounter + 2;

      // Adds based on the given connection the corresponding
      // authentication header(s) to the HTTP request.
      // Currently the following authentication sources are supported:
      // 1. credentials - basic authentication with username and password
      // 2. session: { ticket: } - OTCS ticket which can be directly used with REST-calls
      // 3. authenticationHeaders - user specified headers which are sent with the request
      function addAuthenticationHeader() {
        var authenticationFound;
        if (connection.credentials &&
          connection.credentials.username && connection.credentials.password) {
          // username and password (basic authentication)
          var headerVal = 'Basic ' + btoa(unescape(encodeURIComponent(connection.credentials.username + ':' + connection.credentials.password)));
          request.setRequestHeader('Authorization' , headerVal);
          authenticationFound = true;
        } else if (connection.session && connection.session.ticket) {
          // directly usable session ticket
          request.setRequestHeader('OTCSTicket', connection.session.ticket);
          authenticationFound = true;
        } else if (connection.authenticationHeaders) {
          // authentication headers (contains headers)
          var authenticationHeaders = connection.authenticationHeaders;
          for (var propName in authenticationHeaders) {
            if (authenticationHeaders.hasOwnProperty(propName)) {
              request.setRequestHeader(propName, authenticationHeaders[propName]);
              authenticationFound = true;
            }
          }
        }

        if (!authenticationFound) {
          throw new Error('Missing authentication data in the connection object.');
        }
      }

      // Applies RequireJS module configurations and language bundle index
      function applySettings(settings) {
        if (settings.configurations) {
          settings.configurations.forEach(function toRequireConfigString(config) {
            if (config.config) {
              csui.require.config({config: config.config});
            }
          });
        } else {
          fail('Empty initial configuration detected.');
        }
        // Every registered csui extension may have a language
        // bundle index to support the specified locale.
        // Bundle indexes have to be loaded
        // before the very first require() statement is executed.
        if (settings.languageBundles) {
          csui.require.config({bundles: settings.languageBundles});
        }
      }

      // Replaces the initial authentication information with a fresh
      // OTCS ticket; some OTDS tickets are once-use-only.
      function replaceTicket() {
        var ticket = request.getResponseHeader('OTCSTicket');
        var ticketExpires = request.getResponseHeader('OTCSTicketExpires');
        var serverDate = request.getResponseHeader('Date');
        if (ticket) {
          delete connection.credentials;
          delete connection.authenticationHeaders;
          connection.session = {
            ticket: ticket,
            expires: ticketExpires,
            serverDate: serverDate
          };
        }
      }

      // Logs the error and calls the error callback.
      function fail(message, error) {
        console.error(message);
        if (error) {
          console.error(error);
        }
        if (failure) {
          failure(new Error(message));
        }
      }

      // perform the REST-call
      var request = new XMLHttpRequest();
      var url = connection.url;
      if (!url) {
        throw new Error('Missing connection URL.');
      }
      if (url[url.length - 1] !== '/') {
        url += '/';
      }
      url += 'csui/settings?uilocale=' + checkedLocale;

      request.onreadystatechange = function() {
        if (this.readyState == XMLHttpRequest.DONE) {
          csui.settingsData[connection.url].isLoadRunning = false;
          if (this.status == 200) {
            try {
              var settings = JSON.parse(this.responseText);
              applySettings(settings);
              replaceTicket();
              csui.settingsData[connection.url].loaded = true;
              if (successCallback) {
                successCallback(connection);
              }
              waitForLoading();
            } catch (error) {
              fail('Parsing initial settings failed.', error);
            }
          } else {
            fail('Fetching initial settings failed.',
              url + ': ' + request.status + ' ' + request.statusText);
          }
        }
      };

      request.open("GET", url, true);
      addAuthenticationHeader();
      request.setRequestHeader('Accept', 'application/json');
      request.send(null);

      waitForLoading();
    }

    // trigger collected callbacks for a certain connection url
    function triggerCsuiSettingsCallbacks(connection) {
      csui.settingsData[connection.url].callbacks.forEach(function (cbData, index) {
        cbData.callback(cbData.options);
      });
      csui.settingsData[connection.url].callbacks = [];
    }

    function getStaticAssetsLanguage() {
      // TODO: Use some public interface to get the chosen locale
      // and locales, which point to loadable language packs
      // TODO: Think up something better, than copying this from i18n
      var i18n = csui.require.s.contexts._.config.config.i18n || {};
      var locale = i18n.locale ||
            navigator.languages && navigator.languages[0] ||
            navigator.language || 'en';
      var loadableLocales = i18n.loadableLocales || ['en'];

      // Support configuration with locale keys enabled by boolean values.
      if (!(loadableLocales instanceof Array)) {
        loadableLocales = Object
          .keys(loadableLocales)
          .filter(function (locale) {
            return loadableLocales[locale];
          });
      }

      // Normalize the locales to lower-case.
      locale = locale.toLowerCase();
      loadableLocales = loadableLocales.map(function (loadableLocale) {
        return loadableLocale.toLowerCase();
      });

      // The first possibility - the full locale matches.
      if (loadableLocales.indexOf(locale) >= 0) {
        return locale;
      }

      // Try matching at least the language.
      if (locale.indexOf('-') > 0) {
        locale = locale.split('-')[0];
        // The second possibility - the exact language.
        if (loadableLocales.indexOf(locale) >= 0) {
          return locale;
        }
        // The third possibility - the same language for other country.
        if (loadableLocales.some(function (loadableLocale) {
          if (loadableLocale.indexOf(locale) === 0) {
            locale = loadableLocale;
            return true;
          }
        })) {
          return locale;
        }
      }

      // Default to English when the requested language is not available.
      return 'en';
    }

    // Really loads the configuration.
    // Loads all necessary initial configurations before
    // the execution of the very first require() statement.
    // You can add later additional load-functions here.
    function loadConfiguration(connection, waitForLoading, successCallback) {
      var checkedLocale = getStaticAssetsLanguage();
      loadCsuiSettings(connection, waitForLoading, checkedLocale, successCallback);

      // this signals the counter which was set during initialization
      waitForLoading();
    }

    function loadingHelper(connection) {
      if (csui.settingsData[connection.url].loaded) {
        loadModules();
      } else {
        loadConfiguration(connection, waitForLoading, function () {
          ensureNeededLinks(connection);
          setTimeout(triggerCsuiSettingsCallbacks, 0, connection);
        });
      }
    }

    function performLoading(connection) {
      csui.settingsData[connection.url].callbacks || (csui.settingsData[connection.url].callbacks = []);

      if (csui.settingsData[connection.url].isLoadRunning === true) {
        csui.settingsData[connection.url].callbacks.push({
          options: connection,
          callback: loadingHelper
        });
      } else {
        loadingHelper(connection);
      }

    }

    function initSettingsData(connection) {
      csui.settingsData || (csui.settingsData = {});
      csui.settingsData[connection.url] || (csui.settingsData[connection.url] = {});
    }

    csuiOptions.connection || (csuiOptions.connection = {});
    initSettingsData(csuiOptions.connection);
    performLoading(csuiOptions.connection);

  };

  csui.getVersion = function () {
    // Constant for debugging, but still parseable as a build number, this
    // will be replaced by a number uniquely identifying the build by r.js
    return '22.2.0.7280';
  };

  csui.getExtensionModules = csui.printExtensionModules = function (success, failure) {
    csui.require(['csui/models/server.module/server.module.collection'
    ], function (ServerModuleCollection) {
      var serverModules = new ServerModuleCollection();
      serverModules
          .fetch()
          .done(function () {
            serverModules = serverModules.toJSON();
            if (success) {
              success(serverModules);
            } else {
              console.log(JSON.stringify(serverModules, undefined, 2));
            }
          })
          .fail(function (error) {
            if (failure) {
              failure(error);
            } else {
              console.error('Loading extension modules failed:', error);
            }
          });
    });
  };
})();

csui.define("helpers", function(){});

csui.define('bundles/csui-helpers',[
  'helpers'
], {});

