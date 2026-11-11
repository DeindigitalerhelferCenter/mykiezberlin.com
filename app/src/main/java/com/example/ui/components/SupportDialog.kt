package com.example.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AppLanguage
import com.example.ui.theme.BerlinRed
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * "Fehler melden / Support" (2026-11-11), same as the web (public/support.js).
 * The report goes to /api/support: saved, the admin phone is notified, copy to support@mykiezberlin.com.
 * The user never sees a private address.
 */
object SupportState {
    /** null = closed; otherwise topic ("app" | "sponsor" | "other") and optional sponsor name */
    val open = mutableStateOf<Pair<String, String>?>(null)
    fun show(topic: String = "app", sponsor: String = "") { open.value = topic to sponsor }
}

private val client = OkHttpClient.Builder().connectTimeout(10, TimeUnit.SECONDS).readTimeout(20, TimeUnit.SECONDS).build()

private suspend fun sendSupport(topic: String, sponsor: String, message: String, email: String, lang: String): Int = withContext(Dispatchers.IO) {
    try {
        val body = JSONObject().put("topic", topic).put("sponsor", sponsor).put("message", message).put("email", email).put("page", "app").put("lang", lang)
        val req = Request.Builder().url("https://mykiezberlin.com/api/support")
            .post(body.toString().toRequestBody("application/json".toMediaType())).build()
        client.newCall(req).execute().use { it.code }
    } catch (e: Exception) {
        -1
    }
}

@Composable
fun SupportHost(language: AppLanguage) {
    val state = SupportState.open.value ?: return
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    fun L(de: String, tr: String, en: String) = when (language) { AppLanguage.TURKISH -> tr; AppLanguage.ENGLISH -> en; else -> de }
    var topic by remember { mutableStateOf(state.first) }
    var sponsor by remember { mutableStateOf(state.second) }
    var message by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var info by remember { mutableStateOf("") }
    var sent by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = { SupportState.open.value = null }) {
        Card(shape = RoundedCornerShape(18.dp)) {
            Column(Modifier.padding(18.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("🛠 " + L("Fehler melden / Support", "Hata bildir / Destek", "Report a problem / Support"), fontWeight = FontWeight.Bold, fontSize = 18.sp)
                if (sent) {
                    Text("✅ " + L("Danke! Deine Meldung ist angekommen.", "Teşekkürler! Bildirimin bize ulaştı.", "Thank you! We received your report."), fontSize = 14.sp)
                    Button(onClick = { SupportState.open.value = null }, colors = ButtonDefaults.buttonColors(containerColor = BerlinRed), modifier = Modifier.fillMaxWidth()) {
                        Text(L("Schließen", "Kapat", "Close"), color = Color.White)
                    }
                    return@Column
                }
                Text(
                    L("Falsche Nummer, Link geht nicht, App-Fehler? Schreib uns – wir kümmern uns.",
                      "Yanlış numara, açılmayan link, uygulama hatası? Bize yaz, ilgilenelim.",
                      "Wrong number, broken link, app error? Tell us and we will fix it."),
                    fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("app" to L("App / Web", "Uygulama", "App / web"), "sponsor" to "Sponsor", "other" to L("Sonstiges", "Diğer", "Other")).forEach { (k, label) ->
                        FilterChip(selected = topic == k, onClick = { topic = k }, label = { Text(label, fontSize = 12.sp) })
                    }
                }
                if (topic == "sponsor") OutlinedTextField(sponsor, { sponsor = it }, label = { Text(L("Sponsor", "Sponsor", "Sponsor")) }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(message, { message = it; info = "" }, label = { Text(L("Was ist passiert? *", "Ne oldu? *", "What happened? *")) }, minLines = 4, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(email, { email = it }, label = { Text(L("Deine E-Mail (optional, für eine Antwort)", "E-postan (isteğe bağlı, cevap için)", "Your e-mail (optional, for a reply)"), fontSize = 12.sp) }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Button(
                    onClick = {
                        if (message.trim().length < 5) { info = L("Bitte kurz beschreiben, was passiert ist.", "Lütfen ne olduğunu kısaca yaz.", "Please describe briefly what happened."); return@Button }
                        busy = true
                        scope.launch {
                            val code = sendSupport(topic, sponsor.trim(), message.trim(), email.trim(), when (language) { AppLanguage.TURKISH -> "tr"; AppLanguage.ENGLISH -> "en"; else -> "de" })
                            busy = false
                            when (code) {
                                200 -> sent = true
                                429 -> info = L("Zu viele Meldungen – bitte später noch einmal.", "Çok fazla bildirim – lütfen sonra tekrar dene.", "Too many reports – please try again later.")
                                -1 -> info = L("Keine Verbindung.", "Bağlantı yok.", "No connection.")
                                else -> info = L("Bitte prüfe deine Angaben.", "Lütfen bilgilerini kontrol et.", "Please check your input.")
                            }
                        }
                    },
                    enabled = !busy,
                    colors = ButtonDefaults.buttonColors(containerColor = BerlinRed),
                    modifier = Modifier.fillMaxWidth()
                ) { Text(if (busy) "…" else L("Senden", "Gönder", "Send"), color = Color.White, fontWeight = FontWeight.Bold) }
                if (info.isNotBlank()) Text(info, color = BerlinRed, fontSize = 12.sp)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(L("Oder per E-Mail: ", "Ya da e-postayla: ", "Or by e-mail: "), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("support@mykiezberlin.com", fontSize = 12.sp, color = BerlinRed, modifier = Modifier.clickable {
                        try { context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:support@mykiezberlin.com"))) } catch (_: Exception) {}
                    })
                }
            }
        }
    }
}
