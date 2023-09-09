/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


(function () {
  'use strict';
  var csui = window.csui || (window.csui = {});
  if (!csui.requirejs && window.requirejs) {
    csui.requirejs = window.requirejs;
    csui.require = window.require;
    csui.define = window.define;
  }

  csui.setLanguage = function (language, country) {
    if (country) {
      language = language + '-' + country;
    }
    if (typeof language === 'string' || language === null) {
      language = {locale: language};
    }
    if (language.locale) {
      language.locale = language.locale.toLowerCase().replace('_', '-');
    }
    if (language.rtl === undefined) {
      language.rtl = csui.needsRTL(language.locale);
    }
    csui.require.config({
      config: {i18n: language}
    });
  };

  csui.needsRTL = function (language) {
    return /^(?:ar|fa|he|ur|yi)/.test(language);
  };

  csui.setLastLanguage = function () {
    console.warn('The csui.setLanguage method has become obsolete and has no effect. ' +
                 'If you need to remember the last chosen csui language, do it your ' +
                 'application, please.');
  };

  csui.setLogging = function (settings) {
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
    var beforeLoggingInitialization = [];

    function relogEntries(log) {
      if (beforeLoggingInitialization.length) {
        beforeLoggingInitialization.forEach(function (item) {
          (item.id ? logModule : reportModule)(log, item, true);
        });
        beforeLoggingInitialization = [];
      }
    }
    var originalResourceLoad = csui.require.onResourceLoad;
    csui.require.onResourceLoad = function (context, map, depMaps) {
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
      if (originalError) {
        originalError.apply(this, arguments);
      }
    };
  }

  function pushStartingModules(modules) {
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
    if (!failure) {
      if (typeof modules === 'function') {
        failure = success;
        success = modules;
        modules = undefined;
      }
    }
    if (!success) {
      if (typeof modules === 'function') {
        success = modules;
        modules = undefined;
      }
    }
    if (!modules) {
      modules = [];
    }
    function loadModules() {
      pushStartingModules(modules);
      csui.require(modules, function () {
        csui.ready || (csui.ready = true);
        success && success.apply(this, arguments);
      }, failure);
    }
    function loadLanguages() {
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
        script.addEventListener('error', waitForLanguage);
        document.head.appendChild(script, document.currentScript);
      }

      languageBundleIndexes.forEach(loadLanguage);
      waitForLanguage();
    }
    var i18n = csui.require.s.contexts._.config.config.i18n,
      locale = i18n && i18n.locale ||
        navigator.languages && navigator.languages[0] ||
        navigator.language || '';
    locale = locale.toLowerCase();
    if (locale && locale !== 'en' && locale !== 'en-us') {
      var loadableLocales = i18n && i18n.loadableLocales || [];
      if (!(loadableLocales instanceof Array)) {
        loadableLocales = Object
          .keys(loadableLocales)
          .map(function (locale) {
            return locale.toLowerCase();
          });
      }
      if (loadableLocales.indexOf(locale) < 0) {
        locale = locale.split('-')[0];
      }
      if (loadableLocales.indexOf(locale) < 0) {
        var alternativeLocales = loadableLocales.filter(function (alternativeLocale) {
          return alternativeLocale.indexOf(locale + '-') === 0;
        });
        if (alternativeLocales.length) {
          locale = alternativeLocales[0];
        }
      }
      if (loadableLocales.indexOf(locale) >= 0) {
        return loadLanguages();
      }
    }

    loadModules();
  };

  csui.onReady3 = function (csuiOptions, modules, success, failure) {
    if (typeof csuiOptions !== 'object' || csuiOptions === null ||
        Array.isArray(csuiOptions) || !csuiOptions.connection) {
      throw new Error('Missing connection options.');
    }
    if (!failure) {
      if (typeof modules === 'function') {
        failure = success;
        success = modules;
        modules = undefined;
      }
    }
    if (!success) {
      if (typeof modules === 'function') {
        success = modules;
        modules = undefined;
      }
    }
    if (!modules) {
      modules = [];
    }

    var csuiOptionsIndex;
    function ensureNeededLinks(connection) {
      var linkArr = document.head.querySelectorAll("link,style");
      var i,
          linkHref,
          overrideExists = false,
          overrideElement,
          themeExists = false,
          themeRegex = /^.+\/csui\/themes\/.+\/(?:theme|theme-rtl)\.css(?:\?.*)?$/;
      for (i = 0; i < linkArr.length; i++) {
        if (linkArr[i].hasAttribute("data-csui-theme-overrides")) {
          if (!overrideElement) {
            overrideElement = linkArr[i];
          }
        }
        if (linkArr[i].hasAttribute("href")) {
          linkHref = linkArr[i].getAttribute("href");
          linkHref = linkHref.toLowerCase();
          if (linkArr[i].hasAttribute("data-csui-theme-overrides")) {
            if (window.csuiOverrideCssUrl) {
              var overrideHref = window.csuiOverrideCssUrl.toLowerCase();
              if (overrideHref == linkHref) {
                overrideExists = true;
              }
            }
          } else {
            if (themeRegex.test(linkHref)) {
              themeExists = true;
            }
          }
        }
      }

      if (!themeExists) {
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
          document.head.insertBefore(themeLink, overrideElement);
        } else {
          document.head.appendChild(themeLink);
        }
      }
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
    function removeCsuiOptionsFromModules(modules) {
      csuiOptionsIndex = -1;
      if (modules.length > 0) {
        csuiOptionsIndex = modules.indexOf('csui-options');
        if (csuiOptionsIndex >= 0) {
          modules.splice(csuiOptionsIndex, 1);
        }
      }
    }

    function insertOptionsObjectIntoArguments(args) {
      if (csuiOptionsIndex >= 0) {
        Array.prototype.splice.call(args, csuiOptionsIndex, 0, csuiOptions);
      }
    }
    function loadModules() {
      pushStartingModules(modules);
      removeCsuiOptionsFromModules(modules);
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
    var waitLoadingCounter = 1;
    function waitForLoading() {
      if (!--waitLoadingCounter) {
        loadModules();
      }
    }
    function loadCsuiSettings(connection, waitForLoading, checkedLocale, successCallback) {
      csui.settingsData[connection.url].isLoadRunning = true;
      waitLoadingCounter = waitLoadingCounter + 2;
      function addAuthenticationHeader() {
        var authenticationFound;
        if (connection.credentials &&
          connection.credentials.username && connection.credentials.password) {
          var headerVal = 'Basic ' + btoa(unescape(encodeURIComponent(connection.credentials.username + ':' + connection.credentials.password)));
          request.setRequestHeader('Authorization' , headerVal);
          authenticationFound = true;
        } else if (connection.session && connection.session.ticket) {
          request.setRequestHeader('OTCSTicket', connection.session.ticket);
          authenticationFound = true;
        } else if (connection.authenticationHeaders) {
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
        if (settings.languageBundles) {
          csui.require.config({bundles: settings.languageBundles});
        }
      }
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
      function fail(message, error) {
        console.error(message);
        if (error) {
          console.error(error);
        }
        if (failure) {
          failure(new Error(message));
        }
      }
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
    function triggerCsuiSettingsCallbacks(connection) {
      csui.settingsData[connection.url].callbacks.forEach(function (cbData, index) {
        cbData.callback(cbData.options);
      });
      csui.settingsData[connection.url].callbacks = [];
    }

    function getStaticAssetsLanguage() {
      var i18n = csui.require.s.contexts._.config.config.i18n || {};
      var locale = i18n.locale ||
            navigator.languages && navigator.languages[0] ||
            navigator.language || 'en';
      var loadableLocales = i18n.loadableLocales || ['en'];
      if (!(loadableLocales instanceof Array)) {
        loadableLocales = Object
          .keys(loadableLocales)
          .filter(function (locale) {
            return loadableLocales[locale];
          });
      }
      locale = locale.toLowerCase();
      loadableLocales = loadableLocales.map(function (loadableLocale) {
        return loadableLocale.toLowerCase();
      });
      if (loadableLocales.indexOf(locale) >= 0) {
        return locale;
      }
      if (locale.indexOf('-') > 0) {
        locale = locale.split('-')[0];
        if (loadableLocales.indexOf(locale) >= 0) {
          return locale;
        }
        if (loadableLocales.some(function (loadableLocale) {
          if (loadableLocale.indexOf(locale) === 0) {
            locale = loadableLocale;
            return true;
          }
        })) {
          return locale;
        }
      }
      return 'en';
    }
    function loadConfiguration(connection, waitForLoading, successCallback) {
      var checkedLocale = getStaticAssetsLanguage();
      loadCsuiSettings(connection, waitForLoading, checkedLocale, successCallback);
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
    return '1.0.0.0';
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
