# languagepack

Collects all localization modules using both project sources and output
module bundles. Expects bundle configuration and directories to read the
bundle output from and to write the localization bundles to.

    languagepack: {
      all: {
        options: {
          prefix: 'greet', // optional
          bundles: [
            {
              name: 'bundles/greet-all',
              exclude: [ '...' ]
            }
          ],
          bundleIndexes: {
            'bundles/greet-index': [
              'bundles/greet-all'
            ]
          },
          inputDir: '../out-debug', // optional
          outputDir: '../out-languagepack_en' // optional
        }
      }
    }
