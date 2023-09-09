/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/controls/node.state/impl/reservation/reservation.view',
  'csui/controls/node.state/impl/locked/locked.view'
], function (ReservationIconView, LockedIconView) {
  'use strict';

  return [
    {
      sequence: 50,
      iconView: ReservationIconView
    },
    {
      sequence: 60,
      iconView: LockedIconView
    }
  ];
});