package com.example.ui.components

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
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.AppLanguage
import com.example.data.repository.AdsRepository
import com.example.data.repository.ServerAd

/**
 * 2026-11-13: one sponsor card for the whole app, same look as the web (sponsor-sizes.js):
 *  Kiez Premium = big picture, red glowing frame
 *  Kiez Plus    = medium picture, green glowing frame
 *  Kiez Basic   = small picture (like a story tile), blue glowing frame
 * A small "Basic / Plus / Premium" badge sits bottom right ([SHOW_TIER_BADGE] = false hides it later).
 */
const val SHOW_TIER_BADGE = true

private val TierBlue = Color(0xFF1A73E8)
private val TierGreen = Color(0xFF2EA043)
private val TierRed = Color(0xFFE30613)
private val LabelGold = Color(0xFFF2B705)
private val RouteBlue = Color(0xFF1A73E8)

private data class Tier(val key: String, val label: String, val color: Color)

private fun tierOf(size: String) = when (size) {
    "large", "banner" -> Tier("l", "Premium", TierRed)
    "small" -> Tier("s", "Basic", TierBlue)
    else -> Tier("m", "Plus", TierGreen)
}

/** Premium first, then Plus, then Basic (same order as the web). */
fun tierRank(ad: ServerAd) = when (ad.size) { "large", "banner" -> 0; "small" -> 2; else -> 1 }

private fun pickText(language: AppLanguage, de: String, tr: String, en: String) = when (language) {
    AppLanguage.TURKISH -> tr.ifBlank { de }
    AppLanguage.ENGLISH -> en.ifBlank { de }
    else -> de
}

private fun hasPlace(address: String) =
    address.any { it.isDigit() } && !address.contains("Umgebung", true) && !address.contains("Ganz Berlin", true)

@Composable
fun SponsorTierCard(ad: ServerAd, language: AppLanguage, size: String = ad.size, onHide: (() -> Unit)? = null) {
    val context = LocalContext.current
    val tier = tierOf(size)
    fun open(link: String) {
        AdsRepository.trackClick(ad.id)
        try { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(link)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) } catch (_: Exception) {}
    }

    // Glowing frame: the light goes on and off slowly
    val glow by rememberInfiniteTransition(label = "sponsorGlow").animateFloat(
        initialValue = 0.25f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1300, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "glow"
    )
    val shape = RoundedCornerShape(16.dp)
    val headline = pickText(language, ad.headlineDe, ad.headlineTr, ad.headlineEn)
    val category = pickText(language, ad.categoryDe, ad.categoryTr, ad.categoryEn)
    val picture = ad.image.ifBlank { ad.logo }
    val logo = ad.logo.ifBlank { ad.image }
    val tel = if (ad.linkTel.isNotBlank()) "tel:" + ad.linkTel.filter { it.isDigit() || it == '+' } else ""
    val wa = if (ad.linkWa.isNotBlank()) "https://wa.me/" + ad.linkWa.filter { it.isDigit() } else ""
    val web = ad.linkWeb.ifBlank { ad.linkIg }
    val route = if (hasPlace(ad.address)) "https://www.google.com/maps/dir/?api=1&destination=" + Uri.encode(ad.name + ", " + ad.address) else ""
    val coupon = if (ad.couponCode.isNotBlank() && tier.key != "s") "🎟️ ${ad.couponCode} · " + pickText(language, ad.couponDe, ad.couponTr, ad.couponEn) else ""

    Box(
        Modifier.fillMaxWidth()
            .padding(vertical = 3.dp)
            .shadow((2 + 10 * glow).dp, shape, ambientColor = tier.color, spotColor = tier.color)
            .clip(shape)
            .background(MaterialTheme.colorScheme.surface)
            .border(2.dp, tier.color.copy(alpha = 0.45f + 0.55f * glow), shape)
            .clickable { SponsorInfoState.show(ad) }
    ) {
        Column {
            // Premium + Plus: picture on top (Premium bigger)
            if (tier.key != "s" && picture.isNotBlank()) {
                AsyncImage(
                    model = picture, contentDescription = ad.name, contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth()
                        .padding(if (tier.key == "m") PaddingValues(start = 10.dp, end = 10.dp, top = 10.dp) else PaddingValues(0.dp))
                        .clip(RoundedCornerShape(if (tier.key == "m") 12.dp else 0.dp))
                        .aspectRatio(1200f / 630f)
                )
            }
            Row(Modifier.padding(start = 12.dp, end = 12.dp, top = 10.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                // Basic: small picture left, like a story tile
                if (tier.key == "s" && picture.isNotBlank()) {
                    AsyncImage(
                        model = picture, contentDescription = ad.name, contentScale = ContentScale.Crop,
                        modifier = Modifier.width(118.dp).aspectRatio(1200f / 630f).clip(RoundedCornerShape(10.dp))
                    )
                }
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (tier.key != "s" && logo.isNotBlank()) {
                            AsyncImage(model = logo, contentDescription = null, contentScale = ContentScale.Crop,
                                modifier = Modifier.size(if (tier.key == "l") 44.dp else 38.dp).clip(RoundedCornerShape(10.dp)).background(Color.White))
                        }
                        Column(Modifier.weight(1f)) {
                            Text(ad.name, fontWeight = FontWeight.ExtraBold, fontSize = if (tier.key == "l") 16.sp else if (tier.key == "m") 15.sp else 14.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            if (category.isNotBlank()) Text(category, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        Text(
                            pickText(language, "Anzeige", "Reklam", "Ad"), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF222222),
                            modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(LabelGold).padding(horizontal = 6.dp, vertical = 1.dp)
                        )
                        if (onHide != null) Text("✕", fontSize = 13.sp, modifier = Modifier.clickable { onHide() }.padding(2.dp))
                    }
                    if (headline.isNotBlank()) Text(headline, fontSize = if (tier.key == "s") 12.sp else 13.sp, maxLines = if (tier.key == "s") 2 else 3, overflow = TextOverflow.Ellipsis)
                    if (ad.address.isNotBlank()) Text("📍 " + ad.address, fontSize = 11.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    if (ad.hours.isNotBlank()) Text("🕒 " + ad.hours, fontSize = 11.5.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            if (coupon.isNotBlank()) {
                Text(
                    coupon, fontSize = 12.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(start = 12.dp, end = 12.dp, top = 6.dp).fillMaxWidth().clip(RoundedCornerShape(8.dp))
                        .background(LabelGold.copy(alpha = 0.18f)).padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
            // Buttons with text (user example: Ara · Website · WhatsApp · Yol tarifi)
            val buttons = buildList {
                if (tel.isNotBlank()) add(Triple("📞 " + pickText(language, "Anrufen", "Ara", "Call"), false, tel))
                if (wa.isNotBlank()) add(Triple("💬 WhatsApp", false, wa))
                if (web.isNotBlank()) add(Triple("🌐 " + if (ad.linkWeb.isNotBlank()) pickText(language, "Webseite", "Web sitesi", "Website") else "Instagram", false, web))
                if (route.isNotBlank()) add(Triple("🗺️ " + pickText(language, "Route", "Yol tarifi", "Directions"), true, route))
            }
            if (buttons.isNotEmpty()) {
                Row(Modifier.fillMaxWidth().padding(start = 12.dp, end = 12.dp, top = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    buttons.forEach { (text, isRoute, link) ->
                        Box(
                            Modifier.weight(1f).clip(RoundedCornerShape(10.dp))
                                .background(if (isRoute) RouteBlue else MaterialTheme.colorScheme.surfaceVariant)
                                .clickable { open(link) }.padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(text, fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = if (isRoute) Color.White else MaterialTheme.colorScheme.onSurface,
                                maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
                        }
                    }
                }
            }
            Spacer(Modifier.height(if (SHOW_TIER_BADGE) 26.dp else 10.dp))
        }
        if (SHOW_TIER_BADGE) {
            Text(
                tier.label, fontSize = 10.5.sp, fontWeight = FontWeight.ExtraBold, color = Color.White,
                modifier = Modifier.align(Alignment.BottomEnd).padding(end = 10.dp, bottom = 6.dp)
                    .clip(RoundedCornerShape(50)).background(tier.color).padding(horizontal = 9.dp, vertical = 2.dp)
            )
        }
    }
}
