/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
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

    if (config.window) {
      appender = new log4javascript.PopUpAppender();
      appender.setNewestMessageAtTop(false);
      appender.setScrollToLatestMessage(true);
      appender.setLayout(new log4javascript.PatternLayout(
        '%d{HH:mm:ss.SSS} %-5p - %m{1}'));
      logger.addAppender(appender);
    }
    if (config.page) {
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
