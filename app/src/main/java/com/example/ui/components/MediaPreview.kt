package com.example.ui.components

import android.net.Uri
import android.widget.FrameLayout
import android.widget.VideoView
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import coil.decode.VideoFrameDecoder
import coil.request.ImageRequest
import coil.request.videoFrameMillis

/**
 * Preview of a story picture or video for the admin (2026-11-11).
 * Videos show a frame (0.5 s) with ▶️; a tap opens the picture / plays the video full screen.
 * [model] = content:// Uri (picked file) or https URL (server).
 */
@Composable
fun MediaPreview(model: Any?, isVideo: Boolean, modifier: Modifier = Modifier, cornerDp: Int = 8) {
    if (model == null) return
    val context = LocalContext.current
    var full by remember { mutableStateOf(false) }
    val request = remember(model, isVideo) {
        ImageRequest.Builder(context).data(model).apply {
            if (isVideo) {
                decoderFactory(VideoFrameDecoder.Factory())
                videoFrameMillis(500)
            }
        }.crossfade(true).build()
    }
    Box(modifier.clip(RoundedCornerShape(cornerDp.dp)).background(Color(0xFF111111)).clickable { full = true }, contentAlignment = Alignment.Center) {
        AsyncImage(model = request, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
        if (isVideo) {
            Box(Modifier.size(36.dp).clip(CircleShape).background(Color.Black.copy(alpha = 0.55f)), contentAlignment = Alignment.Center) {
                Text("▶", color = Color.White, fontSize = 18.sp)
            }
        }
    }
    if (full) MediaFullScreen(model, isVideo) { full = false }
}

@Composable
fun MediaFullScreen(model: Any, isVideo: Boolean, onClose: () -> Unit) {
    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
            if (isVideo) {
                val uri = if (model is Uri) model else Uri.parse(model.toString())
                AndroidView(
                    factory = { ctx ->
                        VideoView(ctx).apply {
                            layoutParams = FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
                            setMediaController(android.widget.MediaController(ctx).also { it.setAnchorView(this) })
                            setVideoURI(uri)
                            setOnPreparedListener { it.start() }
                            setOnErrorListener { _, _, _ -> true }
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                AsyncImage(model = model, contentDescription = null, contentScale = ContentScale.Fit, modifier = Modifier.fillMaxSize())
            }
            Box(
                Modifier.align(Alignment.TopEnd).padding(16.dp).size(40.dp).clip(CircleShape).background(Color.White).clickable { onClose() },
                contentAlignment = Alignment.Center
            ) { Text("✕", color = Color.Black, fontSize = 18.sp) }
        }
    }
}
