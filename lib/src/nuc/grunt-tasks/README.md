# Nucleus Grunt Tasks

Tasks in this directory are not available in the NPM registry and cannot be 
downloaded just by their module version from the cloud. They can be loaded
in the Gruntfile as long as you get access to this directory:
 
    grunt.loadTasks('../lib/src/nuc/grunt-tasks');

* [languagepack](./language.pack.md) - collects all localization modules using both project sources and output module bundles
* [requirejsBundleCheck](./requirejs.bundle.check.md) - checks if a bundle index does not contain a module, which is loaded as one of dependencies of some module from other index
* [requirejsBundleIndex](./requirejs.bundle.index.md) - extracts the index of all bundles to .js and .json files
* [requirejsBundleTOC](./requirejs.bundle.toc.md) - extracts a complete module list of the specified bundle as JSON
* [requirejsCleanOutput](./requirejs.clean.output.md) - deletes files from the build output directory, which were copied by the requirejs task, but do not need to be shipped because they were bundled
* [requirejsContentCheck](./requirejs.content.check.md) - checks if output bundles do not contain modules outside the owning component
* [requirejsDependencyCheck](./requirejs.dependency.check.md) - checks if modeules in specified bundles depend only on public modules from other components
* [requirejsIndexCheck](./requirejs.index.check.md) - checks if modules from the bundle index module are bundled in the same bundle

## Deprecated

Stop using those. If you need them, load them from their origin.

* [embedFonts](./embed.fonts.md) - see the [on-line documentation of the grunt-embed-fonts task](https://github.com/prantlf/grunt-embed-fonts#readme) for more information.
* [symlink](./symlink.md) - see the [on-line documentation of the grunt-contrib-symlink task](https://github.com/prantlf/grunt-contrib-symlink/tree/combined) for more information.
