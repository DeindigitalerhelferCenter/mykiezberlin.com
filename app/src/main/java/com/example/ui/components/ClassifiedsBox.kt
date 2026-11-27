package com.example.ui.components

// 2026-11-27 (owner "UYGULA ilan 3"): "🛍️ Kiez-Kleinanzeigen · Mahalle ilanları" on the home page (same as the web,
// public/classified-box.js): the 3 newest classifieds with picture, price and Kiez; "Alle" / "Inserieren" open the
// community page on the classifieds tab. Loads again after every refresh (MyKiezViewModel.refreshTick).

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.basicMarquee
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.AppLanguage
import com.example.data.repository.LiveAlertsRepository

/** 2026-11-27: counter of "refresh everything" (pull to refresh / 🔄 / back after 5 min) – boxes that load by themselves listen to it. */
object RefreshBus {
    val tick = kotlinx.coroutines.flow.MutableStateFlow(0)
}

/** "#ilan" -> the community page opens on the classifieds tab (read once by MainActivity). */
object CommunityAnchor {
    var value: String = ""
}

private data class MiniAd(val title: String, val price: String, val kiez: String, val pic: String, val created: Long)

@Composable
fun ClassifiedsBox(language: AppLanguage, onOpen: () -> Unit, modifier: Modifier = Modifier) {
    val refreshTick by RefreshBus.tick.collectAsState()
    val tr = language == AppLanguage.TURKISH
    var ads by remember { mutableStateOf<List<MiniAd>?>(null) }
    LaunchedEffect(refreshTick) {
        val items = try { LiveAlertsRepository.fetchSubmissions() } catch (_: Exception) { emptyList() }
        ads = items.filter { it.optString("type") == "classified" }.map { o ->
            val media = o.optJSONArray("media")
            var pic = ""
            if (media != null) for (i in 0 until media.length()) {
                val m = media.optJSONObject(i) ?: continue
                if (m.optString("type") != "video") { pic = m.optString("url"); break }
            }
            if (pic.startsWith("/")) pic = "https://mykiezberlin.com$pic"
            MiniAd(o.optString("title"), o.optString("price"), o.optString("kiezName"), pic, o.optLong("createdAt"))
        }.sortedByDescending { it.created }.take(3)
    }
    val open = { CommunityAnchor.value = "#ilan"; onOpen() }
    Column(
        modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).border(2.dp, Color(0xFF0EA5E9), RoundedCornerShape(18.dp))
            .background(MaterialTheme.colorScheme.surface).padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(if (tr) "🛍️ Mahalle ilanları · Kiez-Kleinanzeigen" else "🛍️ Kiez-Kleinanzeigen · Mahalle ilanları", fontWeight = FontWeight.Black, fontSize = 16.sp)
        val list = ads.orEmpty()
        if (list.isEmpty()) {
            Text(
                if (tr) "Henüz ilan yok – ilk ilanı sen ver! Satmak, hediye etmek, aramak… 7 gün ücretsiz." else "Noch keine Anzeige – sei die/der Erste! Verkaufen, verschenken, suchen … 7 Tage gratis.",
                fontSize = 13.5.sp
            )
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                list.forEach { a ->
                    Column(Modifier.weight(1f).clickable { open() }) {
                        Box(Modifier.fillMaxWidth().aspectRatio(1f).clip(RoundedCornerShape(12.dp)).background(Color(0xFFE0F2FE)), contentAlignment = Alignment.Center) {
                            if (a.pic.isNotBlank()) AsyncImage(model = a.pic, contentDescription = a.title, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxWidth().aspectRatio(1f))
                            else Text("🛍️", fontSize = 30.sp)
                        }
                        Text(a.title, fontWeight = FontWeight.Bold, fontSize = 12.5.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 4.dp))
                        Text(listOf(a.price, a.kiez).filter { it.isNotBlank() }.joinToString(" · "), fontSize = 11.5.sp, color = Color(0xFF16A34A), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
                repeat(3 - list.size) { Box(Modifier.weight(1f)) }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = open, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0EA5E9))) {
                Text(if (tr) "Tüm ilanlar →" else "Alle Anzeigen →", fontWeight = FontWeight.Black, fontSize = 13.sp, color = Color.White)
            }
            Button(onClick = open, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE0F2FE))) {
                Text(if (tr) "➕ İlan ver" else "➕ Inserieren", fontWeight = FontWeight.Black, fontSize = 13.sp, color = Color(0xFF0369A1))
            }
        }
    }
}

// ---- 2026-11-27 (owner): small dark-green box like the invite box, all classifieds in a slowly, endlessly running
// strip; picture or the My Kiez "Kleinanzeigen" logo; a tap opens the ad in a window (no long list to read).
private data class StripAd(
    val id: String, val title: String, val price: String, val kiez: String, val category: String,
    val description: String, val contact: String, val pics: List<String>, val created: Long,
)

@OptIn(androidx.compose.foundation.ExperimentalFoundationApi::class)
@Composable
fun ClassifiedsStrip(language: AppLanguage, onOpen: () -> Unit, modifier: Modifier = Modifier) {
    val refreshTick by RefreshBus.tick.collectAsState()
    val tr = language == AppLanguage.TURKISH
    var ads by remember { mutableStateOf<List<StripAd>>(emptyList()) }
    var open by remember { mutableStateOf<StripAd?>(null) }
    LaunchedEffect(refreshTick) {
        val items = try { LiveAlertsRepository.fetchSubmissions() } catch (_: Exception) { emptyList() }
        ads = items.filter { it.optString("type") == "classified" }.map { o ->
            val media = o.optJSONArray("media")
            val pics = mutableListOf<String>()
            if (media != null) for (i in 0 until media.length()) {
                val m = media.optJSONObject(i) ?: continue
                if (m.optString("type") == "video") continue
                var u = m.optString("url")
                if (u.startsWith("/")) u = "https://mykiezberlin.com$u"
                if (u.isNotBlank()) pics.add(u)
            }
            StripAd(o.optString("id"), o.optString("title"), o.optString("price"), o.optString("kiezName"), o.optString("category"),
                o.optString("description"), o.optString("contact"), pics, o.optLong("createdAt"))
        }.sortedByDescending { it.created }
    }
    val green = Color(0xFF7EE2A8)
    Column(
        modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
            .background(androidx.compose.ui.graphics.Brush.linearGradient(listOf(Color(0xFF0D1117), Color(0xFF1B2B22))))
            .padding(vertical = 10.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            androidx.compose.foundation.Image(
                painter = androidx.compose.ui.res.painterResource(com.example.R.drawable.mykiez_logo), contentDescription = null,
                modifier = Modifier.size(30.dp).clip(RoundedCornerShape(8.dp)).background(Color.White).padding(2.dp)
            )
            Column(Modifier.weight(1f)) {
                Text(if (tr) "Mahalle ilanları" else "Kiez-Kleinanzeigen", color = Color.White, fontWeight = FontWeight.Black, fontSize = 14.sp)
                Text("My Kiez Berlin · " + (if (tr) "Kiez-Kleinanzeigen" else "Mahalle ilanları"), color = green, fontWeight = FontWeight.Bold, fontSize = 11.sp)
            }
            Text(
                if (tr) "➕ İlan ver" else "➕ Inserieren", color = Color(0xFF05290F), fontWeight = FontWeight.Black, fontSize = 12.sp,
                modifier = Modifier.clip(RoundedCornerShape(50)).background(Color(0xFF25D366)).clickable { CommunityAnchor.value = "#ilan"; onOpen() }.padding(horizontal = 10.dp, vertical = 6.dp)
            )
        }
        if (ads.isEmpty()) {
            Text(
                if (tr) "Henüz ilan yok – ilk ilanı sen ver! 7 gün ücretsiz." else "Noch keine Anzeige – sei die/der Erste! 7 Tage gratis.",
                color = Color(0xFFC9D1D9), fontSize = 12.5.sp, modifier = Modifier.padding(horizontal = 12.dp)
            )
        } else {
            // enough tiles to fill the strip; basicMarquee runs it endlessly and slowly
            val row = List(maxOf(8, ads.size)) { ads[it % ads.size] }
            Row(
                Modifier.fillMaxWidth().basicMarquee(iterations = Int.MAX_VALUE, velocity = 28.dp, initialDelayMillis = 0, repeatDelayMillis = 0, spacing = androidx.compose.foundation.MarqueeSpacing(8.dp)),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Spacer(Modifier.width(4.dp))
                row.forEach { a ->
                    Column(Modifier.width(92.dp).clickable { open = a }) {
                        if (a.pics.isNotEmpty()) {
                            AsyncImage(model = a.pics.first(), contentDescription = a.title, contentScale = ContentScale.Crop,
                                modifier = Modifier.size(92.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFF0D1117)))
                        } else {
                            Column(
                                Modifier.size(92.dp).clip(RoundedCornerShape(12.dp))
                                    .background(androidx.compose.ui.graphics.Brush.linearGradient(listOf(Color(0xFF1B2B22), Color(0xFF0D1117))))
                                    .border(1.dp, Color(0x662EA043), RoundedCornerShape(12.dp)),
                                horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center
                            ) {
                                androidx.compose.foundation.Image(
                                    painter = androidx.compose.ui.res.painterResource(com.example.R.drawable.mykiez_logo), contentDescription = null,
                                    modifier = Modifier.size(44.dp).clip(RoundedCornerShape(10.dp)).background(Color.White).padding(2.dp)
                                )
                                Text("Kleinanzeigen", color = green, fontWeight = FontWeight.Black, fontSize = 9.5.sp, modifier = Modifier.padding(top = 3.dp))
                            }
                        }
                        Text(a.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 11.5.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 4.dp))
                        Text(listOf(a.price, a.kiez).filter { it.isNotBlank() }.joinToString(" · "), color = green, fontSize = 10.5.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    }
                }
            }
        }
    }
    open?.let { a -> StripAdDialog(a, tr, onClose = { open = null }, onAll = { open = null; CommunityAnchor.value = "#ilan-" + a.id; onOpen() }) }
}

@Composable
private fun StripAdDialog(a: StripAd, tr: Boolean, onClose: () -> Unit, onAll: () -> Unit) {
    androidx.compose.ui.window.Dialog(onDismissRequest = onClose) {
        Column(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(18.dp)).background(Color(0xFF0D1117))
                .border(2.dp, Color(0xFF25D366), RoundedCornerShape(18.dp))
                .verticalScroll(rememberScrollState()).padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (a.pics.isNotEmpty()) {
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    a.pics.forEach { u ->
                        AsyncImage(model = u, contentDescription = a.title, contentScale = ContentScale.Fit,
                            modifier = Modifier.height(220.dp).clip(RoundedCornerShape(12.dp)))
                    }
                }
            }
            Text(a.title, color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
            Text(listOf(a.price, a.kiez, a.category).filter { it.isNotBlank() }.joinToString(" · "), color = Color(0xFF7EE2A8), fontWeight = FontWeight.Bold, fontSize = 13.sp)
            if (a.description.isNotBlank()) Text(a.description, color = Color(0xFFE6EDF3), fontSize = 14.sp, lineHeight = 20.sp)
            if (a.contact.isNotBlank()) Text(
                "📞 " + (if (tr) "İletişim" else "Kontakt") + ": " + a.contact, color = Color.White, fontSize = 14.sp,
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0xFF1B2B22)).padding(10.dp)
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onAll, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366))) {
                    Text(if (tr) "Tüm ilanlar →" else "Alle Anzeigen →", color = Color(0xFF05290F), fontWeight = FontWeight.Black, fontSize = 13.sp)
                }
                Button(onClick = onClose, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF21262D))) {
                    Text(if (tr) "Kapat" else "Schließen", color = Color.White, fontWeight = FontWeight.Black, fontSize = 13.sp)
                }
            }
        }
    }
}
