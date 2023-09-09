# Global Functions

There are global functions exposed in the `csui` namespace, which serve for Smart UI initialisation and compatibility with CS UI Widgets.

## onReady3(options, [modules, ] success [, failure])

Ensures that the requested RequireJS modules are loaded and executes the specified callback. If called for the first time, it loads and applies the global configuration using the `/api/v1/csui/settings/` resource.

Make sure that you configure Smart UI by `csui.setLanguage`, `csui.setLogging`  and `csui.require.config`  *before* calling `csui.onReady3`. Later changes of the global configuration may not have the desired effect.

This method replaced `csui.onReady` and `csui.onReady2`. The old functions are kept for compatibility, but because the do not load the global configuration, some newer features in the displayed widgets will not work.

###  Example

    csui.onReady3({
      connection: {
        url: '//server/otcs/cs/api/v1',
        supportPath: '/otcssupport',
        session: { ticket: '...' }
      }
    },
    [ 'csui-options', 'csui/integration/folderbrowser/folderbrowser.widget' ],
    function (options, FolderBrowserWidget) {
      var browser = new FolderBrowserWidget({ connection: options.connection });
      browser.show({ placeholder: '#folder-browser' });
    },
    function (error) {
      alert(error.message);
    });

If you need to override or extend some global configuration sent by the server, you can add a callback `onBeforeLoadModules` to the `options` parameter:

    var connection = {
      url: '//server/otcs/cs/api/v1',
      supportPath: '/otcssupport',
      session: { ticket: '...' }
    };
    csui.onReady3({
      connection: connection,
      onBeforeLoadModules: function (options, modules) {
        // call csui.require.config() here
      }
    },
    [ 'csui/integration/folderbrowser/folderbrowser.widget' ],
    function (FolderBrowserWidget) {
      var browser = new FolderBrowserWidget({ connection: connection });
      browser.show({ placeholder: '#folder-browser' });
    });

Do not change parameters of the `i18n` module in the `onBeforeLoadModules` callback. The language has to be chosen before calling `csui.onReady3`.

## setLanguage(language [, country])

Sets the UI locale to request loading of static assets from the corresponding language pack, when `csui.onReady3` is called for the first time. If the language pack is not available, English will be used.
  available, the UI will default to English (United States).

The language selection done by this function can be undone by calling this function with `null`.

This function has an effect only when called before `csui.onReady3`.

### Example

    csui.setLanguage('fr-FR');

This function exists for compatibility with CS UI Widgets. The configuration can be done by `csui.require.config` with other configuration parameters:

    csui.require.config({
      config: {
        i18n: { locale: 'fr-fr' }
      }
    });

## needsRTL(locale)

Checks if the specified locale needs the text-writing direction set to right-to-left.

### Example

    var locale = 'ar';
    var stylesheet = csui.needsRTL(locale) ? 'theme-rtl.css' : 'theme.css';

Calling `csui.setLangauge` sets the `rtl` flag automatically. If you use `csui.requi.config`, you have to set both `locale` and `rtl` appropriately.

    csui.require.config({
      config: {
        i18n: { locale: 'ar', rtl: true }
      }
    });

## setLogging

Sets up logging. The default logging prints messages only on the web browser console with the level `WARN`.

This function has an effect only when called before `csui.onReady3`.

### Example

    csui.setLogging({
      level: 'DEBUG', // available levels are ERROR, WARN, INFO, DEBUG
      page: true // available targtes: console, page, window
    });

This function exists for compatibility with CS UI Widgets. The configuration can be done by `csui.require.config` with other configuration parameters:

    csui.require.config({
      config: {
        csui/utils/log: {
          level: 'DEBUG',
          page: true
        }
      }
    });

## getVersion()

Gets the version of the `csui` component, for example '16.2.0.12345'.

###  Example

    var version = csui.getVersion();
    if(/^16\.0/.test(version)) console.warn('unsupported version');

## getExtensionModules(success [, failure])

Returns all registered Smart UI extensions.

### Example:

    csui.getExtensionModules(function (extensions) {
      console.log(extensions);
    });

And the promised value:

    [
      {
        "id": "csui",
        "title": "Content Server UI Widgets",
        "version": "16.2.3.12345",
        "helpDocId": "cssui160208-h-ugd"
      },
      {
        "id": "esoc",
        "title": "Content Server Collaboration",
        "version": "16.2.0"
      },
      ...
    ]

## printExtensionModules()

Prints all registered Smart UI extensions on the console. Similar to `csui.getExtensionModules`.

### Example:

    csui.printExtensionModules();
