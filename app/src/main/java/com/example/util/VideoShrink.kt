package com.example.util

import android.content.Context
import android.media.MediaMetadataRetriever
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.effect.Presentation
import androidx.media3.transformer.Composition
import androidx.media3.transformer.DefaultEncoderFactory
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.Transformer
import androidx.media3.transformer.VideoEncoderSettings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import java.io.File
import kotlin.coroutines.resume

/**
 * 2026-11-17 (owner): videos are made smaller in the app before upload, automatically.
 * - longest allowed video: MAX_SECONDS (3 minutes)
 * - picture: short side at most 720 px (720p), H.264 about 2 Mbit/s + AAC sound -> about 15 MB per minute
 * - the server limit stays 50 MB; a 3-minute 720p video is about 45 MB
 * If the phone cannot convert a video, the original is sent when it is small enough (nothing is lost).
 */
object VideoShrink {
    const val MAX_SECONDS = 180
    const val MAX_BYTES = 50_000_000
    private const val SHORT_SIDE = 720
    private const val BITRATE = 2_000_000

    /** bytes = file to upload; error = "VIDEO_LONG" (over 3 min) | "FILE" (too big / unreadable) */
    data class Result(val bytes: ByteArray?, val mimeType: String, val error: String? = null)

    private class Info(val seconds: Int, val width: Int, val height: Int)

    private fun info(context: Context, uri: Uri): Info? = try {
        val r = MediaMetadataRetriever()
        try {
            r.setDataSource(context, uri)
            val ms = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
            var w = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull() ?: 0
            var h = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull() ?: 0
            val rot = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0
            if (rot == 90 || rot == 270) { val t = w; w = h; h = t } // size as it is shown
            Info(((ms + 999) / 1000).toInt(), w, h)
        } finally {
            r.release()
        }
    } catch (_: Exception) {
        null
    }

    private fun even(v: Int) = if (v % 2 == 0) v else v - 1

    /** Converts the video to 720p H.264; true when the new file was written. Must start on the main thread. */
    private suspend fun convert(context: Context, uri: Uri, out: File, width: Int, height: Int): Boolean = withContext(Dispatchers.Main) {
        val short = minOf(width, height)
        val scale = if (short > SHORT_SIDE) SHORT_SIDE.toFloat() / short else 1f
        val tw = even((width * scale).toInt()).coerceAtLeast(2)
        val th = even((height * scale).toInt()).coerceAtLeast(2)
        val effects = if (width > 0 && height > 0)
            Effects(emptyList(), listOf(Presentation.createForWidthAndHeight(tw, th, Presentation.LAYOUT_SCALE_TO_FIT)))
        else Effects.EMPTY
        val item = EditedMediaItem.Builder(MediaItem.fromUri(uri)).setEffects(effects).build()
        val encoder = DefaultEncoderFactory.Builder(context.applicationContext)
            .setRequestedVideoEncoderSettings(VideoEncoderSettings.Builder().setBitrate(BITRATE).build())
            .build()
        withTimeoutOrNull(10 * 60_000L) {
            suspendCancellableCoroutine { cont ->
                val transformer = Transformer.Builder(context.applicationContext)
                    .setVideoMimeType(MimeTypes.VIDEO_H264)
                    .setAudioMimeType(MimeTypes.AUDIO_AAC)
                    .setEncoderFactory(encoder)
                    .addListener(object : Transformer.Listener {
                        override fun onCompleted(composition: Composition, exportResult: ExportResult) {
                            if (cont.isActive) cont.resume(true)
                        }
                        override fun onError(composition: Composition, exportResult: ExportResult, exportException: ExportException) {
                            if (cont.isActive) cont.resume(false)
                        }
                    })
                    .build()
                cont.invokeOnCancellation { runCatching { transformer.cancel() } }
                transformer.start(item, out.absolutePath)
            }
        } ?: false
    }

    /** Video from the gallery -> file to upload (made smaller), or an error code. Never throws. */
    // 2026-11-24 (owner, v1.53): unlimited = admin / trusted account – no 3-minute and no 50 MB limit (still made smaller)
    suspend fun prepare(context: Context, uri: Uri, unlimited: Boolean = false): Result {
        val i = info(context, uri)
        if (!unlimited && i != null && i.seconds > MAX_SECONDS) return Result(null, "video/mp4", "VIDEO_LONG")
        val out = File(context.cacheDir, "upload_${System.currentTimeMillis()}.mp4")
        val small: ByteArray? = try {
            if (convert(context, uri, out, i?.width ?: 0, i?.height ?: 0) && out.length() > 0) out.readBytes() else null
        } catch (_: Throwable) {
            null
        } finally {
            out.delete()
        }
        val originalSize = try { context.contentResolver.openAssetFileDescriptor(uri, "r")?.use { it.length } ?: -1L } catch (_: Exception) { -1L }
        // use the smaller one; the original only when it fits the server limit
        if (small != null && (originalSize <= 0 || small.size < originalSize)) {
            return if (unlimited || small.size <= MAX_BYTES) Result(small, "video/mp4") else Result(null, "video/mp4", "FILE")
        }
        if (originalSize in 1..(if (unlimited) Long.MAX_VALUE else MAX_BYTES.toLong())) {
            val bytes = withContext(Dispatchers.IO) { context.contentResolver.openInputStream(uri)?.use { it.readBytes() } }
            val type = context.contentResolver.getType(uri) ?: "video/mp4"
            if (bytes != null) return Result(bytes, if (type.startsWith("video/")) type else "video/mp4")
        }
        return Result(null, "video/mp4", "FILE")
    }
}
