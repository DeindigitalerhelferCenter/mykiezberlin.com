/* My Kiez Berlin – UI fixes from the visual critique (2026-11-10).
   - Admin link in the header only for admins (same flag as admin.html / admin-share.js).
     Everyone else still reaches /admin.html via the ☰ menu or the direct link.
   - Section headings (h3.ext-subheading) are announced as level-2 headings (page has one h1). */
(function () {
  "use strict";
  function isAdmin() {
    try {
      if (/[?&]admin(=1)?(&|$)/.test(location.search)) return true;
      return localStorage.getItem("mykiez_admin_auth_v1") === "true";
    } catch (e) { return false; }
  }
  if (isAdmin()) document.documentElement.classList.add("mk-is-admin");

  function headings() {
    document.querySelectorAll("h3.ext-subheading:not([aria-level])").forEach(function (h) {
      h.setAttribute("role", "heading");
      h.setAttribute("aria-level", "2");
    });
  }
  function start() {
    headings();
    var main = document.getElementById("main-tab-content");
    if (main) new MutationObserver(headings).observe(main, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
