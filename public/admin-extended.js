/**
 * Admin moderation for shared content.
 * Adds a server-backed section to the existing panel.
 */

const ADMIN_TOKEN_KEY = "mykiez_admin_token_v1";
let moderationTab = "pending";

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
  const payload = item.payload || {};
  const title = item.headline || item.title || payload.name || payload.title || payload.packageName || item.text;
  const text = item.subtext || item.description || payload.description || payload.email || "";
  const image = item.media_key ? `<img src="/media/${adminEsc(item.media_key)}" alt="" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px;">` : "";
  const id = adminEsc(item.id);
  return `
    <div style="padding: 12px; margin-bottom: 10px; border: 1px solid #30363d; border-radius: 10px; background: #161b22; color: #fff;">
      <div style="display: flex; gap: 10px;">
        ${image}
        <div>
          <div style="font-weight: 800;">${adminEsc(title)}</div>
          <div style="font-size: 12px; color: #8b949e;">${adminEsc(text)}</div>
          <div style="font-size: 11px; color: #8b949e; margin-top: 4px;">${adminEsc(item.type || type)} · ${adminEsc(item.kiez || payload.kiezName || payload.kiez || "")} · ${adminEsc(item.status)}</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 10px;">
        ${item.status !== "approved" ? `<button class="chip-btn active" onclick="moderate('${type}', '${id}', 'approve')">Onayla</button>` : ""}
        ${item.status === "pending" ? `<button class="chip-btn" onclick="moderate('${type}', '${id}', 'reject')">Reddet</button>` : ""}
        ${type === "story" ? `<button class="chip-btn" onclick="moderate('story', '${id}', 'extend')">+48 Saat</button><button class="chip-btn" onclick="editStory('${id}')">Düzenle</button>` : ""}
        ${type === "story" || type === "post" ? `<button class="chip-btn" onclick="editorialComment('${type}', '${id}')">Redaktion yorumu</button>` : ""}
        ${item.user_id ? `<button class="chip-btn" onclick="trustUser('${adminEsc(item.user_id)}', true)">Güvenilir yap</button>` : ""}
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
    const { stories, posts, comments, submissions, users = [] } = await res.json();
    const all = [
      ...stories.map((i) => ["story", i]), ...posts.map((i) => ["post", i]),
      ...comments.map((i) => ["comment", i]), ...submissions.map((i) => ["submission", i]),
    ];
    const tabs = ["pending", "approved", "expired", "rejected"];
    const labels = { pending: "Bekleyen", approved: "Yayında", expired: "Süresi doldu", rejected: "Reddedilen" };
    const shown = all.filter(([, i]) => i.status === moderationTab);
    box.innerHTML = `
      <h2 style="font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 12px;">Kullanıcı Gönderileri (Sunucu)</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
        ${tabs.map((t) => `<button class="chip-btn ${t === moderationTab ? "active" : ""}" onclick="setModerationTab('${t}')">${labels[t]} (${all.filter(([, i]) => i.status === t).length})</button>`).join("")}
        <button class="chip-btn" onclick="createServerStory()">+ Admin Story</button>
      </div>
      ${shown.map(([type, item]) => moderationCard(type, item)).join("")}
      ${shown.length ? "" : `<p style="font-size: 12px; color: #8b949e;">Burada gönderi yok.</p>`}
      <h2 style="font-size: 17px; font-weight: 800; color: #fff; margin: 18px 0 12px;">Üyeler (${users.length})</h2>
      ${users.map((u) => `<div style="display: flex; justify-content: space-between; gap: 8px; padding: 8px 0; color: #fff; font-size: 12px;"><span>${adminEsc(u.display_name)} · ${adminEsc(u.email)}${u.trusted ? " · güvenilir" : ""}</span><button class="chip-btn" onclick="trustUser('${adminEsc(u.id)}', ${u.trusted ? "false" : "true"})">${u.trusted ? "Güveni kaldır" : "Güvenilir yap"}</button></div>`).join("")}`;
  } catch (e) {
    box.innerHTML = `<p style="font-size: 12px; color: #8b949e;">Sunucu moderasyonuna ulaşılamıyor.</p>`;
  }
}

async function moderate(type, id, action) {
  await adminRequest("POST", { type, id, action });
  loadModerationQueue();
}

async function editorialComment(target, targetId) {
  const text = prompt('"Kiez-Redaktion" etiketiyle yayınlanacak yorum:');
  if (!text) return;
  await adminRequest("POST", { action: "editorialComment", target, targetId, text });
  loadModerationQueue();
}

async function trustUser(userId, trusted) {
  await adminRequest("POST", { action: "trustUser", userId, trusted });
  loadModerationQueue();
}

function setModerationTab(tab) {
  moderationTab = tab;
  loadModerationQueue();
}

async function editStory(id) {
  const headline = prompt("Yeni başlık:");
  if (!headline) return;
  const subtext = prompt("Yeni açıklama:") || "";
  await adminRequest("POST", { type: "story", id, action: "edit", headline, subtext });
  loadModerationQueue();
}

async function createServerStory() {
  const headline = prompt("Story başlığı:");
  if (!headline) return;
  const subtext = prompt("Açıklama:") || "";
  const kiez = prompt("Kiez:") || "Ganz Berlin";
  const durationHours = Number(prompt("Süre (saat):", "48")) || 48;
  await adminRequest("POST", { action: "createStory", headline, subtext, kiez, durationHours });
  loadModerationQueue();
}
