/* ============================================================
   TOPBAR AUTO-MINIMIZE — collapses the navbar down to a thin
   "Navigation Bar ⌄" edge strip.

   Scope: THIS PAGE ONLY, with ZERO permanent footprint anywhere
   else. The topbar element itself lives outside #page-content, so
   PJAX (in main.js) never reloads or rebuilds it when moving
   between pages — it's the exact same DOM node the whole time.

   Earlier version of this file hard-coded the toggle button and a
   wrapper div into the topbar's static HTML. Because that markup
   never gets swapped out by PJAX, it kept sitting there even after
   navigating to a different page — clashing with that page's CSS
   and breaking the layout until a hard refresh. Fixed here by never
   touching the HTML file at all: this script now BUILDS the toggle
   + wrapper purely in memory when you land on this page, and fully
   UNBUILDS them (restoring the topbar to its exact original DOM)
   the moment you navigate anywhere else. Every other page always
   sees a completely untouched topbar.

   Behavior on this page:
     - Auto-collapses to the edge strip right on load
     - Click the strip (or the Λ / ⌄ arrow) to open / close it
     - If left open, it auto-collapses again after 10s
   ============================================================ */
(function () {
  "use strict";

  var TARGET_PAGE = "ai-video-generation.html";
  var AUTO_COLLAPSE_MS = 10000;
  var autoCollapseTimer = null;

  function isTargetPage() {
    var file = window.location.pathname.split("/").pop();
    return file === TARGET_PAGE;
  }

  function collapse(topbar, toggle, instant) {
    clearTimeout(autoCollapseTimer);
    if (instant) topbar.classList.add("navmin-instant");

    topbar.classList.add("topbar-navmin-collapsed");
    toggle.setAttribute("aria-expanded", "false");

    if (instant) {
      void topbar.offsetHeight; // force reflow so "no transition" actually paints
      requestAnimationFrame(function () {
        topbar.classList.remove("navmin-instant");
      });
    }
  }

  function expand(topbar, toggle) {
    clearTimeout(autoCollapseTimer);
    topbar.classList.remove("topbar-navmin-collapsed");
    toggle.setAttribute("aria-expanded", "true");

    // Auto re-minimize after 10s if the user leaves it open.
    autoCollapseTimer = setTimeout(function () {
      collapse(topbar, toggle, false);
    }, AUTO_COLLAPSE_MS);
  }

  // Builds the edge-toggle button + wrapper div around the topbar's
  // existing header-actions + app-inner, purely in memory. Idempotent:
  // if it's already built, just returns the existing toggle.
  function buildWrapper(topbar) {
    var existing = document.getElementById("topbarEdgeToggle");
    if (existing) return existing;

    var headerActions = topbar.querySelector(".header-actions");
    var appInner = topbar.querySelector(".app-inner.topbar-inner") || topbar.querySelector(".topbar-inner");
    if (!headerActions || !appInner) return null;

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.id = "topbarEdgeToggle";
    toggle.className = "topbar-edge-toggle";
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-controls", "topbarBody");
    toggle.setAttribute("aria-label", "Toggle navigation bar");
    toggle.innerHTML =
      '<span class="topbar-edge-label">Navigation Bar</span>' +
      '<svg class="topbar-edge-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'+ '<span class="topbar-edge-label"> Click To Checkout My More Projects</span>';

    var body = document.createElement("div");
    body.className = "topbar-body";
    body.id = "topbarBody";

    // Insert both new nodes in place, then move the two original
    // children into the wrapper, preserving their order.
    topbar.insertBefore(toggle, headerActions);
    topbar.insertBefore(body, headerActions);
    body.appendChild(headerActions);
    body.appendChild(appInner);

    return toggle;
  }

  // Reverses buildWrapper(): moves header-actions and app-inner back
  // out to be direct children of .topbar again, in their original
  // order, then removes the wrapper + toggle — leaving the topbar
  // byte-for-byte the same as it was before this script ever ran.
  function teardownWrapper(topbar) {
    var body = document.getElementById("topbarBody");
    var toggle = document.getElementById("topbarEdgeToggle");
    if (!body) {
      if (toggle) toggle.remove();
      return;
    }
    while (body.firstChild) {
      topbar.insertBefore(body.firstChild, body);
    }
    body.remove();
    if (toggle) toggle.remove();
  }

  function setup() {
    var topbar = document.querySelector(".topbar");
    if (!topbar) return;

    clearTimeout(autoCollapseTimer);

    if (!isTargetPage()) {
      // Left the target page (PJAX or otherwise): tear everything
      // this script built back out, restoring the topbar to its
      // exact original markup so no other page is ever affected.
      teardownWrapper(topbar);
      topbar.classList.remove("topbar-minimizable", "topbar-navmin-collapsed", "navmin-instant");
      return;
    }

    var toggle = buildWrapper(topbar);
    if (!toggle) return;

    topbar.classList.add("topbar-minimizable");

    // Bind the click handler once per toggle element.
    if (!toggle.dataset.navminBound) {
      toggle.dataset.navminBound = "true";
      toggle.addEventListener("click", function () {
        if (topbar.classList.contains("topbar-navmin-collapsed")) {
          expand(topbar, toggle);
        } else {
          collapse(topbar, toggle, false);
        }
      });
    }

    // Land on this page already minimized — instantly, no open-then-
    // shut flash.
    collapse(topbar, toggle, true);
  }

  document.addEventListener("DOMContentLoaded", setup);

  // main.js's PJAX navigation swaps #page-content via
  // container.replaceWith(newContainer) — a direct childList change
  // on <body>. Watching for that lets this re-evaluate (build or
  // teardown) on every in-page navigation without importing or
  // editing any PJAX code.
  function observeBody() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", observeBody, { once: true });
      return;
    }
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].type === "childList") {
          setup();
          break;
        }
      }
    });
    observer.observe(document.body, { childList: true });
  }
  observeBody();

  // Fallback for browser back/forward navigation.
  window.addEventListener("popstate", function () {
    setTimeout(setup, 50);
  });
})();