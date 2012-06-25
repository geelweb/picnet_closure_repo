﻿;
goog.provide('pn.ui.FieldCtx');

goog.require('goog.date.Date');
goog.require('pn.ui.BaseFieldSpec');
goog.require('pn.ui.edit.EditUtils');
goog.require('pn.ui.edit.FieldRenderers');
goog.require('pn.ui.grid.ColumnRenderers');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {!pn.ui.BaseFieldSpec} spec The field specifications.
 * @param {!Object.<!Array.<!Object>>} cache The current cache.
 */
pn.ui.FieldCtx = function(spec, cache) {
  goog.asserts.assert(spec);
  goog.asserts.assert(cache);

  goog.Disposable.call(this);

  /**
   * @private
   * @type {goog.debug.Logger}
   */
  this.log_ = pn.log.getLogger('pn.ui.FieldCtx');

  /** @type {!pn.ui.BaseFieldSpec} */
  this.spec = spec;

  /** @type {!Object.<!Array.<!Object>>} */
  this.cache = cache;

  /** @type {!string} */
  this.id = spec.id;

  /** @type {!pn.ui.UiSpec} */
  this.entitySpec = spec.entitySpec;

  /** @type {pn.app.schema.FieldSchema} */
  this.schema = pn.app.ctx.schema.getFieldSchema(spec);
};
goog.inherits(pn.ui.FieldCtx, goog.Disposable);


/**
 * @param {!Object} entity Then entity is required to check wether this is a
 *    new entity or existing one as some fields are only editable if or if not
 *    a new entity.
 * @return {boolean} Wether this field is editable.
 */
pn.ui.FieldCtx.prototype.isEditable = function(entity) {
  goog.asserts.assert(entity);

  return !this.spec.readonly && !this.spec.tableType &&
      (this.spec.showOnAdd || !pn.data.EntityUtils.isNew(entity));
};


/** @return {boolean} Wether this field is required. */
pn.ui.FieldCtx.prototype.isRequired = function() {
  if (this.spec.readonly) return false;
  return (this.spec.validator && this.spec.validator.required) ||
      (this.schema != null && !this.schema.allowNull);
};


/**
 * @param {!(Element|goog.ui.Component)} component The compoenent that this
 *    field is rendererd on.
 * @param {Object=} opt_target The optional 'entity' target to inject values
 *    into if required.
 * @return {*} The current control value of this field.
 */
pn.ui.FieldCtx.prototype.getControlValue = function(component, opt_target) {
  return pn.ui.edit.FieldBuilder.getFieldValue(component, opt_target);
};


/**
 * @param {!(Element|goog.ui.Component)} control The control that this
 *    field is rendererd on.
 * @return {boolean} visible Wether the specified field element is currently
 *    visible.
 */
pn.ui.FieldCtx.prototype.isShown = function(control) {
  return pn.ui.edit.EditUtils.isShown(control, this.id);
};


/**
 * @protected
 * @param {!(Element|goog.ui.Component)} control The control that this
 *    field is rendererd on.
 * @param {boolean} visible Wether to show or hide the element.
 */
pn.ui.FieldCtx.prototype.showElement = function(control, visible) {
  pn.ui.edit.EditUtils.showElement(control, this.id, visible);
};


/**
 * @param {Object} entity The entity's whose value we need.
 * @return {*} The value of  this field.
 */
pn.ui.FieldCtx.prototype.getEntityValue = function(entity) {
  goog.asserts.assert(entity);

  var prop = this.spec.dataProperty;
  var v = entity[prop];
  if (goog.isDef(v)) return v;

  if (pn.data.EntityUtils.isNew(entity)) {
    if (goog.isDefAndNotNull(this.spec.defaultValue)) {
      return this.getDefaultFieldValue_();
    }
    return v;
  }

  if (goog.string.endsWith(prop, 'Entities') && goog.isArray(v)) {
    // Controls always return sorted IDs so here we ensure we never throw a
    // dirty error if for somereason the original value is not sorted.
    v.sort();
  }
  return v;
};


/**
 * @param {!Object} entity The entity's whose display value we need.
 * @return {*} The display value of this field.
 */
pn.ui.FieldCtx.prototype.getDisplayValue = function(entity) {
  return pn.data.EntityUtils.getEntityDisplayValue(
      this.cache,
      this.spec.displayPath,
      entity,
      this.spec.tableParentField);
};


/**
 * @param {!Object} entity The entity being shown.
 * @return {*} The compareable value of this column, suitable for sorting, etc.
 */
pn.ui.FieldCtx.prototype.getCompareableValue = function(entity) {
  goog.asserts.assert(entity);
  goog.asserts.assert(this.spec instanceof pn.ui.grid.ColumnSpec);

  if (this.spec.sortValueRenderer) {
    return this.spec.sortValueRenderer(this, entity);
  }

  var renderer = this.getColumnRenderer();
  var useRealValue =
      !renderer ||
      renderer === pn.ui.grid.ColumnRenderers.dateRenderer ||
      renderer === pn.ui.grid.ColumnRenderers.dateTimeRenderer ||
      renderer === pn.ui.grid.ColumnRenderers.centsRenderer;
  return useRealValue ? this.getEntityValue(entity) : renderer(this, entity);
};


/**
 * @param {!Object} entity The entity being checked for dirty.
 * @param {!(Element|goog.ui.Component)} control The control for this field.
 * @return {boolean} Wether this field is currently dirty (i.e. The control is
 *    different than the entity value).
 */
pn.ui.FieldCtx.prototype.isDirty = function(entity, control) {
  var orig = this.getEntityValue(entity);
  var curr = this.getControlValue(control);

  // Handle tricky falsies
  var isFalseEquivalent = function(val) {
    return !val || val === '0' || val === 'false' || val === '{}';
  };
  if (isFalseEquivalent(curr) && isFalseEquivalent(orig)) { return false; }

  // goog.string.canonicalizeNewlines required for IE7 which handles
  // newlines differently adding a keycode 13,10 rather than just 10
  curr = curr ? goog.string.canonicalizeNewlines(curr.toString()) : '';
  orig = orig ? goog.string.canonicalizeNewlines(orig.toString()) : '';

  if (curr !== orig) {
    this.log_.info('Dirty ' + this.id + ' 1[' + orig + '] 2[' + curr + ']');
  }
  return curr !== orig;
};


/**
 * @param {!(Element|goog.ui.Component)} control The control for this field.
 * @return {!Array.<string>} An error list of all validation errors (empty if
 *    no errors found).
 */
pn.ui.FieldCtx.prototype.validate = function(control) {
  var errs = pn.ui.edit.FieldValidator.validateFieldValue(this, control);
  if (errs.length) {
    var val = this.getControlValue(control);
    this.log_.info('Field: ' + this.id + ' val: ' + val + ' error: ' + errs);
  }
  return errs;
};


/**
 * @return {(pn.ui.grid.ColumnSpec.Renderer|null)} The specified
 *    column renderer or an implied renderer from the given column schema type.
 */
pn.ui.FieldCtx.prototype.getColumnRenderer = function() {
  goog.asserts.assert(this.spec instanceof pn.ui.grid.ColumnSpec);

  if (goog.isDef(this.spec.renderer)) return this.spec.renderer;
  if (!this.schema) return null;
  return pn.app.ctx.cfg.defaultColumnRenderers[this.schema.type] ||
      (pn.data.EntityUtils.isParentProperty(this.spec.dataProperty) ?
          pn.ui.grid.ColumnRenderers.parentColumnRenderer : null);
};


/**
 * @return {?pn.ui.edit.FieldSpec.Renderer} The specified field renderer or
 *    an implied renderer from the given column schema type.
 */
pn.ui.FieldCtx.prototype.getFieldRenderer = function() {
  goog.asserts.assert(this.spec instanceof pn.ui.edit.FieldSpec);
  if (this.spec.renderer) return this.spec.renderer;
  if (!this.schema) return null;

  if (this.spec.readonly) {
    return pn.app.ctx.cfg.defaultReadOnlyFieldRenderers[this.schema.type] ||
        pn.ui.edit.ReadOnlyFields.textField;
  } else {
    var schemaType = this.schema.type;
    if (schemaType === 'String' &&
        this.schema.length >
            pn.app.ctx.cfg.defaultFieldRenderers.textAreaLengthThreshold) {
      schemaType = 'LongString';
    }
    return pn.app.ctx.cfg.defaultFieldRenderers[schemaType] || null;
  }
};


/**
 * @private
 * @return {*} The default value of  this field.
 */
pn.ui.FieldCtx.prototype.getDefaultFieldValue_ = function() {
  goog.asserts.assert(goog.isDefAndNotNull(this.spec.defaultValue));
  var val = this.spec.defaultValue;
  if (pn.data.EntityUtils.isParentProperty(this.spec.dataProperty)) {
    var type = pn.data.EntityUtils.getTypeProperty(this.spec.dataProperty);
    var list = this.cache[type];
    val = goog.array.find(list, function(e) {
      return e[type + 'Name'] === this.spec.defaultValue;
    }, this)['ID'];
  }
  return val;
};


/** @inheritDoc */
pn.ui.FieldCtx.prototype.disposeInternal = function() {
  pn.ui.FieldCtx.superClass_.disposeInternal.call(this);

  goog.dispose(this.log_);
  goog.dispose(this.spec);

  delete this.log_;
  delete this.spec;
  delete this.cache;
  delete this.entitySpec;
  delete this.schema;
};
