/**
 * Community page shared by the website and the app.
 * Everything from the server is inserted as text, never as markup.
 */
const TOKEN_KEY = "mykiez_member_token_v1";
const LANG_KEY = "mykiez_community_lang_v1";
const LIKED_KEY = "mykiez_community_liked_v1";
const MAX_REPLIES = 10;
const CLASSIFIED_CATEGORIES = ["Verkaufen", "Verschenken", "Suchen", "Wohnen", "Dienstleistung", "Sonstiges"];
const POST_CATEGORIES = ["Kultur", "Verkehr", "Baustelle", "Neueröffnung", "Fundbüro"];

const params = new URLSearchParams(location.search);
const lang = params.get("lang") || localStorage.getItem(LANG_KEY) || (navigator.language.startsWith("tr") ? "tr" : "de");
localStorage.setItem(LANG_KEY, lang);
document.documentElement.lang = lang;
const t = (de, tr) => (lang === "tr" ? tr : de);

const ERRORS = {
  bad_login: t("E-Mail oder Passwort stimmt nicht.", "E-posta veya şifre yanlış."),
  email_taken: t("Diese E-Mail ist schon registriert.", "Bu e-posta zaten kayıtlı."),
  weak_password: t("Das Passwort braucht mindestens 8 Zeichen.", "Şifre en az 8 karakter olmalı."),
  reserved_name: t("Dieser Anzeigename ist nicht erlaubt.", "Bu görünen ad kullanılamaz."),
  terms_required: t("Bitte stimme den Regeln zu.", "Lütfen kuralları kabul et."),
  missing_fields: t("Bitte fülle alle Felder aus.", "Lütfen tüm alanları doldur."),
  rate_limited: t("Zu viele Versuche. Bitte versuche es später.", "Çok fazla deneme. Lütfen sonra dene."),
  thread_full: t("Diese Antwortkette ist voll (10 Antworten).", "Bu cevap zinciri dolu (10 cevap)."),
  login_required: t("Bitte melde dich zuerst an.", "Lütfen önce giriş yap."),
  unsupported_file: t("Bitte nutze JPG, PNG oder WebP.", "Lütfen JPG, PNG veya WebP kullan."),
  file_too_large: t("Das Bild ist größer als 5 MB.", "Görsel 5 MB'tan büyük."),
};

let user = null;
let activeTab = /^#ilan/.test(location.hash) ? "classifieds" : "feed"; // 2026-11-27: also #ilan-<id>
const view = document.getElementById("view");
const liked = new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || "[]"));

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  }
  node.append(...children.filter((c) => c !== null && c !== undefined));
  return node;
}

function toast(text) {
  const box = document.getElementById("toast");
  box.textContent = text;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 3200);
}

async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { ...(options.headers || {}) };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "network");
  return data;
}

const postJson = (path, body) => api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const showError = (e) => toast(ERRORS[e.message] || t("Das hat nicht geklappt. Bitte versuche es erneut.", "Bu işlem olmadı. Lütfen tekrar dene."));
const sentText = (status) => (status === "approved" ? t("Veröffentlicht.", "Yayınlandı.") : t("Gesendet. Wird vor der Veröffentlichung geprüft.", "Gönderildi. Yayından önce kontrol edilecek."));
const when = (ms) => new Date(ms).toLocaleString(lang === "tr" ? "tr-TR" : "de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function renderTabs() {
  const tabs = [["feed", t("Beiträge", "Gönderiler")], ["classifieds", t("Kleinanzeigen", "İlanlar")], ["account", user ? user.displayName : t("Anmelden", "Giriş")]];
  document.getElementById("tabs").replaceChildren(...tabs.map(([id, label]) =>
    el("button", { class: id === activeTab ? "active" : "", onclick: () => { activeTab = id; render(); } }, label)));
}

function likeButton(target, id, count) {
  const key = `${target}:${id}`;
  const button = el("button", { class: "btn", disabled: liked.has(key) }, `♥ ${count}`);
  button.addEventListener("click", async () => {
    try {
      const { counted } = await postJson("/api/community", { like: { target, id } });
      liked.add(key);
      localStorage.setItem(LIKED_KEY, JSON.stringify([...liked]));
      button.disabled = true;
      if (counted) button.textContent = `♥ ${count + 1}`;
    } catch (e) { showError(e); }
  });
  return button;
}

function commentForm(item, parentId, onDone) {
  const input = el("textarea", { maxLength: 500, placeholder: parentId ? t("Deine Antwort…", "Cevabın…") : t("Dein Kommentar…", "Yorumun…") });
  const send = el("button", { class: "btn primary" }, t("Senden", "Gönder"));
  send.addEventListener("click", async () => {
    if (!input.value.trim()) return;
    send.disabled = true;
    try {
      const { status } = await postJson("/api/community", { comment: { target: item.target, targetId: item.id, parentId, text: input.value } });
      toast(sentText(status));
      onDone();
    } catch (e) {
      showError(e);
      send.disabled = false;
    }
  });
  return el("div", { class: "comment" }, input, el("div", { class: "actions" }, send));
}

function commentNode(item, comment, replyCount) {
  const editorial = comment.kind === "editorial";
  const slot = el("div");
  const isReply = Boolean(comment.parent_id);
  const rootId = comment.parent_id || comment.id;
  const actions = el("div", { class: "actions" }, likeButton("comment", comment.id, comment.likes));
  if (user && replyCount < MAX_REPLIES) {
    actions.append(el("button", { class: "btn", onclick: () => slot.replaceChildren(commentForm(item, rootId, renderFeed)) }, t("Antworten", "Cevapla")));
  }
  return el("div", { class: `comment${isReply ? " reply" : ""}${editorial ? " editorial" : ""}` },
    el("div", { class: "meta" }, editorial ? el("span", { class: "badge" }, t("Redaktion", "Editör")) : null, ` ${comment.author} · ${when(comment.created_at)}`),
    el("div", {}, comment.text),
    actions,
    slot);
}

function feedCard(item) {
  const roots = item.comments.filter((c) => !c.parent_id);
  const thread = roots.flatMap((root) => {
    const replies = item.comments.filter((c) => c.parent_id === root.id);
    return [root, ...replies].map((c) => commentNode(item, c, replies.length));
  });
  const slot = el("div");
  const actions = el("div", { class: "actions" }, likeButton(item.target, item.id, item.likes));
  actions.append(user
    ? el("button", { class: "btn", onclick: () => slot.replaceChildren(commentForm(item, "", renderFeed)) }, t("Kommentieren", "Yorum yaz"))
    : el("button", { class: "btn", onclick: () => { activeTab = "account"; render(); } }, t("Zum Kommentieren anmelden", "Yorum için giriş yap")));
  return el("article", { class: "card" },
    el("h3", {}, item.title),
    el("div", { class: "meta" }, `${item.kiez} · ${item.author} · ${when(item.created_at)}`),
    item.text ? el("p", {}, item.text) : null,
    item.media_key && item.media_type === "image" ? el("img", { src: `/media/${item.media_key}`, alt: "", loading: "lazy" }) : null,
    actions, slot, ...thread);
}

function postForm() {
  const title = el("input", { maxLength: 120 });
  const kiez = el("input", { maxLength: 60 });
  const category = el("select", {}, ...POST_CATEGORIES.map((c) => el("option", { value: c }, c)));
  const text = el("textarea", { maxLength: 1000 });
  const file = el("input", { type: "file", accept: "image/jpeg,image/png,image/webp" });
  const send = el("button", { class: "btn primary" }, t("Beitrag senden", "Gönderiyi yolla"));
  send.addEventListener("click", async () => {
    const form = new FormData();
    form.set("title", title.value);
    form.set("kiez", kiez.value);
    form.set("category", category.value);
    form.set("description", text.value);
    if (file.files[0]) form.set("file", file.files[0]);
    send.disabled = true;
    try {
      const { status } = await api("/api/reporter", { method: "POST", body: form });
      toast(sentText(status));
      renderFeed();
    } catch (e) {
      showError(e);
      send.disabled = false;
    }
  });
  return el("section", { class: "card" },
    el("h3", {}, t("Neuer Beitrag", "Yeni gönderi")),
    el("label", {}, t("Titel", "Başlık")), title,
    el("label", {}, "Kiez"), kiez,
    el("label", {}, t("Kategorie", "Kategori")), category,
    el("label", {}, t("Text", "Metin")), text,
    el("label", {}, t("Bild (optional, max. 5 MB)", "Görsel (isteğe bağlı, en fazla 5 MB)")), file,
    el("div", { class: "actions" }, send));
}

async function renderFeed() {
  try {
    const { feed } = await api("/api/community");
    view.replaceChildren(
      ...(user ? [postForm()] : []),
      ...feed.map(feedCard),
      ...(feed.length ? [] : [el("p", { class: "note" }, t("Noch keine Beiträge.", "Henüz gönderi yok."))]));
  } catch (e) {
    view.replaceChildren(el("p", { class: "note" }, t("Beiträge sind gerade nicht erreichbar.", "Gönderilere şu an ulaşılamıyor.")));
  }
}

function classifiedForm() {
  const title = el("input", { maxLength: 120 });
  const category = el("select", {}, ...CLASSIFIED_CATEGORIES.map((c) => el("option", { value: c }, c)));
  const kiez = el("input", { maxLength: 60 });
  const price = el("input", { maxLength: 40 });
  const text = el("textarea", { maxLength: 800 });
  const contact = el("input", { maxLength: 120 });
  // 2026-11-22 (owner): up to 5 pictures + 1 video per ad
  const files = el("input", { type: "file", accept: "image/jpeg,image/png,image/webp,video/mp4,video/webm", multiple: true });
  const fileInfo = el("div", { class: "note" }, t("Bis zu 5 Bilder (je 5 MB) + 1 Video (50 MB).", "En fazla 5 resim (her biri 5 MB) + 1 video (50 MB)."));
  const thumbs = el("div", { class: "mk-cl-thumbs" });
  files.addEventListener("change", () => {
    const list = [...files.files];
    const img = list.filter((f) => f.type.startsWith("image/")).length;
    const vid = list.filter((f) => f.type.startsWith("video/")).length;
    thumbs.replaceChildren(...list.map((f) => f.type.startsWith("image/") ? el("img", { src: URL.createObjectURL(f), alt: "" }) : el("span", { class: "mk-cl-vid" }, "🎬")));
    if (img > 5 || vid > 1) { toast(t("Höchstens 5 Bilder und 1 Video.", "En fazla 5 resim ve 1 video.")); files.value = ""; thumbs.replaceChildren(); }
  });
  const send = el("button", { class: "btn primary" }, t("Gratis inserieren", "Ücretsiz ilan ver"));
  send.addEventListener("click", async () => {
    if (!title.value.trim() || !text.value.trim() || !contact.value.trim()) return toast(ERRORS.missing_fields);
    send.disabled = true;
    try {
      const fd = new FormData();
      Object.entries({ type: "classified", title: title.value, category: category.value, kiezName: kiez.value, price: price.value, description: text.value, contact: contact.value }).forEach(([k, v]) => fd.append(k, v));
      [...files.files].forEach((f) => fd.append("file", f));
      const res = await api("/api/submissions", { method: "POST", body: fd });
      const status = res.status;
      if (res.ownerKey) mkSaveMyAd({ id: res.id, key: res.ownerKey, title: title.value.trim(), created: Date.now() });
      toast(sentText(status));
      renderClassifieds();
    } catch (e) {
      showError(e);
      send.disabled = false;
    }
  });
  return el("section", { class: "card promo" },
    el("h3", {}, t("7 Tage kostenlos inserieren", "7 gün ücretsiz ilan ver")),
    el("p", { class: "note" }, t("Mit Bildern oder Video. Die Anzeige erscheint nach der Prüfung und läuft 7 Tage kostenlos – danach verlängern: 1 Woche 5 €, 1 Monat 10 €.", "Resim veya videoyla. İlan kontrolden sonra yayınlanır ve 7 gün ücretsiz kalır – sonra uzat: 1 hafta 5 €, 1 ay 10 €.")),
    el("label", {}, t("Titel", "Başlık")), title,
    el("label", {}, t("Kategorie", "Kategori")), category,
    el("label", {}, "Kiez"), kiez,
    el("label", {}, t("Preis (optional)", "Fiyat (isteğe bağlı)")), price,
    el("label", {}, t("Text", "Metin")), text,
    el("label", {}, t("Kontakt (wird öffentlich angezeigt)", "İletişim (herkese açık görünür)")), contact,
    el("label", {}, t("Bilder / Video", "Resimler / video")), files, fileInfo, thumbs,
    el("div", { class: "actions" }, send));
}

async function renderClassifieds() {
  let cards = [];
  try {
    const { items } = await api("/api/submissions");
    cards = items.filter((i) => i.type === "classified").map((i) => el("article", { class: "card", id: "ilan-" + i.id }, // 2026-11-27: link #ilan-<id>
      el("h3", {}, i.title),
      el("div", { class: "meta" }, [i.category, i.kiezName, i.price, when(i.createdAt)].filter(Boolean).join(" · ")),
      mkClassifiedMedia(i.media),
      el("p", {}, i.description),
      el("div", { class: "note" }, `${t("Kontakt", "İletişim")}: ${i.contact}`)));
  } catch (e) {
    toast(t("Anzeigen sind gerade nicht erreichbar.", "İlanlara şu an ulaşılamıyor."));
  }
  view.replaceChildren(classifiedForm(), ...cards);
  // 2026-11-27 (owner): #ilan-<id> (from the home strip) scrolls to that ad and marks it
  const hit = /^#ilan-(.+)$/.exec(location.hash);
  const card = hit && document.getElementById("ilan-" + decodeURIComponent(hit[1]));
  if (card) { card.style.outline = "3px solid #25D366"; card.scrollIntoView({ behavior: "smooth", block: "start" }); }
}

function renderAccount() {
  if (user) {
    const password = el("input", { type: "password", autocomplete: "current-password" });
    view.replaceChildren(el("section", { class: "card" },
      el("h3", {}, user.displayName),
      el("p", { class: "note" }, user.trusted
        ? t("Vertrauenswürdig: Deine Beiträge erscheinen sofort.", "Güvenilir üye: Gönderilerin hemen yayınlanır.")
        : t("Deine Beiträge werden vor der Veröffentlichung geprüft.", "Gönderilerin yayından önce kontrol edilir.")),
      el("div", { class: "actions" }, el("button", { class: "btn", onclick: logout }, t("Abmelden", "Çıkış yap")))),
    el("section", { class: "card" },
      el("h3", {}, t("Konto löschen", "Hesabı sil")),
      el("label", {}, t("Passwort zur Bestätigung", "Onay için şifre")), password,
      el("div", { class: "actions" }, el("button", { class: "btn", onclick: () => deleteAccount(password.value) }, t("Konto endgültig löschen", "Hesabı kalıcı olarak sil")))));
    return;
  }

  const email = el("input", { type: "email", autocomplete: "email", maxLength: 160 });
  const password = el("input", { type: "password", autocomplete: "current-password" });
  const name = el("input", { maxLength: 40 });
  const accept = el("input", { type: "checkbox" });
  const rules = el("a", { href: "/story-regeln.html" }, t("Regeln", "kuralları"));
  const privacy = el("a", { href: "/datenschutz.html" }, t("Datenschutz", "gizlilik metnini"));
  const submit = async (action) => {
    try {
      const data = await postJson("/api/auth", { action, email: email.value, password: password.value, displayName: name.value, accept: accept.checked });
      localStorage.setItem(TOKEN_KEY, data.token);
      user = data.user;
      activeTab = "feed";
      render();
    } catch (e) { showError(e); }
  };
  view.replaceChildren(el("section", { class: "card" },
    el("h3", {}, t("Anmelden", "Giriş yap")),
    el("label", {}, "E-Mail"), email,
    el("label", {}, t("Passwort", "Şifre")), password,
    el("div", { class: "actions" }, el("button", { class: "btn primary", onclick: () => submit("login") }, t("Anmelden", "Giriş yap")))),
  el("section", { class: "card" },
    el("h3", {}, t("Neu hier?", "Yeni misin?")),
    el("p", { class: "note" }, t("Nutze E-Mail und Passwort von oben und wähle einen Anzeigenamen.", "Yukarıdaki e-posta ve şifreyi kullan, bir görünen ad seç.")),
    el("label", {}, t("Anzeigename", "Görünen ad")), name,
    el("label", { class: "check" }, accept, el("span", {}, t("Ich akzeptiere die ", "Şunları kabul ediyorum: "), rules, " · ", privacy)),
    el("div", { class: "actions" }, el("button", { class: "btn primary", onclick: () => submit("register") }, t("Konto erstellen", "Hesap oluştur")))));
}

async function logout() {
  await postJson("/api/auth", { action: "logout" }).catch(() => {});
  localStorage.removeItem(TOKEN_KEY);
  user = null;
  render();
}

async function deleteAccount(password) {
  try {
    await postJson("/api/auth", { action: "delete", password });
    localStorage.removeItem(TOKEN_KEY);
    user = null;
    toast(t("Konto gelöscht.", "Hesap silindi."));
    render();
  } catch (e) { showError(e); }
}

function render() {
  renderTabs();
  if (activeTab === "feed") renderFeed();
  else if (activeTab === "classifieds") renderClassifieds();
  else renderAccount();
}

window.addEventListener("hashchange", () => {
  if (/^#ilan/.test(location.hash)) { // 2026-11-27: also #ilan-<id>
    activeTab = "classifieds";
    render();
  }
});

(async function start() {
  if (localStorage.getItem(TOKEN_KEY)) {
    user = await api("/api/auth").then((r) => r.user).catch(() => null);
    if (!user) localStorage.removeItem(TOKEN_KEY);
  }
  render();
})();


/* ---------- 2026-11-22 (owner): pictures in classifieds + "extend after 3 days" (5 €/week, 10 €/month) ---------- */
const MY_ADS_KEY = "mykiez_my_classifieds_v1";
function mkMyAds() { try { return JSON.parse(localStorage.getItem(MY_ADS_KEY) || "[]"); } catch (e) { return []; } }
function mkSaveMyAd(ad) { const list = mkMyAds().filter((a) => a.id !== ad.id); list.push(ad); localStorage.setItem(MY_ADS_KEY, JSON.stringify(list.slice(-20))); }

function mkClassifiedMedia(media) {
  if (!Array.isArray(media) || !media.length) return null;
  const box = el("div", { class: "mk-cl-media" });
  media.slice(0, 6).forEach((m) => {
    const url = String(m.url || "");
    if (!/^\/media\/classifieds\//.test(url)) return;
    box.append(m.type === "video" ? el("video", { src: url, controls: true, preload: "metadata", playsInline: true }) : el("img", { src: url, alt: "", loading: "lazy", onclick: () => window.open(url, "_blank") }));
  });
  return box;
}

async function mkCheckMyAds() {
  const params2 = new URLSearchParams(location.search);
  if (params2.get("paid")) toast(t("Danke! Deine Anzeige wurde verlängert.", "Teşekkürler! İlanın uzatıldı."));
  for (const ad of mkMyAds()) {
    if (Date.now() - ad.created < 3 * 86400000 - 60000) continue;
    let st;
    try { st = await api(`/api/classified-extend?id=${encodeURIComponent(ad.id)}&key=${encodeURIComponent(ad.key)}`); } catch (e) { continue; }
    if (!st.expired) continue;
    const seenKey = `mk_cl_asked_${ad.id}`;
    if (localStorage.getItem(seenKey) && Date.now() - Number(localStorage.getItem(seenKey)) < 86400000) continue;
    localStorage.setItem(seenKey, String(Date.now()));
    mkExtendPopup(ad, st.title || ad.title);
    break;
  }
}

function mkExtendPopup(ad, title) {
  const close = () => wrap.remove();
  const buy = async (plan) => {
    try {
      const res = await fetch("/api/classified-extend", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: ad.id, key: ad.key, plan }) });
      const j = await res.json().catch(() => ({}));
      if (j.url) { location.href = j.url; return; }
      if (j.requested) { close(); toast(t("Danke! Wir melden uns wegen der Zahlung und verlängern deine Anzeige.", "Teşekkürler! Ödeme için sana döneceğiz ve ilanını uzatacağız.")); return; }
      toast(t("Das hat nicht geklappt. Bitte später nochmal.", "Olmadı. Lütfen sonra tekrar dene."));
    } catch (e) { toast(t("Keine Verbindung.", "Bağlantı yok.")); }
  };
  const wrap = el("div", { class: "mk-cl-pop", role: "dialog", "aria-modal": "true", onclick: (ev) => { if (ev.target === wrap) close(); } },
    el("div", { class: "mk-cl-card" },
      el("button", { class: "mk-cl-x", type: "button", "aria-label": t("Schließen", "Kapat"), onclick: close }, "✕"),
      el("div", { class: "mk-cl-ic" }, "📢"),
      el("h3", {}, t("Deine Anzeige ist abgelaufen", "İlanının süresi doldu")),
      el("p", {}, `„${title}“ – ` + t("Soll sie weiter online bleiben?", "Yayında kalmaya devam etsin mi?")),
      el("button", { class: "btn primary mk-cl-buy", type: "button", onclick: () => buy("week") }, t("1 Woche – 5 €", "1 hafta – 5 €")),
      el("button", { class: "btn primary mk-cl-buy mk-cl-best", type: "button", onclick: () => buy("month") }, t("1 Monat – 10 € (günstiger)", "1 ay – 10 € (daha avantajlı)")),
      el("button", { class: "btn", type: "button", onclick: close }, t("Nein, danke", "Hayır, teşekkürler"))));
  document.body.append(wrap);
}

(() => {
  const css = document.createElement("style");
  css.textContent =
    ".mk-cl-thumbs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.mk-cl-thumbs img,.mk-cl-vid{width:56px;height:56px;border-radius:8px;object-fit:cover;display:flex;align-items:center;justify-content:center;background:#eee;font-size:24px}" +
    ".mk-cl-media{display:flex;gap:6px;overflow-x:auto;margin:8px 0}.mk-cl-media img,.mk-cl-media video{height:150px;max-width:240px;border-radius:10px;object-fit:cover;flex:none;cursor:pointer;background:#000}" +
    ".mk-cl-pop{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".mk-cl-card{position:relative;width:100%;max-width:380px;background:#fff;color:#0F172A;border-radius:18px;padding:22px 18px;display:flex;flex-direction:column;gap:10px;text-align:center}" +
    ".mk-cl-card h3{margin:0}.mk-cl-card p{margin:0}.mk-cl-ic{font-size:40px}.mk-cl-x{position:absolute;top:6px;right:8px;background:none;border:0;font-size:20px;cursor:pointer}" +
    ".mk-cl-buy{font-size:16px;padding:12px}.mk-cl-best{background:#E30A17!important;color:#fff!important}";
  document.head.append(css);
  setTimeout(mkCheckMyAds, 1500);
})();
