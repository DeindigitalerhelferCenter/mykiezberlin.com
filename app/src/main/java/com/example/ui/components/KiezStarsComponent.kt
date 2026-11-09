package com.example.ui.components

import android.content.Context
import androidx.compose.animation.core.withInfiniteAnimationFrameMillis
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.model.AppLanguage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.net.URLEncoder
import kotlin.random.Random

/** One person in the weekly ranking. */
data class KiezStar(val name: String, val count: Int, val rank: Int, val badgeIcon: String, val badgeDe: String, val badgeTr: String, val badgeEn: String)

data class KiezStarsData(
    val week: String,
    val top: List<KiezStar>,
    val lastWeek: String,
    val lastWeekTop: List<KiezStar>,
    val myCount: Int,
    val myRank: Int
)

/** Weekly Kiez-Stars from mykiezberlin.com/api/stars (same list as the website). */
object KiezStarsRepository {
    private const val URL = "https://mykiezberlin.com/api/stars"
    private const val PREFS = "kiez_author"
    private const val KEY_NAME = "name"
    private val client = OkHttpClient()

    private val _stars = MutableStateFlow<KiezStarsData?>(null)
    val stars: StateFlow<KiezStarsData?> = _stars

    fun savedName(context: Context): String =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_NAME, "").orEmpty()

    fun saveName(context: Context, name: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_NAME, name.trim().take(40)).apply()
    }

    private fun parse(arr: org.json.JSONArray?): List<KiezStar> =
        (0 until (arr?.length() ?: 0)).map { i ->
            val o = arr!!.getJSONObject(i)
            val b = o.optJSONObject("badge")
            KiezStar(
                name = o.optString("name"),
                count = o.optInt("count"),
                rank = o.optInt("rank", i + 1),
                badgeIcon = b?.optString("icon").orEmpty(),
                badgeDe = b?.optString("de").orEmpty(),
                badgeTr = b?.optString("tr").orEmpty(),
                badgeEn = b?.optString("en").orEmpty()
            )
        }

    suspend fun refresh(context: Context) = withContext(Dispatchers.IO) {
        try {
            val name = savedName(context)
            val url = if (name.isBlank()) URL else URL + "?name=" + URLEncoder.encode(name, "UTF-8")
            client.newCall(Request.Builder().url(url).header("User-Agent", "MyKiezBerlin-Android/2.0").build()).execute().use { resp ->
                if (!resp.isSuccessful) return@withContext
                val o = JSONObject(resp.body?.string().orEmpty())
                val last = o.optJSONObject("lastWeek")
                val me = o.optJSONObject("me")
                _stars.value = KiezStarsData(
                    week = o.optString("week"),
                    top = parse(o.optJSONArray("top")),
                    lastWeek = last?.optString("week").orEmpty(),
                    lastWeekTop = parse(last?.optJSONArray("top")),
                    myCount = me?.optInt("count") ?: 0,
                    myRank = me?.optInt("rank") ?: 0
                )
            }
        } catch (_: Exception) {
        }
    }
}

private val Gold = Color(0xFFF2B705)
private val Silver = Color(0xFFB8C2CC)
private val Bronze = Color(0xFFCD7F32)

private fun medal(rank: Int) = when (rank) { 1 -> "🏆"; 2 -> "🥈"; 3 -> "🥉"; else -> "⭐" }

/** Home card "Kiez-Stars der Woche": top 3, own progress and the next badge. Opens the trophy once a week. */
@Composable
fun KiezStarsCard(language: AppLanguage, onShareStory: () -> Unit) {
    val context = LocalContext.current
    val data by KiezStarsRepository.stars.collectAsState()
    LaunchedEffect(Unit) { KiezStarsRepository.refresh(context) }
    val tr = language == AppLanguage.TURKISH
    val en = language == AppLanguage.ENGLISH
    var showTrophy by remember { mutableStateOf(false) }

    // Trophy + confetti once a week for everyone, as soon as last week has a winner
    val d = data
    LaunchedEffect(d?.lastWeek) {
        val week = d?.lastWeek ?: return@LaunchedEffect
        if (d.lastWeekTop.isEmpty()) return@LaunchedEffect
        val prefs = context.getSharedPreferences("kiez_stars_seen", Context.MODE_PRIVATE)
        if (prefs.getString("week", "") != week) {
            prefs.edit().putString("week", week).apply()
            showTrophy = true
        }
    }
    if (showTrophy && d != null && d.lastWeekTop.isNotEmpty()) {
        TrophyOverlay(language = language, winners = d.lastWeekTop, onClose = { showTrophy = false })
    }

    Card(
        shape = RoundedCornerShape(18.dp),
        border = BorderStroke(2.dp, Gold),
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp)
    ) {
        Column(
            modifier = Modifier
                .background(Brush.verticalGradient(listOf(Color(0x33F2B705), Color.Transparent)))
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    if (tr) "🏆 Haftanın Kiez Yıldızları" else if (en) "🏆 Kiez Stars of the week" else "🏆 Kiez-Stars der Woche",
                    fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, modifier = Modifier.weight(1f)
                )
                if (d != null && d.lastWeekTop.isNotEmpty()) {
                    Text(
                        if (tr) "Geçen hafta →" else if (en) "Last week →" else "Letzte Woche →",
                        fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0288D1),
                        modifier = Modifier.clickable { showTrophy = true }
                    )
                }
            }
            val top = d?.top.orEmpty().take(3)
            if (top.isEmpty()) {
                Text(
                    if (tr) "Bu hafta henüz kimse hikâye paylaşmadı. İlk sen ol, kupayı kap! 🚀"
                    else if (en) "Nobody has shared a story this week yet. Be the first and grab the trophy! 🚀"
                    else "Diese Woche hat noch niemand eine Story geteilt. Sei die/der Erste und hol dir den Pokal! 🚀",
                    fontSize = 13.sp
                )
            } else {
                top.forEach { star ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                when (star.rank) { 1 -> Gold.copy(alpha = 0.22f); 2 -> Silver.copy(alpha = 0.25f); else -> Bronze.copy(alpha = 0.18f) }
                            )
                            .padding(horizontal = 10.dp, vertical = 8.dp)
                    ) {
                        Text(medal(star.rank), fontSize = 22.sp)
                        Spacer(Modifier.width(8.dp))
                        Column(Modifier.weight(1f)) {
                            Text(star.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            if (star.badgeIcon.isNotBlank()) {
                                Text("${star.badgeIcon} " + (if (tr) star.badgeTr else if (en) star.badgeEn else star.badgeDe), fontSize = 11.5.sp)
                            }
                        }
                        Text(
                            "${star.count} " + (if (tr) "hikâye" else if (en) "stories" else "Stories"),
                            fontWeight = FontWeight.ExtraBold, fontSize = 14.sp
                        )
                    }
                }
            }
            // Own progress
            val name = remember { KiezStarsRepository.savedName(context) }
            val mine = d?.myCount ?: 0
            val next = listOf(3 to (if (tr) "Bronz" else if (en) "Bronze" else "Bronze"), 7 to (if (tr) "Gümüş" else if (en) "Silver" else "Silber"), 12 to (if (tr) "Altın" else if (en) "Gold" else "Gold"))
                .firstOrNull { mine < it.first }
            val progress = when {
                name.isBlank() -> if (tr) "Hikâye paylaş, adınla listeye gir!" else if (en) "Share a story and get on the list with your name!" else "Teile eine Story und komm mit deinem Namen auf die Liste!"
                next == null -> if (tr) "$name, bu hafta $mine hikâye – 🥇 Altın rozet senin! 🎉" else if (en) "$name, $mine stories this week – 🥇 Gold badge is yours! 🎉" else "$name, $mine Stories diese Woche – 🥇 Gold-Abzeichen gehört dir! 🎉"
                else -> {
                    val left = next.first - mine
                    if (tr) "$name, bu hafta $mine hikâye paylaştın – ${next.second} rozete $left kaldı 💪"
                    else if (en) "$name, you shared $mine stories this week – $left more for ${next.second} 💪"
                    else "$name, du hast diese Woche $mine Stories geteilt – noch $left bis ${next.second} 💪"
                }
            }
            Text(progress, fontSize = 12.5.sp, fontWeight = FontWeight.SemiBold)
            Text(
                if (tr) "🥉 3 · 🥈 7 · 🥇 12 hikâye / hafta" else if (en) "🥉 3 · 🥈 7 · 🥇 12 stories / week" else "🥉 3 · 🥈 7 · 🥇 12 Stories / Woche",
                fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Button(
                onClick = onShareStory,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE30613)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(if (tr) "📸 Hikâye paylaş" else if (en) "📸 Share a story" else "📸 Story teilen", fontWeight = FontWeight.Bold)
            }
        }
    }
}

private class Piece(val x: Float, val y: Float, val size: Float, val speed: Float, val drift: Float, val color: Color)

/** Full-screen trophy with confetti for last week's top 3. */
@Composable
fun TrophyOverlay(language: AppLanguage, winners: List<KiezStar>, onClose: () -> Unit) {
    val tr = language == AppLanguage.TURKISH
    val en = language == AppLanguage.ENGLISH
    val colors = listOf(Gold, Color.White, Color(0xFFE30613), Color(0xFF0052A5), Silver)
    val pieces = remember { List(160) { Piece(Random.nextFloat(), -Random.nextFloat(), 12f + Random.nextFloat() * 16f, 0.2f + Random.nextFloat() * 0.35f, Random.nextFloat() * 0.1f - 0.05f, colors.random()) } }
    var elapsed by remember { mutableLongStateOf(0L) }
    LaunchedEffect(Unit) {
        val start = withInfiniteAnimationFrameMillis { it }
        while (elapsed < 9000L) elapsed = withInfiniteAnimationFrameMillis { it } - start
    }
    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(
            modifier = Modifier.fillMaxSize().background(Color(0xEE101820)).clickable(onClick = onClose),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val s = elapsed / 1000f
                for (p in pieces) {
                    val y = ((p.y + p.speed * s) % 1.2f) * size.height
                    drawRect(p.color, Offset((p.x + p.drift * s) * size.width, y), Size(p.size, p.size * 0.6f))
                }
            }
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.padding(28.dp)
            ) {
                Text("🏆", fontSize = 96.sp)
                Text(
                    if (tr) "Haftanın Kiez Yıldızı" else if (en) "Kiez Star of the week" else "Kiez-Star der Woche",
                    color = Gold, fontSize = 26.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center
                )
                winners.take(3).forEach { w ->
                    Text(
                        "${medal(w.rank)}  ${w.name} · ${w.count} " + (if (tr) "hikâye" else if (en) "stories" else "Stories"),
                        color = Color.White, fontSize = if (w.rank == 1) 24.sp else 18.sp,
                        fontWeight = if (w.rank == 1) FontWeight.ExtraBold else FontWeight.Bold, textAlign = TextAlign.Center
                    )
                }
                Text(
                    if (tr) "Tebrikler! Bu hafta sıra sende – hikâyeni paylaş 📸" else if (en) "Congratulations! This week it's your turn – share your story 📸" else "Glückwunsch! Diese Woche bist du dran – teile deine Story 📸",
                    color = Color.White, fontSize = 15.sp, textAlign = TextAlign.Center
                )
                OutlinedButton(onClick = onClose, border = BorderStroke(1.dp, Color.White)) {
                    Text(if (tr) "Kapat" else if (en) "Close" else "Schließen", color = Color.White)
                }
            }
        }
    }
}
