/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
	'csui/controls/table/cells/cell.registry',
	'csui/controls/table/cells/parent/parent.view',
], function (cellViewRegistry, ParentCellView) {
	'use strict';
	var locationCellView = ParentCellView.extend({
		constructor: function locationCellView(options) {

			if (options.model.get('location_id') !== 0) {
				var locationPath = options.model.get('location_id_expand');
				options.model.set('parent_id_expand', locationPath, { silent: true });
			}
			locationCellView.__super__.constructor.apply(this, arguments);
		},

		onRender: function () {
			if (this.model.get('location_id') === 0) {
				this.parentIconView.remove();
			}
		}
	});

	cellViewRegistry.registerByColumnKey('location_name', locationCellView);

	return locationCellView;
});