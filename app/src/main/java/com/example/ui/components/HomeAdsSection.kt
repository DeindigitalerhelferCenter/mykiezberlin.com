package com.example.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Check
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

private val AdYellow = Color(0xFFF0D722)
private val AdInk = Color(0xFF121212)

private data class AdPackage(
    val size: String,
    val nameDe: String, val nameTr: String,
    val price: Int,
    val tagDe: String, val tagTr: String,
    val points: List<Pair<String, String>>,
    val recommended: Boolean = false
)

// Same packages as mykiezberlin.com/werben (and Berliner Kiez-Check).
private val AD_PACKAGES = listOf(
    AdPackage("s", "Kiez Basic", "Kiez Basic", 29, "Sichtbar in deinem Kiez", "Mahallende görün", listOf(
        "Ganz oben in deinem Kiez und deiner Kategorie" to "Mahallende ve kategorinde en üstte",
        "Gelb markiert, als Anzeige gekennzeichnet" to "Sarı işaretli, reklam olarak etiketli",
        "Eigener Gutschein im Bereich „Gutscheine“" to "„Kuponlar“ bölümünde kendi kuponun")),
    AdPackage("m", "Kiez Plus", "Kiez Plus", 49, "Mehr Kunden aus ganz Berlin", "Tüm Berlin'den müşteri", listOf(
        "Alles aus Kiez Basic" to "Kiez Basic paketindeki her şey",
        "Zusätzlich oben in der Berlin-weiten Liste" to "Ek olarak tüm Berlin listesinde üstte"), recommended = true),
    AdPackage("l", "Kiez Premium", "Kiez Premium", 89, "Maximale Sichtbarkeit", "En yüksek görünürlük", listOf(
        "Alles aus Kiez Plus" to "Kiez Plus paketindeki her şey",
        "Zusätzlich als Sponsor-Karte auf der Startseite und im Listenfluss" to "Ek olarak ana sayfada ve liste arasında sponsor kartı"))
)

/** Sponsors (from the admin panel) and the S/M/L packages; replaces the business list on the home page. */
@Composable
fun HomeAdsSection(
    language: AppLanguage,
    onOpenWerben: (size: String) -> Unit
) {
    val tr = language == AppLanguage.TURKISH
    val en = language == AppLanguage.ENGLISH
    val homeAds by AdsRepository.homeAds.collectAsState()
    // 2026-11-13: like the web home page – every sponsor, sorted Premium → Plus → Basic
    val pageAds by AdsRepository.pageAds.collectAsState()
    val ads = remember(homeAds, pageAds) { (pageAds.ifEmpty { homeAds }).sortedWith(compareBy({ tierRank(it) }, { it.name.lowercase() })) }
    LaunchedEffect(Unit) { AdsRepository.refresh(); AdsRepository.refreshPageAds() }
    LaunchedEffect(ads) { AdsRepository.trackImpressions(ads.map { it.id }) }

    Column(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(if (tr) "Sponsorlar & Partnerler" else "Sponsoren & Partner", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp)
            OutlinedButton(onClick = { onOpenWerben("") }, shape = RoundedCornerShape(20.dp), contentPadding = PaddingValues(horizontal = 12.dp, vertical = 2.dp)) {
                Text(if (tr) "Reklam ver" else "Werben", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        if (ads.isEmpty()) {
            ExampleAdCard(
                title = if (tr) "📣 İşletmen burada" else "📣 Dein Betrieb hier",
                text = if (tr) "Ana sayfada sponsor kartı – Kiez Premium paketine dahil." else "Sponsor-Karte auf der Startseite – im Paket Kiez Premium enthalten.",
                label = if (tr) "Örnek" else "Beispiel",
                button = if (tr) "Şimdi reklam ver →" else "Jetzt werben →",
                onClick = { onOpenWerben("l") }
            )
            ExampleAdCard(
                title = if (tr) "📣 Mahallende reklamın" else "📣 Deine Anzeige im Kiez",
                text = if (tr) "Link, WhatsApp veya arama butonlu banner." else "Banner mit Link, WhatsApp- oder Anruf-Button.",
                label = if (tr) "Örnek" else "Beispiel",
                button = if (tr) "Şimdi reklam ver →" else "Jetzt werben →",
                onClick = { onOpenWerben("banner") }
            )
        } else {
            ads.forEach { ad -> SponsorTierCard(ad = ad, language = language) }
        }

        Text(if (tr) "İşletme paketleri" else "Pakete für Betriebe", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, modifier = Modifier.padding(top = 6.dp))
        AD_PACKAGES.forEach { pk -> PackageCard(pk, tr) { onOpenWerben(pk.size) } }

        Button(
            onClick = { onOpenWerben("") },
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
        ) {
            // Icon instead of the 📨 emoji (same as the web page)
            Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text(if (tr) "Şimdi reklam ver – talep gönder" else "Jetzt werben – Anfrage senden", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun AdLabel(text: String) {
    Text(
        text = text,
        fontSize = 10.5.sp,
        fontWeight = FontWeight.Bold,
        color = Color.Black,
        modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(AdYellow).padding(horizontal = 7.dp, vertical = 2.dp)
    )
}

@Composable
private fun ServerAdCard(ad: ServerAd, tr: Boolean, en: Boolean) {
    val context = LocalContext.current
    val headline = (if (tr) ad.headlineTr else if (en) ad.headlineEn else ad.headlineDe).ifBlank { ad.headlineDe }
    val cta = (if (tr) ad.ctaTr else if (en) ad.ctaEn else ad.ctaDe).ifBlank { ad.ctaDe }
    Card(
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier.fillMaxWidth().clickable {
            // Contact sheet instead of jumping to a website (2026-11-11)
            SponsorInfoState.show(ad)
        }
    ) {
        Column {
            if (ad.image.isNotBlank()) {
                Box {
                    AsyncImage(model = ad.image, contentDescription = ad.name, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxWidth().height(150.dp))
                    Box(modifier = Modifier.padding(8.dp)) { AdLabel("Anzeige") }
                }
            }
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                if (ad.image.isBlank()) AdLabel("Anzeige")
                Text(ad.name, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
                if (headline.isNotBlank()) Text(headline, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (cta.isNotBlank()) Text("$cta →", fontWeight = FontWeight.Bold, color = BerlinRed, fontSize = 13.sp)
            }
        }
    }
}

@Composable
private fun ExampleAdCard(title: String, text: String, label: String, button: String, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(BorderStroke(2.dp, BerlinRed.copy(alpha = 0.7f)), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        AdLabel(label)
        Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
        Text(text, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(button, fontWeight = FontWeight.Bold, color = BerlinRed, fontSize = 13.sp)
    }
}

@Composable
private fun PackageCard(pk: AdPackage, tr: Boolean, onClick: () -> Unit) {
    Box(modifier = Modifier.fillMaxWidth().padding(top = if (pk.recommended) 8.dp else 0.dp)) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .border(BorderStroke(if (pk.recommended) 3.dp else 2.dp, AdInk), RoundedCornerShape(16.dp))
                .background(MaterialTheme.colorScheme.surface)
                .clickable(onClick = onClick)
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(5.dp)
        ) {
            Text(if (tr) pk.nameTr else pk.nameDe, fontWeight = FontWeight.ExtraBold, fontSize = 19.sp)
            Text(if (tr) pk.tagTr else pk.tagDe, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(verticalAlignment = Alignment.Bottom) {
                Text("${pk.price} €", fontWeight = FontWeight.ExtraBold, fontSize = 30.sp, color = MaterialTheme.colorScheme.onSurface) // red only for actions
                Text(if (tr) "/ay" else "/Monat", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(start = 2.dp, bottom = 4.dp))
            }
            // Launch offer as plain text: yellow stays for "Empfohlen" only
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurface)
                Spacer(Modifier.width(6.dp))
                Text(if (tr) "Başlangıç: ilk 3 ay sadece 19 €/ay" else "Start: 3 Monate nur 19 €/Monat", fontSize = 13.5.sp, fontWeight = FontWeight.Bold)
            }
            pk.points.forEach { (de, t) ->
                Row(verticalAlignment = Alignment.Top) {
                    Icon(Icons.Default.Check, contentDescription = null, tint = Color(0xFF2E7D32), modifier = Modifier.size(18.dp).padding(top = 1.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(if (tr) t else de, fontSize = 13.5.sp)
                }
            }
            // Real button instead of a text link (same as the web page)
            Button(
                onClick = onClick,
                modifier = Modifier.fillMaxWidth().padding(top = 4.dp).heightIn(min = 44.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = BerlinRed)
            ) { Text(if (tr) "Paketi seç →" else "Paket wählen →", fontWeight = FontWeight.Bold) }
        }
        if (pk.recommended) {
            Text(
                if (tr) "Önerimiz" else "Empfohlen",
                fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, color = Color.Black,
                modifier = Modifier.align(Alignment.TopEnd).offset(x = (-12).dp, y = (-10).dp)
                    .clip(RoundedCornerShape(20.dp)).background(AdYellow).border(2.dp, AdInk, RoundedCornerShape(20.dp)).padding(horizontal = 10.dp, vertical = 1.dp)
            )
        }
    }
}
