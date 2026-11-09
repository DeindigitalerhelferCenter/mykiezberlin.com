package com.example.data.repository

import android.util.Log
import com.example.R
import com.example.data.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Live Feed Repository for Berlin News, Weather, Financial Markets, and Sports.
 * Exclusively consumes https://mykiezberlin.com/api/live and https://mykiezberlin.com/api/sport
 * via OkHttp. Strictly eliminates all hardcoded quotes, mock weather, and unverified RSS calls.
 */
object LiveBerlinFeedRepository {

    private const val TAG = "LiveBerlinFeed"
    const val API_LIVE_URL = "https://mykiezberlin.com/api/live"
    const val API_SPORT_URL = "https://mykiezberlin.com/api/sport"

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

    private val repositoryScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _liveQuotes = MutableStateFlow<List<LiveQuote>>(emptyList())
    val liveQuotes: StateFlow<List<LiveQuote>> = _liveQuotes.asStateFlow()

    private val _liveWeather = MutableStateFlow<LiveWeather?>(null)
    val liveWeather: StateFlow<LiveWeather?> = _liveWeather.asStateFlow()

    private val _liveNews = MutableStateFlow<List<LiveNewsItem>>(emptyList())
    val liveNews: StateFlow<List<LiveNewsItem>> = _liveNews.asStateFlow()

    private val _liveSportNews = MutableStateFlow<List<LiveNewsItem>>(emptyList())
    val liveSportNews: StateFlow<List<LiveNewsItem>> = _liveSportNews.asStateFlow()

    private val _liveSportData = MutableStateFlow<SportData?>(null)
    val liveSportData: StateFlow<SportData?> = _liveSportData.asStateFlow()

    private val _liveSlides = MutableStateFlow<List<MansetSlide>>(emptyList())
    val liveSlides: StateFlow<List<MansetSlide>> = _liveSlides.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    private val _lastUpdatedMillis = MutableStateFlow(0L)
    val lastUpdatedMillis: StateFlow<Long> = _lastUpdatedMillis.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    init {
        // Immediate fetch on launch
        refreshLiveFeeds()
        refreshSportData()

        // 60-second periodic refresh for live news, weather, and quotes
        repositoryScope.launch {
            while (isActive) {
                delay(60_000L)
                try {
                    fetchLiveApi()
                } catch (e: Exception) {
                    Log.w(TAG, "Periodic live refresh error: ${e.message}")
                }
            }
        }

        // 15-minute (900s) periodic refresh for sport data
        repositoryScope.launch {
            while (isActive) {
                delay(900_000L)
                try {
                    fetchSportApi()
                } catch (e: Exception) {
                    Log.w(TAG, "Periodic sport refresh error: ${e.message}")
                }
            }
        }
    }

    fun refreshLiveFeeds() {
        repositoryScope.launch {
            if (_isRefreshing.value) return@launch
            _isRefreshing.value = true
            try {
                fetchLiveApi()
            } finally {
                _isRefreshing.value = false
            }
        }
    }

    fun refreshSportData() {
        repositoryScope.launch {
            try {
                fetchSportApi()
            } catch (e: Exception) {
                Log.w(TAG, "refreshSportData error: ${e.message}")
            }
        }
    }

    suspend fun fetchLiveApi(): Boolean = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder()
                .url(API_LIVE_URL)
                .header("User-Agent", "MyKiezBerlin-Android/2.0")
                .header("Accept", "application/json")
                .build()

            val resp = httpClient.newCall(req).execute()
            if (!resp.isSuccessful) {
                _errorMessage.value = "Live-Daten nicht erreichbar"
                return@withContext false
            }

            val jsonStr = resp.body?.string() ?: ""
            if (jsonStr.isBlank()) {
                _errorMessage.value = "Live-Daten nicht erreichbar"
                return@withContext false
            }

            val root = JSONObject(jsonStr)

            // 1. Parse Weather
            val weatherObj = root.optJSONObject("weather")
            if (weatherObj != null) {
                val daysArr = weatherObj.optJSONArray("days")
                val daysList = mutableListOf<LiveWeatherDay>()
                if (daysArr != null) {
                    for (i in 0 until daysArr.length()) {
                        val d = daysArr.getJSONObject(i)
                        daysList.add(
                            LiveWeatherDay(
                                date = d.optString("date", ""),
                                code = d.optInt("code", 0),
                                max = d.optDouble("max", 0.0),
                                min = d.optDouble("min", 0.0),
                                rainChance = d.optInt("rainChance", 0)
                            )
                        )
                    }
                }
                _liveWeather.value = LiveWeather(
                    temperature = weatherObj.optDouble("temperature", 0.0),
                    feelsLike = weatherObj.optDouble("feelsLike", 0.0),
                    code = weatherObj.optInt("code", 0),
                    wind = weatherObj.optDouble("wind", 0.0),
                    humidity = weatherObj.optInt("humidity", 0),
                    observedAt = weatherObj.optString("observedAt", ""),
                    days = daysList
                )
            }

            // 2. Parse Quotes
            val quotesArr = root.optJSONArray("quotes")
            if (quotesArr != null && quotesArr.length() > 0) {
                val parsedQuotes = mutableListOf<LiveQuote>()
                for (i in 0 until quotesArr.length()) {
                    val q = quotesArr.getJSONObject(i)
                    parsedQuotes.add(
                        LiveQuote(
                            code = q.optString("code", ""),
                            name = q.optString("name", ""),
                            value = q.optDouble("value", 0.0),
                            changePercent = if (q.isNull("changePercent")) 0.0 else q.optDouble("changePercent", 0.0),
                            currency = q.optString("currency", ""),
                            source = q.optString("source", ""),
                            updatedAt = q.optLong("updatedAt", System.currentTimeMillis())
                        )
                    )
                }
                _liveQuotes.value = parsedQuotes
            }

            // 3. Parse News & map to Slides
            val newsArr = root.optJSONArray("news")
            val parsedNews = mutableListOf<LiveNewsItem>()
            val parsedSlides = mutableListOf<MansetSlide>()
            if (newsArr != null) {
                for (i in 0 until newsArr.length()) {
                    val n = newsArr.getJSONObject(i)
                    val title = n.optString("title", "").trim()
                    val link = n.optString("link", "").trim()
                    val summary = n.optString("summary", "").trim()
                    val img = n.optString("image", "").trim()
                    val src = n.optString("source", "Berlin News").trim()
                    val pubAt = n.optLong("publishedAt", System.currentTimeMillis())

                    if (title.isNotBlank()) {
                        val item = LiveNewsItem(
                            title = title,
                            link = link,
                            summary = summary,
                            image = img,
                            publishedAt = pubAt,
                            source = src
                        )
                        parsedNews.add(item)

                        val colorHex = when {
                            src.contains("Tagesspiegel", true) -> 0xFF003087
                            src.contains("rbb", true) -> 0xFFE30613
                            src.contains("Kurier", true) -> 0xFF005A9C
                            src.contains("B.Z.", true) -> 0xFFE50000
                            src.contains("Bild", true) -> 0xFFE2001A
                            else -> 0xFF003399
                        }

                        parsedSlides.add(
                            MansetSlide(
                                id = "slide_${i}_$pubAt",
                                publisher = src,
                                badge = "Berlin Aktuell",
                                colorHex = colorHex,
                                headlineDe = title,
                                headlineTr = title,
                                teaserDe = summary.take(180),
                                teaserTr = summary.take(180),
                                author = src,
                                imageResId = R.drawable.hero_berlin,
                                imageUrl = img.ifBlank { null },
                                originalUrl = link
                            )
                        )
                    }
                }
            }
            _liveNews.value = parsedNews
            _liveSlides.value = parsedSlides

            // 4. Parse Sport News
            val sportArr = root.optJSONArray("sport")
            if (sportArr != null) {
                val parsedSportNews = mutableListOf<LiveNewsItem>()
                for (i in 0 until sportArr.length()) {
                    val sn = sportArr.getJSONObject(i)
                    val title = sn.optString("title", "").trim()
                    if (title.isNotBlank()) {
                        parsedSportNews.add(
                            LiveNewsItem(
                                title = title,
                                link = sn.optString("link", "").trim(),
                                summary = sn.optString("summary", "").trim(),
                                image = sn.optString("image", "").trim(),
                                publishedAt = sn.optLong("publishedAt", System.currentTimeMillis()),
                                source = sn.optString("source", "Sport").trim()
                            )
                        )
                    }
                }
                _liveSportNews.value = parsedSportNews
            }

            _errorMessage.value = null
            _lastUpdatedMillis.value = System.currentTimeMillis()
            true
        } catch (e: Exception) {
            Log.w(TAG, "fetchLiveApi error: ${e.message}")
            _errorMessage.value = "Live-Daten nicht erreichbar"
            false
        }
    }

    private fun parseLeagueMatches(arr: org.json.JSONArray?): List<LeagueMatch> {
        if (arr == null) return emptyList()
        val list = mutableListOf<LeagueMatch>()
        for (m in 0 until arr.length()) {
            val o = arr.optJSONObject(m) ?: continue
            list.add(
                LeagueMatch(
                    kickoff = o.optLong("kickoff", 0L),
                    home = o.optString("home", ""),
                    away = o.optString("away", ""),
                    homeGoals = if (o.isNull("homeGoals")) null else o.optInt("homeGoals"),
                    awayGoals = if (o.isNull("awayGoals")) null else o.optInt("awayGoals"),
                    finished = o.optBoolean("finished", false)
                )
            )
        }
        return list
    }

    suspend fun fetchSportApi(): Boolean = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder()
                .url(API_SPORT_URL)
                .header("User-Agent", "MyKiezBerlin-Android/2.0")
                .header("Accept", "application/json")
                .build()

            val resp = httpClient.newCall(req).execute()
            if (!resp.isSuccessful) return@withContext false

            val jsonStr = resp.body?.string() ?: return@withContext false
            val root = JSONObject(jsonStr)

            // Parse Berlin teams
            val berlinArr = root.optJSONArray("berlin")
            val berlinList = mutableListOf<BerlinTeamInfo>()
            if (berlinArr != null) {
                for (i in 0 until berlinArr.length()) {
                    val b = berlinArr.getJSONObject(i)
                    berlinList.add(
                        BerlinTeamInfo(
                            team = b.optString("team", ""),
                            league = b.optString("league", ""),
                            position = b.optInt("position", 0),
                            points = b.optInt("points", 0),
                            lastMatch = b.optString("lastMatch", ""),
                            nextMatch = b.optString("nextMatch", "")
                        )
                    )
                }
            }

            // Parse Leagues (bl1, bl2)
            val leaguesArr = root.optJSONArray("leagues")
            val leaguesList = mutableListOf<SportLeague>()
            if (leaguesArr != null) {
                for (i in 0 until leaguesArr.length()) {
                    val l = leaguesArr.getJSONObject(i)
                    val tableArr = l.optJSONArray("table")
                    val tableList = mutableListOf<LeagueTableRow>()
                    if (tableArr != null) {
                        for (t in 0 until tableArr.length()) {
                            val row = tableArr.getJSONObject(t)
                            tableList.add(
                                LeagueTableRow(
                                    position = row.optInt("position", t + 1),
                                    team = row.optString("team", ""),
                                    short = row.optString("short", ""),
                                    icon = row.optString("icon", ""),
                                    played = row.optInt("played", 0),
                                    goalDiff = row.optInt("goalDiff", 0),
                                    points = row.optInt("points", 0),
                                    berlin = row.optBoolean("berlin", false)
                                )
                            )
                        }
                    }

                    val matchesArr = l.optJSONArray("matches")
                    val matchesList = mutableListOf<LeagueMatch>()
                    if (matchesArr != null) {
                        for (m in 0 until matchesArr.length()) {
                            val mObj = matchesArr.getJSONObject(m)
                            val hGoals = if (mObj.isNull("homeGoals")) null else mObj.optInt("homeGoals")
                            val aGoals = if (mObj.isNull("awayGoals")) null else mObj.optInt("awayGoals")
                            matchesList.add(
                                LeagueMatch(
                                    kickoff = mObj.optLong("kickoff", 0L),
                                    home = mObj.optString("home", ""),
                                    away = mObj.optString("away", ""),
                                    homeGoals = hGoals,
                                    awayGoals = aGoals,
                                    finished = mObj.optBoolean("finished", false)
                                )
                            )
                        }
                    }

                    leaguesList.add(
                        SportLeague(
                            id = l.optString("id", ""),
                            name = l.optString("name", ""),
                            table = tableList,
                            matches = matchesList,
                            matchday = l.optString("matchday", ""),
                            previousMatchday = l.optString("previousMatchday", ""),
                            previousMatches = parseLeagueMatches(l.optJSONArray("previousMatches"))
                        )
                    )
                }
            }

            _liveSportData.value = SportData(
                updatedAt = root.optLong("updatedAt", System.currentTimeMillis()),
                leagues = leaguesList,
                berlin = berlinList
            )
            true
        } catch (e: Exception) {
            Log.w(TAG, "fetchSportApi error: ${e.message}")
            false
        }
    }
}
