/**
 * Admin moderation for shared content.
 * Adds a server-backed section to the existing panel.
 */

const ADMIN_TOKEN_KEY = "mykiez_admin_token_v1";

function adminEsc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const baseAttemptLogin = attemptLogin;
attemptLogin = function () {
  const input = document.getElementById("admin-pwd-input");
  if (input) sessionStorage.setItem(ADMIN_TOKEN_KEY, input.value.trim());
  baseAttemptLogin();
};

const baseRenderAdminDashboard = renderAdminDashboard;
renderAdminDashboard = function () {
  baseRenderAdminDashboard();
  loadModerationQueue();
};

async function adminRequest(method, body) {
  return fetch("/api/admin", {
    method,
    headers: { "content-type": "application/json", "x-admin-token": sessionStorage.getItem(ADMIN_TOKEN_KEY) || "" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function moderationCard(type, item) {
  const title = type === "story" ? item.headline : item.title;
  const text = type === "story" ? item.subtext : item.description;
  const image = item.media_key ? `<img src="/media/${adminEsc(item.media_key)}" alt="" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px;">` : "";
  const id = adminEsc(item.id);
  return `
    <div style="padding: 12px; margin-bottom: 10px; border: 1px solid #30363d; border-radius: 10px; background: #161b22; color: #fff;">
      <div style="display: flex; gap: 10px;">
        ${image}
        <div>
          <div style="font-weight: 800;">${adminEsc(title)}</div>
          <div style="font-size: 12px; color: #8b949e;">${adminEsc(text)}</div>
          <div style="font-size: 11px; color: #8b949e; margin-top: 4px;">📍 ${adminEsc(item.kiez)} · ${adminEsc(item.status)}</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 10px;">
        ${item.status !== "approved" ? `<button class="chip-btn active" onclick="moderate('${type}', '${id}', 'approve')">Onayla</button>` : ""}
        ${item.status === "pending" ? `<button class="chip-btn" onclick="moderate('${type}', '${id}', 'reject')">Reddet</button>` : ""}
        <button class="chip-btn" onclick="moderate('${type}', '${id}', 'delete')">Sil</button>
      </div>
    </div>`;
}

async function loadModerationQueue() {
  const host = document.querySelector("main") || document.body;
  document.getElementById("admin-moderation")?.remove();
  const box = document.createElement("section");
  box.id = "admin-moderation";
  box.style.marginTop = "22px";
  host.appendChild(box);

  try {
    const res = await adminRequest("GET");
    if (res.status === 503) {
      box.innerHTML = `<p style="font-size: 12px; color: #8b949e;">Sunucu moderasyonu kapalı: D1 bağlantısı (DB) henüz ayarlanmamış.</p>`;
      return;
    }
    if (res.status === 401) {
      box.innerHTML = `<p style="font-size: 12px; color: #8b949e;">Sunucu moderasyonu için çıkış yapıp tekrar giriş yapın.</p>`;
      return;
    }
    if (!res.ok) throw new Error(String(res.status));
    const { stories, posts } = await res.json();
    box.innerHTML = `
      <h2 style="font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 12px;">Kullanıcı Gönderileri (Sunucu)</h2>
      ${stories.map((s) => moderationCard("story", s)).join("")}
      ${posts.map((p) => moderationCard("post", p)).join("")}
      ${stories.length || posts.length ? "" : `<p style="font-size: 12px; color: #8b949e;">Bekleyen gönderi yok.</p>`}`;
  } catch (e) {
    box.innerHTML = `<p style="font-size: 12px; color: #8b949e;">Sunucu moderasyonuna ulaşılamıyor.</p>`;
  }
}

async function moderate(type, id, action) {
  await adminRequest("POST", { type, id, action });
  loadModerationQueue();
}
