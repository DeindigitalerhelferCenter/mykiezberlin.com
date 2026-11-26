package com.example.ui.components

// 2026-11-26 (owner "UYGULA"): permanent "Einladen & Teilen · Davet et" box (home page + profile), same as the web
// (public/invite-box.js). The cards are the pictures of https://mykiezberlin.com/davet/ – a tap opens that page in the
// browser (there the picture itself can be shared). "WhatsApp" sends a ready invite text; WhatsApp shows the card
// picture as link preview. KEEP IN SYNC with functions/_lib/invite-cards.js (keys + titles).

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

private const val DAVET = "https://mykiezberlin.com/davet/"

private val INVITE_KEYS = listOf(
    "berlin" to "WhatsApp-Gruppe Ganz Berlin",
    "neukoelln" to "WhatsApp-Gruppe Neukölln",
    "kreuzberg" to "WhatsApp-Gruppe Kreuzberg",
    "wedding" to "WhatsApp-Gruppe Wedding",
    "moabit" to "WhatsApp-Gruppe Moabit",
    "spandau" to "WhatsApp-Gruppe Spandau",
    "kanal" to "WhatsApp-Kanal",
    "app" to "App My Kiez Berlin",
    "werben" to "Für Betriebe · İşletmeler",
)

private fun openUrl(context: Context, url: String) {
    try {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (_: Exception) { }
}

/** Ready invite text (DE + TR) with the permanent links – WhatsApp shows the card picture as preview. */
private fun inviteText(): String =
    "🇩🇪 Komm zu My Kiez Berlin! WhatsApp-Gruppe, Kanal & App – kostenlos:\n" +
        "👥 Gruppe: ${DAVET}berlin\n📢 Kanal: ${DAVET}kanal\n📲 App: ${DAVET}app\n\n" +
        "🇹🇷 My Kiez Berlin'e katıl! WhatsApp grubu, kanal ve uygulama – ücretsiz:\n" +
        "👥 Grup: ${DAVET}berlin\n📢 Kanal: ${DAVET}kanal\n📲 Uygulama: ${DAVET}app\n\n" +
        "📍 Alle Karten · Tüm kartlar: $DAVET"

private fun shareWhatsApp(context: Context) {
    val text = inviteText()
    val wa = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text).setPackage("com.whatsapp")
    try {
        context.startActivity(wa.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (_: Exception) {
        try {
            val any = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text)
            context.startActivity(Intent.createChooser(any, "Einladen · Davet et").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: Exception) { }
    }
}

@Composable
fun InviteBox(modifier: Modifier = Modifier) {
    val context = LocalContext.current
    Column(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF0D1117), Color(0xFF1B2B22))))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text("📲 Einladen & Teilen · Davet et", color = Color.White, fontWeight = FontWeight.Black, fontSize = 16.sp)
        Text(
            "WhatsApp-Gruppen, Kanal & App – mit Bild an Freunde schicken · WhatsApp grupları, kanal ve uygulama – resimli olarak arkadaşlarına gönder",
            color = Color(0xFFC9D1D9), fontSize = 12.5.sp, lineHeight = 17.sp
        )
        Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            INVITE_KEYS.forEach { (key, title) ->
                Column(Modifier.width(112.dp).clickable { openUrl(context, "$DAVET#$key") }) {
                    AsyncImage(
                        model = "https://mykiezberlin.com/assets/davet/$key-post.jpg",
                        contentDescription = title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.size(112.dp).clip(RoundedCornerShape(12.dp)).background(Color.Black)
                    )
                    Text(title, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold, lineHeight = 14.sp, modifier = Modifier.padding(top = 4.dp))
                }
            }
        }
        Button(
            onClick = { shareWhatsApp(context) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366), contentColor = Color(0xFF05290F))
        ) { Text("👥 Per WhatsApp einladen · WhatsApp'ta davet et", fontWeight = FontWeight.Black, fontSize = 13.5.sp, textAlign = TextAlign.Center) }
        OutlinedButton(
            onClick = { openUrl(context, DAVET) },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        ) { Text("🖼️ Alle Karten mit Bild · Tüm resimli kartlar →", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp, textAlign = TextAlign.Center) }
    }
}
