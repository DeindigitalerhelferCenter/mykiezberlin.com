package com.example.ui.components

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.repeatOnLifecycle
import com.example.data.model.AppLanguage
import com.example.data.repository.GoalEvent
import com.example.data.repository.GoalWatcher
import kotlinx.coroutines.delay
import kotlin.math.abs
import kotlin.math.sin
import kotlin.random.Random

private const val OVERLAY_MS = 6_500L
private const val PROMO_DELAY_MS = 45_000L
private const val PROMO_REPEAT_MS = 7 * 24 * 3_600_000L
private const val PROMO_PREFS = "kiez_classified_promo"
private const val PROMO_KEY = "last_shown"
private const val SAMPLE_RATE = 22_050
private const val APPLAUSE_SECONDS = 2.6

private val ConfettiColors = listOf(Color(0xFF0052A5), Color.White, Color(0xFFE30613), Color(0xFFF2D91C))

private class ConfettiPiece(val x: Float, val startY: Float, val size: Float, val speed: Float, val drift: Float, val color: Color)

private fun playApplause() {
    val samples = ShortArray((SAMPLE_RATE * APPLAUSE_SECONDS).toInt()) { i ->
        val clap = if (abs(sin(i / 450.0)) > 0.55) 1.0 else 0.35
        val fade = 1.0 - i.toDouble() / (SAMPLE_RATE * APPLAUSE_SECONDS)
        (Random.nextDouble(-1.0, 1.0) * clap * fade * 9_000).toInt().toShort()
    }
    val track = AudioTrack.Builder()
        .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).build())
        .setAudioFormat(
            AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                .setSampleRate(SAMPLE_RATE)
                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                .build()
        )
        .setTransferMode(AudioTrack.MODE_STATIC)
        .setBufferSizeInBytes(samples.size * 2)
        .build()
    track.write(samples, 0, samples.size)
    track.play()
}

@Composable
private fun GoalOverlay(goal: GoalEvent, onClose: () -> Unit) {
    val pieces = remember(goal) {
        List(140) {
            ConfettiPiece(
                x = Random.nextFloat(),
                startY = -Random.nextFloat(),
                size = 14f + Random.nextFloat() * 18f,
                speed = 0.25f + Random.nextFloat() * 0.35f,
                drift = Random.nextFloat() * 0.1f - 0.05f,
                color = ConfettiColors.random()
            )
        }
    }
    var elapsedMs by remember(goal) { mutableLongStateOf(0L) }

    LaunchedEffect(goal) {
        playApplause()
        val start = withFrameMillis { it }
        while (elapsedMs < OVERLAY_MS) {
            elapsedMs = withFrameMillis { it } - start
        }
        onClose()
    }

    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xEB00285A))
                .clickable(onClick = onClose),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val seconds = elapsedMs / 1000f
                for (piece in pieces) {
                    val x = (piece.x + piece.drift * seconds) * size.width
                    val y = (piece.startY + piece.speed * seconds) * size.height
                    drawRect(piece.color, Offset(x, y), Size(piece.size, piece.size * 0.6f))
                }
            }
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("TOOOR!", color = Color.White, fontSize = 60.sp, fontWeight = FontWeight.Black)
                Text(goal.team, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                if (goal.scorer.isNotEmpty()) {
                    Text("${goal.scorer} · ${goal.minute}'", color = Color.White, fontSize = 20.sp)
                }
                Text(
                    "${goal.home} ${goal.score} ${goal.away}",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

/** Celebrates new Berlin goals while the app is on screen. */
@Composable
fun GoalCelebrationHost() {
    var goal by remember { mutableStateOf<GoalEvent?>(null) }
    val lifecycle = LocalLifecycleOwner.current.lifecycle

    LaunchedEffect(lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            GoalWatcher.events().collect { goal = it }
        }
    }

    goal?.let { GoalOverlay(it, onClose = { goal = null }) }
}

/** Invites the user to the free three-day classifieds, at most once a week. */
@Composable
fun ClassifiedPromoDialog(language: AppLanguage, onOpen: () -> Unit) {
    val context = LocalContext.current
    var visible by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        val prefs = context.getSharedPreferences(PROMO_PREFS, Context.MODE_PRIVATE)
        if (System.currentTimeMillis() - prefs.getLong(PROMO_KEY, 0L) < PROMO_REPEAT_MS) return@LaunchedEffect
        delay(PROMO_DELAY_MS)
        prefs.edit().putLong(PROMO_KEY, System.currentTimeMillis()).apply()
        visible = true
    }

    if (!visible) return
    val turkish = language == AppLanguage.TURKISH
    AlertDialog(
        onDismissRequest = { visible = false },
        title = { Text(if (turkish) "Şu an 3 günlük bedava ilan vermek ister misiniz?" else "Möchten Sie jetzt 3 Tage kostenlos inserieren?") },
        confirmButton = {
            TextButton(onClick = {
                visible = false
                onOpen()
            }) { Text(if (turkish) "Ücretsiz ilan ver" else "Gratis inserieren") }
        },
        dismissButton = {
            TextButton(onClick = { visible = false }) { Text(if (turkish) "Şimdi değil" else "Nicht jetzt") }
        }
    )
}
