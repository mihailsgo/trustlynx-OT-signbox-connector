/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([], function () {

  'use strict';

  function makeRegexClass(match,chars,include,exclude) {
    if (exclude) {
      chars = chars.replace(exclude,"");
    }
    chars = chars.replace(/[\\\]]/g,'\\$&');
    if (include) {
      chars = chars + include;
    }
    return match ? "[" + chars + "]" : "[^" + chars + "]";
  }
  var quoteChars = "\"“”'‘’´`";
  var regexChars = ".*+?^${}()|[]\\";
  var otherChars = "°!²§³%&/=@€~#><µ;,:-";
  var delimChars = quoteChars + regexChars + otherChars;

  var delimClass = makeRegexClass(true,delimChars,"\\s");
  var delimRegex = new RegExp(delimClass+"+");
  var nonDelimClass = makeRegexClass(false,delimChars,"\\s");
  var nonDelimStartRegex = new RegExp("^"+nonDelimClass+"+");
  var nonDelimEndRegex = new RegExp(nonDelimClass+"+$");

  var incompleteStartClass = makeRegexClass(false,delimChars,"\\s");
  var incompleteEndClass = makeRegexClass(false,delimChars,"\\s",/</g);
  var incompleteStartRegex = new RegExp("^"+incompleteStartClass);
  var incompleteEndRegex = new RegExp(incompleteEndClass+"$");

  var regexClass = makeRegexClass(true,regexChars);
  var quoteClass = makeRegexClass(true,quoteChars);
  var regexQuoteClass = makeRegexClass(true,regexChars+quoteChars);
  function escapeRegExp(string) {
    return string.replace(new RegExp(regexClass,'g'),'\\$&'); // $& means the whole matched string
  }

  function middle_phrase(name) {
    if (delimRegex.exec(name)) {
      throw new Error("middle phrase contains delimiters.");
    }
    return name;
  }

  function truncation_phrase(name) {
    return name.replace(new RegExp(regexQuoteClass,'g'), '\\$&').replace(/\*$/,'$& ');
  }

  function word_phrase(name) {
    return name.replace(/[*?\s]+/g,' ').replace(new RegExp(quoteClass,'g'),'\\$&');
  }

  function makePhrases(name,incompleteStart,incompleteEnd) {

    var result = {};

    if (incompleteStart && incompleteEnd) {
      if (delimRegex.exec(name)) {
        var left = name.replace(nonDelimEndRegex,"");
        if (left) {
          if (left.replace(delimRegex,"").length===0) {
            left = "";
          } else if (!delimRegex.exec(left[left.length-1])) {
            left = left + " ";
          }
          result.left = truncation_phrase(left);
        }
        var right = name.replace(nonDelimStartRegex,"");
        if (right) {
          if (right.replace(delimRegex,"").length===0) {
            right = "";
          } else if (!delimRegex.exec(right[0])) {
            right = right + " ";
          }
          result.right = truncation_phrase(right);
        }
      } else {
        result.middle = middle_phrase(name);
      }

    } else if (incompleteStart && !incompleteEnd) {
      result.left = truncation_phrase(name);
    } else if (!incompleteStart && incompleteEnd) {
      result.right = truncation_phrase(name);
    } else /*if (!incompleteStart && !incompleteEnd)*/ {
      var word = name.replace(delimRegex,"").replace(delimRegex,"");
      if (delimRegex.exec(word)) {
        result.right = result.left = truncation_phrase(name);
      } else {
        result.words = word_phrase(name).replace(/^\s+$/,"");
      }
    }

    return result;
  }

  var SearchUtil = {
     makePhrasesForContainsSearch: function(name) {

      var incompleteStart = incompleteStartRegex.exec(name||"");
      var incompleteEnd = incompleteEndRegex.exec(name||"");

      return makePhrases(name, incompleteStart, incompleteEnd);
    },
    makePhrasesForStartsWithSearch: function(name) {

      var incompleteStart = incompleteStartRegex.exec(name||"");
      var incompleteEnd = incompleteEndRegex.exec(name||"");
      name = incompleteStart ? " "+name : name;

      return makePhrases(name, false, incompleteEnd);
    },
    makeLQLFromPhrases: function(region,phrases){

      var conditions = [];

      if (phrases.middle) {
        conditions.push(region + ' *' + phrases.middle + '*');
      }
      if (phrases.words) {
        conditions.push(region + ' "' + phrases.words + '"');
      }
      if (phrases.left) {
        conditions.push(region + ' QLLEFT-TRUNCATION "' + phrases.left + '"');
      }
      if (phrases.right) {
        conditions.push(region + ' QLRIGHT-TRUNCATION "' + phrases.right + '"');
      }

      return conditions.join(" & ");
    },

    getSignificanceForPhrases: function(phrases) {
      var significance = 0;
      if (phrases) {
        if (phrases.words) {
          significance += phrases.words.trim().replace(/\s+/g," ").length + 2;
        }
        if (phrases.middle) {
          significance += phrases.middle.length;
        }
        if (phrases.left) {
          significance += phrases.left.trim().replace(/\s+/g," ").length + 1;
        }
        if (phrases.right) {
          significance += phrases.right.trim().replace(/\s+/g," ").length + 1;
        }
      }
      return significance;
    }

  };

  return SearchUtil;
});