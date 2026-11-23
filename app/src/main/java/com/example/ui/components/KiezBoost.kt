package com.example.ui.components

/*
 * My Kiez Berlin – 2026-11-21 (owner), same functions as public/kiez-boost.js on the web:
 *  1. Trusted accounts: a person with a story key (e.g. "Kiez26") shares like the admin – no daily limit,
 *     up to 10 pictures/videos per story, online at once (the AI check stays).                    [always on]
 *  2. "Alle Sponsoren" + "Türkiye Sponsorları": two big buttons side by side, glowing, 360° spin on tap.
 *  3. Story bar: ONE circle per sponsor with all its pictures/videos of the last 24 hours (/api/sponsor-stories).
 *  4. Sponsor uploads with a price in the text appear under "Mahalle hikâyelerindeki güncel indirimler" too.
 *  5. Offers get a glowing "🏷️ N Angebote" chip above the stories and a banner on the home page.
 *  6. "B2B" -> "Werben?" + "Ihr Betrieb in ganz Berlin sichtbar?" on top of every page and at the end of every
 *     page; at the end of a page a window opens every 2nd time.
 *  Owner (2026-11-21): points 2–6 first only for the admin (logged in on this phone). RELEASE = true -> everybody.
 */

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.VideoView
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.example.data.model.AppLanguage
import com.example.data.repository.KiezStorageManager
import com.example.ui.viewmodel.AppScreen
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

private const val SITE = "https://mykiezberlin.com"
private val Gold = Color(0xFFFFC107)
private val Navy = Color(0xFF0F172A)
private val Blue = Color(0xFF1E3A8A)
private val TrRed = Color(0xFFE30A17)

private fun pk(language: AppLanguage, de: String, tr: String, en: String = de) = when (language) {
    AppLanguage.TURKISH -> tr
    AppLanguage.ENGLISH -> en
    else -> de
}

object KiezBoost {
    const val RELEASE = true // 2026-11-22 (owner): now for everybody
    @Volatile var appContext: Context? = null
    /** Screen wish from a component without navigation (MainActivity reads it). */
    val navRequest = mutableStateOf<AppScreen?>(null)
    /** Offers of running stories (set by the story folder row, read by the home banner). */
    val storyDealCount = mutableIntStateOf(0)
    /** Open the /werben page (MainActivity reads it). */
    val werbenRequest = mutableStateOf(false)

    fun init(context: Context) {
        appContext = context.applicationContext
        StoryKeyStore.load(context)
    }

    fun on(context: Context): Boolean = RELEASE || KiezStorageManager.getAdminToken(context).isNotBlank()

    /** 2026-11-22 (owner): new view ("Startseite", no Live-Ticker button, no clock under the stories) –
     *  admin at once, everybody else when the admin switches "ui2" on (/api/flags). */
    val ui2Flag = mutableStateOf(false)
    fun ui2(context: Context): Boolean = ui2Flag.value || KiezStorageManager.getAdminToken(context).isNotBlank()

    suspend fun loadFlags() = withContext(Dispatchers.IO) {
        runCatching {
            val c = java.net.URL("$SITE/api/flags").openConnection()
            c.connectTimeout = 8000; c.readTimeout = 8000
            val o = JSONObject(c.getInputStream().bufferedReader().use { it.readText() })
            ui2Flag.value = o.optBoolean("ui2")
        }
    }

    fun openSponsorLogin(context: Context) {
        runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("$SITE/sponsor")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
    }

    // page end: every 2nd time a window (counter stays on the phone)
    private const val PREFS = "mk_boost"
    fun nextBottomCount(context: Context): Int {
        val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val n = p.getInt("bottom_n", 0) + 1
        p.edit().putInt("bottom_n", n).apply()
        return n
    }
}

/** 1. personal story key of a trusted person (typed into the story form, stays on the phone). */
object StoryKeyStore {
    private const val PREFS = "mk_story_key"
    var key by mutableStateOf("")
        private set
    var name by mutableStateOf("")
        private set

    fun load(context: Context) {
        val p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        key = p.getString("key", "") ?: ""
        name = p.getString("name", "") ?: ""
    }

    fun valid(k: String = key) = Regex("^[a-f0-9]{32,64}$").matches(k)

    fun save(context: Context, k: String, n: String = "") {
        key = k.trim().lowercase()
        name = n
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString("key", key).putString("name", n).apply()
    }

    /** Asks the server if the key is right; returns the name or null. */
    suspend fun check(k: String): String? = withContext(Dispatchers.IO) {
        runCatching {
            val c = java.net.URL("$SITE/api/stories?quota=1").openConnection() as java.net.HttpURLConnection
            c.connectTimeout = 8000; c.readTimeout = 8000
            c.setRequestProperty("x-story-key", k.trim().lowercase())
            val o = JSONObject(c.inputStream.bufferedReader().use { it.readText() })
            if (o.optBoolean("vip")) o.optString("name") else null
        }.getOrNull()
    }
}

/** Further pictures/videos of a trusted person (the first one is the normal story picture). */
object StoryExtraDraft {
    val uris = mutableStateListOf<String>()
    private const val MAX_IMAGE = 5 * 1024 * 1024
    private const val MAX_VIDEO = 50 * 1024 * 1024

    fun addTo(builder: MultipartBody.Builder) {
        val ctx = KiezBoost.appContext ?: return
        if (!StoryKeyStore.valid()) return
        uris.take(9).forEachIndexed { i, u ->
            runCatching {
                val uri = Uri.parse(u)
                val mime = ctx.contentResolver.getType(uri) ?: "image/jpeg"
                val bytes = ctx.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: return@runCatching
                val video = mime.startsWith("video/")
                if (bytes.size > (if (video) MAX_VIDEO else MAX_IMAGE)) return@runCatching
                val ext = when { mime.contains("png") -> "png"; mime.contains("webp") -> "webp"; mime.contains("webm") -> "webm"; video -> "mp4"; else -> "jpg" }
                builder.addFormDataPart("file", "extra_${i + 2}.$ext", bytes.toRequestBody(mime.toMediaType()))
            }
        }
    }

    fun clear() = uris.clear()
}

/** Row in the story form: key field + "more pictures/videos" for the trusted person. */
@Composable
fun StoryKeyFields(language: AppLanguage) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var open by remember { mutableStateOf(false) }
    var input by remember { mutableStateOf("") }
    var msg by remember { mutableStateOf("") }
    val picker = androidx.activity.compose.rememberLauncherForActivityResult(
        androidx.activity.result.contract.ActivityResultContracts.PickMultipleVisualMedia(9)
    ) { list -> list.forEach { u -> if (StoryExtraDraft.uris.size < 9) StoryExtraDraft.uris.add(u.toString()) } }

    if (StoryKeyStore.valid()) {
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(Color(0xFFE8F5E9)).padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("🔑 " + pk(language, "Vertrauens-Konto", "Güvenilir hesap") + (if (StoryKeyStore.name.isNotBlank()) " · ${StoryKeyStore.name}" else "") + ": " +
                pk(language, "ohne Tageslimit, bis 10 Bilder/Videos, sofort online.", "günlük sınır yok, 10 resim/videoya kadar, hemen yayında."),
                fontSize = 12.sp, color = Color(0xFF1B5E20), fontWeight = FontWeight.SemiBold)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = { picker.launch(androidx.activity.result.PickVisualMediaRequest(androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia.ImageAndVideo)) }) {
                    Text("➕ " + pk(language, "Weitere Bilder/Videos", "Başka resim/video ekle") + " (${StoryExtraDraft.uris.size}/9)", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
                if (StoryExtraDraft.uris.isNotEmpty()) TextButton(onClick = { StoryExtraDraft.clear() }) { Text("✕", fontSize = 12.sp) }
            }
            if (StoryExtraDraft.uris.isNotEmpty()) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    items(StoryExtraDraft.uris.toList()) { u -> AsyncImage(model = u, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.size(48.dp).clip(RoundedCornerShape(8.dp))) }
                }
            }
        }
        return
    }
    Text(
        "🔑 " + pk(language, "Vertrauens-Schlüssel", "Güven anahtarı") + if (open) " ▲" else " ▼",
        fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.clickable { open = !open }.padding(vertical = 4.dp)
    )
    if (open) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            OutlinedTextField(input, { input = it.take(64) }, singleLine = true, label = { Text(pk(language, "Schlüssel vom Admin", "Admin'den gelen anahtar"), fontSize = 11.sp) }, modifier = Modifier.weight(1f))
            TextButton(onClick = {
                val k = input.trim().lowercase()
                if (!StoryKeyStore.valid(k)) { msg = pk(language, "Schlüssel ungültig.", "Anahtar geçersiz."); return@TextButton }
                scope.launch {
                    val n = StoryKeyStore.check(k)
                    if (n != null) { StoryKeyStore.save(context, k, n); msg = "" } else msg = pk(language, "Schlüssel nicht gefunden.", "Anahtar bulunamadı.")
                }
            }) { Text("OK", fontWeight = FontWeight.Bold) }
        }
        if (msg.isNotBlank()) Text(msg, fontSize = 11.sp, color = TrRed)
    }
}

// ---------------- data: /api/sponsor-stories ----------------

data class SponsorStoryMedia(val url: String, val isVideo: Boolean, val caption: String, val createdAt: Long)
data class SponsorStoryGroup(val id: String, val name: String, val logo: String, val image: String, val media: List<SponsorStoryMedia>)
data class SponsorDeal(val adId: String, val name: String, val what: String, val price: String, val old: String, val url: String, val isVideo: Boolean, val ends: Long)

object SponsorStoriesRepo {
    private val _groups = MutableStateFlow<List<SponsorStoryGroup>>(emptyList())
    val groups: StateFlow<List<SponsorStoryGroup>> = _groups.asStateFlow()
    private val _deals = MutableStateFlow<List<SponsorDeal>>(emptyList())
    val deals: StateFlow<List<SponsorDeal>> = _deals.asStateFlow()

    private fun abs(u: String) = if (u.startsWith("/")) SITE + u else u

    suspend fun load() = withContext(Dispatchers.IO) {
        runCatching {
            val c = java.net.URL("$SITE/api/sponsor-stories").openConnection()
            c.connectTimeout = 10000; c.readTimeout = 10000
            val o = JSONObject(c.getInputStream().bufferedReader().use { it.readText() })
            val gs = o.optJSONArray("sponsors")
            val groups = (0 until (gs?.length() ?: 0)).mapNotNull { i ->
                val g = gs!!.optJSONObject(i) ?: return@mapNotNull null
                val ms = g.optJSONArray("media")
                val media = (0 until (ms?.length() ?: 0)).mapNotNull { j ->
                    val m = ms!!.optJSONObject(j) ?: return@mapNotNull null
                    SponsorStoryMedia(abs(m.optString("url")), m.optString("type") == "video", m.optString("caption"), m.optLong("created_at"))
                }
                if (media.isEmpty()) null else SponsorStoryGroup(g.optString("id"), g.optString("name"), abs(g.optString("logo")), abs(g.optString("image")), media)
            }
            val ds = o.optJSONArray("deals")
            val deals = (0 until (ds?.length() ?: 0)).mapNotNull { i ->
                val d = ds!!.optJSONObject(i) ?: return@mapNotNull null
                SponsorDeal(d.optString("ad_id"), d.optString("name"), d.optString("what"), d.optString("price"), d.optString("old"), abs(d.optString("url")), d.optString("type") == "video", d.optLong("ends"))
            }
            _groups.value = groups
            _deals.value = deals
        }
    }
}

/** Loads the sponsor stories now and every 5 minutes (call once in the main screen). */
@Composable
fun SponsorStoriesLoader() {
    val context = LocalContext.current
    LaunchedEffect(Unit) {
        KiezBoost.init(context)
        while (true) {
            if (KiezBoost.on(context)) SponsorStoriesRepo.load()
            KiezBoost.loadFlags()
            BlackFridayRepo.load()
            delay(5 * 60_000L)
        }
    }
}

// ---------------- glow + spin helpers ----------------

@Composable
private fun glow(): Float {
    val t = rememberInfiniteTransition(label = "glow")
    val v by t.animateFloat(0f, 1f, infiniteRepeatable(tween(1100, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "glowv")
    return v
}

private fun Modifier.glowBox(v: Float, color: Color, shape: androidx.compose.ui.graphics.Shape) =
    this.shadow(elevation = (4 + 14 * v).dp, shape = shape, ambientColor = color, spotColor = color)

// ---------------- 3. sponsor circles + viewer ----------------

@Composable
fun SponsorStoryCircle(group: SponsorStoryGroup, onClick: () -> Unit) {
    val nImg = group.media.count { !it.isVideo }
    val nVid = group.media.size - nImg
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(70.dp).clickable { onClick() }) {
        Box(contentAlignment = Alignment.BottomEnd) {
            Box(
                Modifier.size(62.dp).clip(CircleShape)
                    .background(Brush.sweepGradient(listOf(Gold, Color(0xFFFF5722), TrRed, Gold))).padding(3.dp),
                contentAlignment = Alignment.Center
            ) {
                AsyncImage(
                    model = group.logo.ifBlank { group.image.ifBlank { group.media.firstOrNull { !it.isVideo }?.url } },
                    contentDescription = group.name, contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize().clip(CircleShape).background(Color.White)
                )
            }
            Box(Modifier.clip(RoundedCornerShape(10.dp)).background(TrRed).border(2.dp, Color.White, RoundedCornerShape(10.dp)).padding(horizontal = 5.dp)) {
                Text("${group.media.size}", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(group.name, fontSize = 10.5.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Medium)
        Text((if (nImg > 0) "$nImg📷" else "") + (if (nVid > 0) " $nVid🎬" else ""), fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun SponsorStoryViewer(groups: List<SponsorStoryGroup>, startGroup: Int, startMedia: Int, language: AppLanguage, onClose: () -> Unit) {
    var gi by remember { mutableIntStateOf(startGroup.coerceIn(0, (groups.size - 1).coerceAtLeast(0))) }
    var mi by remember { mutableIntStateOf(startMedia) }
    val shareCtx = LocalContext.current // 2026-11-23 (v1.51): share button
    val shareScope = rememberCoroutineScope()
    var shareBusy by remember { mutableStateOf(false) }
    val g = groups.getOrNull(gi) ?: run { onClose(); return }
    val m = g.media.getOrNull(mi) ?: g.media.first()
    fun step(d: Int) {
        val n = mi + d
        when {
            n >= g.media.size -> if (gi + 1 < groups.size) { gi++; mi = 0 } else onClose()
            n < 0 -> if (gi > 0) { gi--; mi = groups[gi].media.size - 1 }
            else -> mi = n
        }
    }
    val progress = remember { Animatable(0f) }
    LaunchedEffect(gi, mi) {
        progress.snapTo(0f)
        if (!m.isVideo) {
            progress.animateTo(1f, tween(6000))
            step(1)
        } else {
            delay(60_000) // safety: a video ends earlier through onCompletion
            step(1)
        }
    }
    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(Modifier.fillMaxSize(), color = Color.Black) {
            Column(Modifier.fillMaxSize().systemBarsPadding().padding(10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    g.media.forEachIndexed { i, _ ->
                        val f = when { i < mi -> 1f; i == mi -> if (m.isVideo) 1f else progress.value; else -> 0f }
                        Box(Modifier.weight(1f).height(3.dp).clip(RoundedCornerShape(2.dp)).background(Color.White.copy(alpha = 0.3f))) {
                            Box(Modifier.fillMaxWidth(f).height(3.dp).background(Color.White))
                        }
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    AsyncImage(model = g.logo.ifBlank { g.image }, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.size(38.dp).clip(CircleShape).background(Color.White))
                    Column(Modifier.weight(1f)) {
                        Text(g.name, color = Color.White, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        val min = ((System.currentTimeMillis() - m.createdAt) / 60000).coerceAtLeast(1)
                        Text("🤝 Sponsor · " + if (min < 60) "$min min" else "${min / 60} h", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                    }
                    TextButton(onClick = onClose) { Text("✕", color = Color.White, fontSize = 22.sp) }
                }
                Box(Modifier.fillMaxWidth().weight(1f).clip(RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) {
                    if (m.isVideo) {
                        AndroidView(
                            factory = { ctx -> VideoView(ctx) },
                            update = { v ->
                                if (v.tag != m.url) {
                                    v.tag = m.url
                                    v.setVideoURI(Uri.parse(m.url))
                                    v.setOnCompletionListener { step(1) }
                                    v.setOnPreparedListener { it.start() }
                                }
                            },
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        AsyncImage(model = m.url, contentDescription = m.caption, contentScale = ContentScale.Fit, modifier = Modifier.fillMaxSize())
                    }
                    Row(Modifier.fillMaxSize()) {
                        Box(Modifier.weight(0.35f).fillMaxSize().clickable { step(-1) })
                        Spacer(Modifier.weight(0.3f))
                        Box(Modifier.weight(0.35f).fillMaxSize().clickable { step(1) })
                    }
                }
                if (m.caption.isNotBlank()) Text(m.caption, color = Color.White, fontSize = 15.sp)
                Box(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Gold).clickable {
                        val id = g.id
                        onClose()
                        SponsorInfoState.showById(id)
                    }.padding(12.dp),
                    contentAlignment = Alignment.Center
                ) { Text("🤝 " + pk(language, "Zum Sponsor", "Sponsora git", "Open sponsor") + " →", color = Navy, fontWeight = FontWeight.ExtraBold) }
                // 2026-11-23 (owner "UYGULA 2", v1.51): share this picture/video (sponsor page + My Kiez Berlin + app link)
                Box(
                    Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF1F6FEB)).clickable(enabled = !shareBusy) {
                        shareBusy = true
                        val item = m
                        val group = g
                        shareScope.launch {
                            val media = withContext(Dispatchers.IO) { com.example.util.StoryShareHelper.prepareSponsorMedia(shareCtx, item.url, item.isVideo) }
                            com.example.util.StoryShareHelper.startSponsorShare(shareCtx, com.example.util.StoryShareHelper.sponsorText(group.name, group.id, item.caption, language == AppLanguage.TURKISH), media)
                            shareBusy = false
                        }
                    }.padding(12.dp),
                    contentAlignment = Alignment.Center
                ) { Text(if (shareBusy) "⏳" else "📤 " + pk(language, "Teilen", "Paylaş", "Share"), color = Color.White, fontWeight = FontWeight.ExtraBold) }
            }
        }
    }
}

// ---------------- 4./5. offers ----------------

@Composable
fun dealTotal(storyDeals: Int = 0): Int {
    val d by SponsorStoriesRepo.deals.collectAsState()
    return storyDeals + d.size
}

/** Glowing chip "🏷️ N Angebote" (first chip above the stories). */
@Composable
fun DealsChip(language: AppLanguage, storyDeals: Int) {
    val v = glow()
    val n = dealTotal(storyDeals)
    Box(
        Modifier.glowBox(v, TrRed, RoundedCornerShape(16.dp)).clip(RoundedCornerShape(16.dp)).background(TrRed)
            .clickable { KiezBoost.navRequest.value = AppScreen.DEALS }.padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Text("🏷️ " + if (n > 0) "$n " + pk(language, "Angebote", "İndirim", "Deals") else pk(language, "Angebote", "İndirimler", "Deals"),
            color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
    }
}

/** Big glowing banner on the home page. */
@Composable
fun DealsBanner(language: AppLanguage, storyDeals: Int) {
    val v = glow()
    val n = dealTotal(storyDeals)
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp).glowBox(v, Gold, RoundedCornerShape(16.dp)).clip(RoundedCornerShape(16.dp))
            .background(Brush.linearGradient(listOf(Color(0xFFFFE082), Gold))).clickable { KiezBoost.navRequest.value = AppScreen.DEALS }
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("🏷️", fontSize = 30.sp)
        Column(Modifier.weight(1f)) {
            Text(if (n > 0) pk(language, "$n aktuelle Angebote im Kiez", "Mahallede $n güncel indirim", "$n current deals") else pk(language, "Aktuelle Angebote im Kiez", "Mahalledeki güncel indirimler", "Current deals"),
                fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = Navy)
            Text(pk(language, "Rabatte unserer Sponsoren & Nachbarn – jetzt ansehen", "Sponsorlarımızın ve komşularımızın indirimleri – hemen bak", "Discounts from sponsors & neighbours"), fontSize = 12.sp, color = Navy.copy(alpha = 0.85f))
        }
        Text("→", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Navy)
    }
}

/** Sponsor offers (price in the text of a sponsor upload) inside "Mahalle hikâyelerindeki güncel indirimler". */
@Composable
fun SponsorDealsRow(language: AppLanguage) {
    val deals by SponsorStoriesRepo.deals.collectAsState()
    val groups by SponsorStoriesRepo.groups.collectAsState()
    var open by remember { mutableStateOf<Pair<Int, Int>?>(null) }
    if (deals.isEmpty()) return
    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        items(deals) { d ->
            Card(
                Modifier.width(180.dp).clickable {
                    groups.forEachIndexed { gi, g -> g.media.forEachIndexed { mi, m -> if (m.url == d.url) open = gi to mi } }
                },
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(2.dp, Gold),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                if (!d.isVideo) AsyncImage(model = d.url, contentDescription = d.what, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxWidth().height(100.dp))
                else Box(Modifier.fillMaxWidth().height(100.dp).background(Gold.copy(alpha = 0.18f)), contentAlignment = Alignment.Center) { Text("🎬", fontSize = 36.sp) }
                Column(Modifier.padding(10.dp)) {
                    Text(d.what, fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(d.price, fontWeight = FontWeight.Black, fontSize = 18.sp, color = TrRed)
                        if (d.old.isNotBlank()) Text(d.old, fontSize = 12.sp, textDecoration = TextDecoration.LineThrough, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Text("🤝 ${d.name}", fontSize = 10.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
    open?.let { (gi, mi) -> SponsorStoryViewer(groups, gi, mi, language) { open = null } }
}

// ---------------- 2. two big sponsor buttons ----------------

@Composable
fun DualSponsorButtons(language: AppLanguage, onOpenAll: () -> Unit, onOpenTr: () -> Unit, allCount: Int, trCount: Int) {
    val scope = rememberCoroutineScope()
    val rotAll = remember { Animatable(0f) }
    val rotTr = remember { Animatable(0f) }
    val v = glow()
    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        DualButton(Modifier.weight(1f), "🤝", pk(language, "Alle Sponsoren", "Tüm sponsorlar", "All sponsors"), allCount,
            Brush.linearGradient(listOf(Blue, Color(0xFF2563EB))), Gold, v, rotAll.value) {
            scope.launch { rotAll.snapTo(0f); rotAll.animateTo(360f, tween(650, easing = FastOutSlowInEasing)); onOpenAll() }
        }
        DualButton(Modifier.weight(1f), "🇹🇷", pk(language, "Sponsoren aus der Türkei", "Türkiye Sponsorları", "Sponsors from Turkey"), trCount,
            Brush.linearGradient(listOf(Color(0xFFB00012), TrRed)), TrRed, v, rotTr.value) {
            scope.launch { rotTr.snapTo(0f); rotTr.animateTo(360f, tween(650, easing = FastOutSlowInEasing)); onOpenTr() }
        }
    }
}

@Composable
private fun DualButton(modifier: Modifier, icon: String, label: String, count: Int, bg: Brush, glowColor: Color, v: Float, rotation: Float, onClick: () -> Unit) {
    Column(
        modifier.rotate(rotation).glowBox(v, glowColor, RoundedCornerShape(22.dp)).clip(RoundedCornerShape(22.dp)).background(bg)
            .clickable { onClick() }.heightIn(min = 140.dp).padding(14.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterVertically)
    ) {
        Text(icon, fontSize = 40.sp)
        Text(label, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, textAlign = TextAlign.Center, lineHeight = 19.sp)
        Text(if (count > 0) "$count →" else "→", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
    }
}

// ---------------- 6. werben boxes ----------------

@Composable
fun WerbenCta(language: AppLanguage, compact: Boolean = false, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val v = glow()
    Column(
        modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Brush.linearGradient(listOf(Navy, Blue))).padding(if (compact) 10.dp else 14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text("📣 " + pk(language, "Ihr Betrieb in ganz Berlin sichtbar?", "İşletmeniz tüm Berlin'de görünsün mü?", "Your business visible all over Berlin?"),
            color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = if (compact) 13.sp else 15.sp)
        if (!compact) Text(pk(language, "Werden Sie Kiez-Partner – ab 29 €/Monat, Web + App.", "Kiez partnerimiz olun – aylık 29 €'dan başlayan fiyatlarla, web + uygulama.", "Become a Kiez partner – from 29 €/month, web + app."),
            color = Color.White.copy(alpha = 0.85f), fontSize = 12.sp)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.glowBox(v, Gold, RoundedCornerShape(20.dp)).clip(RoundedCornerShape(20.dp)).background(Gold).clickable { KiezBoost.werbenRequest.value = true }.padding(horizontal = 12.dp, vertical = 7.dp)) {
                Text("🚀 " + pk(language, "Jetzt werben", "Hemen reklam ver", "Advertise now"), color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
            }
            Box(Modifier.glowBox(v, Color.White, RoundedCornerShape(20.dp)).clip(RoundedCornerShape(20.dp)).background(Color.White).clickable { KiezBoost.werbenRequest.value = true }.padding(horizontal = 12.dp, vertical = 7.dp)) {
                Text("🤝 " + pk(language, "Mit uns arbeiten?", "Bizimle çalışın", "Work with us?"), color = Blue, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, maxLines = 1)
            }
        }
        Text("🔑 " + pk(language, "Sponsor-Login", "Sponsor girişi", "Sponsor login"), color = Color.White, fontSize = 11.sp, textDecoration = TextDecoration.Underline,
            modifier = Modifier.clickable { KiezBoost.openSponsorLogin(context) })
    }
}

@Composable
fun WerbenPopup(language: AppLanguage, onClose: () -> Unit) {
    Dialog(onDismissRequest = onClose) {
        Box(Modifier.clip(RoundedCornerShape(20.dp)).background(Brush.linearGradient(listOf(Navy, Blue))).padding(8.dp)) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) { TextButton(onClick = onClose) { Text("✕", color = Color.White, fontSize = 20.sp) } }
                Text("📣", fontSize = 44.sp)
                WerbenCta(language)
            }
        }
    }
}


// ---------------- 7. Black Friday (2026-11-22, owner) ----------------
// The first 100 sponsors 3 months free, then Kiez Basic 29 / Plus 49 / Premium 89 € a month – MONATLICH KÜNDBAR.
// Until 30.11.2026. 20 "Gründungspartner" places count as taken. Window once a day + black strip on the home page.

data class BlackFridayState(val active: Boolean, val taken: Int, val left: Int, val total: Int)

object BlackFridayRepo {
    val state = mutableStateOf<BlackFridayState?>(null)
    suspend fun load() = withContext(Dispatchers.IO) {
        runCatching {
            val c = java.net.URL("$SITE/api/blackfriday").openConnection()
            c.connectTimeout = 8000; c.readTimeout = 8000
            val o = JSONObject(c.getInputStream().bufferedReader().use { it.readText() })
            state.value = BlackFridayState(o.optBoolean("active"), o.optInt("taken"), o.optInt("left"), o.optInt("total", 100))
        }
    }
    fun shouldShowToday(context: Context): Boolean {
        val p = context.getSharedPreferences("mk_boost", Context.MODE_PRIVATE)
        val day = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
        if (p.getString("bf_day", "") == day) return false
        p.edit().putString("bf_day", day).apply()
        return true
    }
}

private fun bfTexts(language: AppLanguage, s: BlackFridayState) = Triple(
    pk(language, "🖤 BLACK FRIDAY: 3 Monate GRATIS werben", "🖤 BLACK FRIDAY: 3 ay ÜCRETSİZ reklam", "🖤 BLACK FRIDAY: 3 months FREE advertising"),
    pk(language, "${s.taken} von ${s.total} Plätzen sind schon weg – nur noch ${s.left} frei! Sichere dir jetzt deinen Platz: 3 Monate gratis, danach ab 29 €/Monat.",
        "${s.total} yerden ${s.taken} tanesi doldu – sadece ${s.left} yer kaldı! Acele et, yerini şimdi ayırt: 3 ay ücretsiz, sonra aylık 29 €'dan başlayan fiyatlar.",
        "${s.taken} of ${s.total} places are gone – only ${s.left} left! Claim yours now: 3 months free, then from 29 €/month."),
    pk(language, "MONATLICH KÜNDBAR · bis 30.11.", "HER AY İPTAL EDİLEBİLİR · 30.11.'e kadar", "CANCEL MONTHLY · until 30 Nov")
)

/** Black strip on the home page. */
@Composable
fun BlackFridayStrip(language: AppLanguage) {
    val s = BlackFridayRepo.state.value ?: return
    if (!s.active) return
    val v = glow()
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp).glowBox(v, Gold, RoundedCornerShape(16.dp)).clip(RoundedCornerShape(16.dp))
            .background(Brush.linearGradient(listOf(Color.Black, Color(0xFF2B2100)))).clickable { KiezBoost.werbenRequest.value = true }.padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(bfTexts(language, s).first, color = Gold, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, modifier = Modifier.weight(1f))
        Text(pk(language, "Nur noch ${s.left} →", "Sadece ${s.left} yer →", "Only ${s.left} left →"), color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
    }
}

/** Window once a day (15 s after the start). */
@Composable
fun BlackFridayPopupHost(language: AppLanguage) {
    val context = LocalContext.current
    var show by remember { mutableStateOf(false) }
    val s = BlackFridayRepo.state.value
    LaunchedEffect(s?.active) {
        if (s?.active == true) {
            delay(15_000)
            if (BlackFridayRepo.shouldShowToday(context)) show = true
        }
    }
    if (!show || s == null) return
    val (h, t, k) = bfTexts(language, s)
    val v = glow()
    Dialog(onDismissRequest = { show = false }) {
        Column(
            Modifier.glowBox(v, Gold, RoundedCornerShape(20.dp)).clip(RoundedCornerShape(20.dp)).background(Brush.linearGradient(listOf(Color.Black, Color(0xFF1F1F1F), Color(0xFF3A2C00)))).padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) { TextButton(onClick = { show = false }) { Text("✕", color = Color.White, fontSize = 18.sp) } }
            Text(h, color = Gold, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, textAlign = TextAlign.Center)
            Box(Modifier.fillMaxWidth().height(10.dp).clip(RoundedCornerShape(5.dp)).background(Color(0xFF333333))) {
                Box(Modifier.fillMaxWidth(s.taken.toFloat() / s.total.coerceAtLeast(1)).height(10.dp).background(Brush.horizontalGradient(listOf(Gold, Color(0xFFFF5722)))))
            }
            Text(t, color = Color.White, fontSize = 14.sp, textAlign = TextAlign.Center)
            Box(Modifier.clip(RoundedCornerShape(20.dp)).background(Gold).padding(horizontal = 12.dp, vertical = 5.dp)) { Text(k, color = Color.Black, fontWeight = FontWeight.Black, fontSize = 12.sp) }
            Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(Gold).clickable { show = false; KiezBoost.werbenRequest.value = true }.padding(12.dp), contentAlignment = Alignment.Center) {
                Text(pk(language, "Jetzt Gratis-Platz sichern →", "Ücretsiz yerini hemen ayırt →", "Claim your free place →"), color = Color.Black, fontWeight = FontWeight.Black)
            }
        }
    }
}
