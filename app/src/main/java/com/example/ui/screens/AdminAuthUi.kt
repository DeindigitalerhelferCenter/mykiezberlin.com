package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.data.repository.AdminAuthClient
import com.example.data.repository.AdminStoryWatchService
import com.example.data.repository.KiezStorageManager
import kotlinx.coroutines.launch

private val CardBg = Color(0xFF1C252E)
private val Muted = Color(0xFFA9B3BC)
private val Green = Color(0xFF1F9D55)
private val Gold = Color(0xFFF2B705)
private val Red = Color(0xFFE30613)

@Composable
private fun DarkField(value: String, onChange: (String) -> Unit, label: String, password: Boolean = false, email: Boolean = false) {
    var visible by remember { mutableStateOf(false) }
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        label = { Text(label, color = Muted, fontSize = 13.sp) },
        singleLine = true,
        visualTransformation = if (password && !visible) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = when { password -> KeyboardType.Password; email -> KeyboardType.Email; else -> KeyboardType.Text }),
        trailingIcon = if (password) { {
            // Eye icon: show / hide the password while typing
            IconButton(onClick = { visible = !visible }) {
                Icon(if (visible) Icons.Default.Visibility else Icons.Default.VisibilityOff, contentDescription = if (visible) "Verbergen · Gizle" else "Anzeigen · Göster", tint = if (visible) Red else Muted)
            }
        } } else null,
        modifier = Modifier.fillMaxWidth(),
        colors = OutlinedTextFieldDefaults.colors(
            focusedTextColor = Color.White, unfocusedTextColor = Color.White,
            focusedBorderColor = Red, unfocusedBorderColor = Color(0xFF4A5866), cursorColor = Color.White
        )
    )
}

@Composable
private fun RecoveryCodeBox(code: String) {
    val context = LocalContext.current
    Text("🔑 Notfall-Code · Acil durum kodu", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
    Text(
        "Bitte aufschreiben und sicher aufbewahren. Er wird nur jetzt angezeigt. Damit setzt du ein vergessenes Passwort zurück.\n\n" +
            "Lütfen bir yere yaz ve sakla. Sadece şimdi gösterilir. Şifreni unutursan bununla sıfırlarsın.",
        color = Muted, fontSize = 12.sp
    )
    Text(
        code,
        color = Gold, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold, fontSize = 20.sp, textAlign = TextAlign.Center,
        modifier = Modifier.fillMaxWidth().border(1.dp, Gold, RoundedCornerShape(10.dp)).padding(12.dp).clickable {
            val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(ClipData.newPlainText("code", code))
            Toast.makeText(context, "Kopiert · Kopyalandı", Toast.LENGTH_SHORT).show()
        }
    )
}

/** 3 security questions: the question can be typed or picked with "Vorschlag" (cycles through the choices). */
@Composable
private fun QuestionEditor(questions: androidx.compose.runtime.snapshots.SnapshotStateList<String>, answers: androidx.compose.runtime.snapshots.SnapshotStateList<String>) {
    Text("🔐 3 Sicherheitsfragen – für Passwort vergessen · 3 güvenlik sorusu", color = Muted, fontSize = 12.sp)
    for (i in 0 until 3) {
        DarkField(questions[i], { questions[i] = it }, "Frage ${i + 1} · Soru ${i + 1}")
        Text("↻ Vorschlag · Öneri", color = Color(0xFF58A6FF), fontSize = 12.sp, modifier = Modifier.clickable {
            val list = AdminAuthClient.QUESTION_CHOICES
            val idx = list.indexOf(questions[i])
            questions[i] = list[(idx + 1).mod(list.size)]
        })
        DarkField(answers[i], { answers[i] = it }, "Antwort ${i + 1} · Cevap ${i + 1}", password = true)
    }
}

private fun questionsOk(q: List<String>, a: List<String>) = q.all { it.isNotBlank() } && a.all { it.trim().length >= 2 }

/**
 * Admin login (2026-11-11): e-mail (optional) + password with eye icon, checked on the server.
 * First start: the old test password opens the setup once, then an own password is required.
 * "Passwort vergessen": recovery code (always) or e-mail link (when e-mail sending is set up).
 */
@Composable
fun AdminLoginPanel(onLoggedIn: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var mode by remember { mutableStateOf("login") } // login | setup | forgot | code
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var password2 by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("Ersen Bakıcı") }
    var code by remember { mutableStateOf("") }
    var shownCode by remember { mutableStateOf("") }
    var token by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var emailReset by remember { mutableStateOf(false) }
    val questions = remember { mutableStateListOf(*AdminAuthClient.QUESTION_CHOICES.take(3).toTypedArray()) }
    val answers = remember { mutableStateListOf("", "", "") }
    var loadedQuestions by remember { mutableStateOf<List<String>>(emptyList()) }

    Card(
        modifier = Modifier.fillMaxWidth().padding(20.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardBg),
        elevation = CardDefaults.cardElevation(8.dp)
    ) {
        Column(
            modifier = Modifier.padding(22.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            when (mode) {
                "login" -> {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = Red, modifier = Modifier.size(34.dp))
                    Text("My Kiez Berlin Admin", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    DarkField(email, { email = it; message = "" }, "E-Mail (optional)", email = true)
                    DarkField(password, { password = it; message = "" }, "Passwort · Şifre", password = true)
                    Button(
                        onClick = {
                            busy = true
                            scope.launch {
                                val r = AdminAuthClient.call("login", fields = mapOf("email" to email.trim(), "password" to password))
                                busy = false
                                if (!r.ok) { message = AdminAuthClient.message(r.error); return@launch }
                                token = r.token
                                if (r.setupRequired) {
                                    name = r.name.ifBlank { "Ersen Bakıcı" }
                                    email = r.email.ifBlank { "bakiciersen@gmail.com" }
                                    password = ""; password2 = ""
                                    mode = "setup"
                                } else onLoggedIn(r.token)
                            }
                        },
                        enabled = !busy && password.isNotBlank(),
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = Green)
                    ) { Text(if (busy) "…" else "Anmelden · Giriş yap", fontWeight = FontWeight.Bold, color = Color.White) }
                    Text("Passwort vergessen? · Şifremi unuttum", color = Color(0xFF58A6FF), fontSize = 13.sp, modifier = Modifier.clickable {
                        message = ""; mode = "forgot"
                        scope.launch { emailReset = AdminAuthClient.emailResetAvailable() }
                    })
                }
                "setup" -> {
                    Text("Eigenes Passwort festlegen · Kendi şifreni belirle", color = Color.White, fontSize = 17.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                    Text("Danach gilt das alte Test-Passwort nicht mehr. · Sonra eski test şifresi çalışmaz.", color = Muted, fontSize = 12.sp, textAlign = TextAlign.Center)
                    DarkField(name, { name = it }, "Name")
                    DarkField(email, { email = it }, "E-Mail", email = true)
                    DarkField(password, { password = it; message = "" }, "Neues Passwort (min. 8) · Yeni şifre", password = true)
                    DarkField(password2, { password2 = it; message = "" }, "Wiederholen · Tekrar", password = true)
                    QuestionEditor(questions, answers)
                    Button(
                        onClick = {
                            if (password != password2) { message = "Passwörter sind verschieden · Şifreler farklı"; return@Button }
                            if (!questionsOk(questions, answers)) { message = AdminAuthClient.message("questions_incomplete"); return@Button }
                            busy = true
                            scope.launch {
                                val r = AdminAuthClient.call("setup", token, mapOf("name" to name, "email" to email.trim(), "password" to password)) {
                                    it.put("questions", AdminAuthClient.questionsJson(questions, answers))
                                }
                                busy = false
                                if (!r.ok) { message = AdminAuthClient.message(r.error); return@launch }
                                token = r.token; shownCode = r.recoveryCode; mode = "code"
                            }
                        },
                        enabled = !busy, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Green)
                    ) { Text("Speichern · Kaydet", fontWeight = FontWeight.Bold, color = Color.White) }
                }
                "forgot" -> {
                    Text("Passwort vergessen · Şifremi unuttum", color = Color.White, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                    DarkField(email, { email = it; loadedQuestions = emptyList() }, "E-Mail", email = true)
                    // 1) security questions
                    Text("1) Mit Sicherheitsfragen · Güvenlik sorularıyla", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    if (loadedQuestions.isEmpty()) {
                        OutlinedButton(onClick = {
                            scope.launch {
                                val r = AdminAuthClient.call("questions", fields = mapOf("email" to email.trim()))
                                if (r.ok) {
                                    val arr = r.json.optJSONArray("questions")
                                    loadedQuestions = (0 until (arr?.length() ?: 0)).map { arr!!.getString(it) }
                                    answers.clear(); answers.addAll(listOf("", "", ""))
                                } else message = AdminAuthClient.message(r.error)
                            }
                        }, modifier = Modifier.fillMaxWidth()) { Text("Fragen anzeigen · Soruları göster", color = Color.White) }
                    } else {
                        loadedQuestions.forEachIndexed { i, q ->
                            Text(q, color = Color.White, fontSize = 13.sp, modifier = Modifier.fillMaxWidth())
                            DarkField(answers[i], { answers[i] = it; message = "" }, "Antwort · Cevap", password = true)
                        }
                        DarkField(password2, { password2 = it; message = "" }, "Neues Passwort (min. 8) · Yeni şifre", password = true)
                        Button(onClick = {
                            busy = true
                            scope.launch {
                                val r = AdminAuthClient.call("recoverQuestions", fields = mapOf("email" to email.trim(), "newPassword" to password2)) {
                                    it.put("answers", org.json.JSONArray(answers.toList()))
                                }
                                busy = false
                                if (r.ok) onLoggedIn(r.token) else message = AdminAuthClient.message(r.error)
                            }
                        }, enabled = !busy, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Green)) {
                            Text("Zurücksetzen · Sıfırla", fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                    HorizontalDivider(color = Color(0xFF30363D))
                    // 2) recovery code
                    Text("2) Mit Notfall-Code · Acil durum koduyla", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    DarkField(code, { code = it; message = "" }, "Notfall-Code (XXXX-XXXX-XXXX-XXXX)")
                    DarkField(password, { password = it; message = "" }, "Neues Passwort (min. 8) · Yeni şifre", password = true)
                    Button(
                        onClick = {
                            busy = true
                            scope.launch {
                                val r = AdminAuthClient.call("recover", fields = mapOf("email" to email.trim(), "code" to code, "newPassword" to password))
                                busy = false
                                if (!r.ok) { message = AdminAuthClient.message(r.error); return@launch }
                                token = r.token; shownCode = r.recoveryCode; mode = "code"
                            }
                        },
                        enabled = !busy, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Green)
                    ) { Text("Zurücksetzen · Sıfırla", fontWeight = FontWeight.Bold, color = Color.White) }
                    if (emailReset) {
                        OutlinedButton(onClick = {
                            scope.launch {
                                val r = AdminAuthClient.call("forgot", fields = mapOf("email" to email.trim()))
                                message = if (r.ok) "Wenn die Adresse stimmt, ist die E-Mail unterwegs. · Adres doğruysa e-posta gönderildi." else AdminAuthClient.message(r.error)
                            }
                        }, modifier = Modifier.fillMaxWidth()) { Text("Link per E-Mail · E-postayla link", color = Color.White) }
                    } else {
                        Text("E-Mail-Versand ist noch nicht eingerichtet. · E-posta gönderimi henüz kurulmadı.", color = Muted, fontSize = 11.sp, textAlign = TextAlign.Center)
                    }
                    Text("← Zurück · Geri", color = Color(0xFF58A6FF), fontSize = 13.sp, modifier = Modifier.clickable { message = ""; mode = "login" })
                }
                "code" -> {
                    RecoveryCodeBox(shownCode)
                    Button(onClick = { onLoggedIn(token) }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Green)) {
                        Text("Notiert · Not aldım", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
            if (message.isNotBlank()) Text(message, color = Color(0xFFF85149), fontSize = 12.sp, textAlign = TextAlign.Center)
        }
    }
}

/** 🔐 in the admin panel: change password, new recovery code, story alarm switches, admins (web). */
@Composable
fun AdminAccountDialog(onDismiss: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val token = remember { KiezStorageManager.getAdminToken(context) }
    var me by remember { mutableStateOf("") }
    var oldPw by remember { mutableStateOf("") }
    var newPw by remember { mutableStateOf("") }
    var newPw2 by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var shownCode by remember { mutableStateOf("") }
    var watchOn by remember { mutableStateOf(AdminStoryWatchService.isEnabled(context)) }
    var soundOn by remember { mutableStateOf(AdminStoryWatchService.isSoundOn(context)) }
    var remind by remember { mutableStateOf(AdminStoryWatchService.remindMinutes(context)) }
    val qList = remember { mutableStateListOf(*AdminAuthClient.QUESTION_CHOICES.take(3).toTypedArray()) }
    val aList = remember { mutableStateListOf("", "", "") }
    var qPw by remember { mutableStateOf("") }
    var hasQuestions by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        val r = AdminAuthClient.call("me", token)
        me = if (r.ok) "${r.name} · ${r.email}" else AdminAuthClient.message(r.error)
        hasQuestions = r.json.optBoolean("hasQuestions")
        r.json.optJSONArray("questions")?.let { arr -> for (i in 0 until minOf(3, arr.length())) qList[i] = arr.getString(i) }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = CardBg)) {
            Column(Modifier.padding(18.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("🔐 Konto & Sicherheit · Hesap & güvenlik", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(me, color = Muted, fontSize = 12.sp)

                if (shownCode.isNotBlank()) {
                    RecoveryCodeBox(shownCode)
                    Button(onClick = { shownCode = "" }, colors = ButtonDefaults.buttonColors(containerColor = Green)) { Text("Notiert · Not aldım", color = Color.White) }
                    return@Column
                }

                // ---- story alarm ----
                HorizontalDivider(color = Color(0xFF30363D))
                Text("🔔 Neue Stories melden · Yeni story bildirimi", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Sofort melden (jede Minute) · Hemen bildir", color = Muted, fontSize = 12.sp, modifier = Modifier.weight(1f))
                    Switch(checked = watchOn, onCheckedChange = { watchOn = it; AdminStoryWatchService.setEnabled(context, it) })
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Lauter Ton · Yüksek ses", color = Muted, fontSize = 12.sp, modifier = Modifier.weight(1f))
                    Switch(checked = soundOn, onCheckedChange = { soundOn = it; AdminStoryWatchService.setSound(context, it) })
                }
                Text("Erinnern, solange Stories warten · Story bekledikçe hatırlat", color = Muted, fontSize = 12.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    AdminStoryWatchService.REMIND_CHOICES.forEach { m ->
                        FilterChip(
                            selected = remind == m,
                            onClick = { remind = m; AdminStoryWatchService.setRemindMinutes(context, m) },
                            label = { Text(if (m == 0) "aus · kapalı" else "$m min", fontSize = 11.sp) }
                        )
                    }
                }

                // ---- security questions ----
                HorizontalDivider(color = Color(0xFF30363D))
                Text("Sicherheitsfragen · Güvenlik soruları " + if (hasQuestions) "✓" else "⚠️", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                QuestionEditor(qList, aList)
                DarkField(qPw, { qPw = it; message = "" }, "Aktuelles Passwort · Mevcut şifre", password = true)
                Button(onClick = {
                    if (!questionsOk(qList, aList)) { message = AdminAuthClient.message("questions_incomplete"); return@Button }
                    scope.launch {
                        val r = AdminAuthClient.call("setQuestions", token, mapOf("password" to qPw)) { it.put("questions", AdminAuthClient.questionsJson(qList, aList)) }
                        message = if (r.ok) "Sicherheitsfragen gespeichert ✓ · Kaydedildi ✓" else AdminAuthClient.message(r.error)
                        if (r.ok) { hasQuestions = true; qPw = ""; aList.clear(); aList.addAll(listOf("", "", "")) }
                    }
                }, colors = ButtonDefaults.buttonColors(containerColor = Green)) { Text("Fragen speichern · Kaydet", color = Color.White) }

                // ---- password ----
                HorizontalDivider(color = Color(0xFF30363D))
                Text("Passwort ändern · Şifre değiştir", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                DarkField(oldPw, { oldPw = it; message = "" }, "Altes Passwort · Eski şifre", password = true)
                DarkField(newPw, { newPw = it; message = "" }, "Neues Passwort (min. 8) · Yeni şifre", password = true)
                DarkField(newPw2, { newPw2 = it; message = "" }, "Wiederholen · Tekrar", password = true)
                Button(onClick = {
                    if (newPw != newPw2) { message = "Passwörter sind verschieden · Şifreler farklı"; return@Button }
                    scope.launch {
                        val r = AdminAuthClient.call("change", token, mapOf("oldPassword" to oldPw, "newPassword" to newPw))
                        message = if (r.ok) "Passwort geändert ✓ · Şifre değişti ✓" else AdminAuthClient.message(r.error)
                        if (r.ok) { oldPw = ""; newPw = ""; newPw2 = "" }
                    }
                }, colors = ButtonDefaults.buttonColors(containerColor = Green)) { Text("Speichern · Kaydet", color = Color.White) }

                OutlinedButton(onClick = {
                    scope.launch {
                        val r = AdminAuthClient.call("recovery", token)
                        if (r.ok) shownCode = r.recoveryCode else message = AdminAuthClient.message(r.error)
                    }
                }) { Text("🔑 Neuer Notfall-Code · Yeni acil durum kodu", color = Color.White, fontSize = 12.sp) }

                OutlinedButton(onClick = {
                    try { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://mykiezberlin.com/admin.html")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) {}
                }) { Text("👥 Admins verwalten (Web) · Adminleri yönet", color = Color.White, fontSize = 12.sp) }
                OutlinedButton(onClick = {
                    try { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://mykiezberlin.com/admin.html#admin-support")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) {}
                }) { Text("🛠 Support-Meldungen (Web) · Destek bildirimleri", color = Color.White, fontSize = 12.sp) }

                if (message.isNotBlank()) Text(message, color = if (message.contains("✓")) Color(0xFF3FB950) else Color(0xFFF85149), fontSize = 12.sp)
                TextButton(onClick = onDismiss, modifier = Modifier.align(Alignment.End)) { Text("Schließen · Kapat", color = Muted) }
            }
        }
    }
}
