﻿;
goog.provide('pn.ui.grid.Config');

goog.require('pn.ui.UiSpec');
goog.require('pn.ui.grid.ColumnCtx');
goog.require('pn.ui.grid.Interceptor');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {!Array.<pn.ui.grid.ColumnCtx>} cCtxs The specification of all the
 *    columns to display in this grid.
 * @param {!Array.<pn.ui.grid.cmd.Command>} commands All the commands
 *    supported by this grid.
 * @param {function(new:pn.ui.grid.Interceptor, !pn.data.BaseDalCache)=}
 *    opt_interceptor An optional interceptor ctor to use to modify the
 *    internal workings of the grid.
 */
pn.ui.grid.Config = function(cCtxs, commands, opt_interceptor) {
  pn.ass(cCtxs.length > 0);
  pn.ass(commands);

  goog.Disposable.call(this);

  /** @type {!Array.<pn.ui.grid.ColumnCtx>} */
  this.cCtxs = cCtxs;

  /** @type {!Array.<pn.ui.grid.cmd.Command>} */
  this.commands = commands;

  /** @type {boolean} */
  this.readonly = false;

  /** @type {boolean} */
  this.allowEdit = true;

  /** @type {boolean} */
  this.enableQuickFilters = true;

  /** @type {string} */
  this.defaultSortColumn = '';

  /** @type {boolean} */
  this.defaultSortAscending = true;

  /** @type {boolean} */
  this.persistFilters = true;

  /**
   * @type {null|
   *    function(new:pn.ui.grid.Interceptor, !pn.data.BaseDalCache)}
   */
  this.interceptor = opt_interceptor || null;

  /**
   * The Grid control will use pn.app.ctx.pub to publish events if this is true.
   *    Otherwise traditional goog.events.Event will be used.
   * @type {boolean}
   */
  this.publishEventBusEvents = true;

  //////////////////////////////////////////////////////////////////////////////
  // Slick Grid Properties
  //////////////////////////////////////////////////////////////////////////////

  /** @type {boolean} */
  this.enableColumnReorder = false;

  /** @type {boolean} */
  this.forceFitColumns = true;

  /** @type {boolean} */
  this.multiSelect = false;

  /** @type {boolean} */
  this.editable = true;

  /** @type {boolean} */
  this.syncColumnCellResize = true;

  this.init_();
};
goog.inherits(pn.ui.grid.Config, goog.Disposable);


/** @private */
pn.ui.grid.Config.prototype.init_ = function() {
  var hasOrder = !this.readonly && this.cCtxs.pnfindIndex(function(cctx) {
    return cctx.spec instanceof pn.ui.grid.OrderingColumnSpec; }) >= 0;

  if (hasOrder) {
    this.cCtxs.pnforEach(function(cctx) { cctx.spec.sortable = false; });
  }
};


/**
 * @return {pn.ui.grid.Config} A SlickGrid compative object even when
 *    in COMPILE mode.
 */
pn.ui.grid.Config.prototype.toSlick = function() {
  // Need to copy twice as we need this to also work in compiled mode.
  var cfg = /** @type {pn.ui.grid.Config} */ ({
    'enableColumnReorder': this.enableColumnReorder,
    'forceFitColumns': this.forceFitColumns,
    'multiSelect': this.multiSelect,
    'editable': this.editable,
    'showHeaderRow': this.enableQuickFilters,
    'syncColumnCellResize': this.syncColumnCellResize
  });
  cfg.enableColumnReorder = this.enableColumnReorder;
  cfg.forceFitColumns = this.forceFitColumns;
  cfg.multiSelect = this.multiSelect;
  cfg.editable = this.editable;
  cfg.showHeaderRow = this.enableQuickFilters;
  cfg.syncColumnCellResize = this.syncColumnCellResize;
  return cfg;
};


/** @override */
pn.ui.grid.Config.prototype.disposeInternal = function() {
  pn.ui.grid.Config.superClass_.disposeInternal.call(this);

  this.commands.pnforEach(goog.dispose);

  delete this.commands;
};
