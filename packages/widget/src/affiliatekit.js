/**
 * AffiliateKit — Embeddable Tracking Widget
 * Usage: <script src="ak.js" data-program="prog_xxx"></script>
 * < 3KB minified
 */

var COOKIE_NAME = 'ak_ref';
var COOKIE_DAYS = 30;

// ─── Cookie helpers ─────────────────────────────────────────────────────────

function setCookie(name, value, days) {
  var expires = '';
  if (days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + d.toUTCString();
  }
  document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
}

function getCookie(name) {
  var nameEQ = name + '=';
  var parts = document.cookie.split(';');
  for (var i = 0; i < parts.length; i++) {
    var c = parts[i];
    while (c.charAt(0) === ' ') c = c.substring(1);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
}

// ─── URL param helper ────────────────────────────────────────────────────────

function getUrlParam(name) {
  var url = window.location.search;
  var re = new RegExp('[?&]' + name + '=([^&#]*)');
  var results = re.exec(url);
  return results ? decodeURIComponent(results[1].replace(/\+/g, ' ')) : null;
}

// ─── Auto-init ───────────────────────────────────────────────────────────────

function init(programId) {
  // 1. Check URL for ?ref=REFCODE and store in cookie
  var ref = getUrlParam('ref');
  if (ref) {
    setCookie(COOKIE_NAME, ref, COOKIE_DAYS);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the current affiliate ref code from the cookie.
 * @returns {string|null}
 */
function getRef() {
  return getCookie(COOKIE_NAME);
}

/**
 * Injects the current ref code into a Stripe Checkout session creation request.
 * Pass this to your /api/create-checkout fetch body.
 *
 * @param {object} options
 * @param {object} [options.metadata] - Existing metadata to merge with
 * @returns {object} - Object with ref injected as { ak_ref, metadata }
 */
function onConvert(options) {
  var ref = getRef();
  var merged = Object.assign({}, options || {});

  if (ref) {
    // Inject into metadata for Stripe
    merged.metadata = Object.assign({}, merged.metadata || {}, { ak_ref: ref });
    // Also set as client_reference_id if not already set
    if (!merged.clientReferenceId && !merged.client_reference_id) {
      merged.client_reference_id = ref;
    }
  }

  return merged;
}

/**
 * Manually set the ref code (useful for server-side rendering flows).
 * @param {string} ref
 * @param {number} [days]
 */
function setRef(ref, days) {
  setCookie(COOKIE_NAME, ref, days || COOKIE_DAYS);
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

// Find the script tag that loaded this file
var currentScript = document.currentScript || (function () {
  var scripts = document.getElementsByTagName('script');
  return scripts[scripts.length - 1];
})();

var programId = currentScript ? currentScript.getAttribute('data-program') : null;

// Auto-init on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(programId); });
  } else {
    init(programId);
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export { getRef, setRef, onConvert, init };
