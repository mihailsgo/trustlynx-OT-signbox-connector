/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


'use strict';

const { readFileSync } = require('fs');

const bundles = new Map;

function parseModule (fileContents) {
  function require() {}
  function define(name, dependencies) {
    bundleIndex = Array.isArray(name) ? name : dependencies;
  }
  let bundleIndex;
  eval(fileContents);
  return bundleIndex;
}

module.exports = function (filePath) {
  let bundleIndex = bundles.get(filePath);
  if (bundleIndex) {
    return bundleIndex;
  }
  const fileContents = readFileSync(filePath, 'utf-8');
  bundleIndex = parseModule(fileContents);
  if (!bundleIndex) {
    throw new Error(`Parsing "${filePath}" failed.`);
  }
  bundles.set(filePath, bundleIndex);
  return bundleIndex;
};
