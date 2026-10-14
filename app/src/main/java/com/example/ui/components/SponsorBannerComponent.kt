package com.example.ui.components

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AppLanguage
import com.example.data.model.SponsorBanner
import com.example.data.repository.SampleData
import com.example.ui.theme.BerlinGreen
import com.example.ui.theme.BerlinRed
import com.example.ui.theme.BerlinYellow
import kotlinx.coroutines.delay

@Composable
fun SponsorBannerComponent(
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val sponsors = SampleData.sponsors
    if (sponsors.isEmpty()) return

    // 1. GÖREV: 5 Saniyede bir akıcı değişim (Auto carousel every 5 seconds)
    var currentIndex by remember { mutableIntStateOf(0) }

    LaunchedEffect(sponsors.size) {
        while (true) {
            delay(5000L) // 5 saniye
            currentIndex = (currentIndex + 1) % sponsors.size
        }
    }

    val currentSponsor = sponsors[currentIndex]

    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 2.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = when (language) {
                        AppLanguage.TURKISH -> "Sponsorlar & Partnerler"
                        AppLanguage.ENGLISH -> "Sponsors & Partners"
                        else -> "Partner & Kiez-Förderer"
                    },
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = BerlinYellow
                ) {
                    Text(
                        text = "Anzeige",
                        fontSize = 8.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                    )
                }
            }

            // Dot indicators + Carousel controls
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                sponsors.indices.forEach { index ->
                    Box(
                        modifier = Modifier
                            .size(if (index == currentIndex) 7.dp else 5.dp)
                            .clip(CircleShape)
                            .background(
                                if (index == currentIndex) BerlinRed
                                else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                            )
                            .clickable { currentIndex = index }
                    )
                }
                Spacer(modifier = Modifier.width(4.dp))
                IconButton(
                    onClick = { currentIndex = (currentIndex - 1 + sponsors.size) % sponsors.size },
                    modifier = Modifier.size(20.dp)
                ) {
                    Icon(imageVector = Icons.Default.ChevronLeft, contentDescription = "Prev", modifier = Modifier.size(16.dp))
                }
                IconButton(
                    onClick = { currentIndex = (currentIndex + 1) % sponsors.size },
                    modifier = Modifier.size(20.dp)
                ) {
                    Icon(imageVector = Icons.Default.ChevronRight, contentDescription = "Next", modifier = Modifier.size(16.dp))
                }
            }
        }

        // 1. GÖREV: BÜYÜTÜLMÜŞ SPONSOR RESMİ (GÖZE ÇARPACAK ŞEKİLDE NET) + UFALTILMIŞ İNCE METİN PENCERESİ + BUTONLAR
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 2.dp)
        ) {
            AnimatedContent(
                targetState = currentSponsor,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "SponsorBannerAnimation"
            ) { sponsor ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { openSponsorAction(context, sponsor) },
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column {
                        // 1. Resim Alanı BÜYÜTÜLDÜ (135dp yükseklik), direkt göze çarpacak şekilde net
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(135.dp)
                                .background(Color(0xFFF8FAFC))
                                .clip(RoundedCornerShape(topStart = 14.dp, topEnd = 14.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Image(
                                painter = painterResource(id = sponsor.drawableRes),
                                contentDescription = sponsor.name,
                                contentScale = ContentScale.Fit,
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }

                        // 2. Metinler Penceresi: Ufaltılmış ve ince tasarım
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 10.dp, vertical = 5.dp),
                            verticalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = sponsor.name,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 1,
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = "5s ⏱",
                                    fontSize = 8.5.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            Text(
                                text = when (language) {
                                    AppLanguage.TURKISH -> sponsor.headlineTr
                                    AppLanguage.ENGLISH -> sponsor.headlineEn
                                    else -> sponsor.headlineDe
                                },
                                fontSize = 10.5.sp,
                                lineHeight = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 1
                            )

                            // Alt Butonlar: Keşfet/Aksiyon Butonu + Paylaş Butonu
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 2.dp),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Keşfet / CTA Butonu
                                Row(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (sponsor.linkWa.isNotEmpty()) BerlinGreen else BerlinRed)
                                        .clickable { openSponsorAction(context, sponsor) }
                                        .padding(horizontal = 8.dp, vertical = 5.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = when (language) {
                                            AppLanguage.TURKISH -> sponsor.ctaTr
                                            AppLanguage.ENGLISH -> sponsor.ctaEn
                                            else -> sponsor.ctaDe
                                        },
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Icon(
                                        imageVector = if (sponsor.linkTel.isNotEmpty()) Icons.Default.Phone else Icons.AutoMirrored.Filled.ArrowForward,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(11.dp)
                                    )
                                }

                                // Paylaş Butonu
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    modifier = Modifier
                                        .clickable {
                                            val shareLink = if (sponsor.linkWeb.isNotBlank()) sponsor.linkWeb else "https://mykiezberlin.com"
                                            val apkDownloadUrl = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk"
                                            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                                type = "text/plain"
                                                putExtra(
                                                    Intent.EXTRA_TEXT,
                                                    "${sponsor.name}\n${sponsor.headlineDe}\n\n👉 $shareLink\n\n📲 My Kiez Berlin uygulamasını indir:\n$apkDownloadUrl"
                                                )
                                            }
                                            context.startActivity(Intent.createChooser(shareIntent, "Sponsor paylaş"))
                                        }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(3.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Share,
                                            contentDescription = "Paylaş",
                                            tint = MaterialTheme.colorScheme.onSurface,
                                            modifier = Modifier.size(12.dp)
                                        )
                                        Text(
                                            text = if (language == AppLanguage.TURKISH) "Paylaş" else "Teilen",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun openSponsorAction(context: android.content.Context, sponsor: SponsorBanner) {
    try {
        val uri = when {
            sponsor.linkWa.isNotEmpty() -> Uri.parse(sponsor.linkWa)
            sponsor.linkWeb.isNotEmpty() -> Uri.parse(sponsor.linkWeb)
            sponsor.linkTel.isNotEmpty() -> Uri.parse("tel:${sponsor.linkTel}")
            else -> Uri.parse("https://deindigitalerhelfer.com")
        }
        val intent = Intent(Intent.ACTION_VIEW, uri)
        context.startActivity(intent)
    } catch (_: Exception) {}
}
