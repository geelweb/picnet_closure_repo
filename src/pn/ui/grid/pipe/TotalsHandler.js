﻿;
goog.provide('pn.ui.grid.pipe.TotalsHandler');

goog.require('goog.events.EventHandler');
goog.require('pn.ui.grid.pipe.GridHandler');



/**
 * @constructor
 * @extends {pn.ui.grid.pipe.GridHandler}
 * @param {Slick.Grid} slick The reference to the slick grid being shown.
 * @param {pn.ui.grid.DataView} view The data view being shown.
 * @param {pn.ui.grid.Config} cfg The grid configuration being used.
 * @param {!Array.<!pn.ui.grid.ColumnCtx>} cctxs The column contexts being
 *    displayed.
 * @param {Element} parent The parent Grid element container.
 */
pn.ui.grid.pipe.TotalsHandler =
    function(slick, view, cfg, cctxs, parent) {
  goog.asserts.assert(parent);

  pn.ui.grid.pipe.GridHandler.call(this, slick, view, cfg);

  /**
   * @private
   * @type {goog.debug.Logger}
   */
  this.log_ = pn.log.getLogger('pn.ui.grid.pipe.TotalsHandler');

  /**
   * @private
   * @type {!Array.<!pn.ui.grid.ColumnCtx>}
   */
  this.cctxs_ = cctxs;

  /**
   * @private
   * @type {!Array.<!pn.ui.grid.ColumnCtx>}
   */
  this.totalColumns_ = goog.array.filter(this.cctxs_,
      function(cctx) { return !!cctx.spec.total; });

  /**
   * @private
   * @type {Element}
   */
  this.parent_ = parent;

  /**
   * @private
   * @type {Element}
   */
  this.totalsLegend_ = null;
};
goog.inherits(pn.ui.grid.pipe.TotalsHandler, pn.ui.grid.pipe.GridHandler);


/** @override */
pn.ui.grid.pipe.TotalsHandler.prototype.init = function() {
  if (!this.totalColumns_.length) { return; }
  this.totalsLegend_ = goog.dom.createDom('div', 'totals-legend');
  goog.dom.appendChild(this.parent_, this.totalsLegend_);
};


/** @override */
pn.ui.grid.pipe.TotalsHandler.prototype.onCustomEvent =
    function(eventType) {
  if (eventType === 'row-count-changed' || eventType === 'initialised') {
    this.updateTotals_();
  }
};


/** @private */
pn.ui.grid.pipe.TotalsHandler.prototype.updateTotals_ = function() {
  if (!this.totalColumns_.length) return;
  var items = this.view.getItems();
  var total = goog.array.reduce(items, function(acc, item) {
    goog.array.forEach(this.totalColumns_, function(cctx1) {
      if (acc[cctx1.id] === undefined) acc[cctx1.id] = 0;
      var itemVal = item[cctx1.id];
      if (itemVal) acc[cctx1.id] += itemVal;
    }, this);
    return acc;
  }, {}, this);
  var html = [];
  for (var field in total) {
    var cctx = goog.array.find(this.totalColumns_,
        function(cctx1) { return cctx1.id === field; });
    var val;
    var mockEntity = {};
    mockEntity[field] = total[field];
    var renderer = cctx.getColumnRenderer();
    if (renderer) { val = renderer(cctx, mockEntity); }
    else { val = parseInt(total[field], 10); }
    html.push('Total ' + cctx.spec.name + ': ' + val || '0');
  }
  this.totalsLegend_.innerHTML = '<ul><li>' +
      html.join('</li><li>') + '</li>';
};

