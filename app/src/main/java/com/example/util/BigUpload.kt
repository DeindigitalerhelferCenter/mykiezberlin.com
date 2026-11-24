package com.example.util

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * 2026-11-24 (owner, v1.53): big pictures/videos of trusted accounts (story key "Kiez26" …, admin) have no size limit.
 * Cloudflare takes ~100 MB per request, so a file over 20 MB is sent in 20 MB parts straight into storage
 * (/api/big-upload, R2 multipart). The story form then carries "r2big:<key>|<type>|<size>" in place of the file.
 * Call only from a background thread. Returns null when not allowed or when it failed.
 */
object BigUpload {
    const val LIMIT = 20L * 1024 * 1024
    private const val SITE = "https://mykiezberlin.com/api/big-upload"
    private val client = OkHttpClient.Builder().connectTimeout(20, TimeUnit.SECONDS).writeTimeout(120, TimeUnit.SECONDS).readTimeout(60, TimeUnit.SECONDS).build()
    private val JSON = "application/json; charset=utf-8".toMediaType()

    fun sizeOf(context: Context, uri: Uri): Long {
        runCatching {
            context.contentResolver.query(uri, arrayOf(OpenableColumns.SIZE), null, null, null)?.use { c ->
                if (c.moveToFirst() && !c.isNull(0)) return c.getLong(0)
            }
        }
        return runCatching { context.contentResolver.openAssetFileDescriptor(uri, "r")?.use { it.length } ?: -1L }.getOrDefault(-1L)
    }

    private fun post(action: String, body: JSONObject, headers: Map<String, String>): JSONObject? = runCatching {
        val rb = Request.Builder().url("$SITE?action=$action").post(body.toString().toRequestBody(JSON))
        headers.forEach { (k, v) -> if (v.isNotBlank()) rb.header(k, v) }
        client.newCall(rb.build()).execute().use { r -> JSONObject(r.body?.string() ?: "{}").put("_status", r.code) }
    }.getOrNull()

    fun upload(context: Context, uri: Uri, mime: String, headers: Map<String, String>, target: String = "story", adId: String = ""): String? =
        send(sizeOf(context, uri), mime, headers, target, adId) { context.contentResolver.openInputStream(uri) }

    /** Same for a file that is already in memory (e.g. a video after VideoShrink). */
    fun uploadBytes(bytes: ByteArray, mime: String, headers: Map<String, String>, target: String = "story", adId: String = ""): String? =
        send(bytes.size.toLong(), mime, headers, target, adId) { java.io.ByteArrayInputStream(bytes) }

    private fun send(size: Long, mime: String, headers: Map<String, String>, target: String, adId: String, open: () -> java.io.InputStream?): String? {
        val init = post("init", JSONObject().put("target", target).put("adId", adId).put("type", mime).put("size", size), headers) ?: return null
        val key = init.optString("key"); val uploadId = init.optString("uploadId")
        if (init.optInt("_status") == 403 || key.isBlank() || uploadId.isBlank()) return null
        val partSize = init.optLong("partSize", LIMIT).toInt()
        val parts = JSONArray()
        val ok = runCatching {
            open()?.use { input ->
                val buf = ByteArray(partSize)
                var part = 1
                while (true) {
                    var n = 0
                    while (n < partSize) { val r = input.read(buf, n, partSize - n); if (r < 0) break; n += r }
                    if (n == 0) break
                    var etag = ""
                    for (attempt in 1..3) {
                        val url = "$SITE?action=part&key=${Uri.encode(key)}&uploadId=${Uri.encode(uploadId)}&part=$part"
                        val rb = Request.Builder().url(url).put(buf.copyOf(n).toRequestBody("application/octet-stream".toMediaType()))
                        headers.forEach { (k, v) -> if (v.isNotBlank()) rb.header(k, v) }
                        etag = runCatching { client.newCall(rb.build()).execute().use { r -> JSONObject(r.body?.string() ?: "{}").optString("etag") } }.getOrDefault("")
                        if (etag.isNotBlank()) break
                        Thread.sleep(1500L * attempt)
                    }
                    if (etag.isBlank()) error("part $part failed")
                    parts.put(JSONObject().put("part", part).put("etag", etag))
                    if (n < partSize) break
                    part++
                }
            } ?: error("no stream")
        }.isSuccess
        if (!ok || parts.length() == 0) {
            post("abort", JSONObject().put("key", key).put("uploadId", uploadId), headers)
            return null
        }
        val done = post("complete", JSONObject().put("key", key).put("uploadId", uploadId).put("parts", parts), headers) ?: return null
        return done.optString("ref").takeIf { it.startsWith("r2big:") }
    }
}
