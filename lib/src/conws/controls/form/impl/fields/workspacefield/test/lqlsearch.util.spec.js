/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/jquery', 'csui/lib/underscore',
  'conws/utils/test/testutil', 'csui/utils/log',
  'conws/controls/form/impl/fields/workspacefield/lqlsearch.util'
], function ($, _,
  TestUtil, log,
  SearchUtil
) {

  function normalize(phrases) {

    var result = {};

    if (phrases.middle) {
      result.middle = phrases.middle;
    }
    if (phrases.words) {
      result.words = phrases.words;
    }
    if (phrases.left) {
      result.left = phrases.left;
    }
    if (phrases.right) {
      result.right = phrases.right;
    }

    return result;
  }

  var quoteChars = "\"“”'‘’´`";
  var quoteEscaped = "\\\"\\“\\”\\'\\‘\\’\\´\\`";
  var regexChars = ".*+?^${}()|[]\\";
  var regexEscaped = "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\";
  var regexInWords = ". + ^${}()|[]\\";
  var otherChars = "°!²§³%&/=@€~#><µ;,:-";
  var otherEscaped = otherChars; // other characters are not escaped

  var contains = [
    [ "oneword", { middle: "oneword" } ],
    [ " oneword", { right: " oneword" } ],
    [ "oneword ", { left: "oneword " } ],
    [ " oneword ", { words: " oneword " } ],
    [ "<oneword", { right: "<oneword" } ],
    [ "oneword<", { left: "oneword<" } ],
    [ "<oneword<", { right: "<oneword<" } ],
    [ "left middle right", { left: "left middle ", right: " middle right" } ],
    [ " left middle right", { right: " left middle right" } ],
    [ "left middle right ", { left: "left middle right " } ],
    [ " left middle right ", { left: " left middle right ", right: " left middle right " } ],
    [ "<left<middle<right", { right: "<left<middle<right" } ],
    [ "left<middle<right<", { left: "left<middle<right<", right: "<middle<right<" } ],
    [ "<left<middle<right<", { right: "<left<middle<right<" } ],
    [ "?left,middle.right*", { left: "\\?left,middle\\.right\\* ", right: "\\?left,middle\\.right\\* " } ],
    [ "*left;middle:right?", { left: "\\*left;middle:right\\?", right: "\\*left;middle:right\\?" } ],
    [ ",left?middle*right.", { left: ",left\\?middle\\*right\\.", right: ",left\\?middle\\*right\\." } ],
    [ ";left*middle?right:", { left: ";left\\*middle\\?right:", right: ";left\\*middle\\?right:" } ],
    [ "<quote"+quoteChars+"chars", { right: "<quote"+quoteEscaped+"chars" } ],
    [ "<regex"+regexChars+"chars", { right: "<regex"+regexEscaped+"chars" } ],
    [ "<delim"+otherChars+"chars", { right: "<delim"+otherEscaped+"chars" } ],
    [ quoteChars+"quotechars"+quoteChars, { words: quoteEscaped+"quotechars"+quoteEscaped } ],
    [ regexChars+"regexchars"+regexChars, { words: regexInWords+"regexchars"+regexInWords } ],
    [ otherChars+"otherchars"+otherChars, { words: otherEscaped+"otherchars"+otherEscaped } ],
    [ "", {} ]
  ];

  var startsWith = [
    [ "oneword", { right: " oneword" } ],
    [ " oneword", { right: " oneword" } ],
    [ "oneword ", { words: " oneword " } ],
    [ " oneword ", { words: " oneword " } ],
    [ "<oneword", { right: "<oneword" } ],
    [ "oneword<", { right: " oneword<" } ],
    [ "<oneword<", { right: "<oneword<" } ],
    [ "left middle right", { right: " left middle right" } ],
    [ " left middle right", { right: " left middle right" } ],
    [ "left middle right ", { left: " left middle right ", right: " left middle right " } ],
    [ " left middle right ", { left: " left middle right ", right: " left middle right " } ],
    [ "<left<middle<right", { right: "<left<middle<right" } ],
    [ "left<middle<right<", { right: " left<middle<right<" } ],
    [ "<left<middle<right<", { right: "<left<middle<right<" } ],
    [ "?left,middle.right*", { left: "\\?left,middle\\.right\\* ", right: "\\?left,middle\\.right\\* " } ],
    [ "*left;middle:right?", { left: "\\*left;middle:right\\?", right: "\\*left;middle:right\\?" } ],
    [ ",left?middle*right.", { left: ",left\\?middle\\*right\\.", right: ",left\\?middle\\*right\\." } ],
    [ ";left*middle?right:", { left: ";left\\*middle\\?right:", right: ";left\\*middle\\?right:" } ],
    [ "<quote"+quoteChars+"chars", { right: "<quote"+quoteEscaped+"chars" } ],
    [ "<regex"+regexChars+"chars", { right: "<regex"+regexEscaped+"chars" } ],
    [ "<delim"+otherChars+"chars", { right: "<delim"+otherEscaped+"chars" } ],
    [ quoteChars+"quotechars"+quoteChars, { words: quoteEscaped+"quotechars"+quoteEscaped } ],
    [ regexChars+"regexchars"+regexChars, { words: regexInWords+"regexchars"+regexInWords } ],
    [ otherChars+"otherchars"+otherChars, { words: otherEscaped+"otherchars"+otherEscaped } ],
    [ "", {} ]
  ];

  var result, expected;

  describe("LqlSearchUtilTest", function() {

    describe("testing phrases for contains search ("+contains.length+" tests)", function() {

      contains.forEach(function(args){
        it("test contains for: '"+args[0]+"'",function(){
          var result = normalize(SearchUtil.makePhrasesForContainsSearch(args[0]));
          var expected = args[1];
          expect(JSON.stringify(result)).toEqual(JSON.stringify(expected),"test contains phrase '"+args[0]+"'");
        });
      });
    });

    describe("testing phrases for startsWith search ("+startsWith.length+" tests)", function() {

      startsWith.forEach(function(args){
        it("test startsWith for: '"+args[0]+"'",function(){
          var result = normalize(SearchUtil.makePhrasesForStartsWithSearch(args[0]));
          var expected = args[1];
          expect(JSON.stringify(result)).toEqual(JSON.stringify(expected),"test startsWith phrase '"+args[0]+"'");
        });
      });
    });

  });

});
