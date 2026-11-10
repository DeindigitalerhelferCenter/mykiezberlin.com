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
    val linkIg: String,
    // Package details (see functions/_lib/plans.js): size "large" | "medium" | "small" | "banner", weight = how often
    val plan: String = "",
    val size: String = "medium",
    val weight: Int = 1,
    val logo: String = "",
    val kieze: String = "",
    val categoryDe: String = "",
    val categoryTr: String = "",
    val categoryEn: String = "",
    val address: String = "",
    val hours: String = "",
    val couponCode: String = "",
    val couponDe: String = "",
    val couponTr: String = "",
    val couponEn: String = ""
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

    // Every sponsor for the page-change rotation (same list and weights as the web)
    private val _pageAds = MutableStateFlow<List<ServerAd>>(emptyList())
    val pageAds: StateFlow<List<ServerAd>> = _pageAds.asStateFlow()
    private var sequence: List<ServerAd> = emptyList()
    private var position = -1
    private var lastPageLoad = 0L

    fun refresh() {
        scope.launch {
            fetch("home")?.let { _homeAds.value = it }
            fetch("slider")?.let { _sliderAds.value = it }
            loadPageAds()
        }
    }

    /** Loads the rotation list at most every 10 minutes. */
    fun refreshPageAds() {
        if (System.currentTimeMillis() - lastPageLoad < 10 * 60_000L && sequence.isNotEmpty()) return
        scope.launch { loadPageAds() }
    }

    private suspend fun loadPageAds() {
        val ads = fetch("page") ?: return
        lastPageLoad = System.currentTimeMillis()
        synchronized(this) {
            sequence = buildSequence(ads)
            if (position < 0 && sequence.isNotEmpty()) position = (0 until sequence.size).random()
        }
        _pageAds.value = ads
    }

    // Smooth weighted round robin: Groß 3×, Mittel 2×, Klein 1× per round, well mixed.
    private fun buildSequence(ads: List<ServerAd>): List<ServerAd> {
        val weights = ads.map { it.weight.coerceAtLeast(1) }
        val total = weights.sum()
        val current = IntArray(ads.size)
        val out = ArrayList<ServerAd>(total)
        repeat(total) {
            var best = -1
            for (i in ads.indices) {
                current[i] += weights[i]
                if (best < 0 || current[i] > current[best]) best = i
            }
            current[best] -= total
            out.add(ads[best])
        }
        return out
    }

    /** Next sponsor for a page change, or null while nothing is loaded. */
    fun nextPageAd(): ServerAd? = synchronized(this) {
        if (sequence.isEmpty()) return null
        position = (position + 1).mod(sequence.size)
        sequence[position]
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
            linkIg = o.optString("link_ig"),
            plan = o.optString("plan"),
            size = o.optString("size").ifBlank { "medium" },
            weight = o.optInt("weight", 1),
            logo = o.optString("logo").let { if (it.startsWith("/")) "https://mykiezberlin.com$it" else it },
            kieze = o.optString("kieze"),
            categoryDe = o.optJSONObject("category")?.optString("de").orEmpty(),
            categoryTr = o.optJSONObject("category")?.optString("tr").orEmpty(),
            categoryEn = o.optJSONObject("category")?.optString("en").orEmpty(),
            address = o.optString("address"),
            hours = o.optString("hours"),
            couponCode = o.optJSONObject("coupon")?.optString("code").orEmpty(),
            couponDe = o.optJSONObject("coupon")?.optString("de").orEmpty(),
            couponTr = o.optJSONObject("coupon")?.optString("tr").orEmpty(),
            couponEn = o.optJSONObject("coupon")?.optString("en").orEmpty()
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
