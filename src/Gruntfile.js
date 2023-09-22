'use strict';

// Builds debug and release package files for the product
module.exports = function (grunt) {
  const environment = process.env;
  const time = environment.GRUNT_TIME === 'true';
  const notify = environment.GRUNT_NOTIFY === 'true';
  const pkg = grunt.file.readJSON('../package.json');
  const buildNumberGenerator = require('build-number-generator');
  const buildNumber = buildNumberGenerator.generate(pkg.version);

  // Report the duration of the tasks run
  if (time) {
    require('time-grunt')(grunt);
  }

  // RequireJS modules of the components, which we depend on
  const nucComponent = require('../lib/src/nuc/component');
  const smartComponent = require('../lib/src/smart/component');
  const csuiComponent = require('../lib/src/csui/component');
  // Only plugin aliases are needed; modules referenced
  // by component prefixes are excluded by pointing their
  // prefix to "empty:" in the build configuration
  const moduleAliasesToExclude = nucComponent.getAllRequireJsPlugins().concat(
    smartComponent.getAllRequireJsPlugins());
  // RequireJS modules of the components, which we depend on
  const modulesWeDependOn = [
    ...nucComponent.getAllModules(), ...smartComponent.getAllModules(), ...csuiComponent.getAllModules()
  ];

   // RequireJS modules packed into the product bundles
   const requirejsModules = [
    {
      name: 'bundles/dmss-all',
      // Only plugin aliases are needed; modules referenced
      // by component prefixes are excluded by pointing their
      // prefix to "empty:" in the build configuration
      exclude: moduleAliasesToExclude
    }
  ];
  const requirejsBundleIndexes = {
    'bundles/dmss-index': [
      'bundles/dmss-all'
    ]
  };

  // Create build configuration including the nuc-csui module compatibility map
  require('../lib/src/nuc/grunt-tasks/utils/create.build.config')({
    prefix: 'dmss', dependencies: ['csui']
  });

  // Declare tasks for the build from sources
  grunt.initConfig({
    // Set up desktop grunt result notifications
    notify_hooks: {
      options: {
        enabled: notify,
        max_jshint_notifications: 5,
        title: 'dmss/src',
        success: true,
        duration: 3
      }
    },

    // Extracts the index of all bundles to .js and .json files
    requirejsBundleIndex: {
      all: {
        options: {
          bundleIndexes: requirejsBundleIndexes
        }
      }
    },

    // Generate a complete module list of the specified bundle
    requirejsBundleTOC: {
      debug: {
        options: {
          bundleDir: '../out-debug',
          bundles: requirejsModules
        }
      },
      release: {
        options: {
          bundleDir: '../out-release',
          bundles: requirejsModules
        }
      }
    },

    // Checks if bundles contain only modules from this component
    // (with the same prefix).
    requirejsContentCheck: {
      all: {
        options: {
          bundles: requirejsModules
         }
       }
     },

    // Check if bundle indexes refer to distinct collection of modules
    requirejsBundleCheck: {
      all: {
        options: {
          bundles: requirejsModules
        }
      }
    },

    // Check if modules from the bundle index module are bundled in the same bundle
    requirejsIndexCheck: {
      all: {
        options: {
          bundles: requirejsModules
        }
      }
    },

    // Check if we depend only on public modules
    requirejsDependencyCheck: {
      all: {
        options: {
          bundles: requirejsModules,
          dependencies: modulesWeDependOn
        }
      }
    },

    // Copy, uglify and combine RequireJS modules to file bundles
    requirejs: {
      debug: {
        options: {
          mainConfigFile: 'config-build.js',
          namespace: 'csui',
          separateCSS: true,
          appDir: '.',
          baseUrl: '.',
          siteRoot: '.',

          dir: '../out-debug',
          optimizeCss: 'none',
          optimize: 'none',
          fileExclusionRegExp: /(?:\.spec\.js$)|(?:\bGruntfile\.js$)|(?:^component\.js$)/,

          modules: requirejsModules
        }
      },

      release: {
        options: {
          mainConfigFile: 'config-build.js',
          namespace: 'csui',
          separateCSS: true,
          appDir: '.',
          baseUrl: '.',
          siteRoot: '.',

          dir: '../out-release',
          optimize: 'none', /* 15.09 MGo changes */
          fileExclusionRegExp: /(?:\.spec\.js$)|(?:\bGruntfile\.js$)|(?:^component\.js$)/,
          uglify2: {
            output: {
              // Workaround for IE, which fails parsing JavaScript with Unicode.  The
              // select2 component uses keys with diacritics and IIS does not send
              // the UTF-8 charset in the Content-Type header for the *.js files.
              ascii_only: true,
              quote_keys: true
            }
          },
          generateSourceMaps: true,
          preserveLicenseComments: false,

          modules: requirejsModules
        }
      }
    },

    // Remove files and directories from the output which are not distributed
    requirejsCleanOutput: {
      release: {
        src: '../out-release'
      },
      debug: {
        src: '../out-debug'
      }
    },

    // Perform static code correctness checks
    jshint: {
      js: {
        src: ['./**/*.js', '../test/*.js'],
        options: {
          jshintrc: '../.jshintrc',
          reporter: require('jshint-stylish')
        }
      },
      html: {
        src: ['**/test/*.html'],
        options: {
          jshintrc: '../.jshintrc-html',
          reporter: require('jshint-stylish'),
          extract: 'auto'
        }
      }
    },

    // Check correct format of the CSS source files
    csslint: {
      source: {
        options: {
          csslintrc: '../.csslintrc'
        },
        src: ['**/*.css']
      }
    },

    // Check correct format of the JSON source files
    jsonlint: {
      source: [
        '**/*.json'
      ],
      debug: [
        '../out-debug/*.json'
      ],
      release: [
        '../out-release/*.json'
      ]
    },

    // Perform static code correctness checks but do not fail;
    // this is used in test runner, which may use ddescribe and
    // iit methods, which should not be allowed in normal build
    override: {
      jshint: {
        options: {
          force: true
        }
      }
    },

    // Remove files and directories from the output which are not distributed
    clean: {
      generated: [
        'bundles/*-index.*'
      ]
    },

    // Replaces the build number in the test extension-describing file,
    // if provided by the process environment, otherwise leave the number
    // in the source file
    replace: {
      options: {
        force: true,
        patterns: [
          {
            match: /"version": "[.0-9]+"/g,
            replacement: '"version": "' + buildNumber + '"'
          }
        ]
      },
      debug: {
        files: [
          {
            src: ['dmss-extensions.json'],
            dest: '../out-debug/dmss-extensions.json'
          }
        ]
      },
      release: {
        files: [
          {
            src: ['dmss-extensions.json'],
            dest: '../out-release/dmss-extensions.json'
          }
        ]
      }
    },

    // Generate bundles of concatenated i18n modules in the default language
    // (English, locale 'root') prepared for localization to other languages
    languagepack: {
      all: {
        options: {
          bundles: requirejsModules,
          bundleIndexes: requirejsBundleIndexes
        }
      }
    },

    // Generate RTL versions of stylesheet bundles
    rtlcss: {
      debug: {
        expand: true,
        cwd: '../out-debug/bundles',
        src: './*.css',
        dest: '../out-debug/bundles/',
        rename: function (dest, src) {
          return dest + src.replace('.css', '-rtl.css');
        }
      },

      release: {
        expand: true,
        cwd: '../out-release/bundles',
        src: './*.css',
        dest: '../out-release/bundles/',
        rename: function (dest, src) {
          return dest + src.replace('.css', '-rtl.css');
        }
      }
    },
  });

  // Load grunt plugins used in this Gruntfile
  grunt.loadTasks('../node_modules/grunt-contrib-clean/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-copy/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-csslint/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-jshint/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-requirejs/tasks');
  grunt.loadTasks('../node_modules/grunt-jsonlint/tasks');
  grunt.loadTasks('../node_modules/grunt-notify/tasks');
  grunt.loadTasks('../node_modules/grunt-override-config/tasks');
  grunt.loadTasks('../node_modules/grunt-replace/tasks');
  grunt.loadTasks('../node_modules/grunt-rtlcss/tasks');
  grunt.loadTasks('../lib/src/nuc/grunt-tasks');

  // Define the order of tasks to build debug and release targets; make sure
  // that static code checks are performed too

  /* 15.09. MGo Changes */
  /*
  grunt.registerTask('check', [
    'jshint', 'jsonlint:source', 'csslint'
  ]);
  */
  grunt.registerTask('check', ['jsonlint:source', 'csslint'
  ]);

  grunt.registerTask('debug', [
    'requirejsBundleIndex', 'requirejs:debug', 'requirejsCleanOutput:debug',
    'clean:generated', 'requirejsIndexCheck', 'requirejsBundleCheck',
    'requirejsDependencyCheck', 'languagepack', 'requirejsBundleTOC:debug',
    'replace:debug', 'rtlcss:debug', 'jsonlint:debug'
  ]);
  grunt.registerTask('release', [
    'requirejsBundleIndex', 'requirejs:release', 'requirejsCleanOutput:release',
    'clean:generated', 'requirejsBundleTOC:release', 'replace:release',
    'rtlcss:release', 'jsonlint:release'
  ]);

  // Allow running just "grunt" in this directory to performa static checks
  // and build both debug and release targets
  grunt.registerTask('default', ['check', 'debug', 'release']);

  // Register desktop notification hooks
  grunt.task.run('notify_hooks');
};
