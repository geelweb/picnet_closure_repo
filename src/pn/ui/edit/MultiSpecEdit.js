﻿;
goog.provide('pn.ui.edit.MultiSpecEdit');

goog.require('goog.dom');
goog.require('goog.events.Event');
goog.require('goog.events.EventHandler');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.TabBar');
goog.require('pn.dom');
goog.require('pn.object');
goog.require('pn.ui.IDirtyAware');
goog.require('pn.ui.edit.Command');
goog.require('pn.ui.edit.CommandsComponent');
goog.require('pn.ui.edit.Config');
goog.require('pn.ui.edit.Edit');
goog.require('pn.ui.edit.FieldSpec');
goog.require('pn.ui.edit.ReadOnlyFields');
goog.require('pn.ui.grid.ColumnSpec');
goog.require('pn.ui.grid.Config');
goog.require('pn.ui.grid.Grid');
goog.require('pn.ui.grid.Grid.EventType');



/**
 * @constructor
 * @extends {pn.ui.edit.CommandsComponent}
 * @implements {pn.ui.IDirtyAware}
 *
 * @param {!Object} entity The entity to edit, null for new entity.
 * @param {!Object.<Array>} cache The entities cache to use for
 *    related entities.
 * @param {!Object.<!pn.ui.UiSpec>} specs The edit specifications.
 * @param {string} mainSpecId The main specs id.  This is the specs that
 *    defines things like commands for the entire UI, etc.
 */
pn.ui.edit.MultiSpecEdit = function(entity, cache, specs, mainSpecId) {
  goog.asserts.assert(cache);
  goog.asserts.assert(entity);
  goog.asserts.assert(specs);
  goog.asserts.assert(mainSpecId);

  pn.ui.edit.CommandsComponent.call(this, specs[mainSpecId], entity, cache);

  /**
   * @protected
   * @type {!Object.<!pn.ui.UiSpec>}
   */
  this.specs = specs;

  /**
   * @protected
   * @type {!Array.<!pn.ui.edit.CommandsComponent>}
   */
  this.edits = [];

  /**
   * @private
   * @type {!Array.<pn.ui.edit.Interceptor>}
   */
  this.interceptors_ = [];
};
goog.inherits(pn.ui.edit.MultiSpecEdit, pn.ui.edit.CommandsComponent);


/**
 * @protected
 * @param {!Element} parent The parent DOM container to add the edit control to.
 * @param {string} specid The edit specification id for the control to
 *    render.
 */
pn.ui.edit.MultiSpecEdit.prototype.decorateEdit = function(parent, specid) {
  var ui = new pn.ui.edit.Edit(this.specs[specid], this.entity, this.cache);
  ui.fireInterceptorEvents = false;
  this.edits.push(ui);
  ui.decorate(parent);
};


/** @inheritDoc */
pn.ui.edit.MultiSpecEdit.prototype.isValidForm = function() {
  var errors = this.getFormErrors();
  if (errors.length) {
    pn.app.ctx.pub(pn.app.AppEvents.ENTITY_VALIDATION_ERROR, errors);
  }
  return !errors.length;
};


/** @inheritDoc */
pn.ui.edit.MultiSpecEdit.prototype.updateRequiredClasses = function() {
  goog.array.forEach(this.edits, function(c) { c.updateRequiredClasses(); });
};


/** @inheritDoc */
pn.ui.edit.MultiSpecEdit.prototype.getFormErrors = function() {
  var errors = [];
  goog.array.forEach(this.edits, function(edit) {
    if (edit.getFormErrors) {
      errors = goog.array.concat(errors, edit.getFormErrors());
    }
  });
  goog.array.forEach(this.interceptors_, function(icptr) {
    var customErrors = icptr.getCustomValidationErrors();
    errors = goog.array.concat(errors, customErrors);
  }, this);
  return errors;
};


/** @inheritDoc */
pn.ui.edit.MultiSpecEdit.prototype.getCurrentFormData = function() {
  var current = {};
  goog.object.extend(current, this.entity);
  goog.array.forEach(this.edits, function(edit) {
    if (edit.getFormData) { goog.object.extend(current, edit.getFormData()); }
  }, this);
  return current;
};


/** @inheritDoc */
pn.ui.edit.MultiSpecEdit.prototype.isDirty = function() {
  return goog.array.findIndex(this.edits, function(edit) {
    return edit.isDirty && edit.isDirty();
  }) >= 0;
};


/** @inheritDoc */
pn.ui.edit.MultiSpecEdit.prototype.resetDirty = function() {
  goog.array.forEach(this.edits, function(edit) {
    if (edit.resetDirty) edit.resetDirty();
  });
};


/** @inheritDoc */
pn.ui.edit.MultiSpecEdit.prototype.createDom = function() {
  this.decorateInternal(this.dom_.createElement('div'));
};


/** @inheritDoc */
pn.ui.edit.MultiSpecEdit.prototype.enterDocument = function() {
  pn.ui.edit.MultiSpecEdit.superClass_.enterDocument.call(this);

  var controls = {};
  var commands = this.getCommandButtons();

  goog.array.forEach(this.edits, function(ed) {
    if (ed.getFields) {
      goog.array.forEach(ed.getFields(), function(fctx) {
        if (fctx.id in controls) return;
        controls[fctx.id] = [ed.getControl(), ed.getParentControl()];
      });
    }
    if (ed.getCommandButtons) {
      pn.object.uniqueExtend(commands, ed.getCommandButtons());
    }
  }, this);

  goog.object.forEach(this.edits, function(edit) {
    this.interceptors_.push(new edit.cfg.interceptor(
        this, this.entity, this.cache, controls, commands));
  }, this);
};


/** @inheritDoc */
pn.ui.edit.MultiSpecEdit.prototype.disposeInternal = function() {
  pn.ui.edit.MultiSpecEdit.superClass_.disposeInternal.call(this);

  goog.array.forEach(this.edits, goog.dispose);
  goog.object.forEach(this.specs, goog.dispose);
  goog.object.forEach(this.interceptors_, goog.dispose);

  delete this.specs;
  delete this.entity;
  delete this.edits;
};
