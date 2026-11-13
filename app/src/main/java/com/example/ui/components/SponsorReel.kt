package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AppLanguage
import com.example.data.repository.AdsRepository
import com.example.data.repository.ServerAd
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.withContext

/**
 * 2026-11-14 (owner): many users did not know that sponsors upload their own pictures and videos every day/week.
 * Every sponsor card now shows them like the story tiles on top (tap = full screen). Without own uploads the
 * sponsor's picture and logo are shown, so the card never has an empty place.
 */
object SponsorMediaCache {
    private val _media = MutableStateFlow<Map<String, List<Pair<String, Boolean>>>>(emptyMap())
    val media = _media.asStateFlow()
    private val loading = mutableSetOf<String>()

    suspend fun ensure(adId: String) {
        synchronized(loading) { if (adId in loading || _media.value.containsKey(adId)) return; loading.add(adId) }
        val list = withContext(Dispatchers.IO) { AdsRepository.fetchSponsorMedia(adId) }
        _media.update { it + (adId to list) }
    }
}

private val InstaBrush = Brush.linearGradient(listOf(Color(0xFFFEDA75), Color(0xFFD62976), Color(0xFF4F5BD5)))
private val StoryRing = Brush.linearGradient(listOf(Color(0xFFF2B705), Color(0xFFE30613), Color(0xFF8B5CF6)))

@Composable
fun SponsorReelRow(ad: ServerAd, language: AppLanguage) {
    LaunchedEffect(ad.id) { SponsorMediaCache.ensure(ad.id) }
    val all by SponsorMediaCache.media.collectAsState()
    val own = all[ad.id].orEmpty()
    // fall back to the sponsor's own picture + logo (never an empty place)
    val tiles = own.ifEmpty { listOf(ad.image, ad.logo).filter { it.isNotBlank() }.distinct().map { it to false } }
    if (tiles.isEmpty()) return
    val context = androidx.compose.ui.platform.LocalContext.current
    Column(Modifier.fillMaxWidth().padding(start = 12.dp, end = 12.dp, top = 8.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Text(
            if (own.isNotEmpty()) "📸 " + (if (language == AppLanguage.TURKISH) "Fotoğraf & videolar (${own.size})" else "Fotos & Videos (${own.size})")
            else "📸 " + (if (language == AppLanguage.TURKISH) "Fotoğraflar" else "Fotos"),
            fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            itemsIndexed(tiles, key = { i, t -> "$i-${t.first}" }) { _, t ->
                Box(Modifier.size(64.dp, 92.dp).clip(RoundedCornerShape(12.dp)).border(2.dp, StoryRing, RoundedCornerShape(12.dp)).padding(3.dp)) {
                    if (t.first.contains("instagram.com/")) {
                        // 2026-11-14: Instagram post / reel of the sponsor – opens in Instagram or the browser
                        Column(
                            Modifier.fillMaxSize().clip(RoundedCornerShape(9.dp)).background(InstaBrush)
                                .clickable { runCatching { context.startActivity(android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(t.first))) } },
                            horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center
                        ) {
                            Text("📷", fontSize = 18.sp)
                            Text("Instagram", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                            Text(if (t.first.contains("/reel/")) "▶ Reel" else "Post", color = Color.White, fontSize = 9.sp)
                        }
                    } else MediaPreview(t.first, t.second, Modifier.fillMaxSize(), cornerDp = 9) // tap = full screen (picture or video)
                }
            }
        }
    }
}
