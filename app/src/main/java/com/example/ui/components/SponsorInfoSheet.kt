package com.example.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.AppLanguage
import com.example.data.repository.AdsRepository
import com.example.data.repository.ServerAd
import com.example.ui.theme.BerlinRed

/**
 * Contact sheet for sponsors (2026-11-11), same as the web (public/sponsor-info.js).
 * A tap on a sponsor card shows the checked data from the customer register – address, opening hours,
 * phone, WhatsApp, e-mail, Instagram – and the website only if the sponsor has a working one.
 */
object SponsorInfoState {
    val current = mutableStateOf<ServerAd?>(null)
    fun show(ad: ServerAd) {
        AdsRepository.trackClick(ad.id)
        current.value = ad
    }
    /** Built-in banner entries carry only the server id. */
    fun showById(id: String): Boolean {
        val ad = (AdsRepository.sliderAds.value + AdsRepository.pageAds.value + AdsRepository.homeAds.value).firstOrNull { it.id == id } ?: return false
        show(ad)
        return true
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SponsorInfoHost(language: AppLanguage) {
    val ad = SponsorInfoState.current.value ?: return
    val context = LocalContext.current
    fun L(de: String, tr: String, en: String) = when (language) { AppLanguage.TURKISH -> tr; AppLanguage.ENGLISH -> en; else -> de }
    fun open(uri: String) {
        try { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(uri)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) {}
    }
    val tel = if (ad.linkTel.isNotBlank()) "tel:" + ad.linkTel.filter { it.isDigit() || it == '+' } else ""
    val wa = if (ad.linkWa.isNotBlank()) "https://wa.me/" + ad.linkWa.filter { it.isDigit() } else ""
    val web = ad.linkWeb.takeIf { it.startsWith("http") }.orEmpty()
    val ig = ad.linkIg.takeIf { it.startsWith("http") }.orEmpty()
    val maps = if (ad.address.isNotBlank() && !ad.address.contains("Umgebung", true)) "https://www.google.com/maps/search/?api=1&query=" + Uri.encode(ad.name + " " + ad.address) else ""
    val headline = when (language) { AppLanguage.TURKISH -> ad.headlineTr.ifBlank { ad.headlineDe }; AppLanguage.ENGLISH -> ad.headlineEn.ifBlank { ad.headlineDe }; else -> ad.headlineDe }
    val category = when (language) { AppLanguage.TURKISH -> ad.categoryTr.ifBlank { ad.categoryDe }; AppLanguage.ENGLISH -> ad.categoryEn.ifBlank { ad.categoryDe }; else -> ad.categoryDe }

    ModalBottomSheet(onDismissRequest = { SponsorInfoState.current.value = null }, containerColor = MaterialTheme.colorScheme.surface) {
        Column(
            Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(horizontal = 18.dp).padding(bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                val logo = ad.logo.ifBlank { ad.image }
                if (logo.isNotBlank()) AsyncImage(model = logo, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.size(60.dp).clip(RoundedCornerShape(14.dp)))
                Column(Modifier.weight(1f)) {
                    Text(L("Anzeige", "Reklam", "Ad"), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF222222),
                        modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(Color(0xFFF2B705)).padding(horizontal = 6.dp, vertical = 1.dp))
                    Text(ad.name, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                    if (category.isNotBlank()) Text(category, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if (headline.isNotBlank()) Text(headline, fontSize = 14.sp)
            if (ad.couponCode.isNotBlank()) {
                val c = when (language) { AppLanguage.TURKISH -> ad.couponTr; AppLanguage.ENGLISH -> ad.couponEn; else -> ad.couponDe }.ifBlank { ad.couponDe }
                Text("🎟️ ${ad.couponCode} · $c", fontSize = 13.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(Color(0xFFF2B705).copy(alpha = 0.18f)).padding(10.dp))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (tel.isNotBlank()) Button(
                    onClick = { open(tel) }, modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = if (ad.primary != "wa") BerlinRed else MaterialTheme.colorScheme.surfaceVariant,
                        contentColor = if (ad.primary != "wa") Color.White else MaterialTheme.colorScheme.onSurface)
                ) { Text("📞 " + L("Anrufen", "Ara", "Call"), fontWeight = FontWeight.Bold) }
                if (wa.isNotBlank()) Button(
                    onClick = { open(wa) }, modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = if (ad.primary == "wa") Color(0xFF1FA855) else MaterialTheme.colorScheme.surfaceVariant,
                        contentColor = if (ad.primary == "wa") Color.White else MaterialTheme.colorScheme.onSurface)
                ) { Text("💬 WhatsApp", fontWeight = FontWeight.Bold) }
            }
            HorizontalDivider()
            if (ad.address.isNotBlank()) InfoRow("📍", L("Adresse", "Adres", "Address"), ad.address, if (maps.isNotBlank()) ({ open(maps) }) else null)
            if (ad.hours.isNotBlank()) InfoRow("🕒", L("Öffnungszeiten", "Çalışma saatleri", "Opening hours"), ad.hours, null)
            if (ad.contact.isNotBlank()) InfoRow("👤", L("Ansprechpartner", "İletişim kişisi", "Contact person"), ad.contact, null)
            if (tel.isNotBlank()) InfoRow("📞", L("Telefon", "Telefon", "Phone"), ad.linkTel) { open(tel) }
            if (wa.isNotBlank()) InfoRow("💬", "WhatsApp", ad.linkWa) { open(wa) }
            if (ad.fax.isNotBlank()) InfoRow("📠", "Fax", ad.fax, null)
            if (ad.email.isNotBlank()) InfoRow("✉️", L("E-Mail", "E-posta", "E-mail"), ad.email) { open("mailto:" + ad.email) }
            if (ig.isNotBlank()) InfoRow("📸", "Instagram", "@" + ig.trimEnd('/').substringAfterLast('/')) { open(ig) }
            if (web.isNotBlank()) InfoRow("🌐", L("Webseite", "Web sitesi", "Website"), web.removePrefix("https://").removePrefix("http://").removePrefix("www.").trimEnd('/')) { open(web) }
            // Wrong number, broken link … -> support form (2026-11-11)
            TextButton(onClick = {
                SponsorInfoState.current.value = null
                SupportState.show("sponsor", ad.name)
            }, modifier = Modifier.fillMaxWidth()) {
                Text("⚠️ " + L("Fehler melden (falsche Nummer, Link …)", "Hata bildir (yanlış numara, link …)", "Report a problem (wrong number, link …)"), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun InfoRow(icon: String, label: String, value: String, onClick: (() -> Unit)?) {
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).let { if (onClick != null) it.clickable { onClick() } else it }.padding(vertical = 8.dp, horizontal = 2.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(icon, fontSize = 18.sp)
        Column(Modifier.weight(1f)) {
            Text(label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        }
        if (onClick != null) Text("›", fontSize = 20.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
