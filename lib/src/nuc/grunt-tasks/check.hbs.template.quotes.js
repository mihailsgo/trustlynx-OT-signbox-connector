/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

module.exports = function (grunt) {

  var fs = require('fs-extra'),
    _ = grunt.util._;
  grunt.registerMultiTask('checkHbsTemplateQuotes',
    'Check *.hbs files for missing quotes around templates',

    function () {

      var taskName = this.name;
      grunt.log.debug(taskName + ": found " + this.files.length + " files");
      var numFound = 0;
      _.each(this.files, function (file) {

        var src = file.src[0];
        var jsText = fs.readFileSync(src, 'utf8');

        var regex =/[A-Za-z-_]+={{/g;
        var searchRes = jsText.match(regex);
        if (searchRes) {
          numFound += searchRes.length;
          grunt.log.error(src + " uses " + searchRes.length + " attributes with unquoted handle bars templates templates.");
        }
      });
      if (numFound > 0) {
        grunt.fail.warn("Found " + numFound + " attributes with unquoted templates in handlebars files.");
      } else {
        grunt.log.debug("No attributes with unquoted templates used in handlebars files.");
      }
    });

};