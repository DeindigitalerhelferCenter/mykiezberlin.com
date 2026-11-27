# 2026-11-27 (owner "UYGULA tüm sponsorlar"): data for the 2 promo cards (partner + follow) of EVERY sponsor.
# python tools/sponsor-promo/build.py <ads.json from /api/ads?place=page> <outDir>
# - logo: own file, else the /media logo on the site, else a round monogram (initials)
# - photo: cover picture; colours (background + accent) taken from the logo / cover
# - missing address -> Kiez, missing Instagram -> WhatsApp / phone / website (whatever exists)
# writes cards.json (for render.cjs), one <id>-metinler.txt per sponsor and EKSIKLER.txt (what is missing where)
import colorsys, glob, json, os, re, sys
from PIL import Image

ads_file, out = sys.argv[1], sys.argv[2]
PUB = "C:/Users/mckin/mykiezberlin.com/public"
SITE = "https://mykiezberlin.com"
A = json.load(open(ads_file, encoding="utf-8"))["ads"]


def src(u):
    """file:// URL for local assets, https for /media, "" when nothing."""
    u = (u or "").split("?")[0]
    if not u:
        return "", None
    rel = u if u.startswith("/") else "/" + u
    if rel.startswith("/assets/"):
        p = PUB + rel
        return ("file:///" + p, p) if os.path.exists(p) else ("", None)
    if rel.startswith("/media/"):
        return SITE + rel, None
    if u.startswith("https://"):
        return u, None
    return "", None


def colours(path):
    """(bg, accent) from a picture: dark background from the average colour, accent = strongest colour."""
    if not path:
        return "#14100c", "#d4a24c"
    try:
        im = Image.open(path).convert("RGB").resize((60, 60))
    except Exception:
        return "#14100c", "#d4a24c"
    px = list(im.getdata())
    r = sum(p[0] for p in px) / len(px); g = sum(p[1] for p in px) / len(px); b = sum(p[2] for p in px) / len(px)
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    bg = colorsys.hls_to_rgb(h, 0.07, min(s, 0.45))
    best, score = None, -1
    for p in px:
        hh, ll, ss = colorsys.rgb_to_hls(p[0] / 255, p[1] / 255, p[2] / 255)
        sc = ss * (1 - abs(ll - 0.5) * 2)
        if sc > score:
            best, score = (hh, ll, ss), sc
    if score < 0.18:
        acc = (37, 211, 102) if False else (212, 162, 76)  # grey pictures -> gold
        acc = tuple(c / 255 for c in acc)
    else:
        acc = colorsys.hls_to_rgb(best[0], 0.55, max(best[2], 0.6))
    hx = lambda c: "#%02x%02x%02x" % tuple(int(max(0, min(1, x)) * 255) for x in c)
    return hx(bg), hx(acc)


def cut(t, n):
    t = re.sub(r"\s+", " ", str(t or "")).strip()
    if len(t) <= n:
        return t
    t = t[:n].rsplit(" ", 1)[0].rstrip(",;:–-")
    return t + " …"


def mono(name):
    w = [x for x in re.split(r"[\s·&–-]+", name) if x and x[0].isalpha()]
    return ("".join(x[0] for x in w[:2]) or name[:2]).upper()


def h1(name):
    n = len(name)
    return 104 if n <= 18 else 88 if n <= 26 else 76 if n <= 34 else 64


cards, missing = [], []
mk = "file:///" + PUB + "/assets/images/mykiez_logo.png"
for a in A:
    sid, name = a["id"], a["name"]
    logo_u, logo_p = src(a.get("logo"))
    cover_u, cover_p = src(a.get("image"))
    miss = []
    if not logo_u:
        miss.append("Logo yok → baş harf logosu")
    # photo: first real gallery picture (covers are text banners and look cut in 9:16) -> else big logo on colour
    gal = sorted(g for g in glob.glob(PUB + f"/assets/sponsors/gallery/{sid}-*") if re.search(r"\.(webp|jpe?g|png)$", g) and "carousel" not in g)         or sorted(glob.glob(PUB + f"/assets/sponsors/gallery/{sid}-carousel-*.webp"))
    img_p = gal[0] if gal else None
    img_u = "file:///" + img_p.replace(chr(92), "/") if img_p else ""
    if not img_u:
        miss.append("Galeri fotoğrafı yok → renkli zemin + büyük logo")
    bg, acc = colours(logo_p or img_p or cover_p)
    cat = a.get("category") or {}
    kicker = (cat.get("de") if isinstance(cat, dict) else str(cat)) or "Ihr Betrieb im Kiez"
    addr = a.get("address") or ""
    if not addr:
        miss.append("Adres yok → mahalle adı")
        addr = (a.get("kieze") or "Berlin").split(",")[0]
    ig = a.get("link_ig") or ""
    handle = ("@" + ig.rstrip("/").split("/")[-1]) if ig else ""
    wa = re.sub(r"[^\d+]", "", a.get("link_wa") or "")
    tel = a.get("link_tel") or ""
    web = re.sub(r"^https?://(www\.)?", "", (a.get("link_web") or "")).rstrip("/")
    if "maps.app.goo.gl" in web or "pages.dev" in web:
        web_show = ""
    else:
        web_show = web
    if handle:
        own = {"i": "📸", "c": "#C13584", "t": handle, "s": "Instagram"}
    elif wa:
        own = {"i": "💬", "c": "#25D366", "t": "WhatsApp " + tel if tel else wa, "s": name[:30]}
        miss.append("Instagram yok → WhatsApp satırı")
    elif tel:
        own = {"i": "☎️", "c": "#0ea5e9", "t": tel, "s": name[:30]}
        miss.append("Instagram/WhatsApp yok → telefon satırı")
    elif web_show:
        own = {"i": "🌐", "c": "#1f6feb", "t": web_show[:28], "s": name[:30]}
        miss.append("Instagram/WhatsApp/telefon yok → web satırı")
    else:
        own = None
        miss.append("Kendi iletişim bilgisi yok → sadece My Kiez satırları")
    if not (a.get("headline_tr") or "").strip():
        miss.append("Türkçe metin yok")
    rows = [{"i": "📲", "c": "#E30613", "t": "App My Kiez Berlin", "s": "kostenlos · ücretsiz"},
            {"i": "💬", "c": "#25D366", "t": "WhatsApp-Kanal", "s": "Berlin-News DE/TR jeden Tag"}]
    if own:
        rows.append(own)
    rows.append({"i": "🌐", "c": "#1f6feb", "t": "mykiezberlin.com", "s": "News · Angebote · fırsatlar"})
    page = f"{SITE}/s/{sid}"
    base = {"name": name, "logo": logo_u, "mono": mono(name), "mk": mk, "accent": acc, "bg": bg, "h1": h1(name)}
    cards.append(dict(base, type="partner", file=f"{sid}/{sid}-1-partner", img=img_u, kicker=cut(kicker, 34),
                      sub=cut(a.get("headline_de"), 150), subTr=cut(a.get("headline_tr"), 120), addr=cut(addr, 60),
                      footDe="Jetzt auch auf My Kiez Berlin",
                      footTr="Bizi My Kiez Berlin'de de bulabilirsiniz – Berlin haberleri, fırsatlar ve mahalle ipuçları",
                      qrLabel=f"mykiezberlin.com/s/{sid}", qr=page))
    cards.append(dict(base, type="follow", file=f"{sid}/{sid}-2-folgt-uns", img=img_u, sub=cut(kicker + " · " + addr.split(",")[-1].strip(), 60),
                      followDe="Folgt uns auch hier!", followTr="Bizi buradan da takip edebilirsiniz!", rows=rows,
                      qrLabel="Scannen · Tara", qr=f"{SITE}/davet"))
    os.makedirs(os.path.join(out, sid), exist_ok=True)
    own_line_de = f" · 📸 {handle}" if handle else (f" · 💬 WhatsApp {tel}" if wa else (f" · ☎️ {tel}" if tel else ""))
    txt = f"""{name} – Story / Status metinleri (kartla birlikte paylaşılır)

=== Kart 1 – Kiez-Partner ({sid}-1-partner.png) ===
👉 {page}
{name} ist jetzt Partner von My Kiez Berlin!
{cut(a.get('headline_de'), 200)}
Alle Infos, Angebote & Kiez-News: {page}

{name} artık My Kiez Berlin'in mahalle ortağı!
{cut(a.get('headline_tr'), 200)}
Tüm bilgiler, fırsatlar ve mahalle haberleri: {page}

#berlin #mykiezberlin #kiez

=== Kart 2 – Folgt uns auch hier ({sid}-2-folgt-uns.png) ===
👉 {SITE}/davet
Folgt uns auch hier! 📲 App My Kiez Berlin · 💬 WhatsApp-Kanal{own_line_de}
Berlin-News auf Deutsch & Türkisch, Angebote aus dem Kiez – kostenlos.

Bizi buradan da takip edebilirsiniz! 📲 My Kiez Berlin uygulaması · 💬 WhatsApp kanalı{own_line_de}
Almanca ve Türkçe Berlin haberleri, mahalleden fırsatlar – ücretsiz.

Not: WhatsApp Status'ta link sadece metnin başındaysa tıklanabilir (👉 satırı). Instagram'da link tıklanmaz → "Link in Bio" veya link çıkartması.
"""
    open(os.path.join(out, sid, f"{sid}-metinler.txt"), "w", encoding="utf-8").write(txt)
    if miss:
        missing.append(f"{name} ({sid}): " + "; ".join(miss))

json.dump(cards, open(os.path.join(out, "cards.json"), "w", encoding="utf-8"), ensure_ascii=False)
open(os.path.join(out, "EKSIKLER.txt"), "w", encoding="utf-8").write(
    "Eksik bilgiler ve kartta nasıl çözüldü\n\n" + ("\n".join(missing) if missing else "Eksik yok") + "\n")
print(len(A), "sponsors,", len(cards), "cards,", len(missing), "with gaps")
