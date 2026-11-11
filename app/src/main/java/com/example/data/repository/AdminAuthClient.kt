package com.example.data.repository

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/** Admin accounts on the server (/api/admin-auth, 2026-11-11): login, first setup, change password, recovery. */
object AdminAuthClient {
    private const val URL = "https://mykiezberlin.com/api/admin-auth"
    private val client = OkHttpClient.Builder().connectTimeout(10, TimeUnit.SECONDS).readTimeout(20, TimeUnit.SECONDS).build()

    data class Result(val ok: Boolean, val error: String = "", val json: JSONObject = JSONObject()) {
        val token: String get() = json.optString("token")
        val recoveryCode: String get() = json.optString("recoveryCode")
        val setupRequired: Boolean get() = json.optBoolean("setupRequired")
        val name: String get() = json.optString("name")
        val email: String get() = json.optString("email")
    }

    suspend fun call(action: String, token: String = "", fields: Map<String, String> = emptyMap()): Result = withContext(Dispatchers.IO) {
        try {
            val body = JSONObject().put("action", action)
            fields.forEach { (k, v) -> body.put(k, v) }
            val request = Request.Builder().url(URL)
                .header("x-admin-token", token)
                .post(body.toString().toRequestBody("application/json".toMediaType()))
                .build()
            client.newCall(request).execute().use { response ->
                val json = try { JSONObject(response.body?.string().orEmpty()) } catch (e: Exception) { JSONObject() }
                Result(response.isSuccessful && json.optBoolean("ok"), json.optString("error", if (response.isSuccessful) "" else "http_${response.code}"), json)
            }
        } catch (e: Exception) {
            Result(false, "offline")
        }
    }

    suspend fun emailResetAvailable(): Boolean = withContext(Dispatchers.IO) {
        try {
            client.newCall(Request.Builder().url(URL).build()).execute().use { JSONObject(it.body?.string().orEmpty()).optBoolean("emailReset") }
        } catch (e: Exception) {
            false
        }
    }

    /** Readable message in German and Turkish. */
    fun message(error: String): String = when (error) {
        "wrong_password" -> "Falsches Passwort · Şifre yanlış"
        "too_many_attempts" -> "Zu viele Versuche – bitte 1 Stunde warten · Çok fazla deneme, 1 saat bekleyin"
        "password_too_short" -> "Mindestens 8 Zeichen · En az 8 karakter"
        "wrong_code" -> "Notfall-Code oder E-Mail falsch · Kod veya e-posta yanlış"
        "email_invalid" -> "E-Mail ungültig · E-posta geçersiz"
        "email_exists" -> "E-Mail gibt es schon · Bu e-posta zaten var"
        "unauthorized" -> "Bitte neu anmelden · Lütfen yeniden giriş yapın"
        "login_with_account" -> "Bitte mit E-Mail und Passwort anmelden · Lütfen e-posta ve şifreyle girin"
        "offline" -> "Keine Verbindung · Bağlantı yok"
        else -> "Fehler · Hata ($error)"
    }
}
