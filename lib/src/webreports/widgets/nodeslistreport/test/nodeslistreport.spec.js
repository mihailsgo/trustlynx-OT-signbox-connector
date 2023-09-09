/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['csui/lib/underscore',
    'csui/lib/jquery',
    'csui/lib/backbone',
    'csui/lib/marionette',
    'webreports/widgets/nodeslistreport/nodeslistreport.view',
    'csui/utils/contexts/page/page.context',
    './nodeslistreport.mock.data'
], function (_, $, Backbone, Marrionette, NodesListReportView,
    PageContext,
    mock) {
    describe('NodesListReportView Unit Tests', function () {


        var context = new PageContext({
            factories: {
                connector: {
                    connection: {
                        url: '//server/cgi/cs.exe/api/v1',
                        supportPath: '/support',
                        session: {
                            ticket: 'dummy'
                        }
                    }
                }
            }
        });

        mock.enable();

        describe('nodesList Widget', function () {
            var nodesListView,
                nodesListRegion;

            beforeAll(function (done) {
                nodesListView = new NodesListReportView({
                    context: context,
                    data: {
                        id: 80121,
                        title: 'Most Commonly Accessed Locations',
                        titleBarIcon: 'title-assignments',
                        searchPlaceholder: 'Search Common Locations'
                    }
                });
                var $body = $('body'),
                    $container = $body.append('<div class="binf-container-fluid grid-rows"></div>');

                $body.addClass('binf-widgets');
                $container.append('<div class="binf-row"><div class="binf-col-sm-5 binf-col-md-4 binf-col-lg-3" id="nodesList"></div></div>');
                nodesListRegion = new Marrionette.Region({
                    el: '#nodesList'
                });

                nodesListRegion.show(nodesListView);
                context.fetch().always(function () {
                    _.delay(done, 500);
                });
            });

            describe('widget can be constructed', function () {
                it('view can be instantiated', function () {
                    expect(nodesListView).toBeDefined;
                    expect(nodesListView instanceof NodesListReportView).toBeTruthy;
                });
            });

            describe('nodesList Header tests', function () {
                it('header contains expected elements', function () {
                    var header = document.querySelector('.cs-tile.webreports-nodeslistreport .tile-header'),
                        controls = document.querySelector('.cs-tile.webreports-nodeslistreport .tile-header > .tile-controls'),
                        icon = document.querySelector('.cs-tile.webreports-nodeslistreport .tile-header > .tile-type-icon'),
                        title = document.querySelector('.cs-tile.webreports-nodeslistreport .tile-header > .tile-title');

                    expect(header).toBeTruthy;
                    expect(header.children).toContain(controls);
                    expect(header.children).toContain(icon);
                    expect(header.children).toContain(title);
                    expect(title.innerText).toMatch(nodesListView.options.data.title);
                });
                
                it('search box UI element works as expected', function () {
                    var searchButton = document.querySelector('.cs-tile.webreports-nodeslistreport .tile-header > .tile-controls .tile-icons > .cs-search-button'),
                        searchBox = document.querySelector('.cs-tile.webreports-nodeslistreport .tile-header > .tile-controls > .search-box > .search'),
                        searchClose = document.querySelector('.close-search-button'),
                        searchClearer = document.querySelector('.search-box > .formfield_clear'),
                        controls = document.querySelector('.cs-tile.webreports-nodeslistreport .tile-header > .tile-controls');
                    expect(getComputedStyle(searchClearer).display).toEqual('none');
                    searchButton.click(function () {
                        setTimeout(function () {
                            expect(searchClose.parentElement).toEqual(controls);
                            expect(getComputedStyle(document.querySelector('.icon-search-placeholder')).display).toEqual('block');
                            expect(controls.classList).toMatch('search-enabled');
                            searchBox.value = "test";
                            expect(getComputedStyle(searchClearer).display).toEqual('block');
                            searchClose.click(function () {
                                expect(controls.classList).not.toMatch('search-enabled');
                                expect(getComputedStyle(document.querySelector('.icon-search-placeholder')).display).toEqual('none');
                            });
                        }, 100);
                    });
                });
            });
        });
    });
});