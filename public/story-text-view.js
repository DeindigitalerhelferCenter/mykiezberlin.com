/* My Kiez Berlin – shows the admin text on top of story videos (2026-11-17, owner).
   Pictures already carry the text inside the picture; videos get it as data (media[].overlay) and it is drawn
   here on top of the visible video picture (story-text.js: mkStoryTextLayer). Loaded after story-multi.js. */
(function () {
  "use strict";
  if (typeof renderStorySlide !== "function" || typeof mkStoryTextLayer !== "function") return;
  function current() {
    try {
      var list = getStories().filter(function (s) { return s.status === "approved"; });
      return list[activeStoryIndex];
    } catch (e) { return null; }
  }
  var base = renderStorySlide;
  renderStorySlide = function () {
    var r = base.apply(this, arguments);
    try {
      var story = current();
      var media = story && Array.isArray(story.media) ? story.media : [];
      var m = media[media.length > 1 ? window.mkStoryMediaIndex || 0 : 0];
      var view = document.querySelector("#story-modal-overlay .story-content-view");
      if (view) view.querySelectorAll(".mk-story-text").forEach(function (n) { n.remove(); });
      if (m && m.video && m.overlay && view) {
        var video = view.querySelector("video");
        if (video) mkStoryTextLayer(video, m.overlay);
      }
      // 2026-11-22 (owner): news stories – the text is drawn on top of the picture (template / own background)
      else if (m && !m.video && m.overlay && view) {
        var img = view.querySelector("img.story-main-img, .story-media img, img");
        if (img) {
          var proxy = {
            get parentNode() { return img.parentNode; },
            get videoWidth() { return img.naturalWidth; }, get videoHeight() { return img.naturalHeight; },
            get clientWidth() { return img.clientWidth; }, get clientHeight() { return img.clientHeight; },
            get offsetLeft() { return img.offsetLeft; }, get offsetTop() { return img.offsetTop; },
            get readyState() { return img.complete && img.naturalWidth ? 1 : 0; },
            addEventListener: function (ev, fn) { img.addEventListener(ev === "loadedmetadata" ? "load" : ev, fn); },
          };
          mkStoryTextLayer(proxy, m.overlay);
        }
      }
      // 2026-11-22 (owner): news pictures carry ALL text inside the picture -> no extra text box, only a small source button
      var box = document.querySelector("#story-modal-overlay .story-viewer-box");
      if (box) {
        box.querySelectorAll(".mk-news-src").forEach(function (n) { n.remove(); });
        var isNews = story && /\/media\/stories\/news-(?!tpl)/.test(String(story.image || ""));
        box.classList.toggle("mk-news-pic", !!isNews);
        if (isNews && story.link && /^https?:\/\//.test(story.link) && story.link.indexOf("mykiezberlin.com") < 0) {
          var a = document.createElement("a");
          a.className = "mk-news-src";
          a.href = story.link;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = "🔗 Kaynağı aç · Quelle öffnen";
          box.appendChild(a);
        }
      }
    } catch (e) {}
    return r;
  };
  var css = document.createElement("style");
  css.textContent = "#story-modal-overlay .story-viewer-box.mk-news-pic .story-text-card,#story-modal-overlay .story-viewer-box.mk-news-pic .story-watermark-logo{display:none!important}" +
    ".mk-news-src{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:7;padding:9px 16px;border-radius:999px;background:rgba(0,0,0,.72);color:#FFC107!important;font-weight:800;font-size:13px;text-decoration:none;white-space:nowrap}";
  document.head.appendChild(css);
})();
