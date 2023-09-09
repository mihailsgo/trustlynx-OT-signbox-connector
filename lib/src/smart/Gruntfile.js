/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

var fs   = require('fs'),
    path = require('path');

'use strict';
module.exports = (grunt) => {
  const environment = process.env;
  const time = environment.GRUNT_TIME === 'true';
  const notify = environment.GRUNT_NOTIFY === 'true';
  const pkg = grunt.file.readJSON('../../../package.json');
  const generateBuildNumber = require('../nuc/grunt-tasks/utils/generate.build.number');
  const buildNumber = environment.BUILD || grunt.option('build') ||
                      generateBuildNumber(pkg.version);
  const generateBundelsForSB = !!grunt.option('grunt4SB');
  if (time) {
    require('time-grunt')(grunt);
  }
  const csuiComponent = require('./component');
  const nucComponent = require('../nuc/component');
  const smartComponent = require('./component');
  const requirejsModules = [
    {
      name: 'bundles/smart-all',
      exclude: nucComponent.getAllRequireJsPlugins(),
      include: generateBundelsForSB ? smartComponent.getAllAvailableRequireJsPlugins() : []
    }
  ];

  const modulesWeDependOn = [
    ...nucComponent.getAllModules()
  ];
  grunt.initConfig({
    notify_hooks: {
      options: {
        enabled: notify,
        max_jshint_notifications: 5,
        title: 'smart/src',
        success: true,
        duration: 3
      }
    },
    requirejsBundleIndex: {
      all: {
        src: [
          'bundles/smart-all.js'
        ],
        dest: 'bundles/smart-index',
        options: {
          prefix: 'smart'
        }
      }
    },
    requirejsBundleCheck: {
      all: {
        options: {
          prefix: 'smart',
          dependencies: requirejsModules,
          config: 'config-build.js'
        }
      }
    },
    requirejsDependencyCheck: {
      all: {
        options: {
          prefix: 'smart',
          bundles: requirejsModules,
          dependencies: modulesWeDependOn,
          config: 'config-build.js',
          bundleDir: '../../debug/smart'
        }
      }
    },
    requirejsIndexCheck: {
      all: {
        options: {
          bundles: requirejsModules,
          output: '../../debug/smart'
        }
      }
    },
    requirejs: {
      debug: {
        options: {
          mainConfigFile: 'config-build.js',
          namespace: 'csui',
          separateCSS: true,
          appDir: '.',
          baseUrl: '.',
          siteRoot: '.',

          dir: '../../debug/smart',
          compressCSS: false,
          optimize: 'none',

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

          dir: '../../release/smart',
          optimize: 'uglify2',
          uglify2: {
            output: {
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
    requirejsCleanOutput: {
      release: {
        src: '../../release/smart'
      },
      debug: {
        src: '../../debug/smart'
      },
      options: {
        processItem: function (item, helpers) {
          if (item.name === 'carbonfiber') {
            helpers.deleteFullDir(item.path + '/binf/css');
            helpers.deleteFile(item.path + '/binf/fonts/web.config');
            helpers.deleteFullDir(item.path + '/binf/css');
            helpers.deleteFullDir(item.path + '/fonts-source');
            helpers.deleteFullDir(item.path + '/fonts/specimen_files');
            if (fs.existsSync(item.path + '/fonts')) {
              fs.readdirSync(item.path + '/fonts')
                  .forEach(function (child) {
                    if (/\.txt$/.test(child) || /\.html$/.test(child) || /\.css$/.test(child)) {
                      helpers.deleteFile(path.join(item.path + '/fonts', child));
                    }
                  });
            }
            fs.readdirSync(item.path)
                .forEach(function (child) {
                  if ((/\.css$/.test(child) || /\.map$/.test(child)) &&
                      (!/^theme/.test(child) && !/^init/.test(child))) {
                    helpers.deleteFile(path.join(item.path, child));
                  }
                });
            return true;
          }
        }
      }

    },
    jshint: {
      js: {
        src: ['./**/*.js', '!./lib/**/*.js', '!./themes/**/*.js'],
        options: {
          jshintrc: '../../../.jshintrc',
          reporter: require('jshint-stylish')
        }
      },
      html: {
        src: ['**/test/*.html'],
        options: {
          jshintrc: '../../../.jshintrc-html',
          reporter: require('jshint-stylish'),
          extract: 'auto'
        }
      }
    },
    eslint: {
      debug: [
        '../../debug/smart/bundles/*.js'
      ],
      release: [
        '../../release/smart/bundles/*.js'
      ]
    },
    csslint: {
      source: {
        options: {
          csslintrc: '../../../.csslintrc'
        },
        src: ['controls/**/*.css']
      },
      debug: {
        options: {
          csslintrc: '../../../.csslintrc-output'
        },
        src: ['../../debug/smart/**/*.css']
      },
      release: {
        options: {
          csslintrc: '../../../.csslintrc-output'
        },
        src: ['../../release/smart/**/*.css']
      }
    },
    jsonlint: {
      source: [
        '**/*.json'
      ],
      debug: [
        '../../debug/smart/*.json'
      ],
      release: [
        '../../release/smart/*.json'
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
      debug: ['../../debug/smart/**', './out-languagepack_en/**'],
      release: ['../../release/smart/**', './out-languagepack_en/**'],

      smart_svg_js: [
        'themes/carbonfiber/smart.*.js'
      ],

      generated: [
        'bundles/*-index.*'
      ],
      options: {
        force: true
      }
    },

    generateSVGs: {
      mimeTypeIconsWithColorSchema: {
        options: {
          iconNamePrefix: 'csui_',
          nameMap: {
            tree_folder: 'colorschema_mime_folder'
          }
        },
        files: [
          {
            src: [
              'themes/carbonfiber/image/icons.with.color.schema/*.svg'
            ],
            dest: 'themes/carbonfiber/smart.mimetype.colorschema.icons.js'
          }
        ]
      },
      mimeTypeIcons: {
        options: {
          iconNamePrefix: 'csui_',
          nameMap: {}
        },
        files: [
          {
            src: [
              'themes/carbonfiber/image/icons/mime_*.svg'
            ],
            dest: 'themes/carbonfiber/smart.mimetype.icons.js'
          }
        ]
      },
      actionIcons: {
        options: {
          iconNamePrefix: 'csui_',
          extraCssClass: 'csui-icon-v2-action-icon'
        },
        files: [
          {
            src: 'themes/carbonfiber/image/action_icons',
            dest: 'themes/carbonfiber/smart.action.icons.js'
          }
        ]
      }
    },
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
            src: ['smart-extensions.json'],
            dest: '../../debug/smart/smart-extensions.json'
          }, {
            src: ['lib/binf/js/binf.js'],
            dest: '../../debug/smart/lib/binf/js/binf.js'
          }
        ]
      },
      release: {
        files: [
          {
            src: ['smart-extensions.json'],
            dest: '../../release/smart/smart-extensions.json'
          }, {
            src: ['lib/binf/js/binf.js'],
            dest: '../../release/smart/lib/binf/js/binf.js'
          }
        ]
      }
    },
    languagepack: {
      all: {
        options: {
          prefix: 'smart',
          config: 'config-build.js',
          bundlesInfo: requirejsModules,
          bundles: [
            {
              name: 'bundles/smart-all',
              exclude: ['...']
            }
          ],
          bundleIndexes: {
            'bundles/smart-index': ['bundles/smart-all']
          },
          inputDir: '../../debug/smart',
          outputDir: '../../out-languagepack_en'
        }
      }
    },
    rtlcss: {
      debug: {
        files: [{
          expand: true,
          cwd: '../../debug/smart/bundles',
          src: './*.css',
          dest: '../../debug/smart/bundles/',
          rename: (dest, src) => dest + src.replace('.css', '-rtl.css')
        }, {
          expand: true,
          cwd: '../../debug/smart/themes/carbonfiber',
          src: './*.css',
          dest: '../../debug/smart/themes/carbonfiber/',
          rename: (dest, src) => dest + src.replace('.css', '-rtl.css')
        }]
      },

      release: {
        files: [{
          expand: true,
          cwd: '../../release/smart/bundles',
          src: './*.css',
          dest: '../../release/smart/bundles/',
          rename: (dest, src) => dest + src.replace('.css', '-rtl.css')
        }, {
          expand: true,
          cwd: '../../release/smart/themes/carbonfiber',
          src: './*.css',
          dest: '../../release/smart/themes/carbonfiber/',
          rename: (dest, src) => dest + src.replace('.css', '-rtl.css')
        }]
      }
    },

    cssmin: {
      options: {
        report: 'min',
        sourceMap: true
      },

      release: {
        files: [{
          expand: true,
          cwd: '../../release/smart/themes/carbonfiber',
          src: ['*.css', '!*.min.css'],
          dest: '../../release/smart/themes/carbonfiber'
        }]
      }
    },

    copy: {
      svg: {
        src: ['themes/carbonfiber/*.js'],
        dest: '../../release/smart/'
      }
    }
  });
  grunt.loadTasks('../../../node_modules/grunt-contrib-clean/tasks');
  grunt.loadTasks('../../../node_modules/grunt-contrib-copy/tasks');
  grunt.loadTasks('../../../node_modules/grunt-contrib-csslint/tasks');
  grunt.loadTasks('../../../node_modules/grunt-contrib-jshint/tasks');
  grunt.loadTasks('../../../node_modules/grunt-contrib-requirejs/tasks');
  grunt.loadTasks('../../../node_modules/grunt-contrib-cssmin/tasks');
  grunt.loadTasks('../../../node_modules/grunt-contrib-compress/tasks');
  grunt.loadTasks('../../../node_modules/grunt-eslint/tasks');
  grunt.loadTasks('../../../node_modules/grunt-jsonlint/tasks');
  grunt.loadTasks('../../../node_modules/grunt-notify/tasks');
  grunt.loadTasks('../../../node_modules/grunt-override-config/tasks');
  grunt.loadTasks('../../../node_modules/grunt-replace/tasks');
  grunt.loadTasks('../../../node_modules/grunt-rtlcss/tasks');
  grunt.loadTasks('../nuc/grunt-tasks');
  grunt.registerTask('check', [
    'jshint', 'jsonlint:source' //, 'csslint:source'
  ]);

  grunt.registerTask('generate-before', [
    'clean:smart_svg_js',
    'generateSVGs',
    'requirejsBundleIndex'
  ]);

  grunt.registerTask('generate-after', ['clean:generated']);

  grunt.registerTask('finish-debug', [
    'requirejs:debug', 'requirejsCleanOutput:debug', 'requirejsIndexCheck',
    'requirejsBundleCheck', 'requirejsDependencyCheck', 'languagepack',
    'replace:debug', 'jsonlint:debug', 'rtlcss:debug', 'csslint:debug'
  ]);
  grunt.registerTask('debug', [
    'clean:debug', 'generate-before', 'finish-debug', 'generate-after'
  ]);

  grunt.registerTask('finish-release', [
    'requirejs:release', 'requirejsCleanOutput:release',
    'copy:svg', 'replace:release',
    'jsonlint:release', 'rtlcss:release', 'cssmin:release', 'csslint:release'
  ]);
  grunt.registerTask('release', [
    'clean:release', 'generate-before', 'finish-release', 'generate-after'
  ]);
  grunt.registerTask('debug-and-release', [
    'clean:debug', 'clean:release', 'generate-before', 'concurrent:finish', 'generate-after'
  ]);
  grunt.registerTask('default', ['check', 'debug', 'release']);
  grunt.task.run('notify_hooks');
};
