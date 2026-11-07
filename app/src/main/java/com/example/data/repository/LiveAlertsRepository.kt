package com.example.data.repository

import android.content.Context
import android.util.Log
import com.example.data.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class LiveAlert(
    val id: String,
    val source: String = "",
    val tag: String,
    val color: String,
    val bgLight: String,
    val title: String,
    val body: String,
    val url: String,
    val publishedAt: Long
) {
    fun colorLong(): Long {
        return try {
            val clean = color.trim().removePrefix("#")
            clean.toLong(16) or 0xFF000000L
        } catch (e: Exception) {
            0xFF003399L
        }
    }

    fun formatTimeAgo(now: Long = System.currentTimeMillis(), lang: AppLanguage = AppLanguage.GERMAN): String {
        val diffMs = (now - publishedAt).coerceAtLeast(0L)
        val diffMins = diffMs / 60000L
        return when {
            diffMins < 1 -> if (lang == AppLanguage.TURKISH) "az önce" else "gerade eben"
            diffMins < 60 -> if (lang == AppLanguage.TURKISH) "$diffMins dk. önce" else "vor $diffMins Min."
            diffMins < 1440 -> {
                val hours = diffMins / 60
                if (lang == AppLanguage.TURKISH) "$hours saat önce" else "vor $hours Std."
            }
            else -> {
                val days = diffMins / 1440
                if (lang == AppLanguage.TURKISH) "$days gün önce" else "vor $days T."
            }
        }
    }
}

/**
 * Live alerts repository connecting directly to https://mykiezberlin.com/api/live,
 * /api/stories and /api/reporter via OkHttp.
 * Strictly eliminates static/mock alerts; if unreachable, exposes "Live-Daten nicht erreichbar".
 */
object LiveAlertsRepository {

    private const val TAG = "LiveAlertsRepo"
    const val API_LIVE_URL = "https://mykiezberlin.com/api/live"
    const val API_KIEZE_URL = "https://mykiezberlin.com/api/kieze"
    const val API_SUBMISSIONS_URL = "https://mykiezberlin.com/api/submissions"
    const val API_STORIES_URL = "https://mykiezberlin.com/api/stories"
    const val API_REPORTER_URL = "https://mykiezberlin.com/api/reporter"
    const val APK_DOWNLOAD_URL = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk"

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

    private val repositoryScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _liveAlerts = MutableStateFlow<List<LiveAlert>>(emptyList())
    val liveAlerts: StateFlow<List<LiveAlert>> = _liveAlerts.asStateFlow()

    private val _activeAlertBanner = MutableStateFlow<LiveAlert?>(null)
    val activeAlertBanner: StateFlow<LiveAlert?> = _activeAlertBanner.asStateFlow()

    private val _isLiveAvailable = MutableStateFlow(false)
    val isLiveAvailable: StateFlow<Boolean> = _isLiveAvailable.asStateFlow()

    private val _lastUpdatedMillis = MutableStateFlow(0L)
    val lastUpdatedMillis: StateFlow<Long> = _lastUpdatedMillis.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private var currentAlertIndex = 0

    init {
        repositoryScope.launch {
            // Initial fetch immediately
            fetchLiveAlerts()

            // Continuous polling every 45 seconds
            while (isActive) {
                delay(45_000L)
                fetchLiveAlerts()
            }
        }
    }

    suspend fun fetchLiveAlerts(): List<LiveAlert> = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(API_LIVE_URL)
                .header("User-Agent", "MyKiezBerlin-Android/2.0")
                .header("Accept", "application/json")
                .build()

            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful) {
                val jsonStr = response.body?.string() ?: ""
                val root = JSONObject(jsonStr)
                val alertsArray = root.optJSONArray("alerts")

                if (alertsArray != null && alertsArray.length() > 0) {
                    val parsed = mutableListOf<LiveAlert>()
                    for (i in 0 until alertsArray.length()) {
                        val obj = alertsArray.getJSONObject(i)
                        parsed.add(
                            LiveAlert(
                                id = obj.optString("id", "alert_$i"),
                                source = obj.optString("source", ""),
                                tag = obj.optString("tag", "BERLIN LIVE"),
                                color = obj.optString("color", "#003399"),
                                bgLight = obj.optString("bgLight", "#E8EEFB"),
                                title = obj.optString("title", ""),
                                body = obj.optString("body", ""),
                                url = obj.optString("url", "https://www.berlin.de/polizei/polizeimeldungen/"),
                                publishedAt = obj.optLong("publishedAt", System.currentTimeMillis())
                            )
                        )
                    }

                    // Flags come first: collectors of liveAlerts read them immediately.
                    _isLiveAvailable.value = true
                    _errorMessage.value = null
                    _lastUpdatedMillis.value = System.currentTimeMillis()
                    if (_activeAlertBanner.value == null) {
                        _activeAlertBanner.value = parsed[0]
                    }
                    _liveAlerts.value = parsed
                    return@withContext parsed
                } else {
                    _isLiveAvailable.value = false
                    _errorMessage.value = "Live-Daten nicht erreichbar"
                    _activeAlertBanner.value = null
                    return@withContext emptyList()
                }
            } else {
                _isLiveAvailable.value = false
                _errorMessage.value = "Live-Daten nicht erreichbar"
                _activeAlertBanner.value = null
                return@withContext emptyList()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Live alert fetch error: ${e.message}")
            _isLiveAvailable.value = false
            _errorMessage.value = "Live-Daten nicht erreichbar"
            _activeAlertBanner.value = null
            return@withContext emptyList()
        }
    }

    fun cycleNextAlert() {
        val list = _liveAlerts.value
        if (list.isNotEmpty()) {
            currentAlertIndex = (currentAlertIndex + 1) % list.size
            _activeAlertBanner.value = list[currentAlertIndex]
        }
    }

    fun dismissBanner() {
        _activeAlertBanner.value = null
    }

    // ==========================================
    // Remote Stories API (https://mykiezberlin.com/api/stories)
    // ==========================================
    private fun ageText(millis: Long): String {
        val minutes = ((System.currentTimeMillis() - millis) / 60000L).coerceAtLeast(0L)
        return when {
            minutes < 1 -> "gerade eben"
            minutes < 60 -> "vor $minutes Min."
            minutes < 1440 -> "vor ${minutes / 60} Std."
            else -> "vor ${minutes / 1440} T."
        }
    }

    suspend fun fetchRemoteStories(): List<KiezStory> = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder()
                .url(API_STORIES_URL)
                .header("User-Agent", "MyKiezBerlin-Android/2.0")
                .build()
            val resp = httpClient.newCall(req).execute()
            if (resp.isSuccessful) {
                val arr = JSONObject(resp.body?.string() ?: "{}").optJSONArray("stories") ?: return@withContext emptyList()
                val result = mutableListOf<KiezStory>()
                for (i in 0 until arr.length()) {
                    val o = arr.getJSONObject(i)
                    val mediaKey = o.optString("media_key", "")
                    val approvedAt = o.optLong("approved_at", System.currentTimeMillis())
                    result.add(
                        KiezStory(
                            id = o.optString("id", "remote_story_$i"),
                            headline = o.optString("headline", ""),
                            subtext = o.optString("subtext", ""),
                            kind = o.optString("kind", "news"),
                            headlineColor = "rot",
                            kiez = o.optString("kiez", "Berlin"),
                            author = o.optString("author", "Kiez Community"),
                            timeAgo = ageText(approvedAt),
                            source = "My Kiez",
                            link = "https://mykiezberlin.com",
                            mediaUri = if (mediaKey.isNotBlank()) "https://mykiezberlin.com/media/$mediaKey" else null,
                            isVideo = o.optString("media_type", "") == "video",
                            durationHours = o.optInt("duration_hours", 24),
                            status = "approved",
                            createdAtMillis = approvedAt
                        )
                    )
                }
                return@withContext result
            }
        } catch (e: Exception) {
            Log.d(TAG, "Remote stories notice: ${e.message}")
        }
        emptyList()
    }

    suspend fun postStoryMultipart(
        headline: String,
        subtext: String,
        kiez: String,
        kind: String,
        durationHours: Int, // Only 24 or 48 hours
        fileBytes: ByteArray? = null,
        fileName: String? = null,
        mimeType: String? = null
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val validDuration = if (durationHours == 48) 48 else 24
            val builder = MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("headline", headline)
                .addFormDataPart("subtext", subtext)
                .addFormDataPart("kiez", kiez)
                .addFormDataPart("kind", kind)
                .addFormDataPart("durationHours", validDuration.toString())

            if (fileBytes != null && fileBytes.isNotEmpty()) {
                val mediaType = (mimeType ?: "image/jpeg").toMediaType()
                val requestFile = fileBytes.toRequestBody(mediaType)
                builder.addFormDataPart("file", fileName ?: "story_${System.currentTimeMillis()}.jpg", requestFile)
            }

            val req = Request.Builder()
                .url(API_STORIES_URL)
                .header("User-Agent", "MyKiezBerlin-Android/2.0")
                .post(builder.build())
                .build()

            val resp = httpClient.newCall(req).execute()
            resp.isSuccessful
        } catch (e: Exception) {
            Log.w(TAG, "postStoryMultipart notice: ${e.message}")
            false
        }
    }

    suspend fun fetchAppVersion(): AppUpdateInfo? = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder()
                .url("https://mykiezberlin.com/version.json")
                .header("User-Agent", "MyKiezBerlin-Android/2.0")
                .build()

            val resp = httpClient.newCall(req).execute()
            if (resp.isSuccessful) {
                val jsonStr = resp.body?.string() ?: ""
                val root = JSONObject(jsonStr)
                val notesObj = root.optJSONObject("notes")
                return@withContext AppUpdateInfo(
                    versionCode = root.optInt("versionCode", 1),
                    versionName = root.optString("versionName", "1.0"),
                    apkUrl = root.optString("apkUrl", APK_DOWNLOAD_URL),
                    mandatory = root.optBoolean("mandatory", false),
                    notesDe = notesObj?.optString("de", "") ?: "",
                    notesTr = notesObj?.optString("tr", "") ?: "",
                    notesEn = notesObj?.optString("en", "") ?: ""
                )
            }
        } catch (e: Exception) {
            Log.w(TAG, "fetchAppVersion error: ${e.message}")
        }
        null
    }

    suspend fun postRemoteStory(story: KiezStory): Boolean = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("id", story.id)
                put("headline", story.headline)
                put("subtext", story.subtext)
                put("kind", story.kind)
                put("headlineColor", story.headlineColor)
                put("kiez", story.kiez)
                put("author", story.author)
                put("timeAgo", story.timeAgo)
                put("link", story.link)
                put("durationHours", if (story.durationHours == 48) 48 else 24)
                put("status", story.status)
            }
            val body = json.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
            val req = Request.Builder().url(API_STORIES_URL).post(body).build()
            val resp = httpClient.newCall(req).execute()
            resp.isSuccessful
        } catch (e: Exception) {
            Log.d(TAG, "postRemoteStory notice: ${e.message}")
            false
        }
    }

    // ==========================================
    // Remote Reporter API (https://mykiezberlin.com/api/reporter)
    // ==========================================
    suspend fun fetchRemoteReporterPosts(): List<KiezReporterPost> = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder()
                .url(API_REPORTER_URL)
                .header("User-Agent", "MyKiezBerlin-Android/2.0")
                .build()
            val resp = httpClient.newCall(req).execute()
            if (resp.isSuccessful) {
                val arr = JSONObject(resp.body?.string() ?: "{}").optJSONArray("posts") ?: return@withContext emptyList()
                val result = mutableListOf<KiezReporterPost>()
                for (i in 0 until arr.length()) {
                    val o = arr.getJSONObject(i)
                    val comments = mutableListOf<KiezReporterComment>()
                    val commentArr = o.optJSONArray("comments")
                    if (commentArr != null) {
                        for (c in 0 until commentArr.length()) {
                            val co = commentArr.getJSONObject(c)
                            comments.add(
                                KiezReporterComment(
                                    id = co.optString("id", "comment_$c"),
                                    author = co.optString("author", "Kiez Community"),
                                    text = co.optString("text", ""),
                                    timestampMillis = co.optLong("created_at", System.currentTimeMillis())
                                )
                            )
                        }
                    }
                    result.add(
                        KiezReporterPost(
                            id = o.optString("id", "remote_rep_$i"),
                            title = o.optString("title", ""),
                            description = o.optString("description", ""),
                            kiez = o.optString("kiez", "Mitte"),
                            category = o.optString("category", "Kiez"),
                            author = o.optString("author", "Kiez Community"),
                            timeAgo = ageText(o.optLong("created_at", System.currentTimeMillis())),
                            upvotes = o.optInt("upvotes", 1),
                            comments = comments
                        )
                    )
                }
                return@withContext result
            }
        } catch (e: Exception) {
            Log.d(TAG, "Remote reporter notice: ${e.message}")
        }
        emptyList()
    }

    suspend fun postRemoteReporterPost(post: KiezReporterPost): Boolean = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("id", post.id)
                put("title", post.title)
                put("description", post.description)
                put("kiez", post.kiez)
                put("category", post.category)
                put("author", post.author)
                put("timeAgo", post.timeAgo)
                put("upvotes", post.upvotes)
            }
            val body = json.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
            val req = Request.Builder().url(API_REPORTER_URL).post(body).build()
            val resp = httpClient.newCall(req).execute()
            resp.isSuccessful
        } catch (e: Exception) {
            Log.d(TAG, "postRemoteReporterPost notice: ${e.message}")
            false
        }
    }

    // ==========================================
    // Remote Kieze API (https://mykiezberlin.com/api/kieze)
    // ==========================================
    suspend fun fetchKieze(): List<Kiez> = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder()
                .url(API_KIEZE_URL)
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 14) MyKiezBerlin/2.0")
                .header("Accept", "application/json")
                .build()
            val resp = httpClient.newCall(req).execute()
            if (resp.isSuccessful) {
                val jsonStr = resp.body?.string() ?: ""
                val root = JSONObject(jsonStr)
                val kiezeArray = root.optJSONArray("kieze")
                if (kiezeArray != null && kiezeArray.length() > 0) {
                    val result = mutableListOf<Kiez>()
                    for (i in 0 until kiezeArray.length()) {
                        val obj = kiezeArray.getJSONObject(i)

                        val tagsList = mutableListOf<String>()
                        val tagsArr = obj.optJSONArray("tags")
                        if (tagsArr != null) {
                            for (t in 0 until tagsArr.length()) {
                                tagsList.add(tagsArr.getString(t))
                            }
                        }

                        val highlightsList = mutableListOf<String>()
                        val hlArr = obj.optJSONArray("highlights")
                        if (hlArr != null) {
                            for (h in 0 until hlArr.length()) {
                                highlightsList.add(hlArr.getString(h))
                            }
                        }

                        val impressionList = mutableListOf<String>()
                        val impArr = obj.optJSONArray("impressionImages")
                        if (impArr != null) {
                            for (im in 0 until impArr.length()) {
                                impressionList.add(impArr.getString(im))
                            }
                        }

                        val parksList = mutableListOf<String>()
                        val parksArr = obj.optJSONArray("parks")
                        if (parksArr != null) {
                            for (p in 0 until parksArr.length()) {
                                parksList.add(parksArr.getString(p))
                            }
                        }

                        val spotsList = mutableListOf<String>()
                        val spotsArr = obj.optJSONArray("popularSpots")
                        if (spotsArr != null) {
                            for (s in 0 until spotsArr.length()) {
                                spotsList.add(spotsArr.getString(s))
                            }
                        }

                        val creditsList = mutableListOf<PhotoCredit>()
                        val creditsArr = obj.optJSONArray("photoCredits")
                        if (creditsArr != null) {
                            for (c in 0 until creditsArr.length()) {
                                val cObj = creditsArr.getJSONObject(c)
                                creditsList.add(
                                    PhotoCredit(
                                        url = cObj.optString("url", ""),
                                        page = cObj.optString("page", ""),
                                        license = cObj.optString("license", ""),
                                        artist = cObj.optString("artist", ""),
                                        title = cObj.optString("title", "")
                                    )
                                )
                            }
                        }

                        result.add(
                            Kiez(
                                id = obj.optString("id", ""),
                                name = obj.optString("name", ""),
                                subtitle = obj.optString("subtitle", ""),
                                postalCodes = obj.optString("postalCodes", ""),
                                population = obj.optString("population", ""),
                                populationDate = obj.optString("populationDate", ""),
                                specialty = obj.optString("specialty", ""),
                                description = obj.optString("description", ""),
                                tags = tagsList,
                                lat = obj.optDouble("lat", 52.52),
                                lng = obj.optDouble("lng", 13.405),
                                highlights = highlightsList,
                                imageUrl = obj.optString("imageUrl", ""),
                                impressionImages = impressionList,
                                rentIndex = obj.optString("rentIndex", ""),
                                vibe = obj.optString("vibe", "Urban & Lebendig"),
                                transitLines = obj.optString("transitLines", ""),
                                parks = parksList,
                                popularSpots = spotsList,
                                buergeramtName = obj.optString("buergeramtName", ""),
                                buergeramtAddress = obj.optString("buergeramtAddress", ""),
                                policeStation = obj.optString("policeStation", ""),
                                policeAddress = obj.optString("policeAddress", ""),
                                policePhone = obj.optString("policePhone", "+49 30 4664 4664"),
                                photoCredits = creditsList
                            )
                        )
                    }
                    if (result.isNotEmpty()) {
                        return@withContext result
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "fetchKieze error: ${e.message}")
        }
        SampleData.kieze
    }

    // ==========================================
    // Submissions API (https://mykiezberlin.com/api/submissions)
    // ==========================================
    suspend fun postSubmission(type: String, data: JSONObject): Boolean = withContext(Dispatchers.IO) {
        try {
            data.put("type", type)
            val body = data.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
            val req = Request.Builder()
                .url(API_SUBMISSIONS_URL)
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 14) MyKiezBerlin/2.0")
                .header("Content-Type", "application/json")
                .post(body)
                .build()
            val resp = httpClient.newCall(req).execute()
            resp.isSuccessful
        } catch (e: Exception) {
            Log.w(TAG, "postSubmission notice: ${e.message}")
            false
        }
    }

    suspend fun fetchSubmissions(): List<JSONObject> = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder()
                .url(API_SUBMISSIONS_URL)
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 14) MyKiezBerlin/2.0")
                .build()
            val resp = httpClient.newCall(req).execute()
            if (resp.isSuccessful) {
                val jsonStr = resp.body?.string() ?: ""
                val root = JSONObject(jsonStr)
                val itemsArr = root.optJSONArray("items")
                if (itemsArr != null) {
                    val list = mutableListOf<JSONObject>()
                    for (i in 0 until itemsArr.length()) {
                        list.add(itemsArr.getJSONObject(i))
                    }
                    return@withContext list
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "fetchSubmissions notice: ${e.message}")
        }
        emptyList()
    }

    // ==========================================
    // Reporter Comments API (https://mykiezberlin.com/api/reporter)
    // ==========================================
    suspend fun postReporterComment(postId: String, text: String, author: String = "Berliner Nachbar"): Boolean = withContext(Dispatchers.IO) {
        try {
            val commentObj = JSONObject().apply {
                put("postId", postId)
                put("text", text)
                put("author", author)
            }
            val root = JSONObject().apply {
                put("comment", commentObj)
            }
            val body = root.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
            val req = Request.Builder()
                .url(API_REPORTER_URL)
                .header("User-Agent", "Mozilla/5.0 (Linux; Android 14) MyKiezBerlin/2.0")
                .header("Content-Type", "application/json")
                .post(body)
                .build()
            val resp = httpClient.newCall(req).execute()
            resp.isSuccessful
        } catch (e: Exception) {
            Log.w(TAG, "postReporterComment notice: ${e.message}")
            false
        }
    }

    // ==========================================
    // Dynamic Folder Stories & Bulletins Generation from Live Alerts
    // ==========================================
    fun generateInstitutionStories(alerts: List<LiveAlert>, lang: AppLanguage): List<KiezStory> {
        val folders = listOf(
            BulletinFolder.BVG,
            BulletinFolder.SBAHN,
            BulletinFolder.FEUERWEHR,
            BulletinFolder.POLIZEI,
            BulletinFolder.BUERGERAMT,
            BulletinFolder.SENAT_POLITIK,
            BulletinFolder.KULTUR_EVENTS
        )

        val result = mutableListOf<KiezStory>()
        for (folder in folders) {
            val matchingAlert = alerts.firstOrNull { matchesFolder(it, folder) }
            val (title, summary, link) = if (matchingAlert != null) {
                Triple(matchingAlert.title, matchingAlert.body, matchingAlert.url)
            } else {
                getFolderDefaultData(folder, lang)
            }

            val headlineColor = when (folder) {
                BulletinFolder.BVG, BulletinFolder.FEUERWEHR -> "gelb"
                BulletinFolder.POLIZEI, BulletinFolder.SBAHN -> "blau"
                BulletinFolder.SENAT_POLITIK -> "weiss"
                else -> "rot"
            }

            result.add(
                KiezStory(
                    id = "inst_story_${folder.key}",
                    headline = title,
                    subtext = summary,
                    kind = when (folder) {
                        BulletinFolder.BVG, BulletinFolder.SBAHN -> "traffic"
                        BulletinFolder.FEUERWEHR, BulletinFolder.POLIZEI -> "warn"
                        BulletinFolder.KULTUR_EVENTS -> "event"
                        BulletinFolder.SENAT_POLITIK -> "politics"
                        else -> "info"
                    },
                    headlineColor = headlineColor,
                    kiez = "Berlin",
                    author = folder.titleDe,
                    timeAgo = if (matchingAlert != null) matchingAlert.formatTimeAgo(lang = lang) else if (lang == AppLanguage.TURKISH) "Resmi" else "Offiziell",
                    mediaResId = null,
                    source = folder.titleDe,
                    link = link,
                    durationHours = 24,
                    status = "approved",
                    isCommercial = false,
                    isSponsored = false,
                    createdAtMillis = System.currentTimeMillis()
                )
            )
        }
        return result
    }

    fun getFolderStories(folder: BulletinFolder, alerts: List<LiveAlert>, lang: AppLanguage): List<KiezStory> {
        val matchingAlerts = alerts.filter { matchesFolder(it, folder) }
        val headlineColor = when (folder) {
            BulletinFolder.BVG, BulletinFolder.FEUERWEHR -> "gelb"
            BulletinFolder.POLIZEI, BulletinFolder.SBAHN -> "blau"
            BulletinFolder.SENAT_POLITIK -> "weiss"
            else -> "rot"
        }

        if (matchingAlerts.isNotEmpty()) {
            return matchingAlerts.mapIndexed { idx, alert ->
                KiezStory(
                    id = "inst_story_${folder.key}_${alert.id}",
                    headline = alert.title,
                    subtext = alert.body,
                    kind = when (folder) {
                        BulletinFolder.BVG, BulletinFolder.SBAHN -> "traffic"
                        BulletinFolder.FEUERWEHR, BulletinFolder.POLIZEI -> "warn"
                        BulletinFolder.KULTUR_EVENTS -> "event"
                        BulletinFolder.SENAT_POLITIK -> "politics"
                        else -> "info"
                    },
                    headlineColor = headlineColor,
                    kiez = "Berlin",
                    author = alert.tag,
                    timeAgo = alert.formatTimeAgo(lang = lang),
                    mediaResId = null,
                    source = alert.tag,
                    link = alert.url,
                    durationHours = 24,
                    status = "approved",
                    isCommercial = false,
                    isSponsored = false,
                    createdAtMillis = alert.publishedAt
                )
            }
        }

        // Verified authentic 200 OK links for each folder
        val (defTitle, defSummary, defUrl) = getFolderDefaultData(folder, lang)
        return listOf(
            KiezStory(
                id = "inst_story_${folder.key}_official",
                headline = defTitle,
                subtext = defSummary,
                kind = "info",
                headlineColor = headlineColor,
                kiez = "Berlin",
                author = folder.titleDe,
                timeAgo = if (lang == AppLanguage.TURKISH) "Resmi Kaynak" else "Offizielle Quelle",
                mediaResId = null,
                source = folder.titleDe,
                link = defUrl,
                durationHours = 24,
                status = "approved",
                isCommercial = false,
                isSponsored = false,
                createdAtMillis = System.currentTimeMillis()
            )
        )
    }

    fun toBulletins(alerts: List<LiveAlert>): List<BerlinLiveBulletin> {
        return alerts.mapIndexed { index, alert ->
            val folder = when {
                matchesFolder(alert, BulletinFolder.BVG) -> BulletinFolder.BVG
                matchesFolder(alert, BulletinFolder.SBAHN) -> BulletinFolder.SBAHN
                matchesFolder(alert, BulletinFolder.FEUERWEHR) -> BulletinFolder.FEUERWEHR
                matchesFolder(alert, BulletinFolder.POLIZEI) -> BulletinFolder.POLIZEI
                matchesFolder(alert, BulletinFolder.BUERGERAMT) -> BulletinFolder.BUERGERAMT
                matchesFolder(alert, BulletinFolder.SENAT_POLITIK) -> BulletinFolder.SENAT_POLITIK
                else -> BulletinFolder.KULTUR_EVENTS
            }

            BerlinLiveBulletin(
                id = alert.id,
                folder = folder,
                title = alert.title,
                summary = alert.body,
                kiezName = "Berlin",
                officialSource = alert.tag,
                officialUrl = alert.url,
                timestampMillis = alert.publishedAt,
                timeAgoFormatted = alert.formatTimeAgo(),
                isUrgent = alert.tag.contains("POLIZEI") || alert.tag.contains("FEUERWEHR"),
                titleTr = alert.title,
                summaryTr = alert.body,
                hourBadge = ""
            )
        }
    }

    private fun matchesFolder(alert: LiveAlert, folder: BulletinFolder): Boolean {
        val tagUpper = alert.tag.uppercase()
        val srcUpper = alert.source.uppercase()
        return when (folder) {
            BulletinFolder.BVG -> tagUpper.contains("BVG") || srcUpper.contains("BVG")
            BulletinFolder.SBAHN -> tagUpper.contains("S-BAHN") || srcUpper.contains("SBAHN")
            BulletinFolder.FEUERWEHR -> tagUpper.contains("FEUERWEHR") || srcUpper.contains("FEUERWEHR")
            BulletinFolder.POLIZEI -> tagUpper.contains("POLIZEI") || srcUpper.contains("POLIZEI")
            BulletinFolder.BUERGERAMT -> tagUpper.contains("BÜRGERAMT") || tagUpper.contains("BURGERAMT") || srcUpper.contains("BUERGERAMT")
            BulletinFolder.SENAT_POLITIK -> tagUpper.contains("SENAT") || tagUpper.contains("POLITIK") || srcUpper.contains("SENAT")
            BulletinFolder.KULTUR_EVENTS -> tagUpper.contains("KULTUR") || tagUpper.contains("EVENT") || srcUpper.contains("KULTUR")
            else -> false
        }
    }

    private fun getFolderDefaultData(folder: BulletinFolder, lang: AppLanguage): Triple<String, String, String> {
        val isTr = lang == AppLanguage.TURKISH
        return when (folder) {
            BulletinFolder.BVG -> Triple(
                if (isTr) "BVG Canlı Sefer & Kesinti Durumu" else "BVG Störungsmeldungen & Live-Lage",
                if (isTr) "U-Bahn, Tram ve otobüs canlı arıza ve sefer durumları." else "Aktuelle Betriebslage, Baustellen und Ausfälle im Berliner Nahverkehr.",
                "https://www.bvg.de/de/verbindungen/stoerungsmeldungen"
            )
            BulletinFolder.SBAHN -> Triple(
                if (isTr) "S-Bahn Berlin Sefer & İnşaat Duyuruları" else "S-Bahn Berlin Bauen & Störungsmeldungen",
                if (isTr) "Banliyö trenleri hat yenileme, bakım ve kesinti bildirimleri." else "Streckenunterbrechungen, Bauarbeiten und Ringbahn-Statusmeldungen.",
                "https://sbahn.berlin/fahren/bauen-stoerung/"
            )
            BulletinFolder.FEUERWEHR -> Triple(
                if (isTr) "Berliner Feuerwehr Güncel Müdahaleler" else "Berliner Feuerwehr Aktuelle Einsätze",
                if (isTr) "Başkent genelinde itfaiye ve kurtarma ekiplerinin canlı operasyonları." else "Offizielle Einsatzberichte und Brandmeldungen der Berliner Feuerwehr.",
                "https://www.berliner-feuerwehr.de/aktuelles/einsaetze/"
            )
            BulletinFolder.POLIZEI -> Triple(
                if (isTr) "Berlin Polisi Canlı Asayiş Raporları" else "Polizei Berlin Aktuelle Polizeimeldungen",
                if (isTr) "Başkentteki asayiş olayları, aranan şahıslar ve resmi polis bültenleri." else "Offizielle Pressemitteilungen und Zeugenaufrufe der Polizei Berlin.",
                "https://www.berlin.de/polizei/polizeimeldungen/"
            )
            BulletinFolder.BUERGERAMT -> Triple(
                if (isTr) "Berlin Bürgeramt Randevu & Hizmet Portalı" else "Bürgeramt & Bürgerservice Berlin",
                if (isTr) "Online ikametgah kaydı (Anmeldung), pasaport ve kimlik randevuları." else "Terminvereinbarungen, Personalausweis-/Passangelegenheiten und Standorte.",
                "https://service.berlin.de/standorte/buergeraemter/"
            )
            BulletinFolder.SENAT_POLITIK -> Triple(
                if (isTr) "Berlin Senatosu Resmi Basın Bildirileri" else "Senat von Berlin Pressemitteilungen",
                if (isTr) "Rotes Rathaus, senato kararları ve eyalet politikaları." else "Offizielle Pressemitteilungen der Senatskanzlei und Senatsbeschlüsse.",
                "https://www.berlin.de/rbmskzl/aktuelles/pressemitteilungen/"
            )
            BulletinFolder.KULTUR_EVENTS -> Triple(
                if (isTr) "Berlin Şehir Rehberi & Festivaller" else "Berlin.de Volksfeste & Kultur",
                if (isTr) "Sokak festivalleri, Kiez panayırları ve açık hava konserleri." else "Offizielle Kiezfeste, Jahrmärkte und Kulturveranstaltungen in Berlin.",
                "https://www.berlin.de/events/volksfeste/"
            )
            else -> Triple(
                if (isTr) "Berlin Canlı Bülten" else "Berlin Live-Ticker",
                if (isTr) "Berlin geneli tüm resmi kurum duyuruları ve bültenler." else "Alle aktuellen Ereignisse der Hauptstadt im Überblick.",
                "https://www.berlin.de/"
            )
        }
    }
}
