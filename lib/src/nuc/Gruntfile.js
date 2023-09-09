/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

const { resolve } = require('path');
const { generate: generateBuildNumber } = require('build-number-generator');
module.exports = function (grunt) {
  const environment = process.env;
  const time = environment.GRUNT_TIME === 'true' || grunt.option('time');
  const notify = environment.GRUNT_NOTIFY === 'true' || grunt.option('notify');
  let { version: build } = grunt.file.readJSON('../package.json');
  const version = build.replace(/^([0-9]+\.[0-9]+\.[0-9]+-next).*$/, '$1');
  if (version === build && version.endsWith('-next')) {
    build = generateBuildNumber(version);
  }
  if (time) {
    require('time-grunt')(grunt);
  }
  const requirejsModules = [
      {
        name: 'bundles/nuc-loader'
      },
      {
        name: 'bundles/nuc-libraries',
        exclude: [
          'bundles/nuc-loader'
        ]
      },
      {
        name: 'bundles/nuc-log4javascript'
      },
      {
        name: 'bundles/nuc-server-adaptors',
        exclude: [
          'bundles/nuc-loader', 'bundles/nuc-libraries'
        ]
      },
      {
        name: 'bundles/nuc-models',
        exclude: [
          'bundles/nuc-loader', 'bundles/nuc-libraries',
          'bundles/nuc-server-adaptors'
        ]
      }
    ],
    requirejsBundleIndexes = {
      'bundles/nuc-index': [
        'bundles/nuc-libraries',
        'bundles/nuc-log4javascript',
        'bundles/nuc-server-adaptors',
        'bundles/nuc-models'
      ]
    };
  function writeStamps(moduleName, path, contents) {
    if (moduleName === 'config' || moduleName === 'nuc/config') {
      grunt.verbose.writeln(`Writing cache busting parameter to ${moduleName} : ${build}`);
      contents = contents.replace(/urlArgs: '',/g, `urlArgs: 'v=${build}',`);
    }
    return contents;
  }
  grunt.initConfig({
    notify_hooks: {
      options: {
        enabled: notify,
        max_jshint_notifications: 5,
        title: 'nuc/src',
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
      all: {
        options: {
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
          exceptions: ['txt', 'i18n', 'css', 'csui-ext', 'hbs', 'json', 'less']
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
    requirejs: {
      debug: {
        options: {
          mainConfigFile: 'config-build.js',
          namespace: 'csui',
          appDir: '.',
          baseUrl: '.',
          siteRoot: '.',
          fileExclusionRegExp: /(?:\blessc\.js$)|(?:\.spec\.js$)|(?:\bgrunt-tasks)|(?:\bGruntfile\.js$)|(?:_test\.js$)/,
          normalizeDirDefines: 'skip',

          dir: '../out-debug',
          optimize: 'none',

          separateCSS: true,
          compressCSS: false,
          less: {
            compress: false,
            sourceMap: {
              sourceMapFileInline: true,
              sourceMapBasepath: resolve('..'),
              sourceMapRootpath: '..'
            }
          },

          modules: requirejsModules,

          onBuildWrite: writeStamps
        }
      },

      release: {
        options: {
          mainConfigFile: 'config-build.js',
          namespace: 'csui',
          appDir: '.',
          baseUrl: '.',
          siteRoot: '.',
          fileExclusionRegExp: /(?:\blessc\.js$)|(?:\.spec\.js$)|(?:\bgrunt-tasks)|(?:\bGruntfile\.js$)|(?:_test\.js$)/,
          normalizeDirDefines: 'skip',

          dir: '../out-release',

          optimize: 'uglify2',
          uglify2: {
            output: {
              ascii_only: true,
              quote_keys: true
            }
          },
          generateSourceMaps: true,
          preserveLicenseComments: false,

          separateCSS: true,
          compressCSS: true,
          less: {
            compress: true,
            sourceMap: {
              sourceMapFileInline: true,
              sourceMapBasepath: resolve('..'),
              sourceMapRootpath: '..'
            }
          },

          modules: requirejsModules,

          onBuildWrite: writeStamps
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
    clean: {
      debug: ['../out-debug/**', '../out-languagepack_en/**'],

      release: ['../out-release/**'],

      generated: [
        'bundles/*-index.*'
      ],

      options: {
        force: true
      }
    },
    replace: {
      options: {
        force: true,
        patterns: [
          {
            match: /"version": "1.0"/g,
            replacement: `"version": "${build}"`
          }
        ]
      },

      debug: {
        files: [
          {
            src: ['nuc-extensions.json'],
            dest: '../out-debug/nuc-extensions.json'
          }
        ]
      },

      release: {
        files: [
          {
            src: ['nuc-extensions.json'],
            dest: '../out-release/nuc-extensions.json'
          }
        ]
      }
    },
    compress: {
      src: {
        options: {
          archive: '../dist/nuc-src.zip',
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
          archive: '../dist/nuc-debug.zip',
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
          archive: '../dist/nuc-release.zip',
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
          archive: '../dist/nuc-languagepack_en.zip',
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

    copy: {
      lessc: {
        files: [
          {
            cwd: '..',
            src: ['node_modules/less/dist/less.js'],
            dest: 'lib/',
            expand: true,
            filter: 'isFile'
          }
        ]
      }
    },
    jshint: {
      js: {
        src: [
          'behaviors/**/*.js',
          'bundles/**/*.js',
          '!bundles/nls/**/*.js',
          'lib/test/*/*.js',
          'models/**/*.js',
          'utils/**/*.js',
          '../test/*/*.js'
        ],

        options: {
          jshintrc: '../.jshintrc',
          reporter: require('jshint-stylish')
        }
      }
    },
    override: {
      jshint: {
        options: {
          force: true
        }
      }

    },
    jsonlint: {
      source: [
        '../*.json',
        '*.json',
        'grunt-tasks/**/*.json'
      ],

      debug: [
        '../out-debug/*.json'
      ],

      release: [
        '../out-release/*.json'
      ],

      options: {
        allowDuplicateObjectKeys: false
      }
    },
    rtlcss: {
      debug: {
        files: [
          {
            expand: true,
            cwd: '../out-debug/bundles',
            src: './*.css',
            dest: '../out-debug/bundles/',
            rename: function (dest, src) {
              return dest + src.replace('.css', '-rtl.css');
            }
          },
          {
            expand: true,
            cwd: '../out-debug/themes/carbonfiber',
            src: './theme.css',
            dest: '../out-debug/themes/carbonfiber/',
            rename: function (dest, src) {
              return dest + src.replace('.css', '-rtl.css');
            }
          },
          {
            expand: true,
            cwd: '../out-debug/themes/light',
            src: './theme.css',
            dest: '../out-debug/themes/light/',
            rename: function (dest, src) {
              return dest + src.replace('.css', '-rtl.css');
            }
          }
        ]
      },

      release: {
        files: [
          {
            expand: true,
            cwd: '../out-release/bundles',
            src: './*.css',
            dest: '../out-release/bundles/',
            rename: function (dest, src) {
              return dest + src.replace('.css', '-rtl.css');
            }
          },
          {
            expand: true,
            cwd: '../out-release/themes/carbonfiber',
            src: './theme.css',
            dest: '../out-release/themes/carbonfiber/',
            rename: function (dest, src) {
              return dest + src.replace('.css', '-rtl.css');
            }
          },
          {
            expand: true,
            cwd: '../out-release/themes/light',
            src: './theme.css',
            dest: '../out-release/themes/light/',
            rename: function (dest, src) {
              return dest + src.replace('.css', '-rtl.css');
            }
          }
        ]
      }
    },

    cssmin: {
      options: {
        report: 'min',
        sourceMap: true
      },

      release: {
        files: [
          {
            expand: true,
            cwd: '../out-release/themes/carbonfiber',
            src: ['*.css', '!*.min.css'],
            dest: '../out-release/themes/carbonfiber'
          },
          {
            expand: true,
            cwd: '../out-release/themes/light',
            src: ['*.css', '!*.min.css'],
            dest: '../out-release/themes/light'
          }]
      }
    },

    concurrent: {
      finish: ['finish-debug', 'finish-release']
    }
  });
  grunt.loadTasks('../node_modules/@prantlf/grunt-jsonlint/tasks');
  grunt.loadTasks('../node_modules/grunt-concurrent/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-clean/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-compress/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-copy/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-jshint/tasks');
  grunt.loadTasks('../node_modules/grunt-contrib-requirejs/tasks');
  grunt.loadTasks('../node_modules/grunt-mkdir/tasks');
  grunt.loadTasks('../node_modules/grunt-notify/tasks');
  grunt.loadTasks('../node_modules/grunt-override-config/tasks');
  grunt.loadTasks('../node_modules/grunt-replace/tasks');
  grunt.loadTasks('grunt-tasks');

  grunt.registerTask('check', [
    'jshint:js', 'jsonlint:source'
  ]);

  grunt.registerTask('print-build', 'Prints the current build number.', function () {
    grunt.log.writeln(`Build number: ${build}`);
  });

  grunt.registerTask('generate-before', [
    'print-build', 'copy:lessc', 'requirejsBundleIndex'
  ]);

  grunt.registerTask('generate-after', [
    'clean:generated', 'requirejsBundleTOC'
  ]);

  grunt.registerTask('finish-debug', [
    'requirejs:debug', 'requirejsIndexCheck', 'requirejsBundleCheck',
    'requirejsCleanOutput:debug', 'languagepack', 'replace:debug',
    'jsonlint:debug'
  ]);

  grunt.registerTask('debug', [
    'clean:debug', 'generate-before', 'finish-debug', 'generate-after'
  ]);

  grunt.registerTask('finish-release', [
    'requirejs:release', 'requirejsCleanOutput:release', 'replace:release',
    'jsonlint:release'
  ]);

  grunt.registerTask('release', [
    'clean:release', 'generate-before', 'finish-release', 'generate-after'
  ]);

  grunt.registerTask('debug-and-release', [
    'clean:debug', 'clean:release', 'generate-before', 'concurrent:finish',
    'generate-after'
  ]);
  grunt.registerTask('package', [
    'compress:src', 'compress:debug', 'compress:release',
    'compress:languagepack_en'
  ]);
  grunt.registerTask('slow', ['check', 'debug', 'release', 'package']);
  grunt.registerTask('fast', ['check', 'debug-and-release', 'package']);
  const concurrent = environment.GRUNT_CONCURRENT !== 'false';
  grunt.registerTask('default', [concurrent ? 'fast' : 'slow']);
  grunt.task.run('notify_hooks');
};
