/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['nuc/utils/connector', 'nuc/models/members'
], function (Connector, MembersCollection) {

  describe("Member Collection", function () {

    beforeAll(function () {
      this.connector = new Connector({
        connection: {
          url: '//server/otcs/cs/api/v1',
          supportPath: '/support',
          session: {
            ticket: 'dummy'
          }
        }
      });
    });

    it('Pass all the options through MembersCollection', function () {
        var members = new MembersCollection(undefined, {
            connector: this.connector,
            memberFilter: { type: [0, 1] },
            expandFields: ['group_id', 'leader_id'],
            limit: 10,
            orderBy: 'asc_name',
            query: 'a'
        });
        var url = members.url();
        expect(url.indexOf("limit")).toBeGreaterThan(0);
        expect(url.indexOf("sort")).toBeGreaterThan(0);
        expect(url.indexOf("query")).toBeGreaterThan(0);
        expect(url.indexOf("where_type")).toBeGreaterThan(0);
        expect(url.indexOf("expand")).toBeGreaterThan(0);
    });

    it('Exclude expand fields in options', function () {
        var members = new MembersCollection(undefined, {
            connector: this.connector,
            limit: 10,
            orderBy: 'asc_name',
            query: 'a'
        });
        var url = members.url();
        expect(url.indexOf("limit")).toBeGreaterThan(0);
        expect(url.indexOf("sort")).toBeGreaterThan(0);
        expect(url.indexOf("query")).toBeGreaterThan(0);
        expect(url.indexOf("where_type")).toBeGreaterThan(0);
        expect(url.indexOf("expand")).toBeLessThan(0);
    });
  });
});
