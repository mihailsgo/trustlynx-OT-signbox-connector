# requirejsCleanOutput

Deletes files from the build output directory, which were copied by the
requirejs task, but do not need to be shipped because they were bundled.

    requirejsCleanOutput: {
      release: {
        src: '../out-release'
      },
      debug: {
        src: '../out-debug'
      }
    }
