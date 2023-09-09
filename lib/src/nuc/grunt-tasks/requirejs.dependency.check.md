# requirejsDependencyCheck

Checks if modeules in specified bundles depend only on public modules
from other components. Depending on public modules across bundles within
a single component is checked by requirejsBundleCheck. Modules from other
components are usually excluded from processing by pointing their
prefixes to "empty:" to improve build performance. This task helps to
check, that your component will work in the release mode too, regardless
the order of loading of other component bundles.

The `bundles` parameter has the same format as the `modules` parameter
of the requirejs task, if multiple modules are produced. The `config`
parameter needs the same object literal, which is passed to
`require.config` in the `mainConfigFile` parameter of the requirejs
task.  The parameter `appDir` is the same as for the requirejs task.
The component prefix for the RequireJS modules is expected too.
The parameter `dependencies` is an array with module ids, which are
exposed as public by all components, which your component depends on.

    requirejsDependencyCheck: {
      all: {
        options: {
          prefix: 'greet',
          appDir: '.', // optional
          bundleDir: '../out-debug', // optional
          config: {...},
          bundles: [
            {
              name: 'bundles/greet-all',
              exclude: [ '...' ]
            }
          ],
          dependencies: [ '...', '...' ],
          allowIndexedPrivateModules: false // optional
        }
      }
    }
