/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


'use strict';

var { readFileSync } = require('fs');

const objects = new Map;

function parseModule (fileContents) {
  function define(name, content) {
    result = typeof name === 'string' ? content : name;
  }
  let result;
  eval(fileContents);
  return result;
}

module.exports = function (filePath) {
  let object = objects.get(filePath);
  if (object) {
    return object;
  }
  const fileContents = readFileSync(filePath, 'utf-8');
  object = parseModule(fileContents);
  if (!object) {
    throw new Error(`Parsing "${filePath}" failed.`);
  }
  objects.set(filePath, object);
  return object;
};
