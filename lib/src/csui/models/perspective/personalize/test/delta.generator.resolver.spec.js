/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(["csui/lib/jquery", "csui/lib/underscore",
  'json!./personalize.data.json',
  'json!./perspective.data.json',
  'json!./delta.data.json',
  'csui/models/perspective/personalize/delta.generator',
  'csui/models/perspective/personalize/delta.resolver'
], function ($, _, PersonalizationJson, PerspectiveJson, DeltaJson, DeltaGenerator, DeltaResolver) {
  'use strict';

  describe("Personalize Merging", function () {
    it("Verify delta generation from personalization", function () {
      var generator = new DeltaGenerator(
          {perspective: PerspectiveJson, personalization: PersonalizationJson});
      var delta = generator.getDelta();
      expect(_.isEqual(delta, DeltaJson)).toBe(true);
    });

    it("Verify personalization JSON generation from delta", function () {
      var resolver        = new DeltaResolver({perspective: PerspectiveJson, delta: DeltaJson}),
          personalization = resolver.getPersonalization();
      expect(_.isEqual(personalization,
          _.extend({personalizations: DeltaJson}, PersonalizationJson))).toBe(true);
    });
  });
});