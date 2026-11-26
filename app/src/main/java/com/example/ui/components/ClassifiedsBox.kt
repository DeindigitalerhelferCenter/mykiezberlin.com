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
