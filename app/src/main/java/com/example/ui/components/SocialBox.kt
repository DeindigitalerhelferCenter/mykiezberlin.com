package com.example.ui.components

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.Animatable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.TextButton
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import kotlinx.coroutines.launch
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * 2026-11-17 (owner): own social media of My Kiez Berlin + "Mitmachen · Paylaş" box.
 * Facebook, Instagram, WhatsApp (MyKiezBerlin-info). The WhatsApp button glows green to catch the eye.
 * Same texts as the website (public/social.js).
 */
object MkSocial {
    const val FACEBOOK = "https://www.facebook.com/my.kiez.berlin/"
    const val INSTAGRAM = "https://www.instagram.com/mykiezberlin"
    const val WA_NUMBER = "4917640556109"
    const val PHONE = "+49 176 40556109"
    const val MAIL = "info@mykiezberlin.com"
    val WHATSAPP = "https://wa.me/$WA_NUMBER?text=" + Uri.encode("Hallo My Kiez Berlin! · Merhaba My Kiez Berlin!")
    // 2026-11-19 (owner): TikTok is open; YouTube opens tonight – "" shows a grey "bald / yakında" button
    const val TIKTOK = "https://www.tiktok.com/@mykiezberlin"
    const val YOUTUBE = ""
    // 2026-11-19 (owner): Telegram channel + WhatsApp channel – the buttons appear as soon as a link is filled in
    const val TELEGRAM = ""
    const val WA_CHANNEL = ""

    /** Opens the link in the Facebook / Instagram / WhatsApp / TikTok / YouTube app when installed, else in the browser. */
    fun open(context: Context, url: String) {
        if (url.isBlank()) return
        val pkg = when {
            url.contains("instagram.com") -> "com.instagram.android"
            url.contains("facebook.com") -> "com.facebook.katana"
            url.contains("wa.me") || url.contains("whatsapp.com/channel") -> "com.whatsapp"
            url.contains("t.me/") || url.contains("telegram.me") -> "org.telegram.messenger"
            url.contains("tiktok.com") -> "com.zhiliaoapp.musically"
            url.contains("youtube.com") || url.contains("youtu.be") -> "com.google.android.youtube"
            else -> null
        }
        val uri = Uri.parse(url)
        val withApp = Intent(Intent.ACTION_VIEW, uri).apply { if (pkg != null) setPackage(pkg); addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
        try {
            context.startActivity(withApp)
        } catch (_: Exception) {
            try { context.startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) {}
        }
    }
}

@Composable
private fun SocialButton(label: String, background: Brush, modifier: Modifier, glow: Boolean = false, onClick: () -> Unit) {
    var m = modifier
    if (glow) {
        val t = rememberInfiniteTransition(label = "waGlow")
        val pulse by t.animateFloat(0f, 1f, infiniteRepeatable(tween(700, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "p")
        m = m.scale(1f + 0.04f * pulse).shadow((4 + 14 * pulse).dp, RoundedCornerShape(14.dp), ambientColor = Color(0xFF25D366), spotColor = Color(0xFF25D366))
    }
    Box(
        m.clip(RoundedCornerShape(14.dp)).background(background).clickable(onClick = onClick).height(46.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(label, color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
    }
}

@Composable
fun SocialButtonsRow() {
    val context = LocalContext.current
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        SocialButton("💬 WhatsApp", Brush.linearGradient(listOf(Color(0xFF25D366), Color(0xFF1EBE5A))), Modifier.fillMaxWidth(), glow = true) { MkSocial.open(context, MkSocial.WHATSAPP) }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            SocialButton("📸 Instagram", Brush.linearGradient(listOf(Color(0xFFFEDA75), Color(0xFFFA7E1E), Color(0xFFD62976), Color(0xFF962FBF), Color(0xFF4F5BD5))), Modifier.weight(1f)) { MkSocial.open(context, MkSocial.INSTAGRAM) }
            SocialButton("f  Facebook", Brush.linearGradient(listOf(Color(0xFF1877F2), Color(0xFF1877F2))), Modifier.weight(1f)) { MkSocial.open(context, MkSocial.FACEBOOK) }
        }
        // 2026-11-19 (owner): TikTok + YouTube (YouTube grey until the channel is open)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            SocialButton("♪  TikTok", Brush.linearGradient(listOf(Color(0xFF010101), Color(0xFF25F4EE).copy(alpha = 0.55f), Color(0xFFFE2C55))), Modifier.weight(1f)) { MkSocial.open(context, MkSocial.TIKTOK) }
            if (MkSocial.YOUTUBE.isNotBlank()) SocialButton("▶  YouTube", Brush.linearGradient(listOf(Color(0xFFFF0000), Color(0xFFCC0000))), Modifier.weight(1f)) { MkSocial.open(context, MkSocial.YOUTUBE) }
            else SocialButton("▶  YouTube · bald", Brush.linearGradient(listOf(Color(0xFF9CA3AF), Color(0xFF9CA3AF))), Modifier.weight(1f)) { }
        }
        if (MkSocial.TELEGRAM.isNotBlank() || MkSocial.WA_CHANNEL.isNotBlank()) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (MkSocial.TELEGRAM.isNotBlank()) SocialButton("✈  Telegram", Brush.linearGradient(listOf(Color(0xFF229ED9), Color(0xFF229ED9))), Modifier.weight(1f)) { MkSocial.open(context, MkSocial.TELEGRAM) }
            if (MkSocial.WA_CHANNEL.isNotBlank()) SocialButton("📣  WhatsApp-Kanal", Brush.linearGradient(listOf(Color(0xFF128C7E), Color(0xFF128C7E))), Modifier.weight(1f)) { MkSocial.open(context, MkSocial.WA_CHANNEL) }
        }
    }
}

/** One round social bubble: brand colour + white symbol; spins 360° before the app opens (owner 2026-11-19). */
@Composable
private fun SocialBubble(symbol: String, background: Brush, description: String, enabled: Boolean = true, symbolSize: Int = 17, onOpen: () -> Unit) {
    val scope = rememberCoroutineScope()
    val angle = remember { Animatable(0f) }
    Box(
        Modifier
            .size(38.dp)
            .graphicsLayer { rotationZ = angle.value; alpha = if (enabled) 1f else 0.45f }
            .shadow(3.dp, CircleShape)
            .clip(CircleShape)
            .background(background)
            .border(2.dp, Color.White, CircleShape)
            .semantics { contentDescription = description }
            .clickable(enabled = enabled) {
                scope.launch {
                    angle.snapTo(0f)
                    angle.animateTo(360f, tween(450, easing = FastOutSlowInEasing))
                    onOpen()
                    angle.snapTo(0f)
                }
            },
        contentAlignment = Alignment.Center
    ) {
        Text(symbol, color = Color.White, fontWeight = FontWeight.Black, fontSize = symbolSize.sp)
    }
}

/**
 * 2026-11-19 (owner): round social buttons right above the story circles, always visible at the top of the home page.
 * WhatsApp · Instagram · Facebook · TikTok · YouTube (grey until open) · ⓘ (opens the "Mitmachen · Paylaş" text).
 * The full box at the end of the page stays.
 */
@Composable
fun SocialRoundRow(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    var info by remember { mutableStateOf(false) }
    Row(
        modifier.fillMaxWidth().horizontalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        SocialBubble("✆", Brush.linearGradient(listOf(Color(0xFF25D366), Color(0xFF1EBE5A))), "WhatsApp") { MkSocial.open(context, MkSocial.WHATSAPP) }
        SocialBubble("◎", Brush.linearGradient(listOf(Color(0xFFFEDA75), Color(0xFFFA7E1E), Color(0xFFD62976), Color(0xFF962FBF), Color(0xFF4F5BD5))), "Instagram", symbolSize = 19) { MkSocial.open(context, MkSocial.INSTAGRAM) }
        SocialBubble("f", Brush.linearGradient(listOf(Color(0xFF1877F2), Color(0xFF1877F2))), "Facebook", symbolSize = 20) { MkSocial.open(context, MkSocial.FACEBOOK) }
        SocialBubble("♪", Brush.linearGradient(listOf(Color(0xFF010101), Color(0xFF333333))), "TikTok", symbolSize = 19) { MkSocial.open(context, MkSocial.TIKTOK) }
        SocialBubble("▶", Brush.linearGradient(listOf(Color(0xFFFF0000), Color(0xFFCC0000))), if (MkSocial.YOUTUBE.isBlank()) "YouTube – bald" else "YouTube", enabled = MkSocial.YOUTUBE.isNotBlank(), symbolSize = 14) { MkSocial.open(context, MkSocial.YOUTUBE) }
        if (MkSocial.TELEGRAM.isNotBlank()) SocialBubble("✈", Brush.linearGradient(listOf(Color(0xFF229ED9), Color(0xFF229ED9))), "Telegram", symbolSize = 17) { MkSocial.open(context, MkSocial.TELEGRAM) }
        if (MkSocial.WA_CHANNEL.isNotBlank()) SocialBubble("📣", Brush.linearGradient(listOf(Color(0xFF128C7E), Color(0xFF128C7E))), "WhatsApp-Kanal", symbolSize = 16) { MkSocial.open(context, MkSocial.WA_CHANNEL) }
        SocialBubble("i", Brush.linearGradient(listOf(Color(0xFF0F766E), Color(0xFF0F766E))), "Info – Mitmachen · Paylaş", symbolSize = 18) { info = true }
    }
    if (info) {
        AlertDialog(
            onDismissRequest = { info = false },
            confirmButton = { TextButton(onClick = { info = false }) { Text("OK") } },
            text = { Column(Modifier.verticalScroll(rememberScrollState())) { SocialBox() } }
        )
    }
}

/** Full box: "Mitmachen · Paylaş" (DE + TR), buttons, contact. */
@Composable
fun SocialBox(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val muted = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
    Column(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.25f), RoundedCornerShape(18.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Text("📣 MITMACHEN · PAYLAŞ", fontWeight = FontWeight.Black, fontSize = 16.sp)
        Text("BERLIN & DEUTSCHLAND", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
        Text("Teilt mit uns die Nachrichten aus Berlin und Deutschland, tägliche besondere Ereignisse und alles, was uns alle betrifft – über MyKiezBerlin-info. Eure Nachrichten erscheinen schnellstmöglich auf unseren Seiten: klar, schnell und mehrsprachig.", fontSize = 13.sp, color = muted, lineHeight = 19.sp)
        Text("Berlin ve Almanya’daki haberleri, günlük ilginç olayları, hepimizi ilgilendiren haberleri bizlerle MyKiezBerlin-info ile paylaşabilirsiniz. Haberleriniz en kısa zamanda sayfalarımızda – net, hızlı ve çok dilli.", fontSize = 13.sp, color = muted, lineHeight = 19.sp)
        Box(Modifier.padding(top = 4.dp)) { SocialButtonsRow() }
        Text("KONTAKT · İLETİŞİM", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp, modifier = Modifier.padding(top = 6.dp))
        Text("📱 WhatsApp: ${MkSocial.PHONE}", fontSize = 13.sp, color = Color(0xFF0F766E), fontWeight = FontWeight.Bold, modifier = Modifier.clickable { MkSocial.open(context, MkSocial.WHATSAPP) })
        Text("✉️ ${MkSocial.MAIL}", fontSize = 13.sp, color = Color(0xFF0F766E), fontWeight = FontWeight.Bold, modifier = Modifier.clickable {
            try { context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:${MkSocial.MAIL}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) {}
        })
    }
}
