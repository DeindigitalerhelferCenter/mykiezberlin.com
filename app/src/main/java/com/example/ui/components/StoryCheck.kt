package com.example.ui.components

/*
 * 2026-11-22 (owner): check a story BEFORE sending – same as public/story-check.js on the web.
 * Fine -> sent at once. Problem -> a window with the problem words in RED, why (DE/TR) and a better wording:
 * "Öneriyi kullan" (replaces the words in the form), "Kendim düzelteyim", "Yine de gönder"
 * (light problem -> the admin decides, heavy -> refused by the server).
 */

import android.content.Context
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.model.AppLanguage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class StoryIssue(val text: String, val whyDe: String, val whyTr: String, val suggestion: String)
data class StoryReview(val verdict: String, val reasonDe: String, val reasonTr: String, val imageProblem: String, val issues: List<StoryIssue>)

object StoryCheckClient {
    private val client = OkHttpClient.Builder().connectTimeout(10, TimeUnit.SECONDS).readTimeout(30, TimeUnit.SECONDS).build()

    /** null = check not reachable (the story is sent as before, the server checks again). */
    suspend fun check(context: Context, headline: String, subtext: String, imageUri: String?, isVideo: Boolean): StoryReview? = withContext(Dispatchers.IO) {
        runCatching {
            val b = MultipartBody.Builder().setType(MultipartBody.FORM).addFormDataPart("headline", headline).addFormDataPart("subtext", subtext)
            if (imageUri != null && !isVideo) {
                runCatching {
                    val uri = Uri.parse(imageUri)
                    val mime = context.contentResolver.getType(uri) ?: "image/jpeg"
                    val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                    if (bytes != null && bytes.size <= 3 * 1024 * 1024 && mime.startsWith("image/")) b.addFormDataPart("file", "check.jpg", bytes.toRequestBody(mime.toMediaType()))
                }
            }
            val req = Request.Builder().url("https://mykiezberlin.com/api/story-check").header("User-Agent", "MyKiezBerlin-Android/2.0").post(b.build()).build()
            client.newCall(req).execute().use { resp ->
                if (!resp.isSuccessful) return@runCatching null
                val o = JSONObject(resp.body?.string().orEmpty().ifBlank { "{}" })
                val r = o.optJSONObject("review")
                val arr = r?.optJSONArray("issues")
                val issues = (0 until (arr?.length() ?: 0)).mapNotNull { i ->
                    val x = arr!!.optJSONObject(i) ?: return@mapNotNull null
                    StoryIssue(x.optString("text"), x.optString("why_de"), x.optString("why_tr"), x.optString("suggestion"))
                }.filter { it.text.isNotBlank() }
                StoryReview(o.optString("verdict", "ok"), r?.optString("reason_de").orEmpty(), r?.optString("reason_tr").orEmpty(), r?.optString("image_problem").orEmpty(), issues)
            }
        }.getOrNull()
    }
}

private fun t(language: AppLanguage, de: String, tr: String) = if (language == AppLanguage.TURKISH) tr else de

/** Replaces every place of [from] (any case) in [text]. */
fun replaceIgnoreCase(text: String, from: String, to: String): String =
    if (from.isBlank()) text else Regex(Regex.escape(from), RegexOption.IGNORE_CASE).replace(text) { to }

@Composable
fun StoryCheckDialog(
    review: StoryReview,
    language: AppLanguage,
    headline: String,
    subtext: String,
    onApply: (StoryIssue) -> Unit,
    onEdit: () -> Unit,
    onSendAnyway: () -> Unit,
) {
    val heavy = review.verdict == "heavy"
    val used = remember { mutableStateListOf<Int>() }
    val red = SpanStyle(color = Color(0xFFB91C1C), background = Color(0xFFFECACA), fontWeight = FontWeight.ExtraBold)
    val marked = buildAnnotatedString {
        val full = subtext
        var i = 0
        val lower = full.lowercase()
        while (i < full.length) {
            val hit = review.issues.mapNotNull { iss -> lower.indexOf(iss.text.lowercase(), i).takeIf { it >= 0 }?.let { it to iss.text.length } }.minByOrNull { it.first }
            if (hit == null) { append(full.substring(i)); break }
            append(full.substring(i, hit.first))
            withStyle(red) { append(full.substring(hit.first, hit.first + hit.second)) }
            i = hit.first + hit.second
        }
    }
    Dialog(onDismissRequest = onEdit) {
        Surface(shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.surface) {
            Column(Modifier.padding(18.dp).heightIn(max = 620.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text((if (heavy) "⛔ " + t(language, "So kann die Story nicht online gehen", "Bu hikâye bu haliyle yayınlanamaz") else "⚠️ " + t(language, "Bitte kurz prüfen", "Lütfen kısaca kontrol et")),
                    fontWeight = FontWeight.ExtraBold, fontSize = 17.sp)
                val reason = t(language, review.reasonDe, review.reasonTr.ifBlank { review.reasonDe })
                if (reason.isNotBlank()) Text(reason, fontSize = 14.sp)
                if (review.imageProblem.isNotBlank()) Text("🖼️ " + t(language, "Bild: ", "Resim: ") + review.imageProblem, color = Color(0xFFB91C1C), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                if (review.issues.isNotEmpty()) {
                    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(MaterialTheme.colorScheme.surfaceVariant).padding(10.dp)) {
                        Text(headline, fontWeight = FontWeight.Bold)
                        Text(marked, fontSize = 14.sp)
                    }
                }
                review.issues.forEachIndexed { idx, iss ->
                    Column(Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                        Text(buildAnnotatedString { withStyle(red) { append(iss.text) }; append(" – " + t(language, iss.whyDe, iss.whyTr.ifBlank { iss.whyDe })) }, fontSize = 13.5.sp)
                        if (iss.suggestion.isNotBlank()) Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("💡 " + t(language, "Besser: ", "Bunun yerine: ") + iss.suggestion, color = Color(0xFF15803D), fontSize = 13.sp, modifier = Modifier.weight(1f))
                            TextButton(onClick = { onApply(iss); used.add(idx) }, enabled = idx !in used) { Text(if (idx in used) "✓" else "✏️ " + t(language, "Übernehmen", "Öneriyi kullan"), fontSize = 12.sp) }
                        }
                    }
                }
                if (review.issues.any { it.suggestion.isNotBlank() }) Button(
                    onClick = { review.issues.filter { it.suggestion.isNotBlank() }.forEach(onApply); onEdit() },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF15803D)), modifier = Modifier.fillMaxWidth()
                ) { Text("✏️ " + t(language, "Alle Vorschläge übernehmen", "Tüm önerileri kullan"), fontWeight = FontWeight.Bold) }
                Button(onClick = onEdit, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E3A8A)), modifier = Modifier.fillMaxWidth()) {
                    Text(t(language, "Selbst ändern", "Kendim düzelteyim"), fontWeight = FontWeight.Bold)
                }
                OutlinedButton(onClick = onSendAnyway, modifier = Modifier.fillMaxWidth()) {
                    Text(if (heavy) t(language, "Trotzdem senden (wird abgelehnt)", "Yine de gönder (reddedilir)") else t(language, "Trotzdem senden – Admin prüft", "Yine de gönder – admin kontrol eder"), fontSize = 13.sp)
                }
            }
        }
    }
}
