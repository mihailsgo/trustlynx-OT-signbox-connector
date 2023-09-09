/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

var path = require('path');
module.exports = function (grunt) {
  var environment = process.env,
      time = environment.GRUNT_TIME === 'true' || grunt.option('time'),
      notify = environment.GRUNT_NOTIFY === 'true' || grunt.option('notify'),
      generateBuildNumber = require('../lib/src/nuc/grunt-tasks/utils/generate.build.number'),
      pkg = grunt.file.readJSON('../package.json'),
      build = environment.BUILD || grunt.option('build') || generateBuildNumber(pkg.version);
  if (time) {
    require('time-grunt')(grunt);
  }
  require('../lib/src/nuc/grunt-tasks/utils/create.build.config')({
    prefix: 'greet', dependencies: ['csui']
  });
  var nucComponent = require('../lib/src/nuc/component'),
	  smartComponent = require('../lib/src/smart/component'),	
      csuiComponent = require('../lib/src/csui/component'),
      moduleAliasesToExclude = nucComponent.getAllRequireJsPlugins().concat(
          smartComponent.getAllRequireJsPlugins()),
      modulesWeDependOn = [
        ...nucComponent.getAllModules(), ...smartComponent.getAllModules(), ...csuiComponent.getAllModules()
      ],
      requirejsModules = [
        {
          name: 'bundles/greet-all',
          exclude: moduleAliasesToExclude
        }
      ],
      requirejsBundleIndexes = {
        'bundles/greet-index': ['bundles/greet-all']
      };
  grunt.initConfig({
    notify_hooks: {
      options: {
        enabled: notify,
        max_jshint_notifications: 5,
        title: 'greet/src',
        success: true,
        duration: 3
      }
    },
    requirejsBundleIndex: {
      all: {
        options: {
          bundleIndexes: requirejsBundleIndexes
        }
      }
    },
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
    languagepack: {
      all: {
        options: {
          bundles: requirejsModules,
          bundleIndexes: requirejsBundleIndexes
        }
      }
    },
    requirejsContentCheck: {
      all: {
        options: {
          bundles: requirejsModules,
          exceptions: ['helpers']
        }
      }
    },
    requirejsBundleCheck: {
      all: {
        options: {
          bundles: requirejsModules
        }
      }
    },
    requirejsIndexCheck: {
      all: {
        options: {
          bundles: requirejsModules
        }
      }
    },
    requirejsDependencyCheck: {
      all: {
        options: {
          bundles: requirejsModules,
          dependencies: modulesWeDependOn,
          config: 'config-build.js',
          allowIndexedPrivateModules: true
        }
      }
    },
    requirejs: {
      debug: {
        options: {
          mainConfigFile: 'config-build.js',
          appDir: '.',
          baseUrl: '.',
          siteRoot: '.',
          dir: '../out-debug',
          fileExclusionRegExp: /(?:\.spec\.js$)|(?:\bGruntfile\.js$)/,
          modules: requirejsModules,
          namespace: 'csui',
          normalizeDirDefines: 'skip',
          optimize: 'none',
          optimizeCss: 'none',
          separateCSS: true,
          compressCSS: false,
          less: {
            compress: false,
            sourceMap: {
              sourceMapFileInline: true,
              sourceMapBasepath: path.resolve('..'),
              sourceMapRootpath: '..'
            }
          }
        }
      },
      release: {
        options: {
          mainConfigFile: 'config-build.js',
          appDir: '.',
          baseUrl: '.',
          siteRoot: '.',
          dir: '../out-release',
          fileExclusionRegExp: /(?:\.spec\.js$)|(?:\bGruntfile\.js$)/,
          modules: requirejsModules,
          namespace: 'csui',
          optimize: 'uglify2',
          uglify2: {
            output: {
              ascii_only: true,
              quote_keys: true
            }
          },
          generateSourceMaps: true,
          preserveLicenseComments: false,
          normalizeDirDefines: 'skip',
          separateCSS: true,
          compressCSS: true,
          less: {
            compress: true,
            sourceMap: {
              sourceMapFileInline: true,
              sourceMapBasepath: path.resolve('..'),
              sourceMapRootpath: '..'
            }
          }
        }
      }
    },
    requirejsCleanOutput: {
      release: {
        src: '../out-release'
      },
      debug: {
        src: '../out-debug'
      }
    },
    jshint: {
      js: {
        src: [
          './**/*.js',
          '../test/*.js',
          '../test/scenarios/*.js',
          '!./Gruntfile.js',
          '!./component.js',
          '!./config-build.js'
        ],
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
    eslint: {
      debug: [
        '../out-debug/bundles/*.js'
      ],
      release: [
        '../out-release/bundles/*.js'
      ]
    },
    csslint: {
      source: {
        options: {
          csslintrc: '../.csslintrc'
        },
        src: ['**/*.css']
      },
      debug: {
        options: {
          csslintrc: '../.csslintrc-output'
        },
        src: ['../out-debug/**/*.css']
      },
      release: {
        options: {
          csslintrc: '../.csslintrc-output'
        },
        src: ['../out-release/**/*.css']
      }
    },
    jsonlint: {
      source: [
        '**/*.json',
        '../*.json'
      ],
      debug: [
        '../out-debug/*.json'
      ],
      release: [
        '../out-release/*.json'
      ]
    },
    override: {
      jshint: {
        options: {
          force: true
        }
      }
    },
    clean: {
      debug: [ '../out-debug/**', '../out-languagepack_en/**' ],
      release: [ '../out-release/**' ],
      generated: [ 'bundles/*-index.*' ],
      options: {
        force: true
      }
    },
    replace: {
      options: {
        force: true,
        patterns: [
          {
            match: /"version": "[.0-9]+"/g,
            replacement: '"version": "' + build + '"'
          }
        ]
      },
      debug: {
        files: [
          {
            src: ['greet-extensions.json'],
            dest: '../out-debug/greet-extensions.json'
          }
        ]
      },
      release: {
        files: [
          {
            src: ['greet-extensions.json'],
            dest: '../out-release/greet-extensions.json'
          }
        ]
      }
    },
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
    compress: {
      src: {
        options: {
          archive: '../dist/greet-src.zip',
          level: 9
        },
        files: [
          {
            src: ['**']
          }
        ]
      },
      debug: {
        options: {
          archive: '../dist/greet-debug.zip',
          level: 9
        },
        files: [
          {
            expand: true,
            cwd: '../out-debug',
            src: ['**']
          }
        ]
      },
      release: {
        options: {
          archive: '../dist/greet-release.zip',
          level: 9
        },
        files: [
          {
            expand: true,
            cwd: '../out-release',
            src: ['**']
          }
        ]
      },
      languagepack_en: {
        options: {
          archive: '../dist/greet-languagepack_en.zip',
          level: 9
        },
        files: [
          {
            expand: true,
            cwd: '../out-languagepack_en',
            src: ['**']
          }
        ]
      }
    },

    concurrent: {
      finish: ['finish-debug', 'finish-release']
    }
  });
  grunt.loadTasks('../node_modules/grunt-concurrent/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-clean/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-compress/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-csslint/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-jshint/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-requirejs/tasks');
  grunt.loadTasks('../node_modules/grunt-eslint/tasks');
  grunt.loadTasks('../node_modules/grunt-jsonlint/tasks');
  grunt.loadTasks('../node_modules/grunt-notify/tasks');
  grunt.loadTasks('../node_modules/grunt-override-config/tasks');
  grunt.loadTasks('../node_modules/grunt-replace/tasks');
  grunt.loadTasks('../node_modules/grunt-rtlcss/tasks');
  grunt.loadTasks('../lib/src/nuc/grunt-tasks');
  grunt.registerTask('check', [ 'jshint', 'jsonlint:source', 'csslint:source' ]);
  grunt.registerTask('generate-before', [ 'requirejsBundleIndex' ]);
  grunt.registerTask('generate-after', [ 'clean:generated' ]);
  grunt.registerTask('finish-debug', [
    'requirejs:debug', 'requirejsCleanOutput:debug', 'requirejsIndexCheck',
    'requirejsBundleCheck', 'requirejsDependencyCheck', 'languagepack',
    'requirejsBundleTOC:debug', 'replace:debug', 'eslint:debug',
    'jsonlint:debug', 'rtlcss:debug', 'csslint:debug'
  ]);
  grunt.registerTask('debug', [
    'clean:debug', 'generate-before', 'finish-debug', 'generate-after'
  ]);
  grunt.registerTask('finish-release', [
    'requirejs:release', 'requirejsCleanOutput:release',
    'requirejsBundleTOC:release', 'replace:release', 'eslint:release',
    'jsonlint:release', 'rtlcss:release', 'csslint:release'
  ]);
  grunt.registerTask('release', [
    'clean:release', 'generate-before', 'finish-release', 'generate-after'
  ]);
  grunt.registerTask('debug-and-release', [
    'clean:debug', 'clean:release', 'generate-before', 'concurrent:finish', 'generate-after'
  ]);

  grunt.registerTask('package', [ 'compress' ]);
  grunt.registerTask('slow', ['check', 'debug', 'release', 'package']);
  grunt.registerTask('fast', ['check', 'debug-and-release', 'package']);
  var concurrent = environment.GRUNT_CONCURRENT !== 'false';
  grunt.registerTask('default', [concurrent ? 'fast' : 'slow']);
  grunt.task.run('notify_hooks');
};
