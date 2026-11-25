package com.example.ui.components

// 2026-11-25 (owner "UYGULA"): the update APK is downloaded INSIDE the app. Before, the link went to
// "any app that opens links" – on many phones an ad-filled downloader app opened strange pages.
// While downloading, our own cards are shown in turn: first the cards that introduce the app, then
// Black Friday (while it runs). When the file is complete, Android's own installer opens.
// If the download fails, the link is opened in Chrome only (never in a downloader app).

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.FileProvider
import com.example.data.model.AppLanguage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.io.File

private data class UpdCard(val icon: String, val title: String, val text: String, val c1: Color, val c2: Color)

private fun t(l: AppLanguage, de: String, tr: String, en: String) = when (l) { AppLanguage.TURKISH -> tr; AppLanguage.ENGLISH -> en; else -> de }

private fun cards(l: AppLanguage): List<UpdCard> {
    val red = Color(0xFFE30613); val navy = Color(0xFF0B1F3A); val green = Color(0xFF0F766E); val blue = Color(0xFF1D4ED8)
    val list = mutableListOf(
        UpdCard("📍", t(l, "Dein Kiez. Live.", "Mahallen. Canlı.", "Your Kiez. Live."),
            t(l, "Berlin-News, BVG-Störungen, Polizei und Events – alles aus deinem Kiez an einem Ort.", "Berlin haberleri, BVG arızaları, polis ve etkinlikler – mahallendeki her şey tek yerde.", "Berlin news, BVG delays, police and events – everything from your Kiez in one place."), red, navy),
        UpdCard("🎬", t(l, "Kiez-Stories", "Kiez Story'leri", "Kiez stories"),
            t(l, "Kurze Stories aus Neukölln, Kreuzberg, Wedding & ganz Berlin. Teile deine eigene!", "Neukölln, Kreuzberg, Wedding ve tüm Berlin'den kısa story'ler. Kendi story'ni de paylaş!", "Short stories from Neukölln, Kreuzberg, Wedding & all Berlin. Share your own!"), navy, blue),
        UpdCard("🛍️", t(l, "Angebote aus dem Kiez", "Mahalleden fırsatlar", "Deals from the Kiez"),
            t(l, "Cafés, Läden und Handwerker aus deiner Nachbarschaft – mit Gutscheinen und Aktionen.", "Komşuluğundaki kafeler, dükkânlar ve ustalar – kuponlar ve kampanyalarla.", "Cafés, shops and craftsmen nearby – with coupons and offers."), green, navy),
        UpdCard("💬", t(l, "WhatsApp-Gruppen", "WhatsApp grupları", "WhatsApp groups"),
            t(l, "Tritt der Gruppe deines Kiez bei und verpasse nichts mehr.", "Mahallenin grubuna katıl, hiçbir şeyi kaçırma.", "Join your Kiez group and never miss a thing."), Color(0xFF128C7E), Color(0xFF075E54)),
    )
    val bf = BlackFridayRepo.state.value
    if (bf != null && bf.active) list.add(UpdCard("🖤", t(l, "BLACK FRIDAY: 3 Monate gratis werben", "BLACK FRIDAY: 3 ay ücretsiz reklam", "BLACK FRIDAY: 3 months free ads"),
        t(l, "Nur noch ${bf.left} von ${bf.total} Plätzen frei – für dein Geschäft auf mykiezberlin.com.", "${bf.total} yerden sadece ${bf.left} yer kaldı – işletmen için mykiezberlin.com'da.", "Only ${bf.left} of ${bf.total} places left – for your business on mykiezberlin.com."), Color.Black, Color(0xFF2B2100)))
    else list.add(UpdCard("📣", t(l, "Dein Geschäft in ganz Berlin", "İşletmen tüm Berlin'de", "Your business all over Berlin"),
        t(l, "Start: 3 Monate ab 19 €/Monat in App & Webseite – mykiezberlin.com/werben", "Başlangıç: 3 ay aylık 19 €'dan, uygulama ve sitede – mykiezberlin.com/werben", "Start: 3 months from 19 €/month in app & website – mykiezberlin.com/werben"), red, Color(0xFF7F1D1D)))
    return list
}

/** Opens the link in Chrome only (fallback); if Chrome is missing, the normal chooser. */
fun openInChrome(context: Context, url: String) {
    val i = Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try { context.startActivity(Intent(i).setPackage("com.android.chrome")) } catch (e: Exception) { runCatching { context.startActivity(i) } }
}

private fun install(context: Context, f: File) {
    val uri = FileProvider.getUriForFile(context, context.packageName + ".fileprovider", f)
    val i = Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(i)
}

/** Download dialog with progress + our cards. [onClose] when the user closes it (or the installer opened). */
@Composable
fun InAppUpdateDialog(apkUrl: String, language: AppLanguage, onClose: () -> Unit) {
    val context = LocalContext.current
    val list = remember(language) { cards(language) }
    var idx by remember { mutableIntStateOf(0) }
    var progress by remember { mutableFloatStateOf(0f) }
    var state by remember { mutableStateOf("load") } // load | done | fail
    var file by remember { mutableStateOf<File?>(null) }

    LaunchedEffect(Unit) { runCatching { BlackFridayRepo.load() } }
    LaunchedEffect(Unit) { while (true) { delay(3500); idx = (idx + 1) % list.size } }
    LaunchedEffect(apkUrl) {
        val f = withContext(Dispatchers.IO) {
            runCatching {
                val dir = File(context.cacheDir, "update").apply { mkdirs() }
                dir.listFiles()?.forEach { it.delete() }
                val out = File(dir, "MyKiezBerlin-update.apk")
                val c = java.net.URL(apkUrl).openConnection() as java.net.HttpURLConnection
                c.connectTimeout = 15000; c.readTimeout = 30000; c.instanceFollowRedirects = true
                val total = c.contentLengthLong
                c.inputStream.use { inp ->
                    out.outputStream().use { o ->
                        val buf = ByteArray(64 * 1024); var done = 0L
                        while (true) { val n = inp.read(buf); if (n < 0) break; o.write(buf, 0, n); done += n; if (total > 0) progress = done.toFloat() / total }
                    }
                }
                if (out.length() < 1_000_000) error("too small") // an error page, not an APK
                out
            }.getOrNull()
        }
        if (f != null) { file = f; progress = 1f; state = "done"; runCatching { install(context, f) }.onFailure { state = "fail" } } else state = "fail"
    }

    Dialog(onDismissRequest = {}, properties = DialogProperties(dismissOnClickOutside = false)) {
        Column(Modifier.clip(RoundedCornerShape(22.dp)).background(Color.White).padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            AnimatedContent(targetState = idx, label = "updcard") { i ->
                val c = list[i]
                Column(
                    Modifier.fillMaxWidth().heightIn(min = 230.dp).clip(RoundedCornerShape(18.dp)).background(Brush.linearGradient(listOf(c.c1, c.c2))).padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center
                ) {
                    Text(c.icon, fontSize = 46.sp)
                    Spacer(Modifier.height(8.dp))
                    Text(c.title, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(8.dp))
                    Text(c.text, color = Color.White.copy(alpha = 0.92f), fontSize = 14.sp, textAlign = TextAlign.Center)
                }
            }
            Spacer(Modifier.height(14.dp))
            when (state) {
                "load" -> {
                    Text(t(language, "Update wird geladen … ${(progress * 100).toInt()} %", "Güncelleme indiriliyor … %${(progress * 100).toInt()}", "Downloading update … ${(progress * 100).toInt()} %"), fontWeight = FontWeight.Bold, color = Color(0xFF111827))
                    Spacer(Modifier.height(8.dp))
                    LinearProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)), color = Color(0xFFE30613))
                }
                "done" -> {
                    Text(t(language, "Fertig! Bitte auf „Installieren“ tippen.", "Hazır! Lütfen „Yükle“ye dokun.", "Done! Please tap “Install”."), fontWeight = FontWeight.Bold, color = Color(0xFF15803D))
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = { file?.let { f -> runCatching { install(context, f) } } }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF15803D))) {
                        Text(t(language, "Installieren", "Yükle", "Install"), color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
                else -> {
                    Text(t(language, "Download nicht möglich. Im Browser (Chrome) öffnen?", "İndirilemedi. Tarayıcıda (Chrome) açılsın mı?", "Download failed. Open in the browser (Chrome)?"), fontWeight = FontWeight.Bold, color = Color(0xFFB91C1C), textAlign = TextAlign.Center)
                    Spacer(Modifier.height(8.dp))
                    Button(onClick = { openInChrome(context, apkUrl); onClose() }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1D4ED8))) {
                        Text("Chrome", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                TextButton(onClick = onClose) { Text(t(language, "Schließen", "Kapat", "Close"), color = Color(0xFF6B7280)) }
            }
        }
    }
}
