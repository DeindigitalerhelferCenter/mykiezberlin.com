/* My Kiez Berlin – Kiez search (2026-11-22, owner), same in the app (KiezSearch.kt):
   The user types a Kiez (e.g. "Wedding") -> one list page with everything in that Kiez:
     1. sponsors in the Kiez (Premium -> Plus -> Basic), 2. sponsors nearby (same district),
     3. businesses & food, 4. Kiez-Stories, 5. events, 6. jobs (PLZ of the Kiez), 7. live notices.
   Other words: the old search stays, sponsors matching the word are shown on top. */
(function () {
  "use strict";
  if (typeof handleGlobalSearch !== "function") return;
  var baseSearch = handleGlobalSearch;
  var KIEZE = null, JOBS_BA = null, EVENTS_API = null;
  // Ortsteil -> district (Bezirk), for "nearby"
  var DISTRICT = {
    mitte: "mitte", wedding: "mitte", gesundbrunnen: "mitte", moabit: "mitte", tiergarten: "mitte",
    kreuzberg: "friedrichshain-kreuzberg", friedrichshain: "friedrichshain-kreuzberg",
    "prenzlauer berg": "pankow", pankow: "pankow", charlottenburg: "charlottenburg-wilmersdorf", wilmersdorf: "charlottenburg-wilmersdorf",
    "charlottenburg-nord": "charlottenburg-wilmersdorf", "charlottenburg-wilmersdorf": "charlottenburg-wilmersdorf",
    schöneberg: "tempelhof-schöneberg", tempelhof: "tempelhof-schöneberg", neukölln: "neukölln", britz: "neukölln",
    steglitz: "steglitz-zehlendorf", zehlendorf: "steglitz-zehlendorf", spandau: "spandau", reinickendorf: "reinickendorf", tegel: "reinickendorf",
    lichtenberg: "lichtenberg", treptow: "treptow-köpenick", köpenick: "treptow-köpenick", marzahn: "marzahn-hellersdorf",
  };
  function norm(s) { return String(s == null ? "" : s).toLowerCase().normalize("NFC").trim(); }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function L(de, tr, en) { var l = typeof currentLanguage === "string" ? currentLanguage : "de"; return l.indexOf("tr") === 0 ? tr : l.indexOf("en") === 0 ? (en || de) : de; }

  function preload() {
    if (!KIEZE) fetch("/api/kieze").then(function (r) { return r.json(); }).then(function (d) { KIEZE = d.kieze || []; }).catch(function () { KIEZE = []; });
    if (!JOBS_BA) fetch("/api/jobs").then(function (r) { return r.json(); }).then(function (d) { JOBS_BA = d.jobs || []; }).catch(function () { JOBS_BA = []; });
    if (!EVENTS_API) fetch("/api/events").then(function (r) { return r.json(); }).then(function (d) { EVENTS_API = d.events || []; }).catch(function () { EVENTS_API = []; });
  }

  function findKiez(term) {
    var t = norm(term);
    if (t.length < 3) return null;
    var list = (KIEZE && KIEZE.length ? KIEZE : (typeof BERLIN_KIEZE !== "undefined" ? BERLIN_KIEZE : [])).filter(function (k) { return k.name !== "Berlin & Umgebung"; });
    return list.find(function (k) { return norm(k.name) === t; }) || list.find(function (k) { return norm(k.name).indexOf(t) === 0; }) || null;
  }
  function plzList(k) { return String(k.postalCodes || "").split(/[,\s]+/).filter(Boolean); }
  function inKiez(text, k) {
    var s = norm(text), n = norm(k.name);
    if (!s) return false;
    if (s.indexOf(n) >= 0) return true;
    return plzList(k).some(function (p) { return s.indexOf(p) >= 0; });
  }
  var RANK = { banner: 0, large: 0, medium: 1, small: 2 };
  function tier(ad) { return RANK[ad.size] != null ? RANK[ad.size] : 1; }
  function tierName(ad) { return tier(ad) === 0 ? "Premium" : tier(ad) === 1 ? "Plus" : "Basic"; }

  function row(icon, title, sub, onclick, img, badge) {
    return '<button type="button" class="mk-sr-row" onclick="' + onclick + '">' +
      (img ? '<img src="' + e(img) + '" alt="" loading="lazy">' : '<span class="mk-sr-ic">' + icon + "</span>") +
      '<span class="mk-sr-t"><b>' + e(title) + "</b>" + (sub ? "<small>" + e(sub) + "</small>" : "") + "</span>" + (badge ? '<span class="mk-sr-b">' + e(badge) + "</span>" : "") + "</button>";
  }
  function section(title, items) { return items.length ? '<h3 class="mk-sr-h">' + title + " (" + items.length + ')</h3><div class="mk-sr-list">' + items.join("") + "</div>" : ""; }

  function kiezPage(k, content) {
    var ads = window.mkAllAds || [];
    var d0 = DISTRICT[norm(k.name)];
    var here = ads.filter(function (a) { return inKiez(a.kieze, k) || inKiez(a.address, k); }).sort(function (a, b) { return tier(a) - tier(b); });
    var near = ads.filter(function (a) {
      if (here.indexOf(a) >= 0 || !d0) return false;
      return String(a.kieze || "").split(",").some(function (x) { return DISTRICT[norm(x)] === d0; });
    }).sort(function (a, b) { return tier(a) - tier(b); });
    var spRow = function (a) { return row("🤝", a.name, (a.category && (a.category[typeof currentLanguage === "string" ? currentLanguage : "de"] || a.category.de)) || a.address || "", "mkSponsorInfo('" + e(a.id) + "')", a.logo || a.image, tierName(a)); };

    var places = [];
    (typeof BUSINESSES !== "undefined" ? BUSINESSES : []).forEach(function (b) { if (inKiez(b.kiezName, k) || inKiez(b.address, k)) places.push(row("🏪", b.name, [b.category, b.address].filter(Boolean).join(" · "), "switchTab('food')", "", "")); });
    (typeof FOOD_SPOTS !== "undefined" ? FOOD_SPOTS : []).forEach(function (f) { if (inKiez(f.kiezName, k) || inKiez(f.address, k)) places.push(row("🍽️", f.name, [f.cuisine || f.category, f.address].filter(Boolean).join(" · "), "switchTab('food')", "", "")); });

    var approved = typeof getStories === "function" ? getStories().filter(function (s) { return s.status === "approved"; }) : [];
    var stories = [];
    approved.forEach(function (s, i) { if (inKiez(s.kiez, k) || inKiez(s.headline, k)) stories.push(row("📰", String(s.headline || "").replace(/<[^>]+>/g, ""), s.kiez, "openStoryViewer(" + i + ")", s.image && s.image.indexOf("hero_berlin") < 0 ? s.image : "", "")); });

    var events = [];
    var evLocal = (typeof EVENTS_FULL !== "undefined" ? EVENTS_FULL : []).concat(typeof BERLIN_EVENTS !== "undefined" ? BERLIN_EVENTS : []);
    var seen = {};
    evLocal.forEach(function (ev) { if (!seen[ev.title] && (inKiez(ev.kiezName, k) || inKiez(ev.description, k))) { seen[ev.title] = 1; events.push(row("🎉", ev.title, [ev.dayLabel || ev.dateText, ev.time, ev.kiezName].filter(Boolean).join(" · "), "switchTab('events')", "", "")); } });
    (EVENTS_API || []).forEach(function (ev) {
      if (seen[ev.title] || !(inKiez(ev.address, k) || inKiez(ev.district, k) || (d0 && DISTRICT[norm(ev.district)] === d0))) return;
      seen[ev.title] = 1;
      events.push(row("🎄", ev.title, [new Date(ev.from).toLocaleDateString("de-DE") + " – " + new Date(ev.to).toLocaleDateString("de-DE"), ev.address].filter(Boolean).join(" · "), "window.open('" + e(ev.url || "https://www.berlin.de") + "','_blank')", "", ""));
    });

    var jobs = [];
    (typeof JOBS !== "undefined" ? JOBS : []).forEach(function (j) { if (inKiez(j.kiez || j.kiezName, k)) jobs.push(row("💼", j.title, [j.company, j.jobType].filter(Boolean).join(" · "), "switchTab('jobs')", "", "")); });
    var plz = plzList(k);
    (JOBS_BA || []).forEach(function (j) { if (plz.indexOf(String(j.plz)) >= 0 && jobs.length < 40) jobs.push(row("💼", j.title, [j.company, j.plz, j.jobType].filter(Boolean).join(" · "), "switchTab('jobs')", "", "")); });

    var alerts = [];
    (typeof BERLIN_LIVE_ALERTS !== "undefined" ? BERLIN_LIVE_ALERTS : []).forEach(function (a) { if (inKiez(a.titleDe + " " + a.bodyDe, k)) alerts.push(row("🚨", L(a.titleDe, a.titleTr), a.tag, "switchTab('bulletin')", "", "")); });

    var total = here.length + near.length + places.length + stories.length + events.length + jobs.length + alerts.length;
    content.innerHTML =
      '<div class="mk-sr"><div class="mk-sr-head"><h2>📍 ' + e(k.name) + " – " + e(L("alles im Kiez", "mahallede neler var", "everything in the Kiez")) + "</h2>" +
      "<small>" + e([k.subtitle, k.population ? L("Einwohner", "Nüfus") + ": " + k.population : "", plz.length ? "PLZ " + plz.join(", ") : ""].filter(Boolean).join(" · ")) + "</small>" +
      '<div class="mk-sr-sum">' + total + " " + e(L("Treffer", "sonuç", "results")) + "</div></div>" +
      section("🤝 " + e(L("Sponsoren im Kiez", "Mahalledeki sponsorlar", "Sponsors in the Kiez")), here.map(spRow)) +
      section("📌 " + e(L("Sponsoren in der Nähe", "Yakındaki sponsorlar", "Sponsors nearby")), near.map(spRow)) +
      section("🏪 " + e(L("Betriebe & Essen", "İşletmeler & yemek", "Businesses & food")), places) +
      section("📰 " + e(L("Kiez-Stories", "Mahalle hikâyeleri", "Kiez stories")), stories) +
      section("🎉 " + e(L("Events", "Etkinlikler", "Events")), events) +
      section("💼 " + e(L("Jobs im Kiez", "Mahalledeki iş ilanları", "Jobs in the Kiez")), jobs) +
      section("🚨 " + e(L("Live-Hinweise", "Canlı bildirimler", "Live notices")), alerts) +
      (total ? "" : '<p class="ext-note">' + e(L("Hier ist noch nichts eingetragen.", "Burada henüz bir şey yok.", "Nothing listed here yet.")) + "</p>") +
      '<a class="mk-sr-werben" href="/werben?bf=1#f">📣 ' + e(L("Dein Betrieb in " + k.name + "? Jetzt sichtbar werden →", "İşletmen " + k.name + "'da mı? Hemen görünür ol →", "Your business in " + k.name + "? Get visible →")) + "</a></div>";
  }

  handleGlobalSearch = function (term) {
    preload();
    var k = term ? findKiez(term) : null;
    var content = document.getElementById("main-tab-content");
    if (k && content) { kiezPage(k, content); return; }
    baseSearch(term);
    if (!term || !content) return;
    // other words: sponsors matching the word on top
    var t = norm(term);
    var ads = (window.mkAllAds || []).filter(function (a) { return [a.name, a.kieze, a.address, a.description, a.category && a.category.de, a.category && a.category.tr].some(function (v) { return norm(v).indexOf(t) >= 0; }); })
      .sort(function (a, b) { return tier(a) - tier(b); });
    if (!ads.length) return;
    var h = content.querySelector("h2");
    var html = section("🤝 " + e(L("Sponsoren", "Sponsorlar", "Sponsors")), ads.map(function (a) { return row("🤝", a.name, a.kieze || a.address || "", "mkSponsorInfo('" + e(a.id) + "')", a.logo || a.image, tierName(a)); }));
    if (h) h.insertAdjacentHTML("afterend", html); else content.insertAdjacentHTML("afterbegin", html);
  };
  preload();

  var css = document.createElement("style");
  css.textContent =
    ".mk-sr{grid-column:1/-1;display:block!important;width:100%;min-width:0}.mk-sr>*{width:auto}.mk-sr-head{padding:14px 16px;border-radius:16px;background:linear-gradient(135deg,#0F172A,#1E3A8A);color:#fff;margin-bottom:12px}" +
    ".mk-sr-head h2{margin:0 0 4px;font-size:19px}.mk-sr-head small{opacity:.85}.mk-sr-sum{margin-top:6px;font-weight:800;color:#FFC107}" +
    ".mk-sr-h{margin:16px 0 8px;font-size:15px;font-weight:800}.mk-sr-list{display:flex;flex-direction:column;gap:6px}" +
    ".mk-sr-row{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border:1px solid var(--border-color,#e2e8f0);border-radius:12px;background:var(--surface-color,#fff);color:inherit;font:inherit;text-align:left;cursor:pointer}" +
    ".mk-sr-row img{width:40px;height:40px;border-radius:10px;object-fit:cover;flex:none;background:#fff}.mk-sr-ic{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;background:var(--surface-variant,#f1f5f9);flex:none}" +
    ".mk-sr-t{flex:1;min-width:0}.mk-sr-t b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mk-sr-t small{display:block;opacity:.7;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".mk-sr-b{font-style:normal;font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;width:auto;height:auto;line-height:1.4;white-space:nowrap;background:#FFC107;color:#0F172A;flex:none}" +
    ".mk-sr-werben{display:block;margin:18px 0 4px;padding:12px 16px;border-radius:14px;background:#000;color:#FFC107!important;font-weight:800;text-decoration:none;text-align:center}";
  document.head.appendChild(css);
})();
