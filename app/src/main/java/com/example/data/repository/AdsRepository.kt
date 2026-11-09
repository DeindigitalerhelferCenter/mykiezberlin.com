package com.example.data.repository

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/** One sponsor ad from /api/ads (managed in the admin panel, same list as the web). */
data class ServerAd(
    val id: String,
    val name: String,
    val image: String,
    val headlineDe: String,
    val headlineTr: String,
    val headlineEn: String,
    val ctaDe: String,
    val ctaTr: String,
    val ctaEn: String,
    val linkWeb: String,
    val linkWa: String,
    val linkTel: String,
    val linkIg: String
) {
    /** Best link for a tap: web, Instagram, WhatsApp, phone – in that order. */
    val primaryLink: String
        get() = when {
            linkWeb.isNotBlank() -> linkWeb
            linkIg.isNotBlank() -> linkIg
            linkWa.isNotBlank() -> "https://wa.me/" + linkWa.filter { it.isDigit() }
            linkTel.isNotBlank() -> "tel:$linkTel"
            else -> WERBEN_URL
        }
}

const val WERBEN_URL = "https://mykiezberlin.com/werben"

object AdsRepository {
    private const val TAG = "AdsRepository"
    private const val ADS_URL = "https://mykiezberlin.com/api/ads"
    private val client = OkHttpClient.Builder().connectTimeout(8, TimeUnit.SECONDS).readTimeout(10, TimeUnit.SECONDS).build()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _homeAds = MutableStateFlow<List<ServerAd>>(emptyList())
    val homeAds: StateFlow<List<ServerAd>> = _homeAds.asStateFlow()
    private val _sliderAds = MutableStateFlow<List<ServerAd>>(emptyList())
    val sliderAds: StateFlow<List<ServerAd>> = _sliderAds.asStateFlow()
    private val tracked = mutableSetOf<String>()

    fun refresh() {
        scope.launch {
            fetch("home")?.let { _homeAds.value = it }
            fetch("slider")?.let { _sliderAds.value = it }
        }
    }

    private suspend fun fetch(place: String): List<ServerAd>? = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder().url("$ADS_URL?place=$place").header("User-Agent", "MyKiezBerlin-Android/2.0").build()
            client.newCall(req).execute().use { resp ->
                if (!resp.isSuccessful) return@withContext null
                val arr = JSONObject(resp.body?.string() ?: "{}").optJSONArray("ads") ?: return@withContext emptyList()
                (0 until arr.length()).mapNotNull { i -> arr.optJSONObject(i)?.let(::parse) }
            }
        } catch (e: Exception) {
            Log.w(TAG, "ads $place: ${e.message}")
            null
        }
    }

    private fun parse(o: JSONObject): ServerAd {
        val image = o.optString("image", "")
        return ServerAd(
            id = o.optString("id"),
            name = o.optString("name"),
            image = if (image.startsWith("/")) "https://mykiezberlin.com$image" else image,
            headlineDe = o.optString("headline_de"),
            headlineTr = o.optString("headline_tr"),
            headlineEn = o.optString("headline_en"),
            ctaDe = o.optString("cta_de"),
            ctaTr = o.optString("cta_tr"),
            ctaEn = o.optString("cta_en"),
            linkWeb = o.optString("link_web"),
            linkWa = o.optString("link_wa"),
            linkTel = o.optString("link_tel"),
            linkIg = o.optString("link_ig")
        )
    }

    /** Anonymous daily counters, the same as the web (no cookies, no personal data). */
    fun trackImpressions(ids: List<String>) {
        val fresh = synchronized(tracked) { ids.filter { tracked.add(it) } }
        if (fresh.isNotEmpty()) send("imp", fresh)
    }

    fun trackClick(id: String) = send("click", listOf(id))

    private fun send(kind: String, ids: List<String>) {
        scope.launch {
            try {
                val body = JSONObject().put("kind", kind).put("ids", JSONArray(ids)).toString()
                    .toRequestBody("application/json; charset=utf-8".toMediaType())
                client.newCall(Request.Builder().url(ADS_URL).post(body).build()).execute().close()
            } catch (_: Exception) {
            }
        }
    }
}
