csui.define([], function () {

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

  // delimChars: all characters, that are used as word delimiters in a LQL phrase
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

  // helper to escape all special regexp characters in a string
  // to make it usable in a regexp to search for that string
  function escapeRegExp(string) {
    return string.replace(new RegExp(regexClass,'g'),'\\$&'); // $& means the whole matched string
  }

  function middle_phrase(name) {
    // in a phrase used for *phrase*: ensure that it contains no delimiter.
    if (delimRegex.exec(name)) {
      throw new Error("middle phrase contains delimiters.");
    }
    return name;
  }

  function truncation_phrase(name) {
    // in a quoted phrase used in a truncation operation
    // escape regex characters and quote characters.
    // if * is at the end, append a space to avoid syntax error.
    return name.replace(new RegExp(regexQuoteClass,'g'), '\\$&').replace(/\*$/,'$& ');
  }

  function word_phrase(name) {
    // in a quoted phrase replace * and ? by spaces and escape quote characters.
    return name.replace(/[*?\s]+/g,' ').replace(new RegExp(quoteClass,'g'),'\\$&');
  }

  function makePhrases(name,incompleteStart,incompleteEnd) {

    var result = {};

    if (incompleteStart && incompleteEnd) {
      // if name contains delimiters
      if (delimRegex.exec(name)) {
        // for qlleft-truncation remove last (incomplete) word
        var left = name.replace(nonDelimEndRegex,"");
        if (left) {
          if (left.replace(delimRegex,"").length===0) {
            left = "";
          } else if (!delimRegex.exec(left[left.length-1])) {
            left = left + " ";
          }
          result.left = truncation_phrase(left);
        }
        // for qlright-truncation remove first (incomplete) word
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
        // no delimiters, one word truncated left and right.
        result.middle = middle_phrase(name);
      }

    } else if (incompleteStart && !incompleteEnd) {
      result.left = truncation_phrase(name);
    } else if (!incompleteStart && incompleteEnd) {
      result.right = truncation_phrase(name);
    } else /*if (!incompleteStart && !incompleteEnd)*/ {
      // remove delimiters twice.
      // if result still contains delimiters, name contains multiple words.
      // otherwise if result is not empty, the name is one complete word.
      // otherwise the name is empty or contains delimiters only.
      var word = name.replace(delimRegex,"").replace(delimRegex,"");
      if (delimRegex.exec(word)) {
        // multiple words
        result.right = result.left = truncation_phrase(name);
      } else {
        // one complete word or empty string or delimiters only.
        // if returned string would contain white spaces only, deliver empty string.
        result.words = word_phrase(name).replace(/^\s+$/,"");
      }
    }

    return result;
  }

  var SearchUtil = {

    /**
     * build LQL phrases from a given string for a "contains" search.
     *
     * There is special semantic for "<" as it is a word break AND part of the word right to it.
     * There is special semantic for "_" as it is a word break AND adjacent words are treated as one only.
     * Also some words (for example "not") in a truncation operator cause syntax error even when
     * quoted: to workaround that, we keep the delimiters in the phrase.
     *
     * Thus, for a "contains" search, we have to take care for that when splitting the string and
     * escape and substitute LQL special characters in returned string.
     *
     * @param {*} name
     * @returns the phrases for matching or left and right truncation.
     * Note: only returns the phrases not the complete condition.
     */
     makePhrasesForContainsSearch: function(name) {

      var incompleteStart = incompleteStartRegex.exec(name||"");
      var incompleteEnd = incompleteEndRegex.exec(name||"");

      return makePhrases(name, incompleteStart, incompleteEnd);
    },

    /**
     * build LQL phrases from a given string for a "startsWith" search.
     *
     * There is special semantic for "<" as it is a word break AND part of the word right to it.
     * There is special semantic for "_" as it is a word break AND adjacent words are treated as one only.
     * Also some words (for example "not") in a truncation operator cause syntax error even when
     * quoted: to workaround that, we keep the delimiters in the phrase.
     *
     * Thus, for a "startsWith" search, we can simply use the string as phrase,
     * we just have to escape and substitute a few special characters.
     *
     * @param {*} name
     * @returns the phrases needed for a LQL query.
     * Note: only returns the phrases, not the complete condition.
     */
    makePhrasesForStartsWithSearch: function(name) {

      var incompleteStart = incompleteStartRegex.exec(name||"");
      var incompleteEnd = incompleteEndRegex.exec(name||"");

      // as name has always to be interpreted as start of the word,
      // we extend it here with space on the left side, if needed,
      // so we can use the same code as for the contains search.
      name = incompleteStart ? " "+name : name;

      return makePhrases(name, false, incompleteEnd);
    },


    /**
     * build a LQL query for given phrases.
     *
     * middle:
     * [QLREGION "OTName" ] *middle*
     *
     * words:
     * [QLREGION "OTName" ] "words"
     *
     * left:
     * [QLREGION "OTName" ] QLLEFT-TRUNCATION "left"
     *
     * right:
     * [QLREGION "OTName" ] QLRIGHT-TRUNCATION "right"
     *
     * @param {*} phrases an object containing the phrases for matching, words or left and right truncation
     * @returns the LQL query string.
     */
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