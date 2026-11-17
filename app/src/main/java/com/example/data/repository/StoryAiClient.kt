package com.example.data.repository

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever
import android.net.Uri
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.concurrent.TimeUnit

/** Suggestion from /api/story-ai: headline and text in German + Turkish, Kiez, category and link from the picture. */
data class StoryAiResult(
    val headline: String,
    val subtext: String,
    val kiez: String,
    val kind: String,
    val link: String
)

/**
 * Admin only: reads a story picture or a video frame with Cloudflare Workers AI (same as the web planner).
 * Blocking – call it off the main thread. Throws with a short message when it fails.
 */
object StoryAiClient {
    private const val URL = "https://mykiezberlin.com/api/story-ai"
    private val client = OkHttpClient.Builder().connectTimeout(15, TimeUnit.SECONDS).readTimeout(90, TimeUnit.SECONDS).writeTimeout(60, TimeUnit.SECONDS).build()

    fun analyze(context: Context, uri: Uri, isVideo: Boolean): StoryAiResult {
        val frame = (if (isVideo) videoFrame(context, uri) else picture(context, uri)) ?: throw IllegalStateException("Bild nicht lesbar")
        // 2026-11-17: tall screenshots stay readable – short side at least 768 px, long side at most 2048 px
        val scaled = scaleReadable(frame)
        val out = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.JPEG, 85, out)
        val body = MultipartBody.Builder().setType(MultipartBody.FORM)
            .addFormDataPart("image", "frame.jpg", out.toByteArray().toRequestBody("image/jpeg".toMediaType()))
            .build()
        val request = Request.Builder().url(URL)
            .header("x-admin-token", KiezStorageManager.getAdminToken(context))
            .post(body).build()
        client.newCall(request).execute().use { resp ->
            val json = JSONObject(resp.body?.string().orEmpty().ifBlank { "{}" })
            if (!resp.isSuccessful) {
                throw IllegalStateException(when (json.optString("error")) {
                    "ai_unbound" -> "KI nicht verbunden"
                    "ai_empty" -> "Kein Text erkannt · metin bulunamadı – ✨ erneut"
                    else -> json.optString("error").ifBlank { "HTTP ${resp.code}" }
                })
            }
            if (json.optString("headline").isBlank() && json.optString("subtext").isBlank()) throw IllegalStateException("Kein Text erkannt · metin bulunamadı – ✨ erneut")
            return StoryAiResult(
                headline = json.optString("headline"),
                subtext = json.optString("subtext"),
                kiez = json.optString("kiez"),
                kind = json.optString("kind"),
                link = json.optString("link")
            )
        }
    }

    private fun picture(context: Context, uri: Uri): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 2048 && minOf(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 768) sample *= 2
        return context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample }) }
    }

    private fun videoFrame(context: Context, uri: Uri): Bitmap? {
        val retriever = MediaMetadataRetriever()
        return try {
            val text = uri.toString()
            if (text.startsWith("http")) retriever.setDataSource(text, HashMap()) else retriever.setDataSource(context, uri)
            retriever.getFrameAtTime(1_000_000L, MediaMetadataRetriever.OPTION_CLOSEST_SYNC) ?: retriever.frameAtTime
        } catch (_: Exception) {
            null
        } finally {
            try { retriever.release() } catch (_: Exception) {}
        }
    }

    private fun scaleReadable(bmp: Bitmap): Bitmap {
        val long = maxOf(bmp.width, bmp.height).toFloat()
        val short = minOf(bmp.width, bmp.height).toFloat()
        val factor = minOf(1f, maxOf(1024f / long, minOf(768f / short, 2048f / long)))
        return if (factor >= 1f) bmp else Bitmap.createScaledBitmap(bmp, (bmp.width * factor).toInt(), (bmp.height * factor).toInt(), true)
    }

    private fun scale(bmp: Bitmap, max: Int): Bitmap {
        val factor = minOf(1f, max.toFloat() / maxOf(bmp.width, bmp.height))
        return if (factor >= 1f) bmp else Bitmap.createScaledBitmap(bmp, (bmp.width * factor).toInt(), (bmp.height * factor).toInt(), true)
    }
}
