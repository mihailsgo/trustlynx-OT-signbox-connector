/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

'use strict';

module.exports = function (grunt) {
  const svgson = require('svgson');
  const path = require('path');
  const fs = require('fs');
  const readline = require('readline');
  const {promisify} = require('util');
  const readdir = promisify(fs.readdir);
  const mkdir = promisify(fs.mkdir);
  const rmdir = promisify(fs.rmdir);
  const unlink = promisify(fs.unlink);
  const stat = promisify(fs.stat);
  const copyFile = promisify(fs.copyFile);
  const _ = require('underscore');

  function readFile(path, opts = 'utf8') {
    return new Promise((resolve, reject) => {
      fs.readFile(path, opts, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  function writeFile(path, data, opts = 'utf8') {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, data, opts, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  function parseStyles(stylesStr) {
    let allStyles = stylesStr.split(';');
    let styles = {};
    for (let k = 0; k < allStyles.length; k++) {
      if (allStyles[k]) {
        let keyValue = allStyles[k].split(':');
        styles[keyValue[0].trim()] = keyValue[1].trim();
      }
    }
    return styles;
  }

  function expandShorthandHexColor(colorString) {
    let expandedColorString = '#';
    if (colorString && colorString.length === 4 && colorString[0] === '#') {
      for (let i = 1; i < colorString.length; i++) {
        expandedColorString = expandedColorString + colorString[i] + colorString[i];
      }
    } else {
      expandedColorString = colorString;
    }
    return expandedColorString;
  }

  async function createClassMappings(svgStr) {
    let ids = {};
    const svgAst1 = await svgson.parse(svgStr, {
      transformNode: function (node) {
        if (node.type === "element" && node.attributes && node.attributes.id) {
          const id = node.attributes.id;
          switch (id) {
          case 'state':
          case 'focus':
          case 'colorFirst':
          case 'colorSecond':
          case 'colorThird':
            if (node.attributes.class) {
              ids[node.attributes.class] = `csui-icon-v2-${id}`;
            }
            break;
          case 'metaphor':
            let cnt = 0;
            if (node.attributes.class) {
              ids[node.attributes.class] = `csui-icon-v2-${id}${cnt}`;
              cnt++;
            }
            if (node.children) {
              for (let ci = 0; ci < node.children.length; ci++) {
                let child = node.children[ci];
                if (child.type === 'element' && child.attributes) {
                  if (!ids[child.attributes.class]) {
                    ids[child.attributes.class] = `csui-icon-v2-${id}${cnt}`;
                    cnt++;
                  }
                }
              }
            }
            break;
          } // switch
        }
      } // transformNode
    });
    return ids;
  }

  async function getStylesForClasses(svgStr) {
    let styles = {};
    const svgAst1 = await svgson.parse(svgStr, {
      transformNode: function (node) {
        if (node.type === "element" && node.name === "style") {
          let newChildren = [];
          for (let k = 0; node.children && k < node.children.length; k++) {
            let child = node.children[k];
            let all = child.value;
            let matches;
            let regex = /\.(.*?)\{(.*?)\}/g;
            while ((matches = regex.exec(all)) != null) {
              if (matches && matches.length === 3) {
                let selector = matches[1].trim();
                styles[selector] = parseStyles(matches[2]);
              }
            }
          }
        }
      } // transformNode
    });
    return styles;
  }

  function replaceClassByInlineStyles(nodeAttributes, styles) {
    let c = nodeAttributes.class;
    let stylesForClass = styles[c];
    for (let i = 0; i < Object.keys(stylesForClass).length; i++) {
      const styleName = Object.keys(stylesForClass)[i];
      if (styleName === 'enable-background') {
        continue; // skip enable-background, because it produces invalid html
      }
      const styleValue = stylesForClass[styleName];
      if (nodeAttributes[styleName]) {
        grunt.log.warn(
            `Replacing style ${styleName}. Old value: ${nodeAttributes[styleName]}, new value: ${styleValue}. (this was not expected - you should investigate)`);
      }
      nodeAttributes[styleName] = styleValue;
    }
    delete nodeAttributes.class;
  }

  async function convertClassesToInlineStyles(svgStr, classMappingToNormalizedClassNames,
      sourceStylesByClasses, iconName, extraCssClass) {

    const svgAst1 = await svgson.parse(svgStr, {
      transformNode: function (node) {
        if (node.type === "element") {
          switch (node.name) {
          case "style":
            break;
          case 'svg':
            if (!node.attributes) {
              node.attributes = {};
            }
            delete node.attributes.id;
            delete node.attributes['data-name'];
            delete node.attributes['version'];
            delete node.attributes['xmlns:xlink'];
            delete node.attributes['xml:space'];
            delete node.attributes['style'];
            node.attributes['class'] = 'csui-icon-v2' + extraCssClass + ' csui-icon-v2__' +
                                       iconName;
            break;
          default:
            if (node.attributes) {
              let nodeAttributes = node.attributes;
              let inlineStyles = JSON.parse(JSON.stringify(sourceStylesByClasses));  // deep clone
              if (nodeAttributes.id) {
                delete nodeAttributes.id;
              }
              if (nodeAttributes.class) {
                const originalClass = nodeAttributes.class;
                replaceClassByInlineStyles(nodeAttributes, inlineStyles);
                nodeAttributes.class = classMappingToNormalizedClassNames[originalClass];
              }
            }
          } // switch

        }
        return node;
      }
    });
    if (svgAst1.children) {
      for (let i = 0; i < svgAst1.children.length; i++) {
        let child = svgAst1.children[i];
        if (child.name === "style" || child.name === "defs" && child.children && child.name ===
            "defs" && child.children[0].name === "style") {
          svgAst1.children.splice(i, 1);
          break;
        }
      }
      for (let i = 0; i < svgAst1.children.length; i++) {
        let child = svgAst1.children[i];
        if (child.name === "title") {
          svgAst1.children.splice(i, 1);
          break;
        }
      }

    }

    const outSVGstr = svgson.stringify(svgAst1);

    return outSVGstr;
  }
  function addToClassMapping(srcClassName, targetClassName, ids) {
    if (srcClassName) {
      if (ids[srcClassName]) {
        ids[srcClassName].push(targetClassName);
      } else {
        ids[srcClassName] = [targetClassName];
      }
      return true;
    } else {
      return false;
    }
  }
  async function getClasses(svgStr) {
    let ids = {};
    const svgAst1 = await svgson.parse(svgStr, {
      transformNode: function (node) {
        if (node.type === "element" && node.attributes && node.attributes.id) {
          const id = node.attributes.id;
          switch (id) {
          case 'state':
          case 'focus':
          case 'colorFirst':
          case 'colorSecond':
          case 'colorThird':
            addToClassMapping(node.attributes.class, `csui-icon-v2-${id}`, ids);
            break;
          case 'metaphor':
            if (!addToClassMapping(node.attributes.class, `csui-icon-v2-${id}0`, ids)) {
              if (node.children) {
                for (let ci = 0; ci < node.children.length; ci++) {
                  let child = node.children[ci];
                  if (child.type === 'element' && child.attributes) {
                    addToClassMapping(child.attributes.class, `csui-icon-v2-${id}${ci}`, ids);
                  }
                }
              }
            }
            break;
          } // switch
        }
      } // transformNode
    });
    return ids;
  }
  async function renameClasses(ids, svgStr, iconName, extraCssClass) {
    let regex = /\.(.*)\{(.*)\}/g;
    const svgAst1 = await svgson.parse(svgStr, {
      transformNode: function (node) {

        if (node.type === "element" && node.name === "svg") {
          delete node.attributes.id;
          delete node.attributes['data-name'];
          node.attributes['class'] = 'csui-icon-v2' + extraCssClass + ' csui-icon-v2__' + iconName;
          if (node.children) {
            for (let ci = 0; ci < node.children.length; ci++) {
              let child = node.children[ci];
              if (child.type === "element" && child.name === "style") {
                node.children.splice(ci, 1);  // remove style element
                break;
              }
            }
          }
          return node;
        }

        if (node.type === "element" && node.attributes && node.attributes.id) {
          const id = node.attributes.id;
          switch (id) {
          case 'state':
          case 'focus':
          case 'colorFirst':
          case 'colorSecond':
          case 'colorThird':
            delete node.attributes.id;
            if (node.attributes.class) {
              node.attributes.class = `csui-icon-v2-${id}`;
            }
            break;
          case 'metaphor':
            delete node.attributes.id;
            if (node.attributes.class) {
              node.attributes.class = `csui-icon-v2-${id}0`; // use metaphor0
            } else {
              if (node.children) {
                for (let ci = 0; ci < node.children.length; ci++) {
                  let child = node.children[ci];
                  if (child.type === 'element' && child.attributes &&
                      child.attributes.class) {
                    child.attributes.class = `csui-icon-v2-${id}${ci}`;
                  }
                }
              }
            }
            break;
          }
          return node;
        }

        if (node.type === "element" && node.name === "style") {
          for (let k = 0; node.children && k < node.children.length; k++) {
            let svgClasses = {};
            let child = node.children[k];
            let all = child.value;
            let matches;
            do {
              matches = regex.exec(all);
              if (matches && matches.length === 3) {
                let selector = matches[1].trim();
                svgClasses[selector] = parseStyles(matches[2]);
              }
            } while (matches);
            let styleStr = '';
            const svgClassKeys = Object.keys(svgClasses);
            for (let l = 0; l < svgClassKeys.length; l++) {
              let cssClass = svgClassKeys[l];
              let replacedCssClasses = [cssClass];
              if (ids && ids[cssClass]) {
                replacedCssClasses = ids[cssClass];
              }
              if (svgClasses[cssClass]) {
                grunt.log.debug(
                    `class ${cssClass} will be replaced by ${replacedCssClasses.join(',')}`);

                for (let cd = 0; cd < replacedCssClasses.length; cd++) {
                  let cssClassDefinition = svgClasses[cssClass];
                  let replacedCssClass = replacedCssClasses[cd];

                  styleStr += `\n\t.${replacedCssClass} {`;
                  const styles = Object.keys(cssClassDefinition);
                  for (let m = 0; m < styles.length; m++) {
                    let style = styles[m];
                    let styleValue = cssClassDefinition[style];
                    styleStr += `${style}:${styleValue};`;
                  }
                  styleStr += '}';
                }
              }
            }

            styleStr += '\n';
            child.value = styleStr;
          }

          return node;
        }

        return node;
      }
    });

    return svgson.stringify(svgAst1);
  }

  async function processSVG(src, iconName, extraCssClass) {

    let completeSvgString = '';
    try {
      let svgStr = await new Promise(async (resolve, reject) => {
        readline.createInterface({
          input: fs.createReadStream(src),
          terminal: false
        }).on('line', function (line) {
          let truncatedLine = line.trim();
          if (!truncatedLine) {
            return;
          }
          if (truncatedLine.startsWith('<!--') && truncatedLine.endsWith('-->')) {
            return; // don't add comment
          }
          completeSvgString = completeSvgString + truncatedLine + ' ';
        }).on('close', function () {
          resolve(completeSvgString);
        });
      });
      let classMapping = await createClassMappings(svgStr);
      let styles = await getStylesForClasses(svgStr);
      let s = await convertClassesToInlineStyles(svgStr, classMapping, styles, iconName,
          extraCssClass);
      return s;

    } catch (ex) {
      grunt.log.error(`processSVG: exception while processing ${src}: ${ex}`);
      throw ex;
    }
  }

  function cleanupPreviouslyGeneratedFiles(srcFiles) {
    for (let j = 0; j < srcFiles.length; j++) {
      let oneFile = srcFiles[j];
      for (let k = 0; k < oneFile.src.length; k++) {
        let src = oneFile.src[k];
        let parsedSrc = path.parse(src);

        var children = fs.readdirSync(parsedSrc.dir, {withFileTypes: true});
        for (let f = 0; f < children.length; f++) {
          let dirent = children[f];
          if (!dirent.isFile()) {
            continue; // skip all but files
          }

          let nameWithoutExt = path.join(parsedSrc.dir, parsedSrc.name);
          let fileInDir = path.join(parsedSrc.dir, dirent.name);
          let parsedFileInDir = path.parse(fileInDir);
          if (fileInDir !== src && parsedFileInDir.ext === parsedSrc.ext) {
            if (fileInDir.startsWith(nameWithoutExt + '.') ||
                fileInDir.startsWith(nameWithoutExt + '~')) {
              fs.unlinkSync(fileInDir);
            }
          }
        }
      }
    }
  }
  async function exists(file) {
    try {
      return await stat(file);
    } catch (statEx) {
      if (statEx.code !== "ENOENT") {
        throw statEx;
      }
    }
  }

  grunt.registerMultiTask('generateSVGs', 'Takes SVG files from a list and generates versions' +
                                          ' of it with changed colors that can be used for a' +
                                          ' mode with a dark background like in high contrast' +
                                          ' mode', async function () {

    let done = this.async();
    const taskName = this.name;

    try {
      grunt.log.debug(`${taskName}, target ${this.target} has ${this.files.length} files blocks`);

      const options = this.data.options;
      grunt.log.debug(`options: ${JSON.stringify(options, undefined, 2)}`);

      let nameMap = options.nameMap ? options.nameMap : {};
      let iconNamePrefix = options.iconNamePrefix ? options.iconNamePrefix : '';
      let extraCssClass = options.extraCssClass ? ' ' + options.extraCssClass : '';

      for (let i = 0; i < this.files.length; i++) {
        let files = this.files[i];

        if (!_.isArray(files)) {
          files = [files];
        }
        for (let j = 0; j < files.length; j++) {
          let oneFileSet = files[j];
          let iconMapJSFileName = oneFileSet.dest;
          if (!iconMapJSFileName) {
            grunt.log.error(
                `${taskName}, target ${this.target}: dest not defined for fileset`);
            done(false);  // fail grunt task asynchronously
            return;
          }

          const iconMapJSFileStat = await exists(iconMapJSFileName);
          if (iconMapJSFileStat) {
            if (iconMapJSFileStat.isDirectory()) {
              grunt.log.error(
                  `${taskName}, target ${this.target}: dest (${iconMapJSFileName}) is an existing directory`);
              done(false);  // fail grunt task asynchronously
              return;
            }
          }

          if (!_.isArray(oneFileSet.src)) {
            oneFileSet.src = [oneFileSet.src];
          }
          if (oneFileSet.src.length) {
            let srcFiles = [];
            for (let k = 0; k < oneFileSet.src.length; k++) {
              let src = oneFileSet.src[k];
              const srcStat = await stat(src);
              if (srcStat.isDirectory()) {
                var filesInSrcDir = await readdir(src);
                for (let l = 0; l < filesInSrcDir.length; l++) {
                  var srcFile = filesInSrcDir[l];
                  let parsedSrcFile = path.parse(srcFile);
                  if (parsedSrcFile.ext === '.svg') {
                    srcFiles.push(path.join(src, srcFile));
                  }
                }
              } else {
                let parsedSrcFile = path.parse(src);
                if (parsedSrcFile.ext === '.svg') {
                  srcFiles.push(src);
                }
              }
            }

            let icons = {};
            let finalIconNames = {};
            for (let l = 0; l < srcFiles.length; l++) {
              const srcFile = srcFiles[l];
              grunt.log.debug(`src ${srcFile}`);
              let parsedSrcFile = path.parse(srcFile);
              let iconName = parsedSrcFile.name;
              if (nameMap[iconName]) {
                var finalName = iconNamePrefix + nameMap[iconName];
                if (finalIconNames[finalName]) {
                  throw new Error(
                      `Renaming of ${iconName} to ${finalName} would produce duplicate icon name`);
                }
                iconName = finalName;
              } else {
                iconName = iconNamePrefix + iconName;
              }
              finalIconNames[iconName] = true;

              if (icons[iconName]) {
                throw new Error(`Icon with name ${iconName} has duplicate name`);
              }
              let svgStr = await processSVG(srcFile, iconName, extraCssClass);
              icons[iconName] = svgStr;
            }
            let jsText = "define([], function () {\n" +
                         "  return {\n";
            let iconNames = Object.keys(icons);
            for (let l = 0; l < iconNames.length; l++) {
              let iconName = iconNames[l];
              let iconStr = icons[iconName];

              jsText += '"' + iconName + '":';
              jsText += "'" + iconStr + "',\n";
            }
            jsText += " };\n";
            jsText += "});";
            await writeFile(iconMapJSFileName, jsText);
          }

        }
      }
      done();
    } catch (ex) {
      grunt.log.error(`${taskName}, target ${this.target} has thrown an exception: ${ex}`);
      grunt.log.error(`${ex.stack}`);
      done(false);  // fail grunt task asynchronously
    }
  });

  async function rmdirs(dir) {
    let entries = await readdir(dir);
    let results = await Promise.all(entries.map(async (entry) => {
      let fullPath = path.join(dir, entry);
      let stats = await stat(fullPath);
      let task = stats.isDirectory() ? rmdirs(fullPath) : unlink(fullPath);
      return task.catch(error => ({error}));
    }));
    results.forEach(result => {
      if (result && result.error.code !== 'ENOENT') {
        throw result.error;
      }
    });
    await rmdir(dir);
  }

  grunt.registerMultiTask('cleanupGeneratedSVGs', 'Deletes all generated SVG files',
      async function () {

        let done = this.async();
        const taskName = this.name;

        try {
          let directories = this.data;

          if (!_.isArray(directories)) {
            directories = [directories];
          }

          for (let i = 0; i < directories.length; i++) {
            const dir = directories[i];

            if (await exists(dir)) {
              grunt.log.debug(`Deleting ${dir}...`);
              await rmdirs(dir);
            } else {
              grunt.log.debug(`Skip deleting ${dir}, because it does not exist`);
            }
          }
          grunt.log.debug(`Finished ${taskName}...`);

          done();
        } catch (ex) {
          grunt.log.error(`${taskName}, target ${this.target} has thrown an exception: ${ex}`);
          grunt.log.error(`${ex.stack}`);
          done(false);  // fail grunt task asynchronously
        }
      });
};
