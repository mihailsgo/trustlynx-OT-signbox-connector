# requirejsContentCheck

Checks if output bundles do not contain modules outside the owning
component. If it did, some of its dependencies would not be properly
excluded.

The `prefix` parameter has to contain the component prefix, which
appears at the beginning of each module path, when used in `define`
or `require` statements. The `bundles` parameter has to contain an
array of paths to output bundles. The `exceptions` parameter may
contain module names that are supposed to be included in the bundle,
but that do not start with `<prefix>/`. RequireJS plugins can be
bundled like this using their abbreviations as the module name.

    requirejsContentCheck: {
      release: {
        options: {
          prefix: 'xecmpf', // optional
          bundles: [
            '../out-release/bundles/xecmpf-core.js',
            '../out-release/bundles/xecmpf-app.js'
          ],
          exceptions: [] // optional
        }
      }
    }

Alternatively, the bundle configuration for the requirejs task can be
passed in as-is together with an output directory with the built bundles.

    requirejsContentCheck: {
      release: {
        options: {
          prefix: 'xecmpf', // optional
          bundles: [
            {
              name: 'bundles/xecmpf-core',
              exclude: [ '...' ]
            },
            {
              name: 'bundles/xecmpf-app',
              exclude: [ '...' ]
            }
          ],
          bundleDir: '../out-debug', // optional
          exceptions: [] // optional
        }
      }
    }

If an error is reported, check the `exclude` parameter of the bundle
configuration in the `requirejs` task. It has to point to an array
with all public modules exposed by components that you depend on.
