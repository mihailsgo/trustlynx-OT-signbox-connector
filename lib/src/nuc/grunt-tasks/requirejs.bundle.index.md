# requirejsBundleIndex

Extracts the index of all bundles to .js and .json files.

All source bundles should be passed as the `src` parameter and the
output file name without extension as the `dest` parameter. The
component prefix for the RequireJS modules is expected in the options
of this multi-task.

    requirejsBundleIndex: {
      all: {
        src: [
          'bundles/test-part1.js',
          'bundles/test-part2.js'
        ],
        dest: 'bundles/test-index',
        options: {
          prefix: 'test' // optional
        }
      }
    }

Alternatively, the bundle configuration for the requirejs task can be
passed in as-is together with an output directory with the built bundles.

    requirejsBundleIndex: {
      all: {
        bundleIndexes: {
          'bundles/test-index': [
            'bundles/test-part1',
            'bundles/test-part2'
          ]
        }
      }
    }
