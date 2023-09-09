# requirejsIndexCheck

Checks if modules from the bundle index module are bundled in the same bundle.
The `bundles` parameter has to contain the list of modules that are bundle

The parameter `output` is the same as the parameter `dir` of the requirejs
task. The parameter `appDir` is the same as for the requirejs task.

    requirejsIndexCheck: {
      debug: {
        options: {
          prefix: 'csui', // optional
          appDir: '.', // optional
          bundles: [
            'bundles/test-part1',
            'bundles/test-part2'
          ],
          output: '../out-debug' // optional
        }
      }
    }

Alternatively, the bundle configuration for the requirejs task can be
passed in as-is together with an output directory with the built bundles.

    requirejsIndexCheck: {
      debug: {
        options: {
          prefix: 'csui', // optional
          appDir: '.', // optional
          bundles: [
            {
              name: 'bundles/test-part1',
              exclude: [ '...' ]
            },
            {
              name: 'bundles/test-part1',
              exclude: [ '...' ]
            }
          ],
          output: '../out-debug' // optional
        }
      }
    }
