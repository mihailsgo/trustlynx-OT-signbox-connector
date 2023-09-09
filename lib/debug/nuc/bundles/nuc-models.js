csui.define('nuc/utils/log',[
  'module', 'require', 'nuc/lib/underscore', 'nuc/lib/underscore.string'
], function (module, require, _) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    console: true,
    consoleRe: false,
    level: 'WARN',
    timing: false,
    page: false,
    performanceTimeStamp: false,
    moduleNameStamp: false,
    server: false,
    window: false,
    modules: {}
  });

  var thresholds = {
    ERROR: 4,
    WARN: 3,
    INFO: 2,
    DEBUG: 1,
    ALL: 1
  };
  var methods = {
    ERR: 'errpr',
    WRN: 'warn',
    INF: 'info',
    DBG: 'debug',
  };

  var consoleEnabled = typeof console !== 'undefined' && config.console;
  var loggerEnabled = config.window || config.page || config.server || config.consoleRe;
  var enabled = consoleEnabled || loggerEnabled;
  var bufferedEntries = [];
  var logger, appender;

  if (loggerEnabled) {
    // log4javascript is a big dependency, which is loaded on demand, because
    // it is used only seldom and only by some products.
    // The problem with loading it on demand is that the loggers may not be
    // available synchronously in the module, which depends on the log.
    // During the loading time, log entries may be printed only on the console.
    var logDeps = ['nuc/lib/log4javascript'];
    if (config.consoleRe) {
      logDeps.push('nuc/utils/log/console.re.appender');
    }
    if (logDeps.every(function (moduleName) {
          return require.defined(moduleName);
        })) {
      initializeLogger(
        require('nuc/lib/log4javascript'),
        config.consoleRe && require('nuc/utils/log/console.re.appender'));
    } else {
      require(logDeps, initializeLogger);
    }
  }

  function initializeLogger(log4javascript, ConsoleReAppender) {
    log4javascript.setDocumentReady();
    logger = log4javascript.getLogger();

    //~ if (config.console) {
    //~ var appender = new log4javascript.BrowserConsoleAppender();
    //~ appender.setLayout(new log4javascript.PatternLayout(
    //~ '%d{HH:mm:ss.SSS} %-5p - %m{1}%n'));
    //~ logger.addAppender(appender);
    //~ }

    if (config.window) {
      appender = new log4javascript.PopUpAppender();
      appender.setNewestMessageAtTop(false);
      appender.setScrollToLatestMessage(true);
      //~ appender.setShowHideButton(true);
      //~ appender.setShowCloseButton(true);
      appender.setLayout(new log4javascript.PatternLayout(
        '%d{HH:mm:ss.SSS} %-5p - %m{1}'));
      logger.addAppender(appender);
    }
    if (config.page) {
      //~ var placeholderID = config.placeholder || 'csui_log';
      //~ var placeholder = $(placeholderID);
      //~ if (placeholder.length == 0)
      //~ placeholder = $('<div id='' + placeholder + ''></div>')
      //~ .appendTo($(document.body));
      appender = new log4javascript.InPageAppender(config.placeholder);
      appender.setNewestMessageAtTop(false);
      appender.setScrollToLatestMessage(true);
      appender.setShowHideButton(true);
      appender.setShowCommandLine(true);
      appender.setLayout(new log4javascript.PatternLayout(
        '%d{HH:mm:ss.SSS} %-5p - %m{1}'));
      logger.addAppender(appender);
    }
    if (config.consoleRe) {
      appender = new ConsoleReAppender();
      appender.setLayout(new log4javascript.PatternLayout(
        '%d{HH:mm:ss.SSS} %-5p - %m{1}'));
      logger.addAppender(appender);
    }
    if (config.server) {
      appender = new log4javascript.AjaxAppender(config.server.url);
      appender.setLayout(new log4javascript.JsonLayout());
      appender.setTimed(config.server.timed !== false);
      appender.setTimerInterval(config.server.timerInterval || 500);
      appender.setBatchSize(config.server.batchSize || 10);
      appender.setWaitForResponse(false);
      appender.setSendAllOnUnload(true);
      var headers = _.extend({
        'content-type': 'application/json'
      }, config.server.headers);
      _.each(_.keys(headers), function (name) {
        appender.addHeader(name, headers[name]);
      });
      logger.addAppender(appender);
    }

    logger.setLevel(log4javascript.Level.DEBUG);
  }

  function log(target) {
    if (!(this instanceof log)) {
      return new log(target);
    }
    this._target = target;
    _.find(config.modules, function (settings, pattern) {
      if (matchModule(pattern, target)) {
        if (settings.level) {
          this._threshold = getThreshold(settings.level);
        }
        if( settings.timing !== undefined) {
          this.timing = settings.timing;
        }
        return true;
      }
    }, this);
  }

  var prototype = {
    _threshold: getThreshold(config.level),

    config: config,

    enabled: enabled,

    last: undefined,

    can: function (level) {
      return enabled && this._threshold <= getThreshold(level);
    },

    debug: function () {
      return logEntry.call(this, thresholds.DEBUG, 'DBG', arguments);
    },

    info: function () {
      return logEntry.call(this, thresholds.INFO, 'INF', arguments);
    },

    warn: function () {
      return logEntry.call(this, thresholds.WARN, 'WRN', arguments);
    },

    error: function () {
      return logEntry.call(this, thresholds.ERROR, 'ERR', arguments);
    },

    time: function( group) {
      if( this.timing) {
        console.time(getGroupName.call(this,group));
      }
    },

    timeEnd: function( group) {
      if( this.timing) {
        console.timeEnd(getGroupName.call(this,group));
      }
    },

    getObjectName: function (object) {
      return object != null ? Object.getPrototypeOf(object).constructor.name :
        object === undefined ? 'undefined' : object === null ? 'null' : '';
    },

    getStackTrace: function (frameCountToSkip) {
      var stack;
      try {
        throw new Error();
      } catch (error) {
        stack = error.stack;
      }
      if (stack) {
        var lines = stack.split('\n');
        if (lines && lines.length>0) {
          if (!lines[0].match(/\.js/)) {
            lines = lines.slice(1);
          }
          stack = lines.slice(frameCountToSkip === 0 ? 0 : (frameCountToSkip || 1)).join('\n');
        }
      } else {
        stack = 'at unknown place (no stack trace available)';
      }
      return stack;
    }
  };

  function logEntry(level, prefix, args) {
    if (enabled && this._threshold <= level) {
      var message = formatMessage.apply(this, args);
      if (loggerEnabled) {
        if (logger) {
          if (bufferedEntries) {
            for (var i = 0, l = bufferedEntries.length; i < l; ++i) {
              var entry = bufferedEntries[i];
              logger[methods[entry[0]]](entry[1]);
            }
            bufferedEntries = null;
          }
          logger[methods[prefix]](message);
        } else {
          bufferedEntries.push([prefix, message]);
        }
      }
      if (consoleEnabled) {
        this.last = prefix + '  ' + message;
        return true;
      }
    }
    return false;
  }

  function matchModule(pattern, target) {
    // Handle alone wildcards separately; they are handled depending on their
    // combination with slash (module path separator) below
    if (pattern === '**') {
      pattern = '.*';
    } else if (pattern === '*') {
      pattern = '[^/]*';
    } else {
      pattern = pattern.replace(/^\*(?!\*)/g, '#'); // '*some...'
      pattern = pattern.replace(/([^*])\*$/g, '$1#'); // '...some*'
      pattern = pattern.replace(/\/\*(?!\*)/g, '/#'); // '.../*some'
      pattern = pattern.replace(/([^*])\*\//g, '$1#/'); // 'some*/...'
      pattern = pattern.replace(/\/\*\*/g, '(?:/.*)?'); // '.../**'
      pattern = pattern.replace(/\*\*\//g, '(?:.*/)?'); // '**/...'
      // If we put the pattern with asterisks at once there, following
      // replacements would process it again and it would be too complicated
      // to avoid it; for example, JavaScript knows no look-behind assertions
      pattern = pattern.replace(/#/g, '[^/]*'); // '[^/]+' -> '[^/]*'
    }
    pattern = '^' + pattern + '$';
    return new RegExp(pattern).test(target);
  }

  function getThreshold(level) {
    var threshold = thresholds[(level || 'WARN').toUpperCase()];
    if (!threshold) {
      throw new Error('invalid log level: "' + level + '".');
    }
    return threshold;
  }

  function formatMessage(message) {
    if (message !== undefined) {
      if (typeof message === 'string') {
        message = _.str.sformat.apply(this, arguments);
      } else {
        message = message !== null ? message.toString() : 'null';
      }
      if (config.performanceTimeStamp) {
        message = getTimePerformanceStamp() + message;
      }
      if (config.moduleNameStamp && this._target) {
        message += ' (' + this._target + ')';
      }
    } else {
      message = '';
    }
    return message;
  }

  function getTimePerformanceStamp() {
    var seconds = (window.performance.now() / 1000 % 10).toFixed(3);
    return '[' + seconds + '] ';
  }

  function getGroupName ( group) {
    if( this._target) {
      group = _.str.sformat( '[{0}] {1}', this._target, group);
    }
    return group;
  }

  _.extend(log, prototype);
  _.extend(log.prototype, prototype);

  return log;

});

csui.define('nuc/utils/url',[
  'nuc/lib/underscore', 'nuc/lib/jquery'
], function (_, $) {
  'use strict';

  function Url(url) {
    this.raw = url;
  }

  Url.prototype = {
    raw: undefined,

    isValid: function () {
      return this.raw ? this.raw.match(Url.re_weburl) : false;
    },

    isAbsolute: function () {
      return this.raw ? this.raw.match(/^.*\/\//) : false;
    },

    getAbsolute: function () {
      if (this.isAbsolute()) {
        return this.raw;
      }
      // IE11 on Windows 10 2015 LTSB does not implement location.origin.
      // Additional robustness for FF browser returning string 'null' instead of 'file://' .
      var origin = (location.origin && location.origin.indexOf('://') > 0) ? location.origin : new Url(location.href).getOrigin();
      return Url.combine(origin, this.raw);
    },

    getProtocol: function () {
      var url = this.isAbsolute() && this.raw.indexOf('//') !== 0 ?
                this.raw : window.location.href;
      return url.toLowerCase().substring(0, url.indexOf(':'));
    },

    getHost: function () {
      var match = this.getAbsolute().match(/^.*\/\/([^:\/]+)/);
      return match && match[1];
    },

    getPort: function () {
      var url = this.getAbsolute().toLowerCase(),
          start = url.match(/^.*\/\/([^\/]+)/),
          port = start && start[1].match(/:([^\/]+)/);
      return port ? parseInt(port[1], 10) : url.indexOf('https') === 0 ? 443 : 80;
    },

    getOrigin: function () {
      var match = this.getAbsolute().match(/^.*\/\/[^\/]+/);
      return match && match[0];
    },

    getPath: function () {
      var match = this.getAbsolute().match(/^.*\/\/[^\/]+(\/[^?]+)/);
      return match && match[1];
    },

    getVirtualDirectory: function () {
      var match = this.getAbsolute().match(/^.*\/\/[^\/]+\/[^\/]+/);
      return match && match[0];
    },

    getCgiScript: function () {
      var url = this.getAbsolute();
      // find the index of the "/api/v1" suffix in the URL.
      var apiSuffix = url.length - 7;
      if (url.charAt(this.raw.length - 1) === '/') {
        --apiSuffix;
      }
      if (url.lastIndexOf('/api/v1') === apiSuffix) {
        return url.substr(0, apiSuffix);
      }
      // Original functionality expecting always
      // "/folder/script" before "/api/v1" on the URL path.
      var match = url.match(/^.*\/\/[^\/]+\/[^\/]+\/[^\/]+/);
      return match && match[0];
    },

    getQuery: function () {
      var match = this.getAbsolute().match(/\?(.+)/);
      return match && match[1];
    },

    getApiBase: function (version) {
      version || (version = 'v1');
      typeof version === 'number' && (version = 'v' + version);
      return this.getCgiScript() + '/api/' + version + '/';
    },

    makeAbsoluteUrl: function (relativeUrl, defaultUrlPath) {
      if (!relativeUrl.match(/^\w+:\/\//)) {
        var firstCharacter = relativeUrl.charAt(0);
        if (firstCharacter === '/') {
          if (relativeUrl.charAt(1) === '/') {
            return this.getProtocol() + ':' + relativeUrl;
          }
          return Url.combine(this.getOrigin(), relativeUrl);
        } else if (firstCharacter === '?') {
          return this.getCgiScript() + relativeUrl;
        } else {
          if (!defaultUrlPath) {
            defaultUrlPath = this.getCgiScript();
          }
          return Url.combine(defaultUrlPath, relativeUrl);
        }
      }
      return relativeUrl;
    },

    toString: function () {
      return this.raw;
    }
  };
  Url.version = '1.0';

  Url.combine = function () {
    var url = '';
    for (var i = 0; i < arguments.length; ++i) {
      var part = arguments[i],
          path = part !== undefined && part !== null ? part.toString() : '';
      // IE8 does not support accessing string characters as an array (path[0]).
      if (path.charAt(0) == '/') {
        url += url && url.charAt(url.length - 1) == '/' ? path.substring(1) :
               path;
      } else {
        if (i > 0 && !(url && url.charAt(url.length - 1) == '/') &&
            path.length > 0) {
          url += '/';
        }
        url += path;
      }
    }
    return url;
  };

  Url.makeMultivalueParameter = function (name, values) {
    if (values && values.length) {
      values = _.map(values, encodeURIComponent);
      return name + '=' + values.join('&' + name + '=');
    }
    return '';
  };

  // Supports either object literals {param: value, ...}
  // or already serialized strings 'param=value[&...]'
  Url.combineQueryString = function () {
    var query = {},
        i, part;
    for (i = 0; i < arguments.length; ++i) {
      part = arguments[i];
      if (_.isObject(part)) {
        _.extend(query, part);
      }
    }
    // Use traditional array serialization - without appending
    // the '[]' at the end of the property name
    query = $.param(query, true);
    for (i = 0; i < arguments.length; ++i) {
      part = arguments[i];
      if (_.isString(part) && part) {
        if (query) {
          query += '&';
        }
        query += part;
      }
    }
    return query;
  };

  Url.appendQuery = function (url, query) {
    if (query) {
      if (url.indexOf('?') >= 0) {
        var lastCharacter = url[url.length - 1];
        if (lastCharacter !== '?' && lastCharacter !== '&') {
          url += '&';
        }
      } else {
        url += '?';
      }
      url += query;
    }
    return url;
  };

  // get the url params from a url or a uri with or without a hash.
  Url.urlParams = function (url) {
    if (url) {
      var hashIndex = url.indexOf('#'),
          urlParamsIndex = url.indexOf('?');
      if (urlParamsIndex !== -1) {
        return $.parseParams(url.substring(urlParamsIndex, hashIndex === -1 ? url.length : hashIndex));
      }
    }
    return {};
  };

  Url.mergeUrlParams = function (url, paramToAddStr, paramsToRemoveArray) {
    var urlParams = Url.urlParams(url),
        toRemoveAll = paramsToRemoveArray.concat(_.keys(urlParams)),
        newParams = _.omit($.parseParams(paramToAddStr), toRemoveAll);
    return $.param(newParams);
  };

  //
  // Regular Expression for URL validation
  //
  // Author: Diego Perini
  // Updated: 2010/12/05
  // License: MIT
  //
  // Copyright (c) 2010-2013 Diego Perini (http://www.iport.it)
  //
  // Permission is hereby granted, free of charge, to any person
  // obtaining a copy of this software and associated documentation
  // files (the "Software"), to deal in the Software without
  // restriction, including without limitation the rights to use,
  // copy, modify, merge, publish, distribute, sublicense, and/or sell
  // copies of the Software, and to permit persons to whom the
  // Software is furnished to do so, subject to the following
  // conditions:
  //
  // The above copyright notice and this permission notice shall be
  // included in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  // EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  // OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  // NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  // HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  // WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  // FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  // OTHER DEALINGS IN THE SOFTWARE.
  //
  // the regular expression composed & commented
  // could be easily tweaked for RFC compliance,
  // it was expressly modified to fit & satisfy
  // these test for an URL shortener:
  //
  //   http://mathiasbynens.be/demo/url-regex
  //
  // Notes on possible differences from a standard/generic validation:
  //
  // - utf-8 char class take in consideration the full Unicode range
  // - TLDs have been made mandatory so single names like "localhost" fails
  // - protocols have been restricted to ftp, http and https only as requested
  //
  // Changes:
  //
  // - IP address dotted notation validation, range: 1.0.0.0 - 223.255.255.255
  //   first and last IP address of each class is considered invalid
  //   (since they are broadcast/network addresses)
  //
  // - Added exclusion of private, reserved and/or local networks ranges
  //
  // - Made starting path slash optional (http://example.com?foo=bar)
  //
  // - Allow a dot (.) at the end of hostnames (http://example.com.)
  //
  // Compressed one-line versions:
  //
  // Javascript version
  //
  // /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i
  //
  // PHP version
  //
  // _^(?:(?:https?|ftp)://)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\x{00a1}-\x{ffff}0-9]-*)*[a-z\x{00a1}-\x{ffff}0-9]+)(?:\.(?:[a-z\x{00a1}-\x{ffff}0-9]-*)*[a-z\x{00a1}-\x{ffff}0-9]+)*(?:\.(?:[a-z\x{00a1}-\x{ffff}]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$_iuS
  //
  Url.re_weburl = new RegExp(
      '^' +
      // protocol identifier
      '(?:(?:https?|ftp)://)' +
      // user:pass authentication
      '(?:\\S+(?::\\S*)?@)?' +
      '(?:' +
      // IP address exclusion
      // private & local networks
      '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
      '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
      '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broacast addresses
      // (first & last IP address of each class)
      '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
      '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
      '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
      '|' +
      // host name
      '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
      // domain name
      '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
      // TLD identifier
      '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' +
      // TLD may end with dot
      '\\.?' +
      ')' +
      // port number
      '(?::\\d{2,5})?' +
      // resource path
      '(?:[/?#]\\S*)?' +
      '$', 'i'
  );

  return Url;
});

csui.define('nuc/utils/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('nuc/utils/impl/nls/root/lang',{

  // base
  ColumnMemberName2: "{1} {0}",
  ColumnMemberName3: "{1} {2} {0}",
  sizeInBytes: "{0} bytes",

  // errormessage, messagehelper
  ErrorUnknown: "Unknown error.",
  InvalidResponse: "Invalid response received.",
  ErrorStatusConfirm: "Confirm",
  ErrorStatusError: "Error",
  ErrorStatusWarning: "Warning",
  ErrorStatusHint: "Hint",
  ErrorStatusInformation: "Information",
  ErrorHtmlTpl: "<span class='msgIcon <%= statusPlain %>Icon'><%= statusNice %>: <%= msg %></span><br>",
  ErrorStringTpl: "<%= statusNice %>: <%= msg %>;\n",

  // connector
  AuthenticationFailureDialogTitle: "Authentication failure",
  SessionExpiredDialogTitle: "Session expired",
  AuthenticationFailureDialogText: "The page will be reloaded and you may need to sign in again.",

  NetworkError: "Network communication failed.",
  resourceConflict: 'Due to an edit conflict, your changes could not be saved. Another user has changed the same object. Reload the page to reflect the latest changes.',

});


csui.define('nuc/utils/errormessage',["module", "nuc/lib/jquery", "nuc/lib/underscore",
  "nuc/lib/backbone", "nuc/utils/log", "nuc/utils/url",
  'i18n!nuc/utils/impl/nls/lang'
], function (module, $, _, Backbone, log, Url, lang) {
  "use strict";

  // MessageType
  // -----------

  var Type = {
    Confirm: 0,
    Error: 1,
    Warning: 2,
    Hint: 3,
    Info: 4
  };

  // Message
  // -------

  var Message = Backbone.Model.extend({

    constructor: function Message(attributes) {
      //debugger;
      Backbone.Model.prototype.constructor.apply(this, arguments);
      if (attributes instanceof Error) {
        this.attributes.message = attributes.message;
        this.attributes.name = attributes.name;
      }
    },

    defaults: {
      type: Type.Error,
      name: '',
      message: lang.ErrorUnknown
    },

    getType: function () {
      return this.get('type');
    },

    getName: function () {
      return this.get('name');
    },

    getMessage: function () {
      return this.get('message');
    }
  });

  // ErrorMessage
  // ------------

  var ErrorMessage = Message.extend({
    constructor: function ErrorMessage(attributes) {
      Message.Message.prototype.constructor.apply(this, arguments);
    },

    defaults: {
      type: Type.Error,
      message: lang.ErrorUnknown
    }
  });

  // RequestErrorMessage
  //--------------------

  var RequestErrorMessage = ErrorMessage.extend({
    defaults: {
      statusCode: undefined,
      statusText: undefined,
      errorDetails: undefined
    },

    constructor: function RequestErrorMessage(error) {
      Message.ErrorMessage.prototype.constructor.apply(this, arguments);
      if (error) {
        if (error.status != null) {
          // Allow passing in a jQuery request object for convenience.
          this.statusCode = error.status;
          this.statusText = error.statusText;
          if (error.responseText) {
            try {
              error.responseJSON = JSON.parse(error.responseText);
            } catch (failure) {
              log.warn("Parsing error response failed: {0}.", failure)
              && console.warn(log.last);
            }
          }
          if (error.responseJSON) {
            var data = error.responseJSON;
            this.message = data && data.error;
            if (!this.message) {
              this.message = error.responseText;
            }
            this.errorDetails = data && data.errorDetail;
          }
          if (!this.message) {
            if (this.statusCode === 0) {
              this.message = lang.NetworkError;
            } else {
              this.message = lang.InvalidResponse;
            }
          }
          if (error.settings && error.settings.url) {
            this.method = error.settings.type;
            this.url = error.settings.url;
          }
        } else if (typeof error.error === 'object') {
          // Allow passing in a data object with error description for convenience.
          this.message = error.error;
          this.errorDetails = error.errorDetail;
        } else if (error instanceof Backbone.Model) {
          // Allow passing an Model for convenience, but this is filled with Error data. weird.
          this.message = error.message || error.get('error');
          this.errorDetails = error.errorDetails || error.errorDetail || error.get('errorDetails') || error.get('errorDetail');
        } else if (error instanceof Error) {
          // Allow passing an Error instance for convenience.
          this.message = error.message;
        } else {
          // Expect the attributes of this error object passed in.
          _.extend(this, error);
        }
      }
    }

  });

  RequestErrorMessage.prototype.toString = function () {
    var punctuation = /[.!?:;,]$/;
    var trim = /\s+$/;
    var message = "";
    if (this.message) {
      message = this.message;
      message.replace(trim, "");
      if (!message.match(punctuation)) {
        message += ".";
      }
    }
    if (this.errorDetails) {
      if (message) {
        message += "\r\n";
      }
      message += this.errorDetails;
      message.replace(trim, "");
      if (!message.match(punctuation)) {
        message += ".";
      }
    }
    if (!message) {
      if (this.statusText) {
        if (message) {
          message += "\r\n";
        }
        message += this.statusText;
      }
      if (this.statusCode > 0) {
        if (message) {
          message += "\r\n ";
        }
        message += "(" + this.statusCode + ")";
      }
    }
    if (!message) {
      message = lang.ErrorUnknown;
    }
    return message;
  };

  RequestErrorMessage.version = '1.0';

  // Exports
  // -------

  Message = {
    verion: '1.0',
    Type: Type,
    Message: Message,
    ErrorMessage: ErrorMessage,
    RequestErrorMessage: RequestErrorMessage
  };

  return Message;

});

csui.define('nuc/utils/messagehelper',["module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone",
  "nuc/utils/log", "nuc/utils/errormessage", 'i18n!nuc/utils/impl/nls/lang'
], function (module, $, _, Backbone, log, Message, Lang) {
  "use strict";

  log = log(module.id);

  // MessageHelper
  // ------------

  var ts = "0.3s";
  // as we implement animation fix for top property, we use styles here and not css classes.
  var animationShow = {"-webkit-transition": "top " + ts, "transition": "top " + ts};
  var animationHide = {"-webkit-transition": "top " + ts, "transition": "top " + ts};
  var animationNone = {"-webkit-transition": "", "transition": ""};
  var animationFadeOut = {
    "-webkit-transition": "opacity " + ts,
    "transition": "opacity " + ts
  };

  var MessageHelper = Backbone.Collection.extend({
    model: Message.Message,
    title: '',

    showMessages: function (reset, show) {
      log.warn(
          'This method has been deprecated and will be removed in future. ' +
          'Please, use ModalAlert or GlobalMessage to report errors.')
      && console.warn(log.last);

      var title = this.getErrorMessage(this.getStatus()),
          showit = (show !== undefined) ? show : true;

      this.trigger("showErrors", this.groupBy('type'), this.toHtml(), title,
          showit);
      reset && this.reset();
    },

    getErrorMessage: function (status) {
      switch (status) {
        case 0: return Lang.ErrorStatusConfirm;
        case 1: return Lang.ErrorStatusError;
        case 2: return Lang.ErrorStatusWarning;
        case 3: return Lang.ErrorStatusHint;
        case 4: return Lang.ErrorStatusInformation;
      }
    },

    addMessage: function (txt, type, title) {
      this.title = title || '';
      type = type || Message.Type.Error;
      var msg = new Message.Message({
        type: type,
        message: txt
      });
      return this.add([msg]);
    },

    showErrors: function (reset, show) {
      return this.showMessages(reset, show);
    },

    addError: function (error) {
      var errmsg = new Message.ErrorMessage();
      errmsg.message = error.message;
      return this.add([errmsg]);
    },

    addErrorMessage: function (errorts) {
      return this.add([errorts]);
    },

    getStatus: function () {
      return this.sortBy('type')[0].get('type');
    },

    clear: function () {
      return this.reset();
    },

    hasMessages: function () {
      return (this.length > 0);
    },

    getMessages: function () {
      return this.groupBy('type');
    },

    toHtml: function () {
      var template = _.template(Lang.ErrorHtmlTpl),
          html = [];

      _.each(this.groupBy('type'), function (msgType) {
        _.each(msgType.reverse(), function (msg) {
          html += template({
            statusPlain: _.keys(Message.Type)[msg.get('type')],
            statusNice: this.getErrorMessage(msg.get('type')),
            msg: msg.get('message')
          });
        }, this);
      }, this);

      return html;
    },

    removeField: function (viewel, selector, values) {
      var elem = viewel.find(selector);
      values.forEach(function (oldval) {
        var oldclass = selector + "-" + oldval;
        var oldel = elem.find(oldclass);
        if (!oldel.hasClass("binf-hidden")) {
          oldel.addClass("binf-hidden");
        }
      });
    },
    switchField: function (viewel, selector, value, values) {
      var elem = viewel.find(selector);
      var newclass = selector + "-" + value;
      var newel = elem.find(newclass);
      var changed = false;
      if (newel.hasClass("binf-hidden")) {
        values.forEach(function (oldval) {
          var oldclass = selector + "-" + oldval;
          if (newclass != oldclass) {
            var oldel = elem.find(oldclass);
            if (!oldel.hasClass("binf-hidden")) {
              oldel.addClass("binf-hidden");
            }
          }
        });
        newel.removeClass("binf-hidden");
        changed = true;
      }
      return {changed: changed, element: newel};
    },

    transitionEnd: _.once(
        function () {
          var transitions = {
                transition: 'transitionend',
                WebkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd otransitionend'
              },
              element = document.createElement('div'),
              transition;
          for (transition in transitions) {
            if (typeof element.style[transition] !== 'undefined') {
              return transitions[transition];
            }
          }
        }
    ),

    createPanel: function (globals, Panel, options, oldPanel) {
      var newPanel = new Panel(options);
      newPanel.$el.removeClass("binf-panel binf-panel-default");
      newPanel.$el.addClass("csui-global-message");
      globals.classNames && newPanel.$el.addClass(globals.classNames);

      // render panel
      newPanel.render();

      // take state from old panel
      if (oldPanel) {
        if (oldPanel.$el.hasClass("binf-hidden") !=
            newPanel.$el.hasClass("binf-hidden")) {
          newPanel.$el.toggleClass("binf-hidden");
        }
        var collapsed = oldPanel.$el.hasClass("csui-collapsed");
        if (collapsed != newPanel.$el.hasClass("csui-collapsed")) {
          if (collapsed) {
            newPanel.doCollapse(false);
          } else {
            newPanel.doExpand(false);
          }
        }
      }
      return newPanel;
    },

    activatePanel: function (newPanel, relatedView, parentView, oldPanel) {
      if (!oldPanel && !newPanel.$el.hasClass("binf-hidden")) {
        // if we need to animate, add it hidden and then show it animated
        newPanel.$el.addClass("binf-hidden");
        newPanel.$el.appendTo(parentView.el);
        newPanel.doShow(relatedView, parentView);
      } else {
        if (relatedView) {
          this.resizePanel(newPanel, relatedView);
        }
        newPanel.$el.appendTo(parentView.el);
        if (oldPanel) {
          oldPanel.destroy();
        }
      }
      return newPanel;
    },

    showPanel: function (view, relatedView, parentView) {
      if (view.$el.hasClass("binf-hidden")) {
        var self = this,
            slideSize = this.getTargetSizes(parentView.$el);
        var panel = _.extend({
          csuiBeforeShow: function () {
            if (relatedView) {
              var panelSize = self.getTargetSizes(relatedView.$el);
              self.setPanelHeight(view, panelSize);
            }
          }
        }, view);
        this.slidedown(panel, view.$el, view.$el, slideSize);
      }
    },

    slidedown: function (view, elem, hidden, sizes) {
      // Do not slide the element from too far; at most the element height
      var distance, elemHeight;
      hidden = hidden || elem;

      view.$el === elem || view.$el.removeClass("csui-collapsed");
      view.$el.removeClass(view.$el === elem ? "csui-hiding" : "csui-collapsing");
      view.$el.addClass(view.$el === elem ? "csui-showing" : "csui-expanding");
      if (view.csuiBeforeShow) {
        view.csuiBeforeShow();
      }

      var position = elem.css("position");
      if (hidden.hasClass("binf-hidden")) {
        // first be sure, that no animation delays any settings, while panel is hidden
        elem.css(animationNone);
        elem.addClass('position-hidden');
        // prepare view for animation
        if (elem !== hidden) {
          elemHeight = elem.height();
          distance = Math.round(Math.min(sizes.height - sizes.top, elemHeight));
          elem.css({
            "bottom": "calc(100% - " + (sizes.top + distance) + "px)"
          });
        }
        // when now making the element visible, the browser layouts the element but the bottom is
        // forced where it was before
        hidden.removeClass("binf-hidden");
        elemHeight = elem.height();
        // now switch to set the top property without moving the element.
        var rect = this.getTargetSizes(elem);
        if (position === "relative") {
          distance = Math.round(Math.min(sizes.height - rect.height, elemHeight));
          elem.css({
            "top": distance + "px"
          });
        } else /* if (position==="absolute") */ {
          distance = Math.round(Math.min(rect.top, sizes.top + elemHeight));
          elem.css({
            "top": distance + "px"
          });
        }
        elem.removeClass('position-hidden');
        elem.addClass('position-show');
        var pos = elem.position(); // just access property, so browser updates element
      }
      elem.one(this.transitionEnd(), function () {
        if (view.$el === elem ? "csui-showing" : "csui-expanding") {
          elem.css(animationNone);
          view.$el.removeClass(view.$el === elem ? "csui-showing" : "csui-expanding");
          if (view.csuiAfterShow) {
            view.csuiAfterShow();
          }
        }
      });
      // trigger animation by setting the top property to its initial value
      if (position === "relative") {
        elem.css(_.extend({"top": "0px"}, animationShow));
      } else /* if (position==="absolute") */ {
        elem.css(_.extend({"top": sizes.top + "px"}, animationShow));
      }

      return view;
    },

    expandPanel: function (view, details, hidden, animated) {
      hidden = hidden || details;
      if (view.$el.hasClass("csui-collapsed") || hidden.hasClass("binf-hidden") ||
          view.$el.hasClass("csui-collapsing")) {
        animated = (animated === true || animated === undefined) ? true : false;
        if (animated) {
          this.slidedown(view, details, hidden, this.getTargetSizes(details));
        }
        else {
          view.$el.removeClass("csui-collapsed");
          hidden.removeClass("binf-hidden");
        }
      }
    },

    hidePanel: function (view) {
      if (!view.$el.hasClass("binf-hidden")) {
        this.slideup(view, view.$el, view.$el);
      }
    },

    slideup: function (view, elem, hidden) {

      hidden = hidden || elem;
      // hide panel with slide up animation. does only make sense if element is not hidden.
      var position = elem.css("position");
      view.$el.removeClass(view.$el === elem ? "csui-showing" : "csui-expanding");
      view.$el.addClass(view.$el === elem ? "csui-hiding" : "csui-collapsing");
      if (view.csuiBeforeHide) {
        view.csuiBeforeHide();
      }
      elem.one(this.transitionEnd(), function () {
        if (view.$el.hasClass(view.$el === elem ? "csui-hiding" : "csui-collapsing")) {
          hidden.addClass("binf-hidden");
          elem.css(_.extend({"top": "", "bottom": ""}, animationNone));
          view.$el.removeClass(view.$el === elem ? "csui-hiding" : "csui-collapsing");
          view.$el === elem || view.$el.addClass("csui-collapsed");
          if (view.csuiAfterHide) {
            view.csuiAfterHide();
          }
        }
      });
      var rect = this.getTargetSizes(elem);
      if (position === "relative") {
        elem.css({"top": "0px"});
      } else /* if (position==="absolute") */ {
        elem.css({"top": rect.top + "px"});
      }
      var pos = elem.position(); // just access property, so browser updates element
      // check whether wie have a minimum height, where we should stop the slideup
      var min_top = 0;
      var idattr = elem.attr("id");
      if (idattr && elem.hasClass("csui-minheight")) {
        var heightSource = elem.find("." + idattr + "-heightsource");
        if (heightSource.length > 0) {
          min_top = heightSource.outerHeight();
        }
      }
      // trigger animation by setting the property
      elem.css(
          _.extend({"top": Math.round((parseInt(min_top) - rect.height)) + "px"}, animationHide));
      return elem;
    },

    collapsePanel: function (view, details, hidden, animated) {
      hidden = hidden || view.$el;
      if (!view.$el.hasClass("csui-collapsed") || !hidden.hasClass("binf-hidden") ||
          view.$el.hasClass("csui-expanding")) {
        animated = (animated === true || animated === undefined) ? true : false;
        if (animated) {
          this.slideup(view, details, hidden);
        }
        else {
          view.$el.addClass("csui-collapsed");
          hidden.addClass("binf-hidden");
        }
      }
    },

    fadeoutPanel: function (view) {

      // hide panel with fade out animation. does only make sense if element is not hidden.
      var opacity = view.$el.css("opacity") || "1";
      view.$el.css({"opacity": opacity});
      // prepare view for animation
      view.$el.one(this.transitionEnd(), function () {
        view.$el.addClass("binf-hidden");
        view.$el.css(_.extend({"opacity": ""}, animationNone));
        if (view.csuiAfterHide) {
          view.csuiAfterHide();
        }
      });
      var opq = view.$el.css("opacity"); // just access property, so browser updates element
      // trigger animation by setting the property
      view.$el.css(_.extend({"opacity": "0.0"}, animationFadeOut));
      return view;
    },

    resizePanel: function (view, location) {
      if (location) {
        var sizes = this.getTargetSizes(location.$el);
        this.setPanelHeight(view, sizes);
      }
      view.doResize && view.doResize();
    },

    getTargetSizes: function (location) {
      if (location) {
        var rect = location[0].getBoundingClientRect();
        return _.extend({width: rect.width, height: rect.height}, location.position());
      } else {
        return {left: 0, top: 0, width: 333, height: 63};
      }
    },

    setPanelHeight: function (view, sizes) {
      view.$el.find(".csui-height-target").height(sizes.height);
      return view;
    }

  });

  MessageHelper.prototype.toString = function () {
    var template = _.template(Lang.ErrorStringTpl),
        html = [];

    _.each(this.groupBy('type'), function (msgType) {
      _.each(msgType, function (msg) {
        html += template({
          statusPlain: _.keys(Message.Type)[msg.get('type')],
          statusNice: this.getErrorMessage(msg.get('type')),
          msg: msg.get('message')
        });
      }, this);
    }, this);

  };

  MessageHelper.version = '1.0';

  // activate eventing on error handler
  _.extend(MessageHelper, Backbone.Events);

  // Exports
  // -------

  return MessageHelper;

});

csui.define('nuc/utils/types/date',[
  'module', 'nuc/lib/underscore', 'nuc/lib/moment',
  'nuc/lib/moment-timezone'
], function (module, _, moment) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
    .config['nuc/utils/base'] || {};
  config = _.extend({
    friendlyDateTime: true,
    friendlyTime: true,
    friendlyDate: true,
    formatIsoDateTimeInUtc: false,
    formatIsoDateTimeInTimeZone: undefined
  }, config, module.config());

  var momentDateFormat     = config.dateFormat || 'L',
      momentTimeFormat     = config.timeFormat || 'LTS',
      momentDateTimeFormat = config.dateTimeFormat || momentDateFormat + ' ' + momentTimeFormat,
      exactDateFormat      = getExactFormat(momentDateFormat),
      exactTimeFormat      = getExactFormat(momentTimeFormat),
      exactDateTimeFormat  = getExactFormat(momentDateTimeFormat);

  // Moment's longDateFormat need the formatting parts like "L" otr "LTS"
  // separately; it does not accept a combined string
  function getExactFormat(momentFormat) {
    var formatters     = /\w+/g,
        explicitFormat = momentFormat,
        shift          = 0,
        match, part, partFormat, index;
    while ((match = formatters.exec(momentFormat))) {
      part = match[0];
      partFormat = moment.localeData().longDateFormat(part);
      // Skip words in the format, which are not moment's tokens
      if (partFormat) {
        index = match.index + shift;
        explicitFormat = explicitFormat.substring(0, index) + partFormat +
                         explicitFormat.substring(index + part.length);
        shift += partFormat.length - part.length;
      }
    }
    // If the format was expanded, try it once more, in case moment
    // placeholders were used recursively like "LT:ss"
    return explicitFormat !== momentFormat ?
      getExactFormat(explicitFormat) : explicitFormat;
  }

  // static helper methods

  function pad(n) {
    return n < 10 ? '0' + n : n;
  }

  // Creates a new moment object in the local (client) time zone
  // from a string in the ISO 8601 format sent by the server, or
  // from a Date object instance, or from a Moment instance.
  function createMoment(text) {
    // Checks if the text, which should be in the ISO 8601 format,
    // ends with the UTC identifier or a time zone offset.
    function includesTimeZone(text) {
      var length = text.length;
      if (length > 19) {
        if (text.charAt(length - 1) === 'Z') {
          return true;
        }
        var direction = text.charAt(length - 5);
        if (direction === '+' || direction === '-') {
          return true;
        }
      }
    }

    if (text instanceof moment) {
      return text;
    }
    if(text instanceof Date) {
      return moment(text);
    }
    return config.formatIsoDateTimeInTimeZone && !includesTimeZone(text) ?
           moment.tz(text, config.formatIsoDateTimeInTimeZone) : moment(text);
  }

  // Parses the text in the ISO 8601 format as sent by the server
  // to a Date object instance in the local (client) time zone.
  function deserializeDate(text) {
    return text && createMoment(text).toDate();
  }

  // Formats the date in the local (client) time zone to a sub-set
  // of ISO 8601 for the server.
  function serializeDateTime(date, format, callback) {
    function formatDateTime(date, suffix) {
      // CS does not accept te standard ISO value returned
      // by toISOString, which includes milliseconds.
      return date.year() + '-'
             + pad((date.month() + 1)) + '-'
             + pad(date.date()) + 'T'
             + pad(date.hours()) + ':'
             + pad(date.minutes()) + ':'
             + pad(date.seconds()) + suffix;
    }

    format || (format = exactDateTimeFormat);
    var parsed = moment(date, format, true);
    if (!parsed.isValid()) {
      if (!!callback) {
        callback();
      } else {
        throw new Error('Parsing date value "' + date +
                        '" as "' + format + '" failed.');
      }
    }

    if (config.formatIsoDateTimeInUtc) {
      return formatDateTime(parsed.utc(), 'Z');
    }

    if (config.formatIsoDateTimeInTimeZone) {
      return formatDateTime(parsed.tz(config.formatIsoDateTimeInTimeZone), '');
    }

    return formatDateTime(parsed, '');
  }

  // Formats the date to a sub-set of ISO 8601 - only the date part.
  function serializeDate(date, format, callback) {
    format || (format = exactDateFormat);
    var parsed = moment(date, format, true);
    if (!parsed.isValid()) {
      if (!!callback) {
        callback();
      } else {
        throw new Error('Parsing date value "' + date +
                        '" as "' + format + '" failed.');
      }
    }
    return parsed.year() + '-'
           + pad((parsed.month() + 1)) + '-'
           + pad(parsed.date());
  }

  function validateDate(date, format) {
    return moment(date, format || exactDateFormat, true).isValid();
  }

  function validateDateTime(date, format) {
    return moment(date, format || exactDateTimeFormat, true).isValid();
  }

  function formatDate(date) {
    return config.friendlyDate ? formatFriendlyDate(date) : formatExactDate(date);
  }

  function formatDateTime(date) {
    return config.friendlyDateTime ? formatFriendlyDateTime(date) :
           formatExactDateTime(date);
  }

  function formatExactDate(date) {
    return date ? createMoment(date).format(exactDateFormat) : '';
  }

  function formatExactTime(date) {
    return date ? createMoment(date).format(exactTimeFormat) : '';
  }

  function formatExactDateTime(date) {
    return date ? createMoment(date).format(exactDateTimeFormat) : '';
  }

  function formatFriendlyDate(date) {
    return date ? createMoment(date).calendar() : "";
  }

  function formatFriendlyDateTime(date) {
    return date ? createMoment(date).calendar() : "";
  }

  function formatFriendlyDateTimeNow(date) {
    return date ? createMoment(date).fromNow() : "";
  }

  function formatISODate(date) {
    return date ? moment.utc(date).toISOString() : "";
  }

  function formatISODateTime(date) {
    return date ? moment(date).toISOString() : "";
  }

  return {
    exactDateFormat: exactDateFormat,
    exactTimeFormat: exactTimeFormat,
    exactDateTimeFormat: exactDateTimeFormat,

    deserializeDate: deserializeDate,
    serializeDate: serializeDate,
    serializeDateTime: serializeDateTime,

    validateDate: validateDate,
    validateDateTime: validateDateTime,

    formatDate: formatDate,
    formatDateTime: formatDateTime,
    formatExactDate: formatExactDate,
    formatExactTime: formatExactTime,
    formatExactDateTime: formatExactDateTime,
    formatFriendlyDate: formatFriendlyDate,
    formatFriendlyDateTime: formatFriendlyDateTime,
    formatFriendlyDateTimeNow: formatFriendlyDateTimeNow,
    formatISODateTime: formatISODateTime,
    formatISODate: formatISODate,
  };
});

csui.define('nuc/utils/types/number',[
  'module', 'nuc/lib/underscore', 'nuc/lib/numeral',
  'i18n!nuc/utils/impl/nls/lang'
], function (module, _, numeral, lang) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
    .config['nuc/utils/base'] || {};
  config = _.extend({
    friendlyFileSize: true
  }, config, module.config());

  // Number.MAX_SAFE_INTEGER and Number.MIN_SAFE_INTEGER are not available in IE
  var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
  var MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -9007199254740991;

  function formatInteger(value, format) {
    format || '0';
    return numeral(value).format(format);
  }

  function formatIntegerWithCommas(value) {
    return formatInteger(value, '0,0');
  }

  function formatFileSize(size) {
    return config.friendlyFileSize ? formatFriendlyFileSize(size) :
           formatExactFileSize(size);
  }

  function formatFriendlyFileSize(size) {
    if (!_.isNumber(size)) {
      return '';
    }
    return size >= 1024 ? numeral(size).format('0 b') :
           formatExactFileSize(size);
  }

  function formatExactFileSize(size) {
    if (!_.isNumber(size)) {
      return '';
    }
    size = formatIntegerWithCommas(size);
    return _.str.sformat(lang.sizeInBytes, size);
  }

  return {
    formatInteger: formatInteger,
    formatIntegerWithCommas: formatIntegerWithCommas,
    
    formatFileSize: formatFileSize,
    formatFriendlyFileSize: formatFriendlyFileSize,
    formatExactFileSize: formatExactFileSize,
    MAX_SAFE_INTEGER: MAX_SAFE_INTEGER,
    MIN_SAFE_INTEGER: MIN_SAFE_INTEGER
  };
});

csui.define('nuc/utils/types/member',[
  'nuc/lib/underscore', 'nuc/lib/backbone',
   'i18n!nuc/utils/impl/nls/lang'
], function (_, Backbone, lang) {
  'use strict';

  function formatMemberName(member) {
    if (!member) {
      return '';
    }
    if (_.isNumber(member) || _.isString(member)) {
      return member.toString();
    }
    if (member instanceof Backbone.Model) {
      member = member.attributes;
    }
    if (member.display_name) {
      return member.display_name;
    }
    if (member.name_formatted) {
      return member.name_formatted;
    }
    var firstName  = member.first_name,
        lastName   = member.last_name,
        middleName = member.middle_name,
        name;
    if (firstName) {
      if (middleName) {
        name = _.str.sformat(lang.ColumnMemberName3, lastName, firstName, middleName);
      } else if (lastName) {
        name = _.str.sformat(lang.ColumnMemberName2, lastName, firstName);
      } else {
        name = firstName;
      }
    } else {
      name = lastName;
    }
    return name || member.name_formatted || member.name
           || member.id && member.id.toString() || '';
  }

  return {
    formatMemberName: formatMemberName
  };
});

csui.define('nuc/utils/types/localizable',[
  'nuc/lib/underscore', 'i18n' 
], function (_, i18n) {
  'use strict';

  var locale = i18n.settings.locale,
      language = locale.replace(/[-_]\w+$/, ''),
      defaultLocale = i18n.settings.defaultLocale,
      defaultLanguage = defaultLocale.replace(/[-_]\w+$/, '');

  function getClosestLocalizedString(value, fallback) {
    if (value == undefined) {   // undefined or null
      value = (fallback == undefined) ? null : fallback;
    } else if (_.isObject(value)) {
      // Normalize locale keys to 'll-cc' to be able to look up the right one;
      // the CS REST API uses non-standard 'll_CC' in multilingual metadata
      value = _.reduce(value, function (result, text, locale) {
        locale = locale.toLowerCase().replace('_', '-');
        result[locale] = text;
        return result;
      }, {});
      value = value[locale] || value[language] ||
              value[defaultLocale] || value[defaultLanguage] || fallback;
    }
    return value != null && value.toString() || '';
  }

  function localeCompareString(left, right, options) {
    options || (options = {});
    // Default is the search usage - ignore case, recognize transliterations
    var usage = options.usage || 'search',
        // Do not accept everything; this method ensures a consistent
        // behaviour of the product - it should not be freely customizable
        filteredOptions = {
          // Passing an undefined usage would even ignore differences in
          // accents, improving the search usage to the Google behaviour.
          // However, it stops the transliteration support, at least in
          // Chrome, unfortunately.  Transliteration is more important,
          // because it is needed by grammar, while omitting accents is
          // a workaround only, if you cannot type the characters with
          // accents on the keyboard.
          usage: usage,
          // Default for the search usage should be always base sensitivity,
          // but it depends on locale, which would confuse the user
          sensitivity: usage === 'search' ? 'base' : 'variant',
          // Number digits should not be normalized in string excerpts, when
          // searching, but when sorting, they should be handled as numbers
          numeric: usage !== 'search'
        };

    if (!left || !right) {
      return !left ? (!right ? 0 : 1) : -1;
    }

    if (left.localeCompare) {
      try {
        return left.localeCompare(right, locale, filteredOptions);
      } catch (error) {}
    }

    left = left.toLowerCase();
    right = right.toLowerCase();
    return left < right ? -1 : left > right ? 1 : 0;
  }

  function localeContainsString(hay, needle) {
    return localeIndexOfString(hay, needle) >= 0;
  }

  function localeEndsWithString(full, end) {
    // FIXME: How many maximum characters can the transliteration add?
    var fullLength = full.length,
        maxLength  = Math.min(fullLength, end.length * 3),
        i;
    for (i = 1; i <= maxLength; ++i) {
      if (localeCompareString(full.substring(fullLength - i), end) === 0) {
        return true;
      }
    }
  }

  function localeIndexOfString(hay, needle) {
    var difference = hay.length - needle.length + 1,
        i;
    for (i = 0; i <= difference; ++i) {
      if (localeStartsWithString(hay.substring(i), needle)) {
        return i;
      }
    }
    return -1;
  }

  function localeStartsWithString(full, start) {
    // FIXME: How many maximum characters can the transliteration add?
    var maxLength = Math.min(full.length, start.length * 3),
        i;
    for (i = 1; i <= maxLength; ++i) {
      if (localeCompareString(full.substring(0, i), start) === 0) {
        return true;
      }
    }
  }

  // After the formats parameter there can be additionally parameters specified. They must be of type "string"!
  //
  // We need for each message type 3 or 4 sentences. In many languages for multiple items there is an additional sentence required,
  // that means we need a sentence for one item ("ForOne"), for up to four items ("ForTwo") and for more items ("ForFive"). In english and german
  // the "ForTwo" and "ForFive" sentences are normally the same. We need also a "ForNone" sentence, if nothing is processed.
  //
  // For example czech (item = soubor):
  //    žádný soubor        => none (s0, optional)
  //    ---
  //    1 soubor            => one  (s1)
  //    ---
  //    2 soubory           => some (s2)
  //    3 soubory
  //    4 soubory
  //    ---
  //    5 souborů           => many (s5)
  //    6 souborů
  //    ...
  //    n souborů
  //    ---
  //    0 souborů           => manu (s5, fallback)
  //
  // formats[success].none = žádný soubor ... succeeded.
  // formats[success].one = 1 soubor ... succeeded.
  // formats[success].two = 3 soubory ... succeeded.
  // formats[success].five = 8 souborů ... succeeded.
  //
  // formats[failure].one = 1 soubor ... failed.
  // formats[failure].two = 3 soubory ... failed.
  // formats[failure].five = 8 souborů ... failed.
  // formats[failure].five = 0 souborů ... failed.
  //
  // formats[partial].two = 1 soubor ze 3 souborů ... failed.
  // formats[partial].five = 2 soubory z 15 souborů ... failed.
  //
  // Returns formatted message string.

  function formatMessage(count, messagesObj) {
    var SUCCESS_TYPE = "success";
    var ERROR_TYPE = "error";

    // get all additional parameters, except promises, options and formats
    var params = Array.prototype.slice.call(arguments, 2);
    var formatStr;

    if (count > 4) {
      formatStr = messagesObj.formatForFive;
    } else if (count > 1) {
      formatStr = messagesObj.formatForTwo;
    } else if (count > 0) {
      formatStr = messagesObj.formatForOne;
    } else {
      formatStr = messagesObj.formatForNone || messagesObj.formatForFive;
    }

    params.splice(0, 0, count.toString()); // insert count into params at index 0
    params.splice(0, 0, formatStr);        // insert formatStr into params at index 0
    var msg = _.str.sformat.apply(_.str, params);

    return msg;
  }

  return {
    getClosestLocalizedString: getClosestLocalizedString,

    localeCompareString: localeCompareString,
    localeContainsString: localeContainsString,
    localeEndsWithString: localeEndsWithString,
    localeIndexOfString: localeIndexOfString,
    localeStartsWithString: localeStartsWithString,

    formatMessage: formatMessage
  };
});

csui.define('nuc/utils/base',[
  'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/utils/url',
  'nuc/utils/errormessage', 'nuc/utils/messagehelper',
  'nuc/utils/types/date', 'nuc/utils/types/number',
  'nuc/utils/types/member', 'nuc/utils/types/localizable', 'i18n'
], function (_, $, Url, Message, MessageHelper, date, number, member,
    localizable, i18n) {
  'use strict';

  var $window = $(window);

  // handler as singleton, bind dialog to handler
  var messageHelper = new MessageHelper();
  // TODO: Implement a component showing the errors
  messageHelper.on("showErrors", function (errors, html, title, showit) {
    alert($(html).text());
  });

  var escapeHtmlHelper = $("<p></p>");

  function escapeHtml(text, preserveLineBreaks) {
    // There's no HTML escaping function which would return a text to be
    // concatenated with the rest of the raw HTML markup so that the text
    // value would be the same and not interpreted as HTML markup.
    // Let's use an artificial DOM element for this, wrapped with jQuery.
    var html = escapeHtmlHelper.text(text).html();
    if (preserveLineBreaks) {
      html = html.replace(/\r?\n/g, "\r\n<br>");
    }
    return html;
  }

  function isBackbone(value) {
    // descendant of Backbone.Events
    return value && value.once;
  }

  function isPlaceholder(value) {
    // string selector, DOM object or jQuery object
    return value && (_.isString(value) || _.isElement(value) || value instanceof $);
  }

  function isTouchBrowser() {
    return !!(('ontouchstart' in window) || (navigator.maxTouchPoints) ||
              (navigator.msMaxTouchPoints));
  }

  function isHybrid() {
    return !!('ontouchstart' in window);
  }

  function isAppleMobile() {
    if (navigator && navigator.userAgent != null) {
      var appleMatches = navigator.userAgent.match(/(iPhone |iPad)/i);
      return (appleMatches != null);
    }
    return true;
  }

  function isMacintosh() {
    return navigator.platform.indexOf('Mac') > -1;
  }
  
  /**
   * returns true if the current browser is accessed from any iOS device
   * @returns Boolean.
   **/
  function isIOSBrowser() {
    return navigator.userAgent.indexOf('Mac') > -1;
  }

  function isLandscape() {
    return isAppleMobile() && (window.matchMedia("(orientation: landscape)").matches);
  }

  function isPortrait() {
    return isAppleMobile() && (window.matchMedia("(orientation: portrait)").matches);
  }

  function isIE11() {
    if (navigator && navigator.userAgent) {
      var isInternetExplorer11 = /Trident.*11/i.test(navigator.userAgent);
      return isInternetExplorer11;
    }
  }

  function isMozilla() {
    if (navigator && navigator.userAgent) {
      var isMozilla = /Mozilla/.test(navigator.userAgent);
      return isMozilla;
    }
  }

  function isEdge() {
    if (navigator && navigator.userAgent) {
      var isEdge = /Edge/.test(navigator.userAgent);
      return isEdge;
    }
  }

  function isFirefox() {
    if (navigator && navigator.userAgent) {
      var isFirefox = /Firefox/.test(navigator.userAgent);
      return isFirefox;
    }
  }

  /**
   * returns true if the current browser is either IE11
   * or Edge (from Windows 10).
   *
   @returns {}
   */
  function isMSBrowser() {
    return isIE11() || isEdge();
  }

  function isChrome() {
    // please note,
    // that IE11 now returns undefined again for window.chrome
    // and new Opera 30 outputs true for window.chrome
    // and new IE Edge outputs to true now for window.chrome
    // and if not iOS Chrome check
    // so use the below updated condition
    var isChromium  = window.chrome,
        winNav      = window.navigator,
        vendorName  = winNav.vendor,
        isOpera     = winNav.userAgent.indexOf("OPR") > -1,
        isIEedge    = winNav.userAgent.indexOf("Edge") > -1,
        isIOSChrome = winNav.userAgent.match("CriOS"),
        retVal      = false;
    if (isIOSChrome ||
        (isChromium != null && vendorName === "Google Inc." && isOpera === false &&
         isIEedge === false)) {
      retVal = true;
    }
    return retVal;
  }

  function isSafari() {
    if (navigator && navigator.userAgent) {
      //it excludes Chrome and all Android browsers that include the Safari name in their user agent.
      var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      return isSafari;
    }
  }

  // This shared function is used to compute the number characters can fit in a container.
  // Input:
  // - container width in pixels
  // - element width in pixels
  // Return:
  // - number of elements to fill the container
  function px2em(pxContainerWidth, pxElemWidth) {
    var pxInEms = 0;
    if (pxElemWidth > 0) {
      pxInEms = Math.floor(2 * pxContainerWidth / pxElemWidth);
    }
    return pxInEms;
  }

  function isVisibleInWindowViewport(el) {
    var $el = el instanceof $ ? el : $(el);
    if (!$el.is(':visible')) {
      return false;
    }
    var position = $el.offset(),
        offset   = {
          left: window.pageXOffset,
          top: window.pageYOffset
        },
        extents  = {
          width: $window.width(),
          height: $window.height()
        };
    return position.left >= offset.left && position.left - offset.left < extents.width &&
           position.top >= offset.top && position.top - offset.top < extents.height;
  }

  function isVisibleInWindowViewportHorizontally(el) {
    if (el === undefined) {
      return false;
    }
    var elem = el instanceof $ ? el[0] : el;
    if (!elem || !elem.getBoundingClientRect) {
      return false;
    }
    var elRect = elem.getBoundingClientRect();
    return elRect.left >= window.pageXOffset && elRect.right - window.pageXOffset < $window.width();
  }

  function isVisibleInWindowViewportVertically(el) {
    if (el === undefined) {
      return false;
    }
    var elem = el instanceof $ ? el[0] : el;
    if (!elem || !elem.getBoundingClientRect) {
      return false;
    }
    var elRect = elem.getBoundingClientRect();
    return elRect.top >= window.pageYOffset &&
           elRect.bottom - window.pageYOffset < $window.height();
  }

  // Params:
  // - el: element
  // - levels: for performance, only check parents up to number of levels. Default: 5.
  // - iPercentX: visible percentage X.  Default: 100% for full visibility.
  // - iPercentY: visible percentage Y.  Default: 100% for full visibility.
  // Return: true/false
  // Note: credit to a guy on stackoverflow for his original code
  function isElementVisibleInParents(el, levels, iPercentX, iPercentY) {
    if (el === undefined) {
      return false;
    }
    var elem = el instanceof $ ? el[0] : el;
    if (!elem || !elem.getBoundingClientRect) {
      return false;
    }
    // needed because the rects returned by getBoundingClientRect have up to 10 decimals
    var tolerance = 0.01;
    var percentX = iPercentX !== undefined ? iPercentX : 100;
    var percentY = iPercentY !== undefined ? iPercentY : 100;
    var elemRect = elem.getBoundingClientRect();
    var parentRects = [];
    var maxLevels = levels || 5;
    var curLevel = 0;
    while (elem.parentElement != null && curLevel < maxLevels) {
      parentRects.push(elem.parentElement.getBoundingClientRect());
      elem = elem.parentElement;
      curLevel++;
    }

    var visibleInAllParents = parentRects.every(function (parentRect) {
      var visiblePixelX = Math.min(elemRect.right, parentRect.right) -
                          Math.max(elemRect.left, parentRect.left);
      var visiblePixelY = Math.min(elemRect.bottom, parentRect.bottom) -
                          Math.max(elemRect.top, parentRect.top);
      var visiblePercentageX = visiblePixelX / elemRect.width * 100;
      var visiblePercentageY = visiblePixelY / elemRect.height * 100;
      return visiblePercentageX + tolerance > percentX &&
             visiblePercentageY + tolerance > percentY;
    });
    return visibleInAllParents;
  }

  // Similar to isElementVisibleInParents above but this function only checks a particular parent.
  // Params:
  // - el: element
  // - parent: parent element
  // - iPercentX: visible percentage X.  Default: 100% for full visibility.
  // - iPercentY: visible percentage Y.  Default: 100% for full visibility.
  // Return: true/false
  function isElementVisibleInParent(el, parent, iPercentX, iPercentY) {
    if (el === undefined || parent === undefined) {
      return false;
    }
    var elem = el instanceof $ ? el[0] : el;
    if (!elem || !elem.getBoundingClientRect) {
      return false;
    }
    var container = parent instanceof $ ? parent[0] : parent;
    if (!container || !container.getBoundingClientRect) {
      return false;
    }
    // needed because the rects returned by getBoundingClientRect have up to 10 decimals
    var tolerance = 0.01;
    var percentX = iPercentX !== undefined ? iPercentX : 100;
    var percentY = iPercentY !== undefined ? iPercentY : 100;
    var elemRect = elem.getBoundingClientRect();
    var contRect = container.getBoundingClientRect();
    var visiblePixelX = Math.min(elemRect.right, contRect.right) -
                        Math.max(elemRect.left, contRect.left);
    var visiblePixelY = Math.min(elemRect.bottom, contRect.bottom) -
                        Math.max(elemRect.top, contRect.top);
    var visiblePercentageX = visiblePixelX / elemRect.width * 100;
    var visiblePercentageY = visiblePixelY / elemRect.height * 100;
    return visiblePercentageX + tolerance > percentX &&
           visiblePercentageY + tolerance > percentY;
  }

  function checkAndScrollElemToViewport(elem) {
    var $elem            = $(elem),
        scrollSelector   = $elem.closest('.csui-perfect-scrolling').length > 0 ?
                           '.csui-perfect-scrolling' : '.csui-normal-scrolling',
        elemScrollParent = $elem.closest(scrollSelector),
        stickyHeader     = elemScrollParent.siblings(".csui-tab-contents-header-wrapper");
    if (!!stickyHeader[0]) {
      var elemTop       = $elem.offset().top,
          viewportTop   = elemScrollParent[0].getBoundingClientRect().top + stickyHeader.height(),
          isElemVisible = elemTop > viewportTop;
      if (!isElemVisible) {
        var currScrollTop = elemScrollParent.scrollTop();
        elemScrollParent.scrollTop(currScrollTop - (viewportTop - elemTop));
      }
    }

  }

  function setScrollHandler(e) {
    var eventArg = e.data;
    var inputElement      = eventArg.inputElement,
        view              = eventArg.view,
        dropdownContainer = eventArg.dropdownContainer,
        callback          = eventArg.callback;
    //When dropdown is closed
    inputElement.parents(".csui-normal-scrolling").css("overflow", "auto");
    //close respective drop-downs using callback
    if (dropdownContainer.length > 0 && dropdownContainer[0] !== e.target &&
        dropdownContainer.is(":visible") && callback) {
      callback(view);
    }
  }

  function adjustDropDownField(inputElement, dropdownContainer, applyWidth, view, callback,
      scrollableDropdownContainer) {
    var scrollEl;
    var eventArg = {
      inputElement: inputElement,
      view: view,
      dropdownContainer: dropdownContainer,
      callback: callback
    };

    var isIEBrowser    = this.isIE11(),
        isTouchBrowser = this.isTouchBrowser(),
        isHybrid       = this.isHybrid();

    if (isTouchBrowser &&
        !inputElement.closest('.csui-scrollable-writemode').hasClass('csui-dropdown-open')) {
      inputElement.closest('.csui-scrollable-writemode').addClass('csui-dropdown-open');
    }

    // for scrollable set
    if (inputElement.parents(".csui-scrollablecols").length > 0 &&
        inputElement.parents(".cs-form-set-container").length >
        0) {
      scrollEl = inputElement.parents(".csui-scrollablecols").parents(".cs-form-set-container").find
      (".ps-container.ps-active-x");
      var isRtl            = i18n && i18n.settings.rtl,
          inputElementLeft = inputElement.offset().left,
          leftShadow       = inputElement.parents(".csui-scrollablecols").siblings(
              ".csui-lockedcols").find(".csui-shadowleft-container"),
          leftShadowLeft   = leftShadow.offset().left,
          currentLeft,
          scrollUpdate;
      if (isRtl) {
        var inputElementRight = inputElementLeft + inputElement.outerWidth();
        scrollUpdate = inputElementRight - leftShadowLeft;
      }
      else {
        var leftShadowRight = leftShadowLeft + leftShadow.outerWidth();
        scrollUpdate = leftShadowRight - inputElementLeft;
      }
      // for partially visible dropdownfield
      if (scrollUpdate > 0) {
        var that = this;
        scrollEl.off('scroll', this.setScrollHandler);
        scrollEl.one('set:scrolled', function () {
          if (!!scrollEl) {
            scrollEl.on('scroll', eventArg, that.setScrollHandler);
          }
          that.autoAlignDropDowns(inputElement, dropdownContainer, applyWidth,
              scrollableDropdownContainer, isIEBrowser);
          that.hideDropDowns(inputElement, dropdownContainer, view, callback);
        });
        if (isRtl) {
          currentLeft = scrollEl.scrollLeftRtl();
          scrollEl.scrollLeftRtl(currentLeft + scrollUpdate);
        }
        else {
          currentLeft = scrollEl.scrollLeft();
          scrollEl.scrollLeft(currentLeft - scrollUpdate);
          setTimeout(function () {
            if (that.isTouchBrowser && !inputElement.closest('.csui-scrollable-writemode').hasClass(
                    '.csui-dropdown-open')) {
              inputElement.closest('.csui-scrollable-writemode').addClass('csui-dropdown-open');
            }
          }, 100);
        }
        return;
      }
    }

    if (!!scrollEl) {
      scrollEl.off('scroll', this.setScrollHandler).on('scroll', eventArg, this.setScrollHandler);
    }
    this.autoAlignDropDowns(inputElement, dropdownContainer, applyWidth, scrollableDropdownContainer,
        isIEBrowser);
    this.hideDropDowns(inputElement, dropdownContainer, view, callback);

  }

  //This function is used to display drop-downs either top or bottom based on available space
  function autoAlignDropDowns(inputElement, dropdownContainer, applyWidth,
      scrollableDropdownContainer, isIEBrowser) {
    // return the control if inputElement is not available in dom.
    if (!inputElement.is(':visible')) {
      return false;
    }
    dropdownContainer.css({
      "left": 0,
      "top": 0
    });
    var hasPerspective        = !!inputElement.closest('.cs-perspective-panel').length,
        isRtl                 = i18n && i18n.settings.rtl,
        elTop                 = inputElement.offset().top,
        elPositionX           = hasPerspective ? inputElement.offset().left : inputElement[0]
            .getBoundingClientRect().left,
        scrollSelector        = inputElement.closest('.csui-perfect-scrolling').length > 0 ?
                                '.csui-perfect-scrolling' : '.csui-normal-scrolling',
        form                  = inputElement.closest(scrollSelector),
        modalContentElem      = isIEBrowser ? [] :
                                (form.length > 0 ?
                                 form.parents(".binf-modal-content, .csui-sidepanel-container") :
                                 inputElement.closest(
                                     ".binf-modal-content, .csui-sidepanel-container")), /*For
         IE, left & top position is calculated with respect to document*/
        modalContentPositionX = modalContentElem.length > 0 ? (isRtl ?
                                                               (modalContentElem.outerWidth() +
                                                                modalContentElem.offset().left) :
                                                               modalContentElem.offset().left) :
                                (isRtl ? $(document).width() : 0),
        modalContentTop       = modalContentElem.length > 0 ? modalContentElem.offset().top : 0,
        controlheight         = inputElement.outerHeight(),
        dropdownWidth         = inputElement.outerWidth(),
        perspectivePanel      = $(".cs-perspective-panel"),
        closestPerspectivePan = inputElement.closest(".cs-perspective-panel"),
        perspective           = closestPerspectivePan.length > 0 ? closestPerspectivePan :
                                inputElement.closest(".cs-perspective"),
        perspectiveHeight     = perspective.length > 0 ? perspective.outerHeight()
            : $(document).height(),
        perspectiveTop        = perspective.length > 0 ? perspective.offset().top : 0,
        perspectiveLeft       = perspective.length > 0 ? perspective.offset().left : 0,
        elemBoundingRect      = inputElement[0].getBoundingClientRect(),
        contextBottom, contextTop;

    if (applyWidth) {
      dropdownContainer.css({
        "width": dropdownWidth
      });
    }
    //When dropdown is opened
    if (scrollSelector != '.csui-normal-scrolling') {
      inputElement.parents(".csui-normal-scrolling").css("overflow", "hidden");
    }

    var perspectivePanelClientTop = perspectivePanel.length > 0 ?
                                    perspectivePanel[0].getBoundingClientRect().top : 0;
    if (perspectivePanelClientTop < 0) {
      perspectivePanelClientTop = perspectivePanel.offset().top;
    }
    var perspectiveTopSpace  = perspectiveTop > 0 ? perspectiveTop : perspectivePanelClientTop,
        spaceOnTop           = elemBoundingRect.top - perspectiveTopSpace,
        spaceOnBottom        = window.innerHeight -
                               (elemBoundingRect.top + elemBoundingRect.height),
        isDropdownShownOnTop = spaceOnTop > spaceOnBottom;

    if (!!scrollableDropdownContainer) {
      scrollableDropdownContainer.css({
        'max-height': Math.abs((isDropdownShownOnTop ? spaceOnTop : spaceOnBottom) * 0.9) + 'px'
      });
      // Check if whole dropdown can fit in bottom since bottom is prefferable if it can fit in bottom
      isDropdownShownOnTop = scrollableDropdownContainer.outerHeight() > spaceOnBottom;
    }
    // below code used to display dropdown at top of the field.
    if (isDropdownShownOnTop) {

      if (isIEBrowser) {
        if (perspective.length > 0) {
          contextBottom = perspectiveHeight + perspectiveTop - elemBoundingRect.top;
        } else {
          contextBottom = document.documentElement.offsetHeight +
                          document.documentElement.scrollTop -
                          elTop;
        }
      } else {
        if (modalContentElem.length > 0) {
          contextBottom = modalContentElem.outerHeight() + modalContentTop - elTop;
        } else {
          if (perspective.length > 0 || isSafari()) {
            contextBottom = perspectiveHeight + perspectiveTop - elTop;
          } else {
            contextBottom = hasPerspective ? (document.documentElement.offsetHeight - elTop)
                : window.innerHeight - (inputElement[0].getBoundingClientRect().top);
          }
        }
      }
      if (isRtl) {
        dropdownContainer.css({
          "position": "fixed",
          "right": modalContentPositionX - (elPositionX + dropdownWidth),
          "top": "auto",
          "bottom": contextBottom,
          "left": "auto"
        });
      } else {
        dropdownContainer.css({
          "position": "fixed",
          "left": (elPositionX - modalContentPositionX) - perspectiveLeft,
          "top": "auto",
          "bottom": contextBottom
        });
      }
      if (dropdownContainer.hasClass('binf-datetimepicker-widget')) {
        dropdownContainer.addClass('binf-top').removeClass('binf-bottom');
      }
      // below code used to display dropdown at bottom of the field.
    } else {
      if (isIEBrowser) {
        contextTop = elTop + controlheight - document.documentElement.scrollTop;
      } else {
        if (modalContentElem.length > 0) {
          contextTop = elTop + controlheight - modalContentTop;
        } else {
          if (perspective.length > 0) {
            contextTop = elTop + controlheight - perspectiveTop;
          } else {
            contextTop = elemBoundingRect.top + elemBoundingRect.height - perspectiveTop;
          }

        }
      }
      if (isRtl) {
        dropdownContainer.css({
          "position": "fixed",
          "right": modalContentPositionX - (elPositionX + dropdownWidth),
          "top": contextTop,
          "bottom": "auto",
          "left": "auto"
        });
      } else {
        dropdownContainer.css({
          "position": "fixed",
          "left": (elPositionX - modalContentPositionX) - perspectiveLeft,
          "top": contextTop,
          "bottom": "auto"
        });
      }
      if (dropdownContainer.hasClass('binf-datetimepicker-widget')) {
        dropdownContainer.addClass('binf-bottom').removeClass('binf-top');
      }
    }
  }

  /**
   * Options:
   *  - targetEl  # Required. Element (usually anchor) which triggers the dropdown
   *  - dropdownMenu # Optional. Element "binf-dropdown-menu" that is opened by `targetEl`. Default to sibling of `targetEl`.
   *  - hAlignment # Optional. Default to `left` aligned.
   *  - vAlignment # Optional. Default to `bottom`.
   *
   * @param {*} options
   */
  function alignDropDownMenu(options) {
    var $targetEl     = options.targetEl,
        $dropdownMenu = options.dropdownMenu || $targetEl.nextAll('.binf-dropdown-menu'),
        hAlignment    = options.hAlignment || 'left',
        vAlignment    = options.vAlignment || 'bottom',
        isRtl         = i18n && i18n.settings.rtl;

    if (!$targetEl.length || !$targetEl.is(':visible') || !$dropdownMenu.length) {
      // return the control if inputElement is not available in dom.
      return false;
    }

    $dropdownMenu.css({'maxHeight': '', 'maxWidth': '', top: '', left: '', right: '', bottom: ''}); // Reset all inline styles
    $dropdownMenu.removeClass('binf-dropdown-align-left-top binf-dropdown-align-left-bottom' +
                              ' binf-dropdown-align-right-top binf-dropdown-align-right-bottom');

    var dropdownHeight  = $dropdownMenu.outerHeight(),
        dropdownWidth   = $dropdownMenu.outerWidth();
    // Hide to dropdown to avoid window scrolls due to overflow of dropdown beyond visible area.
    $dropdownMenu.addClass('binf-hidden');

    var documentWidth   = $(window).width(),
        documentHeight  = $(window).height(),
        maxWidthAllowed = parseInt($dropdownMenu.css('maxWidth'), 10) || 224, /** UX Suggested */
        viewportOffset  = $targetEl[0].getBoundingClientRect(),
        top             = viewportOffset.bottom,
        left            = viewportOffset.left,
        right           = documentWidth - viewportOffset.right,
        bottom          = documentHeight - viewportOffset.top,
        scrollLeft      = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop       = window.pageYOffset || document.documentElement.scrollTop,
        spaceTop        = viewportOffset.top - 10,
        spaceBottom     = documentHeight - viewportOffset.bottom - 10,
        spaceLeft       = viewportOffset.right - 10,
        spaceRight      = documentWidth - viewportOffset.left - 10;

    if (vAlignment === 'bottom' && spaceBottom <= dropdownHeight) {
      // Requested to place at bottom, but insufficient space at bottom.
      if (spaceTop > dropdownHeight || spaceTop > spaceBottom) {
        vAlignment = 'top';
      }
    } else if (vAlignment === 'top' && spaceTop <= dropdownHeight) {
      // Requested to place at top, but insufficient space at top.
      if (spaceBottom > dropdownHeight || spaceBottom > spaceTop) {
        vAlignment = 'bottom';
      }
    }

    // Flip the horizontal position incase of RTL
    hAlignment = isRtl ? (hAlignment === 'left' ? 'right' : 'left') : hAlignment;
    if (hAlignment === 'left' && spaceRight <= dropdownWidth) {
      // Requested to align left, but insufficient space towards right.
      if (spaceLeft > dropdownWidth || spaceLeft > spaceRight) {
        hAlignment = 'right';
      }
    } else if (hAlignment === 'right' && spaceLeft <= dropdownWidth) {
      // Requested to align right, but insufficient space towards left.
      if (spaceRight > dropdownWidth || spaceRight > spaceLeft) {
        hAlignment = 'left';
      }
    }
    $dropdownMenu.addClass('binf-dropdown-align-' + hAlignment + '-' + vAlignment);

    if (!isIE11()) {
      // Since perspectives and model dialogs styles with "transform" in which "position: fixed" relative to these container (not viewport).
      var closestPerspectivePan = $targetEl.closest(".cs-perspective-panel"),
          modelContent          = $targetEl.parents(".binf-modal-content"),
          $transformParent      = closestPerspectivePan.length ? closestPerspectivePan :
                                  $targetEl.closest(".cs-perspective");
      /** Check if inside perspective */
      // If not perspective MODEL dialog?
      $transformParent = $transformParent.length ? $transformParent : modelContent;

      if ($transformParent.length > 0) { // To counter the transform
        var transParentOffset = $transformParent.offset(),
            $elDocOffset      = $targetEl.offset(); // Includes top, left scrolls with viewport position;
        top += (scrollTop - transParentOffset.top);
        left += (scrollLeft - transParentOffset.left);
        right = $transformParent.outerWidth() + transParentOffset.left - $elDocOffset.left -
                $targetEl.outerWidth();
        bottom = $transformParent.outerHeight() + transParentOffset.top - $elDocOffset.top;
      }
    }

    var styles = {"position": "fixed"};
    if (hAlignment === 'left') {
      styles = _.extend(styles, {
        "left": left,
      });
      if(isRtl) {
        styles = _.extend(styles, {
          'right': 'auto',
        });		  
      }
      if (spaceRight < maxWidthAllowed) {
        styles.maxWidth = spaceRight;
      }
    } else {
      styles = _.extend(styles, {
        "right": right
      });
    }

    if (vAlignment === 'bottom') {
      styles = _.extend(styles, {
        "top": top,
      });
    } else {
      styles = _.extend(styles, {
        "bottom": bottom
      });
    }

    $dropdownMenu.css(styles);
    $dropdownMenu.removeClass('binf-hidden');
  }

    function alignDropDownSubMenus(options) {
      var $dropdown = options.dropdownMenu,
        $targetEl = options.targetEl,
        $childEl = $targetEl.children(),
        isRtl = i18n && i18n.settings.rtl,
        viewportWidth = (window.innerWidth || document.documentElement.clientWidth),
        bounding = $targetEl[0].getBoundingClientRect(),
        childBounding = $childEl[0].getBoundingClientRect(),
        dropdownBounding = $dropdown[0].getBoundingClientRect(),
        isPullDown = $targetEl.hasClass('binf-pull-down'),
        isLandingTileView = $targetEl.parents().hasClass("csui-tileview-more-btn"),
        startPosition = isPullDown === isRtl ? bounding.right : bounding.left,
        rightSpaceAvailable = isRtl ? startPosition : (viewportWidth - startPosition),
        leftSpaceAvailable = isRtl ? (viewportWidth - bounding.right) : bounding.left;

      // Reset positions / styles to DEFAULTs
      $targetEl.removeClass("binf-dropdown-menu-left binf-dropdown-menu-right");
      $dropdown.css({ 'left': '', 'right': '', 'top': '', 'bottom': '', 'position': '' });
      $dropdown.removeAttr('style');
      $dropdown.removeClass(
        'csui-fixed-submenu csui-perfect-scrolling csui-normal-scrolling csui-no-scroll-x');

      // Assess horizontal position
      if (Math.floor(rightSpaceAvailable) <= dropdownBounding.width ||
        ($targetEl.parent().closest('.binf-dropdown-submenu').hasClass(
          'binf-dropdown-menu-left') && leftSpaceAvailable > dropdownBounding.width )) {
        $targetEl.addClass('binf-dropdown-menu-left');

      }
      // Assess vertical position position
      $targetEl.removeClass("binf-dropup"); // Default toward down

      var ulOffset = $dropdown.offset();
      // how much space would be left on the top if the dropdown opened that direction
      var spaceUp = (ulOffset.top - $dropdown.outerHeight()) - $(window).scrollTop();
      // how much space is left at the bottom
      var spaceDown = $(window).scrollTop() + $(window).height() -
        (ulOffset.top + $dropdown.outerHeight());
      // switch to dropup only if there is no space at the bottom AND 
      // there is space at the top, or there isn't either but it would be still better fit
      if ((spaceDown < 0 && (spaceUp >= 0 || spaceUp > spaceDown)) ||
        ($targetEl.parent().closest('.binf-dropdown-submenu').hasClass('binf-dropup') && spaceUp >
          spaceDown)) {
        $targetEl.addClass("binf-dropup");
      }

      // TODO Make submenu "position: fixed" only when overflowed by perfect scrollbar
      var scrollOffset = $targetEl.parent().scrollTop(),
          perspectiveOffsetTop = 0;
      $targetEl.parent().css('overflow', 'visible');
      var viewportOffset = $dropdown[0].getBoundingClientRect(),
        top = viewportOffset.top,
        left = viewportOffset.left;
      $targetEl.parent().css('overflow', '');
      if (!isIE11()) {
        var modalContentElem = $targetEl.parents(".binf-modal-content"),
          closestPerspectivePan = $targetEl.closest(".cs-perspective-panel"),
          landingPerspective = $targetEl.closest(".cs-perspective"),
          perspective = closestPerspectivePan.length > 0 ? closestPerspectivePan : landingPerspective;
        if (modalContentElem.length > 0) {
          var modalOffset = modalContentElem.offset();
          top = top - modalOffset.top - scrollOffset;
          left = left - modalOffset.left;
        } else if (perspective.length > 0) {
          var perspectiveOffset = perspective.offset(),
            perspectiveBounding = landingPerspective[0].getBoundingClientRect();
            perspectiveOffsetTop = isLandingTileView ? perspectiveBounding.top : perspectiveOffset.top;
          top = top - perspectiveOffsetTop - scrollOffset;
          left = left - perspectiveOffset.left;
        }
      }
      $targetEl.parent().css('overflow', 'visible');

      if ($targetEl.hasClass('binf-dropdown-menu-left')) {
        left += (!isPullDown ? $targetEl.width() - $dropdown.width() : 0);
      }

      if (isPullDown){
        top = top - (bounding.bottom - childBounding.bottom);
      }

      //Set the css of the submenu based on its horizontal orientation.
      var scrollHeight = document.body.getBoundingClientRect().top,
          currentElementTop = $targetEl.offset().top + scrollHeight,
          currentElementHeight = $targetEl.innerHeight(),
          screenHeight = $(window).outerHeight(),
          bottom = 0;

      $targetEl.parent().css('overflow', '');
      $dropdown.addClass('csui-fixed-submenu');

      var subMenuCSS = {
        position: 'fixed',
        left: left
      };
      // This condition is required only for Node Browsing Table widget
      if ($targetEl.parents().hasClass('csui-nodestable') && !isIE11()) {
        top = top + window.scrollY;
      }
      if ($targetEl.hasClass("binf-dropup")) {
        bottom = (screenHeight - currentElementTop) - currentElementHeight;
        // Making bottom to default value if its negative
        bottom = bottom < 0 ? 0 : bottom;
        if (isIE11()) {
          _.extend(subMenuCSS, {
            bottom: bottom,
            top: 'auto',
            maxHeight: screenHeight - bottom
          });
        } else {
          _.extend(subMenuCSS, {
            bottom: 'auto',
            top: top + $targetEl.height() / 2,
            maxHeight: screenHeight - bottom
          });
        }
      } else {
        _.extend(subMenuCSS, {
          top: top,
          bottom: 'auto',
          maxHeight: screenHeight - ( top + perspectiveOffsetTop )
        });
      }

      $dropdown.css(subMenuCSS);
      csui.require([
        'csui/controls/tile/behaviors/perfect.scrolling.behavior'
      ], function (PerfectScrollingBehavior) {
            // Apply perfect scrollbar
            if (PerfectScrollingBehavior.usePerfectScrollbar()) {
              $dropdown.addClass('csui-perfect-scrolling');
              $dropdown.perfectScrollbar({suppressScrollX: true, includePadding: true});
            } else {
              $dropdown.addClass('csui-normal-scrolling csui-no-scroll-x');
            }

            // Hide submenu on scroll of its parent (dropdown menu).
            var $scrollParent = $targetEl.closest('.binf-dropdown-menu');
            $scrollParent.off('scroll.csui.submenu')
                .on('scroll.csui.submenu', _.bind(function (event) {
                  !$dropdown.is(':hidden') && $targetEl.binf_dropdown_submenu('hide');
                  $scrollParent.off('scroll.csui.inline.actions');
                }, this));
              });
    }

  function hideDropDowns(inputElement, dropdownContainer, view, callback) {
    var scrollSelector = inputElement.closest('.csui-perfect-scrolling').length > 0 ?
        '.csui-perfect-scrolling' : '.csui-normal-scrolling',
        form = inputElement.closest(scrollSelector),
        eventArg = {inputElement: inputElement, view: view, dropdownContainer: dropdownContainer, callback: callback};
    form.off('scroll', this.setScrollHandler).on('scroll', eventArg, this.setScrollHandler);
    // called when the window is scrolled.
    $(window).off('scroll', this.setScrollHandler).on('scroll', eventArg, this.setScrollHandler);

    // called when the window is resized.
    $(window).off('resize', this.setScrollHandler).on('resize', eventArg, this.setScrollHandler);
  }

  // TODO: Deprecate and remove this method
  function stringifyDate(date) {
    return JSON.stringify(date);
  }

  // TODO: Deprecate and remove this method
  function dateToLocalIsoString(dateStr, format) {
    if (format === 'YYYY-MM-DD' || format === 'MM/DD/YYYY') {
      return date.serializeDate(dateStr);
    }
    return date.serializeDateTime(dateStr);
  }

  function findFocusables(element) {
    return $(element).find('a[href], area[href], input, select, textarea, button,' +
                           ' iframe, object, embed, *[tabindex], *[contenteditable]')
        // Only visible and enabled
        .filter(':visible:not([disabled])');
  }

  function clearFocusables(element) {
    var ele = $(element),
      focusables = ele.attr('tabindex', -1).find('a[href], area[href], input, select, textarea, button,' +
        ' iframe, object, embed, *[tabindex], *[contenteditable]').filter(
          ':not([tabindex=-1])');
    focusables.attr('tabindex', -1);
    this.isIE11() && ele.find('svg, svg *').attr("focusable", "false");
    this.isFirefox() && ele.find('.csui-normal-scrolling').attr('tabindex', -1);
  }

  /**
   * The parent div for the span element in which we have to apply ellipsis
   * The number of lines we have to apply ellipses
   * @param element
   * @param numberOfLines
   * Limitation of Multiline text with ellipsis:
   * If there is a single lengthy word then the word is displayed in single line with ellipsis at the end of the line ex: 'Counterproductiveness'
   * If there are 2 lengthy words, where none of them will fit in the line then the first word is displayed with ellipsis in a single line ex:  'Methylenedioxymethamphetamine chemical'
   * If the first word is very short and the 2nd word is longer, then the single line is displayed and ellipsis are displayed at the end of 2nd word ex: 'Digital Transformation'
   */
  function applyEllipsis(element, numberOfLines) {
    var measure, text, lineWidth,
        lineStart, lineCount, wordStart,
        line, lineText, wasNewLine,
        updatedFirstLineWidth = false,
        createElement         = document.createElement.bind(document),
        createTextNode        = document.createTextNode.bind(document);
    if (typeof element === 'object' && element.length > 0) {
      element = element[0];
    } else {
      element = element;
    }
    // measurement element is made a child of the element to get it's style
    measure = createElement('span');

    $(measure).css({
      'position': 'absolute', // prevent page reflow
      'whiteSpace': 'pre', // cross-browser width results
      'visibilty': 'hidden' // prevent drawing});
    });

    // make sure the element belongs to the document
    if (!(element.ownerDocument || element.ownerDocument === document)) {
      return;
    }

    // reset to safe starting values
    lineStart = wordStart = 0;
    lineCount = 1;
    wasNewLine = false;
    lineWidth = (element.clientWidth);
    // get all the text, remove any line changes
    text = (element.textContent || element.innerText).trim().replace(/\n/g, ' ');
    // remove all content
    while (element.firstChild !== null) {
      element.removeChild(element.firstChild);
    }
    // add measurement element within so it inherits styles
    element.appendChild(measure);
    function checkLine(pos) {
      // ignore any further processing if we have total lines
      if (lineCount === numberOfLines) {
        return;
      }
      // create a text node and place it in the measurement element
      measure.appendChild(createTextNode(text.substr(lineStart, pos + 1 - lineStart)));
      // have we exceeded allowed line width?
      if (lineWidth < measure.clientWidth) {
        if (wasNewLine) {
          // we have a long word so it gets a line of it's own
          lineText = text.substr(lineStart, pos + 1 - lineStart);
          // next line start position
          lineStart = pos + 1;
        } else {
          // grab the text until this word
          lineText = text.substr(lineStart, wordStart - lineStart);
          // next line start position
          lineStart = wordStart;
        }
        // create a line element
        line = createElement('span');
        // add text to the line element
        line.appendChild(createTextNode(lineText));
        // add the line element to the container
        element.appendChild(line);
        // yes, we created a new line
        wasNewLine = true;
        lineCount++;
      } else {
        // did not create a new line
        wasNewLine = false;
      }
      // remember last word start position
      wordStart = pos + 1;
      // clear measurement element
      measure.removeChild(measure.firstChild);
    }

    // http://ejohn.org/blog/search-and-dont-replace/
    text.replace(/\W|\_/g, function (m, pos) {
      checkLine(pos);
    });
    checkLine(text.substr(lineStart).length);
    // remove the measurement element from the container
    element.removeChild(measure);
    // create the last line element
    line = createElement('span');
    // give styles required for text-overflow to kick in
    $(line).css({
      'display': 'inline-block',
      'overflow': 'hidden',
      'whiteSpace': 'nowrap',
      'width': '100%'
    });
    if (lineCount > 1) {
      $(line).css({
        'textOverflow': 'ellipsis',
      });
    }
    // add all remaining text to the line element
    line.appendChild(createTextNode(text.substr(lineStart)));
    // add the line element to the container
    element.appendChild(line);
  }

  /**
   * This method is used to filter out unsupported widgets based on the config
   *
   * @param widget  widget json : {type:"<widget-path>",options:{<widget-options>}}
   * @param config  configuration json:
   *                {"unSupportedWidgets":{"<module>":["<widget1-path>","<widget2-path>"]}
   * @param skipFilter type: boolean, enhancing perspective to allow loading unSupportedWidgets
   *                in perspective edit mode
   * @returns {*}   returns the widget only if it is not listed in the 'UnSupportedWidgets' list
   *                else returns undefined
   */
  function filterUnSupportedWidgets(widget, config, skipFilter) {

    if (widget && config && config.unSupportedWidgets && !skipFilter) {
      var extWidgets = _.chain(config.unSupportedWidgets)
          .values()
          .flatten()._wrapped;
      if (extWidgets && extWidgets.length > 0) {
        if (_.contains(extWidgets, widget.type)) {
          return undefined;
        }
      }
    }
    return widget;
  }

  var transitionEndListener = _.once(
      function () {
        var transitions = {
              transition: 'transitionend',
              WebkitTransition: 'webkitTransitionEnd',
              MozTransition: 'transitionend',
              OTransition: 'oTransitionEnd otransitionend'
            },
            element     = document.createElement('div'),
            transition;
        for (transition in transitions) {
          if (typeof element.style[transition] !== 'undefined') {
            return transitions[transition];
          }
        }
      }
  );

  function onTransitionEnd(element, callback, context) {
    var timeoutRef,
        transitionEnded = function () {
          clearTimeout(timeoutRef);
          callback.call(context || element);
        };
    // Safegaurd transitionend when given element is not in transition assuming there cannot be transition more than 2 seconds. 
    // Hence, waiting for 2 sec to manually trigger the transition end.
    timeoutRef = setTimeout(transitionEnded, 2000);
    element.one(transitionEndListener(), transitionEnded);
  }

  function getOffset(element) {
    return element.is(':visible') ? element.offset() : {top: 0, left: 0};
  }

  /**
   * This is local private method used to generate the language object for both system level
   * languages and metadata langugaes.
   *
   * @param key
   * @returns {{enabled: boolean, languages: Array, defaultLanguage: string}}
   */
  function getLanguageObject(key) {
    var langCount   = i18n && i18n.settings && i18n.settings[key] ?
                      i18n.settings[key].length : 0,
        enabled     = langCount > 1,
        langs       = langCount > 0 ? i18n.settings[key] : [],
        defaultLang = langCount ?
                      _.findWhere(i18n.settings[key], {'default': true}).language_code : '';
    return {
      enabled: enabled,
      languages: langs,
      defaultLanguage: defaultLang
    };
  }

  /**
   * This method returns the system configured language's info including all the required
   * information inside it, so that it will become common location to access this static
   * information across SmartView.
   *
   * @returns {{enabled, languages, defaultLanguage}|{enabled: boolean, languages: Array, defaultLanguage: string}}
   */
  function getLanguageInfo() {
    return getLanguageObject('languages');
  }

  /**
   * This method returns the metadata language's info including all the required
   * information inside it, so that it will become common location to access this static
   * information across SmartView.
   *
   * @returns {{enabled, languages, defaultLanguage}|{enabled: boolean, languages: Array, defaultLanguage: string}}
   */
  function getMetadataLanguageInfo() {
    var metadataLangInfo = getLanguageObject('metadata_languages');
    return metadataLangInfo;
  }

  /**
   * This method returns user preferred Metadata language information,
   * so that it will become common location to access this static information across SmartView.
   *
   * @returns { userMetadataLanguage | userMetadataLanguage: string }
   */
    function getUserMetadataLanguageInfo() {
      return i18n && i18n.settings && i18n.settings.userMetadataLanguage ?
        i18n.settings.userMetadataLanguage : 'en';
    }

  /**
   * This method returns boolean true if user clicks either control+click or command+click and if the target element is an anchor tag
   *
   * @returns Boolean
   */
  function isControlClick(event) {
    var returnValue = event && (event.ctrlKey || event.metaKey);
    returnValue = returnValue && (event.currentTarget.tagName.toLowerCase() === "a" || event.currentTarget.getElementsByTagName("a").length > 0);
    return returnValue;
  }

  return {
    MessageHelper: messageHelper,
    ErrorHandler: messageHelper,

    MessageType: Message.Type,
    Message: Message.Message,
    RequestErrorMessage: Message.RequestErrorMessage,

    ErrorStatus: Message.Type,
    ErrorToShow: Message.Message,
    ErrorMessage: Message.ErrorMessage,
    Error: Message.RequestErrorMessage,

    exactDateFormat: date.exactDateFormat,
    exactTimeFormat: date.exactTimeFormat,
    exactDateTimeFormat: date.exactDateTimeFormat,

    parseDate: date.deserializeDate,
    stringifyDate: stringifyDate,
    dateToLocalIsoString: dateToLocalIsoString,
    deserializeDate: date.deserializeDate,
    serializeDate: date.serializeDate,
    serializeDateTime: date.serializeDateTime,
    formatDate: date.formatDate,
    formatDateTime: date.formatDateTime,
    formatExactDate: date.formatExactDate,
    formatExactTime: date.formatExactTime,
    formatExactDateTime: date.formatExactDateTime,
    formatFriendlyDate: date.formatFriendlyDate,
    formatFriendlyDateTime: date.formatFriendlyDateTime,
    formatFriendlyDateTimeNow: date.formatFriendlyDateTimeNow,
    formatISODateTime: date.formatISODateTime,
    formatISODate: date.formatISODate,

    getReadableFileSizeString: number.formatFileSize,
    formatFileSize: number.formatFileSize,
    formatFriendlyFileSize: number.formatFriendlyFileSize,
    formatExactFileSize: number.formatExactFileSize,

    formatInteger: number.formatInteger,
    formatIntegerWithCommas: number.formatIntegerWithCommas,

    formatMemberName: member.formatMemberName,

    getClosestLocalizedString: localizable.getClosestLocalizedString,

    localeCompareString: localizable.localeCompareString,
    localeContainsString: localizable.localeContainsString,
    localeEndsWithString: localizable.localeEndsWithString,
    localeIndexOfString: localizable.localeIndexOfString,
    localeStartsWithString: localizable.localeStartsWithString,

    formatMessage: localizable.formatMessage,

    escapeHtml: escapeHtml,

    isBackbone: isBackbone,
    isPlaceholder: isPlaceholder,
    Url: Url,
    isTouchBrowser: isTouchBrowser,
    isHybrid: isHybrid,
    isAppleMobile: isAppleMobile,
    isMacintosh: isMacintosh,
    isIOSBrowser: isIOSBrowser,
    isIE11: isIE11,
    isEdge: isEdge,
    isMozilla: isMozilla,
    isFirefox: isFirefox,
    isSafari: isSafari,
    isLandscape: isLandscape,
    isPortrait: isPortrait,
    isMSBrowser: isMSBrowser,
    isChrome: isChrome,
    px2em: px2em,
    isVisibleInWindowViewport: isVisibleInWindowViewport,
    isVisibleInWindowViewportHorizontally: isVisibleInWindowViewportHorizontally,
    isVisibleInWindowViewportVertically: isVisibleInWindowViewportVertically,
    isElementVisibleInParents: isElementVisibleInParents,
    isElementVisibleInParent: isElementVisibleInParent,
    checkAndScrollElemToViewport: checkAndScrollElemToViewport,
    setScrollHandler: setScrollHandler,
    adjustDropDownField: adjustDropDownField,
    autoAlignDropDowns: autoAlignDropDowns,
    hideDropDowns: hideDropDowns,
    findFocusables: findFocusables,
    clearFocusables: clearFocusables,
    applyEllipsis: applyEllipsis,
    filterUnSupportedWidgets: filterUnSupportedWidgets,
    onTransitionEnd: onTransitionEnd,
    getOffset: getOffset,
    alignDropDownMenu: alignDropDownMenu,
    alignDropDownSubMenus: alignDropDownSubMenus,
    getLanguageInfo: getLanguageInfo,
    getMetadataLanguageInfo: getMetadataLanguageInfo,
    getUserMetadataLanguageInfo:getUserMetadataLanguageInfo,
    isControlClick: isControlClick
  };
});

csui.define('nuc/models/action',[ "module", "require", "nuc/lib/jquery", "nuc/lib/underscore",
  "nuc/lib/backbone", "nuc/utils/log", "nuc/utils/base"
], function (module, _require, $, _, Backbone, log, base) {
  "use strict";

  // {
  //   signature:  unique identifier of the action to refer to
  //   name:       title of the action
  //   children:   array of action to appear as the submenu
  // }

  // ActionCollection to be filled on the first usage, preventing circular
  // dependency between ActionCollection and ActionModel.
  var ActionCollection;

  var ActionModel = Backbone.Model.extend({

    idAttribute: 'signature',

    constructor: function ActionModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      options && options.connector && options.connector.assignTo(this);
      // Require the ActionCollection on the first use to prevent a circular
      // dependency between ActionCollection and ActionModel.
      if (!ActionCollection) {
        ActionCollection = _require("nuc/models/actions");
      }
      // TODO: make the REST API return array or nothing; the children
      // property is supposed top be a collection.  It returns an empty
      // object literal if there are no children, while the clients like
      // Backbone.Collection expect an array or nothing.
      var children = _.isArray(attributes && attributes.children) &&
                     attributes.children || [];
      this.children = new ActionCollection(children);
    },

    // not yet working
    url: function () {
      return base.Url.combine(this.connector.connection.url,
        "actions", this.get("signature"));
    },

    fetch: function (options) {
      log.debug("Fetching action with the ID {0}.", this.get("signature")) &&
      console.log(log.last);
      return Backbone.Model.prototype.fetch.call(this, options);
    },

    parse: function (response) {
      var action = response;

      //if (log.debug("Parsing action \"{0}\" ({1}).", action.name, action.url)) {
      //  console.log(log.last);
      //  console.log(response);
      //}

      if (this.children) {
        // TODO: make the REST API return array or nothing; the children
        // property is supposed top be a collection.  It returns an empty
        // object literal if there are no children, while the clients like
        // Backbone.Collection expect an array or nothing.
        var children = _.isArray(action.children) && action.children || [];
        this.children.reset(children);
      }

      return action;
    }

  });

  return ActionModel;

});

csui.define('nuc/models/actions',["module", "nuc/lib/jquery", "nuc/lib/underscore", "nuc/lib/backbone",
  "nuc/utils/log", "nuc/utils/base", "nuc/models/action"
], function (module, $, _, Backbone, log, base, ActionModel) {
  "use strict";

  // ActionCollection
  // ----------------

  var ActionCollection = Backbone.Collection.extend({

    model: ActionModel,

    constructor: function ActionCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.options = options || {};
    },

    // Finds an action by its cid or signature (id) recursively; if the
    // action doesn't exist in the models of this collection, it will be
    // looked for in children of those models recursively.
    findRecursively: function (id) {
      // search the terminal actions in the collection first
      var action = this.get({ cid: id }) || this.find(function (item) {
        return item.get('signature') === id;
      });
      // if not found, try all the submenus
      if (!action)
      // make an array of all action finding results produced
      // recursively and pick the first action found
      {
        action = _.find(this.map(function (item) {
          // if the submenu isn't empty handle it as another action
          // collection recursively - get the action or undefined
          // if it wasn't found
          return item.children.findRecursively(id);
          // pick the first action which is not undefined
        }), function (item) {
          return item;
        });
      }
      return action;
    }

  });

  // Module
  // ------

  _.extend(ActionCollection, {
    version: '1.0'
  });

  return ActionCollection;

});

csui.define('nuc/models/mixins/rules.matching/rules.matching.mixin',[
  'module', 'nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/log'
], function (module, _, Backbone, log) {
  'use strict';

  log = log(module.id);

  var RulesMatchingMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeRulesMatching: function (options) {
          return this;
        },

        rulesToMatch: [
          'equals', 'contains', 'startsWith', 'endsWith', 'matches',
          'includes', 'equalsNoCase', 'containsNoCase', 'startsWithNoCase',
          'endsWithNoCase', 'matchesNoCase', 'includesNoCase',  'has',
          'decides', 'or', 'and', 'not'
        ],

        matchRules: function (model, operations, options, combine) {
          var results = _.chain(this.rulesToMatch)
                         .map(function (operation) {
                           var operands = operations[operation];
                           return operands === undefined ? undefined :
                                  this['_evaluate-' + operation](model, operands, options);
                         }, this)
                         .filter(function (result) {
                           return result !== undefined;
                         })
                         .value();
          return !results.length ||
                 _[combine || 'any'](results, function (result) {
                   return result === true;
                 });
        },

        _getRulingPropertyValue: function (model, name) {
          if (typeof name !== 'string') {
            if (name == null) {
              name = 'null';
            }
            log.warn('Invalid property name in the action rule specification: {0}',
                name) && console.warn(log.last);
            return null;
          }
          var names = name.split('.'),
              value = model instanceof Backbone.Model ?
                      model.attributes : model || {};
          _.find(names, function (name) {
            value = value[name];
            if (value == null) {
              value = null;
              return true;
            }
          });
          return value;
        },

        '_evaluate-or': function (model, operations, options) {
          if (_.isArray(operations)) {
            return _.any(operations, function (operation) {
              return this.matchRules(model, operation, options);
            }, this);
          }
          return this.matchRules(model, operations, options, 'any');
        },

        '_evaluate-and': function (model, operations, options) {
          if (_.isArray(operations)) {
            return _.all(operations, function (operation) {
              return this.matchRules(model, operation, options);
            }, this);
          }
          return this.matchRules(model, operations, options, 'all');
        },

        '_evaluate-not': function (model, operations, options) {
          return !this.matchRules(model, operations, options);
        },

        '_evaluate-equals': function (model, operands) {
          return this._evaluateEquals(model, operands, false);
        },

        '_evaluate-equalsNoCase': function (model, operands) {
          return this._evaluateEquals(model, operands, true);
        },

        _evaluateEquals: function (model, operands, noCase) {
          return _.any(operands, function (values, key) {
            var actual = this._getRulingPropertyValue(model, key);
            _.isArray(values) || (values = [values]);
            if (noCase) {
              var normalized = this._normalizeCase(actual, values);
              actual = normalized.actual;
              values = normalized.values;
            }
            return _.any(values, function (value) {
              return value == actual;
            });
          }, this);
        },

        '_evaluate-contains': function (model, operands) {
          return this._evaluateContains(model, operands, false);
        },

        '_evaluate-containsNoCase': function (model, operands) {
          return this._evaluateContains(model, operands, true);
        },

        _evaluateContains: function (model, operands, noCase) {
          return _.any(operands, function (values, key) {
            var actual = this._getRulingPropertyValue(model, key) || '';
            actual && (actual = actual.toString()) || (actual = []);
            _.isArray(values) || (values = [values]);
            if (noCase) {
              var normalized = this._normalizeCase(actual, values);
              actual = normalized.actual;
              values = normalized.values;
            }
            return _.any(values, function (value) {
              return actual.indexOf(value) >= 0;
            });
          }, this);
        },

        '_evaluate-startsWith': function (model, operands) {
          return this._evaluateStartsWith(model, operands, false);
        },

        '_evaluate-startsWithNoCase': function (model, operands) {
          return this._evaluateStartsWith(model, operands, true);
        },

        _evaluateStartsWith: function (model, operands, noCase) {
          return _.any(operands, function (values, key) {
            var actual = this._getRulingPropertyValue(model, key) || '';
            actual && (actual = actual.toString()) || (actual = '');
            _.isArray(values) || (values = [values]);
            if (noCase) {
              var normalized = this._normalizeCase(actual, values);
              actual = normalized.actual;
              values = normalized.values;
            }
            return _.any(values, function (value) {
              return actual.indexOf(value) === 0;
            });
          }, this);
        },

        '_evaluate-endsWith': function (model, operands) {
          return this._evaluateEndsWith(model, operands, false);
        },

        '_evaluate-endsWithNoCase': function (model, operands) {
          return this._evaluateEndsWith(model, operands, true);
        },

        _evaluateEndsWith: function (model, operands, noCase) {
          return _.any(operands, function (values, key) {
            var actual = this._getRulingPropertyValue(model, key) || '';
            actual && (actual = actual.toString()) || (actual = '');
            _.isArray(values) || (values = [values]);
            if (noCase) {
              var normalized = this._normalizeCase(actual, values);
              actual = normalized.actual;
              values = normalized.values;
            }
            return _.any(values, function (value) {
              return _.str.endsWith(actual, value);
            });
          }, this);
        },

        '_evaluate-matches': function (model, operands) {
          return this._evaluateMatches(model, operands, false);
        },

        '_evaluate-matchesNoCase': function (model, operands) {
          return this._evaluateMatches(model, operands, true);
        },

        _evaluateMatches: function (model, operands, noCase) {
          return _.any(operands, function (values, key) {
            var actual = this._getRulingPropertyValue(model, key) || '';
            actual && (actual = actual.toString()) || (actual = '');
            _.isArray(values) || (values = [values]);
            if (noCase) {
              var normalized = this._normalizeCase(actual, values);
              actual = normalized.actual;
              values = normalized.values;
            }
            return _.any(values, function (value) {
              if (typeof value === 'string') {
                value = new RegExp(value);
              }
              return value.test(actual);
            });
          }, this);
        },

        '_evaluate-includes': function (model, operands) {
          return this._evaluateIncludes(model, operands, false);
        },

        '_evaluate-includesNoCase': function (model, operands) {
          return this._evaluateIncludes(model, operands, true);
        },

        _evaluateIncludes: function (model, operands, noCase) {
          return _.any(operands, function (values, key) {
            var actual = this._getRulingPropertyValue(model, key) || [];
            if (!_.isArray(actual)) {
              if (_.isObject(actual)) {
                actual = Object.keys(actual);
              } else {
                actual = [actual];
              }
            }
            if (!_.isArray(values)) {
              values = [values];
            }
            if (noCase) {
              var normalized = this._normalizeCase(actual, values);
              actual = normalized.actual;
              values = normalized.values;
            }
            return _.any(values, function (value) {
              return _.contains(actual, value);
            });
          }, this);
        },

        '_evaluate-has': function (model, operands) {
          _.isArray(operands) || (operands = [operands]);
          return _.any(operands, function (name) {
            return this._getRulingPropertyValue(model, name) != null;
          }, this);
        },

        '_evaluate-decides': function (model, methods, options) {
          _.isArray(methods) || (methods = [methods]);
          return _.any(methods, function (method) {
            return method(model, options);
          });
        },

        _normalizeCase: function (actual, values) {
          if (typeof actual === 'string') {
            actual = actual.toLowerCase();
          }
          values = _.map(values, function (value) {
            return typeof value === 'string' ? value.toLowerCase() : value;
          });
          return {
            actual: actual,
            values: values
          };
        }
      });
    }
  };

  return RulesMatchingMixin;
});

csui.define('nuc/models/actionitem',[
  'nuc/lib/underscore', 'nuc/lib/backbone',
  'nuc/models/mixins/rules.matching/rules.matching.mixin'
], function (_, Backbone, RulesMatchingMixin) {
  'use strict';

  // {
  //   type:        node type to work at (for compatibility only; use operations)
  //   <operation>: selects the action, if it evaluates to true; operations are
  //                equals, differs, includes, excludes, startsWith, endsWith,
  //                decides, or, and, not
  //   signature:   unique identifier of the command to refer to
  //   name:        optional title if the action appears on a label
  //   sequence:    number controlling the priority of processing
  //                this item during the default action evaluation
  // }

  var ActionItemModel = Backbone.Model.extend({

    idAttribute: null,

    defaults: {
      sequence: 100,
      signature: null
    },

    constructor: function ActionItemModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    },

    enabled: function (node) {
      // Compatibility with the previous forms with just type property;
      // not with boolean operations working on node properties
      var type = this.get('type');
      if (type !== undefined) {
        return type == node.get('type');
      }
      return this.matchRules(node, this.attributes);
    }

  });

  RulesMatchingMixin.mixin(ActionItemModel.prototype);

  return ActionItemModel;

});

csui.define('nuc/models/actionitems',['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/models/actionitem'
], function (_, Backbone, ActionItemModel) {
  'use strict';

  var ActionItemCollection = Backbone.Collection.extend({

    model: ActionItemModel,
    comparator: 'sequence',

    constructor: function ActionItemCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findByNode: function (node) {
      return this.find(function (item) {
        return item.enabled(node);
      });
    },

    getAllSignatures: function () {
      return _
          .chain(this.pluck('signature'))
          .unique()
          .value();
    },

    // This method does not return command signatures, but command keys.
    getAllCommandSignatures: function (commands) {
      return _
          .chain(this.getAllSignatures())
          .map(function (signature) {
            var command = commands.get(signature);
            if (command) {
              var commandKey = command.getCommandKey && command.getCommandKey()
                || command.get('command_key') || [];
              // If there are multiple command keys to check, take just the
              // first one, which is the V2 one needed for the URL query
              var firstCommandKey = commandKey[0];
              // If the 'default' command key is requested, add the concrete
              // key too; v1 expects 'default' and v2 'open', while the
              // concrete action would be at the third place then.
              if (firstCommandKey === 'default') {
                return ['default', 'open', commandKey[2]];
              }
              return commandKey;
            }
          })
          .flatten()
          .compact()
          .invoke('toLowerCase')
          .unique()
          .value();
    },

    getPromotedCommandsSignatures: function () {
      return _
          .chain(this.getAllSignatures())
          .flatten()
          .compact()
          .invoke('toLowerCase')
          .unique()
          .value();
    }

  });

  return ActionItemCollection;

});

csui.define('nuc/models/addabletype',["module", "nuc/lib/backbone", "nuc/utils/log"
], function (module, Backbone, log) {

  var AddableTypeModel = Backbone.Model.extend({

    constructor: function AddableTypeModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    parse: function (response) {
      //~ if (log.debug("Parsing addableItem \"{0}\" ({1}, {2}).",
      //~ response.name, response.id, response.type)) {
      //~ console.log(log.last);
      //~ console.log(response);
      //~ }

      return response;
    }

  });
  AddableTypeModel.version = '1.0';
  AddableTypeModel.Hidden = -1;

  return AddableTypeModel;

});

csui.define('nuc/models/addabletypes',["module", "nuc/lib/backbone", "nuc/utils/log", "nuc/models/addabletype"
], function (module, Backbone, log, AddableTypeModel) {

  var AddableTypeCollection = Backbone.Collection.extend({

    model: AddableTypeModel,

    constructor: function AddableTypeCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.options = options || {};
    }

  });
  AddableTypeCollection.version = '1.0';

  return AddableTypeCollection;

});

csui.define('nuc/models/mixins/connectable/connectable.mixin',['nuc/lib/underscore'
], function (_) {
  "use strict";

  /**
   * @class ConnectableMixin
   * @mixin
   */
  var ConnectableMixin = {

    mixin: function (prototype) {
      var originalPrepareModel = prototype._prepareModel;

      return _.extend(prototype, /** @lends ConnectableMixin# */ {

        /**
         * connector
         * @memberof ConnectableMixin
         * @instance
         * @description The `Connector` instance assigned to this model or collection (object, read-only)
         */

        /**
         * @function
         * @param options {Object} - Recognized option properties:

         connector: The `Connector` instance to use.  If it is not provided, the connector has to
         be assigned at latest before the server is accessed or resource URL is computed.
         (object, `undefined` by default)

         * @returns {ConnectableMixin}
         * @description Must be called in the constructor to initialize the mixin functionality.
         Expects the Backbone.Model or Backbone.Collection constructor options passed in.


         */
        makeConnectable: function (options) {
          options && options.connector && options.connector.assignTo(this);
          return this;
        },

        /**
         * @function
         * @param attrs
         * @param options
         * @returns {*}
         * @private
         */
        _prepareModel: function (attrs, options) {
          options || (options = {});
          if (!options.connector) {
            options.connector = this.connector;
          }
          return originalPrepareModel.call(this, attrs, options);
        }

      });
    }

  };

  return ConnectableMixin;

});

csui.define('nuc/models/ancestor',['module', 'nuc/lib/backbone',
  'nuc/models/mixins/connectable/connectable.mixin'
], function (module, Backbone, ConnectableMixin) {

  var AncestorModel = Backbone.Model.extend({

    constructor: function AncestorModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      this.makeConnectable(options);
    },

    idAttribute: null,

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }

  });

  ConnectableMixin.mixin(AncestorModel.prototype);

  return AncestorModel;

});

csui.define('nuc/models/ancestors',["module", "nuc/lib/backbone", "nuc/utils/log", "nuc/models/ancestor"
], function (module, Backbone, log, AncestorModel) {

  var AncestorCollection = Backbone.Collection.extend({

    model: AncestorModel,

    constructor: function AncestorCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.options = options || {};
    }

  });
  AncestorCollection.version = '1.0';

  return AncestorCollection;

});

csui.define('nuc/models/mixins/expandable/expandable.mixin',['nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  "use strict";

  var ExpandableMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {

        makeExpandable: function (options) {
          var expand = options && options.expand;
          if (typeof expand === 'string') {
            expand = expand.split(',');
          }
          this.expand = expand || [];
          return this;
        },

        setExpand: function (name) {
          if (!_.isArray(name)) {
            name = name.split(",");
          }
          _.each(name, function (name) {
            if (!_.contains(this.expand, name)) {
              if (this.expand instanceof Object && this.expand.properties) {
                this.expand.properties.push(name);
              } else {
                this.expand.push(name);
              }
            }
          }, this);
        },

        resetExpand: function (name) {
          if (name) {
            if (!_.isArray(name)) {
              name = name.split(",");
            }
            _.each(name, function (name) {
              var index = _.indexOf(this.expand, name);
              if (index >= 0) {
                this.expand.splice(index, 1);
              }
            }, this);
          } else {
            this.expand.splice(0, this.expand.length);
          }
        },

        getExpandableResourcesUrlQuery: function () {
          return {expand: this.expand};
        }

      });
    }

  };

  return ExpandableMixin;

});

csui.define('nuc/models/mixins/fetchable/fetchable.mixin',[
  'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/utils/base'
], function (_, $, Backbone, base) {
  'use strict';

  var FetchableMixin = {
    mixin: function (prototype) {
      var originalFetch = prototype.fetch;

      return _.extend(prototype, {
        makeFetchable: function (options) {
          this.autoreset = options && options.autoreset;
          // Workaround for change/add/reset events, which are fired before
          // the caller is informed by sync that fetch successed.
          return this.on('reset', this._beforeFetchSucceeded, this)
              .on('add', this._beforeFetchSucceeded, this)
              .on('remove', this._beforeFetchSucceeded, this)
              .on('change', this._beforeFetchSucceeded, this);
        },

        _beforeFetchSucceeded: function () {
          this._fetchingOriginal && this._fetchSucceeded();
        },

        _fetchStarted: function () {
          this.fetched = false;
          this.error = null;
        },

        _fetchSucceeded: function () {
          this._fetchingOriginal = this.fetching = false;
          this.fetched = true;
          this.error = undefined;
        },

        _fetchFailed: function (jqxhr) {
          this._fetchingOriginal = this.fetching = false;
          this.error = new base.Error(jqxhr);
        },

        fetch: function (options) {
          var fetching = this.fetching;
          if (!fetching) {
            options = _.defaults(options || {}, {
              cache: true,
              urlBase: this.urlCacheBase? this.urlCacheBase(): undefined
            });

            this._fetchStarted();
            options = this._prepareFetch(options);
            // Ensure that the model is marked fetched before other events are
            // triggered.  If fetching is not silent, change/add/reset will be
            // triggered earlier: change/add/reset, options.*, sync, promise.
            var self = this,
                success = options.success,
                error = options.error;
            options.success = function () {
              self._fetchSucceeded();
              success && success.apply(this, arguments);
            };
            options.error = function (model, jqxhr, options) {
              self._fetchFailed(jqxhr);
              error && error.apply(this, arguments);
            };
            this._fetchingOriginal = true;
            fetching = originalFetch.call(this, options);
            // If the fetch or sync method are implemented synchronously,
            // model or collection changing events are fired earlier than
            // the original fetch call returns the promise
            if (this._fetchingOriginal) {
              this.fetching = fetching;
            }
          }
          return fetching;
        },

        _prepareFetch: function (options) {
          // Trigger just one item adding operation after fetching if wanted.
          options || (options = {});
          options.reset === undefined && this.autoreset && (options.reset = true);
          return options;
        },

        ensureFetched: function (options) {
          if (this.fetched) {
            if (options && options.success) {
              options.success(this);
            }
            return $.Deferred()
                .resolve(this, {}, options)
                .promise();
          }
          return this.fetch(options);
        },

        invalidateFetch: function () {
          if (!this.fetching) {
            this.fetched = false;
            this.error = null;
            return true;
          }
        },

        markFetched: function() {
          if (!this.fetching) {
            this.fetched = true;
            this.error = null;
            return true;
          }
        },

        prefetch: function (response, options) {
          var deferred = $.Deferred();
          options = _.defaults(options, {parse: true});
          options = this._prepareFetch(options);
          var silent = options.silent;
          this.error = null;
          this.fetched = false;
          this.fetching = deferred.promise();
          if (!silent) {
            this.trigger('request', this, response, options);
          }
          setTimeout(function () {
            this._fetchSucceeded();
            if (this instanceof Backbone.Model) {
              var attributes = options.parse ? this.parse(response, options) :
                                               response;
              this.set(attributes, options);
            } else {
              var method = options.reset ? 'reset' : 'set';
              this[method](response, options);
            }
            if (options.success) {
              options.success.call(options.context, this, response, options);
            }
            if (!silent) {
              this.trigger('sync', this, response, options);
            }
            deferred.resolve();
          }.bind(this));
          return this.fetching;
        }
      });
    }
  };

  return FetchableMixin;
});

csui.define('nuc/models/mixins/autofetchable/autofetchable.mixin',['nuc/lib/underscore'
], function (_) {
  "use strict";

  var AutoFetchableMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeAutoFetchable: function (options) {
          var autofetchEvent = options && options.autofetchEvent;
          if (autofetchEvent) {
            this._autofetchEvent = options.autofetchEvent;
          }
          var autofetch = options && options.autofetch;
          if (autofetch) {
            this.automateFetch(autofetch);
          }
          return this;
        },

        automateFetch: function (enable) {
          var event = _.result(this, '_autofetchEvent'),
              method = enable ? 'on' : 'off';
          this.autofetch = !!enable;
          this[method](event, _.bind(this._fetchAutomatically, this, enable));
        },

        isFetchable: function () {
          return !!this.get('id');
        },

        _autofetchEvent: 'change:id',

        _fetchAutomatically: function (options) {
          this.isFetchable() && this.fetch(_.isObject(options) && options);
        }
      });
    }
  };

  return AutoFetchableMixin;
});

csui.define('nuc/models/mixins/resource/resource.mixin',['nuc/lib/underscore', 'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/mixins/autofetchable/autofetchable.mixin'
], function (_, ConnectableMixin, FetchableMixin, AutoFetchableMixin) {
  'use strict';

/**
 * @class ResourceMixin
 * @see {@link ConnectableMixin}
 * @see {@link FetchableMixin}
 * @see {@link AutoFetchableMixin}
 * @mixin
 *
 * @description Helps implementing a model for a typical server resource, which has an identifier
 (the property 'id' by default), by combining the following three mixins:
 {@link ConnectableMixin}, {@link FetchableMixin} and {@link AutoFetchableMixin}.

 ### How to apply the mixin to a model

 ```
 var MyModel = Backbone.Model.extend({

  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this.makeResource(options);
  },

  urlRoot: function () {
    return Url.combine(this.connector.connection.url, 'myresources');
  }

});

 ResourceMixin.mixin(MyModel.prototype);
 ```

 ## Remarks

 The included `FetchableMixin` overrides the `fetch` method and calls the original
 implementation from it.  If you supply your own custom implementation of this method,
 or use another mixin which overrides it, you should apply this mixin after yours.

 ### How use the mixin

 Specify the model attributes, the connector and fetch the model:

 ```
 // Specify the attributes and the connector when creating the model
 var connector = new Connector(...),
 model = new MyModel({
      id: 2000
    }, {
      connector: connector
    });
 model.fetch();

 // Set the attributes and the connector after creating the model
 model.set('id', 2000);
 connector.assignTo(model);
 model.fetch();
 ```

 */

 var ResourceMixin = {

    mixin: function (prototype) {
      ConnectableMixin.mixin(prototype);
      FetchableMixin.mixin(prototype);
      AutoFetchableMixin.mixin(prototype);

      return _.extend(prototype, {

        makeResource: function (options) {
          return this.makeConnectable(options)
              .makeFetchable(options)
              .makeAutoFetchable(options);
        }

      });
    }

  };

  return ResourceMixin;

});

csui.define('nuc/models/mixins/including.additional.resources/including.additional.resources.mixin',['nuc/lib/underscore', 'nuc/lib/jquery'
], function (_, $) {

  var IncludingAdditionalResourcesMixin = {

    mixin: function (prototype) {

      return _.extend(prototype, {

        makeIncludingAdditionalResources: function (options) {
          this._additionalResources = [];
          if (options && options.includeResources) {
            this.includeResources(options.includeResources);
          }
          return this;
        },

        includeResources: function (names) {
          if (!_.isArray(names)) {
            names = names.split(',');
          }
          this._additionalResources = _.union(this._additionalResources, names);
        },

        excludeResources: function (names) {
          if (names) {
            if (!_.isArray(names)) {
              names = names.split(',');
            }
            this._additionalResources = _.reject(this._additionalResources, names);
          } else {
            this._additionalResources.splice(0, this._additionalResources.length);
          }
        },

        getAdditionalResourcesUrlQuery: function () {
          return _.reduce(this._additionalResources, function (result, parameter) {
            result[parameter] = 'true';
            return result;
          }, {});
        }

      });

    }

  };

  return IncludingAdditionalResourcesMixin;

});

csui.define('nuc/models/authenticated.user/server.adaptor.mixin',[
  'nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var apiBase = new Url(this.connector.connection.url).getApiBase('v1'),
              url = Url.combine(apiBase, '/auth'),
              query = Url.combineQueryString(
                this.getExpandableResourcesUrlQuery(),
                this.getAdditionalResourcesUrlQuery()
              );
          return query ? url + '?' + query : url;
        },
    
        parse: function (response) {
          var user = response.data || {};
          user.perspective = response.perspective;
          return user;
        }
      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('nuc/models/authenticated.user',[
  'nuc/lib/backbone', 'nuc/models/mixins/expandable/expandable.mixin',
  'nuc/models/mixins/resource/resource.mixin',
  'nuc/models/mixins/including.additional.resources/including.additional.resources.mixin',
  'nuc/models/authenticated.user/server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin,
    IncludingAdditionalResourcesMixin, ServerAdaptorMixin) {
  'use strict';

  var AuthenticatedUserModel = Backbone.Model.extend({
    constructor: function AuthenticatedUserModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options)
          .makeIncludingAdditionalResources(options)
          .makeExpandable(options)
          .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  IncludingAdditionalResourcesMixin.mixin(AuthenticatedUserModel.prototype);
  ExpandableMixin.mixin(AuthenticatedUserModel.prototype);
  ResourceMixin.mixin(AuthenticatedUserModel.prototype);
  ServerAdaptorMixin.mixin(AuthenticatedUserModel.prototype);

  return AuthenticatedUserModel;
});

csui.define('nuc/models/mixins/uploadable/uploadable.mixin',[
  'module', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/backbone', 'nuc/utils/log'
], function (module, _, $, Backbone, log) {
  'use strict';

  log = log(module.id);

  var config = _.extend({
    useJson: false,
    useMock: false,
    usePatch: false,
    metadataPartName: 'body'
  }, module.config());

/**
 * @class UploadableMixin
 * @see {@link ConnectableMixin}
 * @see {@link ResourceMixin}
 * @mixin
 *
 * @description Enables creating and modifying the resource behind a `Backbone.Model`.
 Simplifies requests with multi-part content, enables mocking by mockjax
 and supports pasing the JSON body as form-encoded parameter "body".
 Also introduces the `prepare` method to "massage" request body similarly
 to the `parse` method for the response body.

 ### How to apply the mixin to a model

 ```
 var MyModel = Backbone.Model.extend({
  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this.makeConnectable(options)
        .makeUploadable(options);
  },

  url: function () {
    return Url.combine(this.connector.connection.url, 'myresource')
  }
});

 ConnectableMixin.mixin(MyModel.prototype);
 UploadableMixin.mixin(MyModel.prototype);
 ```

 This mixin us usually combined together with the `ConnectableMixin`
 or with another cumulated mixin which includes it.

 ### How to use the mixin

 It just works whenever you call the `save` method of the model.

 ## makeUploadable(options) : this

 Must be called in the constructor to initialize the mixin functionality.
 Expects the Backbone.Model or Backbone.Collection constructor options passed in.

 ## prepare(data, options) : object

 Can be overridden to "massage" the data, which are going to be sent to the
 server in the request body. If not overridden, the unchanged input of the
 `save` method, or `this.attributes`, will be sent to the server as-is.
 The `prepare` method converts model attributes to the request body object,
 so that the server accepts it, like the `parse` method converts the response
 body object to model attributes, so that the client understands them.

 ```javascript
 // For example, the server sends and receives resource attributes wrapped
 // in an object with a `data` property.
 var MyModel = Backbone.Model.extend({
  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this.makeUploadable(options);
  },

  prepare: function (data, options) {
    return {data: data};
  },

  parse: function (response, options) {
    return response.data;
  }
});
 UploadableMixin.mixin(MyModel.prototype);
 ```

 Calling the `prepare` method can be prevented by setting the `prepare`
 option to `false`, similarly to preventing the `parse` method from being
 called by setting the `parse` option to `false`.

 */

 var UploadableMixin = {

    mixin: function (prototype) {
      var originalSync = prototype.sync;

      // Mixins are applied after the prototype has been defined. This
      // method is supposed to be overridden in the original prototype.
      if (!prototype.prepare) {
        prototype.prepare = function (data, options) {
          return data;
        };
      }

      // Let model's prototype prepare formData to post otherwise, have a default impl.
      if (!prototype.prepareFormData) {
        prototype.prepareFormData = function (data, options) {
          return {body: JSON.stringify(data)};
        };
      }

      return _.extend(prototype, {
        makeUploadable: function (options) {
          return this;
        },

        sync: function (method, model, options) {
          var useJson          = UploadableMixin.useJSON,
              useMock          = UploadableMixin.mock,
              usePatch         = UploadableMixin.usePatch,
              metadataPartName = UploadableMixin.metadataPartName,
              data             = options.data || options.attrs || this.attributes;

          // Allow data "massage", before sending them to the server.
          if (options.prepare !== false) {
            data = this.prepare(data, options);
          }

          // Make sure, that POST and PUT urls do not contain the URL query
          // part.  It is not possible to ensure it inside the url function.
          function currectUpdatingUrl() {
            var url = options.url || _.result(model, 'url');
            return url.replace(/\?.*$/, '');
          }

          if (method === 'create') {
            log.debug('Creating {0} ({1}).',
                log.getObjectName(this), this.cid) && console.log(log.last);
            if (useMock) {
              // append file, if there is
              _.each(_.keys(options.files || {}), function (key) {
                var files = options.files[key], i;
                if (_.isArray(files) && files.length > 1) {
                  // TODO: Adapt this according to the server support;
                  // currently the server can consume only one file
                  for (i = 0; i < files.length; ++i) {
                    var name = i ? key + i : key;
                    data[name] = files[i];
                  }
                } else if (files) {
                  data[key] = files;
                }
              });

              _.extend(options, {
                data: data,
                contentType: 'application/json',
                url: currectUpdatingUrl()
              });
            } else if (!_.isEmpty(options.files)) {
              var formData = new FormData();
              data = JSON.stringify(data);
              if (useJson) {
                formData.append(metadataPartName,
                    new Blob([data], {type: 'application/json'}));
              } else {
                formData.append(metadataPartName, data);
              }

              // append file, if there is
              _.each(_.keys(options.files || {}), function (key) {
                var files = options.files[key], i;
                if (_.isArray(files) && files.length > 1) {
                  // TODO: Adapt this according to the server support;
                  // currently the server can consume only one file
                  for (i = 0; i < files.length; ++i) {
                    var name = i ? key + i : key;
                    formData.append(name, files[i]);
                  }
                } else if (files) {
                  formData.append(key, files, files.name);
                }
              });

              _.extend(options, {
                data: formData,
                contentType: false,
                url: currectUpdatingUrl()
              });
            } else {
              if (useJson) {
                _.extend(options, {
                  data: JSON.stringify(data),
                  contentType: 'application/json',
                  url: currectUpdatingUrl()
                });
              } else {
                data = this.prepareFormData(data);
                _.extend(options, {
                  data: $.param(data),
                  contentType: 'application/x-www-form-urlencoded',
                  url: currectUpdatingUrl()
                });
              }
            }
          } else if (method === 'update' || method === 'patch') {
            log.debug('Updating {0} ({1}).',
                log.getObjectName(this), this.cid) && console.log(log.last);
            if (!usePatch) {
              method = 'update';
            }
            // Send metadata_token automatically if it is present.
            // TODO: Move this to server adaptor, optionally as a model feature.
            var metadataToken = this.state && this.state.get('metadata_token');
            if (metadataToken != null) {
              data.metadata_token = metadataToken;
            }
            if (useMock) {
              _.extend(options, {
                data: data,
                contentType: 'application/json',
                url: currectUpdatingUrl()
              });
            } else if (useJson) {
              _.extend(options, {
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: currectUpdatingUrl()
              });
            } else {
              data = this.prepareFormData(data);
              _.extend(options, {
                data: $.param(data),
                contentType: 'application/x-www-form-urlencoded',
                url: currectUpdatingUrl()
              });
            }
          }
          return originalSync.call(this, method, model, options);
        }
      });
    },

    // Set to true to enable tests of PUT and PATCH; once the server
    // accepts application/json content type, change the default to true
    useJSON: config.useJson,

    // Set to true to enable unit tests of POST, PUT and PATCH; files
    // have to be looked up in the jqxhr settings object
    mock: config.useMock,

    // Set to true to enable usage of the PATCH verb, if the server
    // supports it
    usePatch: config.usePatch,

    // Set to true to enable usage of the PATCH verb, if the server
    // supports it
    metadataPartName: config.metadataPartName
  };

  return UploadableMixin;
});

csui.define('nuc/models/member/server.adaptor.mixin',[
  'nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        urlRoot: function () {
          var apiBase = new Url(this.connector.connection.url).getApiBase('v1');
          return Url.combine(apiBase, '/members');
        },

        url: function () {
          var query = Url.combineQueryString(this.getExpandableResourcesUrlQuery()),
              id = this.get('id'),
              url;
          if (id) {
            url = Url.combine(this.urlRoot(), id);
          } else {
            var apiBase = new Url(this.connector.connection.url).getApiBase('v1');
            url = Url.combine(apiBase, '/auth');
          }
          return query ? url + '?' + query : url;
        },

        parse: function (response) {
          return response.user || response.data || response;
        }
      });
    }

  };

  return ServerAdaptorMixin;
});

csui.define('nuc/models/member',['nuc/lib/backbone',
'nuc/models/mixins/expandable/expandable.mixin',
'nuc/models/mixins/resource/resource.mixin',
'nuc/models/mixins/uploadable/uploadable.mixin',
'nuc/models/mixins/including.additional.resources/including.additional.resources.mixin',
'nuc/models/member/server.adaptor.mixin'
], function (Backbone, ExpandableMixin, ResourceMixin,
  UploadableMixin, IncludingAdditionalResourcesMixin, ServerAdaptorMixin) {
    'use strict';

  var MemberModel = Backbone.Model.extend({

    imageAttribute: 'photo_url',
    
    constructor: function MemberModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.makeResource(options)
          .makeIncludingAdditionalResources(options)
          .makeUploadable(options)
          .makeExpandable(options)
          .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  IncludingAdditionalResourcesMixin.mixin(MemberModel.prototype);
  ExpandableMixin.mixin(MemberModel.prototype);
  UploadableMixin.mixin(MemberModel.prototype);
  ResourceMixin.mixin(MemberModel.prototype);
  ServerAdaptorMixin.mixin(MemberModel.prototype);

  return MemberModel;
});

csui.define('nuc/models/authentication',['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/url',
  'nuc/models/member', 'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin', 'nuc/models/mixins/expandable/expandable.mixin',
  'nuc/models/mixins/including.additional.resources/including.additional.resources.mixin'
], function (_, Backbone, Url, MemberModel, ConnectableMixin, FetchableMixin,
    ExpandableMixin, IncludingAdditionalResourcesMixin) {
  'use strict';

  var AuthenticationModel = Backbone.Model.extend({

    constructor: function AuthenticationModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      this.makeConnectable(options)
          .makeIncludingAdditionalResources(options)
          .makeFetchable(options)
          .makeExpandable(options);

      this.user = new MemberModel(this.get("user"), options);
    },

    idAttribute: null,

    url: function () {
      var url = Url.combine(this.connector.connection.url, "auth"),
          query = Url.combineQueryString(
              this.getExpandableResourcesUrlQuery(),
              this.getAdditionalResourcesUrlQuery()
          );
      return query ? url + '?' + query : url;
    },

    parse: function (response) {
      // Normalize the response to have always an user there.
      var user = response.user || (response.user = response.data);

      // Properties out of data are not passed to the constructor.  This
      // may yet get its own sub-model.
      _.defaults(user, {
        perspective: response.perspective
      });

      // Parse can be called from the parent constructor, before the
      // of this functional object has finished.  In that case, the
      // raw data will be returned in the parsed object; otherwise
      // they will be set to the existing nested collections.
      if (this.user) {
        this.user.set(user);
      }

      return response;
    }

  });

  IncludingAdditionalResourcesMixin.mixin(AuthenticationModel.prototype);
  ExpandableMixin.mixin(AuthenticationModel.prototype);
  ConnectableMixin.mixin(AuthenticationModel.prototype);
  FetchableMixin.mixin(AuthenticationModel.prototype);

  return AuthenticationModel;

});

csui.define('nuc/models/clientsidecollection',['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/base'
], function (_, Backbone, base) {
  'use strict';

  function ClientSideCollection() {
    var prototype = {

      clone: function () {
        // Provide the options; they may include connector and other parameters
        var clone = new this.constructor(this.models, this.options);
        // Clone sub-models not covered by Backbone
        if (this.columns) {
          clone.columns.reset(this.columns.toJSON());
        }
        // Clone properties about the full (not-yet fetched) collection
        clone.actualSkipCount = this.actualSkipCount;
        clone.totalCount = this.totalCount;
        clone.filteredCount = this.filteredCount;
        return clone;
      },

      _cacheCollection: function () {
        if (this.selfReset !== true) {
          this.selfReset = false;
          this.cachedCollection = this.clone();
        }
      },

      parse: function (response) {
        this.actualSkipCount = 0;
        this.totalCount = response.results.length;
        this.filteredCount = this.totalCount;

        this._limitResponse(response.results);

        this.columns && this.columns.resetColumnsV2(response, this.options);
        return response.results;
      },

      _limitResponse: function (elements) {
        if (elements && this.skipCount) {
          if (elements.length > this.skipCount) {
            elements.splice(0, this.skipCount);
          } else {
            this.actualSkipCount = 0;
          }
        }
        if (elements && this.topCount) {
          if (elements.length > this.topCount) {
            elements.splice(this.topCount);
          }
        }
      },

      _resetCollection: function () {
        if (!this.cachedCollection) {
          this._cacheCollection();
        }
        this.workingModels = _.clone(this.cachedCollection.models);
        this.totalCount = this.workingModels.length;
        this.filteredCount = this.workingModels.length;
      },

      _runAllOperations: function (reset) {
        this._resetCollection();
        this._sortCollection();
        this._filterCollection();
        this._limitCollection();
        this._triggerCollectionResetEvent(reset);
      },

      _triggerCollectionResetEvent: function (reset) {
        this.models = _.clone(this.workingModels);
        this.length = this.models.length;
        if (reset) {
          this.selfReset = true;
          this.trigger("reset", this);
        }
      },

      // client-side paging
      setLimit: function (skip, top, fetch) {
        if (this.skipCount != skip || this.topCount != top) {
          this.skipCount = skip;
          this.actualSkipCount = skip;
          this.topCount = top;

          this._runAllOperations(true);

          return true;
        }
      },

      _limitCollection: function () {
        this._limitResponse(this.workingModels);
      },

      resetLimit: function (fetch) {
        if (this.skipCount) {
          this.skipCount = 0;
          this.topCount = 0;
          this.actualSkipCount = 0;

          this._resetCollection();
          this._triggerCollectionResetEvent(true);

          return true;
        }
      },

      // client-side filtering
      setFilter: function (filterObj) {
        this.filterObj || (this.filterObj = {});
        if (_.isEmpty(filterObj)) {
          this.filterObj = {};
        } else {
          _.extend(this.filterObj, filterObj);
        }
        this._runAllOperations(true);
        return true;
      },

      clearFilter: function (fetch) {
        if (this.filterObj) {
          this.filterObj = undefined;
          this._resetCollection();
          this._triggerCollectionResetEvent(true);
          return true;
        }
      },

      _filterCollection: function () {
        for (var name in this.filterObj) {
          if (_.has(this.filterObj, name)) {
            var values = this.filterObj[name];
            if (values != null && values !== '') {
              _.isArray(values) || (values = [values]);
              this.workingModels = _.filter(this.workingModels, function (node) {
                var hay = parseValue(name, node.get(name));
                return _.any(values, function (value) {
                  var needle = parseValue(name, value);
                  if (name === 'type' && needle == -1) {
                    return node.get('container');
                  }
                  return containsValue(hay, needle);
                });
              });
            }
          }
        }
        this.totalCount = this.workingModels.length;
        this.filteredCount = this.workingModels.length;
      },

      // client-side sorting
      setOrder: function (attributes, fetch) {
        if (this.orderBy != attributes) {
          this.orderBy = attributes;
          this._runAllOperations();
          return true;
        }
      },

      resetOrder: function (fetch) {
        if (this.orderBy) {
          this.orderBy = undefined;
          this._resetCollection();
          this._triggerCollectionResetEvent();
          return true;
        }
      },

      _sortCollection: function () {
        if (this.orderBy) {
          var criteria = _.map(this.orderBy.split(','), function (criterium) {
            var parts = criterium.trim().split(' ');
            return {
              property: parts[0],
              descending: parts[1] === 'desc'
            };
          });

          this.workingModels.sort(function (left, right) {
            var result = 0;
            _.find(criteria, function (criterium) {
              left = parseValue(criterium.property, left.get(criterium.property));
              right = parseValue(criterium.property, right.get(criterium.property));

              result = compareValues(left, right);
              if (result) {
                if (criterium.descending) {
                  result *= -1;
                }
                return true;
              }
            });
            return result;
          });
        }
      }

    };
    prototype.ClientSideCollection = _.clone(prototype);

    return prototype;
  }

  // TODO: ClientSideBrowsableMixin should be used
  // and ClientSideCollection module disused

  function compareValues(left, right) {
    if (typeof left === 'string' && typeof right === 'string') {
      // FIXME: Implement the locale-specific comparison only for localizable strings;
      // not for values with internal system constants, which can be case-sensitive
      return base.localeCompareString(left, right, {usage:'sort'});
    }
    if (left != right) {
      if (left > right || right === void 0) {
        return 1;
      }
      if (left < right || left === void 0) {
        return -1;
      }
    }
    return 0;
  }

  function containsValue(hay, needle) {
    if (typeof hay === 'string' && typeof needle === 'string') {
      // FIXME: Implement the locale-specific comparison only for localizable strings;
      // not for values with internal system constants, which can be case-sensitive
      return base.localeContainsString(hay, needle.toString());
    }
    return hay == needle;
  }

  // FIXME: Use metadata to get the correct value type for parsing
  function parseValue(property, value) {
    if (value != null) {
      if (property === 'type') {
        return +value;
      }
      if (property.indexOf('date') >= 0) {
        return new Date(value);
      }
    }
    return value;
  }

  return ClientSideCollection;

});

csui.define('nuc/models/column',["module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/url",
  "nuc/utils/log"
], function (module, _, Backbone, Url, log) {

  var ColumnModel = Backbone.Model.extend({

    constructor: function ColumnModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    },

    idAttribute: null,

    parse: function (response) {
      //~ if (log.debug("Parsing column \"{0}\" ({1}, {2}).",
      //~ response.name, response.column_key, response.id)) {
      //~ console.log(log.last);
      //~ console.log(response);
      //~ }

      // TODO: support these attributes on the server too.
      switch (response.column_key) {
      case "name":
        response = _.extend(response, {
          default_action: true,
          contextual_menu: false,
          editable: true,
          filter_key: "name"
        });
        break;
      case "type":
        response = _.extend(response, {
          default_action: true
        });
        break;
      }

      return response;
    }

  });
  ColumnModel.version = '1.0';

  return ColumnModel;

});

csui.define('nuc/models/columns',["module", "nuc/lib/backbone",
  "nuc/utils/log", "nuc/models/column"
], function (module, Backbone, log, ColumnModel) {

  var ColumnCollection = Backbone.Collection.extend({

    model: ColumnModel,

    constructor: function ColumnCollection() {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    }

  });
  ColumnCollection.version = '1.0';

  return ColumnCollection;

});

csui.define('nuc/models/datadefinition',[ "module", "nuc/lib/backbone", "nuc/utils/log"
],  function ( module, Backbone, log )
  {
    "use strict";

    //
    // Data-Definition Model.
    //
    var DataDefinitionModel = Backbone.Model.extend({

      constructor: function DataDefinitionModel() {
        Backbone.Model.prototype.constructor.apply(this, arguments);
      },

      idAttribute: null,

      parse: function (response) {
        return response;
      }

    });

    DataDefinitionModel.version = '1.0';

    return DataDefinitionModel;

  });

csui.define('nuc/models/datadefinitions',[ "module", "nuc/lib/underscore", "nuc/lib/backbone",
         "nuc/utils/log", "nuc/utils/base", "nuc/models/datadefinition"
], function( module, _, Backbone,
             log, base, DataDefinitionModel )
  {
    "use strict";

    //
    // Generic Data-Definition Collection.
    //
    // Params in constructor:
    // - models: can be passed in or undefined
    // - options:
    //   Two possible ways with the 'options' in constructor as in the following examples:
    //   1) options = {
    //        connector: connector,
    //        url: "api/v1/nodes/2000"
    //      }
    //   2) options = {
    //        node: node,
    //        [nodeResource: "actions"]  // optional
    //      }
    //
    var DataDefinitionCollection = Backbone.Collection.extend({

      model: DataDefinitionModel,

      constructor: function DataDefinitionCollection( models, options ) {
        Backbone.Collection.prototype.constructor.apply(this, arguments);
        this.setOptions( options );
      },

      // public
      setOptions: function( options ) {
        this.options = options ? options : {};
        this.options.connector && this.options.connector.assignTo(this);
        this.options.node && this.options.node.connector && this.options.node.connector.assignTo(this);
      },

      url: function() {
        var url;
        if( this.options.url ) {
          var cgiPath = new base.Url(this.connector.connection.url).getCgiScript(true);
          url = base.Url.combine( cgiPath, this.options.url );
        } else {
          url = this.options.node && this.options.node.urlBase();
          if( this.options.nodeResource ) {
            url = base.Url.combine( url, this.options.nodeResource );
          }
        }
        return url;
      },

      fetch: function( options ) {
        log.debug( "Fetching data-definitions for url '{0}'.", this.url()) &&
          typeof console !== 'undefined' && console.log( log.last );

        options || (options = {});
        if( options.reset === undefined ) {
          options.reset = true;
        }

        return Backbone.Collection.prototype.fetch.call( this, options );
      },

      parse: function( response, options ) {
        this.data = response.data || {};
        this.definitions = response.definitions || {};
        this.definitions_map = response.definitions_map || {};
        this.definitions_order = response.definitions_order || {};

        // construct a flat structure
        this.definitions_flat = {};
        _.each( this.definitions, function( def, key ) {
          var definition = _.extend(
            {
              signature: key,
              href: this.data[key]
            },
            def
          );
          this.definitions_flat[key] = definition;
        }, this);

        return Backbone.Collection.prototype.parse.call( this,
          this.definitions_flat, options);
      },

      // public
      GetDefinitionsOrder: function() {
        return this.definitions_order;
      },

      // public
      GetDefinitionMap: function() {
        return this.definitions_map;
      },

      // public
      GetDefinition: function( signature ) {
        return this.definitions[signature];
      },

      // public: get the flat definitions structure of data-definitions
      GetFlatCollection: function() {
        return this.definitions_flat || {};
      },

      // public: return a flat definition based on the requested definition key
      GetFlatDefinition: function( def ) {
        return this.definitions_flat[def];
      }

    });

    _.extend( DataDefinitionCollection, { version: '1.0' } );

    return DataDefinitionCollection;

  });

csui.define('nuc/models/member/member.server.adaptor.mixin',[
  'nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var id  = this.get("id"),
              url = this.connector.getConnectionUrl().getApiBase('v2');
          if(!id && this.options.id) {
            id = this.options.id;
          }
          if (id) {
            url = Url.combine(url, "members/" + id + "/members");
          } else {
            url = Url.combine(url, "members");
          }
          return url;
        },

        parse: function (response) {
          var that = this;
          if (response.data !== undefined) {
            var memberId = this.get("id");
            _.each(response.data, function (member) {
              member.parentId = memberId;
            });

            return response;
          }
          return response;
        }
      });
    }

  };

  return ServerAdaptorMixin;
});

csui.define('nuc/models/member/member.model',['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/url',
  'nuc/models/mixins/resource/resource.mixin',
  'nuc/models/mixins/uploadable/uploadable.mixin',
  'nuc/models/member/member.server.adaptor.mixin'
], function (_, Backbone, Url, ResourceMixin, UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var MemberModel = Backbone.Model.extend({
    constructor: function MemberModel(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
      this.options = options;
      this.groupId = attributes.groupId;
      this.makeResource(options);
    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    }
  });

  UploadableMixin.mixin(MemberModel.prototype);
  ResourceMixin.mixin(MemberModel.prototype);
  ServerAdaptorMixin.mixin(MemberModel.prototype);

  return MemberModel;
});
csui.define('nuc/models/browsable/browsable.mixin',['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/url'
], function (_, Backbone, Url) {

  var FILTERS_SEPARATOR = '||';

  var BrowsableMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {

        makeBrowsable: function (options) {
          options || (options = {});
          this.skipCount = options.skip || 0;
          this.topCount = options.top || 0;
          this.filters = options.filter || {};
          this.orderBy = options.orderBy;
          if (_.isString(this.filters)) {
            try {
              this.filters = JSON.parse(this.filters);
            } catch(e) {
              this.filters = {};
            }
          }
          return this;
        },

        setFilter: function (value, attributes, options) {
          // TODO: Simplify filer merging and detection of changes.
          var filter = value,
              name, modified;              
          if (_.isObject(value) && !_.isArray(value)) {
            options = attributes;
          } else {
            filter = {};
            filter[attributes] = value;
          }
          if (typeof options !== 'object') {
            options = {fetch: options};
          }
          if (!_.isEmpty(filter)) {
            for (name in filter) {
              if (_.has(filter, name)) {
                value = filter[name];
                if (makeFilterValue(this.filters[name], name) !==
                    makeFilterValue(value, name)) {
                  if (value !== undefined) {
                    this.filters[name] = value;
                  }
                  else {
                    delete this.filters[name];
                  }
                  modified = true;
                }
              }
            }
            if (options.clear) {
              for (name in this.filters) {
                if (_.has(this.filters, name) && !_.has(filter, name)) {
                  if (makeFilterValue(this.filters[name], name) !== undefined) {
                    delete this.filters[name];
                    modified = true;
                  }
                }
              }
            }
            if (modified) {
              this.trigger('filter:change');
              if (options.fetch !== false) {
                this.fetch();
              }
              return true;
            }
          } else {
            if (options.clear) {
              return this.clearFilter(options.fetch);
            }
          }
        },

        clearFilter: function (fetch) {
          var modified;
          if (!_.isEmpty(this.filters)) {
            for (var name in this.filters) {
              if (_.has(this.filters, name)) {
                if (makeFilterValue(this.filters[name], name) !== undefined) {
                  delete this.filters[name];
                  modified = true;
                }
              }
            }
          }
          if (modified) {
            this.trigger('filter:clear');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        },
        getFilterAsObject: function () {
          var filtersObject = {}, filters = this.filters;
          if (filters) {
            _.forEach(_.keys(filters), function (key) {
              var collectionFilters = filters[key];
              if (collectionFilters && _.isArray(collectionFilters)) {
                var filtersArray = collectionFilters.map(function (entry) {
                  if (entry && typeof entry === 'string') {
                    var filter = entry && entry.split(':'),
                      values = filter[1] && filter[1].split('|');
                    values = values && values.map(function (value) {
                      return { id: value };
                    });
                    return { id: filter[0], values: values };
                  }
                    return entry;
                });
                collectionFilters = filtersArray && filtersArray.length > 0 ? filtersArray : undefined;
              }
              if (collectionFilters) {
                filtersObject[key] = collectionFilters;
              }
            });
          }
          return filtersObject;
        },
        getFilterAsString: function () {
          var filtersString = '', filters = this.filters;
          if (filters) {
            _.forEach(_.keys(filters), function (key) {
              var value = filters[key];
              if (value) {
                if (filtersString) {
                  filtersString += FILTERS_SEPARATOR;
                }
                if (value && _.isArray(value)) {
                  if (value.length > 0) {
                     filtersString += key + '=' + '[' + value + ']';
                  }    
                } else {
                  filtersString += key + '=' + value;
                }
              }
            });
          }
          return filtersString;
        },

        filterStringToObject: function (filtersString) {
          var filters       = filtersString.split(FILTERS_SEPARATOR),
              filtersObject = {};

          _.each(filters, function (filter) {
            var filterArray = filter.split('=');
            var values = filterArray[1];
            if (values && values.charAt(0) === '[') {
              values = values.substring(1,values.length - 1 ).split(',');
            }
            filtersObject[filterArray[0]] = values;
          });

          return filtersObject;
        },

        setOrder: function (attributes, fetch) {
          if (this.orderBy != attributes) {
            this.orderBy = attributes;
            if (fetch !== false) {
              this.fetch({skipSort: false});
            }
            this.trigger('orderBy:change');
            return true;
          }
        },

        resetOrder: function (fetch) {
          if (this.orderBy) {
            this.orderBy = undefined;
            this.trigger('orderBy:clear');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        },

        setSkip: function (skip, fetch) {
          if (this.skipCount != skip) {
            this.skipCount = skip;
            this.trigger('paging:change');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        },

        setTop: function (top, fetch) {
          if (this.topCount != top) {
            this.topCount = top;
            this.trigger('paging:change');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        },

        setLimit: function (skip, top, fetch) {
          if (this.skipCount != skip || this.topCount != top) {
            this.skipCount = skip;
            this.topCount = top;
            this.trigger('paging:change');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        },

        resetLimit: function (fetch) {
          if (this.skipCount) {
            this.skipCount = 0;
            this.trigger('limits:change');
            if (fetch !== false) {
              this.fetch();
            }
            return true;
          }
        }

      });
    }

  };

  function makeFilterValue(value, name) {
    if (value !== undefined && value !== null && value !== '') {
      if (_.isArray(value)) {
        value = Url.makeMultivalueParameter('where_' + name, value);
      } else {
        value = 'where_' + name + '=' + encodeURIComponent(value.toString());
      }
      if (value.length > 0) {
        return value;
      }
    }
  }

  return BrowsableMixin;

});

csui.define('nuc/models/browsable/v1.request.mixin',['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/utils/url'
], function (_, $, Url) {

  var BrowsableV1RequestMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {

        makeBrowsableV1Request: function (options) {
          return this;
        },
        getFilterValue:function (filters) {
          return filters && _.map(filters, function (filter) {
            return filter.id + ':' +
                   _.reduce(filter.values, function (result, value) {
                     if (result) {
                       result += '|';
                     }
                     return result + value.id.toString();
                   }, '')
                   ;
          }) || [];
        },
        /**
         * returns params as an object, used for POST requests,
         */
        getBrowsableParams: function () {
          var query = {};
          var limit = this.topCount || 0;
          if (limit) {
            query.limit = limit;
            query.page = Math.floor((this.skipCount || 0) / limit) + 1;
          }
          if (this.orderBy) {
            // TODO: Implement sorting by multiple columns on the server
            var first = this.orderBy.split(',')[0].split(' ');
            if (this.orderBy.toLowerCase() === 'relevance') {
              query.sort = this.orderBy;
            } else {
              query.sort = (first[1] || 'asc') + '_' + first[0];
            }

          }
          if (!$.isEmptyObject(this.filters)) {
            for (var name in this.filters) {
              if (_.has(this.filters, name)) {
                var param = makeFilterParam(this.filters[name], name),
                  filterArray = [];
                if (param && param.value && param.value instanceof Array) {
                  filterArray =param.value[0] && param.value[0] instanceof Object ? this.getFilterValue(param.value):param.value;
                }  else {
                filterArray = param.value;
              }
              if (param.key !== undefined) {
                query[param.key] = filterArray;
              }
            }
          }
        }
          return query;
        },        

        /**
         * returns params as an URL query, used for GET requests,
         */
        getBrowsableUrlQuery: function () {

          var query = Url.combineQueryString(this.getBrowsableParams());
          return query;
        }

      });
    }

  };

  /**
   * appends 'where_' to the name of the filter and returns filter,value as an object
   * @param {value of the filter} value
   * @param {name of the filter} name
   */
  function makeFilterParam(value, name) {
    var param = {};
    if (value !== undefined && value !== null && value !== "") {
      param.key = "where_" + name;
      param.value = value;
    }
    return param;
  }

  return BrowsableV1RequestMixin;

});

csui.define('nuc/models/member/membercollection.server.adaptor',[
  'nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          var url = this.connector.connection.url;
          var id = this.groupId;
          //var id = 1001;
          if (id === undefined || id === null) {
            id = this.parentId;
            //TODO: need to remove topCount once v2/members supports limit and pagination support
            this.topCount = 20;
          }
          if (!this.topCount) {
            this.topCount = 20;
          }
          var query = Url.combineQueryString(
              this.getBrowsableUrlQuery(),
              {
                expand: 'properties{group_id}'
              }
          );

          //TODO: 'where_name' is not supported for now hence replacing it with 'query'
          //TODO: Must be removed once 'where_name' is supported
          query = query.replace('where_name', 'query');
          url = this.connector.getConnectionUrl().getApiBase('v2');

          if (this.type && this.type === 'GroupsOfCurrentUser') {
            url = Url.combine(url, "members/memberof?" + query);
          } else if (this.type === 1 && id) {
            url = Url.combine(url, "members/" + id + "/members?where_type=1&" + query);
          } else if (this.type === 1) {
            url = Url.combine(url, "members?where_type=1&" + query);
          } else if (id) {
            url = Url.combine(url, "members/" + id + "/members?" + query);
          } else {
            url = Url.combine(url, "members?" + query);
          }
          return url;
        },

        parse: function (response, options) {
          if (!_.isEmpty(response.results)) {
            var self = this;
            this.totalCount = (response.collection && response.collection.paging) ?
                              response.collection.paging.total_count :
                              response.results.length;
            _.each(response.results, function (member) {
              member.parentId = self.parentId;
              member = _.extend(member, member.data.properties);
            });

            return response.results;
          }
          this.totalCount = 0;
          return null;
        }
      });
    }

  };

  return ServerAdaptorMixin;
});

csui.define('nuc/models/member/membercollection',['nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/utils/url',
  'nuc/models/mixins/resource/resource.mixin',
  'nuc/models/browsable/browsable.mixin',
  'nuc/models/browsable/v1.request.mixin', 'nuc/models/member/member.model',
  'nuc/models/member/membercollection.server.adaptor'
], function (_, Backbone, Url, ResourceMixin, BrowsableMixin, BrowsableV1RequestMixin,
    MemberModel, ServerAdaptorMixin) {
  'use strict';

  ////-------------- MemberCollection ---------------------------------
  var MemberCollection = Backbone.Collection.extend({

    model: MemberModel,

    searchTerm: "",

    constructor: function MemberCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.makeResource(options);
      this.makeBrowsable(options);

      if (options !== undefined && options.member !== undefined && options.member !== null) {
        this.parentId = options.member.get("id");
        this.nodeId = options.member.get("nodeId");
        this.categoryId = options.member.get("categoryId");
        this.groupId = options.member.get("groupId");
      } else {
        this.nodeId = options.nodeId;
        this.categoryId = options.categoryId;
        this.groupId = options.groupId;
      }
      this.query = options.query || "";
      this.type = options.type;
    },

    clone: function () {
      // Provide the options; they may include connector and other parameters
      var clone = new this.constructor(this.models, {
        connector: this.connector,
        parentId: this.parentId,
        nodeId: this.nodeId,
        categoryId: this.categoryId,
        groupId: this.groupId,
        query: this.query
      });
      // Clone properties about the full (not-yet fetched) collection
      clone.totalCount = this.totalCount;
      return clone;
    },

    search: function (term) {
      this.searchTerm = term;
      this.fetch();
    }

  });

  ResourceMixin.mixin(MemberCollection.prototype);
  BrowsableMixin.mixin(MemberCollection.prototype);
  BrowsableV1RequestMixin.mixin(MemberCollection.prototype);
  ServerAdaptorMixin.mixin(MemberCollection.prototype);

  return MemberCollection;
});

csui.define('nuc/models/member/members.server.adaptor',[
  'nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        urlRoot: function () {
          var apiBase = new Url(this.connector.connection.url).getApiBase('v2');
          return Url.combine(apiBase, "/members");
        },

        url: function() {
          var finalClauses = Url.combineQueryString({
              "limit": this.limit,
              "sort": this.orderBy,
              "query": this.query
          }, this.memberType.length && {
              'where_type': this.memberType
          }, this.expandFields.length && {
              'expand': "properties{" + this.expandFields + "}"
          });
          // Return the query
          return Url.appendQuery(_.result(this, "urlRoot"), finalClauses);
        },

        parse: function (response) {
          if (!_.isEmpty(response.results)) {
            _.each(response.results, function (member) {
              member = _.extend(member, member.data.properties);
              delete member.data;
            });
            return response.results;
          }
          return null;
        }
      });
    }

  };

  return ServerAdaptorMixin;
});

csui.define('nuc/models/members',['nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/utils/url', 'nuc/models/member', 'nuc/models/mixins/resource/resource.mixin',
  'nuc/models/member/members.server.adaptor'
], function (_, $, Backbone, Url, MemberModel, ResourceMixin, ServerAdaptorMixin) {
  'use strict';

  var MemberCollection = Backbone.Collection.extend({

    constructor: function MemberCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      this.makeResource(options);

      options || (options = {});

      this.limit = options.limit || 10;
      this.query = options.query || "";
      this.orderBy = options.orderBy;
      this.expandFields = options.expandFields || [];
      if (options.memberFilter && options.memberFilter.type) {
        this.memberType = options.memberFilter.type;
      }
      // Default is to search users and groups
      this.memberType || (this.memberType = [0, 1]);
    },

    model: MemberModel,

    clone: function () {
      return new this.constructor(this.models, {
        connector: this.connector,
        limit: this.limit,
        query: this.query,
        expandFields: _.clone(this.expandFields),
        memberFilter: {type: this.memberType}
      });
    }
  });

  ResourceMixin.mixin(MemberCollection.prototype);
  ServerAdaptorMixin.mixin(MemberCollection.prototype);

  return MemberCollection;
});
csui.define('nuc/models/mixins/v2.fields/v2.fields.mixin',['nuc/lib/underscore'], function (_) {
  'use strict';

/**
 * @class FieldsV2Mixin
 * @see {@link ConnectableMixin}
 * @mixin
 *
 * @description Provides support for the setting `fields` URL query parameter as introduced
 by the `api/v2/members/favorites` or `api/v2/members/accessed` (V2) resources.

 Server responses can contain various properties, which can increase the
 response size, if all of them were always returned.

 Adding a field needs the role, which contains them (`properties`, `versions`
 etc.), and optionally their names too (`parent_id`, `create_user_id` etc.).

 ### How to apply the mixin to a model

 ```
 var MyModel = Backbone.Model.extend({

  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this
      .makeConnectable(options)
      .makeFieldsV2(options);
  },

  url: function () {
    var url = Url.combine(this.connector.connection.url, 'myresource'),
        query = Url.combineQueryString(
          this.getResourceFieldsUrlQuery()
        );
    return query ? url + '?' + query : url;
  }

});

 ConnectableMixin.mixin(MyModel.prototype);
 FieldsV2Mixin.mixin(MyModel.prototype);
 ```

 This mixin us usually combined together with the `ConnectableMixin`
 or with another cumulated mixin which includes it.

 ### How to use the mixin

 Set up the URL parameters by calling `setFields` and `resetFields` and fetch the model:

 ```
 // Set the expansion when creating the model
 var model = new MyModel(undefined, {
      connector: connector,
      fields: {
        properties: ['parent_id', 'create_user_id']
      }
    });
 model.fetch();

 // Set the expansion after creating the model
 model.setFields('properties', ['parent_id', 'create_user_id']);
 model.fetch();
 ```
 */

  var FieldsV2Mixin = {
  mixin: function (prototype) {
      return _.extend(prototype, /** @lends FieldsV2Mixin# */ {


        /**
         * Fields to include in the response (object literal of strings pointing
         to arrays of strings, empty by default, read-only). Keys and values from the object literal
         are handled the same way as the `setFields` method does the key and value
         (role and properties).  An empty object literal is the default.
         * @memberOf FieldsV2Mixin
         * @instance
         * @type {Object}
         */
        fields: {},

        /**
         * @function
         * @param options -  Recognized option properties:
         * @returns {FieldsV2Mixin}
         * @description  Must be called in the constructor to initialize the mixin functionality.
         Expects the Backbone.Model or Backbone.Collection constructor options passed in.
         */
        makeFieldsV2: function (options) {
          this.fields = options && options.fields || {};
          return this;
        },

        //------------------------- hasFields
        /**
         * @function
         * @param {String} role - The field role (i.e. the group of fields) to be checked
         * @returns {Boolean}
         * @description  Checks if a specific field or any fields will be included.  The `role` parameter
         is a string.
 ```
 // Checks if any fields are included
 var anyFields = model.hasFields();
 // Checks if any common property fields are included
 var propertyFields = model.hasFields('properties');
 ```
         */
        hasFields: function (role) {
          if (this.fields[role]) {
            return true;
          }
          if (_.isEmpty(this.fields) && this.collection && this.collection.fields) {
            return role ? !!this.collection.fields[role] : _.isEmpty(this.collection.fields);
          }
          return false;
        },

        // ------------------- setFields
        /**
         * @function
         * @param {String} role - The fields role (i.e. the group of fields).
         * @param names {String|String[]} - The names of the fields of the specified role. The string can
         contain a comma-delimited list, in which case it will be split to an array.
         * @description Adds one or more fields to the response.  The `role` parameter is a string.  The
         `names` parameter can be either string, or an array of strings.  The string can
         contain a comma-delimited list, in which case it will be split to an array.
 ```
 // Have two fields added, option 1
 model.setFields('properties', ['parent_id', 'create_user_id']);
 // Have two fields added, option 2
 model.setFields('properties', 'parent_id');
 model.setFields('properties', 'create_user_id');
 // Have two fields added, option 3
 model.setFields('properties', 'parent_id,create_user_id');
 ```
         */

        setFields: function (role, names) {
          if (_.isObject(role)) {
            _.each(role, function (value, key) {
              this._setOneFieldSet(key, value);
            }, this);
          } else {
            this._setOneFieldSet(role, names);
          }
        },

        // ----------------------- resetFields
        /**
         * @function
         * @param {String} role - The fields role (i.e. the group of fields).
         * @param names {String|String[]} - The names of the fields of the specified role.
         The parameter can be either string, or an array of strings.  The string can
         contain a comma-delimited list, in which case it will be split to an array.
         * @description Removes one or more fields from the response. If nothing is specified,
  all roles will be removed (not returned).

 ```
 // Cancel all expansions and fetch the fresh data
 model.resetFields();
 model.fetch();
 ```
         */
        resetFields: function (role, names) {
          if (_.isObject(role)) {
            _.each(role, function (value, key) {
              this._resetOneFieldSet(key, value);
            }, this);
          } else {
            this._resetOneFieldSet(role, names);
          }
        },

        /**
         * @function
         * @returns {*}
         * @description  Formats the URL query parameters for the field addition.  They can be concatenated
         with other URL query parts (both object literals and strings) by `Url.combineQueryString`.

 ```
 var url = ...,
 query = Url.combineQueryString(
 ...,
 this.getResourceFieldsUrlQuery()
 );
 if (query) {
   url = Url.appendQuery(url, query);
 ```
         */
        getResourceFieldsUrlQuery: function () {
          return _.reduce(this.fields, function (result, names, role) {
            var fields = result.fields || (result.fields = []),
                encodedNames = _.map(names, encodeURIComponent),
                field = encodeURIComponent(role);
            if (encodedNames.length) {
              var dot = field.indexOf('.');
              if (dot > 0) {
                // versions.element(0) -> versions{mime_type}.element(0)
                field = field.substring(0, dot) + '{' + encodedNames.join(',') + '}' +
                        field.substring(dot);
              } else {
                // properties -> properties{name}
                field += '{' + encodedNames.join(',') + '}';
              }
            }
            fields.push(field);
            return result;
          }, {});
        },

        _setOneFieldSet: function (role, names) {
          var fields = this.fields[role] || (this.fields[role] = []);
          if (names) {
            if (!_.isArray(names)) {
              names = names.split(',');
            }
            _.each(names, function (name) {
              if (!_.contains(fields, name)) {
                fields.push(name);
              }
            }, this);
          }
        },

        _resetOneFieldSet: function (role, names) {
          if (names) {
            var fields = this.fields[role] || (this.fields[role] = []);
            if (!_.isArray(names)) {
              names = names.split(',');
            }
            _.each(names, function (name) {
              var index = _.indexOf(fields, name);
              if (index >= 0) {
                fields.splice(index, 1);
              }
            }, this);
          } else if (role) {
            delete this.fields[role];
          } else {
            _.chain(this.fields)
             .keys()
             .each(function (key) {
               delete this.fields[key];
             }, this);
          }
        }
      });
    },


    mergePropertyParameters: function (output, input) {
      if (typeof input === 'string') {
        input = input.split(',');
      }
      if (Array.isArray(input)) {
        input = input.reduce(function (result, name) {
          var value = result[name];
          // If all fields or expands in a scope were requested, ensure,
          // that an empty array is assigned to it to include app properties
          if (!value || value.length) {
            result[name] = [];
          }
          return result;
        }, {});
      }
      output || (output = {});
      _.each(input, function (values, name) {
        var target = output[name];
        if (target) {
          _.each(values, function (value) {
            if (!_.contains(target, value)) {
              target.push(value);
            }
          });
        } else {
          output[name] = values;
        }
      });
      return output;
    }
  };

  return FieldsV2Mixin;
});

csui.define('nuc/models/mixins/v2.expandable/v2.expandable.mixin',[
  'nuc/lib/underscore', 'nuc/models/mixins/v2.fields/v2.fields.mixin'
], function (_, FieldsV2Mixin) {
  'use strict';

  var ExpandableV2Mixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeExpandableV2: function (options) {
          this.expand = options && options.expand || {};
          return this;
        },

        hasExpand: function (role) {
          if (this.expand[role]) {
            return true;
          }
          if (_.isEmpty(this.expand) && this.collection && this.collection.expand) {
            return role ? !!this.collection.expand[role] : _.isEmpty(this.collection.expand);
          }
          return false;
        },

        setExpand: function (role, names) {
          if (_.isObject(role)) {
            _.each(role, function (value, key) {
              this._setOneExpand(key, value);
            }, this);
          } else {
            this._setOneExpand(role, names);
          }
        },

        resetExpand: function (role, names) {
          if (_.isObject(role)) {
            _.each(role, function (value, key) {
              this._resetOneExpand(key, value);
            }, this);
          } else {
            this._resetOneExpand(role, names);
          }
        },

        getExpandableResourcesUrlQuery: function () {
          return _.reduce(this.expand, function (result, names, role) {
            var expand = result.expand || (result.expand = []),
                encodedNames = _.map(names, encodeURIComponent),
                expandable = encodeURIComponent(role);
            if (encodedNames.length) {
              expandable += '{' + encodedNames.join(',') + '}';
            }
            expand.push(expandable);
            return result;
          }, {});
        },

        _setOneExpand: function (role, names) {
          var expand = this.expand[role] || (this.expand[role] = []);
          if (names) {
            if (!_.isArray(names)) {
              names = names.split(',');
            }
            _.each(names, function (name) {
              if (!_.contains(expand, name)) {
                expand.push(name);
              }
            }, this);
          }
        },

        _resetOneExpand: function (role, names) {
          if (names) {
            var expand = this.expand[role] || (this.expand[role] = []);
            if (!_.isArray(names)) {
              names = names.split(',');
            }
            _.each(names, function (name) {
              var index = _.indexOf(expand, name);
              if (index >= 0) {
                expand.splice(index, 1);
              }
            }, this);
          } else if (role) {
            delete this.expand[role];
          } else {
            _.chain(this.expand)
             .keys()
             .each(function (key) {
               delete this.expand[key];
             }, this);
          }
        }
      });
    },

    mergePropertyParameters: FieldsV2Mixin.mergePropertyParameters
  };

  return ExpandableV2Mixin;
});

csui.define('nuc/models/mixins/state.requestor/state.requestor.mixin',[
  'nuc/lib/underscore'
],function (_) {
  'use strict';

  var StateRequestorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeStateRequestor: function (options) {
          this.stateEnabled = options && options.stateEnabled;
          return this;
        },

        enableState: function () {
          this.stateEnabled = true;
        },

        disableState: function () {
          this.stateEnabled = false;
        },

        getStateEnablingUrlQuery: function () {
          var stateEnabled = this.stateEnabled != null ? this.stateEnabled :
            this.collection && this.collection.stateEnabled;
          return stateEnabled ? {state: ''} : {};
        }
      });
    }
  };

  return StateRequestorMixin;
});

csui.define('nuc/models/mixins/state.carrier/state.carrier.mixin',[
  'nuc/lib/underscore', 'nuc/lib/backbone',
  'nuc/models/mixins/state.requestor/state.requestor.mixin'
], function (_, Backbone, StateRequestorMixin) {
  'use strict';

/**
 * @class StateCarrierMixin
 * @see {@link FieldsV2Mixin}
 * @see {@link StateRequestorMixin}
 * @mixin
 *
 * @description Provides support for maintaining the `state` properties as introduced by the `api/v2/nodes/:id` or `api/v2/nodes/:id/nodes` (V2) resources.

 Server responses may contain not only data, but also state properties, which may be needed for evaluation on either client or server sides. The `metadata_token`, for example.

 ### How to apply the mixin to a model

 ```
 var MyModel = Backbone.Model.extend({
  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this
      .makeConnectable(options)
      .makeFieldsV2(options)
      .makeStateCarrier(options);
  },

  url: function () {
    var url = Url.combine(this.connector.connection.url, 'myresource');
    var query = Url.combineQueryString(
      this.getResourceFieldsUrlQuery(),
      this.getStateEnablingUrlQuery()
    );
    return Url.appendQuery(url, query);
  },

  parse: function (response, options) {
    var results = response.results || response;
    this.parseState(results, 'properties');
    return results.data.properties;
  }
});

 ConnectableMixin.mixin(MyModel.prototype);
 FieldsV2Mixin.mixin(MyModel.prototype);
 StateCarrierMixin.mixin(MyModel.prototype);
 ```

 This mixin us usually combined together with the `ConnectableMixin` and `FieldsV2Mixin` or with another cumulated mixin which includes them. This mixin includes the `StateRequestorMixin` and applieas it automatically.

 ### How to use the mixin

 Get or set properties in te `state` object as you need them:

 ```
 // Get the metadata toklen to pass it to a modification server call
 var metadataToken = model.state.get('metadata_token');

 // Set the metadatan token from a response of a server call
 model.state.set('metadata_token', results.state.properties.metadata_token);
 ```

 Simplify parsing the state properties from a standard V2 API response:

 ```
 // Support retrieving the attributes when fetching either collection or model.
 var results = response.results || response;
 var data = results.data;
 this.parseState(data, results, 'properties');
 ```

 */

 var StateCarrierMixin = {
    mixin: function (prototype) {
      StateRequestorMixin.mixin(prototype);

      return _.extend(prototype, /** @lends StateCarrierMixin# */ {

        /**
         * @function
         * @param options {Object} -  Recognized option properties
         * @param attributes - State attributes taken from model
         * @returns {FieldsV2Mixin}
         * @description  Must be called in the constructor to initialize the mixin functionality.
         * Expects the `Backbone.Model` or `Backbone.Collection` constructor options passed in.
         */
        makeStateCarrier: function (options, attributes) {
          this.state = new Backbone.Model(getStateAttributes(attributes));
          return this.makeStateRequestor(options);
        },

        /**
         * @member {Backbone.Model} state
         * @description Maintains the object state properties (empty by default).
         */

        /**
         * @function
         * @description  Sets the state from state attributes
         * @param attributes
         * @returns void
         */
        setState: function (attributes) {
          if (this.state) {
            var state = getStateAttributes(attributes);
            if (state) {
              this.state.set(state);
            }
          }
        },

        /**
         * @function
         * @description Parses a standard V2 response and sets the state properties to the `state` object on the
         * instance.
         * @param response {Object} - The `response` parameter is an object with a response object; either a complete response,
         * or just the `results` sub-object, if it is present in the response as a wrapper.
         * @param role {String} - The `role` parameter is a `string` choosing the `fields` role, which the state should be received for;
         * the default value is "properties".
         * @returns void
         */
        parseState: function (node, results, role) {
          // TODO: Allow states for other fields, than "properties"
          node.state = getStateAttributes(results);
        }
      });
    }
  };

  function getStateAttributes(attributes) {
    var state = attributes && attributes.state;
    return state && state.properties || state;
  }

  return StateCarrierMixin;
});

csui.define('nuc/models/mixins/v2.commandable/v2.commandable.mixin',['nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  "use strict";

  var CommandableV2Mixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {

        makeCommandableV2: function (options) {
          var commands = options && options.commands;
          if (typeof commands === 'string') {
            commands = commands.split(',');
          }
          this.commands = commands || [];
          return this;
        },

        setCommands: function (name) {
          if (!_.isArray(name)) {
            name = name.split(",");
          }
          _.each(name, function (name) {
            if (!_.contains(this.commands, name)) {
              this.commands.push(name);
            }
          }, this);
        },

        resetCommands: function (name) {
          if (name) {
            if (!_.isArray(name)) {
              name = name.split(",");
            }
            _.each(name, function (name) {
              var index = _.indexOf(this.commands, name);
              if (index >= 0) {
                this.commands.splice(index, 1);
              }
            }, this);
          } else {
            this.commands.splice(0, this.commands.length);
          }
        },

        getRequestedCommandsUrlQuery: function () {
          return this.commands.length && {actions: this.commands};
        }

      });
    }

  };

  return CommandableV2Mixin;

});

csui.define('nuc/models/node.actions/server.adaptor.mixin',[
  'nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      var originalFetch = prototype.fetch;

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        fetch: function (options) {
          // Use POST with body (instead of GET) to avoid too long server call URL that fails
          var data = {};
          !!this.parent_id && (data.reference_id = this.parent_id);
          if(!!this.reference_id && !data.reference_id){
            data.reference_id = this.reference_id;
          }
          data.ids = this.nodes;
          data.actions = this.getRequestedCommandsUrlQuery().actions;
          var postOptions = options || {};
          _.extend(postOptions, {
            type: 'POST',
            url: Url.combine(this.connector.getConnectionUrl().getApiBase('v2'), '/nodes/actions'),
            contentType: 'application/x-www-form-urlencoded',
            data: {body: JSON.stringify(data)}
          });

          return originalFetch.call(this, postOptions);
        },

        parse: function (response, options) {
          // FIXME: Remove this, as soon as all servers support GET v2/nodes/actions.
          if (_.isArray(response)) {
            return response;
          }
          // from { node_id: { data: { command_key: { ... }, ... }, ... }
          // to [ { id: node_id, actions: [ { signature: command_key, ... }, ... ] }, ... ]
          return _.map(response.results, function (value, key) {
            return {
              id: key,
              actions: _.map(value.data, function (value, key) {
                value.signature = key;
                return value;
              })
            };
          }, {});
        }

      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('nuc/models/node.actions',['nuc/lib/underscore', 'nuc/lib/backbone',
  'nuc/utils/url', 'nuc/models/actions',
  'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/mixins/v2.commandable/v2.commandable.mixin',
  'nuc/models/node.actions/server.adaptor.mixin'
], function (_, Backbone, Url, ActionCollection,
    ConnectableMixin, FetchableMixin, CommandableMixin, ServerAdaptorMixin) {
  'use strict';

  var NodeActionModel = Backbone.Model.extend({

    constructor: function NodeActionModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);

      this.actions = new ActionCollection(attributes && attributes.actions);
    }

  });

  var NodeActionCollection = Backbone.Collection.extend({

    model: NodeActionModel,

    constructor: function NodeActionCollection(attributes, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);

      var nodes = options && options.nodes;
      if (typeof nodes === 'string') {
        nodes = nodes.split(',');
      }
      this.nodes = nodes || [];
      !!options.reference_id && (this.reference_id = options.reference_id);

      this.makeConnectable(options)
          .makeFetchable(options)
          .makeCommandableV2(options)
          .makeServerAdaptor(options);
    },

    setNodes: function (nodes) {
      if (!_.isArray(nodes)) {
        nodes = nodes.split(',');
      }
      _.each(nodes, function (node) {
        if (!_.contains(this.nodes, node)) {
          this.nodes.push(node);
        }
      }, this);
    },

    resetNodes: function (nodes) {
      if (nodes) {
        if (!_.isArray(nodes)) {
          nodes = nodes.split(',');
        }
        _.each(nodes, function (node) {
          var index = _.indexOf(this.nodes, node);
          if (index >= 0) {
            this.nodes.splice(index, 1);
          }
        }, this);
      } else {
        this.nodes = [];
      }
    },

    clone: function () {
      return new this.constructor(this.models, {
        connector: this.connector,
        nodes: _.clone(this.nodes),
        commands: _.clone(this.includeCommands)
      });
    }

  });

  ConnectableMixin.mixin(NodeActionCollection.prototype);
  FetchableMixin.mixin(NodeActionCollection.prototype);
  CommandableMixin.mixin(NodeActionCollection.prototype);
  ServerAdaptorMixin.mixin(NodeActionCollection.prototype);

  return NodeActionCollection;

});

csui.define('nuc/utils/promoted.actionitems',[
  'nuc/lib/underscore', 'nuc/models/actionitems'
], function (_, ActionItemCollection, extraActions) {
  'use strict';

  var promotedActionItems = new ActionItemCollection([
    // Default for versions is always version open command
    {
      signature: 'properties',
      sequence: 10
    },
    {
      signature: 'unreserve',
      sequence: 10
    },
    {
      signature: 'permissions',
      sequence: 10
    },
    {
      signature: 'reserve',
      sequence: 10
    },
    {
      signature: 'rename',
      sequence: 10
    },
    {
      signature: 'share',
      sequence: 10
    },
    {
      signature: 'edit',
      sequence: 10
    },
    {
      signature: 'copy',
      sequence: 10
    },
    {
      signature: 'move',
      sequence: 10
    },
    {
      signature: 'download',
      sequence: 10
    },
    {
      signature: 'comment',
      sequence: 10
    },
    {
      signature: 'open',
      sequence: 10
    },
    {
      signature: 'delete',
      sequence: 10
    },
    {
      signature: 'browse',
      sequence: 10
    },
    {
      signature: 'addversion',
      sequence: 10
    },
    {
      signature: 'editpermissions',
      sequence: 10
    },
    {
      signature: 'versionscontrol',
      sequence: 10
    }
  ]);

  return promotedActionItems;
});

// Adds the deepClone method to _, Backbone.Model and Backbone.Collection
csui.define('nuc/utils/deepClone/deepClone',['nuc/lib/underscore', 'nuc/lib/backbone'], function (_, Backbone) {

  // See https://gist.github.com/prantlf/6d134475af24d4b2f7de

  // Performs a deep clone of primitive values, arrays, object literals,
  // and arbitrary objects, if requested.  It is supposed to clone object
  // literals, which are going to be modified, but the original should
  // stay intact.
  //
  // The default behaviour works well with JSON REST API responses and
  // and other objects, which contain only values of native types.
  // If functions or HTML elements are encountered, they will not be
  // actually cloned; they will be just copied, which works well with
  // the typical options objects for Backbone constructors.
  // If arbitrary objects can be encountered, additional options can
  // be used to specify the result:
  //
  // default behaviour
  // : Throws an error
  // cloneCloneableObjects: true
  // : Uses deepClone or clone method, if available.
  // cloneArbitraryObjects: true
  // : Creates new objects with clones own properties of the original.
  // copyArbitraryObjects
  // : Copies the original.
  //
  // This function depends on Underscore.js.
  function deepClone(source, options) {
    var result = {},
        key;
    if (!source || typeof source !== 'object' || source instanceof HTMLElement ||
        _.isBoolean(source) || _.isNumber(source) || _.isString(source)) {
      return source;
    }
    if (_.isDate(source) || _.isRegExp(source)) {
      return new source.constructor(source.valueOf());
    }
    if (_.isArray(source)) {
      return _.map(source, function (obj) {
        return _.deepClone(obj);
      });
    }
    if (source.constructor !== Object) {
      if (options) {
        if (options.cloneCloneableObjects) {
          if (source.deepClone) {
            return source.deepClone();
          }
          if (source.clone) {
            return source.clone();
          }
        }
        if (options.copyArbitraryObjects) {
          return source;
        }
        if (!options.cloneArbitraryObjects) {
          throw new Error('Cannot clone an arbitrary function object instance');
        }
      } else {
        throw new Error('Cannot clone an arbitrary function object instance');
      }
    }
    return _.reduce(source, function (result, value, key) {
      result[key] = deepClone(value);
      return result;
    }, {});
  }

  // Expose deepClone among the Underscore.js methods
  _.mixin({deepClone: deepClone});

  // Add deepClone to the Backbone.Model prototype
  Backbone.Model.prototype.deepClone = function (options) {
    return new this.constructor(deepClone(this.attributes, options));
  };

  // Add deepClone to the Backbone.Collection prototype
  Backbone.Collection.prototype.deepClone = function (options) {
    return new this.constructor(this.map(function (model) {
      return deepClone(model.attributes, options);
    }));
  };

  return deepClone;

});

csui.define('nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',[
  'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone', 'nuc/models/node.actions',
  'nuc/models/mixins/v2.commandable/v2.commandable.mixin', 'nuc/utils/promoted.actionitems',
  'nuc/utils/deepClone/deepClone'
], function (_, $, Backbone, NodeActionCollection, CommandableV2Mixin, promotedActionItems) {
  'use strict';


 var DelayedCommandableV2Mixin = {
    mixin: function (prototype) {
      CommandableV2Mixin.mixin(prototype);

      var originalPrepareModel = prototype._prepareModel;

      return _.extend(prototype, /** @lends DelayedCommandableV2Mixin# */ {

        /**
         * @name DelayedCommandableV2Mixin
         * @mixin
         * @type {{mixin: (function(*=): *)}}
         * @description Provides support for fetching permitted actions by an extra call after
         the primary node model or collection has been fetched.
         It depends on setting
         the `actions` URL query parameter as introduced by the `api/v2/nodes/:id` (V2)
         resource to specify just the default actions. After the main call has finished,
         an additional `api/v2/actions/nodes` call will be issued to enquire about the
         rest of the actions.
         Server responses can contain *permitted actions* to be able to support
         enabling and disabling in the corresponding UI; how many and which ones
         should be checked by the server, it can be specified.
         */

        /**
         * @function
         * @param options
         * @returns {*}
         */
        makeDelayedCommandableV2: function (options) {
          options || (options = {});
          var defaultActionCommands = options.defaultActionCommands;
          var promotedActionCommands = options.promotedActionCommands ||
                                       promotedActionItems.getPromotedCommandsSignatures();
          var nonPromotedActionCommands = options.nonPromotedActionCommands || [];
          var nonPromotedActionsOptions = options.nonPromotedActionsOptions || {};
          var delayedActionsOptions = options.delayedActionsOptions || {};
          var additionalActionsOptions = options.additionalActionsOptions || {};
          if (typeof defaultActionCommands === 'string') {
            defaultActionCommands = defaultActionCommands.split(',');
          }
          this.defaultActionCommands = defaultActionCommands || [];
          this.promotedActionCommands = promotedActionCommands;
          this.nonPromotedActionCommands = nonPromotedActionCommands || [];
          this.nonPromotedActionsOptions = nonPromotedActionsOptions;
          this.delayedActionsOptions = delayedActionsOptions;
          this.additionalActionsOptions = additionalActionsOptions;

          this.delayedActions = this.createDelayedActions();
          this.additionalActions = this.createAdditionalActions();

          this.setEnabledDelayRestCommands(options.delayRestCommands,
              options.promoteSomeRestCommands);

          this.delayRestCommandsForModels = options.delayRestCommandsForModels;

          this.promotedActionItemsFromControler = promotedActionItems;

          return this.makeCommandableV2(options);
        },


        /**
         * @function
         * @param enable
         * @param promoted
         * @description Enables or disables the delayed command fetching and promoted actions. The current
         state can be seen by `delayRestCommands` and `promoteSomeRestCommands` properties.
         */
        setEnabledDelayRestCommands: function (enable, promoted) {
          if (enable) {
            this._enableDelayRestCommands();
          } else {
            this._disableDelayRestCommands();
          }
          this.promoteSomeRestCommands = promoted !== false;
        },

        /** @function
         *
         * @param enable
         * @returns {*|jQuery}
         */
        setEnabledLazyActionCommands: function (enable) {
          var deferred = $.Deferred();
          if (enable) {
            this._enableNonPromotedRestCommands();
            this._requestsNonPromotedRestActions()
                .done(function (node) {
                  deferred.resolve(node);
                })
                .fail(function (error) {
                  deferred.reject(error);
                });
          } else {
            this._disableNonPromotedRestCommands();
          }
          return deferred.promise();
        },

        /**
         * @function
         * @param signatures
         * @param retrievedFlagOnNode
         * @returns {*|jQuery}
         * @description Use this method if your module needs to retrieve additional actions.
         */
        getAdditionalActionCommands: function (signatures, retrievedFlagOnNode) {
          var deferred = $.Deferred();
          this._requestAdditionalActions(signatures, retrievedFlagOnNode)
              .done(_.bind(function (node) {
                deferred.resolve(node);
              }, this))
              .fail(function (error) {
                deferred.reject(error);
              });
          return deferred.promise();
        },

        /**
         * @function
         * @private
         */
        _enableDelayRestCommands: function () {
          if (!this.delayRestCommands) {
            this.delayRestCommands = true;
            this.on('sync', this._requestRestActions, this);
          }
        },

        /**
         * @function
         * @private
         */
        _disableDelayRestCommands: function () {
          if (this.delayRestCommands) {
            this.delayRestCommands = false;
            this.off('sync', this._requestRestActions, this);
          }
        },

        _enableNonPromotedRestCommands: function () {
          if (!this.enableNonPromotedCommands) {
            this.enableNonPromotedCommands = true;
            this.on('sync', this._requestsNonPromotedRestActions, this);
          }
        },

        _disableNonPromotedRestCommands: function () {
          this.enableNonPromotedCommands = false;
          this.off('sync', this._requestsNonPromotedRestActions, this);
        },

        _requestRestActions: function (model, resp, options) {
          // Guard against propagated sync event: if this mixin has been
          // applied to a collection, only fetch of the collection should
          // be handled here; fetching of models should not re-fetch actions
          // for the whole collection.
          // Also do nothing if the collection is empty.
          if (model !== this || this instanceof Backbone.Collection && !this.length) {
            return;
          }
          // request delayed actions only when fetching (POST is also used for fetching)
          if (options.xhr &&
              (options.xhr.settings.type !== 'GET' && options.xhr.settings.type !== 'POST')) {
            return;
          }
          if (this.promoteSomeRestCommands) {
            this._requestPromotedActions(model, resp, options);
          } else {
            this._requestDelayedActions(model, resp, options);
          }
        },

        _requestDelayedActions: function () {
          var defaultActionCommands = this.defaultActionCommands;
          var restCommands = _.reject(this.commands, function (command) {
            return _.contains(defaultActionCommands, command);
          });
          if (restCommands.length) {
            var delayedActions = this.delayedActions;
            delayedActions.resetCommands();
            delayedActions.setCommands(restCommands);
            delayedActions.resetNodes();
            if (this instanceof Backbone.Collection) {
              delayedActions.setNodes(this.pluck('id'));
            } else {
              delayedActions.setNodes([this.get('id')]);
            }
            if (!delayedActions.connector) {
              this.connector.assignTo(delayedActions);
            }
            delayedActions.parent_id = !!this.node ? this.node.get("id") : this.get("id");
            delayedActions.fetch({
              success: this._updateOriginalActions.bind(this),
              reset: true
            });
          }
        },

        _requestPromotedActions: function (model) {
          var defaultActionCommands  = this.defaultActionCommands,
              promotedActionCommands = this.promotedActionCommands;

          //NonPromotedActionCommands = allCommands - defaultActionCommnads - promotedActionCommands
          //DelayActions = (allCommands - defaultActionCommnads) Intersect promotedActionCommands;
          var restCommands        = _.reject(this.commands, function (command) {
                return _.contains(defaultActionCommands, command);
              }),
              promotedCommands    = [],
              nonPromotedCommands = [];
          _.each(restCommands, function (command) {
            if (_.contains(promotedActionCommands, command)) { //CurrentPromotedActions
              promotedCommands.push(command); // Delay Commands
            }
            else {
              nonPromotedCommands.push(command); // nonpromoted Commands
            }
          });

          this.promotedActionCommands = promotedCommands;
          this.nonPromotedActionCommands = nonPromotedCommands;
          ///remove other commands which are not declared in toolbarItems
          if (promotedCommands.length) {
            var delayedActions = this.delayedActions;
            delayedActions.resetCommands();
            delayedActions.setCommands(promotedCommands);
            delayedActions.resetNodes();
            if (this instanceof Backbone.Collection) {
              var restNodes = [];
              this.each(function (model) {
                //update node model with promoted and nonpromoted commands list, Since we are
                // not fetching every node info individually
                model.nonPromotedActionCommands = nonPromotedCommands;
                model.promotedActionCommands = promotedCommands;
                if (!model.get('csuiDelayedActionsRetrieved')) {
                  restNodes.push(model.get('id'));
                }
              });
              delayedActions.setNodes(restNodes);
            } else {
              model.nonPromotedActionCommands = nonPromotedCommands;
              model.promotedActionCommands = promotedCommands;
              delayedActions.setNodes([this.get('id')]);
            }
            delayedActions.parent_id = !!this.node ? this.node.get("id") : this.get("id");
            if (delayedActions.nodes.length > 0) {
              if (!delayedActions.connector) {
                this.connector.assignTo(delayedActions);
              }
              delayedActions
                  .fetch({
                    reset: true,
                    // Update the actions as soon as possible; event
                    // and promise can be watched by someone else
                    success: _.bind(this._updateOriginalActions, this)
                  });
            }
          } else {
            //update node with promoted and non-promoted commands list If there are no promoted
            // commands
            if (this instanceof Backbone.Collection) {
              this.each(function (model) {
                model.nonPromotedActionCommands = nonPromotedCommands;
                model.promotedActionCommands = promotedCommands;
              });
            } else {
              model.nonPromotedActionCommands = nonPromotedCommands;
              model.promotedActionCommands = promotedCommands;
            }
          }
        },

        setNonPromotedActionsOptions: function (options) {
          _.extend(this.nonPromotedActionsOptions, options);
        },

        resetNonPromotedActionsOptions: function (properties) {
          if (properties) {
            if (!_.isArray(properties)) {
              properties = properties.split(",");
            }
            this.nonPromotedActionsOptions = _.omit(this.nonPromotedActionsOptions, properties);
          } else {
            this.nonPromotedActionsOptions = {};
          }
        },

        _requestsNonPromotedRestActions: function () {
          var deferred = $.Deferred();
          var nonPromotedActions = this.createNonPromotedActionsOptions(),
              nonPromotedActionCommands = this.nonPromotedActionCommands.length ?
                                          this.nonPromotedActionCommands :
                                          this.collection.nonPromotedActionCommands;
          nonPromotedActions.resetCommands();
          nonPromotedActions.setCommands(nonPromotedActionCommands);
          nonPromotedActions.resetNodes();
          if (this instanceof Backbone.Collection) {
            var restNodes = [];
            this.each(function (model) {
              if (!model.get('csuiLazyActionsRetrieved') && !model.isLocallyCreated) {
                restNodes.push(model.get('id'));
              }
            });
            nonPromotedActions.parent_id = this.length && this.models[0].get("reference_id");
            nonPromotedActions.setNodes(restNodes);
          } else {
            nonPromotedActions.setNodes([this.get('id')]);
            nonPromotedActions.parent_id = this.get("reference_id");
          }

          if (!nonPromotedActions.connector) {
            this.connector.assignTo(nonPromotedActions);
          }
          if (nonPromotedActions.commands.length && nonPromotedActions.nodes.length) {
            nonPromotedActions
                .fetch({
                  reset: true,
                  // Update the actions as soon as possible; event
                  // and promise can be watched by someone else
                  success: _.bind(function () {
                    this._updateOriginalActionsAfterLazyActions(nonPromotedActions);
                    //this.attributes.csuiLazyActionsRetrieved =  true;
                    deferred.resolve(this);
                  }, this),
                  error: _.bind(function (error) {
                    this.attributes.csuiLazyActionsRetrieved = false;
                    deferred.reject(error);
                  }, this)
                });
          } else {
            if (this instanceof Backbone.Collection) {
              this.each(function (model) {
                model.set('csuiLazyActionsRetrieved', true);
              });
            } else {
              this.set('csuiLazyActionsRetrieved', true);
            }
            deferred.resolve(this);
          }
          return deferred.promise();
        },

        _requestAdditionalActions: function (signatures, retrievedFlagOnNode) {
          var deferred = $.Deferred();
          var additionalActions = this.additionalActions;
          additionalActions.resetCommands();
          additionalActions.setCommands(signatures);
          additionalActions.resetNodes();
          if (this instanceof Backbone.Collection) {
            var restNodes = [];
            this.each(function (model) {
              if (!model.get(retrievedFlagOnNode) && !model.isLocallyCreated) {
                restNodes.push(model.get('id'));
              }
            });
            additionalActions.parent_id = this.length && this.models[0].get("reference_id");
            additionalActions.setNodes(restNodes);
          } else {
            additionalActions.setNodes([this.get('id')]);
            additionalActions.parent_id = this.get("reference_id");
          }

          if (!additionalActions.connector) {
            this.connector.assignTo(additionalActions);
          }
          if (additionalActions.commands.length && additionalActions.nodes.length) {
            additionalActions
                .fetch({
                  reset: true,
                  // Update the actions as soon as possible; event
                  // and promise can be watched by someone else
                  success: _.bind(function () {
                    this._updateOriginalActionsAfterAdditionalActions(retrievedFlagOnNode);
                    deferred.resolve(this);
                  }, this),
                  error: _.bind(function (error) {
                    this.attributes[retrievedFlagOnNode] = false;
                    deferred.reject(error);
                  }, this)
                });
          } else {
            if (this instanceof Backbone.Collection) {
              this.each(function (model) {
                model.set(retrievedFlagOnNode, true);
              });
            } else {
              this.set(retrievedFlagOnNode, true);
            }
            deferred.resolve(this);
          }
          return deferred.promise();
        },

        _updateOriginalActions: function () {
          var delayedActions = this.delayedActions;

          function updateNodeActions(node) {
            var actionNode = delayedActions.get(node.get('id'));
            if (actionNode) {
              // Trigger the event on the node first.
              node.trigger('before:update:actions', { target: node, node: node, newActions: actionNode.actions });
              // If the node is part of a collection, trigger the event on the collection as well.
              if (node.collection) {
                node.collection.trigger('before:update:actions', { target: this, node: node, newActions: actionNode.actions });
              }
              node.actions.add(actionNode.actions.models);
              node.set('csuiDelayedActionsRetrieved', true);
            }
          }

          if (this instanceof Backbone.Collection) {
            this.each(updateNodeActions, this);
          } else {
            updateNodeActions.call(this, this);
          }
        },

        _updateOriginalActionsAfterLazyActions: function (nonPromotedActions) {
          var updateNodeActions  = function (node) {
            var actionNode = nonPromotedActions.get(node.get('id'));
            if (_.contains(nonPromotedActions.nodes, node.get('id'))) {
              node.attributes.csuiLazyActionsRetrieved = true;
            }
            if (actionNode) {
              _.each(actionNode.actions.models, function (action) {
                action.attributes.csuiNonPromotedAction = true;
              });
              node.actions.add(actionNode.actions.models);
            }
          };

          if (this instanceof Backbone.Collection) {
            this.each(updateNodeActions);
          } else {
            updateNodeActions(this);
          }
        },

        _updateOriginalActionsAfterAdditionalActions: function (retrievedFlagOnNode) {
          var additionalActions = this.additionalActions,
              updateNodeActions = function (node) {
                node.attributes[retrievedFlagOnNode] = true;
                var actionNode = additionalActions.get(node.get('id'));
                if (actionNode) {
                  _.each(actionNode.actions.models, function (action) {
                    action.attributes.csuiNonPromotedAction = true;
                  });
                  node.actions.add(actionNode.actions.models);
                }
              };

          if (this instanceof Backbone.Collection) {
            this.each(updateNodeActions);
          } else {
            updateNodeActions(this);
          }
        },

        createNonPromotedActionsOptions: function () {
          return new NodeActionCollection(undefined, _.extend({
            isNonPromoted: true,
            connector: this.connector
          },this.nonPromotedActionsOptions));
        },

        createDelayedActions: function () {
          return new NodeActionCollection(undefined, _.extend({
            connector: this.connector
          },this.delayedActionsOptions));
        },

        createAdditionalActions: function () {
          return new NodeActionCollection(undefined, _.extend({
            isNonPromoted: true,
            connector: this.connector
          },this.additionalActionsOptions));
        },

        /**
         * @function
         * @param {(string|string[])} name - The `name` parameter can be either string, or an array of strings.
         The string can contain a comma-delimited list, in which case it will be split
         to an array.  The rest of commands specified by the `setCommands` method
         will be fetched later by the second call.
         @description Asks for one or more commands to be checked immediately by the first server
         call.
```
 // Have two commands checked, option 1
 model.setCommands(['browse', 'download']);
 // Have two commands checked, option 2
 model.setCommands('browse');
 model.setCommands('download');
 // Have two commands checked, option 3
 model.setCommands('browse,download');
 ```
         */
        setDefaultActionCommands: function (name) {
          if (!_.isArray(name)) {
            name = name.split(',');
          }
          _.each(name, function (name) {
            if (!_.contains(this.defaultActionCommands, name)) {
              this.defaultActionCommands.push(name);
            }
          }, this);
        },

        /**
         * @func
         * @description Prevents one or more commands from being checked immediatley by the first
         server call.
 ```
 // Have all commands fetched delayed by the second server call
 model.setCommands(['browse', 'download']);
 model.resetDefaultActionCommands();
 model.fetch();
 ```
         * @param {(string|string[])} name - The `names` parameter can be either string, or an array of
         strings, or nothing.  The string can contain a comma-delimited list, in
         which case it will be split to an array.  If nothing is specified, all
         commands will be removed (not to be checked by the first server call).
         */
        resetDefaultActionCommands: function (name) {
          if (name) {
            if (!_.isArray(name)) {
              name = name.split(',');
            }
            _.each(name, function (name) {
              var index = _.indexOf(this.defaultActionCommands, name);
              if (index >= 0) {
                this.defaultActionCommands.splice(index, 1);
              }
            }, this);
          } else {
            this.defaultActionCommands.splice(0, this.defaultActionCommands.length);
          }
        },

        /**
         * @function
         * @returns {*|{actions: ({length}|Array|*)}}
         * @description Formats the URL query parameters for the command investigation.  They can be concatenated
         with other URL query parts (both object literals and strings) by `Url.combineQueryString`.
         If delayed action fetching is enabled, only the default actions will be returned by this
         method; the rest of specified actions fill be fetched by an additional server call later.

```
var url = ...,
query = Url.combineQueryString(
  ...,
  this.getRequestedCommandsUrlQuery()
);
if (query) {
  url = Url.appendQuery(url, query);
}
```
         */
        getRequestedCommandsUrlQuery: function () {
          var commands = this.delayRestCommands ?
                         this.defaultActionCommands : this.commands;
          return commands.length && {actions: commands};
        },

        /**
         * @function
         * @returns {*|{actions: ({length}|*)}}
         */
        getAllCommandsUrlQuery: function () {
          var commands = this.commands;
          return commands.length && {actions: commands};
        },

        // Stop the delayed action enabling for child models and collections.
        // If they want it, they can do so in the constructors, which creates
        // them. Immediate child models of this collection can be enabled by
        // the delayRestCommandsForModels option.
        _prepareModel: function (attrs, options) {
          var delayRestCommands, delayRestCommandsForModels,
              promoteSomeRestCommands;
          options || (options = {});
          // If the collection is populated after the constructor has
          // finished, we can use parameters passed to the constructor
          // as defaults, if the population options are empty.
          delayRestCommands = options.delayRestCommands;
          delayRestCommandsForModels = options.delayRestCommandsForModels;
          promoteSomeRestCommands = options.promoteSomeRestCommands;
          if (this.delayedActions) {
            if (delayRestCommands === undefined) {
              delayRestCommands = this.delayRestCommands;
            }
            if (delayRestCommandsForModels === undefined) {
              delayRestCommandsForModels = this.delayRestCommandsForModels;
            }
            if (promoteSomeRestCommands === undefined) {
              promoteSomeRestCommands = this.promoteSomeRestCommands;
            }
          }
          options.delayRestCommands = delayRestCommandsForModels;
          options.delayRestCommandsForModels = false;
          options.promoteSomeRestCommands = promoteSomeRestCommands;
          var model = originalPrepareModel.call(this, attrs, options);
          options.delayRestCommands = delayRestCommands;
          options.delayRestCommandsForModels = delayRestCommandsForModels;
          return model;
        }
      });
    }
  };

  return DelayedCommandableV2Mixin;
});

csui.define('nuc/models/mixins/v2.additional.resources/v2.additional.resources.mixin',['nuc/lib/underscore', 'nuc/lib/jquery'
], function (_, $) {

  /**
   * @class AdditionalResourcesV2Mixin
   * @see {@link ConnectableMixin}
   * @see ResourceMixin
   * @mixin
   *
   * @description Provides support for the setting URL query parameter flags as introduced by the
   `api/v2/nodes/:id` or `api/v2/nodes/:id/nodes` (V2) resources.

   Server responses can contain associated resources to avoid requesting every
   associated resource by an additional server call, or other data, which may
   not be needed every time.  For example:

   perspective
   : Include the perspective configuration, if the resource can carry one.

   metadata
   : Include the definitions of object properties.

   ### How to apply the mixin to a model

   ```
   var MyModel = Backbone.Model.extend({

  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this
      .makeConnectable(options)
      .makeAdditionalResourcesV2Mixin(options);
  },

  url: function () {
    var url = Url.combine(this.connector.connection.url, 'myresource'),
        query = Url.combineQueryString(
          this.getAdditionalResourcesUrlQuery()
        );
    return query ? url + '?' + query : url;
  }

});

   ConnectableMixin.mixin(MyModel.prototype);
   AdditionalResourcesV2Mixin.mixin(MyModel.prototype);
   ```

   This mixin us usually combined together with the `ConnectableMixin`
   or with another cumulated mixin which includes it.

   ### How to use the mixin

   Set up the URL parameters by calling `includeResources` and
   `excludeResources` and fetch the model:

   ```
   // Set the inclusion when creating the model
   var model = new MyModel(undefined, {
      connector: connector,
      includeResources: ['perspective']
    });
   model.fetch();

   // Set the inclusion after creating the model
   model.includeResources('perspective');
   model.fetch();
   ```
   */
  var AdditionalResourcesV2Mixin = {

    mixin: function (prototype) {

      return _.extend(prototype, /** @lends AdditionalResourcesV2Mixin# */{

        /**
         * @function
         * @description    Must be called in the constructor to initialize the mixin functionality.
         Expects the Backbone.Model or Backbone.Collection constructor options passed in.

         Recognized option properties:

         includeResources
         : One or more resources to include.  The value is handled the same way as the
         `includeResources` method does it.  An empty array is the default.

         * @param options
         * @returns {AdditionalResourcesV2Mixin}
         */
        makeAdditionalResourcesV2Mixin: function (options) {

          this._additionalResources = [];
          if (options && options.includeResources) {
            this.includeResources(options.includeResources);
          }
          return this;
        },

        /** @function
         *
         * @param names
         * @description    Makes one or more resources included.  The `names` parameter can be either
         string, or an array of strings.  The string can contain a comma-delimited list,
         in which case it will be split to an array.

 ```
 // Have a resources included, option 1
 model.includeResources('perspective');
 // Have a resource included, option 2
 model.includeResources(['perspective']);
 ```
         */
        includeResources: function (names) {
          if (names && !_.isArray(names)) {
            names = names.split(',');
          }
          this._additionalResources = _.union(this._additionalResources, names);
        },

        /**

         * @function
         *
         * @param names
         * @description Prevents one or more resources from being included.  The `names` parameter can be either
         string, or an array of strings, or nothing.  The string can contain a comma-delimited list,
         in which case it will be split to an array.  If nothing is specified, all inclusions will
         be removed (disabled).

  ```
  // Cancel all inclusions and fetch the fresh data
  model.excludeResources();
  model.fetch();
  ```
         */
        excludeResources: function (names) {
          if (names) {
            if (!_.isArray(names)) {
              names = names.split(',');
            }
            this._additionalResources = _.reject(this._additionalResources, names);
          } else {
            this._additionalResources.splice(0, this._additionalResources.length);
          }
        },



        /**
         * @function
         * @description    Formats the URL query parameters for the resource inclusion.  They can be concatenated
         with other URL query parts (both object literals and strings) by `Url.combineQueryString`.

 ```
 var url = ...,
 query = Url.combineQueryString(
 ...,
 this.getAdditionalResourcesUrlQuery()
 );
 if (query) {
  url = Url.appendQuery(url, query);
 }
 ```
         * @returns {*}
         */
        getAdditionalResourcesUrlQuery: function () {
          return _.reduce(this._additionalResources, function (result, parameter) {
            result[parameter] = '';
            return result;
          }, {});
        }

      });

    }

  };

  return AdditionalResourcesV2Mixin;

});

csui.define('nuc/models/node.columns2',['nuc/lib/backbone'], function (Backbone) {
  'use strict';

  var NodeColumn2Model = Backbone.Model.extend({
    id: 'column_key',

    constructor: function NodeColumn2Model(attributes, options) {
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    }
  });

  var NodeColumn2Collection = Backbone.Collection.extend({
    model: NodeColumn2Model,

    constructor: function NodeColumn2Collection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    }
  });

  return NodeColumn2Collection;
});

csui.define('nuc/models/node/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('nuc/models/node/impl/nls/root/lang',{
  sizeColumnTitle: 'Size'
});


csui.define('nuc/models/utils/v1tov2',[],function () {
  'use strict';

  var nodeExpands = ['original_id', 'parent_id', 'volume_id'],
      userExpands = ['create_user_id', 'modify_user_id', 'owner_user_id',
                     'reserved_user_id'],
      groupExpands = ['owner_group_id'],
      memberExpands = userExpands.concat(groupExpands);

  // Returns a v2 expand scope string or an object with key-array pairs.
  function includeExpandsV1toV2(expands) {
    // An array can be converted to an object with key-array pairs.
    if (Array.isArray(expands)) {
      return expands.reduce(function (result, expand) {
        if (expand === 'node') {
          mergeProperties(result, nodeExpands);
        } else if (expand === 'member') {
          mergeProperties(result, memberExpands);
        } else if (expand === 'user') {
          mergeProperties(result, userExpands);
        } else if (expand === 'group') {
          mergeProperties(result, groupExpands);
        } else {
          result[expand] || (result[expand] = []);
        }
        return result;
      }, {});
    // A v1 string can be converted an object with a single key-array pair.
    } else if (expands === 'node') {
      return {
        properties: nodeExpands.slice()
      };
    // A v1 string can be converted an object with a single key-array pair.
    } else if (expands === 'member') {
      return {
        properties: memberExpands.slice()
      };
    } else if (expands === 'user') {
      return {
        properties: userExpands.slice()
      };
    } else if (expands === 'group') {
      return {
        properties: groupExpands.slice()
      };
    }
    // Leave an object or a v2 string intact.
    return expands;

    function mergeProperties(result, expands) {
      var properties = result.properties || (result.properties = []);
      expands.forEach(function (property) {
        if (properties.indexOf(property) < 0) {
          properties.push(property);
        }
      });
    }
  }

  // Returns a v2 expand scope string or an array of them.
  function excludeExpandsV1toV2(expands) {
    if (Array.isArray(expands)) {
      return expands.reduce(function (result, expand) {
        if (expand === 'node' || expand === 'user'  || expand === 'group' ||
            expand === 'member') {
          expand = 'properties';
        }
        if (result.indexOf(expand) < 0) {
          result.push(expand);
        }
        return result;
      }, []);
    } else if (expands === 'node') {
      return nodeExpands.slice();
    } else if (expands === 'member') {
      return memberExpands.slice();
    } else if (expands === 'user' || expands === 'member') {
      return userExpands.slice();
    } else if (expands === 'group') {
      return groupExpands.slice();
    }
    return expands;
  }

  // Returns a v1 expand scope string or an array with them.
  function expandsV2toV1(expands) {
    // An array can be converted to an array.
    if (Array.isArray(expands)) {
      return expands.reduce(function (result, expand) {
        if (nodeExpands.indexOf(expand) >= 0) {
          result.push('node');
        } else if (userExpands.indexOf(expand) >= 0) {
          result.push('user');
        } else if (groupExpands.indexOf(expand) >= 0) {
          result.push('group');
        }
        return result;
      }, []);
    // An object can be converted to an array with v1 scopes.
    } else if (typeof expands === 'object') {
      var properties = expands.properties;
      if (properties) {
        if (!properties.length) {
          return ['node', 'member'];
        }
        return properties.reduce(function (result, expand) {
          if (nodeExpands.indexOf(expand) >= 0) {
            expand = 'node';
          } else if (userExpands.indexOf(expand) >= 0) {
            expand = 'user';
          } else if (groupExpands.indexOf(expand) >= 0) {
            expand = 'group';
          }
          if (result.indexOf(expand) < 0) {
            result.push(expand);
          }
          return result;
        }, []);
      }
      return [];
    // A v2 string can be converted to a v1 string.
    } else if (expands === 'properties') {
      return ['node', 'member'];
    }
    // Leave a v1 string intact.
    return expands;
  }

  return {
    includeExpandsV1toV2: includeExpandsV1toV2,
    excludeExpandsV1toV2: excludeExpandsV1toV2,
    expandsV2toV1: expandsV2toV1,
    nodeExpands: nodeExpands,
    userExpands: userExpands
  };
});

csui.define('nuc/models/mixins/syncable.from.multiple.sources/syncable.from.multiple.sources.mixin',[
  'nuc/lib/underscore', 'nuc/lib/jquery'
], function (_, $) {
  'use strict';

  var SyncableFromMultipleSources = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeSyncableFromMultipleSources: function (options) {
          return this;
        },

        syncFromMultipleSources: function (promises, mergeSources,
            convertError, options) {
          // Convert $.ajax rejected value by default
          function convertAjaxError(result) {
            return Array.isArray(result) ? result[0] : result;
          }

          // The convertError parameter is optional
          if (options === undefined && typeof convertError === 'object') {
            options = convertError;
            convertError = convertAjaxError;
          } else if (convertError == null) {
            convertError = convertAjaxError;
          }

          var model = this,
              // Pick only jQuery objects, which support the abort() method,
              // from all promises.
              abortables = promises.filter(function (promise) {
                return promise.abort;
              }),
              deferred = $.Deferred(),
              promise = deferred.promise();
          // Propagate jQuery object aborting interface, if the promises
          // come from $.ajax calls; add inject the abort() method.
          if (abortables.length) {
            promise.abort = function (statusText) {
              statusText || (statusText = 'canceled');
              abortables.forEach(function (promise) {
                promise.abort(statusText);
              });
              return this;
            };
          }
          // Implement Backbone event flow - 'request', callback,
          // promise. (Populating the model and triggering 'sync' or
          // 'error' events takes place in the fetch method.)
          model.trigger('request', model, {}, options);
          $.when.apply($, promises)
           .done(function () {
             var response = mergeSources.apply(model, arguments),
                 success = options.success;
             if (success) {
               success.call(options.context, response, 'success', {});
             }
             deferred.resolve(response, 'success', {});
           })
           .fail(function () {
             var object = convertError.apply(model, arguments),
                 error = options.error;
             if (error) {
               error.call(options.context, object, 'error', object.statusText);
             }
             // Return only the first error for simplicity; the others
             // will be logged by the connector, if they come from
             // failing $.ajax calls.
             deferred.reject.call(deferred, object, 'error', object.statusText);
           });
          return promise;
        }
      });
    }
  };

  return SyncableFromMultipleSources;
});

csui.define('nuc/models/node/server.adaptor.mixin',[
  'require', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/utils/url',
  'i18n!nuc/models/node/impl/nls/lang', 'nuc/models/utils/v1tov2',
  'nuc/models/mixins/syncable.from.multiple.sources/syncable.from.multiple.sources.mixin',
  'nuc/utils/deepClone/deepClone'
], function (require, _, $, Url, lang, v1tov2, SyncableFromMultipleSources) {
  'use strict';

  /** @class ServerAdaptorMixin
   * @mixin
   * @see ConnectableMixin
   * @description Overrides the methods of {@link https://backbonejs.org/#Model|Backbone.Model},
   * which are responsible for fetching and parsing data: url(), sync() and parse().
   * The overrides are Content Server specific.
   * ### How to apply the mixin to a model

   ```
   var MyModel = Backbone.Model.extend({

  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this
      .makeConnectable(options)
      .makeAdditionalResourcesV2Mixin(options);
  },

  url: function () {
    var url = Url.combine(this.connector.connection.url, 'myresource'),
        query = Url.combineQueryString(
          this.getAdditionalResourcesUrlQuery()
        );
    return query ? url + '?' + query : url;
  }

});

   ConnectableMixin.mixin(MyModel.prototype);
   AdditionalResourcesV2Mixin.mixin(MyModel.prototype);
   ```

   This mixin us usually combined together with the `ConnectableMixin`
   or with another cumulated mixin which includes it.

   */
  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      var originalSync = prototype.sync;
      SyncableFromMultipleSources.mixin(prototype);
      return _.extend(prototype, /** @lends ServerAdaptorMixin# */{
        makeServerAdaptor: function (options) {
          this.fetchExactFields = options && options.fetchExactFields;
          return this;
        },

        /** @function
         *
         * @returns {boolean}
         */
        isFetchableDirectly: function () {
          return this.get('id') > 0;
        },

        // TODO: Remove this method and make the cache layer aware of node URLs.
        urlCacheBase: function () {
          var url = this.urlBase();
          if (url.indexOf('/volumes') < 0) {
            url = url.replace('/api/v1/', '/api/v2/');
          }
          return url + '?';
        },

        urlBase: function () {
          var id = this.get('id'),
            url = this.connector.connection.url;
          if (!id) {
            // Create a new node by POST /nodes
            url = Url.combine(url, 'nodes');
          } else if (id === 'volume') {
            // Access an existing volume by VERB /volumes/:type
            url = Url.combine(url, 'volumes', this.get('type'));
          } else if (!_.isNumber(id) || id > 0) {
            // Access an existing node by VERB /nodes/:id
            url = Url.combine(url, 'nodes', id);
          } else {
            throw new Error('Unsupported id value');
          }
          if (this.options.apiVersion) {
            url.getApiBase(this.options.apiVersion);
          }
          return url;
        },

        /**
         * Overrides
         * {@link https://backbonejs.org/#Model-url|Backbone.Model.url()}.
         *
         * @returns {*}
         */
        url: function () {
          var url = this.urlBase();
          var query;
          if (!this.isNew()) {
            if (this.get('id') === 'volume') {
              var expands = v1tov2.expandsV2toV1(this.expand);
              if (expands.length) {
                query = $.param({expand: expands}, true);
              }
            } else {
              if (this.collection) {
                query = this._getCombinedUrlQuery({withActions: true});
              } else {
                query = this._getNodeUrlQuery({withActions: true});
              }
              // Request just common properties by default; do not waste server
              // resources, because it would return all it could by default.
              // If somebody set fields to a subset of properties already, they
              // are responsible for including all needed information.
              if (!this.hasFields('properties') && !this.fetchExactFields) {
                query = Url.combineQueryString(query, 'fields=properties');
              }
            }
          }
          return Url.appendQuery(url, query);
        },

        urlQueryWithoutActions: function () {
          var query;
          if (this.collection) {
            query = this._getCombinedUrlQuery({withActions: false});
          } else {
            query = this._getNodeUrlQuery({withActions: false});
          }
          if (!this.hasFields('properties') && !this.fetchExactFields) {
            query = query.concat({fields: 'properties'});
          }
          return query;
        },

        urlQueryWithActionsOnly: function () {
          var query;
          if (this.collection) {
            var collection = this.getV2ParameterSource();
            query = this._getUrlQueryActionsFromSource(collection);
          } else {
            query = this.getRequestedCommandsUrlQuery();
          }
          return query;
        },

        // Gets the URL query using the parameters of the node only.
        _getNodeUrlQuery: function (options) {
          var query = Url.combineQueryString(
            this.getResourceFieldsUrlQuery(),
            this.getExpandableResourcesUrlQuery(),
            this.getStateEnablingUrlQuery(),
            this.getAdditionalResourcesUrlQuery()
          );
          if (options.withActions) {
            query = Url.combineQueryString(
              query, this.getRequestedCommandsUrlQuery());
          }
          return query;
        },

        // Gets the URL query preferably using the parameters of the owning collection.
        _getCombinedUrlQuery: function (options) {
          var collection = this.getV2ParameterSource();
          var queryParts = this._getUrlQueryWithoutActionsFromSource(collection);
          if (options.withActions) {
            var actions = this._getUrlQueryActionsFromSource(collection);
            queryParts = queryParts.concat(actions);
          }
          return Url.combineQueryString.apply(Url, queryParts);
        },

        _getUrlQueryWithoutActionsFromSource: function (collection) {
          return [
            'getExpandableResourcesUrlQuery',
            'getAdditionalResourcesUrlQuery',
            'getStateEnablingUrlQuery',
            'getResourceFieldsUrlQuery'
          ].map(function (method) {
            var parameters = this[method]();
            if (_.isEmpty(parameters)) {
              // If no data limits were specified in the node
              // model, try to inherit them from the collection
              method = collection[method];
              if (method) {
                return method.call(collection);
              }
            }
            return parameters;
          }, this);
        },

        _getUrlQueryActionsFromSource: function (collection) {
          var method = this.delayRestCommands ?
            'getRequestedCommandsUrlQuery' :
            'getAllCommandsUrlQuery';
          var commands = this[method]();
          if (_.isEmpty(commands)) {
            // No delayed actions could be enabled for the node
            // model, unless specifying the default action command.
            // The collection can give non-delayed commands only;
            // if it supports delayed actions or not.
            method = collection.getAllCommandsUrlQuery ||
              collection.getRequestedCommandsUrlQuery;
            if (method) {
              commands = method.call(collection);
            }
          }
          // TODO: Remove this horrible code breaking componentisation.
          if (this.refernce_id || this.attributes.reference_id) {
            commands = _.extend({
              reference_id: this.refernce_id || this.attributes.reference_id
            }, commands);
          }
          return commands;
        },

        /**
         * Overrides
         * {@link https://backbonejs.org/#Model-sync|Backbone.Model.sync()}
         * @param method {String} -  the CRUD method ("create", "read", "update", or "delete")
         * @param model {Backbone.Model} - the model to be saved (or collection to be read)
         * @param options {Object} - success and error callbacks, and all other jQuery request options
         * @returns {*}
         */
        sync: function (method, model, options) {
          if (method !== 'read') {
            adaptNotFetching(this, options);
          }
          if (method === 'read' && options.urlQueryWithActionsOnly) {
            return syncNodeWithSeparateCommands(this, options);
          }
          return originalSync.call(this, method, model, options);
        },

        /**
         * Overrides
         * {@link https://backbonejs.org/#Model-parse|Backbone.Model.parse()}.
         * parse is called whenever a model's data is returned by the server, in fetch, and save.
         * The function is passed the raw response object, and should return the attributes hash to be set on the model.
         * The default implementation is a no-op, simply passing through the JSON response.
         * Override this if you need to work with a preexisting API, or better namespace your responses.
         * @param response
         * @returns {*|{id}|{results}}
         */
        parse: function (response) {
          // A node obtained from a collection has the properties directly
          // in the object, while if obtained by a single call, they are
          // nested in the data sub-object.
          // node from v2/nodes/:id or v1/nodes/:id
          var results = response.results || response,
            // If node attributes are re-parsed, they will contain the "data"
            // object with properties from additional roles. Detect only "data"
            // from a v1 or a v2 response here.
            resultData = results.data,
            data = resultData && (resultData.id || resultData.properties) && resultData,
            // node from v2/nodes/:id or v2/nodes
            // node from v1/nodes/:id or v1/nodes
            node = data && data.properties || data || response;

          // However, some properties are scattered in the response object
          // directly, or even in artificial sub-objects like type_info,versions;
          // speak about developing API serving clients' needs, sigh.
          if (response.type !== undefined) {
            node.type = response.type;
          }
          if (response.type_name !== undefined) {
            node.type_name = response.type_name;
          }
          if (data && data.versions) {
            node.versions = data.versions;
          }
          _.extend(node, response.type_info);
          if (node.versions) {
            var version = node.versions;
            if (_.isArray(version)) {
              version = version[version.length - 1];
            }
            if (version) {
              _.extend(node, _.pick(version, ['file_size', 'mime_type',
                'version_id', 'version_number',
                'version_number_major',
                'version_number_minor']));
            }
          }

          // Properties out of data are not passed to the constructor.  This
          // may yet get its own sub-model.
          _.defaults(node, {
            perspective: results && results.perspective || response.perspective
          });

          // Extract state flags like metadata token from the response.
          this.parseState(node, results);

          // Normalize V1 actions and V2 commands to [{signature}, ...]
          this._parseActions(node, results, response);

          // Normalize actions in the shortcut target sub-node
          var original = node.original_id && node.original_id.id ?
            node.original_id : node.original_id_expand;
          if (original) {
            this._parseActions(original, {}, {});
            // No faking default action permissions for shortcut originals;
            // only 'open' was not enough - all default acions are permitted
            // in DefaultActionController
          }

          // Normalize actions in the parent location sub-node
          var parent = node.parent_id && node.parent_id.id ?
            node.parent_id : node.parent_id_expand;
          if (parent) {
            this._parseActions(parent, {}, {});
            if (!parent.actions.length) {
              // TODO: Remove this, as soon as the actions for parent
              // locations are returned by the server
              // Add (default) actions used for hyperlinks
              this._makeAccessible(parent);
            }
          }

          // V1 does not send the URL; if the 'default' command is available,
          // we can red it from there, otherwise it is not possible
          if (node.type === 140 && !node.url) {
            var defaultAction = _.findWhere(node.actions, {signature: 'default'});
            node.url = defaultAction && defaultAction.href;
          }

          // Make addable types available in the node constructor
          node.addable_types = response.addable_types;
          // Make columns available in the node constructor
          var columns = data && data.columns;
          if (columns) {
            node.columns = this._parseColumns(columns, response);
          }
          // Make definitions available in the node constructor
          var definitions = response.definitions || results.metadata &&
            results.metadata.properties;
          if (definitions) {
            node.definitions = this._parseDefinitions(definitions, columns);
          }

          // Make additional v2 data accessible in the model attributes;
          // data.properties are accessible as the flat node attributes
          // and columns with metadata are pre-parsed by helper methods
          if (data && data.properties) {
            node.data = _.omit(data, 'columns', 'metadata', 'properties');
          }

          // add reference_id to node for children under collection (ie., subtype 298) container.
          if (this.collection && this.collection.node && this.collection.node.get('type') === 298) {
            node.reference_id = this.collection.node.get('id');
          }
          // If node is getting updated by any of its actions, we are fetching entire node info
          // which includes promoted and non-promoted actions also. So to avoid re-fetch
          // nonpromoted actions from inline and toolbar setting 'csuiLazyActionsRetrieved'
          // attribute to node.
          if (this.get('csuiLazyActionsRetrieved') === undefined &&
            !!this.get('csuiDelayedActionsRetrieved') && !_.isEmpty(this.changed)) {
            node.csuiLazyActionsRetrieved = true;
          }
          return node;
        },

        _parseColumns: function (columns, response) {
          var columnKeys = response.definitions_order ||
            columns && _.pluck(columns, 'key');
          return _.map(columnKeys, function (key) {
            return {key: key};
          });
        },

        _parseDefinitions: function (definitions, columns) {
          if (!definitions.size &&
            (definitions.container_size || definitions.file_size)) {
            definitions.size = definitions.container_size ||
              definitions.file_size;
            definitions.size.key = 'size';
            definitions.size.name = lang.sizeColumnTitle;
          }
          if (columns) {
            _.each(columns, function (column) {
              var columnKey = column.key,
                definition = definitions[columnKey];
              if (!definition) {
                definition = definitions[columnKey] = _.omit(column, 'data_type');
                definition.type = column.data_type;
              }

              // for all user related column attributes let's add definition type as 14.
              var supportedPersonas = ['user', 'group', 'member'];
              if ($.inArray(definition.persona, supportedPersonas) !== -1) {
                definition.type = 14;
              }

              // Take fileds=columns from v2 into account.
              definition.sort = !!column.sort_key;
            });
            // Update the real value-carrying column, which does not end with
            // "_formatted", if only the "_formatted" one is present and not
            // the real one. "_formatted"  columns should not be used, because
            // they do not provide the real value for sorting, filtering, saving
            // or other scenarios, where it is needed. Also the right formatting
            // is specified in Smart UI. "_formatted" columns are for AJAX calls
            // from Classic UI, because they for at according to its design.
            _.each(columns, function (column) {
              var columnKey = column.key,
                formattedIndex = columnKey.lastIndexOf('_formatted');
              if (formattedIndex >= 0) {
                var realColumnKey = columnKey.substr(0, columnKey.length - 10),
                  definition = definitions[realColumnKey];
                if (!definition) {
                  definition = definitions[realColumnKey] = _.omit(column, 'data_type');
                  definition.type = definition.data_type;
                }
                // Take fileds=columns from v2 into account.
                definition.sort = !!column.sort_key;
              }
            });
          }
          return _.map(definitions, function (definition, key) {
            if (!definition.key) {
              definition.key = key;
            }
            return definition;
          });
        },

        _parseActions: function (node, results, response) {
          // Normalize V1 actions and V2 commands to [{signature}, ...]
          var actions = node.actions || response.actions ||
            // v1/volumes/:type actions
            response.available_actions,
            commands;
          if (_.isArray(actions)) {
            // v1 actions
            _.each(actions, function (action) {
              // normalize the v1/volumes/:type actions
              if (!action.signature) {
                action.signature = action.type;
                action.name = action.type_name;
                delete action.type;
                delete action.type_name;
              }
            });
            commands = _.reduce(actions, function (result, action) {
              result[action.signature] = {};
              return result;
            }, {});
            node.actions = actions;
          } else {
            // v2-like commands added to v1 and v2 commands
            commands = node.commands || response.commands || response.actions ||
              // v2 actions
              results && results.actions || {};
            // v2 moved the content of actions to actions.data and left
            // the actions object with the three keys only
            if (commands.data && commands.order && commands.map) {
              commands = commands.data;
            }
            node.actions = _.chain(commands)
              .keys()
              .map(function (key) {
                var attributes = commands[key];
                attributes.signature = key;
                return attributes;
              })
              .value();
            delete node.commands;
            delete node.commands_map;
            delete node.commands_order;
          }
        },

        // TODO: Remove this, as soon as the actions for shortcut
        // targets, parents or other expanded nodes  are returned
        //  by the server
        _makeAccessible: function (original) {
          original.actions = [
            {signature: 'open'}
          ];
        }
      });
    }
  };

  var NodeActionCollection;

  function syncNodeWithSeparateCommands(node, options) {
    var deferred = $.Deferred();
    csui.require(['nuc/models/node.actions'], function () {
      NodeActionCollection = arguments[0];
      var promiseForNode = fetchNodeWithoutActions(node, options);
      var promiseForActions = fetchNodeActions(node, options);
      options = _.defaults({parse: false}, options);
      node.syncFromMultipleSources(
        [promiseForNode, promiseForActions],
        mergeNodeWithActions, options)
        .then(deferred.resolve, deferred.reject);
    }, deferred.reject);
    return deferred.promise();
  }

  function mergeNodeWithActions(node, actions) {
    node.actions = actions;
    return node;
  }

  function fetchNodeWithoutActions(originalNode, options) {
    // Use a cloned node to fetch the node with different URL parameters
    // (without actions) than the original node would use.
    var node = originalNode.clone();
    node.separateCommands = false;
    // Use URL parameters either from the explicitly specified collection,
    // or from the parent collection. The clone does not point to the parent
    // collection, that is why it is passed explicitly as the second choice.
    var collection = options.collection || originalNode.collection;
    // The node can be in a selection collection. Backbone add it to the first
    // collection, which uses add(). Only the full-weight collections that
    // fetch and then contain nodes can be considered parent collections
    /// carrying the URL parameters to decide the node scope.
    if (node.isCollectionV2ParameterSource(collection)) {
      // The method getResourceScope may not be available on the collection.
      var parameterScope = node.getResourceScopeFrom(collection);
      node.setResourceScope(parameterScope);
    }
    node.resetCommands();
    node.resetDefaultActionCommands();
    node.invalidateFetch();
    return node
    // Do not pass all options. They include Backbone callbacks for the
    // originating call, for example. Select only those, which need to
    // be performed to be compliant with Backbone. (Not the original URL
    // which might contain all actions.)
      .fetch(_.pick(options, 'headers', 'parse', 'silent'))
      .then(function () {
        return node.attributes;
      });
  }

  function fetchNodeActions(node, options) {
    var actions = new NodeActionCollection(undefined, {
      connector: node.connector,
      nodes: [node.get('id')],
      commands: options.urlQueryWithActionsOnly.actions,
      reference_id:options.urlQueryWithActionsOnly.reference_id
    });
    return actions
      .fetch()
      .then(function () {
        return actions.reduce(function (actions, node) {
          var attributes = node.actions.toJSON();
          return actions.concat(attributes);
        }, []);
      });
  }

  function adaptNotFetching(node, options) {
    var url = options.url;
    if (url && _.isString(url)) {
      // Omit URL parameters if this is not a GET request.
      options.url = url.replace(/\?.*$/, '');
    } else {
      // Ensure a URL without URL parameters by not letting it compute later.
      options.url = node.urlBase();
    }
  }

  return ServerAdaptorMixin;
});



csui.define('nuc/models/node/node.model',[
  'module', 'nuc/lib/underscore', 'nuc/lib/backbone',
  'nuc/models/actions', 'nuc/models/addabletypes',
  'nuc/models/mixins/resource/resource.mixin',
  'nuc/models/mixins/uploadable/uploadable.mixin',
  'nuc/models/mixins/v2.fields/v2.fields.mixin',
  'nuc/models/mixins/v2.expandable/v2.expandable.mixin',
  'nuc/models/mixins/state.carrier/state.carrier.mixin',
  'nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'nuc/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'nuc/models/node.columns2', 'nuc/models/node/server.adaptor.mixin',
  'nuc/models/utils/v1tov2', 'nuc/utils/deepClone/deepClone'
], function (module, _, Backbone, ActionCollection, AddableTypesCollection,
    ResourceMixin, UploadableMixin, FieldsV2Mixin, ExpandableV2Mixin,
    StateCarrierMixin, DelayedCommandableV2Mixin, AdditionalResourcesV2Mixin,
    NodeColumn2Collection, ServerAdaptorMixin, v1tov2) {
  'use strict';

  var config = _.extend({
    idAttribute: null,
    // ID should be always handles as a black box. The client should send
    // it to the server the same, as it was received. The server should send
    // IDs in object properties; it should not send URLs, which the client
    // would have to parse and extract the ID from them.
    //
    // This flag can be used in the code, that does not follow the best
    // practice and parses an integer ID out of some string.
    usesIntegerId: true,
    // Fetching of permitted actions in parallel with the node information is
    // specific to OTCS only. Because role-based actions were not implemented
    // and permitted actions were added for commands, which could not be
    // configured, the actions became wasteful and too many. Fetching them in
    // parallel with the node fixes only the symptom of the problem, instead of
    // addressing it properly.
    separateCommands: false,
    separateCommandsThreshold: 10
  }, module.config());

  var NodeDefinition2Collection = Backbone.Collection.extend({
    model: Backbone.Model.extend(
      /** @lends NodeDefinition2Collection.prototype
       * @extends extern:Backbone.Collection
       */
      {
      id: 'key',
      constructor: function NodeDefinition2Model(attributes, options) {
        Backbone.Model.prototype.constructor.call(this, attributes, options);
      }
    }),
    /**
     * @name NodeDefinition2Collection
     * @constructs
     * @extends extern:Backbone.Collection
     * @param models
     * @param options
     */
    constructor: function NodeDefinition2Collection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    }
  });

 /*
  + ----------------------------------------------------------------------------
  + NodeModel
  + ----------------------------------------------------------------------------
  */

 // the following typedefs are needed for documentation purpuses and have no influence to code

  /**
   * @typedef NodeModel~create_user_id_expand
   * @property {String} name - The creator's name.
   */

  /**
   * @typedef NodeModel~modify_user_id_expand
   * @property {String} name - The modifier's name.
   */

  /**
   * @typedef NodeModel~reserved_user_id_expand
   * @property {String} name - The reserver's name.
   */

  /**
   * @typedef NodeModel~original_id_expand
   * @property {Boolean} container - Indicates if the original node is a container.
   * @property {String} mime_type - Mime type of the original node.
   * @property {Boolean} openable - Indication if the original node can be opened by the current user.
   * @property {Integer} type - The type of the original node. E.g. 144 stands for document, 0 stands for folder etc...
   * @property {Boolean} version_number - Version number of the original node.
   */


  /**
   * @typedef NodeModel~attributes
   * @property {Integer} id - The id of the node (document).
   * @property {String} name - The name of this node
   * @property {Object} name_multilingual - An alternative name for each supported locale.
   * @property {Integer} type - The type of this node. E.g. 144 stands for document, 0 stands for folder etc...
   * @property {String} type_name - The type name of this node, e.g. 'Document'.
   * @property {Boolean} versionable - Indicates if this node is versionable.
   * @property {Array} actions - List of actions available for the node.
   * @property {Array} addable_types - List of types addable to that node (property container has to be true).
   * @property {Boolean} advanced_versioning - Indicates if this node is under advanced versioning.
   * @property {Boolean} container - Indicates if this node is a container.
   * @property {Integer} container_size - Container size (for containers only).
   * @property {Integer} comments - Number of comments added to this node.
   * @property {String} create_date - Creation date, given in ISO format.
   * @property {Integer} create_user_id - The user id of the creator of this node.
   * @property {NodeModel~create_user_id_expand} create_user_id_expand - The expanded create user id information.
   * @property {Object} data - Used by extensions to provide additional data.
   * @property {String} description - The description of the node.
   * @property {Object} description_multilingual - An alternative description for each supported locale.
   * @property {Boolean} favorite - Indication if this node is favorite of the current user.
   * @property {Boolean} hidden - Indication if this node is hidden.
   * @property {String} mime_type - Mime type of the current node.
   * @property {String} modify_date - Date of last modification of this node, given in ISO format.
   * @property {Array} modify_images - Deprecated.
   * @property {Integer} modify_user_id - The user id of the creator of this node.
   * @property {NodeModel~modify_user_id_expand} modify_user_id_expand - The expanded modify user id information.
   * @property {Boolean} openable - Indication if this node can be opened by the current user.
   * @property {Integer} original_id - Id of the original node (valid only for nodes of type 'Shortcut').
   * @property {NodeModel~original_id_expand} original_id_expand - Expanded information for original_id.
   * @property {String} owner - The owner of the node.
   * @property {Integer} owner_group_id - The id of the owner's group.
   * @property {Integer} owner_user_id - The id of the owner's user.
   * @property {Integer} parent_id - Id of the parent node (container).
   * @property {String} permissions_model - The permission model, which is one of 'simple' or 'advanced'.
   * @property {Object} perspective - Perspective details.
   * @property {Boolean} reserved - Indication if this node is reserved.
   * @property {String} reserved_date - Date of reservation, given in ISO format.
   * @property {Boolean} reserved_shared_collaboration - Flag indicating reservation for shared collaboration.
   * @property {Integer} reserved_user_id - The user id of the user which has reserved this node.
   * @property {NodeModel~reserved_user_id_expand} reserved_user_id_expand - The reserved user id information.
   * @property {Integer} size - Size of the document, in Bytes.
   * @property {String} size_formatted - Formatted size of the document
   * @property {Object} state - State object.
   * @property {Object} status - Status.
   * @property {Boolean} versions_control_advanced - Indicates if this node uses advanced versioning.
   * @property {Integer} volume_id - The node's volume id.
   * @property {undefined} wnd_comments - Obsolete.
   *
   */

  var NodeModel = Backbone.Model.extend(
    /** @lends NodeModel.prototype **/
    {

    /**
     * idAttribute
     * @memberof NodeModel
     * @instance
     * @type String
     * */
    idAttribute: config.idAttribute,

    /**
     * @constructor
     * @param attributes
     * @param options
     * @mixes AdditionalResourcesV2Mixin
     * @mixes ConnectableMixin
     * @mixes FieldsV2Mixin
     * @mixes ServerAdaptorMixin
     * @mixes StateCarrierMixin
     * @mixes DelayedCommandableV2Mixin
     * @mixes ResourceMixin
     * @mixes UploadableMixin
     * @augments Backbone.Model
     * @name NodeModel
     * @requires  nuc/models/actions
     * @description Provides read/write access to CS nodes.  When creating a new instance, you
     * need to pass an instance of the `Connector` to the constructor to connect it
     * to the server. Nodes can be fetched single or within a collection like container children,
     * for example.  The `NodeModel` supports initialization from the server
     * responses, which have the same response format as the core CS REST API.
     * The properties as expected from a view are (given as an abstract type, but actually is a Backbone
     * attributes list): {@link NodeModel~attributes}.
     * The NodeModel class uses several mixins, which encapsulate different tasks, as there are
     * * **AdditionalResourcesV2Mixin** - supports the setting of additional URL query parameters necessary for V2 of CS REST API
     * * **ConnectableMixin** - enables the handling of server connections
     * * **DelayedCommandableMixin** - provides support for fetching permitted actions
     * by an extra call after the primary node model has been fetched.
     * * **FieldsV2Mixin** - Provides support for the setting fields URL query parameter as introduced by
     * the `api/v2/members/favorites` or `api/v2/members/accessed` (V2) resources.
     * * **ServerAdaptorMixin** - Overrides the methods of Backbone.Model, which are responsible for fetching and
     * parsing data: `url()`, `sync()` and `parse()`. The overrides are Content Server specific. If you want to support
     * a different server than CS, you usually have to override this mixin.
     * * **StateCarrierMixin** - Provides support for maintaining the state properties as introduced
     * by the `api/v2/nodes/:id` or `api/v2/nodes/:id/nodes` (V2) resources.
     * * **ResourceMixin** - Helps implementing a model for a typical server resource, which has an identifier
     * (the property `id` by default), by combining the following three mixins: ConnectableMixin, FetchableMixin and AutoFetchableMixin.
     * * **UploadableMixin** - Enables creating and modifying the resource behind a `Backbone.Model`. Simplifies requests
     * with multi-part content, enables mocking by mockjax and supports pasing the JSON body as form-encoded parameter "body".


     * @example
// Fetch a concrete node and print its name on the console
var connector = new Connector({
                      connection: {
                        url: '//server/instance/cs/api/v1',
                        supportPath: '/instancesupport'
                      }
                    }),
     node = new NodeModel({
                        id: 1234
                      }, {
                        connector: connector
                      });

 node.fetch()
 .done(function () {
          console.log(node.get('name'));
        });

 // Create a model for the Enterprise Volume by its subtype
 var enterpriseVolume = new NodeModel({
                        id: 'volume',
                        type: 141
                      }, {
                        connector: connector
                      });

     */

    constructor: function NodeModel(attributes, options) {
      attributes || (attributes = {});
      options || (options = {});

      Backbone.Model.prototype.constructor.call(this, attributes, options);

      this.options = _.pick(options, ['connector']);

      this.makeResource(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeStateCarrier(options, attributes)
          .makeDelayedCommandableV2(options)
          .makeUploadable(options)
          .makeServerAdaptor(options);

      // Enable fetching of permitted actions in parallel with node information
      // if requested and if they exceed the threshold configured above.
      var separateCommands = options.separateCommands;
      this.separateCommands = separateCommands !== undefined ?
          separateCommands : config.separateCommands;

      this.setState(attributes);
      // Ensure sub-models; these set by _setCollectionProperty should
      // be always available, but this.set called from Backbone.Model
      // constructor creates them only, if they are in the attributes
      if (!attributes.actions) {
        this._setCollectionProperty('actions', ActionCollection,
            attributes, options);
      }
      if (!attributes.addable_types) {
        this._setCollectionProperty('addable_types', AddableTypesCollection,
            attributes, options);
      }
      if (!attributes.definitions) {
        this._setCollectionProperty('definitions', NodeDefinition2Collection,
            attributes, options);
      }
      if (!attributes.columns) {
        this._setCollectionProperty('columns', NodeColumn2Collection,
            attributes, options);
      }
      // Ensure sub-models; these set by _setNodeProperty are optional
      // and if this.set called from Backbone.Model didn't create them,
      // because they are not in the attributes, we won't do it here
    },

    /**
     * Clones this NodeModel.
     * @function
     * @returns {NodeModel}
     */
    clone: function () {
      var clone = new this.constructor(this.attributes, {
        connector: this.connector,
        fields: _.deepClone(this.fields),
        expand: _.deepClone(this.expand),
        stateEnabled: this.stateEnabled,
        includeResources: _.clone(this._additionalResources),
        commands: _.clone(this.commands),
        defaultActionCommands: _.clone(this.defaultActionCommands),
        delayRestCommands: this.delayRestCommands,
        separateCommands: this.separateCommands
      });
      clone.actions.reset(this.actions.toJSON());
      clone.fetched = this.fetched;
      clone.error = this.error;
      clone.state.set(this.state.toJSON());
      return clone;
    },

    /**
     * @method
     * @returns {boolean}
     * @description
     * Indicates if this NodeModel is new, i.e. has no `id` attribute set.
     */
    isNew: function () {
      return !this.has('id');
    },

    /**
     * Indicates if the collection supports v2 REST API; use it directly as a URL query source.
     * @param collection
     * @returns {*|FieldsV2Mixin.makeFieldsV2|makeFieldsV2|t.makeFieldsV2}
     */
    isCollectionV2ParameterSource: function (collection) {
      // If the collection supports v2 REST API, use it directly
      // as a URL query source.
      return collection && collection.makeFieldsV2;
    },

    /**
     * If the collection associated with this NodeModel is a V2 parameter source,
     * @returns {*|NodeModel|*}
     */
    getV2ParameterSource: function () {
      var collection = this.collection;
      if (this.isCollectionV2ParameterSource(collection)) {
        return collection;
      }
      // Otherwise use a v2 node node model as a URL query source
      // and include parameters from the v1 collection there
      var node = this.clone();
      if (collection) {
        var additionalResources = collection._additionalResources;
        if (additionalResources) {
          node.includeResources(additionalResources);
        }
        var defaultActionCommands = collection.defaultActionCommands;
        if (defaultActionCommands) {
          node.setDefaultActionCommands(defaultActionCommands);
        }
        var commands = collection.includeCommands;
        if (commands) {
          node.setCommands(commands);
        }
        var expand = collection.expand;
        if (expand) {
          node.setExpand(v1tov2.includeExpandsV1toV2(expand));
        }
      }
      return node;
    },

    /**
     * Set properties.
     * @param key
     * @param val
     * @param options
     * @returns {NodeModel|any}
     */
    set: function (key, val, options) {
      var attrs;
      if (key == null) {
        return this;
      }

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});
      // Using 'skipSetValue' to skip "sync" call in case of rename for Grid-view
      this.setState(attrs);
      if (val && val.skipSetValue) {
        return;
      }

      // TODO: Support sub-models and sub-collections in general
      if (attrs.actions) {
        this._setCollectionProperty('actions', ActionCollection, attrs, options);
       }
      if (attrs.addable_types) {
         this._setCollectionProperty('addable_types', AddableTypesCollection, attrs,
            options);
      }
      if (attrs.definitions) {
         this._setCollectionProperty('definitions', NodeDefinition2Collection, attrs, options);
       }
      if (attrs.columns) {
        this._setCollectionProperty('columns', NodeColumn2Collection, attrs, options);
      }
      if (attrs.original_id !== undefined) {
         this._setNodeProperty('original', attrs, options);
      }
       if (attrs.parent_id !== undefined) {
         this._setNodeProperty('parent', attrs, options);
       }
      if (attrs.volume_id !== undefined) {
         this._setNodeProperty('volume', attrs, options);
       }

      // do the usual set
      return Backbone.Model.prototype.set.call(this, attrs, options);
    },

    /**
     * @function
     * @description
     * Triggers
     * - a Backbone `reset` event for all sub-collections (`actions`, `addableTypes`, `definitions`, `columns`)
     * - a Backbone `change` event for all sub-models (`original`, `parent`, `volume`)
     * - a Backbone `change` event for all attributes (see {@link NodeModel~attributes})

     */
    triggerAllChanges: function () {
      // Trigger reset on all sub-collections
      triggerReset(this.actions);
      triggerReset(this.addableTypes);
      triggerReset(this.definitions);
      triggerReset(this.columns);

      // Trigger change on all sub-model.
      triggerChange(this.original);
      triggerChange(this.parent);
      triggerChange(this.volume);

      // Trigger change on all model attributes.
      triggerChange(this);

      function triggerReset(collection) {
        if (collection) {
          collection.trigger('reset', collection);
        }
      }

      function triggerChange(model) {
        if (model) {
          var attributes = model.attributes;
          Object
              .keys(attributes)
              .forEach(function (attributeName) {
                model.trigger('change:' + attributeName, model, attributes[attributeName]);
              });
          model.trigger('change', model);
        }
      }
    },

    /**
     * Set a collection property.
     * @param attribute
     * @param Class
     * @param attributes
     * @param options
     * @private
     */
    _setCollectionProperty: function (attribute, Class, attributes, options) {
      var property   = _.str.camelize(attribute),
          models     = attributes[attribute],
          collection = this[property];
      if (collection) {
        collection.reset(models, {silent: options && options.silent});
      } else {
        this[property] = new Class(models, {
          // When this.set is called from the Backbome.Model constructor,
          // the current node hasn't been conected yet.  Sub-nodes would
          // be disconnected, if just this.connector would be used.  The
          // connector may be in the constructor options, if the caller
          // wanted to connect the node right away.
          connector: this.connector || options && options.connector
        });
      }
    },

    /**
     * Set a node property.
     * @param name
     * @param source
     * @param options
     * @private
     */
    _setNodeProperty: function (name, source, options) {
      // v1 expands the _id property directly, v2 adds an additional
      // one _id_expand
      var value = source[name + '_id_expand'] || source[name + '_id'];
      // If the property was not expanded, initialize the model just
      // with the object identifier
      if (value && !_.isObject(value)) {
        value = {id: value};
      }
      if (_.isObject(value)) {
        if (this[name]) {
          this[name].set(value, {silent: options && options.silent});
        } else {
          this[name] = new NodeModel(value, {
            // When this.set is called from the Backbome.Model constructor,
            // the current node hasn't been conected yet.  Sub-nodes would
            // be disconnected, if just this.connector would be used.  The
            // connector may be in the constructor options, if the caller
            // wanted to connect the node right away.
            connector: this.connector || options && options.connector
          });
        }
      } else {
        delete this[name];
      }
    },

    /**
     * Get URL params data for associated resource
     * @returns {*}
     */
    getResourceScope: function () {
      var parameterSource = this.getV2ParameterSource();
      return _.deepClone({
        fields: _.isEmpty(this.fields) ? parameterSource.fields : this.fields,
        expand: _.isEmpty(this.expand) ? parameterSource.expand : this.expand,
        includeResources: _.isEmpty(this._additionalResources) ?
                          parameterSource._additionalResources :
                          this._additionalResources,
        commands: _.isEmpty(this.commands) ? parameterSource.commands : this.commands,
        defaultActionCommands: this.defaultActionCommands
      });
    },

    /**
     * Get URL params data for given resource
     * @param source
     * @returns {*}
     */
    getResourceScopeFrom: function (source) {
      return _.deepClone({
        fields: source.fields,
        expand: source.expand,
        includeResources: source._additionalResources,
        commands: source.commands,
        defaultActionCommands: source.defaultActionCommands
      });
    },

    /**
     * Set URL params data
     * @param scope
     */
    setResourceScope: function (scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetFields();
      scope.fields && this.setFields(scope.fields);
      this.resetExpand();
      scope.expand && this.setExpand(scope.expand);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
      this.resetDefaultActionCommands();
      scope.defaultActionCommands && this.setDefaultActionCommands(scope.defaultActionCommands);
    },

    /**
     * Serialize this node to String (`id` resp. `volume`).
     * @returns {string}
     */
    toString: function () {
      // Format a string for logging purposes
      var id = this.get('id');
      if (id === 'volume') {
        return 'volume:' + this.get('type');
      } else if (id != null) {
        return 'node:' + id;
      }
      return 'node:invalid';
    }
  }, {
    usesIntegerId: config.usesIntegerId
  });

  AdditionalResourcesV2Mixin.mixin(NodeModel.prototype);
  FieldsV2Mixin.mixin(NodeModel.prototype);
  ExpandableV2Mixin.mixin(NodeModel.prototype);
  StateCarrierMixin.mixin(NodeModel.prototype);
  DelayedCommandableV2Mixin.mixin(NodeModel.prototype);
  UploadableMixin.mixin(NodeModel.prototype);
  ResourceMixin.mixin(NodeModel.prototype);
  ServerAdaptorMixin.mixin(NodeModel.prototype);

  /**
   * Indicates if this NodeModel is fetchable, i.e. has an associated node id.
   * @method
   * @returns {boolean}
   */
  NodeModel.prototype.isFetchable = function () {
    // TODO: Remove this condition, as soon as nobody uses -1 as an invalid ID.
    if (NodeModel.usesIntegerId) {
      var id = this.get('id');
      return id > 0 || id === 'volume';
    }
    return !!this.get('id');
  };

  var originalFetch = NodeModel.prototype.fetch;
  /**
   * Overrides the Backbone.Model 'fetch' method. Allows to set a target collection via `options`.
   * @param options {Object} - Set the `collection` property to define a target collection.
   * @returns {*}
   */
  NodeModel.prototype.fetch = function (options) {
    options || (options = {});

    // If not overridden, Use the v2 URL for GET requests.
    // If not overridden and the target collection has been specified,
    // let the url method use its data-limiting parameters.
    if (!options.url) {
      var originalCollection = this.collection,
          newCollection      = options.collection;
      if (newCollection) {
        this.collection = newCollection;
      }
      computeUrl(this, options);
      if (newCollection) {
        this.collection = originalCollection;
      }
    }

    return originalFetch.call(this, options);
  };

  /**
   * Compute URL for this node.
   * @method
   * @param node
   * @param options
   */
  function computeUrl (node, options) {
    // Support separate fetching of permitted actions only if the server
    // adaptor provides methods for it. And only for a v2 node.
    // If the actions are delayed, no need to separate the calls.
    if (node.separateCommands && !node.delayRestCommands &&
        node.urlQueryWithActionsOnly && node.get('id') !== 'volume') {
      var actionsQuery =  _.result(node, 'urlQueryWithActionsOnly');
      // The URL has tt contain the multi-value "actions" parameter.
      if (actionsQuery && actionsQuery.actions.length > config.separateCommandsThreshold) {
        // Give a hint to the server adaptor to fetch the actions separately.
        options.urlQueryWithActionsOnly = actionsQuery;
        return;
      }
    }
    // Ensure using the v2 URL unless volume information is request.
    var url = _.result(node, 'url');
    if (url.indexOf('/volumes') < 0) {
      url = url.replace('/api/v1/', '/api/v2/');
    }
    options.url = url;
  }

  return NodeModel;
});

csui.define('nuc/models/mixins/node.connectable/node.connectable.mixin',['nuc/lib/underscore'
], function (_) {
  "use strict";

  var NodeConnectableMixin = {

    mixin: function (prototype) {
      var originalPrepareModel = prototype._prepareModel;

      return _.extend(prototype, {

        makeNodeConnectable: function (options) {
          if (options && options.node) {
            this.node = options.node;
            options.node.connector && options.node.connector.assignTo(this);
          }
          return this;
        },

        _prepareModel: function (attrs, options) {
          options || (options = {});
          var node = options.node || this.node;
          options.connector = node && node.connector;
          return originalPrepareModel.call(this, attrs, options);
        }

      });
    }

  };

  return NodeConnectableMixin;

});

csui.define('nuc/models/mixins/node.autofetchable/node.autofetchable.mixin',['nuc/lib/underscore'
], function (_) {
  "use strict";

  var NodeAutoFetchableMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeNodeAutoFetchable: function (options) {
          var autofetchEvent = options && options.autofetchEvent;
          if (autofetchEvent) {
            this._autofetchEvent = options.autofetchEvent;
          }
          var autofetch = options && options.autofetch;
          if (autofetch) {
            this.automateFetch(autofetch);
          }
          return this;
        },

        automateFetch: function (enable) {
          var event = _.result(this, '_autofetchEvent'),
              method = enable ? 'on' : 'off';
          this.autofetch = !!enable;
          this.node[method](event, _.bind(this._fetchAutomatically, this, enable));
        },

        isFetchable: function () {
          return this.node.isFetchableDirectly();
        },

        _autofetchEvent: 'change:id',

        _fetchAutomatically: function (options) {
          this.isFetchable() && this.fetch(_.isObject(options) && options);
        }
      });
    }
  };

  return NodeAutoFetchableMixin;
});

csui.define('nuc/models/mixins/node.resource/node.resource.mixin',['nuc/lib/underscore', 'nuc/models/mixins/node.connectable/node.connectable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/mixins/node.autofetchable/node.autofetchable.mixin'
], function (_, NodeConnectableMixin, FetchableMixin, NodeAutoFetchableMixin) {

  var NodeResourceMixin = {

    mixin: function (prototype) {
      NodeConnectableMixin.mixin(prototype);
      FetchableMixin.mixin(prototype);
      NodeAutoFetchableMixin.mixin(prototype);

      return _.extend(prototype, {

        makeNodeResource: function (options) {
          return this.makeNodeConnectable(options)
              .makeFetchable(options)
              .makeNodeAutoFetchable(options);
        }

      });
    }

  };

  return NodeResourceMixin;

});

csui.define('nuc/models/node.addable.type/server.adaptor.mixin',[
  'nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          return Url.combine(this.node.urlBase(), 'addablenodetypes');
        },

        parse: function (response, options) {
          // The server returns very inconvenient structure, where the types
          // have textual keys and no subtype numbers.  An array of object
          // literals describing the addable type is put together from the
          // number parsed out of the form URL (!) from the data object
          // and the name from the definition object.
          var data        = response.data,
            definitions = response.definitions;
          return _.chain(data)
            .keys()
            .map(function (key) {
              var url        = data[key],
                definition = definitions[key];
              if (url && definition) {
                var match = url && /[?&]type=([^&]+)(?:&.*)?$/.exec(url);
                if (match) {
                  var subtype = parseInt(match[1], 10);
                  var type_name = definition.name;
                  return {
                    type: subtype,
                    type_name: type_name
                  };
                }
              }
            })
            .compact()
            .value();
        }

      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('nuc/models/node/node.addable.type.collection',['nuc/lib/underscore',
  'nuc/lib/backbone',
  'nuc/utils/url',
  'nuc/models/node/node.model',
  'nuc/models/mixins/node.resource/node.resource.mixin',
  'nuc/models/node.addable.type/server.adaptor.mixin'
], function (_,
    Backbone,
    Url,
    NodeModel,
    NodeResourceMixin,
    ServerAdaptorMixin) {
  'use strict';

  var AddableTypeModel = Backbone.Model.extend({

    defaults: {
      type: null,
      type_name: null
    },

    idAttribute: 'type',

    constructor: function AddableTypeModel() {
      Backbone.Model.prototype.constructor.apply(this, arguments);
    }

  });

  var NodeAddableTypeCollection = Backbone.Collection.extend({

    model: AddableTypeModel,

    constructor: function NodeAddableTypeCollection(models, options) {
      NodeAddableTypeCollection.__super__.constructor.apply(this, arguments);

      this.makeNodeResource(options)
        .makeServerAdaptor(options);
    },

    clone: function () {
      return new this.constructor(this.models, {node: this.node});
    },

    isFetchable: function () {
      return this.node.isFetchable();
    }

  });

  NodeResourceMixin.mixin(NodeAddableTypeCollection.prototype);
  ServerAdaptorMixin.mixin(NodeAddableTypeCollection.prototype);

  return NodeAddableTypeCollection;

});

csui.define('nuc/models/browsable/v2.response.mixin',['nuc/lib/underscore'
], function (_) {
  'use strict';

  var BrowsableV2ResponseMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {

        makeBrowsableV2Response: function (options) {
          this.orderBy = options.orderBy;
          return this;
        },

        parseBrowsedState: function (response, options) {
          var collection = response.collection || response,
              paging     = collection.paging,
              sorting    = collection.sorting,
              searching  = collection.searching;

          if (paging) {
            this.actualSkipCount = (paging.page - 1) * (paging.limit || 0);
            this.totalCount = paging.total_count;
            this.filteredCount = paging.filtered_count || paging.total_count;
          } else {
            // Support limited v2 collections like favorites
            this.actualSkipCount = 0;
            this.filteredCount = this.totalCount = response.results.length;
          }

          // Need to initialize/reset 'sortingColumnKey' because the Collection is reused for some browsing scenarios
          // that may not have the paging.columns data with the app/container call, not same as app/container/page.
          // In such cases (e.g. go to page2 and then browse to a different folder), the collection.sortingColumnKey
          // still has the previous value.
          this.sortingColumnKey = undefined;
          if (sorting) {
            this.sorting = sorting;

            // The value in the 'sorting' object can either be the column key or the sort key, depending on the type of
            // column.  Search the array of columns for a column with a matching sort key.  We want to save the column
            // key for this column for later use (see _handleResponseSortBy() in table.view.js).
            if (paging.columns) {
              var sortValue   = sorting.sort[0].value,
                  markerIndex = sortValue.indexOf('_'),
                  sortKey     = sortValue.substring(markerIndex + 1);

              var foundColumn;
              _.each(paging.columns, function (column) {
                if (column.sort_key === sortKey) {
                  foundColumn = column;
                }
              });

              if (foundColumn) {
                this.sortingColumnKey = foundColumn.key;
              }
            }
          }

          if (searching) {
            this.searching = searching;
          }
        },

        parseBrowsedItems: function (response, options) {
          return response.results;
        }

      });
    }

  };

  return BrowsableV2ResponseMixin;

});

csui.define('nuc/models/mixins/appcontainer/appcontainer.mixin',['nuc/lib/underscore'
], function (_) {
  "use strict";

  var AppContainerMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeAppContainer: function (options) {
          return this;
        },

        massageResponse: function (properties) {


          // component extensions
          // icondata
          // socialfeed:pulsecomment​
          // wopi:wopisessionerroricon​
          // wopi:wopisharedreserveicon​
          //var imgs = _.pluck(properties.modify_images, 'key');


          // add id to expands
          _.map(['original', 'create_user', 'owner_user',
              'reserved_user', 'modify_user', 'parent'],
            function (item) {
              var idprop = item + '_id',
                expandprop = idprop + '_expand';
              if (properties[expandprop]) {
                properties[expandprop].id = properties[idprop];
              }
            });

          properties.reserved = !!properties.reserved_user_id;


          // utils/nodesprites expects mime_type, even if it is null
          // apparently also container is expected as a fallback for folders
          // alternatively fix utils/nodesprites

          // special treatment of children of this.node (current container)
          // these have currently parent_id_expand === null to reduce data load
          if (properties.parent_id && !properties.parent_id_expand) {
            properties.parent_id_expand = {
              id: this.node.get('id'),
              type: this.node.get('type'),
              name: this.node.get('name'),
              openable: this.node.get('openable')
            };
          }
          if( properties.parent_id_expand) {
            properties.parent_id_expand.container = true;
            properties.parent_id_expand.mime_type = properties.parent_id_expand.mime_type || null;
          }

          return properties;
        }
      });
    }
  };

  return AppContainerMixin;
});

csui.define('nuc/models/node.children2/server.adaptor.mixin',[
  'nuc/lib/underscore', 'nuc/utils/url',
  'nuc/models/browsable/v1.request.mixin',
  'nuc/models/browsable/v2.response.mixin',
  'nuc/models/mixins/appcontainer/appcontainer.mixin'
], function (_, Url, BrowsableV1RequestMixin, BrowsableV2ResponseMixin, AppContainerMixin) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      BrowsableV2ResponseMixin.mixin(prototype);
      BrowsableV1RequestMixin.mixin(prototype);
      AppContainerMixin.mixin(prototype);

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          this.useSpecialPaging = options.useSpecialPaging;
          this.makeBrowsableV1Request(options)
              .makeBrowsableV2Response(options)
              .makeAppContainer(options);
          return this;
        },

        url: function () {
          var url;
          var apiUrl = new Url(this.node.connector.connection.url).getApiBase(2);


          var query;
          if (this.useSpecialPaging) {
            // special fast browse paging
            url = Url.combine(apiUrl, 'app/container', this.node.get('id'), 'page');
            // needs less parameters
            var resourceFieldsQuery = { fields: _.without(this.getResourceFieldsUrlQuery().fields, 'properties')};
            query = Url.combineQueryString(
              this.getBrowsableUrlQuery(),
              resourceFieldsQuery
            );
          } else {
            // nodes-based paging
            url = Url.combine(apiUrl, 'nodes', this.node.get('id'), 'nodes');
            query = Url.combineQueryString(
              this.getBrowsableUrlQuery(),
              this.getResourceFieldsUrlQuery(),
              this.getExpandableResourcesUrlQuery(),
              this.getStateEnablingUrlQuery(),
              this.getAdditionalResourcesUrlQuery(),
              this.getRequestedCommandsUrlQuery()
            );
          }

          return Url.appendQuery(url, query);
        },

        parse: function (response, options) {
          if (this.useSpecialPaging) {
            var self = this;
            response.results = response.results.map(function (props) {
              return self.massageResponse(props);
            });
          }

          this.parseBrowsedState(response, options);
          return this.parseBrowsedItems(response, options);
        }
      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('nuc/models/node.children2/node.children2',[
  'module', 'nuc/lib/underscore', 'nuc/lib/backbone',
  'nuc/models/node/node.model',
  'nuc/models/mixins/node.resource/node.resource.mixin',
  'nuc/models/browsable/browsable.mixin',
  'nuc/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'nuc/models/mixins/v2.fields/v2.fields.mixin',
  'nuc/models/mixins/v2.expandable/v2.expandable.mixin',
  'nuc/models/mixins/state.requestor/state.requestor.mixin',
  'nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'nuc/models/node.children2/server.adaptor.mixin',
  'nuc/models/utils/v1tov2', 'nuc/utils/deepClone/deepClone'
], function (module, _, Backbone, NodeModel, NodeResourceMixin,
    BrowsableMixin, AdditionalResourcesV2Mixin, FieldsV2Mixin,
    ExpandableV2Mixin, StateRequestorMixin, DelayedCommandableV2Mixin,
    ServerAdaptorMixin, v1tov2) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30
  });

  var NodeChildren2Collection = Backbone.Collection.extend({
    model: NodeModel,

    constructor: function NodeChildren2Collection(models, options) {
      options = _.defaults({}, options, {
        top: config.defaultPageSize
      }, options);

      Backbone.Collection.prototype.constructor.call(this, models, options);

      this.makeNodeResource(options)
          .makeBrowsable(options)
          .makeAdditionalResourcesV2Mixin(options)
          .makeFieldsV2(options)
          .makeExpandableV2(options)
          .makeStateRequestor(options)
          .makeDelayedCommandableV2(options)
          .makeServerAdaptor(options);
    },

    clone: function () {
      var clone = new this.constructor(this.models, {
        node: this.node,
        skip: this.skipCount,
        top: this.topCount,
        filter: _.deepClone(this.filters),
        orderBy: this.orderBy,
        fields: _.deepClone(this.fields),
        expand: _.deepClone(this.expand),
        includeResources: _.clone(this._additionalResources),
        commands: _.clone(this.commands),
        defaultActionCommands: _.clone(this.defaultActionCommands),
        delayRestCommands: this.delayRestCommands,
        autofetch: this.autofetch,
        autofetchEvent: this._autofetchEvent,
        autoreset: this.autoreset,
        useSpecialPaging: this.useSpecialPaging
      });
      clone.fetched = this.fetched;
      clone.error = this.error;
      clone.actualSkipCount = this.actualSkipCount;
      clone.totalCount = this.totalCount;
      clone.filteredCount = this.filteredCount;
      return clone;
    },

    isFetchable: function () {
      return this.node.isFetchable();
    },

    getResourceScope: function () {
      return _.deepClone({
        fields: this.fields,
        expand: this.expand,
        includeResources: this._additionalResources,
        commands: this.commands,
        defaultActionCommands: this.defaultActionCommands
      });
    },

    setResourceScope: function (scope) {
      this.excludeResources();
      scope.includeResources && this.includeResources(scope.includeResources);
      this.resetFields();
      scope.fields && this.setFields(scope.fields);
      this.resetExpand();
      scope.expand && this.setExpand(scope.expand);
      this.resetCommands();
      scope.commands && this.setCommands(scope.commands);
      this.resetDefaultActionCommands();
      scope.defaultActionCommands && this.setDefaultActionCommands(scope.defaultActionCommands);
    }
  });

  BrowsableMixin.mixin(NodeChildren2Collection.prototype);
  AdditionalResourcesV2Mixin.mixin(NodeChildren2Collection.prototype);
  FieldsV2Mixin.mixin(NodeChildren2Collection.prototype);
  ExpandableV2Mixin.mixin(NodeChildren2Collection.prototype);
  StateRequestorMixin.mixin(NodeChildren2Collection.prototype);
  DelayedCommandableV2Mixin.mixin(NodeChildren2Collection.prototype);
  NodeResourceMixin.mixin(NodeChildren2Collection.prototype);
  ServerAdaptorMixin.mixin(NodeChildren2Collection.prototype);

  // Provide compatibility with v1. Mostly, at least.
  var prototype = NodeChildren2Collection.prototype;

  var makeExpandableV2 = prototype.makeExpandableV2,
      setExpand = prototype.setExpand,
      resetExpand = prototype.resetExpand;
  prototype.makeExpandableV2 = function (options) {
    var expand = options && options.expand;
    if (Array.isArray(expand)) {
      options.expand = v1tov2.includeExpandsV1toV2(expand);
    }
    return makeExpandableV2.call(this, options);
  };

  prototype.setExpand = function (role, names) {
    if (!names) {
      role = v1tov2.includeExpandsV1toV2(role);
    }
    return setExpand.call(this, role, names);
  };

  prototype.resetExpand = function (role, names) {
    if (!names) {
      role = v1tov2.excludeExpandsV1toV2(role);
    }
    return resetExpand.call(this, role, names);
  };

  var makeCommandableV2 = prototype.makeCommandableV2;
  prototype.makeCommandableV2 = function (options) {
    makeCommandableV2.call(this, options);
    this.includeCommands = this.commands;
    return this;
  };

  return NodeChildren2Collection;
});

csui.define('nuc/models/node.ancestors/server.adaptor.mixin',[
  'nuc/lib/underscore', 'nuc/models/ancestor', 'nuc/utils/url'
], function (_, AncestorModel, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        url: function () {
          return Url.combine(this.node.urlBase(), "ancestors");
        },

        parse: function (response, options) {
          // TODO: Currently the breadcrumb parameters are set in the
          // constructor. Should this be moved to public methods like
          // ChildNodeCollection is controlled?  It would enable more
          // flexible usage of the model class and view changes.  The
          // server doesn't allow filtering, ordering or limiting of
          // the ancestor list.

          response = response.ancestors;

          if (this.options.stop) {
            var id = this.options.stop.get ? this.options.stop.get("id") :
              this.options.stop.id;
            var skip;
            response = _
              .filter(response.reverse(), function (ancestor) {
                var result = !skip;
                if (ancestor.id == id) {
                  skip = true;
                }
                return result;
              })
              .reverse();
          }

          if (this.options.limit && response.length > this.options.limit) {
            response.splice(0, response.length - this.options.limit);
            response.unshift({
              type: AncestorModel.Hidden
            });
          }

          // Help DefaultActionBehavior generate a link to open a node from
          // breadcrumb.  Ancestor items are not complete node infos, but
          // they have to be containers and setting {container:true} is enough
          // to render correct link to open the container.
          _.each(response, function (node) {
            node.container = true;
          });

          return response;
        }

      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('nuc/models/nodeancestors',['module', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/utils/url', 'nuc/utils/log', 'nuc/models/ancestor',
  'nuc/models/ancestors', 'nuc/models/mixins/node.resource/node.resource.mixin',
  'nuc/models/node.ancestors/server.adaptor.mixin'
], function (module, _, $, Backbone, Url, log, AncestorModel,
    AncestorCollection, NodeResourceMixin, ServerAdaptorMixin) {
  'use strict';

  var NodeAncestorCollection = AncestorCollection.extend({

    constructor: function NodeAncestorCollection(models, options) {
      AncestorCollection.prototype.constructor.apply(this, arguments);

      this.makeNodeResource(options)
        .makeServerAdaptor(options);

    },

    clone: function () {
      return new this.constructor(this.attributes, {
        connector: this.connector
      });
    },

    isFetchable: function () {
      return this.node.isFetchable();
    }

  });

  NodeResourceMixin.mixin(NodeAncestorCollection.prototype);
  ServerAdaptorMixin.mixin(NodeAncestorCollection.prototype);

  return NodeAncestorCollection;

});

csui.define('nuc/models/impl/nls/lang',{
  // Always load the root bundle for the default locale (en-us)
  "root": true,
  // Do not load English locale bundle provided by the root bundle
  "en-us": false,
  "en": false
});

csui.define('nuc/models/impl/nls/root/lang',{
  name: "Name",
  type: "Type",
  version: "Version",
  state: "State",
  favorite: "Favorite",
  toggleDetails: "Toggle Details",
  parentID: "Parent ID"
});


csui.define('nuc/models/nodechildrencolumn',['module', 'nuc/lib/backbone', 'nuc/utils/log',
  'i18n!nuc/models/impl/nls/lang'
], function (module, Backbone, log, lang) {
  'use strict';

  //
  // Column model from the node children call (nodes/{id}/nodes)
  //
  var NodeChildrenColumnModel = Backbone.Model.extend({

    constructor: function NodeChildrenColumnModel(attributes, options) {
      if (attributes && !attributes.title) {
        var titleTranslated = lang[attributes.column_key];
        if (titleTranslated !== undefined) {
          attributes.title = titleTranslated;
        }
      }
      Backbone.Model.prototype.constructor.call(this, attributes, options);
    },

    idAttribute: null

  });

  return NodeChildrenColumnModel;

});

csui.define('nuc/models/nodechildrencolumns',["module", "nuc/lib/underscore", "nuc/lib/backbone",
  "nuc/utils/log", "nuc/models/nodechildrencolumn"
], function (module, _, Backbone,
             log, NodeChildrenColumnModel) {
  "use strict";

  //
  // Column model collection from the node children call (nodes/{id}/nodes) and other browse calls
  //
  var NodeChildrenColumnCollection = Backbone.Collection.extend({

    model: NodeChildrenColumnModel,

    constructor: function NodeChildrenColumnCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.fetched = false;
    },

    // private: reset the collection.  For performance purpose and prevent UI table redraw, this
    //          method will not reset if the models is the same as the cached one.
    resetCollection: function (models, options) {
      if (this.cachedColumns && _.isEqual(models, this.cachedColumns)) {
        return;
      }
      // Make a clone of the model array for the cache to let it be equal even if attributes are
      // added to objects of the array (which is done in this.reset where the constructor of the
      // NodeChildrenColumnModel adds a translated title attribute
      this.cachedColumns = _.map(models, function (model) {
        return _.clone(model);
      });

      this.reset(models, options);
      this.fetched = true;
    },

    // private
    getColumnModels: function (columnKeys, definitions) {
      var columns = _.reduce(columnKeys, function (colArray, column) {
        if (column.indexOf('_formatted') >= 0) {
          var shortColumnName = column.replace(/_formatted$/, '');
          if (definitions[shortColumnName]) {
            // there is also the column without the trailing _formatted: skip this and use this
            // instead
            return colArray;
          }
        } else {
          // copy the definitions_order from the *_formatted column to the non-formatted column
          var definition_short = definitions[column];
          if (definition_short && !definition_short.definitions_order) {
            var definition_formatted = definitions[column + '_formatted'];
            if (definition_formatted && definition_formatted.definitions_order) {
              definition_short.definitions_order = definition_formatted.definitions_order;
            }
          }
        }
        var definition = definitions[column];

        // Code from old code to keep node table code working.  Will look more into this after June.
        // TODO: support these attributes on the server too.
        switch (column) {
          case "name":
            definition = _.extend(definition, {
              default_action: true,
              contextual_menu: false,
              editable: true,
              filter_key: "name"
            });
            break;
          case "type":
            definition = _.extend(definition, {
              default_action: true
            });
            break;
          case "modify_date":
            definition = _.extend(definition, {
              initialSortingDescending: true
            });
            break;
        }

        colArray.push(_.extend({column_key: column}, definition));
        return colArray;
      }, []);
      return columns;
    },

    //
    // methods for REST API V1
    //

    // public
    resetColumns: function (response, options) {
      this.resetCollection(this.getV1Columns(response, options), options);
    },

    // private
    getV1Columns: function (response, options) {
      var definitions = response.definitions,
        columnKeys = options && options.columnsFromDefinitionsOrder ?
          response.definitions_order : _.keys(definitions);

      // merge definitions_order into definitions as definitions_order attribute
      if (response.definitions_order) {
        for (var idx = 0; idx < response.definitions_order.length; idx++) {
          var column_key = response.definitions_order[idx],
              definition = definitions[column_key];
          // definitions_order can be passed via options and does not need
          // to match with the server response; guard against mismatches
          if (definition) {
            definition.definitions_order = 500 + idx;
          }
        }
      }

      return this.getColumnModels(columnKeys, definitions);
    },

    //
    // methods for REST API V2
    //

    // public
    resetColumnsV2: function (response, options) {
      this.resetCollection(this.getV2Columns(response), options);
    },

    // private: convert v2 'metadata' to v1 'definitions' for backward code compatibility and
    //          reuse purpose
    getV2Columns: function (response) {

      // Note: from a long discussion with the server developer, use the common 'metadata' (or
      // called 'definitions' in v1) in the first element. Elements in the collection can have
      // different extended metadata (definitions).  If a business case arises that
      // extended definitions are needed, will discuss again with them and add that support.

      var definitions = (response.results &&
        response.results[0] &&
        response.results[0].metadata &&
        response.results[0].metadata.properties) || {};

      // For v2 calls, the 'size' column is not available.  Either the 'container_size' or
      // 'file_size' is available.  Create a 'size' definition here for compatibility with existing
      // code.
      if (!definitions.size &&
        (definitions.container_size ||
        (definitions.versions && definitions.versions.file_size))) {
        definitions.size = definitions.container_size || definitions.versions.file_size;
        definitions.size.align = 'right';
        definitions.size.key = 'size';
        definitions.size.name = 'Size';
      }

      var columnKeys = _.keys(definitions);

      return this.getColumnModels(columnKeys, definitions);
    }

  });
  NodeChildrenColumnCollection.version = '1.0';

  return NodeChildrenColumnCollection;

});

/**
 * @export
 */
csui.define('nuc/models/nodes',["module", "nuc/lib/backbone", 'nuc/models/node/node.model', "nuc/utils/log",
  'nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin'
], function (module, Backbone, NodeModel, log, DelayedCommandableV2Mixin) {

  /**
   * @class NodeCollection
   * @extends Backbone.Collection
   * @mixes DelayedCommandableV2Mixin
   */
  var Nodes = Backbone.Collection.extend(/** @lends NodeCollection.prototype */{

    /**
     * @member
     * @type NodeModel
     */
    model: NodeModel,

    /**
     * @constructs
     * @param models
     * @param options
     */
    constructor: function Nodes(models,options) {
      options || (options = {});
      Backbone.Collection.prototype.constructor.apply(this, arguments);
      this.makeDelayedCommandableV2(options);
    },

    /**
     * @function
     * @param enable
     */
    automateFetch: function (enable) {
    }

  });
  DelayedCommandableV2Mixin.mixin(Nodes.prototype);
  Nodes.version = '1.0';

  return Nodes;

});

csui.define('nuc/models/mixins/commandable/commandable.mixin',['nuc/lib/underscore'], function (_) {
  'use strict';

  /**
   * @class CommandableV1Mixin
   * @mixin
   * @type {{mixin: (function(*=): *)}}
   * @description Provides support for the setting `commands` URL query parameter as introduced
   by the `api/v1/nodes/:id/nodes` (V1) resource.

   Server responses can contain *permitted actions* to be able to support
   enabling and disabling in the corresponding UI; how many and which ones
   should be checked by the server can be specified.

   ### How to apply the mixin to a model

   ```
   var MyModel = Backbone.Model.extend({

  constructor: function MyModel(attributes, options) {
    Backbone.Model.prototype.constructor.apply(this, arguments);
    this
      .makeConnectable(options)
      .makeCommandable(options);
  },

  url: function () {
    var url = Url.combine(this.connector.connection.url, 'myresource'),
        query = Url.combineQueryString(
          this.getRequestedCommandsUrlQuery()
        );
    return query ? url + '?' + query : url;
  }

});

   ConnectableMixin.mixin(MyModel.prototype);
   CommandableMixin.mixin(MyModel.prototype);
   ```

   This mixin us usually combined together with the `ConnectableMixin`
   or with another cumulated mixin which includes it.

   ### How to use the mixin

   Set up the URL parameters by calling `setCommands` and `resetCommands` and fetch the model:

   ```
   // Set the commands for requesting when creating the model
   var model = new MyModel(undefined, {
      connector: connector,
      commands: ['delete', 'reserve']
    });
   model.fetch();

   // Set the commands for requesting after creating the model
   model.setCommands(['delete', 'reserve']);
   model.fetch();
   ```
   */
  var CommandableV1Mixin = {

    mixin: function (prototype) {
      return _.extend(prototype, /** @lends CommandableV1Mixin.prototype */ {

        /**
         * @function
         * @param options
         * @returns {CommandableV1Mixin}
         * @description Must be called in the constructor to initialize the mixin functionality.
         Expects the Backbone.Model or Backbone.Collection constructor options passed in.

         Recognized option properties:

         commands
         : One or more command signatures to be requested for being checked.  The value
         is handled the same way as the `setCommands` method does it.  An empty array
         is the default.

         ## commands

         Command signatures to be requested for being checked (array of strings, empty
         by default, read-only).

         */
        makeCommandable: function (options) {
          var commands = options && options.commands;
          if (typeof commands === 'string') {
            commands = commands.split(',');
          }
          this.includeCommands = commands || [];
          return this;
        },

        /**
         * @function
         * @param name
         * @description Asks for one or more commands to be checked.  The `names` parameter can be
         either string, or an array of strings.  The string can contain a comma-delimited
         list, in which case it will be split to an array.

 ```
 // Have two commands checked, option 1
 model.setCommands(['delete', 'reserve']);
 // Have two commands checked, option 2
 model.setCommands('delete');
 model.setCommands('reserve');
 // Have two commands checked, option 3
 model.setCommands('delete,reserve');
 ```
         */
        setCommands: function (name) {
          if (!_.isArray(name)) {
            name = name.split(",");
          }
          _.each(name, function (name) {
            if (!_.contains(this.includeCommands, name)) {
              this.includeCommands.push(name);
            }
          }, this);
        },

        /**
         * @function
         * @param names
         * @description Prevents one or more commands from being checked.  The `names` parameter can be either
         string, or an array of strings, or nothing.  The string can contain a comma-delimited list,
         in which case it will be split to an array.  If nothing is specified, all commands will
         be removed (not to be checked).

 ```
 // Cancel all command checks and fetch the fresh data
 model.resetCommands();
 model.fetch();
 ```
         */
        resetCommands: function (name) {
          if (name) {
            if (!_.isArray(name)) {
              name = name.split(",");
            }
            _.each(name, function (name) {
              var index = _.indexOf(this.includeCommands, name);
              if (index >= 0) {
                this.includeCommands.splice(index, 1);
              }
            }, this);
          } else {
            this.includeCommands.splice(0, this.includeCommands.length);
          }
        },

        /**
         * @function
         * @returns {*|{commands: ({length}|*|Array)}}
         * @description Formats the URL query parameters for the command investigation.  They can be concatenated
         with other URL query parts (both object literals and strings) by `Url.combineQueryString`.

```
var url = ...,
query = Url.combineQueryString(
...,
this.getRequestedCommandsUrlQuery()
);
if (query) {
  url = Url.appendQuery(url, query);
}
         ```
         */
        getRequestedCommandsUrlQuery: function () {
          return this.includeCommands.length && {commands: this.includeCommands};
        }

      });
    }

  };

  return CommandableV1Mixin;

});

csui.define('nuc/models/mixins/delayed.commandable/delayed.commandable.mixin',[
  'nuc/lib/underscore', 'nuc/lib/backbone', 'nuc/models/node.actions',
  'nuc/models/mixins/commandable/commandable.mixin',
  'nuc/utils/deepClone/deepClone'
], function (_, Backbone, NodeActionCollection, CommandableMixin) {
  'use strict';

  var DelayedCommandableMixin = {

    mixin: function (prototype) {
      CommandableMixin.mixin(prototype);

      var originalPrepareModel = prototype._prepareModel;

      return _.extend(prototype, {

        makeDelayedCommandable: function (options) {
          options || (options = {});
          var defaultActionCommands = options.defaultActionCommands;
          if (typeof defaultActionCommands === 'string') {
            defaultActionCommands = defaultActionCommands.split(',');
          }
          this.defaultActionCommands = defaultActionCommands || [];

          this.delayedActions = new NodeActionCollection(undefined, {
            connector: options.connector
          });

          this.delayRestCommands = options.delayRestCommands;
          if (this.delayRestCommands) {
            this.on('sync', this._requestRestActions);
          }

          this.delayRestCommandsForModels = options.delayRestCommandsForModels;

          return this.makeCommandable(options);
        },

        _requestRestActions: function (model) {
          // Guard against propagated sync event: if this mixin has been
          // applied to a collection, only fetch of the collection should
          // be handled here; fetching of models should not re-fetch actions
          // for the whole collection.
          // Also do nothing if the collection is empty.
          if (model !== this ||
              this instanceof Backbone.Collection && !this.length) {
            return;
          }
          var defaultActionCommands = this.defaultActionCommands,
              restCommands = _.reject(this.includeCommands, function (command) {
                return _.contains(defaultActionCommands, command);
              });
          if (restCommands.length) {
            var delayedActions = this.delayedActions;
            delayedActions.resetCommands();
            delayedActions.setCommands(restCommands);
            delayedActions.resetNodes();
            if (this instanceof Backbone.Collection) {
              delayedActions.setNodes(this.pluck('id'));
            } else {
              delayedActions.setNodes([this.get('id')]);
            }
            if (!delayedActions.connector) {
              this.connector.assignTo(delayedActions);
            }
            delayedActions.parent_id = !!this.node ? this.node.get("id") : this.get("id");
            delayedActions
                .fetch({
                  reset: true,
                  // Update the actions as soon as possible; event
                  // and promise can be watched by someone else
                  success: _.bind(this._updateOriginalActions, this)
                });
          }
        },

        _updateOriginalActions: function () {
          var delayedActions = this.delayedActions;

          function updateNodeActions(node) {
            var actionNode = delayedActions.get(node.get('id'));
            if (actionNode) {
              node.actions.add(actionNode.actions.models);
            }
          }

          if (this instanceof Backbone.Collection) {
            this.each(updateNodeActions);
          } else {
            updateNodeActions(this);
          }
        },

        setDefaultActionCommands: function (name) {
          if (!_.isArray(name)) {
            name = name.split(',');
          }
          _.each(name, function (name) {
            if (!_.contains(this.defaultActionCommands, name)) {
              this.defaultActionCommands.push(name);
            }
          }, this);
        },

        resetDefaultActionCommands: function (name) {
          if (name) {
            if (!_.isArray(name)) {
              name = name.split(',');
            }
            _.each(name, function (name) {
              var index = _.indexOf(this.defaultActionCommands, name);
              if (index >= 0) {
                this.defaultActionCommands.splice(index, 1);
              }
            }, this);
          } else {
            this.defaultActionCommands.splice(0, this.defaultActionCommands.length);
          }
        },

        getRequestedCommandsUrlQuery: function () {
          var commands = this.delayRestCommands ?
                         this.defaultActionCommands : this.includeCommands;
          return commands.length && {commands: commands};
        },

        getAllCommandsUrlQuery: function () {
          var commands = this.includeCommands;
          return commands.length && {commands: commands};
        },

        // Stop the delayed action enabling for child models and collections.
        // If they want it, they can do so in the constructors, which creates
        // them. Immediate child models of this collection can be enabled by
        // the delayRestCommandsForModels option.
        _prepareModel: function (attrs, options) {
          var delayRestCommands, delayRestCommandsForModels;
          options || (options = {});
          // If the collection is populated after the constructor has
          // finished, we can use parameters passed to the constructor
          // as defaults, if the population options are empty.
          if (this.delayedActions) {
            delayRestCommands = options.delayRestCommands;
            if (delayRestCommands === undefined) {
              delayRestCommands = this.delayRestCommands;
            }
            delayRestCommandsForModels = options.delayRestCommandsForModels;
            if (delayRestCommandsForModels === undefined) {
              delayRestCommandsForModels = this.delayRestCommandsForModels;
            }
          } else {
            delayRestCommands = options.delayRestCommands;
            delayRestCommandsForModels = options.delayRestCommandsForModels;
          }
          options.delayRestCommands = delayRestCommandsForModels;
          options.delayRestCommandsForModels = false;
          var model = originalPrepareModel.call(this, attrs, options);
          options.delayRestCommands = delayRestCommands;
          options.delayRestCommandsForModels = delayRestCommandsForModels;
          return model;
        }

      });
    }

  };

  return DelayedCommandableMixin;

});

csui.define('nuc/models/browsable/v1.response.mixin',['nuc/lib/underscore'
], function (_) {

  var BrowsableV1ResponseMixin = {

    mixin: function (prototype) {
      return _.extend(prototype, {

        makeBrowsableV1Response: function (options) {
          return this;
        },

        parseBrowsedState: function (response, options) {
          // FIXME: Confirm sorting and filtering parameters too.
          if (response.page) {
            this.actualSkipCount = (response.page - 1) * (response.limit || 0);
          }
          var totalCount = response.total_count ? response.total_count : 0;
          this.totalCount = totalCount;
          this.filteredCount = response.filtered_count || totalCount;
        },

        parseBrowsedItems: function (response, options) {
          return response.data;
        }

      });
    }

  };

  return BrowsableV1ResponseMixin;

});

csui.define('nuc/models/node.children/server.adaptor.mixin',[
  'nuc/lib/underscore', 'nuc/utils/url',
  'nuc/models/browsable/v1.request.mixin',
  'nuc/models/browsable/v1.response.mixin'
], function (_, Url, BrowsableV1RequestMixin, BrowsableV1ResponseMixin) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      BrowsableV1ResponseMixin.mixin(prototype);
      BrowsableV1RequestMixin.mixin(prototype);

      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          this.makeBrowsableV1Request(options)
              .makeBrowsableV1Response(options);
          return this;
        },

        url: function () {
          var includeActions = !!this.includeActions,
              query = Url.combineQueryString({
                // Do not request the v1 actions, which are sent by default
                extra: includeActions,
                actions: includeActions
              },
              this.getBrowsableUrlQuery(),
              this.getExpandableResourcesUrlQuery(),
              this.getRequestedCommandsUrlQuery()
          );
          return Url.combine(this.node.urlBase(),
              query ? '/nodes?' + query : '/nodes');
        },

        // TODO: Remove this method and make the cache layer aware of node URLs.
        urlCacheBase: function(){
          return Url.combine(this.node.urlBase(),'/nodes?');
        },

        parse: function (response, options) {
          this.parseBrowsedState(response, options);
          this.columns && this.columns.resetColumns(response, this.options);
          return this.parseBrowsedItems(response, options);
        }
      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('nuc/models/nodechildren',[
  'module', 'nuc/lib/jquery', 'nuc/lib/underscore', 'nuc/lib/backbone',
  'nuc/utils/url', 'nuc/models/node/node.model', 'nuc/models/nodes',
  'nuc/models/nodechildrencolumns',
  'nuc/models/mixins/node.resource/node.resource.mixin',
  'nuc/models/mixins/expandable/expandable.mixin',
  'nuc/models/browsable/browsable.mixin',
  'nuc/models/mixins/delayed.commandable/delayed.commandable.mixin',
  'nuc/models/node.children/server.adaptor.mixin',
  'nuc/utils/log', 'nuc/utils/deepClone/deepClone'
], function (module, $, _, Backbone, Url, NodeModel, NodeCollection,
    NodeChildrenColumnCollection, NodeResourceMixin, ExpandableMixin,
    BrowsableMixin, DelayedCommandableMixin, ServerAdaptorMixin, log) {
  'use strict';

  var config = module.config();
  _.defaults(config, {
    defaultPageSize: 30
  });

  log = log(module.id);

  /**
   * @class NodeChildrenCollection
   * @augments NodeCollection
   * @param models
   * @param options
   * @mixes BrowsableMixin
   * @mixes ExpandableMixin
   * @mixes DelayedCommandableMixin
   * @mixes ServerAdaptorMixin
   * @mixes NodeResourceMixin
   *


   */
  var NodeChildrenCollection = NodeCollection.extend(/** @lends NodeChildrenCollection.prototype */{


    constructor: function NodeChildrenCollection(models, options) {
      options = _.defaults({}, options, {
        top: config.defaultPageSize,
        columnsFromDefinitionsOrder: false
      }, options);

      NodeCollection.prototype.constructor.call(this, models, options);

      this.makeNodeResource(options)
          .makeExpandable(options)
          .makeDelayedCommandable(options)
          .makeBrowsable(options)
          .makeServerAdaptor(options);

      this.options = options;
      this.includeActions = options.includeActions;
      this.columns = new NodeChildrenColumnCollection();
    },

    /**
     * @function
     * @returns {NodeChildrenCollection}
     */
    clone: function () {
      return new this.constructor(this.models, {
        node: this.node,
        skip: this.skipCount,
        top: this.topCount,
        filter: _.deepClone(this.filters),
        orderBy: this.orderBy,
        expand: _.clone(this.expand),
        includeActions: this.includeActions,
        commands: _.clone(this.includeCommands),
        defaultActionCommands: _.clone(this.defaultActionCommands),
        delayRestCommands: this.delayRestCommands
      });
    },

    /**
     * @function
     * @returns boolean
     */
    isFetchable: function () {
      return this.node.isFetchable();
    }
  });

  BrowsableMixin.mixin(NodeChildrenCollection.prototype);
  ExpandableMixin.mixin(NodeChildrenCollection.prototype);
  DelayedCommandableMixin.mixin(NodeChildrenCollection.prototype);
  ServerAdaptorMixin.mixin(NodeChildrenCollection.prototype);
  NodeResourceMixin.mixin(NodeChildrenCollection.prototype);

  // TODO: Remove this, as soon as all abandoned this.Fetchable.
  var originalFetch = NodeChildrenCollection.prototype.fetch;
  NodeChildrenCollection.prototype.Fetchable = {
    fetch: function (options) {
      // log.warn('Using this.Fetchable.fetch has been deprecated.  ' +
      //          'Use NodeChildrenCollection.prototype.fetch. ' +
      //          'this.Fetchable is going to be removed.') && console.warn(log.last);
      // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
      return originalFetch.call(this, options);
    }
  };

  return NodeChildrenCollection;
});

csui.define('nuc/models/tool.item.config/tool.item.config.collection',[
  'module', 'require', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/backbone'
], function (module, require, _, $, Backbone) {
  'use strict';

  var configs = module.config().configs || [];
  // Support either array of module IDs or a map with keys pointing
  // to arrays of module IDs; the latter can be used for decentralized
  // configuration (multiple calls to require.config, which merge maps,
  // but not arrays)
  if (!Array.isArray(configs)) {
    configs = Object
        .keys(configs)
        .reduce(function (result, key) {
          return result.concat(configs[key]);
        }, []);
  }
  // Convert the array of tool item config module names to model attributes
  configs = configs.map(function (name) {
    return {
      id: name
    };
  });

  var ToolItemConfigCollection = Backbone.Collection.extend({

    constructor: function ToolItemConfigCollection(models, options) {
      models || (models = configs);
      Backbone.Collection.prototype.constructor.call(this, models, options);
     },

    sync: function (method, collection, options) {
      if (method !== 'read') {
        throw new Error('Only fetching tool item configurations is supported.');
      }
      var self = this;
      options = _.extend({}, this.options, options);
      return this._resolveConfigs(options)
                 .then(function () {
                   var response = self.toJSON();
                   options.success && options.success(response, options);
                   self.trigger('sync', self, response, options);
                 });
    },

    _resolveConfigs: function (options) {
      var modules = this.chain()
                        .filter(function (model) {
                          // A resolvable config must have an ID
                          // and not be already resolved
                          return model.has('id') &&
                                 !(model.has('config') ||
                                   model.has('error'));
                        })
                        .pluck('id')
                        .value(),
          deferred = $.Deferred(),
          self = this;
      if (modules.length) {
        require(modules, function () {
          var configs = arguments;
          modules.forEach(function (module, index) {
            var model = self.get(module);
            model.set('config', configs[index]);
          });
          deferred.resolve();
        }, function (error) {
          self.forEach(function (module) {
            module.set('error', error);
          });
          if (options.ignoreErrors) {
            deferred.resolve();
          } else {
            deferred.reject(error);
          }
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    }

  });

  return ToolItemConfigCollection;

});

csui.define('nuc/models/tool.item.mask/tool.item.mask.collection',[
  'module', 'require', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/backbone'
], function (module, require, _, $, Backbone) {
  'use strict';

  var masks = module.config().masks || [];
  // Support either array of module IDs or a map with keys pointing
  // to arrays of module IDs; the latter can be used for decentralized
  // configuration (multiple calls to require.config, which merge maps,
  // but not arrays)
  if (!Array.isArray(masks)) {
    masks = Object
        .keys(masks)
        .reduce(function (result, key) {
          return result.concat(masks[key]);
        }, []);
  }
  // Convert the array of tool item mask module names to model attributes
  masks = masks.map(function (name) {
    return {
      id: name
    };
  });

  var ToolItemMaskCollection = Backbone.Collection.extend({

    constructor: function ToolItemMaskCollection(models, options) {
      models || (models = masks);
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    sync: function (method, collection, options) {
      if (method !== 'read') {
        throw new Error('Only fetching tool item masks is supported.');
      }
      var self = this;
      options = _.extend({}, this.options, options);
      return this._resolveMasks(options)
                 .then(function () {
                   var response = self.toJSON();
                   options.success && options.success(response, options);
                   self.trigger('sync', self, response, options);
                 });
    },

    _resolveMasks: function (options) {
      var modules = this.chain()
                        .filter(function (model) {
                          // A resolvable mask must have an ID
                          // and not be already resolved
                          return model.has('id') &&
                                 !(model.has('mask') ||
                                   model.has('error'));
                        })
                        .pluck('id')
                        .value(),
          deferred = $.Deferred(),
          self = this;
      if (modules.length) {
        require(modules, function () {
          var masks = arguments;
          modules.forEach(function (module, index) {
            var model = self.get(module);
            model.set('mask', masks[index]);
          });
          deferred.resolve();
        }, function (error) {
          self.forEach(function (module) {
            module.set('error', error);
          });
          if (options.ignoreErrors) {
            deferred.resolve();
          } else {
            deferred.reject(error);
          }
        });
      } else {
        deferred.resolve();
      }
      return deferred.promise();
    }

  });

  return ToolItemMaskCollection;

});

csui.define('nuc/models/browsable/client-side.mixin',[
  'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone', 'nuc/utils/base',
  'nuc/models/browsable/browsable.mixin'
], function (_, $, Backbone, base, BrowsableMixin) {

  var ClientSideBrowsableMixin = {

    mixin: function (prototype) {
      BrowsableMixin.mixin(prototype);

      var originalFetch = prototype.fetch;

      return _.extend(prototype, {

        makeClientSideBrowsable: function (options) {
          this.listenTo(this, 'add', this._modelAdded)
              .listenTo(this, 'remove', this._modelRemoved)
              .listenTo(this, 'reset', this._modelsReset);

          if (!this.allModels) {
            this.allModels = [];
          }
          this._filling = 0;

          return this.makeBrowsable(options);
        },

        setOrderOnRequest: function (arg) {
          this.orderOnRequest = arg;
        },

        getBrowsableUrlQuery: function () {
          var query = {};

          if (this.orderBy && this.orderOnRequest) {
            var first = this.orderBy.split(',')[0].split(' ');
            query.sort = (first[1] || 'asc') + '_' + first[0];
          }
          return $.param(query);
        },

        fetch: function (options) {
          options = options ? _.clone(options) : {};
          _.defaults(options, {skipSort: this.orderOnRequest});

          var self = this;
          var partialResponse;
          if (!options.reload && this.lastFilteredAndSortedModels !== undefined) {
            this.trigger('request', this, {}, options);
            // Make the rest of the client side fetch async to behave like real ajax call
            var deferred = $.Deferred();
            setTimeout(function () {
              partialResponse = self._fill(options);
              self._notify(partialResponse, options);
              deferred.resolve(partialResponse);
            }, 0);
            return deferred.promise();
          }

          var originalSilent = options.silent,
              originalReset  = options.reset;
          options.silent = true;
          options.reset = true;

          var originalSuccess = options.success,
              originalError   = options.error;
          options.success = function (collection, response, options) {
            self.allModels = _.clone(self.models);
            var originalParse = options.parse;
            options.parse = false;
            self.reset([], options);
            if (originalSilent !== undefined) {
              options.silent = originalSilent;
            } else {
              delete options.silent;
            }
            if (originalReset !== undefined) {
              options.reset = originalReset;
            } else {
              delete options.reset;
            }
            partialResponse = self._fill(options);
            --self._filling;
            if (originalParse !== undefined) {
              options.parse = originalParse;
            } else {
              delete options.parse;
            }
            options.success = originalSuccess;
            if (originalSuccess) {
              originalSuccess.call(options.context, collection, response, options);
            }
          };
          options.error = function (collection, response, options) {
            --self._filling;
            if (originalError) {
              originalError.call(options.context, collection, response, options);
            }
          };

          ++this._filling;
          this.lastFilteredAndSortedModels = undefined;
          this._lastFilterAndSortCriteria = undefined;
          var pr = originalFetch.call(this, options).then(function () {
            return partialResponse;
          });
          return pr;
        },

        populate: function (models, options) {
          options = _.extend({parse: true}, options);
          var originalSilent = options.silent,
              originalReset  = options.reset;
          options.silent = true;
          options.reset = true;
          options.skipSort = this.orderOnRequest;

          ++this._filling;

          this.lastFilteredAndSortedModels = [];
          this._lastFilterAndSortCriteria = undefined;
          // Reset the filtering, sorting and paging parameters
          this.skipCount = 0;
          // this.topCount = 0;
          this.filters = {};
          this.orderBy = undefined;
          this.sorting && !this.sorting.links && (this.sorting = undefined);
          this.reset(models, options);
          this.allModels = _.clone(this.models);
          var originalParse = options.parse;
          options.parse = false;
          this.reset([], options);
          this.trigger('request', this, {}, options);
          options.silent = originalSilent;
          if (this.allModels.length === 0) {
            options.reset = true;
          } else {
            options.reset = originalReset;
          }
          var deferred = $.Deferred();
          var self = this;
          setTimeout(function () {
            self.fetched = true; // this prevents the table from doing a collection.fetch
            var partialResponse = self._fill(options);
            --self._filling;
            options.parse = originalParse;
            self._notify(partialResponse, options);
            deferred.resolve(partialResponse);
          });
          return deferred.promise();
        },

        // Set the allModels without doing a fetch or reset
        setAllModels: function (models) {
          // make the collection empty
          var options = {};
          options.parse = false;
          var topCount = this.topCount;
          this.reset([], options);
          this.topCount = topCount; // topCount gets lost in reset...

          this.allModels = _.clone(models);
          this.totalCount = this.allModels.length;
          // Mark this collection as "fetched" the actual content will be
          // populated first, when it is needed for the fetch method
          this.lastFilteredAndSortedModels = [];
          this._lastFilterAndSortCriteria = undefined;
          // Reset the filtering, sorting and paging parameters
          this.skipCount = 0;
          // this.topCount = 0;
          this.filters = {};
          this.orderBy = undefined;
          this.sorting && !this.sorting.links && (this.sorting = undefined);
        },

        compareObjectsForSort: function (property, left, right) {
          left = this._parseValue(property, left.get(property));
          right = this._parseValue(property, right.get(property));
          return this._compareValues(property, left, right);
        },

        _fill: function (options) {
          var filterAndSortCriteria = {
                orderBy: this.orderBy,
                filters: _.clone(this.filters)
              },
              models;
          if (this._lastFilterAndSortCriteria &&
              _.isEqual(this._lastFilterAndSortCriteria, filterAndSortCriteria)) {
            models = this.lastFilteredAndSortedModels;
          } else {
            models = _.clone(this.allModels);
            models = this._filter(models);
            this.sorting && !this.sorting.links && (this.sorting = undefined);
            if (!options.skipSort) {
              models = this._sort(models);
              if (this.orderBy && this.sorting === undefined) {
                var orderBy = this.orderBy.split(' ');
                this.sorting = {sort: []};
                this.sorting.sort.push({key: 'sort', value: ((orderBy[1] || 'asc') + '_' + orderBy[0])});
              }
            }

            this.lastFilteredAndSortedModels = models;
            this._lastFilterAndSortCriteria = filterAndSortCriteria;
          }
          this.totalCount = this.allModels.length;
          this.filteredCount = models.length;
          models = this._limit(models);

          var reset = options.reset;
          if (reset === undefined) {
            reset = this.autoreset;
          }
          var method = reset ? 'reset' : 'set';
          // Prevent the 'add' and 'reset' event handlers triggered by
          // filling models from allModels here modify allModels again
          ++this._filling;
          this[method](models, options);
          --this._filling;

          return models;
        },

        _notify: function (response, options) {
          if (options.success) {
            options.success.call(options.context, this, response, options);
          }
          this.trigger('sync', this, response, options);
        },

        _limit: function (models) {
          if (this.skipCount) {
            this.actualSkipCount = Math.min(this.skipCount, models.length);
            models = models.slice(this.skipCount);
          } else {
            this.actualSkipCount = 0;
          }
          if (this.topCount) {
            models = models.slice(0, this.topCount);
          }
          return models;
        },

        _sort: function (models) {
          var self = this;
          if (this.orderBy) {
            var criteria = _.map(this.orderBy.split(','), function (criterion) {
              var parts = criterion.trim().split(' ');
              return {
                property: parts[0],
                descending: parts[1] === 'desc'
              };
            });

            models = models.sort(function (left, right) {
              var result = 0;
              _.find(criteria, function (criterion) {
                result = self.compareObjectsForSort(criterion.property, left, right);
                if (result) {
                  if (criterion.descending) {
                    result *= -1;
                  }
                  return true;
                }
              });
              return result;
            });
          }
          return models;
        },

        _filter: function (models) {
          var self = this;
          for (var name in this.filters) {
            if (_.has(this.filters, name)) {
              var values = this.filters[name];
              if (values != null && values !== '') {
                _.isArray(values) || (values = [values]);
                models = _.filter(models, function (node) {
                  var hay = self._parseValue(name, node.get(name));
                  return _.any(values, function (value) {
                    var needle = self._parseValue(name, value);
                    if (name === 'type' && needle == -1) {
                      return node.get('container');
                    }
                    return self._containsValue(name, hay, needle);
                  });
                });
              }
            }
          }
          return models;
        },

        _modelAdded: function (model, collection, options) {
          if (this._populate(options)) {
            this.allModels.push(model);
            ++this.totalCount;
            this._lastFilterAndSortCriteria = undefined;
          }
        },

        _modelRemoved: function (model, collection, options) {
          if (this._populate(options)) {
            var index = _.findIndex(this.allModels, model);
            if (index >= 0) {
              this.allModels.splice(index, 1);
              --this.totalCount;
              this._lastFilterAndSortCriteria = undefined;
            }
          }
        },

        _modelsReset: function (collection, options) {
          if (this._populate(options)) {
            this.allModels = _.clone(this.models);
            this.totalCount = this.allModels.length;
            // Mark this collection as "fetched" the actual content will be
            // populated first, when it is needed for the fetch method
            this.lastFilteredAndSortedModels = [];
            this._lastFilterAndSortCriteria = undefined;
            // Reset the filtering, sorting and paging parameters
            this.skipCount = this.topCount = 0;
            this.filters = {};
            this.orderBy = undefined;
            this.sorting && !this.sorting.links && (this.sorting = undefined);
          }
        },

        _populate: function (options) {
          return !(this._filling || options && options.populate === false);
        },

        _compareValues: function (property, left, right) {
          //STRING Comparision.
          if (typeof left === 'string' && typeof right === 'string') {
            // FIXME: Implement the locale-specific comparison only for localizable strings;
            // not for values with internal system constants, which can be case-sensitive
            return base.localeCompareString(left, right, {usage: 'sort'});
          } else if (_.isArray(left) || _.isArray(right)) { //ARRAY Comparision.
            if (!_.isArray(left)) {
              left = [left];
            } else if (!_.isArray(right)) {
              right = [right];
            }
            return this._compareArrays(left, right);
          }
          return this._compareObjects(left, right); //OBJECT Comparision.
        },

        _compareObjects: function (left, right) {
          if (left != right) {
            if (left > right || right === void 0) {
              return 1;
            }
            if (left < right || left === void 0) {
              return -1;
            }
          }
          return 0;
        },

        _compareArrays: function (left, right) {
          var result = 0,
              len    = Math.min(left.length, right.length),
              i      = 0;
          while (i <= len) {
            if (i === left.length && i === right.length) {
              result = 0;
              break;
            } else if (i === left.length) {
              result = -1;
              break;
            } else if (i === right.length) {
              result = 1;
              break;
            } else {
              if (typeof left[i] === 'string' && typeof right[i] === 'string') {
                result = base.localeCompareString(left[i], right[i], {usage: 'sort'});
              } else {
                result = this._compareObjects(left[i], right[i]);
              }
              if (result !== 0) {
                break;
              }
            }
            i++;
          }
          return result;
        },

        _containsValue: function (property, hay, needle) {
          if (typeof hay === 'string' && typeof needle === 'string') {
            // FIXME: Implement the locale-specific comparison only for localizable strings;
            // not for values with internal system constants, which can be case-sensitive
            return base.localeContainsString(hay, needle.toString());
          } else if (_.isArray(hay) && typeof needle === 'string') {
            return _.some(hay, function (blade) {
              if (typeof blade === 'string') {
                return base.localeContainsString(blade, needle.toString());
              } else {
                return blade == needle;
              }
            });
          }

          return hay == needle;
        },

        // FIXME: Use metadata to get the correct value type for parsing
        _parseValue: function (property, value) {
          if (value != null) {
            if (property === 'type') {
              return +value;
            }
            if (property.indexOf('date') >= 0) {
              if (_.isArray(value)) {
                return value.map(function (val) {
                  return new Date(val);
                });
              } else {
                return new Date(value);
              }
            }
          }
          return value;
        }

      });
    }

  };

  return ClientSideBrowsableMixin;

});

csui.define('nuc/models/autofetchable',['module', 'nuc/lib/underscore', 'nuc/utils/log'
], function (module, _, log) {
  'use strict';

  log = log(module.id);

  function AutoFetchableModel(ParentModel) {
    var prototype = {

      makeAutoFetchable: function (options) {
        // log.warn('Module "nuc/models/autofetchable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/autofetchable/autofetchable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        options && options.autofetch && this.automateFetch(options.autofetch);
        return this;
      },

      automateFetch: function (enable) {
        this[enable ? 'on' : 'off'](_.result(this, '_autofetchEvent'),
          _.bind(this._fetchAutomatically, this, enable));
      },

      isFetchable: function () {
        return !!this.get('id');
      },

      _autofetchEvent: 'change:id',

      _fetchAutomatically: function (enableOptions, model, value, options) {
        if (this.isFetchable()) {
         var fullOptions = _.extend({}, enableOptions, options);
        this.fetch(fullOptions);
        }
      }

    };
    prototype.AutoFetchable = _.clone(prototype);
    
    return prototype;
  }

  return AutoFetchableModel;

});

csui.define('nuc/models/connectable',['module', 'nuc/lib/underscore', 'nuc/utils/log'
], function (module, _, log) {
  'use strict';

  log = log(module.id);

  function ConnectableModel(ParentModel) {
    var prototype = {

      makeConnectable: function (options) {
        // log.warn('Module "nuc/models/connectable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/connectable/connectable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        options && options.connector && options.connector.assignTo(this);
        options && options.connector && this.original && options.connector.assignTo(this.original);
        return this;
      },

      _prepareModel: function (attrs, options) {
        options || (options = {});
        options.connector = this.connector;
        return ParentModel.prototype._prepareModel.call(this, attrs, options);
      }

    };
    prototype.Connectable = _.clone(prototype);

    return prototype;
  }

  return ConnectableModel;

});

csui.define('nuc/models/expandable',['module', 'nuc/lib/underscore', 'nuc/utils/log'
], function (module, _, log) {
  'use strict';

  log = log(module.id);

  function ExpandableModel(ParentModel) {
    var prototype = {

      makeExpandable: function (options) {
        // log.warn('Module "nuc/models/expandable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/expandable/expandable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        var expand = options && options.expand;
        if (typeof expand === 'string') {
          expand = expand.split(',');
        }
        this.expand = expand || [];
        return this;
      },

      setExpand: function (name) {
        if (!_.isArray(name)) {
          name = name.split(",");
        }
        _.each(name, function (name) {
          if (!_.contains(this.expand, name)) {
            this.expand.push(name);
          }
        }, this);
      },

      resetExpand: function (name) {
        if (name) {
          if (!_.isArray(name)) {
            name = name.split(",");
          }
          _.each(name, function (name) {
            var index = _.indexOf(this.expand, name);
            if (index >= 0) {
              this.expand.splice(index, 1);
            }
          }, this);
        } else {
          this.expand = [];
        }
      },

      getExpandableResourcesUrlQuery: function () {
        return {expand: this.expand};
      }

    };
    prototype.Expandable = _.clone(prototype);

    return prototype;
  }

  return ExpandableModel;

});

csui.define('nuc/models/fetchable',['module', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/utils/log'
], function (module, _, $, log) {
  'use strict';

  log = log(module.id);

  function FetchableModel(ParentModel) {
    var prototype = {

      makeFetchable: function (options) {
        // log.warn('Module "nuc/models/fetchable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/fetchable/fetchable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        this.autoreset = options && options.autoreset;
        // Workaround for change/add/reset events, which are fired before
        // the caller is informed by sync that fetch successed.
        return this.on('reset', this._beforeFetchSucceeded, this)
            .on('add', this._beforeFetchSucceeded, this)
            .on('change', this._beforeFetchSucceeded, this);
      },

      _beforeFetchSucceeded: function () {
        this.fetching && this._fetchSucceeded();
      },

      _fetchSucceeded: function () {
        this.fetching = false;
        this.fetched = true;
      },

      _fetchFailed: function () {
        this.fetching = false;
      },

      fetch: function (options) {
        if (!this.fetching) {
          this.fetched = false;
          log.debug('Fetching is starting for {0} ({1}).',
              log.getObjectName(this), this.cid) && console.log(log.last);
          options = this._prepareFetch(options);
          // Ensure that the model is marked fetched before other events are
          // triggered.  If fetching is not silent, change/add/reset will be
          // triggered earlier: change/add/reset, options.*, sync, promise.
          var self = this,
              success = options.success,
              error = options.error;
          options.success = function () {
            log.debug('Fetching succeeded for {0} ({1}).',
                log.getObjectName(self), self.cid) && console.log(log.last);
            self._fetchSucceeded();
            success && success.apply(this, arguments);
          };
          options.error = function () {
            log.debug('Fetching failed for {0} ({1}).',
                log.getObjectName(self), self.cid) && console.log(log.last);
            self._fetchFailed();
            error && error.apply(this, arguments);
          };
          this.fetching = ParentModel.prototype.fetch.call(this, options);
        } else {
          log.debug('Fetching is in progress for {0} ({1}).',
              log.getObjectName(this), this.cid) && console.log(log.last);
        }
        return this.fetching;
      },

      _prepareFetch: function (options) {
        // Trigger just one item adding operation after fetching if wanted.
        options || (options = {});
        options.reset === undefined && this.autoreset && (options.reset = true);
        return options;
      },

      ensureFetched: function (options) {
        if (this.fetched) {
          log.debug('No need to fetch {0} ({1}).',
              log.getObjectName(this), this.cid) && console.log(log.last);
          if (options && options.success) {
            options.success(this);
          }
          return $.Deferred()
              .resolve(this, {}, options)
              .promise();
        }
        return this.fetch(options);
      }

    };
    prototype.Fetchable = _.clone(prototype);

    return prototype;
  }

  return FetchableModel;

});

csui.define('nuc/models/including.additional.resources',['module', 'nuc/lib/underscore', 'nuc/utils/log'
], function (module, _, log) {
  'use strict';

  log = log(module.id);

  function IncludingAdditionalResources(ParentModel) {
    var prototype = {

      makeIncludingAdditionalResources: function (options) {
        // log.warn('Module "nuc/models/including.additional.resources" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/including.additional.resources/including.additional.resources.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        this._additionalResources = [];
        if (options && options.includeResources) {
          this.includeResources(options.includeResources);
        }
        return this;
      },

      includeResources: function (names) {
        if (!_.isArray(names)) {
          names = names.split(',');
        }
        this._additionalResources = _.union(this._additionalResources, names);
      },

      excludeResources: function (names) {
        if (names) {
          if (!_.isArray(names)) {
            names = names.split(',');
          }
          this._additionalResources = _.reject(this._additionalResources, names);
        } else {
          this._additionalResources = [];
        }
      },

      getAdditionalResourcesUrlQuery: function () {
        return _.reduce(this._additionalResources, function (result, parameter) {
          result[parameter] = 'true';
          return result;
        }, {});
      }

    };
    prototype.IncludingAdditionalResources = _.clone(prototype);

    return prototype;
  }

  return IncludingAdditionalResources;

});

csui.define('nuc/models/nodeautofetchable',['module', 'nuc/lib/underscore', 'nuc/utils/log'
], function (module, _, log) {
  'use strict';

  log = log(module.id);

  function NodeAutoFetchableModel(ParentModel) {
    var prototype = {

      makeNodeAutoFetchable: function (options) {
        // log.warn('Module "nuc/models/fetchable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/fetchable/fetchable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        options && options.autofetch && this.automateFetch(options.autofetch);
        return this;
      },

      automateFetch: function (enable) {
        this.node[enable ? 'on' : 'off'](_.result(this, '_autofetchEvent'),
          _.bind(this._fetchAutomatically, this, enable));
      },

      isFetchable: function () {
        return this.node.isFetchableDirectly();
      },

      _autofetchEvent: 'change:id',

      _fetchAutomatically: function (options) {
        this.isFetchable() && this.fetch(_.isObject(options) && options);
      }

    };
    prototype.NodeAutoFetchable = _.clone(prototype);
    
    return prototype;
  }

  return NodeAutoFetchableModel;

});

csui.define('nuc/models/nodeconnectable',['module', 'nuc/lib/underscore', 'nuc/utils/log'
], function (module, _, log) {
  'use strict';

  log = log(module.id);

  function NodeConnectableModel(ParentModel) {
    var prototype = {

      makeNodeConnectable: function (options) {
        // log.warn('Module "nuc/models/connectable" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/connectable/connectable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        if (options && options.node) {
          this.node = options.node;
          options.node.connector && options.node.connector.assignTo(this);
        }
        return this;
      },

      _prepareModel: function (attrs, options) {
        options.connector = this.node && this.node.connector;
        return ParentModel.prototype._prepareModel.call(this, attrs, options);
      }

    };
    prototype.NodeConnectable = _.clone(prototype);
    
    return prototype;
  }

  return NodeConnectableModel;

});

csui.define('nuc/models/noderesource',['module', 'nuc/lib/underscore', 'nuc/utils/log',
  'nuc/models/nodeconnectable', 'nuc/models/fetchable',
  'nuc/models/nodeautofetchable'
], function (module, _, log, NodeConnectableModel, FetchableModel,
    NodeAutoFetchableModel) {
  'use strict';

  log = log(module.id);

  function NodeResourceModel(ParentModel) {
    var prototype = {

      makeNodeResource: function (options) {
        // log.warn('Module "nuc/models/noderesource" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/node.resource/node.resource.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        return this.makeNodeConnectable(options)
            .makeFetchable(options)
            .makeNodeAutoFetchable(options);
      }

    };
    prototype.NodeResource = _.clone(prototype);

    return _.extend({},
        NodeConnectableModel(ParentModel),
        FetchableModel(ParentModel),
        NodeAutoFetchableModel(ParentModel),
        prototype);
  }

  return NodeResourceModel;

});

csui.define('nuc/models/resource',['module', 'nuc/lib/underscore', 'nuc/utils/log',
  'nuc/models/connectable', 'nuc/models/fetchable',
  'nuc/models/autofetchable'
], function (module, _, log, ConnectableModel, FetchableModel,
  AutoFetchableModel) {
  'use strict';

  log = log(module.id);

  function ResourceModel(ParentModel) {
    var prototype = {

      makeResource: function (options) {
        // log.warn('Module "nuc/models/resource" has been deprecated and' +
        //          ' is going to be removed.' +
        //          '  Use "nuc/models/mixins/resource/resource.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        return this.makeConnectable(options)
          .makeFetchable(options)
          .makeAutoFetchable(options);
      }

    };
    prototype.Resource = _.clone(prototype);
    
    return _.extend({},
      ConnectableModel(ParentModel),
      FetchableModel(ParentModel),
      AutoFetchableModel(ParentModel),
      prototype);
  }

  return ResourceModel;

});

csui.define('nuc/models/uploadable',['module', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/backbone', 'nuc/utils/log'
], function (module, _, $, Backbone, log) {
  'use strict';

  log = log(module.id);

  function UploadableModel(ParentModel) {
    var prototype = {

      makeUploadable: function (options) {
        // log.warn('Module "nuc/models/uploadable" has been deprecated and is going to be removed.' +
        //          '  Use "nuc/models/mixins/uploadable/uploadable.mixin" instead.')
        // && console.warn(log.last);
        // log.warn('Occurred ' + log.getStackTrace(2)) && console.warn(log.last);
        return this;
      },

      sync: function (method, model, options) {
        var data = options.data || options.attrs || this.attributes;
        // Make sure, that POST and PUT urls do not contain the URL query
        // part.  It is not possible to ensure it inside the url function.
        function currectUpdatingUrl() {
          var url = options.url || _.result(model, 'url');
          return url.replace(/\?.*$/, '');
        }

        if (method === 'create') {
          log.debug('Creating {0} ({1}).',
              log.getObjectName(this), this.cid) && console.log(log.last);
          var formData = new FormData();
          formData.append('body', JSON.stringify(data));

          // append file, if there is
          _.each(_.keys(options.files || {}), function (key) {
            var files = options.files[key], i;
            if (_.isArray(files) && files.length > 1) {
              // TODO: Adapt this according to the server support.
              for (i = 0; i < files.length; ++i) {
                var name = i ? key + i : key;
                formData.append(name, files[i]);
              }
            } else if (files) {
              formData.append(key, files);
            }
          });

          _.extend(options, {
            data: formData,
            contentType: false,
            url: currectUpdatingUrl()
          });
        } else if (method === 'update' || method === 'patch') {
          log.debug('Updating {0} ({1}).',
              log.getObjectName(this), this.cid) && console.log(log.last);
          method = 'update';
          data = {body: JSON.stringify(data)};
          _.extend(options, {
            data: $.param(data),
            contentType: 'application/x-www-form-urlencoded',
            url: currectUpdatingUrl()
          });
        }
        return Backbone.sync(method, model, options);
      }

    };
    prototype.Uploadable = _.clone(prototype);

    return prototype;
  }

  return UploadableModel;

});

csui.define('nuc/utils/errors/request',[],function () {
  'use strict';

  // Makes an Error of an error response from the server
  function ResponseError(response) {
    Error.prototype.constructor.call(this);
    this.message = response.error;
    this.details = response.errorDetail;
  }

  ResponseError.prototype = Object.create(Error.prototype);
  ResponseError.prototype.constructor = ResponseError;
  ResponseError.prototype.name = 'ResponseError';

  // Makes an Error of a failing request to the server
  function RequestError(request) {
    Error.prototype.constructor.call(this);
    var responseJSON = request.responseJSON || {},
        settings = request.settings,
        message;
    this.statusCode = request.status;
    this.statusText = request.statusText;
    this.message = responseJSON.error || request.responseText;
    this.details = responseJSON.errorDetail;
    if (settings) {
      this.method = settings.type;
      this.url = settings.url;
    }
  }

  RequestError.prototype = Object.create(Error.prototype);
  RequestError.constructor = RequestError;
  RequestError.prototype.name = 'ServerError';

  return RequestError;

});

csui.define('nuc/contexts/context',[
  'module', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/lib/marionette', 'nuc/utils/errors/request', 'nuc/utils/log'
], function (module, _, $, Backbone, Marionette, RequestError, log) {
  'use strict';

  log = log(module.id);

  var Context = Marionette.Controller.extend({
    constructor: function Context(options) {
      this.cid = _.uniqueId('context');
      Marionette.Controller.prototype.constructor.apply(this, arguments);
      this._factories = {};
      // Prevent pre-set attributes to take part in unique object prefixes;
      // global options passed to all factories are only for initializing
      _.each(this.options.factories, function (object, key) {
        object.internal = true;
      });
    },

    // Offer an intuitive interface; when a model is needed, use getModel, when a collection
    // is needed, use getCollection, and when other object is needed, use getObject
    getModel: getObject,      // NodeModel, e.g.
    getCollection: getObject, // FavoriteCollection, e.g.
    getObject: getObject,     // Connector, e.g.

    // Offer an intuitive interface; when a model is needed, use hasModel, when a collection
    // is needed, use hasCollection, and when other object is needed, use hasObject
    hasModel: hasObject,      // NodeModel, e.g.
    hasCollection: hasObject, // FavoriteCollection, e.g.
    hasObject: hasObject,     // Connector, e.g.

    getFactory: function (Factory, options) {
      return this._getFactory(Factory, options, true);
    },

    clear: function (options) {
      log.info('Clearing {0} started.', this.cid) && console.log(log.last);
      this.triggerMethod('before:clear', this);
      if (options && options.all) {
        this._destroyAllFactories();
      } else {
        this._destroyNonPermanentFactories();
      }
      // The context will be reused to fetch new data. Even if the old data were
      // still being fetched, it would be a background operation without display,
      // which does not have to block the new data to keep the pag consistent.
      this.suppressFetch();
      log.info('Clearing {0} succeeded.', this.cid) && console.log(log.last);
      this.triggerMethod('clear', this);
      return this;
    },

    // TODO: Deprecate this in favour of the fetchability (fetching, fetched, error)
    isBusy: function () {
      return this.fetching;
    },

    fetch: function (options) {
      options || (options = {});

      if (this.fetching) {
        log.debug('Fetching {0} continues.', this.cid) && console.log(log.last);
        return this.fetching;
      }
      this.fetched = false;
      this.error = null;
      log.info('Fetching {0} started.', this.cid) && console.log(log.last);
      this.triggerMethod('request', this);

      this._destroyTemporaryFactories();
      var self = this;
      var fetchableFactories = _.filter(this._factories, function (factory) {
        return self.isFetchable(factory);
      });
      var factoryPromises = _.chain(fetchableFactories)
          .map(function (factory) {
            var clonedOptions = options ? _.clone(options) : {};

            if (self._synchronizeFetches) {
              // let the factory use a clone of the model/collection for fetching to prevent views
              // that subscribed for events will immediately render
              return factory.cloneAndFetch(clonedOptions).then(function () {
                log.debug("Results of " + factory.property.constructor.name + " arrived.") &&
                console.log(log.last);
              });
            } else {
              // caller of fetch explicitly wants not to synchronize (views render immediately
              // when fetched data is received and model updated)
              return factory.fetch(clonedOptions);
            }
          })
          .compact()
          .value();

      if (log.can('DEBUG')) {
        _.each(fetchableFactories, function (factory) {
          log.debug("Waiting for fetch results of " + factory.property.constructor.name) &&
          console.log(log.last);
        });
      }

      var finalDeferred = $.Deferred();
      var finalPromise = this.fetching = finalDeferred.promise();

      $.when
          .apply($, factoryPromises)
          .then(function () {
            if (self.fetching === finalPromise) {
              self.fetching = null;
              self.fetched = true;
              log.info('Fetching {0} succeeded.', self.cid) && console.log(log.last);

              if (self._synchronizeFetches) {
                self.triggerMethod('before:models:reset', self);
                _.each(fetchableFactories, function (factory) {
                  factory.copyFetchedResultsToOriginalProperty();
                });
              }
              self.triggerMethod('sync', self);
              finalDeferred.resolve();
            } else {
              log.debug('Suppressed fetching {0} succeeded.', self.cid) && console.log(log.last);
            }
          }, function (request) {
            var error = new RequestError(request);
            if (self.fetching === finalPromise) {
              self.fetching = null;
              self.error = error;
              log.error('Fetching {0} failed: {1}', self.cid, error) && console.error(log.last);
              self.triggerMethod('error', error, self);
              finalDeferred.reject(error);
            } else {
              log.debug('Suppressed fetching {0} failed: {1}.', self.cid, error.message) &&
              console.log(log.last);
            }
          });
      return finalPromise;
    },

    isFetchable: function (factory) {
      return this._isFetchable(factory);
    },

    _isFetchable: function (factory) {
      if (factory.options.detached) {
        return false;
      }
      if (factory.isFetchable) {
        return factory.isFetchable();
      }
      return !!factory.fetch;
    },

    suppressFetch: function () {
      if (this.fetching) {
        log.debug('Suppressing the fetch in progress in {0}.', this.cid) && console.log(log.last);
        this.fetching = null;
        this.fetched = false;
        this.error = null;
        // Events "request" and "sync/error" must be balanced in pair.
        this.triggerMethod('sync', this);
        return true;
      }
    },

    _destroyTemporaryFactories: function () {
      this._factories = _.pick(this._factories, function (factory, propertyName) {
        if (factory.options.temporary) {
          this._removeFactory(propertyName);
        } else {
          return true;
        }
      }, this);
    },

    _destroyNonPermanentFactories: function () {
      this._factories = _.pick(this._factories, function (factory, propertyName) {
        if (factory.options && factory.options.permanent) {
          return true;
        } else {
          this._removeFactory(propertyName);
        }
      }, this);
    },

    _destroyAllFactories: function () {
      _.each(this._factories, function (factory, propertyName) {
        this._removeFactory(propertyName);
      }, this);
      this._factories = {};
    },

    _getPropertyName: function (Factory, options) {
      options || (options = {});
      // Pre-initializing the model with its type or id will make it unique in the context
      var attributes = options.attributes || {};

      // Stamp globally unique factory names by an artificial attribute
      if (options.unique) {
        attributes = _.extend({
          stamp: _.uniqueId()
        }, attributes);
      }
      return _.reduce(attributes, function (result, value, key) {
        if (value == null) {
          return result;
        }
        if (result !== null) {
          return result + '-' + key + '-' + value;
        }
        return key + '-' + value;
      }, Factory.prototype.propertyPrefix);
    },

    _getFactory: function (Factory, options, createIfNotFound) {
      // Support getting objects by the factory name, if the factory object
      // cannot be required as a dependency
      if (typeof Factory === 'string') {
        return this._factories[Factory];
      }
      options || (options = {});
      // Factories expect their options in a property named with their prefix; options for all
      // factories are together to allow passing options to nested factories
      var propertyPrefix = Factory.prototype.propertyPrefix,
          globalOptions = this.options.factories || {},
          objectOptions, nameOptions, factoryOptions;
      // Calls outside the factories can pass options.  Further calls to nested factories include
      // options from the context constructor already; do not extend the options in that case.
      if (options.internal) {
        objectOptions = options[propertyPrefix];
        // It is not possible to use the pre-initializing of the factory
        // properties for nested factories.  It works only on the first
        // level - for the caller outside the context constructor.
        if (objectOptions && !objectOptions.internal &&
            !(objectOptions instanceof Backbone.Model)) {
          // Limit the parameters to the only object useful for the _getPropertyName
          nameOptions = {
            attributes: objectOptions.attributes,
            unique: objectOptions.unique
          };
        }
      } else {
        // The caller outside the factories does not need to wrap the options in the factory
        // prefix key; we do it here for their convenience
        objectOptions = options[propertyPrefix];
        // If no factory options were passed in, let the context ctor options merge in
        if (objectOptions === undefined && !_.isEmpty(options)) {
          // Merge this factory options from context constructor with getObject arguments
          factoryOptions = _.omit(options,
              'detached', 'permanent', 'temporary', 'unique');
          if (!_.isEmpty(factoryOptions)) {
            options[propertyPrefix] = _.defaults(factoryOptions, globalOptions[propertyPrefix]);
          }
        }
        _.defaults(options, {
          internal: true
        }, globalOptions);
        // Prefer the attributes passed to the getObject method directly
        // to the attributes passed via the factory-specific options.
        // If the factory-specific options are a Backbone model, it is
        // the scenario pre-initializing the factory properties and the
        // explicit attributes are mandatory then.
        nameOptions = {
          attributes: options.attributes,
          unique: options.unique
        };
        if (!nameOptions.attributes && objectOptions && !objectOptions.internal &&
            !(objectOptions instanceof Backbone.Model)) {
          // Limit the parameters to the only object useful for the _getPropertyName
          nameOptions = {
            attributes: objectOptions.attributes,
            unique: objectOptions.unique
          };
        }
      }
      // The property name for the factory is computed just from its options
      var propertyName = this._getPropertyName(Factory, nameOptions),
          extraOptions = options.options;
      // Making unique property name to handle usecases like overriding of search query_id when multiple search result widgets are present
      propertyName = !!(extraOptions && extraOptions.factoryUID) ?
                     propertyName + extraOptions.factoryUID : propertyName;
      var factory = this._factories[propertyName];
      if (!factory && createIfNotFound) {
        options.factoryName = propertyName;
        factory = new Factory(this, options);
        this._factories[propertyName] = factory;
        log.debug('Adding factory {0} to {2}.',
            propertyName, factory.context.cid, this.cid) && console.log(log.last);
        this.triggerMethod('add:factory', this, propertyName, factory);
        // Re-trigger events from sub-contexts in some factories.
        var property = factory.property;
        if (property instanceof Context) {
          this.listenTo(property, 'add:factory', function (context, propertyName, factory) {
            this.triggerMethod('add:factory', this, propertyName, factory);
          })
              .listenTo(property, 'remove:factory', function (context, propertyName, factory) {
                this.triggerMethod('remove:factory', this, propertyName, factory);
              });
        }
      }
      return factory;
    },

    _removeFactory: function (propertyName) {
      var factory = this._factories[propertyName];
      // Stop listening to sub-context events from removed factories.
      var property = factory.property;
      if (property instanceof Context) {
        this.stopListening(property, 'add:factory')
            .stopListening(property, 'remove:factory');
      }
      this.triggerMethod('remove:factory', this, propertyName, factory);
      factory.destroy();
    },

    onDestroy: function () {
      this.clear({all: true});
    }
  });

  function getObject(Factory, options) {
    var factory = this._getFactory(Factory, options, true);
    return factory.property;
  }

  function hasObject(Factory, options) {
    return !!this._getFactory(Factory, options, false);
  }

  return Context;
});

csui.define('nuc/contexts/synchronized.context',[
  'module', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/lib/backbone',
  'nuc/lib/marionette', 'nuc/utils/errors/request', 'nuc/utils/log',
  'nuc/contexts/context'
], function (module, _, $, Backbone, Marionette, RequestError, log, Context) {
  'use strict';

  log = log(module.id);

  var SynchronizedContext = Context.extend({
    constructor: function SynchronizedContext(sourceContext, properties, options) {
      this.cid = _.uniqueId('synchronized.context');
      Context.prototype.constructor.apply(this, arguments);
      this._synchronizeFetches = true;

      if (!sourceContext) {
        throw new Error('Source context must be specified');
      }

      _.each(properties, function (property) {
        // find the propertyName in the list of keys of sourceContext._factories for the
        // factory that has the same property
        var propertyName = _.find(Object.keys(sourceContext._factories), function (propertyName) {
          return sourceContext._factories[propertyName].property === property;
        }, this);
        if (propertyName) {
          var factoryWithProperty = sourceContext._factories[propertyName];
          if (!_.isFunction(factoryWithProperty.cloneAndFetch)) {
            throw new Error(
                "Factories for synchronized context must have clone.and.fetch.mixin applied." +
                " Factory " + factoryWithProperty.constructor.name + " does not have it");
          }
          this._factories[propertyName] = factoryWithProperty;
        } else {
          throw new Error("Source context does not have factory with specified property");
        }

        // add existing factory to SynchronizedContext _factories
      }, this);

      if (options.triggerEventsOnSourceContext) {
        this.listenTo(this, 'request', function () {
          sourceContext.trigger('request');
        });
        this.listenTo(this, 'sync', function () {
          sourceContext.trigger('sync');
        });
      }
    },

    // overridden, because SynchronizedContext does not know the concept of detached
    _isFetchable: function (factory) {
      if (factory.isFetchable) {
        return factory.isFetchable();
      }
      return !!factory.fetch;
    }

  });

  return SynchronizedContext;
});

csui.define('nuc/contexts/context.plugin',[
  'nuc/lib/underscore', 'nuc/lib/backbone'
], function (_, Backbone) {
  'use strict';

  function ContextPlugin(options) {
    this.cid = _.uniqueId('contextPlugin');
    this.context = options.context;
  }

  _.extend(ContextPlugin.prototype, Backbone.Events, {
    // Called when a factory is questioned if it is fetchable; it will be
    // considered fetchable, unless this method returns false
    isFetchable: function (factory) {}
  });

  ContextPlugin.extend = Backbone.Model.extend;

  return ContextPlugin;
});

csui.define('nuc/contexts/fragment/context.fragment',[
  'module', 'nuc/lib/underscore', 'nuc/lib/jquery',
  'nuc/lib/marionette', 'nuc/contexts/context',
  'nuc/utils/errors/request', 'nuc/utils/log',
], function (module, _, $, Marionette, Context, RequestError, log) {
  'use strict';

  log = log(module.id);

  var ContextFragment = Marionette.Controller.extend({
    constructor: function ContextFragment(context) {
      this.cid = _.uniqueId('contextFragment');
      Marionette.Controller.prototype.constructor.call(this);
      this.context = context;
      this._items = [];
      this._containers = new Set();
      this.listenTo(context, 'add:factory', addFactory);
    },

    fetch: function (options) {
      if (this.fetching) {
        log.debug('Fetching {0} continues.', this.cid) && console.log(log.last);
        return this.fetching;
      }
      this.fetched = false;
      this.error = null;
      log.info('Fetching {0} started.', this.cid) && console.log(log.last);
      this.triggerMethod('request', this);
      this.context.triggerMethod('request', this, this.context);
      var promises = fetchFactories.call(this, options);
      var self = this;
      this.fetching = $.when
          .apply($, promises)
          .then(function () {
            self.fetching = null;
            self.fetched = true;
            log.info('Fetching {0} succeeded.', self.cid) && console.log(log.last);
            self.triggerMethod('sync', self);
            self.context.triggerMethod('sync', self.context);
          }, function (request) {
            var error = new RequestError(request);
            self.fetching = null;
            self.error = error;
            log.error('Fetching {0} failed: {1}', self.cid, error) && console.error(log.last);
            self.triggerMethod('error', error, self);
            self.context.triggerMethod('error', error, self.context);
            return $.Deferred().reject(error);
          });
      return this.fetching;
    },

    clear: function () {
      log.info('Clearing {0}.', this.cid) && console.log(log.last);
      this.triggerMethod('before:clear', this);
      this._items = [];
      this._containers.clear();
      this.triggerMethod('clear', this);
    }
  });

  function addFactory (context, propertyName, factory) {
    log.debug('Collecting factory {0} from {1} to {2}.',
      propertyName, factory.context.cid, this.cid) && console.log(log.last);
    this._items.push({ propertyName: propertyName, factory: factory });
    // Remember sub-contexts in some factories to fetch them properly later.
    var property = factory.property;
    if (property instanceof Context) {
      this._containers.add(property);
    }
  }

  function fetchFactories (options) {
    var self = this;
    return _
        .chain(this._items)
        .filter(function (item) {
          var factory = item.factory;
          // Temporary factories were are never fetched by context, because
          // they get removed before fetching. Fetching a fragment does not
          // remove them, but the non-fetching behavior should remain to
          // avoid unwanted fetching.
          return !factory.options.temporary
              // If a factory with a nested context was added, let it fetch
              // its children. Do not fetch them one-by-one again.
              && !self._containers.has(factory.context)
              // Reuse the fetchability checks from the originating context.
              && factory.context.isFetchable(factory);
        })
        .map(function (item) {
          var clonedOptions = options ? _.clone(options) : {};
          return item.factory.fetch(clonedOptions);
        })
        .compact()
        .value();
  }

  return ContextFragment;
});

csui.define('nuc/contexts/mixins/clone.and.fetch.mixin',[
  'nuc/lib/underscore', 'nuc/lib/backbone'
], function (_, Backbone) {
  'use strict';

  var CloneAndFetchMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeCloneAndFetch: function (options) {
          // options || (options = {});
          // this.factoryName = options.factoryName;
          return this;
        },

        cloneAndFetch: function (options) {
          // "rename" the current property - don't have to delete this.property, because it is
          // overwritten in the next line
          this.originalProperty = this.property;

          // todo: use optimized clone that does not copy attributes
          this.property = this.originalProperty.clone();

          if (this.originalProperty.autoreset !== undefined && this.property.autoreset ===
              undefined) {
            this.property.autoreset = this.originalProperty.autoreset;
          }

          return this.fetch(options);
        },

        copyFetchedResultsToOriginalProperty: function () {
          if (this.originalProperty instanceof Backbone.Collection) {

            var attributesToCopyBack = ['actualSkipCount', 'totalCount', 'filteredCount',
              'skipCount', 'topCount', 'orderBy', 'filters', 'orderOnRequest', 'pagination'];
            _.each(attributesToCopyBack, function (attributeName) {
              if (this.property[attributeName] !== undefined) {
                this.originalProperty[attributeName] = this.property[attributeName];
              }
            }, this);

            this.originalProperty.reset(this.property.models);
          } else {
            if (this.originalProperty instanceof Backbone.Model) {
              this.originalProperty.set(this.property.attributes);
            } else {
              throw new Error('Unsupported property');
            }
          }

          // move originalProperty back to property
          this.property = this.originalProperty;
          delete this.originalProperty;
        }

      });
    }
  };

  return CloneAndFetchMixin;
});


csui.define('nuc/contexts/page/page.context',[
  'nuc/lib/underscore', 'nuc/contexts/context',
  'csui-ext!nuc/contexts/page/page.context'
], function (_, Context, contextPlugins) {
  'use strict';

  var PageContext = Context.extend({
    constructor: function PageContext() {
      Context.prototype.constructor.apply(this, arguments);

      // Keep the same order as in perspective context
      var Plugins = _
          .chain(contextPlugins)
          .flatten(true)
          .unique()
          .reverse()
          .value();
      this._plugins = _.map(Plugins, function (Plugin) {
        return new Plugin({context: this});
      }, this);
    },

    _isFetchable: function (factory) {
      return Context.prototype._isFetchable.apply(this, arguments) &&
             _.all(this._plugins, function (plugin) {
               return plugin.isFetchable(factory) !== false;
             });
    }
  });

  return PageContext;
});

csui.define('nuc/contexts/factories/factory',['nuc/lib/marionette'], function (Marionette) {

  // These class is usually consumed under names ObjectFactory, ModelFactory or CollectionFactory,
  // depending on the descendant object (see Context.getObject for more information)
  var Factory = Marionette.Controller.extend({

    constructor: function Factory(context, options) {
      this.context = context;
      this.options = options || {};
    },

    // Descendants must set a string ID, which will uniquely identify the model in the context
    propertyPrefix: null

  });

  return Factory;

});


csui.define('nuc/utils/authenticators/authenticators',[
  'nuc/lib/underscore', 'nuc/lib/backbone',
  'nuc/models/mixins/rules.matching/rules.matching.mixin',
  // Load and register external authenticator rules
  'csui-ext!nuc/utils/authenticators/authenticators'
], function (_, Backbone, RulesMatchingMixin, rules) {
  'use strict';

  var AuthenticatorModel = Backbone.Model.extend({
    defaults: {
      sequence: 100,
      authenticator: null
    },

    constructor: function AuthenticatorModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }
  });

  RulesMatchingMixin.mixin(AuthenticatorModel.prototype);

  var AuthenticatorCollection = Backbone.Collection.extend({
    model: AuthenticatorModel,
    comparator: 'sequence',

    constructor: function AuthenticatorCollection(models, options) {
      Backbone.Collection.prototype.constructor.call(this, models, options);
    },

    findByConnection: function (connection) {
      var rule = this.find(function (item) {
        return item.matchRules(connection, item.attributes);
      });
      return rule && rule.get('authenticator');
    }
  });

  var authenticators = new AuthenticatorCollection();

  if (rules) {
    authenticators.add(_.flatten(rules, true));
  }

  return authenticators;
});

csui.define('nuc/lib/jquery.ajax-progress',[ "module", "nuc/lib/underscore", "nuc/lib/jquery"
], function (module, _, $) {

  //is onprogress supported by browser?
  var hasOnProgress = ("onprogress" in $.ajaxSettings.xhr());

  //If not supported, do nothing
  if (!hasOnProgress) {
    return;
  }

  //patch ajax settings to call a progress callback
  var oldXHR = $.ajaxSettings.xhr;
  $.ajaxSettings.xhr = function () {
    var xhr = oldXHR.apply(this, arguments);

    // Execute the progress callback only if the caller of $.ajax() specified
    // it in the options object. This is the jQuery object instance enriched
    // with the parameters passed to the $.ajax() options.
    if (this.progress) {
      if (xhr instanceof window.XMLHttpRequest) {
        xhr.addEventListener('progress', this.progress, false);
      }

      if (xhr.upload) {
        xhr.upload.addEventListener('progress', this.progress, false);
      }
    }

    return xhr;
  };

  return $;

});

csui.define('nuc/utils/connector',[
  'require', 'module', 'nuc/lib/jquery', 'nuc/lib/underscore',
  'nuc/lib/backbone', 'nuc/utils/log', 'nuc/utils/base',
  'nuc/utils/url', 'i18n', 'i18n!nuc/utils/impl/nls/lang',
  'nuc/utils/authenticators/authenticators',
  'nuc/models/mixins/uploadable/uploadable.mixin',
  'nuc/lib/jquery.ajax-progress'
], function (require, module, $, _, Backbone, log, base,
  Url, i18n, lang, authenticators, UploadableMixin) {
  'use strict';

  var config = _.extend({
    connectionTimeout: undefined
  }, module.config());

  var pageUnloading = false;
  $(window).on('beforeunload.' + module.id, function (event) {
    pageUnloading = true;
  });

  function Connector(options) {
    this.connection = options.connection;
    this.authenticator = options.authenticator;
    if (!this.authenticator) {
      var Authenticator = authenticators.findByConnection(this.connection);
      if (!Authenticator) {
        throw new Error(
          'No authenticator found. Load csui-extensions.json to enable built-in authenticators.');
      }
      this.authenticator = new Authenticator();
    }
    // The connection is owned by the connector but the authenticator
    // may be created by the client independently on the connector
    // and passed in. The connection must come from the connector.
    this.authenticator.connection = this.connection;
    this.authenticator.connectionTimeout = this.connectionTimeout;
    this.authenticationPending = false;
    this.waitingRequests = [];
    this.restartRequests = [];
  }

  function assignTo(model) {
    // Allow multiple calls when connectable is mixed
    // with node.connectable, for example
    if (model.connector) {
      if (model.connector === this) {
        return;
      }
      // The sync() method cannot be overridden twice
      throw new Error('Impossible to re-assign connector.');
    }
    model.connector = this;
    return overrideBackboneSync.call(this, model);
  }

  function overrideBackboneSync(model) {
    var self = this;
    var originalSync = model.sync;

    model.sync = function (method, model, options) {
      function executeSync() {
        // If we caught unload event earlier and now a new request is going
        // to be executed, let's assume, that page unloading was cancelled
        pageUnloading = false;

        var restartRequest = {
          execute: originalSync,
          thisObj: model
        };
        self.extendAjaxOptions(options, restartRequest);
        // options now has extra data set by extendAjaxOptions, clone it to use for restart request
        // because $.ajax call will add more attributes that options cannot be reused later.
        var originalOptions = _.clone(options);
        _.extend(restartRequest, {
          options: originalOptions,
          deferred: options.deferred,
          executeOptionsArray: [method, model, _.extend(originalOptions, {restartRequest: true})]
        });

        // The options for the $.ajax() serve as the carrier of the
        // deferred object; jQuery AJAX callbacks are on a lower level
        // and  do not have access to the Backbone model.
        var deferred = options.deferred;
        var jqxhr = originalSync.call(model, method, model, options)
            .progress(deferred.notify)
            .done(deferred.resolve)
            .fail(function (request, message, statusText) {
              // Let the promise akceptors wait forever on page unload
              if (!pageUnloading && request.status !== 401) {
                deferred.reject(request, message, statusText);
              }
            });
        return addAbort(deferred.promise(), jqxhr);
      }

      return executeOrScheduleRequest.call(self, executeSync);
    };

    return this;
  }

  function getConnectionUrl() {
    return new Url(this.connection.url);
  }

  function addAbort(promise, jqxhr) {
    // extend the locally created promise with an additional abort method
    // not to break the Backbone.sync contract - it returns the jqxhr
    // object, which includes not only the promise methods, but also AJAX
    // call controlling methods like abort
    promise.abort = function () {
      // If noabort method exists, the model either does not support it
      // or the request was aborted while still in the waiting queue
      if (jqxhr.abort) {
        jqxhr.abort();
      }
      return this;
    };
    return promise;
  }

  function executeOrScheduleRequest(executeCall) {
    if (this.authenticator.isAuthenticated()) {
      return executeCall();
    }

    var executor = {
      execute: executeCall,
      deferred: $.Deferred()
    };
    this.waitingRequests.push(executor);

    var self = this;
    authenticate.call(this, function success() {
      executeWaitingRequests.call(self);
    }, function fail(error) {
      cancelWaitingRequests.call(self, error);
      reportError(error);
    });

    return executor.deferred.promise();
  }

  function extendAjaxOptions(options, restartRequest) {
    options.headers || (options.headers = {});
    _.extend(options.headers, this.connection.headers);
    _.extend(options.headers, {
      'Accept-Language': i18n.settings.locale
    });
    this.authenticator.setAuthenticationHeaders(options.headers);
    options.timeout = this.connectionTimeout;
    // jQuery doesn't notify the promises about the data transfer
    // progress; we do it by our progress event handler below and
    // just relay the other promise events as they come.
    options.deferred = $.Deferred();

    var self = this;
    var originalOptions;

    var beforeSend = options.beforeSend;
    options.beforeSend = function (request, settings) {
      // Progress event handler doesn't have access to the the jQuery AJAX
      // object; let's use the options in this scope as its carrier.
      options.request = request;
      request.settings = settings;
      if (self.reportSending) {
        self.reportSending(request, settings);
      }
      if (beforeSend) {
        beforeSend(request, settings);
      }
      // There's no progress event at the very start of uploading; it may be
      // useful to be notified about it though.  jQuery promises have no
      // start event; just notify and done, that's why we send one extra
      // notification with non-computable length to notify about the very
      // start.
      options.progress({
        lengthComputable: false,
        beforeSend: true
      });
    };

    var progress = options.progress;
    options.progress = function (event) {
      if (self.reportProgress) {
        self.reportProgress(event, options.request);
      }
      if (progress) {
        progress(event);
      }
      // jQuery doesn't notify the promises about the data transfer progress.
      options.deferred.notify(event, options.request);
    };

    var success = options.success;
    options.success = function (data, result, request) {      
      self.authenticator.updateAuthenticatedSession(request);
      self._succeeded = true;
      if (self.reportSuccess) {
        self.reportSuccess(request);
      }

      if (success) {
        success(data, result, request);
      }
    };

    var error = options.error;
    options.error = function (request, message, statusText) {
      // Do not report any errors when the page is unloading; aborted AJAX
      // calls are expected to fail silently
      if (pageUnloading) {
        return;
      }

      function reportError() {
        // Ensure a readable message, when the posted object is obsolete.
        if (request.status == 409) {
          setConflictMessage(request);
        }
        if (self.reportError) {
          self.reportError(request);
        }
        if (error) {
          error(request, message, statusText);
        }
      }

      function sessionExpired() {
        if (!self.confirmingReload) {
          self.confirmingReload = true;
          var failure     = new base.RequestErrorMessage(request),
              dialogTitle = self._succeeded ? lang.SessionExpiredDialogTitle :
                            lang.AuthenticationFailureDialogTitle;
          log.warn(failure) && console.warn(log.last);
          csui.require(['csui/dialogs/modal.alert/modal.alert'], function (alertDialog) {
            alertDialog
              .showWarning(lang.AuthenticationFailureDialogText, dialogTitle, {
                buttons: alertDialog.buttons.Ok
              })
              .always(function () {
                self.authenticator.unauthenticate({reason: 'failed'});
              });
          });
        }
      }

      if (request.status == 401) {
        // Only restart requests from codes that have been ported.
        if (restartRequest || options.restartDeferred) {
          var requestObj = restartRequest || {
                options: originalOptions,
                deferred: options.restartDeferred || options.deferred,
                execute: $.ajax,
                thisObj: undefined,
                executeOptionsArray: [_.extend(originalOptions, {restartRequest: true})]
              };
          self.restartRequests.push(requestObj);
          if (!self.reauthenticatingInitiated) {
            self.reauthenticatingInitiated = true;
            // In case of OTDS SSO, automatically reauthenticate and restart the request again.
            self.authenticator.unauthenticate({reason: 'expired'});  // clear expired session
            self.authenticator.authenticate(function () {  // success
              self.reauthenticatingInitiated = false;
              executeRestartRequests.call(self);
            }, function (error) {  // failure
              self.restartRequests = [];
              sessionExpired();
            });
          }
        } else {
          // Non-ported raw $.ajax call will still get the session expired error as before.
          sessionExpired();
        }
      } else {
        reportError();
      }
    };

    // options now has extra data set by extendAjaxOptions, clone it to use for restart request
    // because $.ajax call will add more attributes that options cannot be reused later.
    originalOptions = _.clone(options);
    return options;
  }

  function formatAjaxData(data) {
    data = JSON.stringify(data);
    return UploadableMixin.useJSON || UploadableMixin.mock ?
           data : {body: data};
  }

  function getAjaxContentType() {
    return UploadableMixin.useJSON || UploadableMixin.mock ?
           'application/json' : 'application/x-www-form-urlencoded';
  }
  
  function makeAjaxCall(options) {
    var method = options.method || options.type || 'GET';
    var data = options.data;
    var self = this;

    if (data) {
      if (method === 'GET') {
        // Normalize the request, so that the parameters are always in
        // the URL query, to make the request mockable by mockjax.
		    if (typeof data !== 'string') {
          data = $.param(data, true);
		    }
        var url = options.url || location.href;
        url += url.indexOf('?') >= 0 ? '&' : '?';
        url += data;
        options.url = url;
        delete options.data;
      } else {
        var contentType = options.contentType;
        if (data instanceof FormData) {
          // Unless specified by the caller, let $.ajax use "multipart/form-data"
          // with a computed boundary string by setting `false` here.
          if (contentType === undefined) {
            options.contentType = false;
          }
          options.processData = false;
        } else {
          // Unless serialized to string by the caller, wither serialize
          // to application/json or application/x-www-form-urlencoded,
          // depending on the server capabilities
          if (typeof data !== 'string') {
            options.data = formatAjaxData(data);
          }
          if (contentType === undefined) {  // Note: 'false' is a valid value, don't change it
            options.contentType = getAjaxContentType();
          }
        }
      }
    }

    function executeCall() {
      options = self.extendAjaxOptions(options);

      var deferred = $.Deferred();
      _.extend(options, {restartDeferred: deferred});
      var jqxhr = $.ajax(options)
          .progress(deferred.notify)
          .done(deferred.resolve)
          .fail(function (request, message, statusText) {
            if (request.status !== 401) {
              // Let the promise acceptors wait forever on page unload.
              if (!pageUnloading) {
                deferred.reject(request, message, statusText);
              }
            }
          });
      return addAbort(deferred.promise(), jqxhr);
    }

    return executeOrScheduleRequest.call(this, executeCall);
  }

  function executeRestartRequests() {
    var self = this;
    var executors = this.restartRequests.slice(0);
    this.restartRequests = [];
    _.each(executors, function (executor) {
      self.authenticator.setAuthenticationHeaders(executor.options.headers);
      executor.execute.apply(executor.thisObj, executor.executeOptionsArray)
          .progress(executor.deferred.notify)
          .done(executor.deferred.resolve)
          .fail(function (request, message, statusText) {
            // Let the promise acceptors wait forever on page unload.
            if (!pageUnloading) {
              executor.deferred.reject(request, message, statusText);
            }
          });
    });
  }

  function executeWaitingRequests() {
    var executors = this.waitingRequests.slice(0);
    this.waitingRequests = [];
    _.each(executors, function (executor) {
      executor.execute()
        .progress(executor.deferred.notify)
        .done(executor.deferred.resolve)
        .fail(function (request, message, statusText) {
          // Let the promise acceptors wait forever on page unload.
          if (!pageUnloading) {
            executor.deferred.reject(request, message, statusText);
          }
        });
    });
  }

  function cancelWaitingRequests(error) {
    var executors = this.waitingRequests.slice(0);
    this.waitingRequests = [];
    _.each(executors, function (executor) {
      executor.deferred.reject(error);
    });
  }

  function authenticate(success, failure) {
    if (!this.authenticationPending) {
      this.authenticationPending = true;
      var self = this;
      this.authenticator.authenticate(function () {
          self.authenticationPending = false;
          success();
        }, function (error) {
          self.authenticationPending = false;
          failure(error);
        });
    }
  }

  function reportSending(request, settings) {
    if (request && settings) {
      log.debug('Sending request as {0} to {1}.', settings.type, settings.url) &&
      console.log(log.last);
    }
  }

  function reportProgress(event, request) {
    var progress = event.lengthComputable ? _.str.sformat(
      '{0} from {1} bytes transferred', event.loaded, event.total) :
                   event.beforeSend ? 'connection opened' : 'no information';
    log.debug('Progress of {0} from {1}: {2}.', request.settings.type,
      request.settings.url, progress) && console.log(log.last);
  }

  function reportSuccess(request) {
    if (request && request.settings) {
      log.debug('Receiving response for {0} from {1}.', request.settings.type,
        request.settings.url) && console.log(log.last);
    }
  }

  function reportError(request, error) {
    if (!error) {
      if (request instanceof Error) {
        error = request;
        request = undefined;
      } else {
        error = new base.RequestErrorMessage(request);
      }
    }
    if (request && request.settings) {
      log.warn('{0} request to {1} failed:', request.settings.type, request.settings.url) &&
      console.warn(log.last);
    }
    log.warn(error) && console.warn(log.last);
    base.MessageHelper.addMessage(error.toString());
  }

  function setConflictMessage(request) {
    if (request.responseText) {
      try {
        request.responseJSON = JSON.parse(request.responseText);
      } catch (failure) {
        log.warn("Parsing error response failed: {0}.", failure)
        && console.warn(log.last);
      }
    }
    if (request.responseJSON) {
      var data = request.responseJSON;
      data.error = lang.resourceConflict;
      request.responseText = JSON.stringify(data);
    }
  }

  _.extend(Connector.prototype, Backbone.Events, {
    constructor: Connector,
    // Makes a Backbone model working with the REST API connector.
    assignTo: assignTo,
    // Returns a URL object with convenience methods like getApiBase,
    // which wraps the connection.url
    getConnectionUrl: getConnectionUrl,
    // Prepares options for the Backbone fetch method to work
    // with the REST API connector. It can be used for custom models.
    extendAjaxOptions: extendAjaxOptions,
    // Deprecated and to be removed.
    extendFetchOptions: extendAjaxOptions,
    // Preprocess the data property in $.ajax options, so that CS
    // can accept JSON in POST and PUT requests
    formatAjaxData: formatAjaxData,
    // Returns the correct content type for $.ajax options, so that CS
    // can accept JSON in POST and PUT requests
    getAjaxContentType: getAjaxContentType,
    // Shortens making an ajax call by applying extendAjaxOptions,
    // formatAjaxData and getAjaxContentType together and callig $.ajax.
    makeAjaxCall: makeAjaxCall,
    // Overriddables to extend or replace logging and/or error reporting.
    reportSending: reportSending,
    reportProgress: reportProgress,
    reportSuccess: reportSuccess,
    reportError: reportError,
    // Other utility methods and properties.
    connectionTimeout: config.connectionTimeout,
    // authentication
    authenticate: authenticate
  });

  return Connector;
});

csui.define('nuc/contexts/factories/connector',[
  'module', 'nuc/lib/underscore', 'nuc/contexts/factories/factory',
  'nuc/utils/connector'
], function (module, _, ObjectFactory, Connector) {

  var ConnectorFactory = ObjectFactory.extend({

    propertyPrefix: 'connector',

    constructor: function ConnectorFactory(context, options) {
      ObjectFactory.prototype.constructor.apply(this, arguments);

      var connector = this.options.connector || {};
      if (!(connector instanceof Connector)) {
        var config = module.config(),
            // The single connection object is used to share authentication
            // among contexts if stored in config; it cannot be cloned
            // TODO: Clone the connection. Modifying the global configuration
            // makes it accessible globally and sensive data easier to steal.
            connection = connector.connection || config.connection || {};
        // The connection object can be merged from multiple sources, which
        // may define connection and authentication parameters separately
        var privateConnection = _.defaults({}, connection, connector.connection, config.connection);
        connector = new Connector(_.defaults({
          connection: privateConnection
        }, connector, config));
      }
      this.property = connector;
    }

  });

  return ConnectorFactory;

});

csui.define('nuc/utils/errors/response',[],function () {
  'use strict';

  // Makes an Error of an error response from the server
  function ResponseError(response) {
    Error.prototype.constructor.call(this);
    this.message = response.error;
    this.details = response.errorDetail;
  }

  ResponseError.prototype = Object.create(Error.prototype);
  ResponseError.prototype.constructor = ResponseError;
  ResponseError.prototype.name = 'ServerError';

  return ResponseError;

});

csui.define('nuc/utils/errors',['nuc/lib/underscore', 'nuc/utils/errors/request',
  'nuc/utils/errors/response'
], function (_, RequestError, ResponseError) {
  'use strict';

  // Module exports
  var Errors = {

    // Converts a failure source to an Error
    getError: function (source) {
      if (!source) {
        throw new Error('No error source');
      }
      // An Error instance
      if (source instanceof Error) {
        return source;
      }
      // Failed jQuery request
      if (source.status != null && source.statusText != null) {
        return new RequestError(source);
      }
      // Server response {error, errorDetails}
      if (source.error) {
        return new ResponseError(source);
      }
      // Error message
      if (_.isString(source)) {
        return new Error(source);
      }
      throw new Error('Unrecognized source');
    }

  };

  return Errors;

});

csui.define('nuc/utils/objectstorage',["module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/log", "nuc/lib/jquery"
], function (module, _, Backbone, log, $) {
  'use strict';
  function ObjectStorage() {
    this.items = {};
  }

  _.extend(ObjectStorage.prototype,{
    constructor: ObjectStorage,
    setItem: function (k, v) {
      this.items[k] = v;
    },

    getItem: function (k) {
      return this.items[k];
    },

    removeItem: function (k) {
      delete this.items[k];
    }
  });

  return ObjectStorage;
});
csui.define('nuc/utils/namedstorage',["module", "nuc/lib/underscore", "nuc/lib/backbone", "nuc/utils/log",
  "nuc/utils/objectstorage"
], function (module, _, Backbone, log, ObjectStorage) {

  function NamedStorage(storage, name) {
    this.storage = storage;
    this.name = name;
    try {
      this.storage.setItem("testkey","testvalue");
    } catch(e) {
      this.os = new ObjectStorage();
    }
  }

  _.extend(NamedStorage.prototype, Backbone.Events, {

    constructor: NamedStorage,

    get: function (key, value) {
      return getContent.call(this)[key];
    },

    set: function (key, value) {
      var content = getContent.call(this);
      content[key] = value;
      saveContent.call(this, content);
    },

    remove: function (key) {
      var content = getContent.call(this);
      delete content[key];
      saveContent.call(this, content);
    },

    destroy: function () {
      this.storage.removeItem(this.name);
    }

  });

  function getContent() {
    var content;
    if (!!this.os) {
      content = this.os.getItem(this.name);
    } else {
      content = this.storage && this.storage.getItem(this.name);
    }
    return (content && JSON.parse(content)) || {};
  }

  function saveContent(content) {
    if(!!this.os) {
      this.os.setItem(this.name, JSON.stringify(content));
    } else {
      this.storage && this.storage.setItem(this.name, JSON.stringify(content));
    }
  }

  NamedStorage.extend = Backbone.View.extend;
  NamedStorage.version = '1.0';

  return NamedStorage;

});

csui.define('nuc/utils/namedlocalstorage',["module", "nuc/utils/log", "nuc/utils/namedstorage"
], function (module, log, NamedStorage) {

  if (localStorage === undefined) {
    log.warn("Local storage is not available." +
             "  Some information will not be able to be persisted;" +
             " expanded/collapsed state of facet filters, for example.") &&
    console.warn(log.last);
  }

  var NamedLocalStorage = NamedStorage.extend({

    constructor: function NamedLocalStorage(name) {
      NamedStorage.prototype.constructor.call(this, localStorage, name);
    }

  });

  NamedLocalStorage.version = '1.0';

  return NamedLocalStorage;

});

csui.define('nuc/utils/namedsessionstorage',["module", "nuc/utils/log", "nuc/utils/namedstorage"
], function (module, log, NamedStorage) {

  if (sessionStorage === undefined) {
    log.warn("Session storage is not available." +
             "  Some information will not be able to save temporarily;" +
             " authenticated state, for example.") && console.warn(log.last);
  }

  var NamedSessionStorage = NamedStorage.extend({

    constructor: function NamedSessionStorage(name) {
      NamedStorage.prototype.constructor.call(this, sessionStorage, name);
    }

  });

  NamedSessionStorage.version = '1.0';

  return NamedSessionStorage;

});

csui.define('nuc/utils/page.leaving.blocker',['module', 'nuc/lib/jquery'], function (module, $) {

  var listenerRegistered,
      forceDisabled,
      messages = [],

      PageLeavingBlocker = {

        isEnabled: function () {
          return !forceDisabled && messages.length;
        },

        enable: function (message) {
          // The most recent message will be shown, when the user
          // tries to leave the page
          messages.unshift(message);
          ensureListener();
        },

        disable: function () {
          messages.shift();
        },

        forceDisable: function () {
          forceDisabled = true;
        }

      };

  function ensureListener() {
    if (!listenerRegistered) {
      listenerRegistered = true;
      $(window).on('beforeunload.' + module.id, function (event) {
        if (PageLeavingBlocker.isEnabled()) {
          var message = messages[0];
          if (event) {
            event.originalEvent.returnValue = message; // Gecko, Trident, Chrome 34+
          }
          return message; // Gecko, WebKit, Chrome <34
        }
      });
    }
  }

  return PageLeavingBlocker;

});

csui.define('nuc/utils/authenticators/authenticator',[
  'nuc/lib/underscore', 'nuc/lib/backbone'
], function (_, Backbone) {
  'use strict';

  // Defines the authentication interface.
  function Authenticator(options) {
    this.connection = options && options.connection || {};
  }

  _.extend(Authenticator.prototype, Backbone.Events, {
    authenticate: function (options, succeeded, failed) {
      // Normalize input parameters, which are all optional.
      if (typeof options === 'function') {
        failed = succeeded;
        succeeded = options;
        options = undefined;
      }
      options || (options = {});

      this.syncStorage(options.session);
      if (this.doAuthenticate(options, succeeded, failed)) {
        return this;
      }

      if (this.isAuthenticated()) {
        if (succeeded) {
          succeeded(this.connection);
        }
      } else {
        var error = new Error('Missing authentication parameters.');
        if (failed) {
          failed(error, this.connection);
        } else {
          throw error;
        }
      }
      return this;
    },

    setUserId: function (userId) {
      this.userId = userId;
    },

    getUserId: function () {
      return this.userId;
    },

    doAuthenticate: function (options) {
    },

    unauthenticate: function (options) {
      return this;
    },

    isAuthenticated: function () {
      return false;
    },

    syncStorage: function (session) {
      return this;
    },

    setAuthenticationHeaders: function (headers) {
    },

    updateAuthenticatedSession: function (session) {
    }

  });

  Authenticator.extend = Backbone.View.extend;

  return Authenticator;
});

csui.define('nuc/utils/authenticators/server.adaptors/basic.mixin',[
  'nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        prepareRequest: function (options) {
          // Allow calling the login() method directly with partial
          // request settings overriding the authenticator defaults.
          var credentials = options && options.data ||
                            this.connection.credentials;
          return {
            url: Url.combine(this.connection.url, 'auth'),
            headers: {
              authorization: this.formatAuthorizationHeader(credentials)
            }
          };
        }
      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('nuc/utils/authenticators/basic.authenticator',[
  'module', 'nuc/lib/underscore', 'nuc/lib/jquery', 'nuc/utils/base',
  'nuc/utils/url', 'nuc/utils/log', 'nuc/utils/namedsessionstorage',
  'nuc/utils/authenticators/authenticator',
  'nuc/models/mixins/uploadable/uploadable.mixin',
  'nuc/utils/authenticators/server.adaptors/basic.mixin'
], function (module, _, $, base, Url, log, NamedSessionStorage,
    Authenticator, UploadableMixin, ServerAdaptorMixin) {
  'use strict';

  var config = _.extend({
    rememberCredentials: true
  }, module.config());

  var storage = new NamedSessionStorage(module.id);

  // Authenticates the requests using the Base Authentication standard;
  // by sending encoded credentials in every request.
  var BasicAuthenticator = Authenticator.extend({
    constructor: function BasicAuthenticator(options) {
      Authenticator.prototype.constructor.call(this, options);
      this.credentials = options && options.credentials;
      this.makeServerAdaptor(options);
    },

    check: function (options, succeeded, failed) {
      log.debug('Checking credentials with {0}.', this.connection.url)
      && console.log(log.last);
      var settings = this.prepareRequest(options);
      return this.makeRequest(settings, succeeded, failed);
    },

    prepareRequest: function (options) {
      return options;
    },

    makeRequest: function (options, succeeded, failed) {
      var headers = _.extend({}, this.connection.headers, options.headers);
      return $.ajax(_.extend({
        timeout: this.connectionTimeout,
        context: this,

        beforeSend: function (request, settings) {
          request.settings = settings;
        },

        success: function (response, textStatus, request) {
          log.debug('Receiving credentials-checking response from {0}.',
              this.connection.url) && console.log(log.last);
          this.doAuthenticate(options);
          if (succeeded) {
            succeeded(this.connection);
          }
          this.trigger('loggedIn', {
            sender: this,
            connection: this.connection
          });
        },

        error: function (request) {
          var error = new base.RequestErrorMessage(request);
          log.warn('Check credentials with {0} failed:\r\n{1}',
            this.connection.url, error) && console.warn(log.last);
          if (failed) {
            failed(error, this.connection);
          }
        }
      }, options, {
        headers: headers
      }));
    },

    doAuthenticate: function (options, succeeded, failed) {
      var credentials = options.credentials ||
                        this.credentials ||
                        this.connection.credentials;
      if (credentials) {
        this.connection.credentials = credentials;
        if (config.rememberCredentials) {
          storage.set(this.connection.url, credentials);
        }
      }
    },

    unauthenticate: function (options) {
      var first = this.isAuthenticated();
      this.connection.credentials = undefined;
      if (config.rememberCredentials) {
        storage.remove(this.connection.url);
      }
      if (first) {
        this.trigger('loggedOut', {
          sender: this,
          connection: this.connection,
          reason: options && options.reason
        });
      }
      return this;
    },

    isAuthenticated: function () {
      return !!this.connection.credentials;
    },

    syncStorage: function () {
      if (!this.connection.credentials && config.rememberCredentials) {
        this.connection.credentials = storage.get(this.connection.url);
      }
      return this;
    },

    setAuthenticationHeaders: function (headers) {
      headers.authorization = this.formatAuthorizationHeader(
        this.connection.credentials);
    },

    formatAuthorizationHeader: function (credentials) {
      return 'Basic ' + btoa(unescape(encodeURIComponent(
        credentials.username + ':' + credentials.password)));
    }
  });

  ServerAdaptorMixin.mixin(BasicAuthenticator.prototype);

  return BasicAuthenticator;
});

csui.define('nuc/utils/authenticators/ticket.authenticator',[
  'module', 'nuc/lib/underscore',
  'nuc/utils/authenticators/authenticator',
  'nuc/utils/namedsessionstorage'
], function (module, _, Authenticator, NamedSessionStorage) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
      .config['nuc/utils/authenticator'] || {};
  config = _.extend({
    rememberTicket: true,
    ticketHeader: 'OTCSTicket',
    ticketExpirationHeader: 'OTCSTicketExpires',
    dateHeader: 'Date'
  }, config, module.config());
  config.ticketHeader = config.ticketHeader.toLowerCase();
  config.ticketExpirationHeader = config.ticketExpirationHeader.toLowerCase();
  config.dateHeader = config.dateHeader.toLowerCase();

  var storage = new NamedSessionStorage(module.id);

  // Supports authentication using the explicit ticket provided
  // in {session: titket}.
  var TicketAuthenticator = Authenticator.extend({
    constructor: function TicketAuthenticator(options) {
      Authenticator.prototype.constructor.call(this, options);
    },

    unauthenticate: function (options) {
      this.connection.session = undefined;
      if (config.rememberTicket) {
        storage.remove(this.connection.url);
      }
      this.trigger('loggedOut', {
        sender: this,
        connection: this.connection,
        reason: options && options.reason
      });
      return this;
    },

    isAuthenticated: function () {
      var session = this.connection.session;
      return !!(session && session.ticket);
    },

    syncStorage: function (session) {
      session || (session = this.connection.session);
      if (!session && config.rememberTicket) {
        // no session -> try to get from session storage
        session = storage.get(this.connection.url);
      }
      if (session) {
        // session -> update
        this.connection.session || (this.connection.session = {});
        _.extend(this.connection.session, session);
      }
      return this;
    },

    setAuthenticationHeaders: function (headers) {
      var session = this.connection.session,
          ticket = session && session.ticket;
      if (ticket) {
        headers[config.ticketHeader] = ticket;
        return true;
      }
    },

    updateAuthenticatedSession: function (data, request) {
      data || (data = {});
      if (!request && data.getResponseHeader) {
        request = data;
        data = {};
      }
      var ticket = data.ticket || request &&
                   request.getResponseHeader(config.ticketHeader);
      if (ticket) {
        var session = this.connection.session ||
                      (this.connection.session = {});
        _.extend(session, {
          ticket: ticket,
          expires: data.expires || request &&
                   request.getResponseHeader(config.ticketExpirationHeader),
          serverDate: data.serverDate || request &&
                   request.getResponseHeader(config.dateHeader)
        });        
        if (config.rememberTicket) {
          storage.set(this.connection.url, session);
        }
      }
    }

  });

  return TicketAuthenticator;
});

csui.define('nuc/utils/authenticators/request.authenticator',[
  'module', 'nuc/lib/jquery', 'nuc/lib/underscore',
  'nuc/utils/base', 'nuc/utils/url', 'nuc/utils/log',
  'nuc/models/mixins/uploadable/uploadable.mixin',
  'nuc/utils/authenticators/ticket.authenticator',
  'nuc/lib/jquery.parse.param'
], function (module, $, _, base, Url, log, UploadableMixin,
     TicketAuthenticator) {
  'use strict';
 

  var config = window.csui.requirejs.s.contexts._.config
  .config['nuc/utils/requestauthenticator'] || {};
  config = _.extend({
    connectionTimeout: 60 * 1000
  }, config, module.config());

  // Performs authentication using an initial request, which is supposed to
  // obtain the OTCSTicket.  Descendants decide what request and how to
  // process its response.
  var RequestAuthenticator = TicketAuthenticator.extend({
    constructor: function RequestAuthenticator(options) {
      TicketAuthenticator.prototype.constructor.call(this, options);
    },

    prepareRequest: function (options) {
      return options;
    },

    parseResponse: function (response, request) {
      return response;
    },

    login: function (options, succeeded, failed) {
      delete this.connection.session;
      log.debug('Sending authentication request to {0}.', this.connection.url)
        && console.log(log.last);
      options = _.extend({}, { type: 'POST', contentType: 'application/json'}, options);
      var settings = this.prepareRequest(options);
      this.updateRequestBody(settings);
      return this.makeRequest(settings, succeeded, failed);
    },


    // The makeAjaxCall function is required to perform a signOut (secureRequestToken) 
    // or for continue session. It is used by expiration warning handling.
    makeAjaxCall: function(options) {
      var headers = _.extend({}, this.connection.headers, options.headers);
      return $.ajax(_.extend({

        url: options.url,

        timeout: this.connectionTimeout,
        context: this,

        beforeSend: function (request, settings) {
          request.settings = settings;
        },

        success: function (response, textStatus, request) {
          log.debug('Receiving request response from {0}.', options.url)
            && console.log(log.last);
          response = this.parseResponse(response, request);
          if (options.success) {
            options.success.call(this, this.connection);
          }
        },

        error: function (request) {
          var error = new base.RequestErrorMessage(request);
          log.warn('Logging in to {0} failed:\r\n{1}',
            this.connection.url, error) && console.warn(log.last);
          if (options.error) {
            options.error.call(this, error, this.connection);
          }
        }
      }, options, {
        headers: headers
      }));
    },

    makeRequest: function (options, succeeded, failed) {      

      function authsuccess(response, textStatus, request) {
        log.debug('Receiving authentication response from {0}.', this.connection.url)
          && console.log(log.last);
        response = this.parseResponse(response, request);
        if (this.authenticateSession(response, request)) {
          if (succeeded) {
            succeeded.call(this, this.connection);
          }
          this.trigger('loggedIn', {
            sender: this,
            connection: this.connection
          });
        }
      }

      function autherror(request) {
        var error = new base.RequestErrorMessage(request);
        log.warn('Logging in to {0} failed:\r\n{1}',
          this.connection.url, error) && console.warn(log.last);
        if (failed) {
          failed.call(this, error, this.connection);
        }
      }

      var callOptions = _.extend({
        url: Url.combine(this.connection.url, 'auth'),
        success: authsuccess,
        error: autherror
      }, options);

      return this.makeAjaxCall(callOptions);
    },

    updateRequestBody: function (settings) {
      var data;
      if (UploadableMixin.useJSON || UploadableMixin.mock) {
        if (settings.contentType !== 'application/json') {
          settings.contentType = 'application/json';
          data = settings.data;
          if (typeof data === 'string') {
            data = $.parseParam(data);
          }
          if (UploadableMixin.mock) {
            settings.data = data;
          } else {
            settings.data = JSON.stringify(data);
          }
          settings.processData = false;
        }
      } else {
        if (settings.contentType === 'application/json') {
          settings.contentType = 'application/x-www-form-urlencoded';
          data = settings.data;
          if (typeof data === 'string') {
            settings.data = JSON.parse(data);
          }
          if (UploadableMixin.mock) {
            settings.data = data;
          }
          settings.processData = true;
        }
      }
    },

    authenticateSession: function (response, request) {
      if (response && response.ticket) {
        if (request && request.settings && request.settings.data) {
          log.info('Logging in to {0} as {1} succeeded.',
              this.connection.url, request.settings.data.username)
          && console.log(log.last);          
        }
        this.updateAuthenticatedSession(response, request);
        return true;
      }
      return true;
    },

    unauthenticate: function (options) {
      var first = this.isAuthenticated();
      TicketAuthenticator.prototype.unauthenticate.apply(this, arguments);
      if (first) {
        this.trigger('loggedOut', {
          sender: this,
          connection: this.connection,
          reason: options && options.reason
        });
      }
      return this;
    },
    
    connectionTimeout: config.connectionTimeout
  });

  return RequestAuthenticator;
});

csui.define('nuc/utils/authenticators/server.adaptors/credentials.mixin',[
  'nuc/lib/underscore', 'nuc/utils/url'
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        prepareRequest: function (options) {
          // Allow calling the login() method directly with partial
          // request settings overriding the authenticator defaults.
          var credentials = options && options.data ||
                            this.connection.credentials;
          return {
            type: 'POST',
            url: Url.combine(this.connection.url, 'auth'),
            data: {
              username: credentials.username,
              password: credentials.password,
              domain: ''
            }
          };
        }
      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('nuc/utils/authenticators/credentials.authenticator',[
  'require', 'nuc/utils/authenticators/request.authenticator',
  'nuc/utils/authenticators/server.adaptors/credentials.mixin'
], function (require, RequestAuthenticator, ServerAdaptorMixin) {
  'use strict';

  // Authenticates the requests using the Base Authentication standard;
  // by sending encoded credentials in every request.
  var CredentialsAuthenticator = RequestAuthenticator.extend({
    constructor: function CredentialsAuthenticator(options) {
      RequestAuthenticator.prototype.constructor.call(this, options);
      this.credentials = options && options.credentials;
      this.makeServerAdaptor(options);
    },

    doAuthenticate: function (options, succeeded, failed) {
      var credentials = options.credentials ||
                        this.credentials ||
                        this.connection.credentials,
          self = this;
      if (credentials) {
        this.connection.credentials = credentials;
        this.login({}, succeeded, function (error, connection) {
          self._reportError(error);
          self.unauthenticate({reason: 'failed'});
          if (failed) {
            failed(error, connection);
          }
        });
        return true;
      }
    },

    _reportError: function (error) {
      csui.require(['csui/dialogs/modal.alert/modal.alert'
      ], function (ModalAlert) {
        ModalAlert.showError(error.toString());
      });
    }
  });

  ServerAdaptorMixin.mixin(CredentialsAuthenticator.prototype);

  return CredentialsAuthenticator;
});

csui.define('nuc/utils/authenticators/server.adaptors/initial.header.mixin',[
  'nuc/lib/underscore', 'nuc/utils/url',
], function (_, Url) {
  'use strict';

  var ServerAdaptorMixin = {
    mixin: function (prototype) {
      return _.extend(prototype, {
        makeServerAdaptor: function (options) {
          return this;
        },

        prepareRequest: function (options) {
          // Allow calling the login() method directly with partial
          // request settings overriding the authenticator defaults.
          var headers = options && options.headers ||
                        this.connection.authenticationHeaders;
          return {
            url: Url.combine(this.connection.url, 'auth'),
            headers: headers
          };
        }
      });
    }
  };

  return ServerAdaptorMixin;
});

csui.define('nuc/utils/authenticators/initial.header.authenticator',[
  'require', 'nuc/utils/log',
  'nuc/utils/authenticators/request.authenticator',
  'nuc/utils/authenticators/server.adaptors/initial.header.mixin'
], function (require, log, RequestAuthenticator, ServerAdaptorMixin) {
  'use strict';

  var InitialHeaderAuthenticator = RequestAuthenticator.extend({
    constructor: function InitialHeaderAuthenticator(options) {
      RequestAuthenticator.prototype.constructor.call(this, options);
      this.makeServerAdaptor(options);
    },

    doAuthenticate: function (options, succeeded, failed) {
      var headers = options.headers ||
                    this.connection.authenticationHeaders,
          self = this;
      if (headers) {
        this.connection.authenticationHeaders = headers;
        this.login({}, succeeded, function (error, connection) {
          self._reportError(error);
          self.unauthenticate({reason: 'failed'});
          if (failed) {
            failed(error, connection);
          }
        });
        return true;
      }
    },

    authenticateSession: function (response, request) {
      if (response && response.data) {
        log.info('Logging in to {0} as {1} succeeded.',
            this.connection.url, response.data.name)
        && console.log(log.last);
        this.updateAuthenticatedSession(request);
        return true;
      }
    },

    _reportError: function (error) {
      csui.require(['csui/dialogs/modal.alert/modal.alert'
      ], function (ModalAlert) {
        ModalAlert.showError(error.toString());
      });
    }
  });

  ServerAdaptorMixin.mixin(InitialHeaderAuthenticator.prototype);

  return InitialHeaderAuthenticator;
});

csui.define('nuc/utils/authenticators/regular.header.authenticator',[
  'module', 'nuc/lib/underscore', 'nuc/utils/log',
  'nuc/utils/authenticators/authenticator', 'nuc/utils/namedsessionstorage'
], function (module, _, log, Authenticator, NamedSessionStorage) {
  'use strict';

  var config = _.extend({
    rememberAuthenticationHeaders: true
  }, module.config());

  var storage = new NamedSessionStorage(module.id);

  var RegularHeaderAuthenticator = Authenticator.extend({
    constructor: function RegularHeaderAuthenticator(options) {
      Authenticator.prototype.constructor.call(this, options);
    },

    doAuthenticate: function (options, succeeded, failed) {
      var headers = options.headers ||
                    this.connection.authenticationHeaders;
      if (headers) {
        this.connection.authenticationHeaders = headers;
        if (config.rememberAuthenticationHeaders) {
          storage.remove(this.connection.url);
        }
      }
    },

    unauthenticate: function (options) {
      this.connection.authenticationHeaders = undefined;
      if (config.rememberAuthenticationHeaders) {
        storage.remove(this.connection.url);
      }
      return this;
    },

    isAuthenticated: function () {
      return !!this.connection.authenticationHeaders;
    },

    syncStorage: function () {
      if (!this.connection.authenticationHeaders &&
          config.rememberAuthenticationHeaders) {
        this.connection.authenticationHeaders = storage.get(this.connection.url);
      }
      return this;
    },

    setAuthenticationHeaders: function (headers) {
      _.extend(headers, this.connection.authenticationHeaders);
    }
  });

  return RegularHeaderAuthenticator;
});

csui.define('nuc/utils/authenticators/nuc.authenticators',[
  'module', 'nuc/lib/underscore',
  'nuc/utils/authenticators/ticket.authenticator',
  'nuc/utils/authenticators/basic.authenticator',
  'nuc/utils/authenticators/credentials.authenticator',
  'nuc/utils/authenticators/regular.header.authenticator',
  'nuc/utils/authenticators/initial.header.authenticator'
], function (module, _, TicketAuthenticator, BasicAuthenticator,
     CredentialsAuthenticator, RegularHeaderAuthenticator,
     InitialHeaderAuthenticator) {
  'use strict';

  var config = window.csui.requirejs.s.contexts._.config
      .config['nuc/utils/interactiveauthenticator'] || {},
      originalConfig = module.config();
  config = _.extend({
    // Even if there are no credentials, use Basic Authenticaton and hope
    // for satisfying the authentication challenge later.
    forceBasicAuthenticator: false,
    // If credentials are provided, use Basic Authenticstion for all calls
    // instead of making just an initial call with them to get a ticket.
    preferBasicAuthenticator: false,
    // If custom headers are provided, use them for all calls
    // instead of making just an initial call with them to get a ticket.
    preferRegularHeaderAuthenticator: false
  }, originalConfig);

  return [
    {
      authenticator: BasicAuthenticator,
      sequence: 50,
      decides: function (connection) {
        return config.forceBasicAuthenticator ||
               connection.credentials && config.preferBasicAuthenticator;
      }
    },
    {
      authenticator: RegularHeaderAuthenticator,
      sequence: 50,
      and: {
        has: 'authenticationHeaders',
        decides: function () {
          return config.preferRegularHeaderAuthentication;
        }
      }
    },
    {
      authenticator: CredentialsAuthenticator,
      has: 'credentials'
    },
    {
      authenticator: InitialHeaderAuthenticator,
      has: 'authenticationHeaders'
    },
    {
      sequence: 1000,
      authenticator: TicketAuthenticator
    }
  ];
});

csui.define('nuc/utils/authenticator',[
  'nuc/utils/authenticators/ticket.authenticator'
], function (TicketAuthenticator) {
  'use strict';

  // TODO: Deprecate this module in favour of depending
  // on the connector automation, or using the new one.
  return TicketAuthenticator;
});

csui.define('nuc/utils/basicauthenticator',[
  'nuc/utils/authenticators/credentials.authenticator'
], function (CredentialsAuthenticator) {
  'use strict';

  // TODO: Deprecate this module in favour of depending
  // on the connector automation.
  return CredentialsAuthenticator;
});

csui.define('nuc/utils/headerauthenticator',[
  'nuc/utils/authenticators/initial.header.authenticator'
], function (InitialHeaderAuthenticator) {
  'use strict';

  // TODO: Deprecate this module in favour of depending
  // on the connector automation.
  return InitialHeaderAuthenticator;
});

csui.define('nuc/utils/requestauthenticator',[
  'nuc/utils/authenticators/request.authenticator'
], function (RequestAuthenticator) {
  'use strict';

  // TODO: Deprecate this module in favour of using
  // the new one.
  return RequestAuthenticator;
});

csui.define('bundles/nuc-models',[
  // Models
  'nuc/models/action',
  'nuc/models/actions',
  'nuc/models/actionitem',
  'nuc/models/actionitems',
  'nuc/models/addabletype',
  'nuc/models/addabletypes',
  'nuc/models/ancestor',
  'nuc/models/ancestors',
  'nuc/models/authenticated.user',
  'nuc/models/authentication',
  'nuc/models/clientsidecollection',
  'nuc/models/column',
  'nuc/models/columns',
  'nuc/models/datadefinition',
  'nuc/models/datadefinitions',
  'nuc/models/member',
  'nuc/models/member/member.model',
  'nuc/models/member/membercollection',
  'nuc/models/members',
  'nuc/models/node/node.addable.type.collection',
  'nuc/models/node/node.model',
  'nuc/models/node.children2/node.children2',
  'nuc/models/node.columns2',
  'nuc/models/nodeancestors',
  'nuc/models/nodechildrencolumn',
  'nuc/models/nodechildrencolumns',
  'nuc/models/nodechildren',
  'nuc/models/node.actions',
  'nuc/models/nodes',
  'nuc/models/tool.item.config/tool.item.config.collection',
  'nuc/models/tool.item.mask/tool.item.mask.collection',

  // Model mixins
  'nuc/models/browsable/browsable.mixin',
  'nuc/models/browsable/client-side.mixin',
  'nuc/models/browsable/v1.request.mixin',
  'nuc/models/browsable/v1.response.mixin',
  'nuc/models/browsable/v2.response.mixin',
  'nuc/models/mixins/appcontainer/appcontainer.mixin',
  'nuc/models/mixins/autofetchable/autofetchable.mixin',
  'nuc/models/mixins/commandable/commandable.mixin',
  'nuc/models/mixins/connectable/connectable.mixin',
  'nuc/models/mixins/delayed.commandable/delayed.commandable.mixin',
  'nuc/models/mixins/expandable/expandable.mixin',
  'nuc/models/mixins/fetchable/fetchable.mixin',
  'nuc/models/mixins/including.additional.resources/including.additional.resources.mixin',
  'nuc/models/mixins/node.autofetchable/node.autofetchable.mixin',
  'nuc/models/mixins/node.connectable/node.connectable.mixin',
  'nuc/models/mixins/node.resource/node.resource.mixin',
  'nuc/models/mixins/resource/resource.mixin',
  'nuc/models/mixins/rules.matching/rules.matching.mixin',
  'nuc/models/mixins/state.carrier/state.carrier.mixin',
  'nuc/models/mixins/state.requestor/state.requestor.mixin',
  'nuc/models/mixins/syncable.from.multiple.sources/syncable.from.multiple.sources.mixin',
  'nuc/models/mixins/uploadable/uploadable.mixin',
  'nuc/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
  'nuc/models/mixins/v2.commandable/v2.commandable.mixin',
  'nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
  'nuc/models/mixins/v2.expandable/v2.expandable.mixin',
  'nuc/models/mixins/v2.fields/v2.fields.mixin',
  'nuc/models/autofetchable',
  'nuc/models/connectable',
  'nuc/models/expandable',
  'nuc/models/fetchable',
  'nuc/models/including.additional.resources',
  'nuc/models/nodeautofetchable',
  'nuc/models/nodeconnectable',
  'nuc/models/noderesource',
  'nuc/models/resource',
  'nuc/models/uploadable',
  'nuc/models/utils/v1tov2',

  // Contexts
  'nuc/contexts/context',
  'nuc/contexts/synchronized.context',
  'nuc/contexts/context.plugin',
  'nuc/contexts/fragment/context.fragment',
  'nuc/contexts/mixins/clone.and.fetch.mixin',
  'nuc/contexts/page/page.context',
  'nuc/contexts/factories/connector',
  'nuc/contexts/factories/factory',

  // Utilities
  'nuc/utils/base',
  'nuc/utils/connector',
  'nuc/utils/deepClone/deepClone',
  'nuc/utils/errormessage',
  'nuc/utils/errors',
  'nuc/utils/errors/request',
  'nuc/utils/errors/response',
  'nuc/utils/log',
  'nuc/utils/messagehelper',
  'nuc/utils/namedlocalstorage',
  'nuc/utils/namedsessionstorage',
  'nuc/utils/namedstorage',
  'nuc/utils/page.leaving.blocker',
  'nuc/utils/promoted.actionitems',
  'nuc/utils/types/date',
  'nuc/utils/types/localizable',
  'nuc/utils/types/member',
  'nuc/utils/types/number',
  'nuc/utils/url',

  // Authenticators
  'nuc/utils/authenticators/authenticator',
  'nuc/utils/authenticators/authenticators',
  'nuc/utils/authenticators/basic.authenticator',
  'nuc/utils/authenticators/credentials.authenticator',
  'nuc/utils/authenticators/initial.header.authenticator',
  'nuc/utils/authenticators/nuc.authenticators',
  'nuc/utils/authenticators/regular.header.authenticator',
  'nuc/utils/authenticators/request.authenticator',
  'nuc/utils/authenticators/ticket.authenticator',
  'nuc/utils/authenticator',
  'nuc/utils/basicauthenticator',
  'nuc/utils/headerauthenticator',
  'nuc/utils/requestauthenticator',

  // Server Adaptors
  // TODO: Move them to the csui-server-adaptors bundle.
  'nuc/models/authenticated.user/server.adaptor.mixin',
  'nuc/models/member/server.adaptor.mixin',
  'nuc/models/member/membercollection.server.adaptor',
  'nuc/models/member/members.server.adaptor',
  'nuc/models/node/server.adaptor.mixin',
  'nuc/models/node.children/server.adaptor.mixin',
  'nuc/models/node.children2/server.adaptor.mixin',
  'nuc/utils/authenticators/server.adaptors/basic.mixin',
  'nuc/utils/authenticators/server.adaptors/credentials.mixin',
  'nuc/utils/authenticators/server.adaptors/initial.header.mixin',
  'nuc/models/member/member.server.adaptor.mixin',
], {});

