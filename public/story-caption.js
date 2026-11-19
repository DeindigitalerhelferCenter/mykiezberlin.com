/* 2026-11-19 (owner): the text window of a story covered half of the picture and could not be opened.
   PC / tablet (>= 900 px): the text is shown in its own panel NEXT TO the picture, fully readable, scrollable;
   the story pauses while the mouse is on the panel.
   Phone: after 2 s the text shrinks to a thin strip at the bottom ("▲ Mehr lesen · Devamını oku").
   A tap opens it UNDER the picture (the picture gets smaller, nothing covers it) and pauses the story;
   a second tap closes it again. Loaded after app.js, story-multi.js and story-folders.js. */
(function () {
  "use strict";
  if (typeof renderStorySlide !== "function") return;

  var css = document.createElement("style");
  css.textContent =
    "@media(min-width:900px){" +
    "#story-modal-overlay.story-modal{padding-right:360px;box-sizing:border-box}" +
    "#story-modal-overlay .story-text-card{left:calc(100% + 16px)!important;right:auto!important;width:330px;top:64px;bottom:auto!important;" +
    "max-height:calc(100% - 100px)!important;overflow-y:auto;background:#111827!important;backdrop-filter:none;border-color:rgba(255,255,255,.18)}" +
    "#story-modal-overlay .mk-cap-more{display:none}}" +
    "@media(max-width:899px){" +
    "#story-modal-overlay .story-text-card{transition:max-height .35s ease,padding .35s ease;cursor:pointer;z-index:6}" +
    "#story-modal-overlay .story-text-card.mk-cap-min{max-height:58px!important;overflow:hidden!important;padding:9px 14px!important}" +
    "#story-modal-overlay .story-text-card.mk-cap-min>div:nth-child(1){white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px!important;margin-bottom:2px!important}" +
    "#story-modal-overlay .story-text-card.mk-cap-min>*:not(:first-child):not(.mk-cap-more){display:none!important}" +
    "#story-modal-overlay .mk-cap-more{display:block;font-size:11.5px;font-weight:800;color:#FCD34D;margin-top:2px}" +
    "#story-modal-overlay .story-text-card:not(.mk-cap-min) .mk-cap-more{margin-top:10px}" +
    /* opened on the phone: picture on top (smaller), text below it – the text never covers the picture */
    "#story-modal-overlay .story-viewer-box.mk-cap-open .story-content-view{flex:0 0 46%}" +
    "#story-modal-overlay .story-viewer-box.mk-cap-open .story-text-card{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;" +
    "margin:10px 12px 14px;max-height:none!important;flex:1 1 auto;overflow-y:auto!important;border-radius:14px}}";
  document.head.appendChild(css);

  var collapseTimer = null;
  function lang() { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0 ? "tr" : "de"; }
  function wide() { return window.matchMedia && window.matchMedia("(min-width:900px)").matches; }
  function setPaused(v) { try { isStoryPaused = v; } catch (e) {} }

  function label(open) {
    var tr = lang() === "tr";
    return open ? (tr ? "▼ Kapat · Schließen" : "▼ Schließen · Kapat") : (tr ? "▲ Devamını oku · Mehr lesen" : "▲ Mehr lesen · Devamını oku");
  }

  function setup() {
    clearTimeout(collapseTimer);
    var box = document.querySelector("#story-modal-overlay .story-viewer-box");
    var card = box && box.querySelector(".story-text-card");
    if (!card || card.getAttribute("data-mk-cap")) return;
    card.setAttribute("data-mk-cap", "1");
    if (!card.textContent.trim()) return;
    card.insertAdjacentHTML("beforeend", '<div class="mk-cap-more">' + label(true) + "</div>");
    var more = card.querySelector(".mk-cap-more");

    if (wide()) {
      card.addEventListener("mouseenter", function () { setPaused(true); });
      card.addEventListener("mouseleave", function () { setPaused(false); });
      return;
    }
    function collapse() {
      card.classList.add("mk-cap-min");
      box.classList.remove("mk-cap-open");
      more.textContent = label(false);
      setPaused(false);
    }
    function expand() {
      clearTimeout(collapseTimer);
      card.classList.remove("mk-cap-min");
      box.classList.add("mk-cap-open");
      more.textContent = label(true);
      setPaused(true);
      card.scrollTop = 0;
    }
    collapseTimer = setTimeout(collapse, 2000);
    card.addEventListener("click", function (ev) {
      if (ev.target.closest && ev.target.closest("a")) return; // links keep working
      ev.stopPropagation();
      if (card.classList.contains("mk-cap-min")) expand();
      else if (box.classList.contains("mk-cap-open")) collapse();
      else expand();
    });
  }

  var base = renderStorySlide;
  renderStorySlide = function () {
    var r = base.apply(this, arguments);
    setPaused(false);
    try { setup(); } catch (e) {}
    return r;
  };
})();
