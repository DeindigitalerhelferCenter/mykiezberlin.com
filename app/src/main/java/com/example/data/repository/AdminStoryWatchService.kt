package com.example.data.repository

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.toBitmap
import com.example.MainActivity
import com.example.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Admin phone only (2026-11-11): watches /api/admin-pending every minute while the admin is logged in,
 * so a new user story is reported at once with a loud sound – not only every 15 minutes.
 * While stories are still waiting, it reminds the admin again every [remindMinutes] minutes.
 * The admin can switch it (and the sound) on/off in the admin panel (🔔 button).
 * Without Firebase this needs a small permanent notification ("Admin-Wächter aktiv").
 */
class AdminStoryWatchService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var loop: Job? = null
    private val client = OkHttpClient.Builder().connectTimeout(10, TimeUnit.SECONDS).readTimeout(15, TimeUnit.SECONDS).build()

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (!shouldRun(this)) {
            stopSelf()
            return START_NOT_STICKY
        }
        createChannels(this)
        val ongoing = NotificationCompat.Builder(this, CHANNEL_WATCH)
            .setSmallIcon(R.drawable.ic_mykiez_logo)
            .setContentTitle("Admin-Wächter aktiv · Admin bekçisi açık")
            .setContentText("Neue Stories werden sofort gemeldet · Yeni story'ler hemen bildirilir")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setContentIntent(openAdmin(this, 1))
            .build()
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(ONGOING_ID, ongoing, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
            } else {
                startForeground(ONGOING_ID, ongoing)
            }
        } catch (e: Exception) {
            // Android may refuse a start from the background; the 15-minute worker still reports new stories.
            stopSelf()
            return START_NOT_STICKY
        }
        if (loop?.isActive != true) loop = scope.launch { watch() }
        return START_STICKY
    }

    override fun onDestroy() {
        loop?.cancel()
        super.onDestroy()
    }

    private suspend fun watch() {
        val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        while (scope.isActive) {
            if (!shouldRun(this)) {
                stopSelf()
                return
            }
            try {
                val pending = fetchPending()
                if (pending != null) {
                    val known = prefs.getStringSet(KEY_KNOWN, emptySet()).orEmpty()
                    val ids = pending.map { it.first }.toSet()
                    val fresh = pending.filter { it.first !in known }
                    val now = System.currentTimeMillis()
                    val lastAlert = prefs.getLong(KEY_LAST_ALERT, 0L)
                    val remindMs = remindMinutes(this) * 60_000L
                    when {
                        fresh.isNotEmpty() -> {
                            alert(fresh.first().second, pending.size, reminder = false)
                            prefs.edit().putLong(KEY_LAST_ALERT, now).apply()
                        }
                        pending.isNotEmpty() && remindMs > 0 && now - lastAlert >= remindMs -> {
                            alert(pending.first().second, pending.size, reminder = true)
                            prefs.edit().putLong(KEY_LAST_ALERT, now).apply()
                        }
                        pending.isEmpty() -> NotificationManagerCompat.from(this).cancel(ALERT_ID)
                    }
                    prefs.edit().putStringSet(KEY_KNOWN, ids).apply()
                }
                // New support messages (wrong number, broken link …): one alert each (2026-11-11)
                lastSupport?.let { list ->
                    val knownSup = prefs.getStringSet(KEY_KNOWN_SUPPORT, emptySet()).orEmpty()
                    val freshSup = list.filter { it.first !in knownSup }
                    if (freshSup.isNotEmpty()) alertSupport(freshSup.first().second, list.size)
                    prefs.edit().putStringSet(KEY_KNOWN_SUPPORT, list.map { it.first }.toSet()).apply()
                }
            } catch (_: Exception) {
            }
            delay(POLL_MS)
        }
    }

    /** List of (id, "headline – author (kiez)") or null when the server could not be asked. */
    private var lastSupport: List<Pair<String, String>>? = null

    private fun fetchPending(): List<Pair<String, String>>? {
        val token = KiezStorageManager.getAdminToken(this)
        if (token.isBlank()) return null
        val request = Request.Builder().url(PENDING_URL).header("x-admin-token", token).build()
        client.newCall(request).execute().use { response ->
            if (response.code == 401) return null
            if (!response.isSuccessful) return null
            val root = JSONObject(response.body?.string().orEmpty())
            lastSupport = root.optJSONArray("support")?.let { sup ->
                (0 until sup.length()).map { i ->
                    val o = sup.getJSONObject(i)
                    val who = o.optString("sponsor").ifBlank { if (o.optString("topic") == "app") "App" else "Support" }
                    o.optString("id") to "$who: ${o.optString("message").take(140)}"
                }
            }
            val arr = root.optJSONArray("stories") ?: return emptyList()
            return (0 until arr.length()).map { i ->
                val o = arr.getJSONObject(i)
                val author = o.optString("author").ifBlank { "Kiez Community" }
                o.optString("id") to "${o.optString("headline")} – $author (${o.optString("kiez")})"
            }
        }
    }

    private fun alert(text: String, count: Int, reminder: Boolean) {
        val manager = NotificationManagerCompat.from(this)
        if (!manager.areNotificationsEnabled()) return
        val sound = isSoundOn(this)
        val title = when {
            reminder -> "⏰ Erinnerung: $count Story wartet · $count story onay bekliyor"
            count > 1 -> "🔔 Neue Story ($count warten) · Yeni story ($count bekliyor)"
            else -> "🔔 Neue Story zur Freigabe · Onay bekleyen yeni story"
        }
        val logo = ContextCompat.getDrawable(this, R.mipmap.ic_launcher)?.toBitmap(128, 128)
        val builder = NotificationCompat.Builder(this, if (sound) CHANNEL_ALERT else CHANNEL_SILENT)
            .setSmallIcon(R.drawable.ic_mykiez_logo)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setAutoCancel(true)
            .setContentIntent(openAdmin(this, 2))
        if (logo != null) builder.setLargeIcon(logo)
        try {
            manager.notify(ALERT_ID, builder.build())
        } catch (_: SecurityException) {
        }
    }

    private fun alertSupport(text: String, count: Int) {
        val manager = NotificationManagerCompat.from(this)
        if (!manager.areNotificationsEnabled()) return
        val builder = NotificationCompat.Builder(this, if (isSoundOn(this)) CHANNEL_ALERT else CHANNEL_SILENT)
            .setSmallIcon(R.drawable.ic_mykiez_logo)
            .setContentTitle("🛠 Support-Meldung ($count offen) · Destek bildirimi")
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(openAdmin(this, 3))
        try { manager.notify(SUPPORT_ID, builder.build()) } catch (_: SecurityException) {}
    }

    companion object {
        private const val KEY_KNOWN_SUPPORT = "known_support"
        private const val SUPPORT_ID = 4713
        private const val PENDING_URL = "https://mykiezberlin.com/api/admin-pending"
        private const val PREFS = "admin_watch"
        private const val KEY_KNOWN = "known"
        private const val KEY_LAST_ALERT = "last_alert"
        private const val KEY_ENABLED = "enabled"
        private const val KEY_SOUND = "sound"
        private const val KEY_REMIND = "remind_minutes"
        private const val CHANNEL_WATCH = "admin_watch"
        private const val CHANNEL_ALERT = "admin_story_alert_v1"
        private const val CHANNEL_SILENT = "admin_story_silent_v1"
        private const val ONGOING_ID = 4711
        private const val ALERT_ID = 4712
        private const val POLL_MS = 60_000L
        val REMIND_CHOICES = listOf(0, 10, 30, 60)

        fun isEnabled(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_ENABLED, true)
        fun isSoundOn(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_SOUND, true)
        fun remindMinutes(c: Context) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getInt(KEY_REMIND, 10)
        fun shouldRun(c: Context) = isEnabled(c) && KiezStorageManager.isAdminAuthenticated(c) && KiezStorageManager.getAdminToken(c).isNotBlank()

        fun setEnabled(c: Context, on: Boolean) {
            c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_ENABLED, on).apply()
            sync(c)
        }
        fun setSound(c: Context, on: Boolean) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_SOUND, on).apply()
        fun setRemindMinutes(c: Context, minutes: Int) = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putInt(KEY_REMIND, minutes).apply()

        /** Starts or stops the watcher to match login state and the admin's switch. */
        fun sync(c: Context) {
            val intent = Intent(c, AdminStoryWatchService::class.java)
            if (shouldRun(c)) {
                try { ContextCompat.startForegroundService(c, intent) } catch (_: Exception) {}
            } else {
                try { c.stopService(intent) } catch (_: Exception) {}
                NotificationManagerCompat.from(c).cancel(ONGOING_ID)
            }
        }

        private fun openAdmin(c: Context, code: Int): PendingIntent {
            val intent = Intent(c, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("extra_target_screen", "ADMIN")
            }
            return PendingIntent.getActivity(c, 9000 + code, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        }

        fun createChannels(c: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            val nm = c.getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(NotificationChannel(CHANNEL_WATCH, "Admin-Wächter", NotificationManager.IMPORTANCE_MIN).apply { setShowBadge(false) })
            val loud = NotificationChannel(CHANNEL_ALERT, "Admin: neue Story (laut)", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Laute Meldung, wenn eine Story auf Freigabe wartet"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 400, 200, 400, 200, 600)
                val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE) ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                setSound(uri, AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
            }
            nm.createNotificationChannel(loud)
            nm.createNotificationChannel(NotificationChannel(CHANNEL_SILENT, "Admin: neue Story (leise)", NotificationManager.IMPORTANCE_HIGH).apply { setSound(null, null) })
        }
    }
}
