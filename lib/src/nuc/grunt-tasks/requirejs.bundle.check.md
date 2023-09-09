# requirejsBundleCheck

Checks if a bundle index does not contain a module, which is loaded
as one of dependencies of some module from other index.

The `dependencies` parameter has the same format as the `modules`
parameter of the requirejs task, if multiple modules are produced.
The parameter `appDir` is the same as for the requirejs task.
The component prefix for the RequireJS modules is expected too.

    requirejsBundleCheck: {
      all: {
        options: {
          appDir: '.', // optional
          bundleDir: '../out-debug', // optional
          bundles: [
            {
              name: 'bundles/test-part2',
              exclude: ['bundles/test-part1']
            }
          ]
        }
      }
    }

If an error is reported, search the sources for modules, which depend
on the module name printed out.  You should spot a module, which does
not belong to the bundle of the reported module.  It can be also a
module depending on the module, which depends on the reported module
directly.
