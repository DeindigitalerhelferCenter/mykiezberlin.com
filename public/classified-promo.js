/**
 * Invites visitors to place a free three-day classified ad.
 * Shown at most once a week so it does not get in the way.
 */
(function () {
  const STORAGE_KEY = "mykiez_classified_promo_v1";
  const DELAY_MS = 45000;
  const REPEAT_MS = 7 * 86400000;

  const lastShown = Number(localStorage.getItem(STORAGE_KEY) || 0);
  if (Date.now() - lastShown < REPEAT_MS) return;

  function show() {
    if (document.querySelector(".modal-backdrop.active, .modal.active, #goal-overlay")) return;
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    const turkish = typeof currentLanguage !== "undefined" && currentLanguage === "tr";
    const text = turkish
      ? { title: "Şu an 3 günlük bedava ilan vermek ister misiniz?", yes: "Ücretsiz ilan ver", no: "Şimdi değil", lang: "tr" }
      : { title: "Möchten Sie jetzt 3 Tage kostenlos inserieren?", yes: "Gratis inserieren", no: "Nicht jetzt", lang: "de" };
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;left:12px;right:12px;bottom:90px;z-index:1500;max-width:420px;margin:0 auto;padding:16px;border-radius:16px;background:#fff;color:#111;box-shadow:0 10px 30px rgba(0,0,0,.3);font-family:inherit";
    const title = document.createElement("div");
    title.textContent = text.title;
    title.style.cssText = "font-weight:800;font-size:15px;margin-bottom:12px";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px";
    const yes = document.createElement("a");
    yes.textContent = text.yes;
    yes.href = `/community/?lang=${text.lang}#ilan`;
    yes.style.cssText = "flex:1;text-align:center;padding:10px;border-radius:10px;background:#E30613;color:#fff;font-weight:800;text-decoration:none";
    const no = document.createElement("button");
    no.textContent = text.no;
    no.style.cssText = "padding:10px 14px;border-radius:10px;border:1px solid #ccc;background:#fff;color:#111;font-weight:700";
    no.onclick = () => box.remove();
    row.append(yes, no);
    box.append(title, row);
    document.body.appendChild(box);
  }

  setTimeout(show, DELAY_MS);
})();
