/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */


'use strict';

const { accessSync, constants, existsSync, readFileSync, writeFileSync } = require('fs');
const { isAbsolute } = require('path');

module.exports = function createRequireConfigs (configObject, buildOptions, alternativeNucleusPath) {
  if (configObject.prefix) {
    const dependencies = configObject.dependencies || [];
    if (!dependencies.includes('nuc')) {
      dependencies.push('nuc');
    }
    const originalPaths = configObject.paths;
    configObject.paths = { [configObject.prefix]: '.' };
    for (const dependency of dependencies) {
      configObject.paths[dependency] = 'empty:';
    }
    Object.assign(configObject.paths, originalPaths);
    delete configObject.prefix;
    delete configObject.dependencies;
  }
  if (typeof buildOptions !== 'object') {
    buildOptions = { buildConfig: buildOptions };
  }
  if (alternativeNucleusPath) {
    buildOptions.nucleusPath = alternativeNucleusPath;
  }
  const {
    buildConfig = 'config-build.js',
    editorConfig = '../config-editor.js',
    nucleusPath = '../lib/src/nuc'
  } = buildOptions;

  console.log('Generating the build configuration.');
  const srcPath = nucleusPath.replace(/\/nuc$/, '');
  for (const compPrefix in configObject.paths) {
    const configPath = configObject.paths[compPrefix];
    if (configPath !== 'empty:') continue;

    let compModule = `${srcPath}/${compPrefix}/component`;
    if (!isAbsolute(compModule)) {
      compModule = `${process.cwd()}/${compModule}`;
    }
    try {
      require.resolve(compModule);
    } catch (error) {
      console.warn(`  "${compPrefix}" is not a Smart UI component`);
      continue;
    }

    try {
      const { getRequireJsPluginPaths } = require(compModule);
      if (getRequireJsPluginPaths) {
        const pluginPaths = getRequireJsPluginPaths()
        const pathCount = Object.keys(pluginPaths).length
        const pathText = pathCount === 1 ? 'path' : 'paths'
        console.log(`  Adding ${pathCount} ${pathText} from "${compPrefix}".`);
        for (const sourceModule in pluginPaths) {
          configObject.paths[sourceModule] = `../lib/src/${compPrefix}/${pluginPaths[sourceModule]}`;
        }
      }
    } catch (error) {
      console.warn(`  Loading the component descriptor for "${compPrefix}" failed:`);
      console.warn(`  Current directory: "${process.cwd()}".`);
      console.warn(`  ${error.stack}`);
    }
  }
  configObject.rename = Object.assign({
    'csui/lib/backbone': 'nuc/lib/backbone',
    'csui/lib/css.escape': 'nuc/lib/css.escape',
    'csui/lib/css': 'nuc/lib/css',
    'csui/lib/domReady': 'nuc/lib/domReady',
    'csui/lib/handlebars': 'nuc/lib/handlebars',
    'csui/lib/handlebars.helpers.xif': 'nuc/lib/handlebars.helpers.xif',
    'csui/lib/hbs': 'nuc/lib/hbs',
    'csui/lib/i18n': 'nuc/lib/i18n',
    'csui/lib/i18nprecompile': 'nuc/lib/i18nprecompile',
    'csui/lib/jquery': 'nuc/lib/jquery',
    'csui/lib/jquery.ajax-progress': 'nuc/lib/jquery.ajax-progress',
    'csui/lib/jquery.binary.ajax': 'nuc/lib/jquery.binary.ajax',
    'csui/lib/jquery.mockjax': 'nuc/lib/jquery.mockjax',
    'csui/lib/jquery.parse.param': 'nuc/lib/jquery.parse.param',
    'csui/lib/jquery.when.all': 'nuc/lib/jquery.when.all',
    'csui/lib/json': 'nuc/lib/json',
    'csui/lib/jsonpath': 'nuc/lib/jsonpath',
    'csui/lib/less-builder': 'nuc/lib/less-builder',
    'csui/lib/less': 'nuc/lib/less',
    'csui/lib/log4javascript': 'nuc/lib/log4javascript',
    'csui/lib/marionette': 'nuc/lib/marionette',
    'csui/lib/marionette3': 'nuc/lib/marionette3',
    'csui/lib/moment': 'nuc/lib/moment',
    'csui/lib/moment-timezone': 'nuc/lib/moment-timezone',
    'csui/lib/normalize': 'nuc/lib/normalize',
    'csui/lib/numeral': 'nuc/lib/numeral',
    'csui/lib/radio': 'nuc/lib/radio',
    'csui/lib/require.config': 'nuc/lib/require.config',
    'csui/lib/text': 'nuc/lib/text',
    'csui/lib/underscore.deepExtend': 'nuc/lib/underscore.deepExtend',
    'csui/lib/underscore': 'nuc/lib/underscore',
    'csui/lib/underscore.string': 'nuc/lib/underscore.string',
    'csui/models/action': 'nuc/models/action',
    'csui/models/actions': 'nuc/models/actions',
    'csui/models/actionitem': 'nuc/models/actionitem',
    'csui/models/actionitems': 'nuc/models/actionitems',
    'csui/models/addabletype': 'nuc/models/addabletype',
    'csui/models/addabletypes': 'nuc/models/addabletypes',
    'csui/models/ancestor': 'nuc/models/ancestor',
    'csui/models/ancestors': 'nuc/models/ancestors',
    'csui/models/authenticated.user': 'nuc/models/authenticated.user',
    'csui/models/authentication': 'nuc/models/authentication',
    'csui/models/clientsidecollection': 'nuc/models/clientsidecollection',
    'csui/models/column': 'nuc/models/column',
    'csui/models/columns': 'nuc/models/columns',
    'csui/models/datadefinition': 'nuc/models/datadefinition',
    'csui/models/datadefinitions': 'nuc/models/datadefinitions',
    'csui/models/member': 'nuc/models/member',
    'csui/models/member/member.model': 'nuc/models/member/member.model',
    'csui/models/member/membercollection': 'nuc/models/member/membercollection',
    'csui/models/members': 'nuc/models/members',
    'csui/models/mixins/appcontainer/appcontainer.mixin': 'nuc/models/mixins/appcontainer/appcontainer.mixin',
    'csui/models/node/node.addable.type.collection': 'nuc/models/node/node.addable.type.collection',
    'csui/models/node/node.model': 'nuc/models/node/node.model',
    'csui/models/node.children2/node.children2': 'nuc/models/node.children2/node.children2',
    'csui/models/node.columns2': 'nuc/models/node.columns2',
    'csui/models/nodeancestors': 'nuc/models/nodeancestors',
    'csui/models/nodechildrencolumn': 'nuc/models/nodechildrencolumn',
    'csui/models/nodechildrencolumns': 'nuc/models/nodechildrencolumns',
    'csui/models/nodechildren': 'nuc/models/nodechildren',
    'csui/models/node.actions': 'nuc/models/node.actions',
    'csui/models/nodes': 'nuc/models/nodes',
    'csui/models/tool.item.config/tool.item.config.collection': 'nuc/models/tool.item.config/tool.item.config.collection',
    'csui/models/tool.item.mask/tool.item.mask.collection': 'nuc/models/tool.item.mask/tool.item.mask.collection',
    'csui/models/browsable/browsable.mixin': 'nuc/models/browsable/browsable.mixin',
    'csui/models/browsable/client-side.mixin': 'nuc/models/browsable/client-side.mixin',
    'csui/models/browsable/v1.request.mixin': 'nuc/models/browsable/v1.request.mixin',
    'csui/models/browsable/v1.response.mixin': 'nuc/models/browsable/v1.response.mixin',
    'csui/models/browsable/v2.response.mixin': 'nuc/models/browsable/v2.response.mixin',
    'csui/models/mixins/autofetchable/autofetchable.mixin': 'nuc/models/mixins/autofetchable/autofetchable.mixin',
    'csui/models/mixins/commandable/commandable.mixin': 'nuc/models/mixins/commandable/commandable.mixin',
    'csui/models/mixins/connectable/connectable.mixin': 'nuc/models/mixins/connectable/connectable.mixin',
    'csui/models/mixins/delayed.commandable/delayed.commandable.mixin': 'nuc/models/mixins/delayed.commandable/delayed.commandable.mixin',
    'csui/models/mixins/expandable/expandable.mixin': 'nuc/models/mixins/expandable/expandable.mixin',
    'csui/models/mixins/fetchable/fetchable.mixin': 'nuc/models/mixins/fetchable/fetchable.mixin',
    'csui/models/mixins/including.additional.resources/including.additional.resources.mixin': 'nuc/models/mixins/including.additional.resources/including.additional.resources.mixin',
    'csui/models/mixins/node.autofetchable/node.autofetchable.mixin': 'nuc/models/mixins/node.autofetchable/node.autofetchable.mixin',
    'csui/models/mixins/node.connectable/node.connectable.mixin': 'nuc/models/mixins/node.connectable/node.connectable.mixin',
    'csui/models/mixins/node.resource/node.resource.mixin': 'nuc/models/mixins/node.resource/node.resource.mixin',
    'csui/models/mixins/resource/resource.mixin': 'nuc/models/mixins/resource/resource.mixin',
    'csui/models/mixins/rules.matching/rules.matching.mixin': 'nuc/models/mixins/rules.matching/rules.matching.mixin',
    'csui/models/mixins/state.carrier/state.carrier.mixin': 'nuc/models/mixins/state.carrier/state.carrier.mixin',
    'csui/models/mixins/state.requestor/state.requestor.mixin': 'nuc/models/mixins/state.requestor/state.requestor.mixin',
    'csui/models/mixins/syncable.from.multiple.sources/syncable.from.multiple.sources.mixin': 'nuc/models/mixins/syncable.from.multiple.sources/syncable.from.multiple.sources.mixin',
    'csui/models/mixins/uploadable/uploadable.mixin': 'nuc/models/mixins/uploadable/uploadable.mixin',
    'csui/models/mixins/v2.additional.resources/v2.additional.resources.mixin': 'nuc/models/mixins/v2.additional.resources/v2.additional.resources.mixin',
    'csui/models/mixins/v2.commandable/v2.commandable.mixin': 'nuc/models/mixins/v2.commandable/v2.commandable.mixin',
    'csui/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin': 'nuc/models/mixins/v2.delayed.commandable/v2.delayed.commandable.mixin',
    'csui/models/mixins/v2.expandable/v2.expandable.mixin': 'nuc/models/mixins/v2.expandable/v2.expandable.mixin',
    'csui/models/mixins/v2.fields/v2.fields.mixin': 'nuc/models/mixins/v2.fields/v2.fields.mixin',
    'csui/models/autofetchable': 'nuc/models/autofetchable',
    'csui/models/connectable': 'nuc/models/connectable',
    'csui/models/expandable':'nuc/models/expandable',
    'csui/models/fetchable': 'nuc/models/fetchable',
    'csui/models/including.additional.resources': 'nuc/models/including.additional.resources',
    'csui/models/nodeautofetchable': 'nuc/models/nodeautofetchable',
    'csui/models/nodeconnectable': 'nuc/models/nodeconnectable',
    'csui/models/noderesource': 'nuc/models/noderesource',
    'csui/models/resource': 'nuc/models/resource',
    'csui/models/uploadable': 'nuc/models/uploadable',
    'csui/models/utils/v1tov2': 'nuc/models/utils/v1tov2',
    'csui/utils/contexts/context': 'nuc/contexts/context',
    'csui/utils/contexts/context.plugin': 'nuc/contexts/context.plugin',
    'csui/utils/contexts/factories/connector': 'nuc/contexts/factories/connector',
    'csui/utils/contexts/factories/factory': 'nuc/contexts/factories/factory',
    'csui/utils/contexts/fragment/context.fragment': 'nuc/contexts/fragment/context.fragment',
    'csui/utils/contexts/mixins/clone.and.fetch.mixin': 'nuc/contexts/mixins/clone.and.fetch.mixin',
    'csui/utils/contexts/page/page.context': 'nuc/contexts/page/page.context',
    'csui/utils/contexts/synchronized.context': 'nuc/contexts/synchronized.context',
    'csui/utils/base': 'nuc/utils/base',
    'csui/utils/connector': 'nuc/utils/connector',
    'csui/utils/deepClone/deepClone': 'nuc/utils/deepClone/deepClone',
    'csui/utils/errormessage': 'nuc/utils/errormessage',
    'csui/utils/errors': 'nuc/utils/errors',
    'csui/utils/errors/request': 'nuc/utils/errors/request',
    'csui/utils/errors/response': 'nuc/utils/errors/response',
    'csui/utils/log': 'nuc/utils/log',
    'csui/utils/messagehelper': 'nuc/utils/messagehelper',
    'csui/utils/namedlocalstorage': 'nuc/utils/namedlocalstorage',
    'csui/utils/namedsessionstorage': 'nuc/utils/namedsessionstorage',
    'csui/utils/namedstorage': 'nuc/utils/namedstorage',
    'csui/utils/page.leaving.blocker': 'nuc/utils/page.leaving.blocker',
    'csui/utils/promoted.actionitems': 'nuc/utils/promoted.actionitems',
    'csui/utils/types/date': 'nuc/utils/types/date',
    'csui/utils/types/localizable': 'nuc/utils/types/localizable',
    'csui/utils/types/member': 'nuc/utils/types/member',
    'csui/utils/types/number': 'nuc/utils/types/number',
    'csui/utils/url': 'nuc/utils/url',
    'csui/utils/authenticators/authenticator': 'nuc/utils/authenticators/authenticator',
    'csui/utils/authenticators/authenticators': 'nuc/utils/authenticators/authenticators',
    'csui/utils/authenticators/basic.authenticator': 'nuc/utils/authenticators/basic.authenticator',
    'csui/utils/authenticators/credentials.authenticator': 'nuc/utils/authenticators/credentials.authenticator',
    'csui/utils/authenticators/initial.header.authenticator': 'nuc/utils/authenticators/initial.header.authenticator',
    'csui/utils/authenticators/regular.header.authenticator': 'nuc/utils/authenticators/regular.header.authenticator',
    'csui/utils/authenticators/request.authenticator': 'nuc/utils/authenticators/request.authenticator',
    'csui/utils/authenticators/ticket.authenticator': 'nuc/utils/authenticators/ticket.authenticator',
    'csui/utils/authenticator': 'nuc/utils/authenticator',
    'csui/utils/basicauthenticator': 'nuc/utils/basicauthenticator',
    'csui/utils/headerauthenticator': 'nuc/utils/headerauthenticator',
    'csui/utils/requestauthenticator': 'nuc/utils/requestauthenticator',
    'csui/models/authenticated.user/server.adaptor.mixin': 'nuc/models/authenticated.user/server.adaptor.mixin',
    'csui/models/member/server.adaptor.mixin': 'nuc/models/member/server.adaptor.mixin',
    'csui/models/node/server.adaptor.mixin': 'nuc/models/node/server.adaptor.mixin',
    'csui/models/node.children/server.adaptor.mixin': 'nuc/models/node.children/server.adaptor.mixin',
    'csui/models/node.children2/server.adaptor.mixin': 'nuc/models/node.children2/server.adaptor.mixin',
    'csui/utils/authenticators/server.adaptors/basic.mixin': 'nuc/utils/authenticators/server.adaptors/basic.mixin',
    'csui/utils/authenticators/server.adaptors/credentials.mixin': 'nuc/utils/authenticators/server.adaptors/credentials.mixin',
    'csui/utils/authenticators/server.adaptors/initial.header.mixin': 'nuc/utils/authenticators/server.adaptors/initial.header.mixin'
  }, configObject.rename);
  configObject.map = Object.assign({ '*': {} }, configObject.map);
  ensureRenameMapMerged(configObject.map['*']);
  function ensureRenameMapMerged(starMap) {
    var rename = configObject.rename;
    Object
      .keys(rename)
      .forEach(function (oldName) {
          var newName = rename[oldName];
          if (!starMap[newName]) {
              var mappedName = starMap[oldName];
              if (mappedName) {
                  starMap[newName] = mappedName;
              }
          }
          if (!starMap[oldName]) {
              starMap[oldName] = starMap[newName] || newName;
          }
      });
    delete configObject.rename;
  }
  configObject.hbs = Object.assign({
    'disableI18n': true,
    'disableHelpers': true,
    'templateExtension': 'hbs'
  }, configObject.hbs);
  configObject.less = Object.assign({
    'sourceMap': {
      'sourceMapFileInline': true
    }
  });

  const buildContent = `require.config(${JSON.stringify(configObject, undefined, 2)});`;
  if (needsUpdate(buildConfig)) {
    console.log(`  Writing ${buildConfig}.`);
    writeFileSync(buildConfig, buildContent);
  }
  let updateEditor = true;
  try {
    updateEditor = needsUpdate(editorConfig);
  } catch {
    console.log(`  Ignoring not writable ${editorConfig}.`);
    updateEditor = false;
  }
  if (updateEditor) {
    console.log(`  Writing ${editorConfig}.`);
    writeFileSync(editorConfig, buildContent);
  }

  console.log('Done.\n');
  function needsUpdate(fileName) {
    if (existsSync(fileName)) {
      accessSync(fileName, constants.R_OK | constants.W_OK);
      const buildConfigContent = readFileSync(fileName, 'utf8');
      if (buildConfigContent.startsWith('//')) {
        console.log(`  Ignoring customised ${fileName}.`);
        return false;
      }
    }
    return true;
  }
};
