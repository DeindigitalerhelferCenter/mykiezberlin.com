package com.example.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.AppLanguage
import com.example.data.repository.AdsRepository
import com.example.data.repository.ServerAd
import com.example.ui.theme.BerlinRed

private val SponsorGold = Color(0xFFF2B705)

/**
 * Sponsor on every page change – the same rotation and package rules as the web (sponsor-rotation.js).
 * Groß = large card (3×), Mittel = medium banner (2×), Klein = small strip (1×, plus top of its own Kiez).
 * On "Gutscheine" the coupons of all sponsors are shown instead.
 */
@Composable
fun PageSponsorSlot(screenKey: String, language: AppLanguage, activeKiez: String, showCoupons: Boolean) {
    LaunchedEffect(Unit) { AdsRepository.refreshPageAds() }
    val pageAds by AdsRepository.pageAds.collectAsState()
    // A new sponsor on every page change (and once the list has arrived)
    val ad = remember(screenKey, pageAds.isNotEmpty()) { AdsRepository.nextPageAd() }
    var hidden by remember(screenKey) { mutableStateOf(false) }
    if (hidden) return

    val local = remember(pageAds, activeKiez) {
        if (activeKiez.isBlank() || activeKiez == "Alle") emptyList()
        else pageAds.filter { it.size == "small" && it.kieze.isNotBlank() && (it.kieze.contains(activeKiez, true) || activeKiez.contains(it.kieze, true)) }
    }
    val coupons = remember(pageAds, showCoupons) { if (showCoupons) pageAds.filter { it.couponCode.isNotBlank() } else emptyList() }
    if (ad == null && local.isEmpty() && coupons.isEmpty()) return

    Column(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        // 2026-11-13: same card as the home page and the web (picture, package badge, glowing frame)
        // 2026-11-14 (APK check): the fixed place on top of a page took half of the screen (and on "Kuponlar" every
        // coupon sponsor one under the other) – now one compact card (picture left), the page itself keeps the room
        val one = remember(screenKey, local, coupons, ad) { local.firstOrNull() ?: coupons.shuffled().firstOrNull() ?: ad }
        if (one != null) SponsorTierCard(one, language, onHide = { hidden = true }, compact = true)
    }
}

private fun pick(language: AppLanguage, de: String, tr: String, en: String) = when (language) {
    AppLanguage.TURKISH -> tr.ifBlank { de }
    AppLanguage.ENGLISH -> en.ifBlank { de }
    else -> de
}

@Composable
private fun SponsorView(ad: ServerAd, size: String, language: AppLanguage, onHide: () -> Unit) {
    val context = LocalContext.current
    LaunchedEffect(ad.id) { AdsRepository.trackImpressions(listOf(ad.id)) }
    fun open(link: String) {
        AdsRepository.trackClick(ad.id)
        try { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(link)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) {}
    }
    val label = pick(language, "Anzeige", "Reklam", "Ad")
    val headline = pick(language, ad.headlineDe, ad.headlineTr, ad.headlineEn)
    val category = pick(language, ad.categoryDe, ad.categoryTr, ad.categoryEn)
    val cta = pick(language, ad.ctaDe, ad.ctaTr, ad.ctaEn).ifBlank { pick(language, "Ansehen", "Gör", "View") }
    val coupon = if (ad.couponCode.isNotBlank()) "🎟️ ${ad.couponCode} · " + pick(language, ad.couponDe, ad.couponTr, ad.couponEn) else ""
    val tel = if (ad.linkTel.isNotBlank()) "tel:" + ad.linkTel.filter { it.isDigit() || it == '+' } else ""
    val wa = if (ad.linkWa.isNotBlank()) "https://wa.me/" + ad.linkWa.filter { it.isDigit() } else ""
    val web = ad.linkWeb.ifBlank { ad.linkIg }

    if (size == "small") {
        Row(
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                .background(SponsorGold.copy(alpha = 0.14f)).clickable { SponsorInfoState.show(ad) }
                .padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(Modifier.width(3.dp).height(30.dp).background(SponsorGold))
            val logo = ad.logo.ifBlank { ad.image }
            if (logo.isNotBlank()) AsyncImage(model = logo, contentDescription = null, contentScale = ContentScale.Fit, /* 2026-11-14: whole logo */ modifier = Modifier.size(32.dp).clip(RoundedCornerShape(8.dp)))
            Column(Modifier.weight(1f)) {
                Text(ad.name, fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(category.ifBlank { headline }, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            SponsorLabel(label)
            Text("→", fontWeight = FontWeight.Bold)
        }
        return
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column {
            if (size == "large" && ad.image.isNotBlank()) {
                Box {
                    AsyncImage(
                        model = ad.image, contentDescription = ad.name, contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxWidth().aspectRatio(1200f / 630f).clickable { SponsorInfoState.show(ad) }
                    )
                    Row(Modifier.align(Alignment.TopEnd).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        SponsorLabel(label)
                        Text("✕", color = Color.White, fontSize = 13.sp, modifier = Modifier.padding(start = 8.dp).clickable { onHide() })
                    }
                }
            }
            Column(Modifier.padding(horizontal = 12.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                if (size != "large" || ad.image.isBlank()) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        val logo = ad.logo.ifBlank { ad.image }
                        if (logo.isNotBlank()) AsyncImage(model = logo, contentDescription = null, contentScale = ContentScale.Fit, /* 2026-11-14: whole logo */ modifier = Modifier.size(48.dp).clip(RoundedCornerShape(10.dp)).clickable { SponsorInfoState.show(ad) })
                        Column(Modifier.weight(1f)) {
                            Text(ad.name, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            if (category.isNotBlank()) Text(category, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                        }
                        SponsorLabel(label)
                        Text("✕", fontSize = 13.sp, modifier = Modifier.clickable { onHide() })
                    }
                } else {
                    Text(ad.name, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
                }
                if (headline.isNotBlank() && size != "large") Text(headline, fontSize = 12.5.sp, maxLines = 2, overflow = TextOverflow.Ellipsis, color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (coupon.isNotBlank()) {
                    Text(
                        coupon, fontSize = 12.sp, fontWeight = FontWeight.Bold,
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(SponsorGold.copy(alpha = 0.18f)).padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
                Row(Modifier.fillMaxWidth().padding(top = 2.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (tel.isNotBlank()) SponsorButton("📞 " + pick(language, "Anrufen", "Ara", "Call"), false, Modifier.weight(1f)) { open(tel) }
                    if (wa.isNotBlank()) SponsorButton("💬 WhatsApp", false, Modifier.weight(1f)) { open(wa) }
                    if (web.isNotBlank()) SponsorButton("$cta →", true, Modifier.weight(1f)) { open(web) }
                }
            }
        }
    }
}

@Composable
private fun SponsorLabel(text: String) {
    Text(
        text, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF222222),
        modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(SponsorGold).padding(horizontal = 6.dp, vertical = 1.dp)
    )
}

@Composable
private fun SponsorButton(text: String, main: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Box(
        modifier = modifier.clip(RoundedCornerShape(10.dp))
            .background(if (main) BerlinRed else if (text.contains("WhatsApp")) com.example.ui.theme.WhatsAppGreen else MaterialTheme.colorScheme.surfaceVariant) // 2026-11-14: WhatsApp green
            .clickable { onClick() }.padding(vertical = 7.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(text, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (main || text.contains("WhatsApp")) Color.White else MaterialTheme.colorScheme.onSurface, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}
