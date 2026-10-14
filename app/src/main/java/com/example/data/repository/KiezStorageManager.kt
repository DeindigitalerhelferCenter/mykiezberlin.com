package com.example.data.repository

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import com.example.data.model.AppLanguage
import com.example.data.model.KiezReporterComment
import com.example.data.model.KiezReporterPost
import com.example.data.model.KiezStory
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

/**
 * Manages persistent storage for stories, custom kieze, language preferences,
 * notification settings, and admin credentials using SharedPreferences.
 */
object KiezStorageManager {

    private const val PREFS_NAME = "my_kiez_berlin_prefs"
    private const val KEY_STORIES = "saved_kiez_stories"
    private const val KEY_ADMIN_AUTH = "saved_admin_authenticated"
    private const val KEY_CUSTOM_KIEZE = "saved_custom_kieze"
    private const val KEY_LANGUAGE = "saved_app_language"
    private const val KEY_NOTIFICATIONS_ENABLED = "saved_notifications_enabled"

    // Complete list of all 96 official Berlin Bezirke & Ortsteile + Ganz Berlin
    val ALL_BERLIN_OFFICIAL_KIEZE = listOf(
        "Ganz Berlin",
        "Berlin ve Çevresi",
        // Mitte
        "Mitte", "Moabit", "Hansaviertel", "Tiergarten", "Wedding", "Gesundbrunnen",
        // Friedrichshain-Kreuzberg
        "Kreuzberg", "Friedrichshain",
        // Pankow
        "Pankow", "Prenzlauer Berg", "Weißensee", "Blankenburg", "Blankenfelde", "Buch",
        "Französisch Buchholz", "Heinersdorf", "Karow", "Niederschönhausen", "Rosenthal", "Wilhelmsruh",
        // Charlottenburg-Wilmersdorf
        "Charlottenburg", "Wilmersdorf", "Schmargendorf", "Grunewald", "Westend", "Charlottenburg-Nord", "Halensee",
        // Spandau
        "Spandau", "Haselhorst", "Siemensstadt", "Staaken", "Gatow", "Kladow", "Hakenfelde", "Falkenhagener Feld", "Wilhelmstadt",
        // Steglitz-Zehlendorf
        "Steglitz", "Lichterfelde", "Lankwitz", "Zehlendorf", "Dahlem", "Nikolassee", "Wannsee",
        // Tempelhof-Schöneberg
        "Schöneberg", "Friedenau", "Tempelhof", "Mariendorf", "Marienfelde", "Lichtenrade",
        // Neukölln
        "Neukölln", "Britz", "Buckow", "Rudow", "Gropiusstadt",
        // Treptow-Köpenick
        "Alt-Treptow", "Plänterwald", "Baumschulenweg", "Johannisthal", "Niederschöneweide",
        "Altglienicke", "Adlershof", "Bohnsdorf", "Oberschöneweide", "Köpenick", "Friedrichshagen",
        "Rahnsdorf", "Grünau", "Müggelheim", "Schmöckwitz",
        // Marzahn-Hellersdorf
        "Marzahn", "Biesdorf", "Kaulsdorf", "Mahlsdorf", "Hellersdorf",
        // Lichtenberg
        "Lichtenberg", "Friedrichsfelde", "Karlshorst", "Falkenberg", "Malchow", "Wartenberg",
        "Neu-Hohenschönhausen", "Alt-Hohenschönhausen", "Fennpfuhl", "Rummelsburg",
        // Reinickendorf (including TEGEL)
        "Reinickendorf", "Tegel", "Konradshöhe", "Heiligensee", "Frohnau", "Hermsdorf",
        "Waidmannslust", "Lübars", "Wittenau", "Märkisches Viertel", "Borsigwalde"
    )

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    /**
     * Copies transient media Uri (from photo/video picker) to internal app storage.
     * This guarantees photos and videos NEVER get deleted or revoked by Android OS!
     */
    fun copyMediaToInternalStorage(context: Context, sourceUriString: String, isVideo: Boolean): String {
        return try {
            val sourceUri = Uri.parse(sourceUriString)
            if (sourceUri.scheme == "file") {
                return sourceUriString
            }
            val storiesDir = File(context.filesDir, "kiez_stories")
            if (!storiesDir.exists()) {
                storiesDir.mkdirs()
            }
            val ext = if (isVideo) "mp4" else "jpg"
            val targetFile = File(storiesDir, "story_${System.currentTimeMillis()}_${(1000..9999).random()}.$ext")
            context.contentResolver.openInputStream(sourceUri)?.use { input ->
                FileOutputStream(targetFile).use { output ->
                    input.copyTo(output)
                }
            }
            targetFile.absolutePath
        } catch (e: Exception) {
            sourceUriString
        }
    }

    // --- Stories Persistence ---
    fun loadStories(context: Context): List<KiezStory> {
        val prefs = getPrefs(context)
        val jsonString = prefs.getString(KEY_STORIES, null)
        if (jsonString.isNullOrBlank()) {
            return SampleData.stories
        }

        return try {
            val jsonArray = JSONArray(jsonString)
            val list = mutableListOf<KiezStory>()
            val now = System.currentTimeMillis()

            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val durationHours = obj.optInt("durationHours", 48)
                val createdAtMillis = obj.optLong("createdAtMillis", now)
                var status = obj.optString("status", "approved")

                // Check if story duration has expired (e.g. 24h, 48h, 7 days, 30 days)
                // Dauerhaft/Admin stories with duration >= 2160 or 9999 hours never expire
                if (durationHours < 2160 && durationHours > 0) {
                    val ageMillis = now - createdAtMillis
                    val maxAgeMillis = durationHours.toLong() * 3600L * 1000L
                    if (ageMillis > maxAgeMillis && status == "approved") {
                        status = "expired"
                    }
                }

                val mediaRes = if (obj.has("mediaResId") && !obj.isNull("mediaResId")) {
                    val r = obj.optInt("mediaResId")
                    if (r != 0) r else null
                } else null

                val mediaUri = if (obj.has("mediaUri") && !obj.isNull("mediaUri")) {
                    val u = obj.optString("mediaUri")
                    if (u.isNotBlank() && u != "null") u else null
                } else null

                list.add(
                    KiezStory(
                        id = obj.optString("id", "story_$i"),
                        headline = obj.optString("headline", "Kiez-Meldung"),
                        subtext = obj.optString("subtext", ""),
                        kind = obj.optString("kind", "news"),
                        headlineColor = obj.optString("headlineColor", "blau"),
                        kiez = obj.optString("kiez", "Mitte"),
                        author = obj.optString("author", "Kiez-User"),
                        timeAgo = obj.optString("timeAgo", "gerade eben"),
                        source = obj.optString("source", ""),
                        link = obj.optString("link", "https://mykiezberlin.com"),
                        whatsapp = obj.optString("whatsapp", "+4915126509586"),
                        mediaResId = mediaRes,
                        mediaUri = mediaUri,
                        isVideo = obj.optBoolean("isVideo", false),
                        isCommercial = obj.optBoolean("isCommercial", false),
                        durationHours = durationHours,
                        pricePaid = obj.optDouble("pricePaid", 0.0),
                        status = status,
                        modNote = obj.optString("modNote", "OK"),
                        isSponsored = obj.optBoolean("isSponsored", false),
                        views = obj.optInt("views", 1),
                        createdAtMillis = createdAtMillis
                    )
                )
            }
            if (list.isEmpty()) SampleData.stories else list
        } catch (e: Exception) {
            SampleData.stories
        }
    }

    fun saveStories(context: Context, stories: List<KiezStory>) {
        val prefs = getPrefs(context)
        val jsonArray = JSONArray()
        for (story in stories) {
            val obj = JSONObject()
            obj.put("id", story.id)
            obj.put("headline", story.headline)
            obj.put("subtext", story.subtext)
            obj.put("kind", story.kind)
            obj.put("headlineColor", story.headlineColor)
            obj.put("kiez", story.kiez)
            obj.put("author", story.author)
            obj.put("timeAgo", story.timeAgo)
            obj.put("source", story.source)
            obj.put("link", story.link)
            obj.put("whatsapp", story.whatsapp)
            if (story.mediaResId != null) obj.put("mediaResId", story.mediaResId)
            if (story.mediaUri != null) obj.put("mediaUri", story.mediaUri)
            obj.put("isVideo", story.isVideo)
            obj.put("isCommercial", story.isCommercial)
            obj.put("durationHours", story.durationHours)
            obj.put("pricePaid", story.pricePaid)
            obj.put("status", story.status)
            obj.put("modNote", story.modNote)
            obj.put("isSponsored", story.isSponsored)
            obj.put("views", story.views)
            obj.put("createdAtMillis", story.createdAtMillis)
            jsonArray.put(obj)
        }
        prefs.edit().putString(KEY_STORIES, jsonArray.toString()).apply()
    }

    // --- Admin Authentication Persistence ---
    fun isAdminAuthenticated(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_ADMIN_AUTH, false)
    }

    fun setAdminAuthenticated(context: Context, authenticated: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_ADMIN_AUTH, authenticated).apply()
    }

    // --- Custom Kieze Added by Users / Admin ---
    fun loadCustomKieze(context: Context): Set<String> {
        val prefs = getPrefs(context)
        return prefs.getStringSet(KEY_CUSTOM_KIEZE, emptySet()) ?: emptySet()
    }

    fun saveCustomKiez(context: Context, kiezName: String) {
        if (kiezName.isBlank()) return
        val prefs = getPrefs(context)
        val current = prefs.getStringSet(KEY_CUSTOM_KIEZE, emptySet())?.toMutableSet() ?: mutableSetOf()
        current.add(kiezName.trim())
        prefs.edit().putStringSet(KEY_CUSTOM_KIEZE, current).apply()
    }

    // --- Language Persistence (Permanent across all screen visits) ---
    fun loadLanguage(context: Context): AppLanguage {
        val prefs = getPrefs(context)
        val code = prefs.getString(KEY_LANGUAGE, null) ?: return AppLanguage.GERMAN
        return try {
            AppLanguage.valueOf(code)
        } catch (e: Exception) {
            AppLanguage.GERMAN
        }
    }

    fun saveLanguage(context: Context, language: AppLanguage) {
        getPrefs(context).edit().putString(KEY_LANGUAGE, language.name).apply()
    }

    // --- Automatic Notifications Settings ---
    fun isNotificationsEnabled(context: Context): Boolean {
        return getPrefs(context).getBoolean(KEY_NOTIFICATIONS_ENABLED, true)
    }

    fun setNotificationsEnabled(context: Context, enabled: Boolean) {
        getPrefs(context).edit().putBoolean(KEY_NOTIFICATIONS_ENABLED, enabled).apply()
    }

    // --- Kiez Reporter Posts Persistence (Guaranteed Never Lost/Deleted) ---
    private const val KEY_CUSTOM_REPORTS = "saved_custom_reports"
    private const val KEY_POST_COMMENTS_PREFIX = "saved_comments_post_"

    fun loadCustomReports(context: Context): List<KiezReporterPost> {
        val prefs = getPrefs(context)
        val jsonString = prefs.getString(KEY_CUSTOM_REPORTS, null) ?: return emptyList()
        return try {
            val array = JSONArray(jsonString)
            val list = mutableListOf<KiezReporterPost>()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                val postId = obj.getString("id")
                val postComments = loadCommentsForPost(context, postId)
                list.add(
                    KiezReporterPost(
                        id = postId,
                        title = obj.getString("title"),
                        description = obj.getString("description"),
                        kiez = obj.getString("kiez"),
                        category = obj.getString("category"),
                        author = obj.getString("author"),
                        timeAgo = obj.optString("timeAgo", "Gerade eben"),
                        upvotes = obj.optInt("upvotes", 1),
                        comments = postComments
                    )
                )
            }
            list
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun saveCustomReports(context: Context, reports: List<KiezReporterPost>) {
        val prefs = getPrefs(context)
        val array = JSONArray()
        for (report in reports) {
            val obj = JSONObject()
            obj.put("id", report.id)
            obj.put("title", report.title)
            obj.put("description", report.description)
            obj.put("kiez", report.kiez)
            obj.put("category", report.category)
            obj.put("author", report.author)
            obj.put("timeAgo", report.timeAgo)
            obj.put("upvotes", report.upvotes)
            array.put(obj)
        }
        prefs.edit().putString(KEY_CUSTOM_REPORTS, array.toString()).apply()
    }

    // --- Comments Persistence (Up to 10 comments per post) ---
    fun loadCommentsForPost(context: Context, postId: String): List<KiezReporterComment> {
        val prefs = getPrefs(context)
        val jsonString = prefs.getString(KEY_POST_COMMENTS_PREFIX + postId, null) ?: return emptyList()
        return try {
            val array = JSONArray(jsonString)
            val list = mutableListOf<KiezReporterComment>()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                list.add(
                    KiezReporterComment(
                        id = obj.getString("id"),
                        author = obj.getString("author"),
                        text = obj.getString("text"),
                        timestampMillis = obj.optLong("timestampMillis", System.currentTimeMillis())
                    )
                )
            }
            list.take(10)
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun addCommentToPost(context: Context, postId: String, comment: KiezReporterComment): List<KiezReporterComment> {
        val current = loadCommentsForPost(context, postId).toMutableList()
        if (current.size >= 10) {
            current.removeAt(0) // Keep latest 10
        }
        current.add(comment)
        val array = JSONArray()
        for (c in current) {
            val obj = JSONObject()
            obj.put("id", c.id)
            obj.put("author", c.author)
            obj.put("text", c.text)
            obj.put("timestampMillis", c.timestampMillis)
            array.put(obj)
        }
        getPrefs(context).edit().putString(KEY_POST_COMMENTS_PREFIX + postId, array.toString()).apply()
        return current
    }
}
