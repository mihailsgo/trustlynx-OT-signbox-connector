# Log

Configurable logging.

## Synopsis

The default logger uses the global configuration:

```js
require(['nuc/utils/log'], function (log) {
  log.info('Module loaded.') && console.info(log.last);
});
```

Log factory allows configuring the log level on a module basis:

```js
require(['module', 'nuc/utils/log'], function (module, log) {
  log = log(module.id);
  log.debug('Module {0} loaded.', module.id) && console.log(log.last);
});
```

The targets where to log to and the default log level threshold can be set globally:

```js
require.config({
  config: {
    'nuc/utils/log': {
      page: true,
      level: 'DEBUG'
    }
  }
});
```

The log level threshold can be changed for any specific module:

```js
require.config({
  config: {
    'nuc/utils/log': {
      modules: {
        'csui/controls/table/table.view': { level: 'DEBUG' }
      }
    }
  }
});
```

## Usage

```ts
error(message: string [, ...parameters]): boolean
warn(message: string [, ...parameters]): boolean
info(message: string [, ...parameters]): boolean
debug(message: string [, ...parameters]): boolean
```

Issues a log message with the log level according to the method name, which will be logged, if enabled by the configuration. The parameter `message` can be either a formatted message or a message forman with parameter placeholders `{N}`, where `N` is a zero-based index of the parameter. Returns `true` is the message was logged and should be logged on the console too. The property `last` contains the formatted message.

```ts
can(level: string): boolean
```

Check if the current log level is above the configured threshold and logging is enabled. It means that a message with that log level will be logged. The log levels are `'ERROR'`, `'WARN'`, `'INFO'` and `'DEBUG'`.

```ts
last: string
```

The last formatted log message.

```ts
time(scope: string): void
```

Starts measuring time in a named scope, if enabled by the configuration.

```ts
timeEnd(scope: string): void
```

Ends measuring time in a named scope and prints the time duration on the console, if enabled by the configuration.

```ts
getObjectName(instance: object): string
```

Returns the name of the function object (class) of the specified object instance.

```ts
getStackTrace([frameCountToSkip: number]): string
```

Returns the call stack at the place where it is called, without the call to `getStackTrace` itself. The parameter `frameCountToSkip` can be used to omit further frames from the top.

## Configuration

The configuration parameters have to be set before the first module gets loaded. Later changes will have no effect. The parameters and their default values:

```js
console: true,               // enable logging on the console
consoleRe: false,            // enable logging using https://console.re
level: 'WARN',               // change the global log level threshold
timing: false,               // enable the timing log entries
page: false,                 // enable logging to a bottom page area
performanceTimeStamp: false, // prefix every message by the issued time
moduleNameStamp: false,      // prefix every message by the originating module name
server: false,               // enable posting log messages to the server
window: false,               // enable logging to a new browser window
modules: {}                  // change the log level threshold for specific modules
```

The log levels are `'ERROR'`, `'WARN'`, `'INFO'` and `'DEBUG'`. The log level threshold can be set from the highest `'ERROR'` to the lowest `'DEBUG'`. Log messages with the log level higher or equal to the theshold will be actually logged, the others will be skipped.

If a log level threshold is set for a specific module, it will override the global value for log messages issued from the specific module. The parameter `modules` expects an object with the following content:

```ts
{
  '<module name>': { level: string, timing: boolean },
  ...
}
```

The parameter `server` can be either `false` or an object with the following parameters, including their default values:

```js
url: undefined      // the URL to post log messages to
batchSize: 10,      // post the log messages in batches instead of single
timed: true,        // enables regular flushing incomplete log batches
timerInterval: 500, // set the interval of flushing incomplete log batches,
headers: {}         // set additional HTTP headers for the log requests
```

The `url` is mandatory. It will receive `'POST'` requests with objects, for example:

```json
{
  "logger": "[default]",
  "timeStamp": 1201048234203,
  "level": "ERROR",
  "url": "http://server/otcs/cs/app",
  "message": "Object 12345 could not be accessed."
}
```

## Beyond Console

If logging is enabled for other targets that `console`, it will be supported by [log4javascript].

Setting `consoleRe` will be supplied by [Console.Re]. Setting `page` will be supplied by [InPageAppender] and [PatternLayout]. Setting `server` will be supplied by [AjaxAppender] and [JsonLayout]. Setting`window` will be supplied by [PopUpAppender] and [PatternLayout].

The module `nuc/lib/log4javascript` will be loaded on demand, which means that first log messages may be delayed. Before the module `nuc/lib/log4javascript` gets loaded, the log messages will be logged only on the console, if it is enabled. Once the module `nuc/lib/log4javascript` gets loaded, earlier messages will be sent to the logger. They will not get lost. If all log messages have to be sent to the selected targets really right away, the module `nuc/lib/log4javascript` can be forced to be loaded ahead, for example:

```js
require.config({
  paths: {
    smart: '/support/smart',
    csui: '/support/csui'
  },
  config: {
    'nuc/utils/log': {
      page: true,
      level: 'DEBUG'
    }
  },
  deps: [
    'require',
    'nuc/lib/require.config!nuc/nuc-extensions.json',
    'nuc/lib/require.config!smart/smart-extensions.json',
    'nuc/lib/require.config!csui/csui-extensions.json',
    'nuc/lib/log4javascript'
  ],
  callback: function (require) {
    require([...], function (...) {
      ...
    });
  }
})
```

[log4javascript]: http://log4javascript.org/docs/manual.html
[Console.Re]: https://console.re/
[InPageAppender]: http://log4javascript.org/docs/manual.html#inpageappender
[PatternLayout]: http://log4javascript.org/docs/manual.html#patternlayout
[AjaxAppender]: http://log4javascript.org/docs/manual.html#ajaxappender
[JsonLayout]: http://log4javascript.org/docs/manual.html#jsonlayout
[PopUpAppender]: http://log4javascript.org/docs/manual.html#popupappender
