package com.example.util

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.core.content.FileProvider
import com.example.data.model.KiezStory
import java.io.File

/**
 * Admin only: shares a story to WhatsApp, Instagram, Facebook or TikTok.
 * The picture goes with the logo (as in the download), a video unchanged, a text story as generated picture.
 * The text always carries the link, the app download link and the web name (same as the web, admin-share.js).
 */
object StoryShareHelper {
    const val APK_URL = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk"

    private val PACKAGES = mapOf(
        "whatsapp" to listOf("com.whatsapp", "com.whatsapp.w4b"),
        "instagram" to listOf("com.instagram.android"),
        "facebook" to listOf("com.facebook.katana", "com.facebook.lite"),
        "tiktok" to listOf("com.zhiliaoapp.musically", "com.ss.android.ugc.trill")
    )

    fun shareText(story: KiezStory): String {
        val link = story.link.takeIf { it.isNotBlank() && !Regex("^https://mykiezberlin\\.com/?$").matches(it) } ?: "https://mykiezberlin.com"
        return buildString {
            append("📍 My Kiez Berlin · ").append(story.kiez).append('\n')
            append(story.headline)
            if (story.subtext.isNotBlank()) append('\n').append(story.subtext)
            append("\n\n👉 ").append(link)
            append("\n📲 App: ").append(APK_URL)
            append("\n🌐 mykiezberlin.com")
        }
    }

    /** Builds the media file in the cache (blocking – call off the main thread). Null = text only. */
    fun prepareMedia(context: Context, story: KiezStory): Pair<Uri, String>? {
        val dir = File(context.cacheDir, "share").apply { mkdirs() }
        dir.listFiles()?.forEach { if (System.currentTimeMillis() - it.lastModified() > 3_600_000L) it.delete() }
        return try {
            if (story.isVideo && !story.mediaUri.isNullOrBlank()) {
                val file = File(dir, "MyKiezBerlin_Story_${System.currentTimeMillis()}.mp4")
                val source = story.mediaUri
                if (source.startsWith("http")) {
                    java.net.URL(source).openStream().use { input -> file.outputStream().use { input.copyTo(it) } }
                } else {
                    context.contentResolver.openInputStream(Uri.parse(source))?.use { input -> file.outputStream().use { input.copyTo(it) } } ?: return null
                }
                FileProvider.getUriForFile(context, context.packageName + ".fileprovider", file) to "video/mp4"
            } else {
                val bitmap = WatermarkHelper.loadStoryBitmap(context, story.mediaResId, story.mediaUri, false)
                val finalBitmap = if (bitmap != null) WatermarkHelper.addLogoWatermark(context, bitmap)
                else WatermarkHelper.createTextStoryBitmap(context, story.headline, story.subtext, story.kiez)
                val file = File(dir, "MyKiezBerlin_Story_${System.currentTimeMillis()}.jpg")
                file.outputStream().use { finalBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 92, it) }
                FileProvider.getUriForFile(context, context.packageName + ".fileprovider", file) to "image/jpeg"
            }
        } catch (_: Exception) {
            null
        }
    }

    /** Opens the chosen app with media + text. The text is always copied too (Instagram / Facebook / TikTok drop it). */
    fun share(context: Context, story: KiezStory, target: String, media: Pair<Uri, String>?) {
        val text = shareText(story)
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("My Kiez Berlin", text))

        val intent = Intent(Intent.ACTION_SEND).apply {
            if (media != null) {
                type = media.second
                putExtra(Intent.EXTRA_STREAM, media.first)
                clipData = ClipData.newRawUri("story", media.first)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            } else {
                type = "text/plain"
            }
            putExtra(Intent.EXTRA_TEXT, text)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val installed = PACKAGES[target].orEmpty().firstOrNull { pkg ->
            try { context.packageManager.getPackageInfo(pkg, 0); true } catch (_: Exception) { false }
        }
        if (installed != null) intent.setPackage(installed)
        try {
            context.startActivity(if (installed != null) intent else Intent.createChooser(intent, "My Kiez Berlin").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: Exception) {
            context.startActivity(Intent.createChooser(intent.setPackage(null), "My Kiez Berlin").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        }
        val hint = when (target) {
            "whatsapp" -> "Text + Link sind dabei · Metin ve link ekli"
            "instagram" -> "Link kopiert – als Link-Sticker einfügen · Link kopyalandı – link çıkartmasına yapıştır"
            else -> "Text + Link kopiert – dort einfügen · Metin ve link kopyalandı – orada yapıştır"
        }
        Toast.makeText(context, hint, Toast.LENGTH_LONG).show()
    }
}
