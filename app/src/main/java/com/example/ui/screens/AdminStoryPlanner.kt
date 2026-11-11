package com.example.ui.screens

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.example.data.repository.KiezStorageManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.concurrent.TimeUnit

/**
 * Story planner (admin): many stories at once, each with its own start and end (day, hour, minute).
 * The server shows a story only from its start and notifies the users then. Same as the web admin (admin-planner.js).
 */
private const val HOUR = 3_600_000L
private val plannerClient = OkHttpClient.Builder().connectTimeout(15, TimeUnit.SECONDS).writeTimeout(120, TimeUnit.SECONDS).readTimeout(60, TimeUnit.SECONDS).build()
private val PlannerDark = Color(0xFF161B22)
private val PlannerBorder = Color(0xFF30363D)
private val PlannerGold = Color(0xFFF2B705)
private val PlannerRed = Color(0xFFE30613)

private class PlanRow(val key: Int, val uri: Uri?, val isVideo: Boolean) {
    var headline by mutableStateOf("")
    var subtext by mutableStateOf("")
    var kiez by mutableStateOf("Ganz Berlin")
    var kind by mutableStateOf("news")
    var link by mutableStateOf("")
    var start by mutableLongStateOf(0L)
    var end by mutableLongStateOf(0L)
    var status by mutableStateOf("") // "" | busy | ok | error
    var error by mutableStateOf("")
    var ai by mutableStateOf("") // "" | busy | ok | error (KI reads the picture)
    var aiError by mutableStateOf("")
}

/** Fills empty fields from the picture / video frame (force = overwrite, the ✨ button). */
private suspend fun aiFill(context: Context, row: PlanRow, force: Boolean) {
    val uri = row.uri ?: return
    row.ai = "busy"
    try {
        val r = withContext(Dispatchers.IO) { com.example.data.repository.StoryAiClient.analyze(context, uri, row.isVideo) }
        if ((force || row.headline.isBlank()) && r.headline.isNotBlank()) row.headline = r.headline.take(120)
        if ((force || row.subtext.isBlank()) && r.subtext.isNotBlank()) row.subtext = r.subtext.take(500)
        if ((force || row.link.isBlank()) && r.link.isNotBlank()) row.link = r.link
        if (r.kiez.isNotBlank() && (force || row.kiez.isBlank() || row.kiez == "Ganz Berlin")) row.kiez = r.kiez
        if (r.kind.isNotBlank() && (force || row.kind.isBlank() || row.kind == "news")) row.kind = r.kind
        row.ai = "ok"
    } catch (e: Exception) {
        row.ai = "error"
        row.aiError = e.message ?: "Fehler"
    }
}

private data class PlannedStory(val id: String, val headline: String, val kiez: String, val kind: String, val mediaKey: String, val isVideo: Boolean, val start: Long, val hours: Int)

private fun fmt(ms: Long, pattern: String = "EEE dd.MM. HH:mm") = SimpleDateFormat(pattern, Locale.GERMANY).format(ms)

/** Date picker, then time picker (minute precision). */
private fun pickDateTime(context: Context, initial: Long, onPicked: (Long) -> Unit) {
    val cal = Calendar.getInstance().apply { timeInMillis = if (initial > 0) initial else System.currentTimeMillis() }
    DatePickerDialog(context, { _, y, m, d ->
        TimePickerDialog(context, { _, h, min ->
            cal.set(y, m, d, h, min, 0)
            cal.set(Calendar.MILLISECOND, 0)
            onPicked(cal.timeInMillis)
        }, cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE), true).show()
    }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH)).show()
}

/** Pictures over 4.5 MB are reduced to 1920 px (server limit 5 MB); videos are sent unchanged (max 50 MB). */
private fun readMedia(context: Context, uri: Uri, isVideo: Boolean): Pair<ByteArray, String>? {
    val type = context.contentResolver.getType(uri) ?: if (isVideo) "video/mp4" else "image/jpeg"
    val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: return null
    if (isVideo || bytes.size <= 4_500_000) return bytes to type
    val bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return null
    val scale = minOf(1f, 1920f / maxOf(bmp.width, bmp.height))
    val small = Bitmap.createScaledBitmap(bmp, (bmp.width * scale).toInt(), (bmp.height * scale).toInt(), true)
    val out = ByteArrayOutputStream()
    small.compress(Bitmap.CompressFormat.JPEG, 88, out)
    return out.toByteArray() to "image/jpeg"
}

private fun uploadPlanned(context: Context, token: String, row: PlanRow): String? {
    val builder = MultipartBody.Builder().setType(MultipartBody.FORM)
        .addFormDataPart("planned", "1")
        .addFormDataPart("headline", row.headline.trim())
        .addFormDataPart("subtext", row.subtext.trim())
        .addFormDataPart("kiez", row.kiez.trim().ifBlank { "Ganz Berlin" })
        .addFormDataPart("kind", row.kind.trim().ifBlank { "news" })
        .addFormDataPart("link", row.link.trim())
        .addFormDataPart("author", "My Kiez Berlin")
        .addFormDataPart("publishAt", row.start.toString())
        .addFormDataPart("endAt", row.end.toString())
    if (row.uri != null) {
        val media = readMedia(context, row.uri, row.isVideo) ?: return "Datei nicht lesbar"
        if (row.isVideo && media.first.size > 50_000_000) return "Video größer als 50 MB"
        val ext = when (media.second) { "image/png" -> "png"; "image/webp" -> "webp"; "video/mp4" -> "mp4"; "video/webm" -> "webm"; else -> "jpg" }
        builder.addFormDataPart("file", "story.$ext", media.first.toRequestBody(media.second.toMediaType()))
    }
    val req = Request.Builder().url("https://mykiezberlin.com/api/stories").header("x-admin-token", token).post(builder.build()).build()
    return plannerClient.newCall(req).execute().use { resp ->
        if (resp.isSuccessful) null else (JSONObject(resp.body?.string().orEmpty().ifBlank { "{}" }).optString("error").ifBlank { "HTTP ${resp.code}" })
    }
}

private fun loadPlanned(token: String): List<PlannedStory> {
    val req = Request.Builder().url("https://mykiezberlin.com/api/admin-planned").header("x-admin-token", token).build()
    return plannerClient.newCall(req).execute().use { resp ->
        if (!resp.isSuccessful) return emptyList()
        val arr = JSONObject(resp.body?.string().orEmpty()).optJSONArray("stories") ?: return emptyList()
        (0 until arr.length()).map { i ->
            val o = arr.getJSONObject(i)
            PlannedStory(o.optString("id"), o.optString("headline"), o.optString("kiez"), o.optString("kind"), o.optString("media_key"), o.optString("media_type") == "video", o.optLong("approved_at"), o.optInt("duration_hours", 24))
        }
    }
}

private fun plannedAction(token: String, body: JSONObject): Boolean {
    val req = Request.Builder().url("https://mykiezberlin.com/api/admin").header("x-admin-token", token)
        .post(body.toString().toRequestBody("application/json; charset=utf-8".toMediaType())).build()
    return plannerClient.newCall(req).execute().use { it.isSuccessful }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminStoryPlanner(onDismiss: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val token = remember { KiezStorageManager.getAdminToken(context) }
    // Height of the system navigation bar (the dialog does not always receive window insets)
    val density = androidx.compose.ui.platform.LocalDensity.current
    val navBar = remember {
        val id = context.resources.getIdentifier("navigation_bar_height", "dimen", "android")
        with(density) { (if (id > 0) context.resources.getDimensionPixelSize(id) else 0).toDp() }
    }
    val rows = remember { mutableStateListOf<PlanRow>() }
    var seq by remember { mutableIntStateOf(0) }
    var planned by remember { mutableStateOf<List<PlannedStory>>(emptyList()) }
    var busy by remember { mutableStateOf(false) }
    var tab by remember { mutableIntStateOf(0) }
    // Auto distribution
    var dayStart by remember { mutableLongStateOf(Calendar.getInstance().apply { set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0) }.timeInMillis) }
    var times by remember { mutableStateOf("09:00, 12:00, 15:00, 18:00, 21:00") }
    var hours by remember { mutableStateOf("24") }
    var allKiez by remember { mutableStateOf("") }
    var allKind by remember { mutableStateOf("") }

    fun reload() = scope.launch { planned = withContext(Dispatchers.IO) { runCatching { loadPlanned(token) }.getOrDefault(emptyList()) } }
    LaunchedEffect(Unit) { reload() }

    fun addRow(uri: Uri?, isVideo: Boolean): PlanRow {
        val last = rows.lastOrNull()
        val start = if (last != null && last.start > 0) last.start + 3 * HOUR else ((System.currentTimeMillis() + 15 * 60_000L) / 300_000L + 1) * 300_000L
        val row = PlanRow(++seq, uri, isVideo).apply { this.start = start; end = start + 24 * HOUR }
        rows.add(row)
        return row
    }

    val picker = rememberLauncherForActivityResult(ActivityResultContracts.PickMultipleVisualMedia(50)) { uris ->
        val added = uris.map { uri ->
            val type = context.contentResolver.getType(uri).orEmpty()
            addRow(uri, type.startsWith("video/"))
        }
        // Empty fields are filled from the pictures (KI, DE + TR), one after another
        scope.launch { added.forEach { if (it in rows) aiFill(context, it, false) } }
    }

    fun distribute() {
        val slots = times.split(',', ';', ' ').map { it.trim() }.filter { Regex("^\\d{1,2}:\\d{2}$").matches(it) }
            .map { val p = it.split(":"); p[0].toInt() to p[1].toInt() }.sortedBy { it.first * 60 + it.second }
        if (slots.isEmpty()) return
        val h = (hours.toIntOrNull() ?: 24).coerceIn(1, 720)
        var d = 0
        var t = 0
        val now = System.currentTimeMillis()
        rows.forEach { row ->
            var start: Long
            do {
                val cal = Calendar.getInstance().apply { timeInMillis = dayStart; add(Calendar.DAY_OF_MONTH, d); set(Calendar.HOUR_OF_DAY, slots[t].first); set(Calendar.MINUTE, slots[t].second) }
                start = cal.timeInMillis
                t += 1
                if (t >= slots.size) { t = 0; d += 1 }
            } while (start < now)
            row.start = start
            row.end = start + h * HOUR
        }
    }

    fun uploadAll() {
        val todo = rows.filter { it.status != "ok" }
        if (todo.any { it.headline.isBlank() }) {
            android.widget.Toast.makeText(context, "Başlık eksik / Titel fehlt", android.widget.Toast.LENGTH_LONG).show()
            return
        }
        busy = true
        scope.launch {
            for (row in todo) {
                row.status = "busy"
                val err = withContext(Dispatchers.IO) { runCatching { uploadPlanned(context, token, row) }.getOrElse { it.message ?: "Fehler" } }
                if (err == null) row.status = "ok" else { row.status = "error"; row.error = err }
            }
            busy = false
            reload()
        }
    }

    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
        Surface(modifier = Modifier.fillMaxSize(), color = Color(0xFF0D1117)) {
            Column(Modifier.systemBarsPadding().imePadding()) {
                TopAppBar(
                    title = { Text("📅 Story Planlayıcı", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 17.sp) },
                    navigationIcon = { TextButton(onClick = onDismiss) { Text("✕", color = Color.White, fontSize = 18.sp) } },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF161B22))
                )
                TabRow(selectedTabIndex = tab, containerColor = Color(0xFF161B22), contentColor = Color.White) {
                    Tab(selected = tab == 0, onClick = { tab = 0 }, text = { Text("Yeni (${rows.size})") })
                    Tab(selected = tab == 1, onClick = { tab = 1; reload() }, text = { Text("Planlı (${planned.size})") })
                }
                if (tab == 0) {
                    LazyColumn(Modifier.weight(1f).padding(horizontal = 12.dp), verticalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(vertical = 10.dp)) {
                        item {
                            Text("Her story için gün, saat ve dakikayla başlangıç ve bitiş belirle. Story tam o saatte yayına girer, kullanıcılara bildirim gider.", color = Color(0xFF8B949E), fontSize = 12.sp)
                            Row(Modifier.padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(onClick = { picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageAndVideo)) }, colors = ButtonDefaults.buttonColors(containerColor = PlannerRed)) { Text("🖼️ Resim / video seç") }
                                OutlinedButton(onClick = { addRow(null, false) }) { Text("+ Metin", color = Color.White) }
                            }
                        }
                        item {
                            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(PlannerDark).border(1.dp, PlannerBorder, RoundedCornerShape(10.dp)).padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("⚡ Otomatik dağıt (toplu)", color = Color.White, fontWeight = FontWeight.Bold)
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedButton(onClick = { pickDateTime(context, dayStart) { picked -> dayStart = Calendar.getInstance().apply { timeInMillis = picked; set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0) }.timeInMillis } }) {
                                        Text("📆 " + fmt(dayStart, "EEE dd.MM.yyyy"), color = Color.White, fontSize = 12.sp)
                                    }
                                    PlannerField(hours, { hours = it.filter(Char::isDigit).take(3) }, "Süre (saat)", Modifier.width(110.dp))
                                }
                                PlannerField(times, { times = it }, "Saatler (09:00, 12:30, …)")
                                Button(onClick = { distribute() }, enabled = rows.isNotEmpty(), colors = ButtonDefaults.buttonColors(containerColor = PlannerGold, contentColor = Color.Black, disabledContainerColor = PlannerGold.copy(alpha = 0.3f), disabledContentColor = Color.White.copy(alpha = 0.6f))) { Text(if (rows.isEmpty()) "Dağıt (önce story ekle)" else "Dağıt") }
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                                    PlannerField(allKiez, { allKiez = it }, "Hepsi: Kiez", Modifier.weight(1f))
                                    PlannerField(allKind, { allKind = it }, "Hepsi: kategori", Modifier.weight(1f))
                                }
                                OutlinedButton(onClick = { rows.forEach { r -> if (allKiez.isNotBlank()) r.kiez = allKiez; if (allKind.isNotBlank()) r.kind = allKind } }) { Text("Hepsine uygula", color = Color.White) }
                            }
                        }
                        itemsIndexed(rows, key = { _, r -> r.key }) { index, row ->
                            PlanRowCard(index, row, onAi = { scope.launch { aiFill(context, row, true) } }, onRemove = { rows.remove(row) }, onMove = { step ->
                                val j = index + step
                                if (j in rows.indices) { val r = rows.removeAt(index); rows.add(j, r) }
                            })
                        }
                    }
                    if (rows.isNotEmpty()) {
                        Row(Modifier.fillMaxWidth().background(Color(0xFF161B22)).padding(10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = { uploadAll() }, enabled = !busy, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = PlannerRed)) {
                                Text(if (busy) "⏳ Yükleniyor…" else "📤 ${rows.count { it.status != "ok" }} story'yi planla")
                            }
                            OutlinedButton(onClick = { rows.removeAll { it.status == "ok" } }) { Text("Temizle", color = Color.White) }
                        }
                    }
                    Spacer(Modifier.fillMaxWidth().height(maxOf(navBar, 56.dp)).background(Color(0xFF161B22)))
                } else {
                    LazyColumn(Modifier.weight(1f).padding(horizontal = 12.dp), verticalArrangement = Arrangement.spacedBy(6.dp), contentPadding = PaddingValues(vertical = 10.dp)) {
                        if (planned.isEmpty()) item { Text("Şu an planlanmış story yok.", color = Color(0xFF8B949E)) }
                        var lastDay = ""
                        planned.forEach { s ->
                            val day = fmt(s.start, "EEEE dd.MM.yyyy")
                            if (day != lastDay) {
                                lastDay = day
                                item(key = "day-$day") { Text("$day · ${planned.count { fmt(it.start, "EEEE dd.MM.yyyy") == day }} story", color = PlannerGold, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 6.dp)) }
                            }
                            item(key = s.id) {
                                PlannedCard(s,
                                    onReschedule = { start, end ->
                                        scope.launch {
                                            withContext(Dispatchers.IO) { runCatching { plannedAction(token, JSONObject().put("type", "story").put("id", s.id).put("action", "reschedule").put("publishAt", start).put("endAt", end)) } }
                                            reload()
                                        }
                                    },
                                    onAction = { action ->
                                        scope.launch {
                                            withContext(Dispatchers.IO) { runCatching { plannedAction(token, JSONObject().put("type", "story").put("id", s.id).put("action", action)) } }
                                            reload()
                                        }
                                    })
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PlannerField(value: String, onChange: (String) -> Unit, label: String, modifier: Modifier = Modifier.fillMaxWidth()) {
    OutlinedTextField(
        value = value, onValueChange = onChange, label = { Text(label, fontSize = 11.sp) }, singleLine = true, modifier = modifier,
        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedLabelColor = PlannerGold, unfocusedLabelColor = Color(0xFF8B949E))
    )
}

@Composable
private fun PlanRowCard(index: Int, row: PlanRow, onAi: () -> Unit, onRemove: () -> Unit, onMove: (Int) -> Unit) {
    val context = LocalContext.current
    val borderColor = when (row.status) { "ok" -> Color(0xFF2EA043); "error" -> Color(0xFFDA3633); else -> PlannerBorder }
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(PlannerDark).border(1.dp, borderColor, RoundedCornerShape(10.dp)).padding(8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            if (row.uri != null) com.example.ui.components.MediaPreview(row.uri, row.isVideo, Modifier.size(64.dp, 96.dp))
            else Box(Modifier.size(64.dp, 96.dp).clip(RoundedCornerShape(8.dp)).background(if (row.isVideo) Color(0xFF333333) else PlannerRed), contentAlignment = Alignment.Center) { Text(if (row.isVideo) "🎬" else "Aa", color = Color.White) }
            Text("#${index + 1}", color = Color.White, fontSize = 11.sp)
            Row { Text("↑", color = Color.White, modifier = Modifier.clickable { onMove(-1) }.padding(6.dp)); Text("↓", color = Color.White, modifier = Modifier.clickable { onMove(1) }.padding(6.dp)) }
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            PlannerField(row.headline, { row.headline = it.take(120) }, "Başlık *")
            OutlinedTextField(
                value = row.subtext, onValueChange = { row.subtext = it.take(500) }, label = { Text("Metin", fontSize = 11.sp) },
                minLines = 2, maxLines = 6, modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedLabelColor = PlannerGold, unfocusedLabelColor = Color(0xFF8B949E))
            )
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                PlannerField(row.kiez, { row.kiez = it.take(60) }, "Kiez", Modifier.weight(1f))
                PlannerField(row.kind, { row.kind = it.take(30) }, "Kategori", Modifier.weight(1f))
            }
            PlannerField(row.link, { row.link = it.take(500) }, "Web linki (isteğe bağlı)")
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                OutlinedButton(onClick = { pickDateTime(context, row.start) { row.start = it; if (row.end <= it) row.end = it + 24 * HOUR } }, modifier = Modifier.weight(1f), contentPadding = PaddingValues(4.dp)) {
                    Text("▶️ " + fmt(row.start), color = Color.White, fontSize = 11.sp)
                }
                OutlinedButton(onClick = { pickDateTime(context, row.end) { if (it > row.start) row.end = it } }, modifier = Modifier.weight(1f), contentPadding = PaddingValues(4.dp)) {
                    Text("⏹️ " + fmt(row.end), color = Color.White, fontSize = 11.sp)
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    when {
                        row.status == "ok" -> "✅ Planlandı"
                        row.status == "busy" -> "⏳ Yükleniyor…"
                        row.status == "error" -> "❌ ${row.error}"
                        row.ai == "busy" -> "✨ KI resmi okuyor…"
                        row.ai == "error" -> "KI: ${row.aiError}"
                        else -> "${maxOf(1L, (row.end - row.start + HOUR - 1) / HOUR)} saat yayında"
                    },
                    color = Color(0xFF8B949E), fontSize = 11.sp, modifier = Modifier.weight(1f)
                )
                if (row.uri != null) TextButton(onClick = onAi, enabled = row.ai != "busy", contentPadding = PaddingValues(4.dp)) {
                    Text(when (row.ai) { "busy" -> "⏳"; "ok" -> "✨ ✓"; else -> "✨ KI" }, color = PlannerGold, fontSize = 12.sp)
                }
                TextButton(onClick = {
                    val length = row.end - row.start
                    row.start = System.currentTimeMillis()
                    row.end = row.start + if (length > 0) length else 24 * HOUR
                }, contentPadding = PaddingValues(4.dp)) { Text("▶️ Şimdi", color = Color.White, fontSize = 12.sp) }
                TextButton(onClick = onRemove, contentPadding = PaddingValues(4.dp)) { Text("Kaldır", color = PlannerRed, fontSize = 12.sp) }
            }
        }
    }
}

@Composable
private fun PlannedCard(s: PlannedStory, onReschedule: (Long, Long) -> Unit, onAction: (String) -> Unit) {
    val context = LocalContext.current
    var confirmDelete by remember { mutableStateOf(false) }
    val end = s.start + s.hours * HOUR
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(PlannerDark).border(1.dp, PlannerBorder, RoundedCornerShape(10.dp)).padding(8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        if (s.mediaKey.isNotBlank()) com.example.ui.components.MediaPreview("https://mykiezberlin.com/media/${s.mediaKey}", s.isVideo, Modifier.size(44.dp, 64.dp), cornerDp = 6)
        else Box(Modifier.size(44.dp, 64.dp).clip(RoundedCornerShape(6.dp)).background(if (s.isVideo) Color(0xFF333333) else PlannerRed), contentAlignment = Alignment.Center) { Text(if (s.isVideo) "🎬" else "Aa", color = Color.White) }
        Column(Modifier.weight(1f)) {
            Text("${fmt(s.start, "HH:mm")} · ${s.headline}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text("📍 ${s.kiez} · ${s.kind} · bitiş ${fmt(end)}", color = Color(0xFF8B949E), fontSize = 11.sp)
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                TextButton(onClick = { pickDateTime(context, s.start) { start -> onReschedule(start, start + s.hours * HOUR) } }, contentPadding = PaddingValues(4.dp)) { Text("Başlangıç", color = PlannerGold, fontSize = 11.sp) }
                TextButton(onClick = { pickDateTime(context, end) { e -> if (e > s.start) onReschedule(s.start, e) } }, contentPadding = PaddingValues(4.dp)) { Text("Bitiş", color = PlannerGold, fontSize = 11.sp) }
                TextButton(onClick = { onAction("publishNow") }, contentPadding = PaddingValues(4.dp)) { Text("Hemen", color = Color(0xFF2EA043), fontSize = 11.sp) }
                TextButton(onClick = { confirmDelete = true }, contentPadding = PaddingValues(4.dp)) { Text("Sil", color = PlannerRed, fontSize = 11.sp) }
            }
        }
    }
    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            title = { Text("Silinsin mi?") },
            text = { Text(s.headline) },
            confirmButton = { TextButton(onClick = { confirmDelete = false; onAction("delete") }) { Text("Sil") } },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Vazgeç") } }
        )
    }
}
