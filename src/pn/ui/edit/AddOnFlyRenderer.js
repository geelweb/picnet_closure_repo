﻿;
goog.provide('pn.ui.edit.AddOnFlyRenderer');

goog.require('pn.ui.edit.AddOnFlyDialog');
goog.require('pn.ui.edit.AddOnFlyDialog.EventType');
goog.require('pn.ui.edit.ComplexRenderer');



/**
 * @constructor
 * @extends {pn.ui.edit.ComplexRenderer}
 * @param {!pn.ui.edit.FieldCtx} fctx The field context object.
 * @param {!Object} entity The entity being edited.
 * @param {string} specId The ID of the specs to display in this add on the
 *    fly control.
 * @param {boolean} showAof Wether to allow the current user to add on the fly.
 *    This functionality is sometimes only reserved for administrators so this
 *    should represent this.
 */
pn.ui.edit.AddOnFlyRenderer = function(fctx, entity, specId, showAof) {
  goog.asserts.assert(specId);

  pn.ui.edit.ComplexRenderer.call(this, fctx, entity);

  /**
   * @private
   * @type {string}
   */
  this.specId_ = specId;

  /**
   * @private
   * @type {boolean}
   */
  this.showAof_ = showAof;

  /**
   * @private
   * @type {pn.ui.UiSpec}
   */
  this.spec_ = pn.app.ctx.specs.get(this.specId_);
  this.registerDisposable(this.spec_);

  /**
   * @private
   * @type {pn.ui.edit.AddOnFlyDialog}
   */
  this.dialog_ = null;

  /**
   * @private
   * @type {!Element}
   */
  this.add_ = goog.dom.createDom('a', 'add-on-fly-add-button', 'Add');

  /**
   * @private
   * @type {!Element}
   */
  this.select_ = goog.dom.createDom('select', 'add-on-fly-select');
};
goog.inherits(pn.ui.edit.AddOnFlyRenderer, pn.ui.edit.ComplexRenderer);


/** @override */
pn.ui.edit.AddOnFlyRenderer.prototype.getValue = function() {
  return parseInt(this.select_.value, 10);
};


/** @override */
pn.ui.edit.AddOnFlyRenderer.prototype.decorateInternal = function(element) {
  goog.asserts.assert(element);
  this.setElementInternal(element);

  var dom = goog.dom.createDom('div', 'add-on-fly',
      this.select_,
      this.showAof_ ? this.add_ : undefined);

  goog.dom.appendChild(element, dom);
};


/** @override */
pn.ui.edit.AddOnFlyRenderer.prototype.enterDocument = function() {
  pn.ui.edit.AddOnFlyRenderer.superClass_.enterDocument.call(this);

  var click = goog.events.EventType.CLICK;
  this.getHandler().listen(this.add_, click, this.addOnFly_);

  this.refreshList_(
      /** @type {number} */ (this.fctx.getEntityValue(this.entity)));
};


/** @private */
pn.ui.edit.AddOnFlyRenderer.prototype.addOnFly_ = function() {
  this.dialog_ = new pn.ui.edit.AddOnFlyDialog(this.spec_.id, this.fctx.cache);

  var eventType = pn.ui.edit.AddOnFlyDialog.EventType.AOF_ADDED;
  this.getHandler().listenOnce(this.dialog_, eventType, this.aofAdded_);
  this.dialog_.show();
};


/**
 * @private
 * @param {goog.events.Event} e The AOF_ADDED event.
 */
pn.ui.edit.AddOnFlyRenderer.prototype.aofAdded_ = function(e) {
  goog.dispose(this.dialog_);
  this.dialog_ = null;

  this.refreshList_(e.entityId);
};


/**
 * @private
 * @param {number} selectedId The ID of the entity to select.
 */
pn.ui.edit.AddOnFlyRenderer.prototype.refreshList_ = function(selectedId) {
  var list = this.fctx.cache[this.spec_.type];
  pn.app.ctx.schema.orderEntities(this.spec_.type, list);

  goog.dom.removeChildren(this.select_);
  goog.dom.appendChild(this.select_, goog.dom.createDom('option', {
    'value': '0',
    'text': 'Select ' + this.spec_.name + '...'
  }));
  goog.array.forEach(list, function(e) {
    goog.dom.appendChild(this.select_, goog.dom.createDom('option', {
      'value': e['ID'],
      'text': e[this.spec_.type + 'Name'],
      'selected': e['ID'] === selectedId
    }));
  }, this);
};