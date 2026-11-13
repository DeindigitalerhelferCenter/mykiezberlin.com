package com.example.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.AppLanguage
import com.example.data.model.BerlinTip
import com.example.data.model.EmergencyContact
import com.example.data.model.KiezStory
import okhttp3.MultipartBody

/*
 * My Kiez Berlin – additions 2026-11-14 (owner), same as kiez-plus.js on the web:
 *  - Notruf: more real numbers + "Ihre Sicherheit" / "Saisonale Informationen" of the Berliner Feuerwehr
 *  - Berlin Telefonbuch / İş rehberi: search in the real directories (opens their pages, nothing is stored)
 *  - Berlin-Tipps: detail window instead of opening Google Maps directly
 *  - Story offers ("Ayran 0,99 € statt 1,50 €"): written in the story form, shown under "Özel Mahalle İndirimleri"
 */

private val PlusRed = Color(0xFFE30613)
private val PlusGold = Color(0xFFF2B705)

private fun t(language: AppLanguage, de: String, tr: String) = if (language == AppLanguage.TURKISH) tr else de

// ---------------- story offer ----------------

/** Offer typed into the story form; the upload adds it to the request and clears it afterwards. */
object StoryDealDraft {
    var what by mutableStateOf("")
    var price by mutableStateOf("")
    var old by mutableStateOf("")
    fun addTo(builder: MultipartBody.Builder) {
        if (what.isNotBlank() && price.isNotBlank()) {
            builder.addFormDataPart("deal_what", what.trim().take(80))
            builder.addFormDataPart("deal_price", price.trim().take(30))
            builder.addFormDataPart("deal_old", old.trim().take(30))
        }
        clear()
    }
    fun clear() { what = ""; price = ""; old = "" }
}

data class StoryDeal(val what: String, val price: String, val old: String)

/** "deal" of /api/stories (null when the story has no offer). */
fun parseStoryDeal(o: org.json.JSONObject?): StoryDeal? {
    if (o == null) return null
    val what = o.optString("what", "")
    val price = o.optString("price", "")
    return if (what.isNotBlank() && price.isNotBlank()) StoryDeal(what, price, o.optString("old", "")) else null
}

@Composable
fun StoryDealFields(language: AppLanguage) {
    var open by remember { mutableStateOf(StoryDealDraft.what.isNotBlank()) }
    Column(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(PlusGold.copy(alpha = 0.12f)).padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Row(Modifier.fillMaxWidth().clickable { open = !open }, verticalAlignment = Alignment.CenterVertically) {
            Text("🏷️ " + t(language, "Angebot / Rabatt (optional)", "İndirim / kampanya (isteğe bağlı)"), fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.weight(1f))
            Text(if (open) "▲" else "▼", fontSize = 12.sp)
        }
        if (open) {
            Text(t(language, "Wird zusätzlich unter „Exklusive Kiez-Vorteile“ gezeigt, solange die Story läuft.", "Story yayında olduğu sürece „Özel Mahalle İndirimleri“ bölümünde de görünür."), fontSize = 11.sp)
            OutlinedTextField(StoryDealDraft.what, { StoryDealDraft.what = it.take(80) }, label = { Text(t(language, "Was? z. B. Ayran 1 L", "Ne? örn. Ayran 1 L")) }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                OutlinedTextField(StoryDealDraft.price, { StoryDealDraft.price = it.take(30) }, label = { Text(t(language, "Neuer Preis", "Yeni fiyat")) }, placeholder = { Text("0,99 €") }, singleLine = true, modifier = Modifier.weight(1f))
                OutlinedTextField(StoryDealDraft.old, { StoryDealDraft.old = it.take(30) }, label = { Text(t(language, "Alter Preis", "Eski fiyat")) }, placeholder = { Text("1,50 €") }, singleLine = true, modifier = Modifier.weight(1f))
            }
        }
    }
}

/** Offers of the running stories, for the "Özel Mahalle İndirimleri" screen. */
@Composable
fun StoryDealsSection(language: AppLanguage, stories: List<KiezStory>, onOpen: (KiezStory) -> Unit) {
    val now = System.currentTimeMillis()
    val deals = stories.filter { it.deal != null && it.status == "approved" && it.createdAtMillis + it.durationHours * 3_600_000L > now }
    Column(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text("🏷️ " + t(language, "Aktuelle Angebote aus den Kiez-Stories", "Mahalle hikâyelerindeki güncel indirimler"), fontWeight = FontWeight.Bold, fontSize = 14.sp, color = PlusRed)
        if (deals.isEmpty()) {
            Text(t(language, "Gerade keine Story-Angebote. Teile selbst eins über „Story teilen“ → „Angebot / Rabatt“.", "Şu an hikâye indirimi yok. „Hikâye paylaş“ → „İndirim / kampanya“ ile sen de paylaş."), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                items(deals, key = { it.id }) { s ->
                    val d = s.deal!!
                    Card(
                        Modifier.width(180.dp).clickable { onOpen(s) },
                        shape = RoundedCornerShape(14.dp),
                        border = androidx.compose.foundation.BorderStroke(2.dp, PlusGold),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        if (s.mediaUri != null && !s.isVideo) {
                            AsyncImage(model = s.mediaUri, contentDescription = d.what, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxWidth().height(100.dp))
                        } else {
                            Box(Modifier.fillMaxWidth().height(100.dp).background(PlusGold.copy(alpha = 0.18f)), contentAlignment = Alignment.Center) { Text("🏷️", fontSize = 36.sp) }
                        }
                        Column(Modifier.padding(10.dp)) {
                            Text(d.what, fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(d.price, fontWeight = FontWeight.Black, fontSize = 18.sp, color = PlusRed)
                                if (d.old.isNotBlank()) Text(d.old, fontSize = 12.sp, textDecoration = TextDecoration.LineThrough, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text("${s.author} · ${s.kiez}", fontSize = 10.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            }
        }
    }
}

// ---------------- Notruf ----------------

val ExtraEmergencyContacts = listOf(
    EmergencyContact("behoerde115", "Behördennummer 115", "Devlet daireleri hattı 115", "Public authorities 115", "Bürgeramt, Ordnungsamt, Termine – Auskunft aller Berliner Behörden", "Vatandaşlık dairesi, zabıta, randevular – tüm Berlin daireleri", "All Berlin public offices", "115", "service"),
    EmergencyContact("polizei-buerger", "Polizei Berlin – Bürgertelefon", "Berlin Polisi – vatandaş hattı", "Berlin Police – citizen line", "Keine Notlage? Fragen, Hinweise, Lärm", "Acil değil mi? Sorular, ihbarlar, gürültü", "No emergency? Questions, tips, noise", "030 4664 4664", "service", false),
    EmergencyContact("apotheke", "Apotheken-Notdienst", "Nöbetçi eczane", "Emergency pharmacy", "Nächste Notdienst-Apotheke (Festnetz kostenlos)", "En yakın nöbetçi eczane (sabit hattan ücretsiz)", "Nearest pharmacy on duty", "0800 00 22833", "medizin"),
    EmergencyContact("zahnarzt", "Zahnärztlicher Notdienst Berlin", "Nöbetçi diş hekimi", "Emergency dentist", "Ansage mit den diensthabenden Praxen", "Nöbetteki muayenehanelerin anonsu", "Announcement of dentists on duty", "030 89004333", "medizin", false),
    EmergencyContact("seelsorge", "Telefonseelsorge (24 h)", "Telefonla manevi destek (24 saat)", "Crisis line (24 h)", "Anonym reden, wenn es schwer wird", "Zor anlarda isimsiz konuşma", "Talk anonymously", "0800 111 0 111", "hilfe"),
    EmergencyContact("frauen116016", "Hilfetelefon Gewalt gegen Frauen", "Kadına şiddet yardım hattı", "Violence against women helpline", "24 h, kostenlos, auch auf Türkisch", "24 saat, ücretsiz, Türkçe de var", "24 h, free, also in Turkish", "116 016", "hilfe"),
    EmergencyContact("kummer", "Nummer gegen Kummer (Kinder & Jugend)", "Çocuk ve gençler için yardım hattı", "Children & youth helpline", "Kostenlos und anonym", "Ücretsiz ve isimsiz", "Free and anonymous", "116 111", "hilfe"),
    EmergencyContact("sperr", "Sperr-Notruf (Karte / Handy sperren)", "Kart / telefon kapatma hattı", "Block card / phone", "Bankkarte oder Handy verloren?", "Banka kartı veya telefon mu kayboldu?", "Lost your card or phone?", "116 116", "service"),
    EmergencyContact("strom", "Stromausfall – Stromnetz Berlin", "Elektrik arızası – Stromnetz Berlin", "Power cut – Stromnetz Berlin", "24 h Störungsdienst", "24 saat arıza servisi", "24 h fault service", "0800 211 2525", "stoerung"),
    EmergencyContact("gas", "Gasgeruch / Gasstörung – NBB", "Gaz kokusu / gaz arızası – NBB", "Gas smell – NBB", "24 h Entstörung; bei Gefahr sofort 112", "24 saat arıza; tehlikede hemen 112", "24 h; in danger call 112", "030 787272", "stoerung", false),
    EmergencyContact("wasser", "Wasserstörung – Berliner Wasserbetriebe", "Su arızası – Berliner Wasserbetriebe", "Water fault – BWB", "Rohrbruch, kein Wasser – 24 h", "Boru patlaması, su yok – 24 saat", "Burst pipe, no water – 24 h", "0800 292 7587", "stoerung"),
    EmergencyContact("licht", "Straßenlaterne kaputt", "Sokak lambası arızalı", "Street light broken", "Störung an Straßenbeleuchtung melden", "Sokak aydınlatması arızası bildir", "Report a broken street light", "0800 110 2010", "stoerung"),
)

private const val FW = "https://www.berliner-feuerwehr.de/ihre-sicherheit/"

@Composable
fun FeuerwehrSection(language: AppLanguage) {
    val context = LocalContext.current
    fun open(url: String) = runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) }
    val topics = listOf(
        Triple("🔥", t(language, "Verhalten im Brandfall", "Yangında ne yapılır"), t(language, "Raus, Tür zu, 112 rufen – nie durch Rauch gehen.", "Dışarı çık, kapıyı kapat, 112'yi ara – dumanın içinden geçme.")),
        Triple("📍", t(language, "Die richtige Nummer im richtigen Moment", "Doğru anda doğru numara"), t(language, "Wann 112, wann 116 117, wann 110?", "Ne zaman 112, ne zaman 116 117, ne zaman 110?")),
        Triple("🤟", t(language, "Notruf bei Hör- oder Sprachbeeinträchtigung", "İşitme / konuşma engelliler için acil çağrı"), t(language, "Notruf per App und Fax.", "Uygulama ve faks ile acil çağrı.")),
        Triple("🔋", t(language, "Lithium-Ionen-Akkus & Feuerlöscher", "Lityum piller & yangın söndürücü"), t(language, "Akkus sicher laden, Rauchmelder prüfen.", "Pilleri güvenli şarj et, duman dedektörünü kontrol et.")),
    )
    val seasons = listOf("☀️" to t(language, "Hitze", "Sıcak"), "🌲" to t(language, "Waldbrand", "Orman yangını"), "🍖" to t(language, "Grillen", "Mangal"), "⛈️" to t(language, "Unwetter", "Fırtına"), "🏊" to t(language, "Baderegeln", "Yüzme kuralları"), "❄️" to t(language, "Winterzeit", "Kış"), "🕯️" to t(language, "Vorweihnachtszeit", "Noel öncesi"), "🎆" to t(language, "Silvester", "Yılbaşı"))
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("🚒 " + t(language, "Berliner Feuerwehr – Ihre Sicherheit", "Berlin İtfaiyesi – Güvenliğiniz"), fontWeight = FontWeight.Bold, fontSize = 15.sp, modifier = Modifier.padding(top = 8.dp))
        topics.forEach { (icon, title, text) ->
            Card(Modifier.fillMaxWidth().clickable { open(FW) }, shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(icon, fontSize = 22.sp)
                    Column(Modifier.weight(1f)) {
                        Text(title, fontWeight = FontWeight.Bold, fontSize = 13.5.sp)
                        Text(text, fontSize = 11.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text("↗", fontSize = 14.sp)
                }
            }
        }
        Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(t(language, "Saisonale Informationen", "Mevsimlik bilgiler"), fontWeight = FontWeight.Bold, fontSize = 13.5.sp)
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    seasons.forEach { (i, s) -> AssistChip(onClick = { open(FW + "saisonale-informationen/") }, label = { Text("$i $s", fontSize = 12.sp) }) }
                }
            }
        }
    }
}

// ---------------- Berlin Telefonbuch / İş rehberi ----------------

@Composable
fun TelefonbuchSection(language: AppLanguage) {
    val context = LocalContext.current
    var what by remember { mutableStateOf("") }
    var where by remember { mutableStateOf("Berlin") }
    fun enc(s: String) = Uri.encode(s.trim())
    val books = listOf<Pair<String, (String, String) -> String>>(
        "Das Örtliche" to { w, o -> "https://www.dasoertliche.de/?kw=${enc(w)}&ci=${enc(o)}" },
        "Gelbe Seiten" to { w, o -> "https://www.gelbeseiten.de/suche/${enc(w)}/${enc(o)}" },
        "Das Telefonbuch" to { w, o -> "https://www.dastelefonbuch.de/Suche/${enc(w)}/${enc(o)}" },
        "11880" to { w, o -> "https://www.11880.com/suche/${enc(w)}/${enc(o)}" },
        "Google Maps" to { w, o -> "https://www.google.com/maps/search/${enc("$w $o")}" },
    )
    val quick = listOf("Zahnarzt" to "Diş hekimi", "Hausarzt" to "Aile hekimi", "Apotheke" to "Eczane", "Schlüsseldienst" to "Çilingir", "Friseur" to "Kuaför", "Rechtsanwalt" to "Avukat", "Steuerberater" to "Mali müşavir", "Autowerkstatt" to "Oto tamir", "Klempner" to "Tesisatçı", "Elektriker" to "Elektrikçi")
    Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("📒 " + t(language, "Berliner Telefonbuch & Branchen", "Berlin telefon & iş rehberi"), fontWeight = FontWeight.Bold, fontSize = 15.sp)
            OutlinedTextField(what, { what = it }, label = { Text(t(language, "Was suchst du? Name, Firma, Branche", "Ne arıyorsun? İsim, firma, sektör")) }, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(where, { where = it }, label = { Text(t(language, "Wo? (Kiez)", "Nerede? (mahalle)")) }, singleLine = true, modifier = Modifier.fillMaxWidth())
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                quick.forEach { (de, tr) -> AssistChip(onClick = { what = de }, label = { Text(t(language, de, tr), fontSize = 12.sp) }) }
            }
            Text(t(language, "Suchen in den echten Verzeichnissen:", "Gerçek rehberlerde ara:"), fontSize = 11.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                books.forEach { (name, url) ->
                    Button(
                        onClick = { if (what.isNotBlank()) runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url(what, where.ifBlank { "Berlin" })))) } },
                        enabled = what.isNotBlank(), colors = ButtonDefaults.buttonColors(containerColor = PlusRed), contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) { Text("🔎 $name", fontSize = 12.sp) }
                }
            }
            Text(t(language, "Die Suche öffnet die Seite des Verzeichnisses. My Kiez speichert keine Daten.", "Arama rehberin kendi sayfasını açar. My Kiez veri kaydetmez."), fontSize = 10.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

/** 2026-11-14: own page "Berliner Telefonbuch" (menu, home box, businesses page) – search + official numbers. */
@Composable
fun TelefonbuchScreen(language: AppLanguage, onBack: () -> Unit) {
    val context = LocalContext.current
    val official = listOf(
        Triple("115", t(language, "Behördennummer Berlin (Bürgeramt, Ämter)", "Berlin resmi daireler hattı (Bürgeramt)"), "tel:115"),
        Triple("030 4664 4664", t(language, "Polizei Bürgertelefon (kein Notfall)", "Polis vatandaş hattı (acil değil)"), "tel:03046644664"),
        Triple("116 117", t(language, "Ärztlicher Bereitschaftsdienst", "Nöbetçi doktor"), "tel:116117"),
        Triple("0800 00 22833", t(language, "Apotheken-Notdienst", "Nöbetçi eczane"), "tel:08000022833"),
        Triple("service.berlin.de", t(language, "Alle Berliner Ämter & Termine", "Tüm Berlin daireleri & randevular"), "https://service.berlin.de/"),
    )
    androidx.compose.foundation.lazy.LazyColumn(
        Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onBack) { Text("←", fontSize = 20.sp) }
                Column {
                    Text(t(language, "Berliner Telefonbuch", "Berlin telefon rehberi"), fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(t(language, "Firmen, Ärzte, Handwerker, Ämter – echte Verzeichnisse", "Firma, doktor, usta, daire – gerçek rehberler"), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
        item {
            Text(
                t(language,
                    "So geht's: Oben eintippen, was du suchst (z. B. „Zahnarzt“ oder einen Namen), unten den Kiez – dann auf ein Verzeichnis tippen. Es öffnet sich die Trefferliste mit Telefonnummern.",
                    "Nasıl çalışır: Üste aradığını yaz (örn. „Diş hekimi“ veya bir isim), alta mahalleyi – sonra bir rehbere dokun. Telefon numaralarıyla sonuç listesi açılır."),
                fontSize = 12.5.sp, lineHeight = 17.sp,
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF0F766E).copy(alpha = 0.10f)).padding(10.dp)
            )
        }
        item { TelefonbuchSection(language) }
        item { Text(t(language, "Wichtige Nummern der Stadt", "Şehrin önemli numaraları"), fontWeight = FontWeight.Bold, fontSize = 15.sp) }
        official.forEach { (num, label, link) ->
            item {
                Row(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(MaterialTheme.colorScheme.surfaceVariant)
                        .clickable { runCatching { context.startActivity(Intent(if (link.startsWith("tel:")) Intent.ACTION_DIAL else Intent.ACTION_VIEW, Uri.parse(link))) } }
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(num, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Text(label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text(if (link.startsWith("tel:")) "📞" else "🌐", fontSize = 18.sp)
                }
            }
        }
    }
}

// ---------------- Berlin-Tipps photos ----------------
// 2026-11-14 (owner): real photos of every tip (Wikipedia / Wikimedia Commons, checked one by one) – credit is shown
val TIP_PHOTO_CREDIT = mapOf(
    "botanischer-garten" to "Foto: Axel Mauruszat · Attribution · Wikimedia Commons",
    "brandenburger-tor" to "Foto: Thomas Wolf, www.foto-tw.de · CC BY-SA 3.0 · Wikimedia Commons",
    "britzer-garten" to "Foto: Denis Apel · CC BY-SA 4.0 · Wikimedia Commons",
    "checkpoint-charlie" to "Foto: Christian David · CC BY-SA 4.0 · Wikimedia Commons",
    "east-side-gallery" to "Foto: Joachim F. Thurn · CC BY-SA 3.0 de · Wikimedia Commons",
    "fernsehturm" to "Foto: Diego Delso · CC BY-SA 4.0 · Wikimedia Commons",
    "gaerten-der-welt" to "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
    "gendarmenmarkt" to "Foto: Ansgar Koreng · CC BY 3.0 de · Wikimedia Commons",
    "gleisdreieck" to "Foto: A.Savin · FAL · Wikimedia Commons",
    "greenwichpromenade" to "Foto: Fridolin freudenfett · CC BY-SA 4.0 · Wikimedia Commons",
    "holocaust-mahnmal" to "Foto: Alexander Blum · CC BY-SA 4.0 · Wikimedia Commons",
    "humboldthain" to "Foto: Angela Monika Arnold · CC BY-SA 2.0 de · Wikimedia Commons",
    "koepenick" to "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
    "koernerpark" to "Foto: Assenmacher · CC BY-SA 3.0 · Wikimedia Commons",
    "mauer-gedenkstaette" to "Foto: HerrAdams · CC BY-SA 4.0 · Wikimedia Commons",
    "mauerpark" to "Foto: Traktorminze · CC BY 3.0 · Wikimedia Commons",
    "molecule-man" to "Foto: Avda · CC BY-SA 3.0 · Wikimedia Commons",
    "museumsinsel" to "Foto: Thomas Wolf, www.foto-tw.de · CC BY-SA 3.0 · Wikimedia Commons",
    "naturkundemuseum" to "Foto: Dosseman · CC BY-SA 4.0 · Wikimedia Commons",
    "rathaus-schoeneberg" to "Foto: Dirk Ingo Franke · CC BY 3.0 · Wikimedia Commons",
    "reichstag" to "Foto: Jörg Braukmann · CC BY-SA 4.0 · Wikimedia Commons",
    "schloss-charlottenburg" to "Foto: Times · CC BY-SA 3.0 · Wikimedia Commons",
    "schoenhausen" to "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
    "stasimuseum" to "Foto: Gunnar Klack · CC BY-SA 4.0 · Wikimedia Commons",
    "technikmuseum" to "Foto: Sir James · CC BY-SA 2.0 de · Wikimedia Commons",
    "tempelhofer-feld" to "Foto: Matti Blume · CC BY-SA 4.0 · Wikimedia Commons",
    "tiergarten-park" to "Foto: beedubz · CC BY-SA 3.0 · Wikimedia Commons",
    "tierpark" to "Foto: Dreizung · CC BY 3.0 · Wikimedia Commons",
    "treptower-park" to "Foto: Andreas Steinhoff · Attribution · Wikimedia Commons",
    "viktoriapark" to "Foto: A.Savin · FAL · Wikimedia Commons",
    "volkspark-friedrichshain" to "Foto: A.Savin · FAL · Wikimedia Commons",
    "zitadelle-spandau" to "Foto: Carsten Steger · CC BY-SA 4.0 · Wikimedia Commons",
    "zoo-berlin" to "Foto: Jean-Pierre Dalbéra from Paris, France · CC BY 2.0 · Wikimedia Commons"
)
fun tipPhotoUrl(id: String) = if (TIP_PHOTO_CREDIT.containsKey(id)) "https://mykiezberlin.com/assets/tips/$id.webp" else ""
/** Real Google Maps place page (name + address): photos, reviews, opening hours. */
fun tipMapsUrl(tip: BerlinTip) = "https://www.google.com/maps/search/?api=1&query=" + Uri.encode(tip.name + ", " + tip.address.ifBlank { "Berlin" })

@Composable
fun TipPhoto(tip: BerlinTip, modifier: Modifier = Modifier) {
    val url = tipPhotoUrl(tip.id)
    if (url.isBlank()) return
    Box(modifier) {
        AsyncImage(model = url, contentDescription = tip.name, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f))
        Text(
            TIP_PHOTO_CREDIT[tip.id].orEmpty(), fontSize = 8.5.sp, color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis,
            modifier = Modifier.align(Alignment.BottomEnd).padding(4.dp).clip(RoundedCornerShape(6.dp)).background(Color.Black.copy(alpha = 0.45f)).padding(horizontal = 5.dp, vertical = 1.dp)
        )
    }
}

// ---------------- Berlin-Tipps detail ----------------

// 2026-11-14: the tip categories are stored as English keys – shown in the user's language
fun tipCategoryName(key: String, language: AppLanguage): String = when (key) {
    "culture" -> t(language, "Kultur", "Kültür")
    "view" -> t(language, "Aussicht", "Manzara")
    "park" -> t(language, "Park & Natur", "Park & Doğa")
    "kids" -> t(language, "Für Kinder", "Çocuklar için")
    "museum" -> t(language, "Museum", "Müze")
    else -> key
}

@Composable
fun TipDetailDialog(tip: BerlinTip, language: AppLanguage, onMap: () -> Unit, onRoute: () -> Unit, onDismiss: () -> Unit) {
    val context = LocalContext.current
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(tip.name, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                TipPhoto(tip, Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)))
                Text("📍 " + tip.address, fontSize = 12.5.sp, color = PlusRed)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(tip.kiezId.replace("-", " ").replaceFirstChar { it.uppercase() }, fontSize = 11.sp, modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(PlusRed.copy(alpha = 0.1f)).padding(horizontal = 6.dp, vertical = 2.dp))
                    if (tip.isFree) Text(t(language, "Gratis", "Ücretsiz"), fontSize = 11.sp, modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(Color(0xFF2EA043).copy(alpha = 0.15f)).padding(horizontal = 6.dp, vertical = 2.dp))
                    tip.categories.take(3).forEach { c -> Text(tipCategoryName(c, language), fontSize = 11.sp, modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(MaterialTheme.colorScheme.surfaceVariant).padding(horizontal = 6.dp, vertical = 2.dp)) }
                }
                Text(tip.localizedDesc(language), fontSize = 14.sp, lineHeight = 20.sp)
                TextButton(onClick = { runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/search?q=" + Uri.encode(tip.name + " Berlin")))) } }) {
                    Text("🔎 " + t(language, "Mehr erfahren", "Daha fazla bilgi"))
                }
            }
        },
        confirmButton = { Button(onClick = onRoute, colors = ButtonDefaults.buttonColors(containerColor = PlusRed)) { Text(t(language, "Route", "Yol tarifi")) } },
        dismissButton = {
            Row {
                TextButton(onClick = onMap) { Text("Google Maps") }
                TextButton(onClick = onDismiss) { Text(t(language, "Schließen", "Kapat")) }
            }
        }
    )
}
