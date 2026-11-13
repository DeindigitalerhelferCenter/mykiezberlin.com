package com.example.ui.components

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.AppLanguage
import com.example.data.repository.AdsRepository
import com.example.data.repository.ServerAd
import com.example.ui.theme.BerlinRed
import com.example.ui.viewmodel.AppScreen

/*
 * 2026-11-13 (owner): the home page changes on every visit – same idea as the web (public/home-deck.js).
 *  - a few boxes from a pool (sport, emergency numbers, reporter, quiz, community, tips, events, jobs, live, share),
 *    chosen at random each time the home page opens, never exactly the same set as last time
 *  - 3 sponsor places, only Kiez Premium / Kiez Plus, place 1 prefers Premium; the server weight (monthly goal:
 *    Basic 1.000, Plus 3.000, Premium 8.000 seen views) decides who comes next
 *  - "Alle Sponsoren (N)" opens every sponsor with a Kiez filter (Basic sponsors are there, in their Kiez and on page changes)
 */

private data class DeckBox(val key: String, val icon: String, val color: Color, val de: String, val tr: String, val textDe: String, val textTr: String, val buttonDe: String, val buttonTr: String, val screen: AppScreen?)

private val DECK = listOf(
    DeckBox("live", "🚨", Color(0xFFD32F2F), "Polizei · Feuerwehr · BVG – live", "Polis · İtfaiye · BVG – canlı", "Aktuelle Meldungen aus Berlin.", "Berlin'den güncel bildirimler.", "Alle Meldungen", "Tüm bildirimler", AppScreen.LIVE_BULLETIN),
    DeckBox("sport", "⚽", Color(0xFF2EA043), "Sport in Berlin", "Berlin'de spor", "Hertha, Union, Alba, Eisbären – News & Spiele.", "Hertha, Union, Alba, Eisbären – haberler ve maçlar.", "Zum Sport", "Spora git", AppScreen.SPORTS_AND_MARKETS),
    DeckBox("notruf", "📞", Color(0xFFE30613), "Notruf & wichtige Nummern", "Acil ve önemli numaralar", "110 Polizei · 112 Feuerwehr · 116 117 Arzt", "110 Polis · 112 İtfaiye · 116 117 Doktor", "Alle Nummern", "Tüm numaralar", AppScreen.NOTRUF),
    DeckBox("reporter", "📣", Color(0xFFF2B705), "Werde Kiez-Reporter", "Mahalle muhabiri ol", "Was passiert in deinem Kiez? Schreib es – die Nachbarn lesen mit.", "Mahallende ne oluyor? Yaz – komşuların okusun.", "Zum Kiez-Reporter", "Muhabir bölümüne", AppScreen.REPORTER),
    DeckBox("quiz", "🎯", Color(0xFF7B61FF), "Welcher Kiez passt zu dir?", "Sana hangi mahalle uyuyor?", "Kurze Fragen – dein Berliner Lieblingskiez.", "Kısa sorular – Berlin'deki favori mahallen.", "Quiz starten", "Teste başla", AppScreen.KIEZ_MATCH),
    DeckBox("community", "🆓", Color(0xFF0EA5E9), "Kostenlose Kleinanzeigen", "Ücretsiz ilanlar", "3 Tage gratis inserieren – verkaufen, verschenken, finden.", "3 gün ücretsiz ilan ver – sat, hediye et, bul.", "Zur Community", "Topluluğa git", AppScreen.COMMUNITY),
    DeckBox("telefonbuch", "📒", Color(0xFF0F766E), "Berliner Telefonbuch & Branchen", "Berlin telefon & iş rehberi", "Nummern von Firmen, Ärzten, Handwerkern – in Das Örtliche, Gelbe Seiten, 11880 suchen.", "Firma, doktor, usta numaraları – Das Örtliche, Gelbe Seiten, 11880'de ara.", "Nummer suchen", "Numara ara", AppScreen.TELEFONBUCH),
    DeckBox("tips", "🧭", Color(0xFF0F766E), "Kiez-Guide & Berlin-Tipps", "Mahalle rehberi & Berlin önerileri", "Ausflüge, Orte und Tipps für jeden Kiez.", "Her mahalle için gezi, yer ve öneriler.", "Tipps ansehen", "Önerilere bak", AppScreen.BERLIN_TIPS),
    DeckBox("events", "📅", Color(0xFFC026D3), "Events in Berlin", "Berlin'de etkinlikler", "Was ist los diese Woche?", "Bu hafta neler var?", "Zu den Events", "Etkinliklere git", AppScreen.EVENTS),
    DeckBox("jobs", "💼", Color(0xFF475569), "Kiez-Jobs", "Mahalle iş ilanları", "Jobs in deiner Nähe.", "Yakınındaki işler.", "Jobs ansehen", "İlanlara bak", AppScreen.JOBS),
    DeckBox("share", "📲", Color(0xFF16A34A), "Teile My Kiez mit Freunden", "My Kiez'i arkadaşlarınla paylaş", "Je mehr Nachbarn mitmachen, desto lebendiger dein Kiez.", "Ne kadar çok komşu katılırsa mahallen o kadar canlı olur.", "Jetzt teilen", "Şimdi paylaş", null),
)

private object HomeDeckMemory {
    var last: List<String> = emptyList()
}

/** Boxes from the pool: the ones shown last time come last in the draw. */
private fun pickDeck(count: Int): List<DeckBox> {
    val fresh = DECK.filter { it.key !in HomeDeckMemory.last }.shuffled()
    val old = DECK.filter { it.key in HomeDeckMemory.last }.shuffled()
    val out = (fresh + old).take(count)
    HomeDeckMemory.last = out.map { it.key }
    return out
}

/** Weighted draw without repeats; place 1 prefers Premium. */
fun pickHomeSponsors(ads: List<ServerAd>, places: Int = 3): List<ServerAd> {
    var pool = ads.filter { it.size == "large" || it.size == "banner" || it.size == "medium" }
    val out = mutableListOf<ServerAd>()
    repeat(places) { n ->
        if (pool.isEmpty()) return out
        val premium = pool.filter { it.size == "large" || it.size == "banner" }
        val cand = if (n == 0 && premium.isNotEmpty()) premium else pool
        val total = cand.sumOf { it.weight.coerceAtLeast(1) }
        var r = (Math.random() * total)
        var pick = cand.first()
        for (a in cand) { r -= a.weight.coerceAtLeast(1); if (r <= 0) { pick = a; break } }
        out.add(pick)
        pool = pool.filter { it.id != pick.id }
    }
    return out
}

@Composable
fun HomeDeckBoxes(language: AppLanguage, count: Int, seed: Int, onNavigateToScreen: (AppScreen) -> Unit) {
    val boxes = remember(seed, count) { pickDeck(count) }
    Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        boxes.forEach { DeckBoxCard(it, language, onNavigateToScreen) }
    }
}

@Composable
private fun DeckBoxCard(box: DeckBox, language: AppLanguage, onNavigateToScreen: (AppScreen) -> Unit) {
    val tr = language == AppLanguage.TURKISH
    val context = LocalContext.current
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(16.dp))
    ) {
        Box(Modifier.width(5.dp).heightIn(min = 110.dp).background(box.color))
        Column(Modifier.padding(14.dp).weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(box.icon, fontSize = 22.sp)
                Text(if (tr) box.tr else box.de, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
            }
            Text(if (tr) box.textTr else box.textDe, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Button(
                onClick = {
                    if (box.screen != null) onNavigateToScreen(box.screen) else {
                        val text = if (tr) "My Kiez Berlin – Berlin'in mahalle uygulaması: https://mykiezberlin.com" else "My Kiez Berlin – die Kiez-App für Berlin: https://mykiezberlin.com"
                        try { context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text), "My Kiez Berlin")) } catch (_: Exception) {}
                    }
                },
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = box.color),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
            ) { Text((if (tr) box.buttonTr else box.buttonDe) + " →", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.White) }
        }
    }
}

/** The changing part of the home page: box, sponsor, box, box, sponsor, box, sponsor, "Alle Sponsoren". */
@Composable
fun HomeDeckSection(language: AppLanguage, onNavigateToScreen: (AppScreen) -> Unit, onOpenWerben: () -> Unit) {
    val seed = remember { System.nanoTime().toInt() } // new on every visit of the home page
    LaunchedEffect(Unit) { AdsRepository.refreshPageAds() }
    val ads by AdsRepository.pageAds.collectAsState()
    val boxes = remember(seed) { pickDeck(5) }
    val sponsors = remember(seed, ads.isNotEmpty()) { pickHomeSponsors(ads) }
    Column(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        boxes.forEachIndexed { i, box ->
            Box(Modifier.padding(horizontal = 16.dp)) { DeckBoxCard(box, language, onNavigateToScreen) }
            if (i % 2 == 0) HomeSponsorPlace(sponsors.getOrNull(i / 2), language) // after box 1, 3, 5
        }
        AllSponsorsButton(language, onOpenWerben)
    }
}

/** Kiez-Stars as a small window: opens on tap; shown on about every second visit. */
@Composable
fun HomeKiezStarsSmall(language: AppLanguage, onShareStory: () -> Unit) {
    val show = remember { Math.random() < 0.5 }
    if (!show) return
    val tr = language == AppLanguage.TURKISH
    var open by remember { mutableStateOf(false) }
    Column(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp).clip(RoundedCornerShape(16.dp))
            .border(2.dp, Color(0xFFF2B705), RoundedCornerShape(16.dp)).background(Color(0xFFF2B705).copy(alpha = 0.10f))
    ) {
        Row(Modifier.fillMaxWidth().clickable { open = !open }.padding(horizontal = 14.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("🏆 " + (if (tr) "Haftanın Mahalle Yıldızları" else "Kiez-Stars der Woche"), fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, modifier = Modifier.weight(1f))
            Text(if (open) "▴" else "▾", fontSize = 16.sp)
        }
        if (open) KiezStarsCard(language = language, onShareStory = onShareStory)
    }
}

/** One sponsor place on the home page. */
@Composable
fun HomeSponsorPlace(ad: ServerAd?, language: AppLanguage) {
    if (ad == null) return
    Box(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) { SponsorTierCard(ad = ad, language = language) }
}

/** Button "Alle Sponsoren (N)" + full list with Kiez filter. */
@Composable
fun AllSponsorsButton(language: AppLanguage, onOpenWerben: () -> Unit) {
    val tr = language == AppLanguage.TURKISH
    val ads by AdsRepository.pageAds.collectAsState()
    var open by remember { mutableStateOf(false) }
    if (ads.isEmpty()) return
    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        Button(onClick = { open = true }, modifier = Modifier.weight(1f).heightIn(min = 46.dp), shape = RoundedCornerShape(12.dp), colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)) {
            Text((if (tr) "🤝 Tüm sponsorlar" else "🤝 Alle Sponsoren") + " (${ads.size}) →", fontWeight = FontWeight.Bold)
        }
        OutlinedButton(onClick = onOpenWerben, shape = RoundedCornerShape(12.dp)) { Text(if (tr) "Reklam ver" else "Selbst werben", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
    }
    if (open) AllSponsorsDialog(ads, language) { open = false }
}

@Composable
private fun AllSponsorsDialog(ads: List<ServerAd>, language: AppLanguage, onClose: () -> Unit) {
    val tr = language == AppLanguage.TURKISH
    var kiez by remember { mutableStateOf("") }
    val kieze = remember(ads) { ads.flatMap { it.kieze.split(",") }.map { it.trim() }.filter { it.isNotBlank() }.distinct().sorted() }
    val shown = remember(ads, kiez) {
        ads.filter { kiez.isBlank() || it.kieze.contains(kiez, true) }.sortedWith(compareBy({ tierRank(it) }, { it.name.lowercase() }))
    }
    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            Column(Modifier.fillMaxSize().systemBarsPadding()) {
                Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text((if (tr) "🤝 Sponsorlar & Partnerler" else "🤝 Sponsoren & Partner") + " (${ads.size})", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, modifier = Modifier.weight(1f))
                    TextButton(onClick = onClose) { Text("✕", fontSize = 18.sp) }
                }
                Row(Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    FilterChip(selected = kiez.isBlank(), onClick = { kiez = "" }, label = { Text(if (tr) "Tüm Mahalleler" else "Alle Kieze") })
                    kieze.forEach { k -> FilterChip(selected = kiez == k, onClick = { kiez = k }, label = { Text(k) }) }
                }
                LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(shown, key = { it.id }) { ad -> SponsorTierCard(ad = ad, language = language) }
                }
            }
        }
    }
}
