package com.example.ui.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.repository.KiezStorageManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

/**
 * Admin tab "Werbeanfragen" (2026-11-12): real requests from /werben with reply by mail (from info@),
 * mail log, edit, delete and status. Same server actions as the web admin (public/admin-requests.js).
 * Finished requests are deleted by the server 90 days after "Erledigt".
 */
private val reqClient = OkHttpClient.Builder().connectTimeout(15, TimeUnit.SECONDS).readTimeout(40, TimeUnit.SECONDS).build()
private const val REQ_ADMIN_URL = "https://mykiezberlin.com/api/admin"
private val ReqCard = Color(0xFF1C252E)
private val ReqGrey = Color(0xFFA9B3BC)
private val ReqGold = Color(0xFFF2B705)
private val ReqGreen = Color(0xFF3FB950)
private val ReqRed = Color(0xFFFF7B72)

private val SIZE_NAMES = mapOf("s" to "Kiez Basic 29 €", "m" to "Kiez Plus 49 €", "l" to "Kiez Premium 89 €", "banner" to "Banner", "gp" to "Gründungspartner")
private val STATUS_DE = mapOf("new" to "Neu", "contacted" to "Kontaktiert", "paid" to "Bezahlt", "done" to "Erledigt", "canceled" to "Gekündigt")
private val STATUS_TR = mapOf("new" to "Yeni", "contacted" to "İletişime geçildi", "paid" to "Ödendi", "done" to "Tamamlandı", "canceled" to "İptal")
private val MAIL_KIND = mapOf("welcome" to "Willkommens-Mail", "copy" to "Kopie an info@", "reply" to "Antwort", "paid" to "Zahlungs-Mail")
private val REPLY_KINDS = listOf("callback" to "Rückruf / Termin", "paylink" to "Zahlungslink (Stripe)", "online" to "Anzeige ist online", "free" to "Freier Text")

data class AdRequestMail(val at: Long, val kind: String, val to: String, val subject: String, val ok: Boolean, val error: String, val text: String)
data class AdRequestRow(
    val id: String, val company: String, val person: String, val email: String, val phone: String, val address: String,
    val size: String, val message: String, val note: String, val status: String, val lang: String, val createdAt: Long,
    val mails: List<AdRequestMail>,
)

private fun reqPost(token: String, body: JSONObject): Pair<Boolean, JSONObject> {
    val req = Request.Builder().url(REQ_ADMIN_URL).header("x-admin-token", token)
        .post(body.toString().toRequestBody("application/json; charset=utf-8".toMediaType())).build()
    return reqClient.newCall(req).execute().use { resp ->
        val json = runCatching { JSONObject(resp.body?.string().orEmpty().ifBlank { "{}" }) }.getOrDefault(JSONObject())
        (resp.isSuccessful && json.optBoolean("ok", true)) to json
    }
}

private fun loadRequests(token: String): Triple<List<AdRequestRow>, Int, Boolean>? {
    val req = Request.Builder().url(REQ_ADMIN_URL).header("x-admin-token", token).build()
    return reqClient.newCall(req).execute().use { resp ->
        if (!resp.isSuccessful) return null
        val root = JSONObject(resp.body?.string().orEmpty())
        val arr = root.optJSONArray("adRequests") ?: JSONArray()
        val rows = (0 until arr.length()).map { i ->
            val o = arr.getJSONObject(i)
            val log = o.optJSONArray("mail_log") ?: JSONArray()
            AdRequestRow(
                o.optString("id"), o.optString("company"), o.optString("person"), o.optString("email"), o.optString("phone"),
                o.optString("address"), o.optString("size"), o.optString("message"), o.optString("note"), o.optString("status"),
                o.optString("lang").ifBlank { "de" }, o.optLong("created_at"),
                (0 until log.length()).map { j ->
                    val m = log.getJSONObject(j)
                    AdRequestMail(m.optLong("at"), m.optString("kind"), m.optString("to"), m.optString("subject"), m.optBoolean("ok"), m.optString("error"), m.optString("text"))
                },
            )
        }
        Triple(rows, root.optInt("requestKeepDays", 90), root.optBoolean("mailReady", true))
    }
}

private fun fmt(ms: Long) = if (ms <= 0) "–" else SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.GERMANY).format(Date(ms))

@Composable
fun AdminAdRequestsPanel(turkish: Boolean) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val token = remember { KiezStorageManager.getAdminToken(context) }
    var rows by remember { mutableStateOf<List<AdRequestRow>>(emptyList()) }
    var keepDays by remember { mutableIntStateOf(90) }
    var mailReady by remember { mutableStateOf(true) }
    var loading by remember { mutableStateOf(true) }
    var failed by remember { mutableStateOf(false) }
    var filter by remember { mutableStateOf("open") }
    var replyFor by remember { mutableStateOf<AdRequestRow?>(null) }
    var replyContacted by remember { mutableStateOf(false) }
    var editFor by remember { mutableStateOf<AdRequestRow?>(null) }
    var deleteFor by remember { mutableStateOf<AdRequestRow?>(null) }

    fun reload() {
        scope.launch {
            loading = true
            val result = withContext(Dispatchers.IO) { runCatching { loadRequests(token) }.getOrNull() }
            loading = false
            failed = result == null
            if (result != null) { rows = result.first; keepDays = result.second; mailReady = result.third }
        }
    }
    fun act(body: JSONObject, okText: String) {
        scope.launch {
            val (ok, json) = withContext(Dispatchers.IO) { runCatching { reqPost(token, body) }.getOrDefault(false to JSONObject()) }
            Toast.makeText(context, if (ok) okText else "Fehler: ${json.optString("error").ifBlank { json.optString("field", "?") }}", Toast.LENGTH_LONG).show()
            reload()
        }
    }
    LaunchedEffect(Unit) { reload() }

    val finished = { r: AdRequestRow -> r.status == "done" || r.status == "canceled" }
    val shown = when (filter) { "done" -> rows.filter(finished); "all" -> rows; else -> rows.filterNot(finished) }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            listOf("open" to (if (turkish) "Açık" else "Offen"), "done" to (if (turkish) "Tamamlanan" else "Erledigt"), "all" to (if (turkish) "Hepsi" else "Alle")).forEach { (key, label) ->
                val count = when (key) { "done" -> rows.count(finished); "all" -> rows.size; else -> rows.count { !finished(it) } }
                FilterChip(selected = filter == key, onClick = { filter = key }, label = { Text("$label ($count)", fontSize = 11.sp) })
            }
            Spacer(Modifier.weight(1f))
            TextButton(onClick = { reload() }) { Text("↻", color = Color.White) }
        }
        Text(
            (if (turkish) "Tamamlanan/iptal edilen talepler $keepDays gün sonra otomatik silinir. Mailler info@mykiezberlin.com adresinden gider."
            else "Erledigte/gekündigte Anfragen werden nach $keepDays Tagen automatisch gelöscht. Mails gehen von info@mykiezberlin.com raus.") +
                (if (mailReady) "" else if (turkish) " ⚠️ Mail sağlayıcısı yok – mail gitmez." else " ⚠️ Kein Mail-Anbieter – es geht keine Mail raus."),
            color = ReqGrey, fontSize = 11.sp
        )
        when {
            loading && rows.isEmpty() -> Text(if (turkish) "Yükleniyor …" else "Lädt …", color = ReqGrey)
            failed -> Text(if (turkish) "Sunucuya ulaşılamadı veya admin girişi geçersiz." else "Server nicht erreichbar oder Admin-Login ungültig.", color = ReqRed, fontSize = 12.sp)
            shown.isEmpty() -> Text(if (turkish) "Talep yok." else "Keine Anfragen.", color = ReqGrey, fontSize = 12.sp)
        }
        shown.forEach { r ->
            RequestCard(
                r, turkish,
                onReply = { replyContacted = false; replyFor = r },
                onContacted = { replyContacted = true; replyFor = r },
                onDone = { act(JSONObject().put("action", "requestStatus").put("id", r.id).put("status", "done"), if (turkish) "Tamamlandı" else "Erledigt") },
                onReopen = { act(JSONObject().put("action", "requestStatus").put("id", r.id).put("status", "new"), "OK") },
                onResend = { act(JSONObject().put("action", "requestResend").put("id", r.id), if (turkish) "Hoş geldin maili gönderildi" else "Willkommens-Mail gesendet") },
                onEdit = { editFor = r },
                onDelete = { deleteFor = r },
            )
        }
    }

    replyFor?.let { r ->
        ReplyDialog(r, turkish, replyContacted, token,
            onDismiss = { replyFor = null },
            onDone = { replyFor = null; reload() },
            onContactedOnly = { replyFor = null; act(JSONObject().put("action", "requestStatus").put("id", r.id).put("status", "contacted"), "OK") })
    }
    editFor?.let { r ->
        EditDialog(r, onDismiss = { editFor = null }, onSave = { fields ->
            editFor = null
            act(JSONObject().put("action", "requestEdit").put("id", r.id).put("fields", fields), if (turkish) "Kaydedildi" else "Gespeichert")
        })
    }
    deleteFor?.let { r ->
        AlertDialog(
            onDismissRequest = { deleteFor = null },
            title = { Text(if (turkish) "Talep silinsin mi?" else "Anfrage löschen?") },
            text = { Text(if (turkish) "„${r.company}“ kalıcı olarak silinir. Bağlı reklam yayında kalır (reklamı Web-Admin › Sponsor-Anzeigen'den ayrıca silebilirsin)." else "„${r.company}“ wird endgültig gelöscht. Eine verknüpfte Anzeige bleibt online (im Web-Admin unter Sponsor-Anzeigen separat löschbar).") },
            confirmButton = { TextButton(onClick = { deleteFor = null; act(JSONObject().put("action", "requestDelete").put("id", r.id).put("withAds", false), if (turkish) "Silindi" else "Gelöscht") }) { Text(if (turkish) "Sil" else "Löschen", color = ReqRed) } },
            dismissButton = { TextButton(onClick = { deleteFor = null }) { Text(if (turkish) "Vazgeç" else "Abbrechen") } },
        )
    }
}

@Composable
private fun RequestCard(
    r: AdRequestRow, turkish: Boolean,
    onReply: () -> Unit, onContacted: () -> Unit, onDone: () -> Unit, onReopen: () -> Unit,
    onResend: () -> Unit, onEdit: () -> Unit, onDelete: () -> Unit,
) {
    var showLog by remember { mutableStateOf(false) }
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = ReqCard)) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(r.company, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp, modifier = Modifier.weight(1f))
                Text((if (turkish) STATUS_TR else STATUS_DE)[r.status] ?: r.status, color = ReqGold, fontSize = 11.sp)
            }
            Text("${SIZE_NAMES[r.size] ?: r.size} · ${fmt(r.createdAt)} · ${r.lang.uppercase()}", color = ReqGrey, fontSize = 11.sp)
            Text(listOf(r.person, r.email, r.phone).filter { it.isNotBlank() }.joinToString(" · "), color = ReqGrey, fontSize = 12.sp)
            if (r.address.isNotBlank()) Text("📍 ${r.address}", color = ReqGrey, fontSize = 12.sp)
            if (r.message.isNotBlank()) Text(r.message, color = Color.White, fontSize = 12.sp)
            if (r.note.isNotBlank()) Text("📝 ${r.note}", color = ReqGold, fontSize = 12.sp)
            val welcome = r.mails.lastOrNull { it.kind == "welcome" }
            Text(
                when {
                    welcome == null -> if (turkish) "✉️ Kayıtta hoş geldin maili yok (12.11.2026 öncesi talep)" else "✉️ Keine Willkommens-Mail im Protokoll (Anfrage vor 12.11.2026)"
                    welcome.ok -> (if (turkish) "✉️ Hoş geldin maili gönderildi · " else "✉️ Willkommens-Mail gesendet · ") + fmt(welcome.at)
                    else -> (if (turkish) "✉️ Hoş geldin maili GİTMEDİ: " else "✉️ Willkommens-Mail FEHLGESCHLAGEN: ") + welcome.error
                },
                color = if (welcome?.ok == true) ReqGreen else ReqRed, fontSize = 11.sp
            )
            if (r.mails.isNotEmpty()) {
                TextButton(onClick = { showLog = !showLog }, contentPadding = PaddingValues(0.dp)) {
                    Text((if (turkish) "Mail geçmişi" else "Mail-Verlauf") + " (${r.mails.size}) " + if (showLog) "▲" else "▼", color = Color(0xFF58A6FF), fontSize = 11.sp)
                }
                if (showLog) r.mails.asReversed().forEach { m ->
                    Text("${if (m.ok) "✅" else "❌"} ${MAIL_KIND[m.kind] ?: m.kind} → ${m.to} · ${fmt(m.at)}\n${m.subject}${if (m.error.isNotBlank()) "\n${m.error}" else ""}", color = if (m.ok) ReqGrey else ReqRed, fontSize = 11.sp)
                }
            }
            FlowRowCompat {
                SmallBtn(if (turkish) "✉️ Cevap yaz" else "✉️ Antworten", Color(0xFFE30613), onReply)
                SmallBtn(if (turkish) "İletişime geçildi" else "Kontaktiert", Color(0xFF26323D), onContacted)
                if (r.status == "done" || r.status == "canceled") SmallBtn(if (turkish) "Yeniden aç" else "Wieder öffnen", Color(0xFF26323D), onReopen)
                else SmallBtn(if (turkish) "Tamamlandı" else "Erledigt", Color(0xFF26323D), onDone)
                SmallBtn(if (turkish) "✏️ Düzenle" else "✏️ Bearbeiten", Color(0xFF26323D), onEdit)
                SmallBtn(if (turkish) "🔁 Hoş geldin maili" else "🔁 Willkommens-Mail", Color(0xFF26323D), onResend)
                SmallBtn(if (turkish) "🗑 Sil" else "🗑 Löschen", Color(0xFF3A1D1D), onDelete)
            }
            Text(if (turkish) "Reklam oluşturma (resim, metin): Web-Admin › Anzeige anlegen" else "Anzeige anlegen (Bild, Texte): im Web-Admin", color = ReqGrey, fontSize = 10.sp)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun FlowRowCompat(content: @Composable () -> Unit) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) { content() }
}

@Composable
private fun SmallBtn(label: String, color: Color, onClick: () -> Unit) {
    Button(onClick = onClick, colors = ButtonDefaults.buttonColors(containerColor = color), contentPadding = PaddingValues(horizontal = 9.dp, vertical = 2.dp), shape = RoundedCornerShape(6.dp)) {
        Text(label, fontSize = 10.sp, color = Color.White)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ReplyDialog(r: AdRequestRow, turkish: Boolean, contactedMode: Boolean, token: String, onDismiss: () -> Unit, onDone: () -> Unit, onContactedOnly: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var kind by remember { mutableStateOf("callback") }
    var lang by remember { mutableStateOf(r.lang) }
    var subject by remember { mutableStateOf("") }
    var text by remember { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    LaunchedEffect(kind, lang) {
        val (ok, json) = withContext(Dispatchers.IO) { runCatching { reqPost(token, JSONObject().put("action", "requestTemplate").put("id", r.id).put("kind", kind).put("lang", lang)) }.getOrDefault(false to JSONObject()) }
        if (ok) { subject = json.optString("subject"); text = json.optString("text") }
    }
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Card(Modifier.fillMaxWidth(0.95f), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = ReqCard)) {
            Column(Modifier.padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text((if (turkish) "Cevap: " else "Antwort an ") + r.company, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                Text("An: ${r.email} · Von: info@mykiezberlin.com", color = ReqGrey, fontSize = 11.sp)
                FlowRowCompat {
                    REPLY_KINDS.forEach { (k, label) -> FilterChip(selected = kind == k, onClick = { kind = k }, label = { Text(label, fontSize = 11.sp) }) }
                }
                FlowRowCompat {
                    listOf("de" to "Deutsch", "tr" to "Türkçe", "en" to "English").forEach { (k, label) -> FilterChip(selected = lang == k, onClick = { lang = k }, label = { Text(label, fontSize = 11.sp) }) }
                }
                val fieldColors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                OutlinedTextField(subject, { subject = it }, label = { Text("Betreff") }, modifier = Modifier.fillMaxWidth(), colors = fieldColors)
                OutlinedTextField(text, { text = it }, label = { Text("Text") }, modifier = Modifier.fillMaxWidth().heightIn(min = 200.dp), colors = fieldColors)
                Text(if (turkish) "{paylink} gönderirken yeni bir Stripe ödeme linkiyle değiştirilir." else "{paylink} wird beim Senden durch einen neuen Stripe-Link ersetzt.", color = ReqGrey, fontSize = 10.sp)
                if (error.isNotBlank()) Text(error, color = ReqRed, fontSize = 12.sp)
                FlowRowCompat {
                    Button(enabled = !sending && subject.isNotBlank() && text.isNotBlank(), onClick = {
                        sending = true; error = ""
                        scope.launch {
                            val (ok, json) = withContext(Dispatchers.IO) { runCatching { reqPost(token, JSONObject().put("action", "requestReply").put("id", r.id).put("subject", subject).put("text", text)) }.getOrDefault(false to JSONObject().put("error", "Netzwerk")) }
                            sending = false
                            if (ok) { Toast.makeText(context, if (turkish) "Mail gönderildi" else "Mail gesendet", Toast.LENGTH_SHORT).show(); onDone() }
                            else error = (if (turkish) "Gönderilmedi: " else "Nicht gesendet: ") + json.optString("error")
                        }
                    }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE30613))) { Text(if (sending) "…" else if (turkish) "Gönder" else "Senden", color = Color.White) }
                    if (contactedMode) TextButton(onClick = onContactedOnly) { Text(if (turkish) "Mailsiz işaretle (telefonla görüşüldü)" else "Ohne Mail markieren (telefoniert)", color = ReqGold, fontSize = 12.sp) }
                    TextButton(onClick = onDismiss) { Text(if (turkish) "Vazgeç" else "Abbrechen", color = ReqGrey) }
                }
            }
        }
    }
}

@Composable
private fun EditDialog(r: AdRequestRow, onDismiss: () -> Unit, onSave: (JSONObject) -> Unit) {
    val values = remember {
        mutableStateMapOf("company" to r.company, "person" to r.person, "email" to r.email, "phone" to r.phone, "address" to r.address, "message" to r.message, "note" to r.note)
    }
    var size by remember { mutableStateOf(r.size) }
    var lang by remember { mutableStateOf(r.lang) }
    val labels = listOf("company" to "Firma *", "person" to "Ansprechperson", "email" to "E-Mail *", "phone" to "Telefon", "address" to "Adresse", "message" to "Nachricht des Kunden", "note" to "Interne Notiz (nur Admin)")
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Card(Modifier.fillMaxWidth(0.95f), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = ReqCard)) {
            Column(Modifier.padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Anfrage bearbeiten", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                val fieldColors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                labels.forEach { (key, label) ->
                    OutlinedTextField(values[key].orEmpty(), { values[key] = it }, label = { Text(label) }, modifier = Modifier.fillMaxWidth(), colors = fieldColors, singleLine = key != "message" && key != "note")
                }
                FlowRowCompat { SIZE_NAMES.forEach { (k, label) -> FilterChip(selected = size == k, onClick = { size = k }, label = { Text(label, fontSize = 11.sp) }) } }
                FlowRowCompat { listOf("de", "tr", "en").forEach { k -> FilterChip(selected = lang == k, onClick = { lang = k }, label = { Text(k.uppercase(), fontSize = 11.sp) }) } }
                Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
                    TextButton(onClick = onDismiss) { Text("Abbrechen", color = ReqGrey) }
                    Button(onClick = {
                        val f = JSONObject()
                        values.forEach { (k, v) -> f.put(k, v) }
                        f.put("size", size).put("lang", lang)
                        onSave(f)
                    }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1F9D55))) { Text("Speichern", color = Color.White) }
                }
            }
        }
    }
}
