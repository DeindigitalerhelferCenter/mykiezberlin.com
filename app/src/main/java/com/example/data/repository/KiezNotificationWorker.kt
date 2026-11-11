package com.example.data.repository

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.toBitmap
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.example.BuildConfig
import com.example.MainActivity
import com.example.R
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.IOException
import java.time.LocalDate
import java.util.concurrent.TimeUnit

/** Polls the server for urgent events and shows them with the app logo. */
class KiezNotificationWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    private data class Item(val id: String, val kind: String, val title: String, val body: String, val screen: String)

    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    override suspend fun doWork(): Result {
        if (!KiezStorageManager.isNotificationsEnabled(applicationContext)) return Result.success()
        val items = try {
            fetchItems().let { it + adminShareItems(it) }
        } catch (e: IOException) {
            return Result.retry()
        }
        val seen = prefs.getStringSet(KEY_SEEN, emptySet()).orEmpty().toMutableSet()
        val fresh = items.filter { it.id !in seen }.sortedBy { if (it.kind == "critical") 0 else 1 }
        var shownThisRun = 0
        for (item in fresh) {
            seen.add(item.id)
            // Admin notes (share reminder, new requests) do not take the place of user notifications
            if ((item.kind == "admin" || shownThisRun < MAX_PER_RUN) && mayShow(item)) {
                show(item)
                if (item.kind != "admin") shownThisRun += 1
            }
        }
        prefs.edit().putStringSet(KEY_SEEN, seen.toList().takeLast(MAX_SEEN_IDS).toSet()).apply()
        return Result.success()
    }

    private fun fetchItems(): List<Item> {
        val demo = if (BuildConfig.GOAL_DEMO) listOf(Item("demo-${System.currentTimeMillis()}", "alert", "My Kiez Berlin", "Test-Benachrichtigung", "LIVE_BULLETIN")) else emptyList()
        val request = Request.Builder().url(NOTIFY_URL).build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("HTTP ${response.code}")
            val list = JSONObject(response.body?.string().orEmpty()).optJSONArray("items")
            return demo + adminRequestItems() + adminPendingStories() + (0 until (list?.length() ?: 0)).map { i ->
                val o = list!!.getJSONObject(i)
                // Hourly items carry DE / TR / EN text; show the app language
                val suffix = when (KiezStorageManager.loadLanguage(applicationContext)) {
                    com.example.data.model.AppLanguage.TURKISH -> "_tr"
                    com.example.data.model.AppLanguage.ENGLISH -> "_en"
                    else -> ""
                }
                val title = o.optString("title$suffix").ifBlank { o.optString("title") }
                val body = o.optString("body$suffix").ifBlank { o.optString("body") }
                Item(o.optString("id"), o.optString("kind"), title, body, o.optString("screen"))
            }
        }
    }

    // Admin only: a planned story just went live -> one tap opens it with the share buttons.
    private fun adminShareItems(items: List<Item>): List<Item> {
        if (!KiezStorageManager.isAdminAuthenticated(applicationContext)) return emptyList()
        return items.filter { it.kind == "story" && it.id.startsWith("story-") }.map {
            Item("share-" + it.id, "admin", "📣 Story online – jetzt teilen / şimdi paylaş", it.body, "SHARE_STORY:" + it.id.removePrefix("story-"))
        }
    }

    // Admin only: stories waiting for approval, so the admin does not have to check the list.
    private fun adminPendingStories(): List<Item> {
        if (!KiezStorageManager.isAdminAuthenticated(applicationContext)) return emptyList()
        // The admin watcher (every minute, loud) already reports them; restart it if Android stopped it.
        if (AdminStoryWatchService.shouldRun(applicationContext)) {
            AdminStoryWatchService.sync(applicationContext)
            return emptyList()
        }
        return try {
            val request = Request.Builder().url(ADMIN_PENDING_URL)
                .header("x-admin-token", KiezStorageManager.getAdminToken(applicationContext)).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return emptyList()
                val arr = JSONObject(response.body?.string().orEmpty()).optJSONArray("stories") ?: return emptyList()
                (0 until arr.length()).map { i ->
                    val o = arr.getJSONObject(i)
                    val author = o.optString("author").ifBlank { "Kiez Community" }
                    Item("pending-" + o.optString("id"), "admin", "🆕 Neue Story wartet auf Freigabe", "${o.optString("headline")} – $author (${o.optString("kiez")})", "ADMIN")
                }
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    // Admin only: new advertising requests from /werben (also listed in the web admin panel).
    private fun adminRequestItems(): List<Item> {
        if (!KiezStorageManager.isAdminAuthenticated(applicationContext)) return emptyList()
        return try {
            val request = Request.Builder().url(WERBEN_ADMIN_URL)
                .header("x-admin-token", KiezStorageManager.getAdminToken(applicationContext)).build()
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return emptyList()
                val list = JSONObject(response.body?.string().orEmpty()).optJSONArray("requests") ?: return emptyList()
                (0 until list.length()).mapNotNull { i ->
                    val o = list.getJSONObject(i)
                    if (o.optString("status") != "new") return@mapNotNull null
                    val size = mapOf("s" to "Kiez Basic 29 €", "m" to "Kiez Plus 49 €", "l" to "Kiez Premium 89 €", "banner" to "Banner", "gp" to "Gründungspartner")[o.optString("size")] ?: o.optString("size")
                    Item("req-" + o.optString("id"), "admin", "Neue Werbeanfrage", "${o.optString("company")} · $size", "ADMIN")
                }
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    // Critical warnings always get through; everything else shares a small daily budget.
    private fun mayShow(item: Item): Boolean {
        if (item.kind == "critical" || item.kind == "admin") return true
        val today = LocalDate.now().toString()
        if (item.kind == "story") {
            // Planned stories of the admin: one notification each time a story goes live (own quota).
            val usedStory = if (prefs.getString(KEY_STORY_DAY, "") == today) prefs.getInt(KEY_STORY_COUNT, 0) else 0
            if (usedStory >= STORY_DAILY_LIMIT) return false
            prefs.edit().putString(KEY_STORY_DAY, today).putInt(KEY_STORY_COUNT, usedStory + 1).apply()
            return true
        }
        if (item.kind == "hourly") {
            // Own quota for the hourly news / invitations (08–21 h), so urgent alerts keep theirs.
            val usedHourly = if (prefs.getString(KEY_HOURLY_DAY, "") == today) prefs.getInt(KEY_HOURLY_COUNT, 0) else 0
            if (usedHourly >= HOURLY_DAILY_LIMIT) return false
            prefs.edit().putString(KEY_HOURLY_DAY, today).putInt(KEY_HOURLY_COUNT, usedHourly + 1).apply()
            return true
        }
        val used = if (prefs.getString(KEY_DAY, "") == today) prefs.getInt(KEY_COUNT, 0) else 0
        if (used >= DAILY_LIMIT) return false
        prefs.edit().putString(KEY_DAY, today).putInt(KEY_COUNT, used + 1).apply()
        return true
    }

    private fun show(item: Item) {
        val manager = NotificationManagerCompat.from(applicationContext)
        if (!manager.areNotificationsEnabled()) return
        createChannel()
        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("extra_target_screen", item.screen)
        }
        val pending = PendingIntent.getActivity(
            applicationContext, item.id.hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val logo = ContextCompat.getDrawable(applicationContext, R.mipmap.ic_launcher)?.toBitmap(LOGO_SIZE, LOGO_SIZE)
        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_mykiez_logo)
            .setLargeIcon(logo)
            .setContentTitle(item.title)
            .setContentText(item.body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(item.body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pending)
            .build()
        try {
            manager.notify(item.id.hashCode(), notification)
        } catch (e: SecurityException) {
            // The user withdrew the notification permission in the meantime.
        }
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(CHANNEL_ID, "Berlin-Meldungen", NotificationManager.IMPORTANCE_HIGH)
        applicationContext.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    companion object {
        private const val NOTIFY_URL = "https://mykiezberlin.com/api/notify"
        private const val WERBEN_ADMIN_URL = "https://mykiezberlin.com/api/werben"
        private const val ADMIN_PENDING_URL = "https://mykiezberlin.com/api/admin-pending"
        private const val WORK_NAME = "kiez_notifications"
        private const val CHANNEL_ID = "kiez_alerts"
        private const val PREFS = "kiez_notifications"
        private const val KEY_SEEN = "seen"
        private const val KEY_DAY = "day"
        private const val KEY_COUNT = "count"
        private const val DAILY_LIMIT = 4
        private const val KEY_HOURLY_DAY = "hourly_day"
        private const val KEY_HOURLY_COUNT = "hourly_count"
        private const val HOURLY_DAILY_LIMIT = 14
        private const val KEY_STORY_DAY = "story_day"
        private const val KEY_STORY_COUNT = "story_count"
        private const val STORY_DAILY_LIMIT = 30
        private const val MAX_PER_RUN = 2
        private const val MAX_SEEN_IDS = 200
        private const val LOGO_SIZE = 128
        // Android does not run periodic work more often than every 15 minutes.
        private const val INTERVAL_MINUTES = 15L

        private val client = OkHttpClient()

        fun schedule(context: Context) {
            val constraints = Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
            val request = PeriodicWorkRequestBuilder<KiezNotificationWorker>(INTERVAL_MINUTES, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build()
            val workManager = WorkManager.getInstance(context)
            workManager.enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.KEEP, request)
            if (BuildConfig.GOAL_DEMO) workManager.enqueue(OneTimeWorkRequestBuilder<KiezNotificationWorker>().build())
        }
    }
}
