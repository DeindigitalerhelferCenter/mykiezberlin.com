/* My Kiez Berlin – stories with several pictures/videos (2026-11-13, owner).
   The admin can put any number of pictures and videos into one story (e.g. a sponsor ad: 4 pictures + 2 videos).
   The viewer shows them one after another inside the same story: tap right = next picture, tap left = previous,
   at the end the next story starts. Small bars on top show the position. A video plays to its end (max. 60 s). */
(function () {
  "use strict";
  if (typeof renderStorySlide !== "function" || typeof nextStory !== "function") return;
  var index = 0;
  var lastStoryId = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function current() {
    var list = getStories().filter(function (s) { return s.status === "approved"; });
    return list[activeStoryIndex];
  }
  function items(story) {
    return story && Array.isArray(story.media) && story.media.length > 1 ? story.media : null;
  }

  var baseRender = renderStorySlide;
  renderStorySlide = function () {
    var story = current();
    if (!story || story.id !== lastStoryId) { index = 0; lastStoryId = story ? story.id : null; }
    var r = baseRender.apply(this, arguments);
    var list = items(story);
    window.mkStoryDurationMs = 0;
    if (!list) return r;
    if (index >= list.length) index = list.length - 1;
    var m = list[index];
    var view = document.querySelector("#story-modal-overlay .story-content-view");
    if (view) {
      view.querySelectorAll("img,video").forEach(function (n) { n.remove(); });
      view.insertAdjacentHTML("beforeend", m.video
        ? '<video src="' + esc(m.url) + '" autoplay playsinline style="width:100%;height:100%;object-fit:contain"></video>'
        : '<img src="' + esc(m.url) + '" alt="' + esc(story.headline) + '">');
      if (m.caption) view.insertAdjacentHTML("beforeend", '<div style="position:absolute;left:12px;right:12px;top:72px;z-index:3;background:rgba(0,0,0,.55);color:#fff;border-radius:10px;padding:6px 10px;font-size:13px;font-weight:700">' + esc(m.caption) + "</div>");
      var video = view.querySelector("video");
      if (video) {
        window.mkStoryDurationMs = 7000;
        video.addEventListener("loadedmetadata", function () {
          if (video.duration && isFinite(video.duration)) { window.mkStoryDurationMs = Math.min(60000, Math.max(7000, Math.ceil(video.duration * 1000) + 300)); startStoryTimer(); }
        });
      }
    }
    // position bars (one per picture/video) under the story progress bar
    var bar = document.querySelector("#story-modal-overlay .story-progress-bar");
    if (bar) {
      var dots = document.createElement("div");
      dots.style.cssText = "display:flex;gap:3px;margin-top:4px";
      dots.innerHTML = list.map(function (x, i) { return '<span style="flex:1;height:3px;border-radius:2px;background:' + (i <= index ? "#fff" : "rgba(255,255,255,.35)") + '"></span>'; }).join("");
      bar.insertAdjacentElement("afterend", dots);
    }
    return r;
  };

  var baseNext = nextStory;
  nextStory = function () {
    var list = items(current());
    if (list && index < list.length - 1) { index++; renderStorySlide(); startStoryTimer(); return; }
    index = 0;
    return baseNext.apply(this, arguments);
  };

  var basePrev = prevStory;
  prevStory = function () {
    var list = items(current());
    if (list && index > 0) { index--; renderStorySlide(); startStoryTimer(); return; }
    index = 0;
    return basePrev.apply(this, arguments);
  };
})();
