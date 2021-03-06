
goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('pn');

goog.provide('pn.dom');


/**
 * Finds an element with the given id.  If that element does not exist an
 *    error is thrown.
 *
 * @param {string} id The element ID.
 * @return {!Element} the element with the specified ID.
 */
pn.dom.get = function(id) {
  pn.assStr(id);

  var e = goog.dom.getElement(id);
  if (!e) throw new Error('Could not find the DOM element with ID: ' + id);
  return /** @type {!Element} */ (e);
};


/**
 * Finds an element with the given class name.  If that element does not exist
 *    an error is thrown.
 *
 * @param {string} className The element class.
 * @param {Element=} opt_el The optional parent element to search.
 * @return {!Element} the element with the specified class.
 */
pn.dom.byClass = function(className, opt_el) {
  pn.assStr(className);
  pn.ass(!opt_el || opt_el instanceof HTMLElement);

  var e = goog.dom.getElementByClass(className, opt_el);
  if (!e) {
    throw new Error('Could not find the DOM element with class: ' + className);
  }
  return /** @type {!Element} */ (e);
};


/**
 * Gets the computed pixel width from the element or its ancestors.
 *
 * @param {!Element} e The element whose pixel width we want.
 * @return {number} The width in pixels.
 */
pn.dom.getComputedPixelWidth = function(e) {
  pn.ass(e);
  var w = goog.style.getComputedStyle(e, 'width');
  while (w.indexOf('px') < 0) {
    e = /** @type {!Element} */ (e.parentNode);
    w = goog.style.getComputedStyle(e, 'width');
  }
  return parseInt(w, 10);
};


/**
 * Adds the speicified html string to the DOM element (parent).
 *
 * @param {Element} parent The parent to add the given html into.
 * @param {string} html The html string to add to the speicified parent.
 * @return {!Element} The created node from the specified HTML.
 */
pn.dom.addHtml = function(parent, html) {
  pn.ass(parent);
  pn.assStr(html);

  var el = pn.dom.htmlToEl(html);
  goog.dom.appendChild(parent, el);
  return /** @type {!Element} */ (el);
};


/**
 * @param {string} html The html to convert to an element.
 * @return {!Element} The generated document fragment element.
 */
pn.dom.htmlToEl = function(html) {
  pn.assStr(html);

  return /** @type {!Element} */ (goog.dom.htmlToDocumentFragment(html));
};
