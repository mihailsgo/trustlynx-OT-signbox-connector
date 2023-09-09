/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

const { readdirSync, rmdirSync, unlinkSync, existsSync } = require('fs');
const { join } = require('path');

module.exports = function (grunt) {
  grunt.registerMultiTask('requirejsCleanOutput',
    'Remove files and directories, which are not distributed, from the build output.',
    function () {
      function walkDir(file) {
        if (grunt.file.isDir(file)) {
          for (const child of readdirSync(file)) {
            if (child !== '.' && child !== '..') {
              const dir = join(file, child);
              if (!customProcess({
                name: child,
                path: dir
              }, helpers)) {
                if (child === 'bundles') {
                  processBundles(dir);
                } else {
                  walkDir(dir);
                }
              }
            }
          }
          processDir(file);
        } else {
          processFile(file);
        }
      }

      function processBundles(file) {
        for (const child of readdirSync(file)) {
          if (/\.src\.js$/.test(child) ||
              /\.md$/.test(child)) {
            deleteFile(join(file, child));
          }
        }
      }

      function processDir(file) {
        if (readdirSync(file).length === 0) {
          deleteDir(file);
        }
      }

      function processFile(file) {
        if (/[\/\\]test[\/\\]/.test(file) ||
            !/(\.(svg|png|jpg|jpeg|eot|ttf|woff|woff2))|(-extensions\.json)$/.test(file)) {
          deleteFile(file);
        }
      }

      function deleteDir(file) {
        grunt.verbose.writeln('Deleting directory "' + file + '"...');
        rmdirSync(file);
        ++directoryCount;
      }

      function deleteFullDir(file) {
        if (grunt.file.isDir(file)) {
          for (const child of readdirSync(file)) {
            if (child !== '.' && child !== '..') {
              deleteFullDir(join(file, child));
            }
          }
          deleteDir(file);
        } else {
          deleteFile(file);
        }
      }

      function deleteFile(file) {
        grunt.verbose.writeln('Deleting file "' + file + '"...');
        unlinkSync(file);
        ++fileCount;
      }

      const options = this.options({
        force: false,
        processItem: function () {}
      });
      const helpers = {
        deleteDir: function (file) {
          if (existsSync(file)) {
            deleteDir(file);
          }
        },
        deleteFile: function (file) {
          if (existsSync(file)) {
            deleteFile(file);
          }
        },
        deleteFullDir: function (file) {
          if (existsSync(file)) {
            deleteFullDir(file);
          }
        },
        walkDir: walkDir
      };
      const customProcess = options.processItem;
      const src = this.data.src;
      let directoryCount = 0;
      let fileCount = 0;

      if (src) {
        walkDir(src);
        grunt.log.ok(`${directoryCount} directories and ${fileCount} files deleted.`);
      } else {
        const warn = options.force ? grunt.log.warn : grunt.fail.warn;
        warn('Mandatory parameter "src" not set.');
      }
    });
};
