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
            append("\n📢 WhatsApp-Kanal: ").append(com.example.ui.components.MkSocial.WA_CHANNEL) // 2026-11-21 (owner)
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

    /**
     * 2026-11-23 (owner "UYGULA 1", v1.51): the admin confirms "✓ Paylaştım" after sharing by hand -> the server remembers
     * it (same as the web, /api/social-planer action "manualShared"), so this story is never offered again for that
     * channel (TikTok / WhatsApp package; Instagram/Facebook = the automatic Facebook/Instagram posting skips it).
     * Blocking – call off the main thread. true = saved.
     */
    fun markShared(context: Context, target: String, storyId: String): Boolean {
        val token = com.example.data.repository.KiezStorageManager.getAdminToken(context)
        if (token.isBlank() || storyId.isBlank()) return false
        return try {
            val con = java.net.URL("https://mykiezberlin.com/api/social-planer").openConnection() as java.net.HttpURLConnection
            con.requestMethod = "POST"
            con.connectTimeout = 15000
            con.readTimeout = 15000
            con.doOutput = true
            con.setRequestProperty("content-type", "application/json")
            con.setRequestProperty("x-admin-token", token)
            val body = org.json.JSONObject().put("action", "manualShared").put("target", target).put("id", storyId).toString()
            con.outputStream.use { it.write(body.toByteArray()) }
            val ok = con.responseCode in 200..299
            con.disconnect()
            ok
        } catch (_: Exception) {
            false
        }
    }

    /**
     * 2026-11-23 (owner "UYGULA 2", v1.51): share one sponsor picture/video (sponsor story viewer) with the phone share
     * sheet. The text ends with the sponsor page /s/<id>, My Kiez Berlin, the web page and the app link (same as the web).
     * Blocking download – call off the main thread, then [startSponsorShare] on the main thread.
     */
    fun prepareSponsorMedia(context: Context, url: String, isVideo: Boolean): Pair<Uri, String>? {
        val dir = File(context.cacheDir, "share").apply { mkdirs() }
        return try {
            val file = File(dir, "MyKiezBerlin_Sponsor_${System.currentTimeMillis()}." + if (isVideo) "mp4" else "jpg")
            java.net.URL(url).openStream().use { input -> file.outputStream().use { input.copyTo(it) } }
            FileProvider.getUriForFile(context, context.packageName + ".fileprovider", file) to (if (isVideo) "video/mp4" else "image/jpeg")
        } catch (_: Exception) {
            null
        }
    }

    fun sponsorText(name: String, adId: String, caption: String, turkish: Boolean): String = buildString {
        append("📣 ").append(name)
        if (caption.isNotBlank()) append('\n').append(caption)
        append("\n\n")
        append(if (turkish) "👉 Tüm resim ve videolarımız: " else "👉 Alle Bilder & Videos: ").append("https://mykiezberlin.com/s/").append(Uri.encode(adId))
        append("\n📍 My Kiez Berlin · mykiezberlin.com")
        append("\n📲 App: ").append(APK_URL)
    }

    fun startSponsorShare(context: Context, text: String, media: Pair<Uri, String>?) {
        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("My Kiez Berlin", text))
        val intent = Intent(Intent.ACTION_SEND).apply {
            if (media != null) {
                type = media.second
                putExtra(Intent.EXTRA_STREAM, media.first)
                clipData = ClipData.newRawUri("sponsor", media.first)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            } else type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, text)
        }
        try {
            context.startActivity(Intent.createChooser(intent, "My Kiez Berlin").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: Exception) { /* no app to share with */ }
        Toast.makeText(context, "Text + Link kopiert · Metin ve link kopyalandı", Toast.LENGTH_SHORT).show()
    }
}
