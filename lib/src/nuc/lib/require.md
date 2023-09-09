# RequireJS

This document describes changes to the original RequireJS. See the [RequireJS website] for the original documentation.

## Changes

1. Make the `pkgs` configuration object mergeable.
2. Add an attribute `data-csui-required` to to every element added to document head.
3. Recognise `rename` in the configuration to implement module name mapping
   in addition to the `starMap` for an additional module compatibility layer.
4. Return module configuration merged from the mapped original names and new ones.
5. Introduce a method `moduleConfig(id)` on the local require function.

## `pkgs` mergeable

Allows calling `require.config({ pkgs: ... })` multiple times to configure packages step-by-step. Kind of misused by the original version of the mobile app to remap modules.

## Attribute `data-csui-required`

Allows detecting all scripts and links inserted by RequireJs and the `css` plugin to `document.head` to be able to remove them later. Used to wipe out all modules loaded from one server, before another version can be loaded from a different server.

## `rename` map

The RequireJS `starMap` can be used for remapping modules to be able to load different functionality on different pages. It can be used to implement product-specific features, if a RequireJS library is reused in multiple products.

Another need for module remapping comes from refactoring, which moves a module to a different library, with or without deprecating the original module name. If a module needs to be remapped for compatibility, which was earlier remapped for product adaptation, the two map entries will conflict.

A direct conflict means that either the compatibility mapping, or the product adaptation will not work, depending on the order of the configuration statements:

    csui/original -> nuc/moved      // keep compatibility with a moved module
    csui/original -> custom/adapted // adapt a module for a new product

An direct conflict means that dependencies on the original module will not be adapted, if the adaptation maps only the new module name, because the `starMap` is not processed recursively:

    csui/original -> nuc/moved      // keep compatibility with a moved module
    nuc/moved     -> custom/adapted // adapt a module for a new product

The `rename` map is separate from `starMap` and solves the direct conflict. Modules remapped for compatibility are called "renamed" and have to be added to the `rename` map. The `starMap` continues to support product adapting. The module name normalisation makes use of both maps. If the `rename` map is configured alone, it will work like `starMap` alone.

When this configuration is used:

    rename:  csui/original -> nuc/moved

The module names will be normalised like this:

    csui/original -> nuc/moved // using rename
    nuc/moved                  // just loaded

When this configuration is used:

    rename:  csui/original -> nuc/moved
    starMap: csui/original -> custom/adapted

The module names will be normalised like this:

    custom/adapted                  // just loaded
    csui/original -> custom/adapted // using starMap
    nuc/moved     -> custom/adapted // using rename backwards and starMap

When this configuration is used:

    rename:  csui/original -> nuc/moved
    starMap: nuc/original  -> custom/adapted

The module names will be normalised like this:

    custom/adapted                  // just loaded
    csui/original -> custom/adapted // using rename backwards and starMap
    nuc/moved     -> custom/adapted // using starMap

## Merged module configuration

This is a feature supporting module renaming and remapping as discussed in the previous chapter.

An example of a situation:

1. The original module csui/original supported configuration.
2. The original module was adapted in a new product and the new module might need additional configuration.
3. The original module was renamed in the library and parts of the configuration started to be set using the new name.

An example of RequireJS configuration:

    rename:  csui/original -> nuc/moved
    starMap: csui/original -> custom/adapted

The result of `module.config()` called in custom/adapted will contain an object merged from configurations set for all three module names. Forward and backward `rename` map and `starMap` are used to discover the other module names.

## `moduleConfig` method

The configuration of a RequireJS module may be needed in another module. It can be used to keep compatibility after refactoring the module tree. The functionality of `require.moduleConfig` is similar to `module.config`, the difference is that you have to supply the module name:

    define(['require', 'module'], function (require, module) {
      // merge the old and new module configurations
      var config = _.extend({},
        require.moduleConfig('other-module'), // configuration of other module
        module.config()                       // configuration of this module
      );
    });

[RequireJS website]: https://requirejs.org/
