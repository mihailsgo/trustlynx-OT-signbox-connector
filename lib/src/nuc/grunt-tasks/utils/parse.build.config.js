/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


'use strict';

var { readFileSync } = require('fs');

const configs = new Map;

function parseFile (fileContents) {
  const require = {
    config: object => (config = object)
  };
  let config;
  eval(fileContents);
  return config;
}

module.exports = function (filePath) {
  let config = configs.get(filePath);
  if (config) {
    return config;
  }
  const fileContents = readFileSync(filePath, 'utf-8');
  config = parseFile(fileContents);
  if (!config) {
    throw new Error(`Parsing "${filePath}" failed.`);
  }
  configs.set(filePath, config);
  return config;
};
