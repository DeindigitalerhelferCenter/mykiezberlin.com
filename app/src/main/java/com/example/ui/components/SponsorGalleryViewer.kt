package com.example.ui.components

import android.net.Uri
import android.widget.FrameLayout
import android.widget.VideoView
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.example.data.model.AppLanguage

/**
 * 2026-11-24 (owner, v1.53): the sponsor's pictures/videos run by themselves like a carousel on every device –
 * pictures 4 s, videos to their end. ⏸ stops, ▶ starts again; tap left/right or swipe goes by hand (the timer starts
 * new from there). Without a stop it keeps running. [items] = (url, isVideo).
 */
@Composable
fun SponsorGalleryViewer(items: List<Pair<String, Boolean>>, start: Int, language: AppLanguage, onClose: () -> Unit) {
    if (items.isEmpty()) { onClose(); return }
    var index by remember { mutableIntStateOf(start.coerceIn(0, items.size - 1)) }
    var paused by remember { mutableStateOf(false) }
    val progress = remember { Animatable(0f) }
    val item = items[index]
    fun go(d: Int) { index = (index + d + items.size) % items.size }

    // pictures: 4 s timer that keeps its place when paused
    var timedIndex by remember { mutableIntStateOf(-1) }
    LaunchedEffect(index, paused) {
        if (timedIndex != index) { progress.snapTo(0f); timedIndex = index } // new item (also by hand) -> timer from 0
        if (item.second || items.size < 2) return@LaunchedEffect
        if (paused) { progress.stop(); return@LaunchedEffect }
        val rest = (1f - progress.value).coerceIn(0.05f, 1f)
        progress.animateTo(1f, tween((4000 * rest).toInt(), easing = LinearEasing))
        go(1)
    }

    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(
            Modifier.fillMaxSize().background(Color.Black).pointerInput(items.size) {
                var dx = 0f
                detectHorizontalDragGestures(onDragStart = { dx = 0f }, onDragEnd = { if (dx < -60) go(1) else if (dx > 60) go(-1) }) { _, d -> dx += d }
            },
            contentAlignment = Alignment.Center
        ) {
            if (item.second) {
                AndroidView(
                    factory = { ctx ->
                        VideoView(ctx).apply {
                            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
                        }
                    },
                    update = { v ->
                        if (v.tag != item.first) {
                            v.tag = item.first
                            v.setVideoURI(Uri.parse(item.first))
                            v.setOnPreparedListener { if (!paused) it.start() }
                            v.setOnCompletionListener { if (!paused && items.size > 1) go(1) else v.seekTo(0) }
                            v.setOnErrorListener { _, _, _ -> if (items.size > 1) go(1); true }
                        }
                        if (paused && v.isPlaying) v.pause() else if (!paused && !v.isPlaying && v.tag == item.first) v.start()
                    },
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                AsyncImage(model = item.first, contentDescription = null, contentScale = ContentScale.Fit, modifier = Modifier.fillMaxSize())
            }
            // tap zones: left = back, right = next
            Row(Modifier.fillMaxSize().padding(top = 80.dp, bottom = 80.dp)) {
                Box(Modifier.weight(0.3f).fillMaxHeight().clickable { go(-1) })
                Spacer(Modifier.weight(0.4f))
                Box(Modifier.weight(0.3f).fillMaxHeight().clickable { go(1) })
            }
            if (items.size > 1) {
                Box(Modifier.align(Alignment.TopCenter).padding(top = 10.dp, start = 72.dp, end = 72.dp).fillMaxWidth().height(3.dp).clip(RoundedCornerShape(2.dp)).background(Color.White.copy(alpha = 0.3f))) {
                    Box(Modifier.fillMaxWidth(if (item.second) 1f else progress.value).height(3.dp).background(Color.White))
                }
                Box(
                    Modifier.align(Alignment.TopStart).padding(16.dp).size(44.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.2f)).clickable { paused = !paused },
                    contentAlignment = Alignment.Center
                ) { Text(if (paused) "▶" else "⏸", color = Color.White, fontSize = 18.sp) }
                Text("${index + 1} / ${items.size}", color = Color.White.copy(alpha = 0.85f), fontSize = 12.sp, modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 18.dp))
                Row(Modifier.align(Alignment.CenterStart).fillMaxWidth().padding(horizontal = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Box(Modifier.size(40.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.15f)).clickable { go(-1) }, contentAlignment = Alignment.Center) { Text("‹", color = Color.White, fontSize = 24.sp) }
                    Box(Modifier.size(40.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.15f)).clickable { go(1) }, contentAlignment = Alignment.Center) { Text("›", color = Color.White, fontSize = 24.sp) }
                }
            }
            Box(
                Modifier.align(Alignment.TopEnd).padding(16.dp).size(40.dp).clip(CircleShape).background(Color.White).clickable { onClose() },
                contentAlignment = Alignment.Center
            ) { Text("✕", color = Color.Black, fontSize = 18.sp) }
            if (paused) Text(if (language == AppLanguage.TURKISH) "Durduruldu" else "Angehalten", color = Color.White, fontSize = 12.sp, modifier = Modifier.align(Alignment.TopStart).padding(top = 64.dp, start = 16.dp))
        }
    }
}
