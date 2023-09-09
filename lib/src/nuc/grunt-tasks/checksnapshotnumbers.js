/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

module.exports = function (grunt) {

  var fs = require('fs-extra'),
      _ = grunt.util._;
  grunt.registerMultiTask('checkSnapshotNumbers',
      'check correct number of snapshots',

	function() {
		var name = this.name;
		var expectedNumber = this.data.options.expectedNumber;
		grunt.log.debug(name + ": " + this.files.length + " vs " + expectedNumber);
		
		if (expectedNumber > this.files.length) {
			throw new Error(name + ": expected " + expectedNumber + " files but only got " + this.files.length);
		}
	}
	);
};