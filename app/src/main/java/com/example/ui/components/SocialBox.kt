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

    /** Opens the link in the Facebook / Instagram / WhatsApp app when installed, else in the browser. */
    fun open(context: Context, url: String) {
        val pkg = when {
            url.contains("instagram.com") -> "com.instagram.android"
            url.contains("facebook.com") -> "com.facebook.katana"
            url.contains("wa.me") -> "com.whatsapp"
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
