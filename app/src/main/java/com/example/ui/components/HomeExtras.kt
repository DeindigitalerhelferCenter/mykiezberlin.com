package com.example.ui.components

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.AppLanguage
import com.example.data.repository.AdsRepository
import com.example.data.repository.LiveBerlinFeedRepository
import com.example.data.repository.ServerAd
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/*
 * 2026-11-14 (owner), same as the web (public/sponsor-share-tr.js):
 *  - share every sponsor: link https://mykiezberlin.com/s/<id> (preview with banner); the link opens the sponsor directly
 *  - "Türkiye Sponsorları": every sponsor with region "tr"
 *  - home page: live clock + Berlin weather
 */

private fun pick(language: AppLanguage, de: String, tr: String, en: String) = when (language) {
    AppLanguage.TURKISH -> tr
    AppLanguage.ENGLISH -> en
    else -> de
}

/** Opens the Android share menu with the sponsor link. */
fun shareSponsor(context: Context, ad: ServerAd, language: AppLanguage) {
    val url = "https://mykiezberlin.com/s/" + ad.id
    val headline = pick(language, ad.headlineDe, ad.headlineTr.ifBlank { ad.headlineDe }, ad.headlineEn.ifBlank { ad.headlineDe })
    val text = ad.name + (if (headline.isNotBlank()) " – $headline" else "") + "\n" + url
    val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_SUBJECT, ad.name).putExtra(Intent.EXTRA_TEXT, text)
    try {
        context.startActivity(Intent.createChooser(send, pick(language, "Teilen", "Paylaş", "Share")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (_: Exception) {
    }
}

/** Link https://mykiezberlin.com/s/<id> opened the app: show that sponsor as soon as the list is there. */
object SponsorDeepLink {
    fun open(id: String) {
        val clean = id.lowercase().filter { it.isLetterOrDigit() || it == '-' }.take(60)
        if (clean.isBlank()) return
        if (SponsorInfoState.showById(clean)) return
        AdsRepository.findAdAsync(clean) { ad ->
            if (ad != null) Handler(Looper.getMainLooper()).post { SponsorInfoState.show(ad) }
        }
    }
}

private val WX = listOf(0 to "☀️", 3 to "⛅", 48 to "🌫️", 67 to "🌧️", 77 to "🌨️", 82 to "🌦️", 99 to "⛈️")
private fun wxIcon(code: Int) = WX.firstOrNull { code <= it.first }?.second ?: "🌡️"

/** Clock (Berlin time) + current weather at the top of the home page. Tap on the weather = sport & weather page. */
@Composable
fun HomeClockWeather(language: AppLanguage, onWeatherClick: (() -> Unit)? = null) {
    var now by remember { mutableStateOf(Date()) }
    LaunchedEffect(Unit) {
        while (true) {
            now = Date()
            delay(15_000)
        }
    }
    val weather by LiveBerlinFeedRepository.liveWeather.collectAsState()
    val berlin = TimeZone.getTimeZone("Europe/Berlin")
    val locale = when (language) { AppLanguage.TURKISH -> Locale("tr", "TR"); AppLanguage.ENGLISH -> Locale.UK; else -> Locale.GERMANY }
    val time = remember(now) { SimpleDateFormat("HH:mm", Locale.GERMANY).apply { timeZone = berlin }.format(now) }
    val date = remember(now, language) { SimpleDateFormat("EEEE, d. MMMM", locale).apply { timeZone = berlin }.format(now) }
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp).clip(RoundedCornerShape(16.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF0F172A), Color(0xFF1E3A8A))))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(Modifier.weight(1f)) {
            Text(time, color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold)
            Text(date, color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp)
        }
        val w = weather
        Row(
            Modifier.then(if (onWeatherClick != null) Modifier.clickable { onWeatherClick() } else Modifier),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            if (w != null) {
                Text(wxIcon(w.code), fontSize = 30.sp)
                Text("${Math.round(w.temperature)}°C", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
            }
            Text("Berlin", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
        }
    }
}

/** Red button "Türkiye Sponsorları (N)" under "Alle Sponsoren"; opens the list of the sponsors from Turkey. */
@Composable
fun TurkeySponsorsButton(language: AppLanguage) {
    val ads by AdsRepository.pageAds.collectAsState()
    val tr = remember(ads) { ads.filter { it.region == "tr" } }
    var open by remember { mutableStateOf(false) }
    if (tr.isEmpty()) return
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp).clip(RoundedCornerShape(14.dp)).background(Color(0xFFE30A17))
            .clickable { open = true }.padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text("🇹🇷", fontSize = 24.sp)
        Text(pick(language, "Sponsoren aus der Türkei", "Türkiye Sponsorları", "Sponsors from Turkey"), color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, modifier = Modifier.weight(1f))
        Text("${tr.size} →", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
    }
    if (open) {
        Dialog(onDismissRequest = { open = false }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
            Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                Column(Modifier.fillMaxSize().systemBarsPadding()) {
                    Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("🇹🇷 " + pick(language, "Sponsoren aus der Türkei", "Türkiye Sponsorları", "Sponsors from Turkey") + " (${tr.size})",
                            fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, modifier = Modifier.weight(1f))
                        InfoButton("tuerkei", language) // 2026-11-14
                        TextButton(onClick = { open = false }) { Text("✕", fontSize = 18.sp) }
                    }
                    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(tr, key = { it.id }) { ad -> SponsorTierCard(ad = ad, language = language, size = "medium") }
                    }
                }
            }
        }
    }
}
