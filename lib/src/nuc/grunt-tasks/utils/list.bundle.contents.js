/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


'use strict';

const { readFileSync } = require('fs');

const bundles = new Map;

function parseDependencies (dependencies) {
  let temp;
  return dependencies ? eval(`temp = ${dependencies}`) : []
}

function parseLoader (fileContents) {
  const moduleDeclaration = /csui\.define\(['"]([^'"]+)['"](?:\s*,\s*(\[[^\]]+\]))?/g;
  const bundleContents = [];
  let match;
  while ((match = moduleDeclaration.exec(fileContents))) {
    let deps = parseDependencies(match[2]);
    deps = deps.filter(dep => dep !== 'require' && dep != 'module' && dep != 'exports')
    bundleContents.push({ id: match[1], deps });
  }
  return bundleContents;
}

function parseModule (fileContents) {
  const csui = {
    require: () => {},
    define: (id, dependencies) => {
      if (typeof id !== 'string') {
        throw new Error('Unnamed module encountered.');
      }
      let deps = Array.isArray(dependencies) ? dependencies : [];
      deps = deps.filter(dep => dep !== 'require' && dep != 'module' && dep != 'exports')
      bundleContents.push({ id, deps })
    }
  };
  const bundleContents = [];
  eval(fileContents);
  return bundleContents;
}

module.exports = function (filePath) {
  let bundleContents = bundles.get(filePath);
  if (bundleContents) {
    return bundleContents;
  }
  const fileContents = readFileSync(filePath, 'utf-8');
  try {
    bundleContents = parseModule(fileContents);  
  } catch {
    bundleContents = parseLoader(fileContents);
  }
  if (bundleContents.length === 0) {
    throw new Error(`Parsing "${filePath}" failed.`);
  }
  bundles.set(filePath, bundleContents);
  return bundleContents;
};
