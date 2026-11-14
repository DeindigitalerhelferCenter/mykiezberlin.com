package com.example.ui.components

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AppLanguage
import com.example.ui.theme.BerlinRed
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/*
 * 2026-11-14 (owner: "the app is a bit confusing for new users"):
 *  - ⓘ next to the headings: what can I do here, is it free, what can I upload, what can I write/share
 *  - short tour (4 steps) on the first start, again via the menu "Hilfe / Yardım"
 * The texts come from https://mykiezberlin.com/help.json (same as the web), so they can change without a new APK.
 */

object HelpRepository {
    private val client = OkHttpClient.Builder().connectTimeout(8, TimeUnit.SECONDS).readTimeout(10, TimeUnit.SECONDS).build()
    @Volatile private var cache: JSONObject? = null

    suspend fun load(): JSONObject? = cache ?: withContext(Dispatchers.IO) {
        try {
            client.newCall(Request.Builder().url("https://mykiezberlin.com/help.json").header("User-Agent", "MyKiezBerlin-Android/2.0").build()).execute().use { r ->
                if (!r.isSuccessful) null else JSONObject(r.body?.string() ?: "{}").also { cache = it }
            }
        } catch (_: Exception) {
            null
        }
    }
}

private fun JSONObject?.tx(language: AppLanguage): String {
    if (this == null) return ""
    val key = when (language) { AppLanguage.TURKISH -> "tr"; AppLanguage.ENGLISH -> "en"; else -> "de" }
    return optString(key).ifBlank { optString("de") }
}

object HelpState {
    /** topic key of help.json, "" = closed, "#tour" = tour */
    val open = mutableStateOf("")
    val tourStep = mutableStateOf(0)
    private const val PREFS = "mk_help"
    fun tourDone(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean("tour_done_v1", false)
    fun setTourDone(context: Context) { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean("tour_done_v1", true).apply() }
    fun startTour() { tourStep.value = 0; open.value = "#tour" }
}

/** Small round ⓘ button; opens the info window of [topic]. */
@Composable
fun InfoButton(topic: String, language: AppLanguage, modifier: Modifier = Modifier) {
    Box(
        modifier.padding(start = 4.dp).size(22.dp).clip(CircleShape).background(Color(0xFF1A73E8).copy(alpha = 0.13f))
            .clickable { HelpState.open.value = topic },
        contentAlignment = Alignment.Center
    ) { Text("i", color = Color(0xFF1A73E8), fontWeight = FontWeight.ExtraBold, fontSize = 13.sp) }
}

/** Put once into the app (MainActivity, next to SponsorInfoHost). Shows the info windows and the first-start tour. */
@Composable
fun HelpHost(language: AppLanguage) {
    val context = LocalContext.current
    val open by HelpState.open
    var data by remember { mutableStateOf<JSONObject?>(null) }
    LaunchedEffect(Unit) {
        data = HelpRepository.load()
        if (!HelpState.tourDone(context) && data != null) HelpState.startTour()
    }
    LaunchedEffect(open) { if (open.isNotBlank() && data == null) data = HelpRepository.load() }
    if (open.isBlank()) return
    fun L(de: String, tr: String, en: String) = when (language) { AppLanguage.TURKISH -> tr; AppLanguage.ENGLISH -> en; else -> de }
    val close = { HelpState.open.value = "" }

    if (open == "#tour") {
        val steps = data?.optJSONArray("tour")
        val n = steps?.length() ?: 0
        val i = HelpState.tourStep.value
        if (n == 0 || i >= n) { HelpState.setTourDone(context); close(); return }
        val s = steps!!.getJSONObject(i)
        AlertDialog(
            onDismissRequest = { HelpState.setTourDone(context); close() },
            title = { Text("${s.optString("icon")} My Kiez Berlin", fontWeight = FontWeight.ExtraBold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text(s.tx(language), fontSize = 16.sp, lineHeight = 23.sp)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        repeat(n) { k -> Box(Modifier.padding(3.dp).size(8.dp).clip(CircleShape).background(if (k == i) BerlinRed else Color.Gray.copy(alpha = 0.35f))) }
                    }
                }
            },
            confirmButton = {
                Button(onClick = { if (i + 1 >= n) { HelpState.setTourDone(context); close() } else HelpState.tourStep.value = i + 1 }, colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)) {
                    Text(if (i + 1 >= n) L("Los geht's", "Başlayalım", "Let's go") + " →" else L("Weiter", "İleri", "Next") + " →", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = { TextButton(onClick = { HelpState.setTourDone(context); close() }) { Text(L("Überspringen", "Geç", "Skip")) } }
        )
        return
    }

    val t = data?.optJSONObject("topics")?.optJSONObject(open)
    AlertDialog(
        onDismissRequest = close,
        confirmButton = { TextButton(onClick = close) { Text("OK", fontWeight = FontWeight.Bold) } },
        dismissButton = { TextButton(onClick = { HelpState.startTour() }) { Text("🧭 " + L("Einführung", "Tanıtım", "Tour")) } },
        title = { Text(if (t != null) "${t.optString("icon")} ${t.optJSONObject("title").tx(language)}" else "ⓘ", fontWeight = FontWeight.ExtraBold) },
        text = {
            if (t == null) {
                Text(if (data == null) L("Keine Verbindung – bitte später noch einmal.", "Bağlantı yok – lütfen sonra tekrar dene.", "No connection – please try again later.") else "…")
            } else {
                Column(Modifier.heightIn(max = 480.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    @Composable
                    fun row(icon: String, label: String, key: String) {
                        val v = t.optJSONObject(key).tx(language)
                        if (v.isBlank()) return
                        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)).padding(10.dp)) {
                            Text("$icon $label", fontWeight = FontWeight.Bold, fontSize = 12.5.sp)
                            Text(v, fontSize = 14.sp, lineHeight = 19.sp)
                        }
                    }
                    row("❓", L("Was ist das?", "Bu nedir?", "What is it?"), "what")
                    row("💶", L("Kostenlos?", "Ücretsiz mi?", "Free?"), "free")
                    row("📤", L("Was kann ich hochladen?", "Neler yükleyebilirim?", "What can I upload?"), "upload")
                    row("✍️", L("Was kann ich schreiben / teilen?", "Neler yazabilir / paylaşabilirim?", "What can I write / share?"), "write")
                    row("ℹ️", L("Gut zu wissen", "Bilmekte fayda var", "Good to know"), "note")
                }
            }
        }
    )
}

/** Info topic (help.json) of a page, or null when the page has none. */
fun screenHelpTopic(screen: com.example.ui.viewmodel.AppScreen): String? = when (screen) {
    com.example.ui.viewmodel.AppScreen.LIVE_BULLETIN -> "live"
    com.example.ui.viewmodel.AppScreen.SPORTS_AND_MARKETS -> "sport"
    com.example.ui.viewmodel.AppScreen.DEALS -> "deals"
    com.example.ui.viewmodel.AppScreen.JOBS -> "jobs"
    com.example.ui.viewmodel.AppScreen.EVENTS -> "events"
    com.example.ui.viewmodel.AppScreen.NOTRUF -> "notruf"
    com.example.ui.viewmodel.AppScreen.TELEFONBUCH -> "telefonbuch"
    com.example.ui.viewmodel.AppScreen.BERLIN_TIPS -> "tips"
    com.example.ui.viewmodel.AppScreen.REPORTER -> "reporter"
    com.example.ui.viewmodel.AppScreen.COMMUNITY -> "community"
    com.example.ui.viewmodel.AppScreen.WERBEN -> "werben"
    com.example.ui.viewmodel.AppScreen.KIEZE -> "kieze"
    com.example.ui.viewmodel.AppScreen.FOOD -> "food"
    com.example.ui.viewmodel.AppScreen.KIEZ_MATCH, com.example.ui.viewmodel.AppScreen.QUIZ -> "quiz"
    else -> null
}
