/* My Kiez Berlin – big files for trusted accounts (2026-11-24, owner).
   Admin, story key ("Kiez26" …) and trusted sponsors (TEK, The Visit, Berlin Handel …) have no size or file limit.
   Cloudflare takes ~100 MB per request, so every file over 20 MB is sent in 20 MB parts straight into storage
   (/api/big-upload, R2 multipart). The form then carries "r2big:<key>|<type>|<size>" in place of the file.
   - window.mkIsBigUser()                -> true for admin / story key / trusted sponsor
   - window.mkBigUpload(file, headers, { target, adId, onProgress }) -> Promise<"r2big:…" | null> (null = not allowed)
   - fetch() to /api/stories and /api/sponsor-media is handled automatically (load this file BEFORE kiez-boost.js). */
(function () {
  "use strict";
  var LIMIT = 20 * 1024 * 1024;
  var AUTH = ["x-admin-token", "x-story-key", "x-sponsor-token"];

  function ls(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function ss(k) { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } }

  window.mkIsBigUser = function () {
    if (window.mkSponsorVip) return true;
    if (ss("mykiez_admin_token_v1") || ls("mykiez_admin_token_v1") || ls("mykiez_admin_session_v1") || ls("mykiez_admin_auth_v1")) return true;
    try { if (window.mkStoryKey && window.mkStoryKey()) return true; } catch (e) {}
    return /^[a-f0-9]{32,64}$/.test(ls("mk_story_key"));
  };

  function note(text) {
    var el = document.getElementById("mk-big-note");
    if (!el) {
      el = document.createElement("div");
      el.id = "mk-big-note";
      el.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;background:#0F172A;color:#fff;padding:10px 16px;border-radius:12px;font:600 14px system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.3);max-width:92vw;text-align:center";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.display = text ? "block" : "none";
  }
  function tr() { return String(document.documentElement.lang || navigator.language || "de").toLowerCase().indexOf("tr") === 0; }

  function authHeaders(h) {
    var out = {};
    var src = h instanceof Headers ? h : new Headers(h || {});
    AUTH.forEach(function (k) { var v = src.get(k); if (v) out[k] = v; });
    return out;
  }

  window.mkBigUpload = function (file, headers, opts) {
    opts = opts || {};
    var base = window.mkBaseFetch || window.fetch;
    var auth = authHeaders(headers);
    var post = function (action, body) {
      return base("/api/big-upload?action=" + action, { method: "POST", headers: Object.assign({ "content-type": "application/json" }, auth), body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { j.status = r.status; return j; }); });
    };
    return post("init", { target: opts.target || "story", adId: opts.adId || "", type: file.type, size: file.size }).then(function (init) {
      if (init.status === 403) return null;
      if (!init.key) throw new Error(init.error || "init_failed");
      var size = init.partSize || LIMIT, count = Math.ceil(file.size / size), parts = [], n = 0;
      function next() {
        if (n >= count) return post("complete", { key: init.key, uploadId: init.uploadId, parts: parts });
        var part = n + 1, blob = file.slice(n * size, Math.min(file.size, (n + 1) * size));
        var label = (file.name || "Datei") + " – " + Math.round((n / count) * 100) + " %";
        note((tr() ? "⏫ Büyük dosya yükleniyor: " : "⏫ Große Datei wird hochgeladen: ") + label);
        if (opts.onProgress) opts.onProgress(n / count);
        var url = "/api/big-upload?action=part&key=" + encodeURIComponent(init.key) + "&uploadId=" + encodeURIComponent(init.uploadId) + "&part=" + part;
        var tries = 0;
        function send() {
          return base(url, { method: "PUT", headers: auth, body: blob }).then(function (r) { return r.json(); }).then(function (j) {
            if (!j.etag) throw new Error(j.error || "part_failed");
            parts.push({ part: part, etag: j.etag });
            n++;
            return next();
          }).catch(function (e) {
            if (++tries < 3) return new Promise(function (res) { setTimeout(res, 1500 * tries); }).then(send);
            post("abort", { key: init.key, uploadId: init.uploadId });
            throw e;
          });
        }
        return send();
      }
      return next().then(function (done) {
        note("");
        if (!done.ref) throw new Error(done.error || "complete_failed");
        return done.ref;
      });
    }).catch(function (e) { note(""); throw e; });
  };

  // forms that send to /api/stories or /api/sponsor-media: big files go in parts first
  var baseFetch = window.fetch;
  window.mkBaseFetch = baseFetch;
  window.fetch = function (input, init) {
    try {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var target = /\/api\/stories(\?|$)/.test(url) ? "story" : /\/api\/sponsor-media(\?|$)/.test(url) ? "sponsor" : "";
      if (target && init && String(init.method || "").toUpperCase() === "POST" && init.body instanceof FormData && window.mkIsBigUser()) {
        var entries = [], bigOnes = 0;
        init.body.forEach(function (v, k) { entries.push([k, v]); if (v instanceof Blob && v.size > LIMIT) bigOnes++; });
        if (bigOnes) {
          var self = this, adId = String(init.body.get("adId") || "");
          var out = new FormData(), chain = Promise.resolve(), denied = false;
          entries.forEach(function (e) {
            chain = chain.then(function () {
              var v = e[1];
              if (!denied && v instanceof Blob && v.size > LIMIT) {
                return window.mkBigUpload(v, init.headers, { target: target, adId: adId }).then(function (ref) {
                  if (ref) out.append(e[0], ref); else { denied = true; out.append(e[0], v, v.name); }
                });
              }
              if (v instanceof File) out.append(e[0], v, v.name); else out.append(e[0], v);
            });
          });
          return chain.then(function () {
            var init2 = Object.assign({}, init, { body: denied ? init.body : out });
            return baseFetch.call(self, input, init2);
          });
        }
      }
    } catch (x) {}
    return baseFetch.call(this, input, init);
  };
})();
