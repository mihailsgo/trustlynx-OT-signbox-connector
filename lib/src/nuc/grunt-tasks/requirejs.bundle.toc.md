# requirejsBundleTOC

Extracts a complete module list of the specified bundle as JSON.

    requirejsBundleTOC: {
      all: {
        src: '../out-debug/bundles/test-all.js',
        dest: '../out-debug/bundles/test-all-toc.json',
        options: {
          force: false
        }
      }
    }

Alternatively, the bundle configuration for the requirejs task can be
passed in as-is together with an output directory with the built bundles.

    requirejsBundleTOC: {
      all: {
        bundles: [
          {
            name: 'bundles/test-all',
            exclude: [ '...' ]
          }
        ],
        bundleDir: '../out-debug' // optional
      }
    }
