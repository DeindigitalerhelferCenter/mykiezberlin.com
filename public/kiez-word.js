/*
 * 2026-11-14 (owner): the German word "Kiez" was never translated. In Turkish it becomes "Mahalle", in English
 * "neighbourhood" – everywhere on the page (texts, placeholders, titles). Not changed: the name "My Kiez Berlin",
 * the package names (Kiez Basic / Plus / Premium) and German sentences (e.g. news in German).
 * Works on the shown page only; switching back to German restores the original words.
 */
(function () {
  "use strict";
  var KEEP = /My\s?Kiez|MyKiez|mykiez|Kiez (?:Basic|Plus|Premium)/g;
  var GERMAN = /[äßÄ]|\b(?:der|die|das|und|im|mit|für|ein|eine|dein|deine|deinem|deinen|deiner|zum|zur|von|auf|ist|bei|aus|nicht|jetzt|werde|alle|neue|neuen|hier|wird|sind|oder)\b/;
  var touched = []; // [node, original, kind(attr name or "")]

  function lang() { var l = typeof currentLanguage === "string" ? currentLanguage.toLowerCase() : "de"; return l.indexOf("tr") === 0 ? "tr" : l.indexOf("en") === 0 ? "en" : "de"; }
  function cap(word, big) { return big ? word.charAt(0).toUpperCase() + word.slice(1) : word; }
  function isBig(text, start, end) {
    var before = text.slice(0, start).replace(/[\s"„“'(\[«#·•|–—-]+$/, "");
    if (!before || /[.!?:\n]$/.test(before) || !/[A-Za-zÀ-ɏ]/.test(before.slice(-1))) return true; // start of text / sentence / after emoji
    var prev = (before.match(/(\S+)$/) || [""])[0];
    var next = (text.slice(end).match(/^\s+(\S+)/) || [, ""])[1];
    return /^[A-ZÇĞİÖŞÜ]/.test(prev) || /^[A-ZÇĞİÖŞÜ]/.test(next);
  }
  // Turkish suffix after "Kiez'" -> after "mahalle" (front vowels like "Kiez")
  function trSuffix(sfx) {
    if (/^(in|ın)$/i.test(sfx)) return "nin";
    if (/^[aeıioöuü]/i.test(sfx)) return "y" + sfx;
    return sfx;
  }

  function translate(text, l) {
    if (text.indexOf("Kiez") < 0) return text;
    var kept = [];
    var s = text.replace(KEEP, function (m) { kept.push(m); return "\u0001" + (kept.length - 1) + "\u0002"; });
    if (s.indexOf("Kiez") < 0) return text;
    if (l === "tr") {
      s = s.replace(/\s*\((?:Kieze|Kiez)\)/g, "").replace(/Mahalle\s*\/\s*Kiez\b/g, "Mahalle");
      s = s.replace(/\bKiez['’](\p{L}+)/gu, function (m, sfx, off) { return cap("mahalle", isBig(s, off, off + m.length)) + trSuffix(sfx); });
      s = s.replace(/\bKiezler(\p{L}*)/gu, function (m, r, off) { return cap("mahalleler", isBig(s, off, off + m.length)) + r; });
      s = s.replace(/\bKiez(?:en|e)\b/g, function (m, off) { return cap("mahalleler", isBig(s, off, off + m.length)); });
      s = s.replace(/\bKiezi\b/g, function (m, off) { return cap("mahallesi", isBig(s, off, off + m.length)); });
      s = s.replace(/\bKiez-(?=\p{L})/gu, function (m, off) { return cap("mahalle", isBig(s, off, off + m.length)) + " "; });
      s = s.replace(/\bKiez\b/g, function (m, off) { return cap("mahalle", isBig(s, off, off + m.length)); });
    } else {
      s = s.replace(/\bKiez(?:es|en|e)\b/g, function (m, off) { return cap("neighbourhoods", isBig(s, off, off + m.length)); });
      s = s.replace(/\bKiez-(?=\p{L})/gu, function (m, off) { return cap("neighbourhood", isBig(s, off, off + m.length)) + " "; });
      s = s.replace(/\bKiez\b/g, function (m, off) { return cap("neighbourhood", isBig(s, off, off + m.length)); });
    }
    return s.replace(/\u0001(\d+)\u0002/g, function (m, i) { return kept[+i]; });
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, CODE: 1, PRE: 1 };
  function skipEl(el) { return !el || SKIP[el.tagName] || el.isContentEditable || (el.closest && el.closest(".mk-no-kiez,#admin-app,.admin-shell")); }

  function doText(node, l) {
    var v = node.nodeValue;
    if (!v || v.indexOf("Kiez") < 0 || GERMAN.test(v) || skipEl(node.parentElement)) return;
    var t = translate(v, l);
    if (t !== v) { touched.push([node, v, ""]); node.nodeValue = t; }
  }
  function doAttrs(el, l) {
    ["placeholder", "title", "aria-label"].forEach(function (a) {
      var v = el.getAttribute(a);
      if (!v || v.indexOf("Kiez") < 0 || GERMAN.test(v)) return;
      var t = translate(v, l);
      if (t !== v) { touched.push([el, v, a]); el.setAttribute(a, t); }
    });
  }
  function walk(root, l) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root, l); return; }
    if (root.nodeType !== 1 || skipEl(root)) return;
    if (root.hasAttribute && (root.hasAttribute("placeholder") || root.hasAttribute("title") || root.hasAttribute("aria-label"))) doAttrs(root, l);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    var n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) doText(n, l);
      else if (n.hasAttribute("placeholder") || n.hasAttribute("title") || n.hasAttribute("aria-label")) doAttrs(n, l);
    }
  }
  function restore() {
    touched.forEach(function (x) { if (x[2]) x[0].setAttribute(x[2], x[1]); else x[0].nodeValue = x[1]; });
    touched = [];
  }

  var current = lang();
  var pending = [];
  var busy = false;
  function flush() {
    busy = false;
    var l = lang();
    if (l !== current) { restore(); current = l; if (l !== "de") walk(document.body, l); pending = []; return; }
    if (l === "de") { pending = []; return; }
    var list = pending; pending = [];
    list.forEach(function (n) { if (n.isConnected) walk(n, l); });
    if (touched.length > 4000) touched = touched.filter(function (x) { return x[0].isConnected; });
  }
  var obs = new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      if (m.type === "characterData") pending.push(m.target);
      else m.addedNodes.forEach(function (n) { pending.push(n); });
    });
    if (!busy) { busy = true; requestAnimationFrame(flush); }
  });
  function start() {
    if (current !== "de") walk(document.body, current);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    setInterval(function () { if (lang() !== current && !busy) { busy = true; requestAnimationFrame(flush); } }, 1200);
  }
  window.mkKiezWord = translate; // for tests
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
